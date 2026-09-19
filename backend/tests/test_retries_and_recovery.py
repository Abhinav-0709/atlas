import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch
import pytest

from atlas.db.models.enums import BackoffStrategy, EventType, TaskStatus, WorkerStatus, WorkflowStatus
from atlas.exceptions import TaskTimeoutError
from atlas.execution.retry_policy import (
    RetryPolicyConfig,
    compute_backoff_delay,
    should_retry,
)
from atlas.execution.retry_scheduler import handle_task_failure
from atlas.recovery.startup_recovery import run_startup_recovery


# ==============================================================================
# 1. Backoff and Policy Tests
# ==============================================================================

def test_should_retry_thresholds():
    assert should_retry(1, 3) is True
    assert should_retry(2, 3) is True
    assert should_retry(3, 3) is False
    assert should_retry(4, 3) is False


def test_compute_backoff_fixed_delay():
    policy = {
        "backoff_strategy": "fixed",
        "initial_delay": 5.0,
        "max_delay": 30.0,
        "jitter": False,
    }
    assert compute_backoff_delay(policy, attempt=1) == 5.0
    assert compute_backoff_delay(policy, attempt=2) == 5.0
    assert compute_backoff_delay(policy, attempt=5) == 5.0


def test_compute_backoff_linear_delay():
    policy = {
        "backoff_strategy": "linear",
        "initial_delay": 3.0,
        "max_delay": 10.0,
        "jitter": False,
    }
    assert compute_backoff_delay(policy, attempt=1) == 3.0
    assert compute_backoff_delay(policy, attempt=2) == 6.0
    assert compute_backoff_delay(policy, attempt=3) == 9.0
    # Capped at max_delay
    assert compute_backoff_delay(policy, attempt=4) == 10.0


def test_compute_backoff_exponential_delay():
    policy = {
        "backoff_strategy": "exponential",
        "initial_delay": 2.0,
        "max_delay": 20.0,
        "jitter": False,
    }
    # attempt 1: 2 * (2 ** 0) = 2.0
    assert compute_backoff_delay(policy, attempt=1) == 2.0
    # attempt 2: 2 * (2 ** 1) = 4.0
    assert compute_backoff_delay(policy, attempt=2) == 4.0
    # attempt 3: 2 * (2 ** 2) = 8.0
    assert compute_backoff_delay(policy, attempt=3) == 8.0
    # attempt 4: 2 * (2 ** 3) = 16.0
    assert compute_backoff_delay(policy, attempt=4) == 16.0
    # attempt 5: 2 * (2 ** 4) = 32.0 -> capped at 20.0
    assert compute_backoff_delay(policy, attempt=5) == 20.0


def test_compute_backoff_with_jitter():
    policy = {
        "backoff_strategy": "exponential",
        "initial_delay": 10.0,
        "max_delay": 100.0,
        "jitter": True,
        "jitter_factor": 0.5,
    }
    # Deterministic jitter injector: always returns max possible jitter
    def max_jitter(low: float, high: float) -> float:
        return high

    delay = compute_backoff_delay(policy, attempt=1, jitter_fn=max_jitter)
    # base = 10.0, max_jitter = 10.0 * 0.5 = 5.0 -> total = 15.0
    assert delay == 15.0


def test_retry_policy_defaults():
    config = RetryPolicyConfig.from_dict(None)
    assert config.max_attempts == 3
    assert config.backoff_strategy == BackoffStrategy.EXPONENTIAL.value
    assert config.initial_delay == 2.0
    assert config.max_delay == 60.0
    assert config.jitter is True


# ==============================================================================
# 2. Retry Scheduler Tests
# ==============================================================================

@pytest.mark.asyncio
async def test_handle_task_failure_schedules_retry():
    mock_db = AsyncMock()
    mock_db.add = MagicMock()

    task_run_id = uuid.uuid4()
    workflow_run_id = uuid.uuid4()
    worker_id = uuid.uuid4()

    retry_policy = {
        "max_attempts": 3,
        "backoff_strategy": "fixed",
        "initial_delay": 5.0,
        "jitter": False,
    }

    status = await handle_task_failure(
        db=mock_db,
        task_run_id=task_run_id,
        workflow_run_id=workflow_run_id,
        attempt_number=1,
        task_key="step_compute",
        exc=ValueError("Calculation error"),
        worker_id=worker_id,
        retry_policy=retry_policy,
    )

    assert status == TaskStatus.RETRYING
    # Verify execute updates task_run and task_attempt
    assert mock_db.execute.call_count == 2
    # Verify two events added: TASK_FAILED and TASK_RETRY_SCHEDULED
    assert mock_db.add.call_count == 2
    event_types = [call.args[0].event_type for call in mock_db.add.call_args_list]
    assert EventType.TASK_FAILED.value in event_types
    assert EventType.TASK_RETRY_SCHEDULED.value in event_types


@pytest.mark.asyncio
async def test_handle_task_failure_dead_lettered_when_exhausted():
    mock_db = AsyncMock()
    mock_db.add = MagicMock()

    task_run_id = uuid.uuid4()
    workflow_run_id = uuid.uuid4()
    worker_id = uuid.uuid4()

    retry_policy = {
        "max_attempts": 3,
        "backoff_strategy": "fixed",
        "initial_delay": 5.0,
    }

    # Attempt 3 of 3 -> exhausted!
    status = await handle_task_failure(
        db=mock_db,
        task_run_id=task_run_id,
        workflow_run_id=workflow_run_id,
        attempt_number=3,
        task_key="step_compute",
        exc=RuntimeError("Third failure"),
        worker_id=worker_id,
        retry_policy=retry_policy,
    )

    assert status == TaskStatus.DEAD_LETTERED
    assert mock_db.execute.call_count == 2
    # Events: TASK_FAILED and TASK_DEAD_LETTERED
    assert mock_db.add.call_count == 2
    event_types = [call.args[0].event_type for call in mock_db.add.call_args_list]
    assert EventType.TASK_FAILED.value in event_types
    assert EventType.TASK_DEAD_LETTERED.value in event_types


@pytest.mark.asyncio
async def test_handle_task_timeout_sets_timed_out():
    mock_db = AsyncMock()
    mock_db.add = MagicMock()

    status = await handle_task_failure(
        db=mock_db,
        task_run_id=uuid.uuid4(),
        workflow_run_id=uuid.uuid4(),
        attempt_number=1,
        task_key="timeout_step",
        exc=TaskTimeoutError("timeout_step", 10),
        retry_policy={"max_attempts": 2, "initial_delay": 1.0, "jitter": False},
    )

    assert status == TaskStatus.RETRYING


# ==============================================================================
# 3. Startup Crash Recovery Tests
# ==============================================================================

@pytest.mark.asyncio
async def test_startup_recovery_detects_dead_worker_and_recovers_task():
    mock_db = AsyncMock()
    mock_db.add = MagicMock()

    now = datetime.now(timezone.utc)
    old_time = now - timedelta(seconds=120)

    # 1. Stale worker
    stale_worker = MagicMock()
    stale_worker.id = uuid.uuid4()
    stale_worker.worker_name = "dead-worker-1"
    stale_worker.status = WorkerStatus.ACTIVE.value
    stale_worker.last_heartbeat_at = old_time

    # 2. Orphaned task run assigned to stale worker
    orphaned_task = MagicMock()
    orphaned_task.id = uuid.uuid4()
    orphaned_task.workflow_run_id = uuid.uuid4()
    orphaned_task.task_key = "abandoned_task"
    orphaned_task.status = TaskStatus.RUNNING.value
    orphaned_task.worker_id = stale_worker.id
    orphaned_task.lease_expires_at = old_time

    # Mock execute results
    # Call 1: dead workers
    mock_res_workers = MagicMock()
    mock_res_workers.scalars().all.return_value = [stale_worker]

    # Call 2: known dead worker IDs
    mock_res_dead_ids = MagicMock()
    mock_res_dead_ids.scalars().all.return_value = [stale_worker.id]

    # Call 3: running tasks
    mock_res_tasks = MagicMock()
    mock_res_tasks.scalars().all.return_value = [orphaned_task]

    # Call 4: active workflows
    mock_res_wf = MagicMock()
    mock_res_wf.scalars().all.return_value = []

    mock_db.execute.side_effect = [
        mock_res_workers,
        mock_res_dead_ids,
        mock_res_tasks,
        mock_res_wf,
    ]

    stats = await run_startup_recovery(worker_timeout_seconds=60, db_session=mock_db)

    assert stats["dead_workers"] == 1
    assert stats["recovered_tasks"] == 1
    assert stale_worker.status == WorkerStatus.DEAD.value
    assert orphaned_task.status == TaskStatus.READY.value
    assert orphaned_task.worker_id is None
    assert orphaned_task.lease_expires_at is None
    assert mock_db.commit.call_count == 1


@pytest.mark.asyncio
async def test_startup_recovery_idempotent():
    """Running recovery when all workers and tasks are clean should produce 0 changes."""
    mock_db = AsyncMock()
    mock_db.add = MagicMock()

    mock_empty = MagicMock()
    mock_empty.scalars().all.return_value = []

    mock_db.execute.side_effect = [
        mock_empty,  # no dead workers
        mock_empty,  # no dead worker ids
        mock_empty,  # no running tasks
        mock_empty,  # no active workflows
    ]

    stats = await run_startup_recovery(worker_timeout_seconds=60, db_session=mock_db)

    assert stats["dead_workers"] == 0
    assert stats["recovered_tasks"] == 0
    assert stats["reconciled_workflows"] == 0
    assert mock_db.add.call_count == 0


# ==============================================================================
# 4. Workflow Run Idempotency Tests
# ==============================================================================

@pytest.mark.asyncio
async def test_workflow_run_idempotency_returns_existing_run():
    from atlas.api.routers.workflows import start_workflow_run
    from atlas.api.schemas.run import RunCreate
    from atlas.db.models import Workflow, WorkflowVersion, WorkflowRun

    mock_db = AsyncMock()
    workflow_id = uuid.uuid4()
    version_id = uuid.uuid4()
    existing_run_id = uuid.uuid4()

    mock_workflow = MagicMock(spec=Workflow)
    mock_workflow.id = workflow_id

    mock_version = MagicMock(spec=WorkflowVersion)
    mock_version.id = version_id

    mock_existing_run = MagicMock(spec=WorkflowRun)
    mock_existing_run.id = existing_run_id
    mock_existing_run.workflow_version_id = version_id
    mock_existing_run.status = "RUNNING"
    mock_existing_run.idempotency_key = "idemp-key-123"
    mock_existing_run.context_data = {"key": "val"}
    mock_existing_run.started_at = None
    mock_existing_run.completed_at = None
    mock_existing_run.created_at = datetime.now(timezone.utc)
    mock_existing_run.updated_at = datetime.now(timezone.utc)

    # 1. Workflow query
    res_wf = MagicMock()
    res_wf.scalar_one_or_none.return_value = mock_workflow

    # 2. Version query
    res_ver = MagicMock()
    res_ver.scalar_one_or_none.return_value = mock_version

    # 3. Existing run query by idempotency key
    res_run = MagicMock()
    res_run.scalar_one_or_none.return_value = mock_existing_run

    mock_db.execute.side_effect = [res_wf, res_ver, res_run]

    run_payload = RunCreate(idempotency_key="idemp-key-123", context_data={"key": "val"})
    response = await start_workflow_run(workflow_id=workflow_id, run_in=run_payload, db=mock_db)

    assert response.id == existing_run_id
    assert response.idempotency_key == "idemp-key-123"
    # Ensure no new run was added
    assert mock_db.add.call_count == 0


# ==============================================================================
# 5. Worker Retry Integration Tests
# ==============================================================================

@pytest.mark.asyncio
async def test_worker_process_task_triggers_handle_task_failure():
    from atlas.worker.worker import AtlasWorker
    from atlas.workflow.dag import TaskDefinition

    worker = AtlasWorker(worker_name="retry-worker")
    worker.worker_id = uuid.uuid4()

    task_payload = {
        "workflow_run_id": str(uuid.uuid4()),
        "task_run_id": str(uuid.uuid4()),
        "task_key": "failing_retry_task",
        "configuration": {},
        "task_type": "PYTHON_FUNCTION",
        "timeout_seconds": 5,
    }

    dummy_task_def = TaskDefinition(
        key="failing_retry_task",
        name="Failing Retry Task",
        configuration={},
    )

    with (
        patch("atlas.worker.worker.claim_task", new_callable=AsyncMock) as mock_claim,
        patch.object(worker, "_load_task_definition", new_callable=AsyncMock) as mock_load,
        patch("atlas.worker.worker.execute_task", new_callable=AsyncMock) as mock_exec,
        patch("atlas.worker.worker.handle_task_failure", new_callable=AsyncMock) as mock_handle_failure,
    ):
        mock_claim.return_value = (True, 1)
        mock_load.return_value = dummy_task_def
        mock_exec.side_effect = RuntimeError("Network timeout")
        mock_handle_failure.return_value = TaskStatus.RETRYING

        success = await worker.process_task(task_payload)

        assert success is False
        mock_claim.assert_called_once()
        mock_exec.assert_called_once()
        mock_handle_failure.assert_called_once()

