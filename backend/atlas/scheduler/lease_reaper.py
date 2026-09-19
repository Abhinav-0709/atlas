import asyncio
from datetime import datetime, timezone
from sqlalchemy import select
from atlas.config import settings
from atlas.db.session import get_db_context
from atlas.db.models import TaskRun
from atlas.db.models.enums import TaskStatus
from atlas.execution.state_machine import transition_task
from atlas.observability.metrics import record_expired_lease


async def find_expired_leases():
    async with get_db_context() as db:
        now = datetime.now(timezone.utc)
        result = await db.execute(
            select(TaskRun).where(
                TaskRun.status == TaskStatus.RUNNING.value,
                TaskRun.lease_expires_at < now,
            )
        )
        expired_tasks = result.scalars().all()

        for task_run in expired_tasks:
            task_run.status = transition_task(TaskStatus.RUNNING, TaskStatus.READY).value
            task_run.worker_id = None
            task_run.lease_expires_at = None
            task_run.updated_at = datetime.now(timezone.utc)
            record_expired_lease()
        
        if expired_tasks:
            await db.commit()


async def lease_reaper_loop():
    while True:
        try:
            await find_expired_leases()
        except Exception:
            pass
        await asyncio.sleep(settings.LEASE_REAPER_INTERVAL_SECONDS)
