import asyncio
import logging
import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy import update
from atlas.config import settings
from atlas.db.models import TaskRun, Worker
from atlas.db.models.enums import TaskStatus
from atlas.db.session import get_db_context

logger = logging.getLogger("atlas.worker.heartbeat")


class HeartbeatManager:
    """Manages background heartbeats and lease extension for an active task."""

    def __init__(
        self,
        worker_id: uuid.UUID,
        task_run_id: uuid.UUID,
        lease_duration_seconds: int | None = None,
        heartbeat_interval_seconds: int | None = None,
    ) -> None:
        self.worker_id = worker_id
        self.task_run_id = task_run_id
        self.lease_duration_seconds = (
            lease_duration_seconds or settings.DEFAULT_LEASE_DURATION_SECONDS
        )
        self.heartbeat_interval_seconds = (
            heartbeat_interval_seconds or settings.HEARTBEAT_INTERVAL_SECONDS
        )
        self._task: asyncio.Task[None] | None = None

    async def __aenter__(self) -> "HeartbeatManager":
        self._task = asyncio.create_task(self._loop())
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass

    async def _loop(self) -> None:
        while True:
            await asyncio.sleep(self.heartbeat_interval_seconds)
            try:
                await self.renew_lease()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.warning(
                    f"Heartbeat renewal failed for task {self.task_run_id}: {e}"
                )

    async def renew_lease(self) -> bool:
        """Extends task lease and touches worker heartbeat timestamp."""
        now = datetime.now(timezone.utc)
        new_lease = now + timedelta(seconds=self.lease_duration_seconds)

        async with get_db_context() as db:
            # 1. Update worker liveness
            await db.execute(
                update(Worker)
                .where(Worker.id == self.worker_id)
                .values(last_heartbeat_at=now)
            )

            # 2. Extend task lease
            result = await db.execute(
                update(TaskRun)
                .where(
                    TaskRun.id == self.task_run_id,
                    TaskRun.worker_id == self.worker_id,
                    TaskRun.status == TaskStatus.RUNNING.value,
                )
                .values(lease_expires_at=new_lease)
            )
            return (result.rowcount or 0) > 0
