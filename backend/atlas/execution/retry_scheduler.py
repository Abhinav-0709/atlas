import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from atlas.db.models import Event, Task, TaskAttempt, TaskRun
from atlas.db.models.enums import EventType, TaskStatus
from atlas.exceptions import TaskTimeoutError
from atlas.execution.retry_policy import RetryPolicyConfig, compute_backoff_delay, should_retry

logger = logging.getLogger("atlas.retry")


async def handle_task_failure(
    db: AsyncSession,
    task_run_id: uuid.UUID,
    workflow_run_id: uuid.UUID,
    attempt_number: int,
    task_key: str,
    exc: Exception,
    worker_id: uuid.UUID | None = None,
    retry_policy: dict[str, Any] | RetryPolicyConfig | None = None,
) -> TaskStatus:
    """Handles failure of a task attempt, managing retry scheduling or dead-lettering.

    If the task has retry attempts remaining according to its retry policy,
    it transitions to RETRYING with a computed backoff delay.
    Otherwise, it transitions to DEAD_LETTERED.
    """
    now = datetime.now(timezone.utc)
    is_timeout = isinstance(exc, TaskTimeoutError)
    attempt_status = (
        TaskStatus.TIMED_OUT.value if is_timeout else TaskStatus.FAILED.value
    )

    # 1. Resolve retry policy
    policy_config: RetryPolicyConfig
    if isinstance(retry_policy, RetryPolicyConfig):
        policy_config = retry_policy
    elif isinstance(retry_policy, dict):
        policy_config = RetryPolicyConfig.from_dict(retry_policy)
    else:
        # Load from Task definition in DB if available
        task_res = await db.execute(
            select(Task)
            .join(TaskRun, TaskRun.task_id == Task.id)
            .where(TaskRun.id == task_run_id)
        )
        task_row = task_res.scalar_one_or_none()
        if task_row and task_row.retry_policy:
            policy_config = RetryPolicyConfig.from_dict(task_row.retry_policy)
        else:
            policy_config = RetryPolicyConfig()

    # 2. Update the specific TaskAttempt record
    await db.execute(
        update(TaskAttempt)
        .where(
            TaskAttempt.task_run_id == task_run_id,
            TaskAttempt.attempt_number == attempt_number,
        )
        .values(
            status=attempt_status,
            error_type=type(exc).__name__,
            error_message=str(exc),
            completed_at=now,
        )
    )

    # 3. Log attempt failure event
    fail_event = Event(
        workflow_run_id=workflow_run_id,
        task_run_id=task_run_id,
        worker_id=worker_id,
        event_type=EventType.TASK_FAILED.value,
        payload={
            "task_key": task_key,
            "attempt": attempt_number,
            "error_type": type(exc).__name__,
            "error_message": str(exc),
        },
        created_at=now,
    )
    db.add(fail_event)

    # 4. Check if task can be retried
    can_retry = should_retry(attempt_number, policy_config.max_attempts)

    if can_retry:
        delay_seconds = compute_backoff_delay(policy_config, attempt=attempt_number)
        scheduled_retry_at = now + timedelta(seconds=delay_seconds)

        # Update TaskRun to RETRYING
        await db.execute(
            update(TaskRun)
            .where(TaskRun.id == task_run_id)
            .values(
                status=TaskStatus.RETRYING.value,
                error_message=str(exc),
                scheduled_retry_at=scheduled_retry_at,
                worker_id=None,
                lease_expires_at=None,
            )
        )

        # Log TASK_RETRY_SCHEDULED event
        retry_event = Event(
            workflow_run_id=workflow_run_id,
            task_run_id=task_run_id,
            worker_id=worker_id,
            event_type=EventType.TASK_RETRY_SCHEDULED.value,
            payload={
                "task_key": task_key,
                "attempt": attempt_number,
                "max_attempts": policy_config.max_attempts,
                "delay_seconds": delay_seconds,
                "scheduled_retry_at": scheduled_retry_at.isoformat(),
                "error": str(exc),
            },
            created_at=now,
        )
        db.add(retry_event)
        logger.info(
            f"Task {task_key} attempt {attempt_number} failed. "
            f"Retrying in {delay_seconds:.2f}s (scheduled for {scheduled_retry_at.isoformat()})."
        )
        return TaskStatus.RETRYING

    else:
        # Attempts exhausted -> DEAD_LETTERED
        await db.execute(
            update(TaskRun)
            .where(TaskRun.id == task_run_id)
            .values(
                status=TaskStatus.DEAD_LETTERED.value,
                error_message=str(exc),
                scheduled_retry_at=None,
                lease_expires_at=None,
                completed_at=now,
            )
        )

        # Log TASK_DEAD_LETTERED event
        dlq_event = Event(
            workflow_run_id=workflow_run_id,
            task_run_id=task_run_id,
            worker_id=worker_id,
            event_type=EventType.TASK_DEAD_LETTERED.value,
            payload={
                "task_key": task_key,
                "attempt": attempt_number,
                "max_attempts": policy_config.max_attempts,
                "error": str(exc),
            },
            created_at=now,
        )
        db.add(dlq_event)
        logger.warning(
            f"Task {task_key} exhausted all {policy_config.max_attempts} attempts. Moved to DEAD_LETTERED."
        )
        return TaskStatus.DEAD_LETTERED
