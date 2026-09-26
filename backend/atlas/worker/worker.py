import asyncio
import logging
import os
import socket
import uuid
from datetime import datetime, timezone
from typing import Any
from sqlalchemy import select, update
from atlas.db.models import Event, Task, TaskAttempt, TaskRun, Worker
from atlas.db.models.enums import EventType, TaskStatus, TaskType, WorkerStatus
from atlas.db.session import get_db_context
from atlas.exceptions import TaskTimeoutError
from atlas.execution.executor import execute_task
from atlas.execution.retry_scheduler import handle_task_failure
from atlas.observability.logging import TraceContext
from atlas.observability.metrics import record_task_result
from atlas.queue.task_queue import dequeue_task
from atlas.worker.claimer import claim_task
from atlas.worker.heartbeat import HeartbeatManager
from atlas.workflow.dag import TaskDefinition
from atlas.ml.telemetry import ExecutionRecord, telemetry_collector

logger = logging.getLogger("atlas.worker")


class AtlasWorker:
    """Distributed task execution worker with atomic claiming and lease management."""

    def __init__(self, worker_name: str | None = None) -> None:
        self.hostname = socket.gethostname()
        self.pid = os.getpid()
        self.worker_name = (
            worker_name or f"worker-{self.hostname}-{self.pid}-{uuid.uuid4().hex[:6]}"
        )
        self.worker_id: uuid.UUID | None = None
        self._shutdown: bool = False

    async def register(self) -> uuid.UUID:
        """Registers or activates this worker in the database."""
        now = datetime.now(timezone.utc)
        async with get_db_context() as db:
            result = await db.execute(
                select(Worker).where(Worker.worker_name == self.worker_name)
            )
            worker = result.scalar_one_or_none()

            if worker:
                worker.hostname = self.hostname
                worker.pid = self.pid
                worker.status = WorkerStatus.ACTIVE.value
                worker.last_heartbeat_at = now
                worker.updated_at = now
                self.worker_id = worker.id
            else:
                worker = Worker(
                    worker_name=self.worker_name,
                    hostname=self.hostname,
                    pid=self.pid,
                    status=WorkerStatus.ACTIVE.value,
                    registered_at=now,
                    last_heartbeat_at=now,
                )
                db.add(worker)
                await db.flush()
                self.worker_id = worker.id

        logger.info(f"Worker {self.worker_name} registered (ID: {self.worker_id})")
        return self.worker_id

    async def deregister(self) -> None:
        """Marks the worker as dead upon clean shutdown."""
        if not self.worker_id:
            return
        now = datetime.now(timezone.utc)
        try:
            async with get_db_context() as db:
                await db.execute(
                    update(Worker)
                    .where(Worker.id == self.worker_id)
                    .values(
                        status=WorkerStatus.DEAD.value,
                    )
                )
            logger.info(f"Worker {self.worker_name} deregistered")
        except Exception as e:
            logger.warning(f"Failed to cleanly deregister worker: {e}")

    async def process_task(self, payload: dict[str, Any]) -> bool:
        """Claims and executes a single task payload from the queue."""
        if not self.worker_id:
            await self.register()
        assert self.worker_id is not None

        task_run_id = uuid.UUID(payload["task_run_id"])
        workflow_run_id = uuid.UUID(payload["workflow_run_id"])
        task_key = payload["task_key"]

        # 1. Attempt atomic claim in database
        async with get_db_context() as db:
            claimed, attempt_number = await claim_task(
                db, task_run_id, self.worker_id
            )

        if not claimed or attempt_number is None:
            logger.info(
                f"Task {task_key} (ID: {task_run_id}) could not be claimed (already taken or not READY)"
            )
            return False

        logger.info(
            f"Claimed task {task_key} (Attempt {attempt_number}) on worker {self.worker_name}"
        )

        task_def = await self._load_task_definition(task_run_id, payload)

        # 3. Execute task under heartbeat supervision with trace context
        start_time = asyncio.get_event_loop().time()
        with TraceContext(
            workflow_run_id=str(workflow_run_id),
            task_run_id=str(task_run_id),
            worker_id=str(self.worker_id),
        ):
            try:
                async with HeartbeatManager(self.worker_id, task_run_id):
                    result = await execute_task(task_def)

                duration = asyncio.get_event_loop().time() - start_time
                record_task_result(
                    task_type=task_def.type.value,
                    status=TaskStatus.SUCCESS.value,
                    duration_seconds=duration,
                )

                await self._record_success(
                    task_run_id=task_run_id,
                    workflow_run_id=workflow_run_id,
                    attempt_number=attempt_number,
                    task_key=task_key,
                    result=result,
                )
                try:
                    telemetry_collector.record(
                        ExecutionRecord(
                            job_id=str(task_run_id),
                            task_key=task_key,
                            job_type=str(task_def.type.value if hasattr(task_def.type, "value") else task_def.type),
                            input_size_bytes=len(str(payload.get("configuration", {}))),
                            worker_id=str(self.worker_id),
                            worker_cpu_pct=25.0,
                            worker_mem_pct=30.0,
                            queue_depth=0,
                            retry_count=(attempt_number - 1) if attempt_number else 0,
                            execution_time_seconds=duration,
                            is_success=True,
                        )
                    )
                except Exception:
                    pass

                logger.info(f"Task {task_key} finished successfully in {duration:.3f}s")
                return True

            except Exception as exc:
                duration = asyncio.get_event_loop().time() - start_time
                record_task_result(
                    task_type=task_def.type.value,
                    status=TaskStatus.FAILED.value,
                    duration_seconds=duration,
                    error_type=type(exc).__name__,
                )
                logger.exception(f"Task {task_key} failed with error: {exc}")
                await self._record_failure(
                    task_run_id=task_run_id,
                    workflow_run_id=workflow_run_id,
                    attempt_number=attempt_number,
                    task_key=task_key,
                    exc=exc,
                )
                try:
                    telemetry_collector.record(
                        ExecutionRecord(
                            job_id=str(task_run_id),
                            task_key=task_key,
                            job_type=str(task_def.type.value if hasattr(task_def.type, "value") else task_def.type),
                            input_size_bytes=len(str(payload.get("configuration", {}))),
                            worker_id=str(self.worker_id),
                            worker_cpu_pct=25.0,
                            worker_mem_pct=30.0,
                            queue_depth=0,
                            retry_count=(attempt_number - 1) if attempt_number else 0,
                            execution_time_seconds=duration,
                            is_success=False,
                            error_message=str(exc),
                        )
                    )
                except Exception:
                    pass
                return False

    async def _load_task_definition(
        self, task_run_id: uuid.UUID, payload: dict[str, Any]
    ) -> TaskDefinition:
        """Retrieves or builds the TaskDefinition for execution."""
        async with get_db_context() as db:
            result = await db.execute(
                select(Task)
                .join(TaskRun, TaskRun.task_id == Task.id)
                .where(TaskRun.id == task_run_id)
            )
            task = result.scalar_one_or_none()

            if task:
                return TaskDefinition(
                    key=task.task_key,
                    name=task.name,
                    type=TaskType(task.task_type),
                    dependencies=task.dependencies,
                    configuration=task.configuration,
                    timeout_seconds=task.timeout_seconds,
                )

        # Fallback to payload configuration if task definition not directly queryable
        return TaskDefinition(
            key=payload["task_key"],
            name=payload.get("name", payload["task_key"]),
            type=TaskType(payload.get("task_type", TaskType.PYTHON_FUNCTION.value)),
            dependencies=payload.get("dependencies", []),
            configuration=payload.get("configuration", {}),
            timeout_seconds=payload.get("timeout_seconds", 300),
        )

    async def _record_success(
        self,
        task_run_id: uuid.UUID,
        workflow_run_id: uuid.UUID,
        attempt_number: int,
        task_key: str,
        result: dict[str, Any],
    ) -> None:
        now = datetime.now(timezone.utc)
        async with get_db_context() as db:
            # 1. Update TaskRun
            await db.execute(
                update(TaskRun)
                .where(TaskRun.id == task_run_id)
                .values(
                    status=TaskStatus.SUCCESS.value,
                    output_data=result,
                    lease_expires_at=None,
                    completed_at=now,
                )
            )

            # 2. Update TaskAttempt
            await db.execute(
                update(TaskAttempt)
                .where(
                    TaskAttempt.task_run_id == task_run_id,
                    TaskAttempt.attempt_number == attempt_number,
                )
                .values(
                    status=TaskStatus.SUCCESS.value,
                    completed_at=now,
                )
            )

            # 3. Create Event
            event = Event(
                workflow_run_id=workflow_run_id,
                task_run_id=task_run_id,
                worker_id=self.worker_id,
                event_type=EventType.TASK_COMPLETED.value,
                payload={"task_key": task_key, "result": result},
                created_at=now,
            )
            db.add(event)

    async def _record_failure(
        self,
        task_run_id: uuid.UUID,
        workflow_run_id: uuid.UUID,
        attempt_number: int,
        task_key: str,
        exc: Exception,
    ) -> None:
        async with get_db_context() as db:
            await handle_task_failure(
                db=db,
                task_run_id=task_run_id,
                workflow_run_id=workflow_run_id,
                attempt_number=attempt_number,
                task_key=task_key,
                exc=exc,
                worker_id=self.worker_id,
            )

    async def run(self) -> None:
        """Main polling and execution loop."""
        await self.register()
        logger.info(f"Worker {self.worker_name} running. Listening for tasks...")

        try:
            while not self._shutdown:
                try:
                    payload = await dequeue_task(block=True, timeout=2)
                    if payload:
                        await self.process_task(payload)
                except asyncio.CancelledError:
                    break
                except Exception as e:
                    logger.error(f"Error in worker processing loop: {e}", exc_info=True)
                    await asyncio.sleep(1)
        finally:
            await self.deregister()

    def stop(self) -> None:
        """Signals the worker to stop processing new tasks."""
        logger.info(f"Worker {self.worker_name} received shutdown signal.")
        self._shutdown = True
