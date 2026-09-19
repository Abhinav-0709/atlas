import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession
from atlas.config import settings
from atlas.db.models import Event, TaskAttempt, TaskRun
from atlas.db.models.enums import EventType, TaskStatus


async def claim_task(
    db: AsyncSession,
    task_run_id: uuid.UUID,
    worker_id: uuid.UUID,
    lease_duration_seconds: int | None = None,
) -> tuple[bool, int | None]:
    """Atomically claims a task in READY status, sets it to RUNNING, and establishes a lease.

    Returns:
        (True, attempt_number) if successfully claimed.
        (False, None) if the task was already claimed or not in READY status.
    """
    if lease_duration_seconds is None:
        lease_duration_seconds = settings.DEFAULT_LEASE_DURATION_SECONDS

    now = datetime.now(timezone.utc)
    lease_expires = now + timedelta(seconds=lease_duration_seconds)

    stmt = (
        update(TaskRun)
        .where(
            TaskRun.id == task_run_id,
            TaskRun.status == TaskStatus.READY.value,
        )
        .values(
            status=TaskStatus.RUNNING.value,
            worker_id=worker_id,
            lease_expires_at=lease_expires,
            current_attempt=TaskRun.current_attempt + 1,
            started_at=now,
        )
        .returning(
            TaskRun.id,
            TaskRun.current_attempt,
            TaskRun.workflow_run_id,
            TaskRun.task_id,
            TaskRun.task_key,
        )
    )

    result = await db.execute(stmt)
    row = result.first()

    if not row:
        return False, None

    attempt_number = row.current_attempt

    # Create execution attempt record
    attempt = TaskAttempt(
        task_run_id=task_run_id,
        attempt_number=attempt_number,
        worker_id=worker_id,
        status=TaskStatus.RUNNING.value,
        started_at=now,
    )
    db.add(attempt)

    # Record event
    event = Event(
        workflow_run_id=row.workflow_run_id,
        task_run_id=task_run_id,
        worker_id=worker_id,
        event_type=EventType.TASK_CLAIMED.value,
        payload={
            "task_key": row.task_key,
            "attempt": attempt_number,
            "lease_expires_at": lease_expires.isoformat(),
        },
        created_at=now,
    )
    db.add(event)

    await db.commit()
    return True, attempt_number
