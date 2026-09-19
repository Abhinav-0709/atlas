import asyncio
import uuid
from datetime import datetime, timezone
from sqlalchemy import select
from atlas.config import settings
from atlas.db.session import get_db_context
from atlas.db.models import WorkflowRun, TaskRun, WorkflowVersion, Task
from atlas.db.models.enums import TaskStatus, WorkflowStatus
from atlas.queue.task_queue import enqueue_task
from atlas.workflow.dag import DAGDefinition
from atlas.workflow.engine import WorkflowEngine
from atlas.execution.state_machine import transition_task, transition_workflow


async def find_ready_tasks():
    async with get_db_context() as db:
        runs_result = await db.execute(
            select(WorkflowRun).where(WorkflowRun.status == WorkflowStatus.RUNNING.value)
        )
        runs = runs_result.scalars().all()

        for workflow_run in runs:
            version_result = await db.execute(
                select(WorkflowVersion).where(WorkflowVersion.id == workflow_run.workflow_version_id)
            )
            version = version_result.scalar_one_or_none()
            if not version:
                continue

            task_runs_result = await db.execute(
                select(TaskRun).where(TaskRun.workflow_run_id == workflow_run.id)
            )
            task_runs = task_runs_result.scalars().all()

            task_result = await db.execute(
                select(Task).where(Task.workflow_version_id == version.id)
            )
            tasks = task_result.scalars().all()

            task_configs = {t.task_key: t.configuration for t in tasks}
            task_timeouts = {t.task_key: t.timeout_seconds for t in tasks}

            states = {tr.task_key: TaskStatus(tr.status) for tr in task_runs}

            dag = DAGDefinition(**version.definition)
            engine = WorkflowEngine(dag)

            # Check if workflow reached a terminal state
            try:
                wf_status = engine.compute_workflow_status(states)
                if wf_status != WorkflowStatus.RUNNING:
                    workflow_run.status = transition_workflow(
                        WorkflowStatus(workflow_run.status), wf_status
                    ).value
                    workflow_run.completed_at = datetime.now(timezone.utc)
                    workflow_run.updated_at = datetime.now(timezone.utc)
                    await db.commit()
                    continue
            except Exception:
                pass

            try:
                ready_keys = engine.get_ready_tasks(states)
            except ValueError:
                continue

            for task_key in ready_keys:
                task_run = next(
                    (tr for tr in task_runs if tr.task_key == task_key),
                    None,
                )
                if not task_run:
                    continue

                if task_run.status != TaskStatus.PENDING.value:
                    continue

                task_run.status = transition_task(TaskStatus.PENDING, TaskStatus.READY).value
                task_run.updated_at = datetime.now(timezone.utc)
                await db.flush()

                await enqueue_task(
                    workflow_run_id=workflow_run.id,
                    task_run_id=task_run.id,
                    task_key=task_key,
                    configuration=task_configs.get(task_key, {}),
                    timeout_seconds=task_timeouts.get(task_key, 300),
                )
                await db.commit()


async def scheduler_loop():
    while True:
        try:
            await find_ready_tasks()
        except Exception:
            pass
        await asyncio.sleep(1)
