import logging
from datetime import datetime, timedelta, timezone
from typing import Any
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from atlas.db.models import Event, TaskRun, Worker, WorkflowRun
from atlas.db.models.enums import EventType, TaskStatus, WorkerStatus, WorkflowStatus
from atlas.db.session import get_db_context
from atlas.execution.state_machine import transition_task

logger = logging.getLogger("atlas.recovery")


async def run_startup_recovery(
    worker_timeout_seconds: int = 60,
    db_session: AsyncSession | None = None,
) -> dict[str, int]:
    """Scans and recovers dead workers, abandoned tasks, and active workflow runs on startup.

    This function is idempotent and safe to run on boot or periodically.

    Returns:
        A dict summary with counts of recovered entities.
    """
    stats = {
        "dead_workers": 0,
        "recovered_tasks": 0,
        "reconciled_workflows": 0,
    }

    async def _execute_recovery(db: AsyncSession) -> None:
        now = datetime.now(timezone.utc)
        worker_cutoff = now - timedelta(seconds=worker_timeout_seconds)

        # Step 1: Detect and mark dead workers
        dead_workers_stmt = select(Worker).where(
            Worker.status == WorkerStatus.ACTIVE.value,
            Worker.last_heartbeat_at < worker_cutoff,
        )
        dead_workers_res = await db.execute(dead_workers_stmt)
        dead_workers = dead_workers_res.scalars().all()

        dead_worker_ids = set()
        for worker in dead_workers:
            worker.status = WorkerStatus.DEAD.value
            dead_worker_ids.add(worker.id)
            stats["dead_workers"] += 1

            event = Event(
                worker_id=worker.id,
                event_type=EventType.WORKER_HEARTBEAT_TIMEOUT.value,
                payload={
                    "worker_name": worker.worker_name,
                    "last_heartbeat_at": worker.last_heartbeat_at.isoformat(),
                    "reason": "Marked dead during startup recovery scan",
                },
                created_at=now,
            )
            db.add(event)

        if dead_workers:
            logger.info(f"Startup recovery marked {len(dead_workers)} workers as DEAD")

        # Step 2: Identify and recover orphaned / abandoned running tasks
        # Running tasks whose lease has expired OR whose assigned worker is DEAD (or missing)
        all_dead_res = await db.execute(
            select(Worker.id).where(Worker.status == WorkerStatus.DEAD.value)
        )
        known_dead_ids = set(all_dead_res.scalars().all())

        running_tasks_stmt = select(TaskRun).where(
            TaskRun.status == TaskStatus.RUNNING.value
        )
        running_tasks_res = await db.execute(running_tasks_stmt)
        running_tasks = running_tasks_res.scalars().all()

        for task_run in running_tasks:
            lease_expired = (
                task_run.lease_expires_at is None
                or task_run.lease_expires_at < now
            )
            worker_is_dead = (
                task_run.worker_id is None
                or task_run.worker_id in known_dead_ids
            )

            if lease_expired or worker_is_dead:
                task_run.status = transition_task(TaskStatus.RUNNING, TaskStatus.READY).value
                old_worker_id = task_run.worker_id
                task_run.worker_id = None
                task_run.lease_expires_at = None
                stats["recovered_tasks"] += 1

                event = Event(
                    workflow_run_id=task_run.workflow_run_id,
                    task_run_id=task_run.id,
                    worker_id=old_worker_id,
                    event_type=EventType.TASK_LEASE_EXPIRED.value,
                    payload={
                        "task_key": task_run.task_key,
                        "reason": "Recovered orphaned task to READY during startup recovery",
                        "lease_expired": lease_expired,
                        "worker_dead": worker_is_dead,
                    },
                    created_at=now,
                )
                db.add(event)

        if stats["recovered_tasks"] > 0:
            logger.info(
                f"Startup recovery recovered {stats['recovered_tasks']} orphaned tasks to READY"
            )

        # Step 3: Check active workflow runs count
        active_wf_res = await db.execute(
            select(WorkflowRun).where(WorkflowRun.status == WorkflowStatus.RUNNING.value)
        )
        active_workflows = active_wf_res.scalars().all()
        stats["reconciled_workflows"] = len(active_workflows)

        await db.commit()

    if db_session:
        await _execute_recovery(db_session)
    else:
        async with get_db_context() as db:
            await _execute_recovery(db)

    return stats
