import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from atlas.db.models.enums import TaskStatus, WorkerStatus
from atlas.worker.claimer import claim_task
from atlas.worker.heartbeat import HeartbeatManager
from atlas.worker.worker import AtlasWorker
from atlas.workflow.dag import TaskDefinition


def test_worker_initialization():
    worker = AtlasWorker(worker_name="custom-worker-1")
    assert worker.worker_name == "custom-worker-1"
    assert worker.worker_id is None
    assert worker._shutdown is False

    auto_worker = AtlasWorker()
    assert auto_worker.worker_name.startswith("worker-")


def test_worker_stop():
    worker = AtlasWorker()
    assert worker._shutdown is False
    worker.stop()
    assert worker._shutdown is True


@pytest.mark.asyncio
async def test_heartbeat_manager_context():
    worker_id = uuid.uuid4()
    task_run_id = uuid.uuid4()

    manager = HeartbeatManager(
        worker_id=worker_id,
        task_run_id=task_run_id,
        lease_duration_seconds=30,
        heartbeat_interval_seconds=1,
    )

    with patch.object(manager, "renew_lease", new_callable=AsyncMock) as mock_renew:
        mock_renew.return_value = True
        async with manager:
            assert manager._task is not None
            assert not manager._task.done()
            await asyncio.sleep(0.05)

        assert manager._task.done() or manager._task.cancelled()


@pytest.mark.asyncio
async def test_claim_task_success():
    mock_db = AsyncMock()
    mock_db.add = MagicMock()
    mock_row = MagicMock()
    mock_row.id = uuid.uuid4()
    mock_row.current_attempt = 1
    mock_row.workflow_run_id = uuid.uuid4()
    mock_row.task_id = uuid.uuid4()
    mock_row.task_key = "step_1"

    mock_execute_result = MagicMock()
    mock_execute_result.first.return_value = mock_row
    mock_db.execute.return_value = mock_execute_result

    worker_id = uuid.uuid4()
    task_run_id = mock_row.id

    claimed, attempt_number = await claim_task(
        db=mock_db,
        task_run_id=task_run_id,
        worker_id=worker_id,
        lease_duration_seconds=30,
    )

    assert claimed is True
    assert attempt_number == 1
    assert mock_db.add.call_count == 2  # TaskAttempt + Event
    assert mock_db.commit.call_count == 1


@pytest.mark.asyncio
async def test_claim_task_already_claimed():
    """Simulates when another worker has already claimed the task."""
    mock_db = AsyncMock()
    mock_db.add = MagicMock()
    mock_execute_result = MagicMock()
    mock_execute_result.first.return_value = None  # No rows matched WHERE status='READY'
    mock_db.execute.return_value = mock_execute_result

    worker_id = uuid.uuid4()
    task_run_id = uuid.uuid4()

    claimed, attempt_number = await claim_task(
        db=mock_db,
        task_run_id=task_run_id,
        worker_id=worker_id,
    )

    assert claimed is False
    assert attempt_number is None
    assert mock_db.commit.call_count == 0


@pytest.mark.asyncio
async def test_concurrent_claim_race_condition():
    """Simulates two workers racing to claim the same task run ID.
    The first worker succeeds; the second worker gets 0 updated rows and fails safely.
    """
    task_run_id = uuid.uuid4()
    worker_1 = uuid.uuid4()
    worker_2 = uuid.uuid4()

    # State tracking simulation
    task_status = "READY"

    async def execute_claim(stmt):
        nonlocal task_status
        result = MagicMock()
        if task_status == "READY":
            task_status = "RUNNING"
            row = MagicMock()
            row.id = task_run_id
            row.current_attempt = 1
            row.workflow_run_id = uuid.uuid4()
            row.task_id = uuid.uuid4()
            row.task_key = "concurrent_task"
            result.first.return_value = row
        else:
            result.first.return_value = None
        return result

    mock_db1 = AsyncMock()
    mock_db1.add = MagicMock()
    mock_db1.execute.side_effect = execute_claim

    mock_db2 = AsyncMock()
    mock_db2.add = MagicMock()
    mock_db2.execute.side_effect = execute_claim

    # Worker 1 claims
    claimed_1, attempt_1 = await claim_task(mock_db1, task_run_id, worker_1)
    # Worker 2 attempts same claim
    claimed_2, attempt_2 = await claim_task(mock_db2, task_run_id, worker_2)

    assert claimed_1 is True
    assert attempt_1 == 1
    assert claimed_2 is False
    assert attempt_2 is None


@pytest.mark.asyncio
async def test_process_task_success():
    worker = AtlasWorker(worker_name="test-worker")
    worker.worker_id = uuid.uuid4()

    task_payload = {
        "workflow_run_id": str(uuid.uuid4()),
        "task_run_id": str(uuid.uuid4()),
        "task_key": "delay_test",
        "configuration": {"seconds": 0.01},
        "task_type": "DELAY",
        "timeout_seconds": 10,
    }

    dummy_task_def = TaskDefinition(
        key="delay_test",
        name="Delay Test",
        configuration={"seconds": 0.01},
    )

    with (
        patch("atlas.worker.worker.claim_task", new_callable=AsyncMock) as mock_claim,
        patch.object(worker, "_load_task_definition", new_callable=AsyncMock) as mock_load,
        patch("atlas.worker.worker.execute_task", new_callable=AsyncMock) as mock_exec,
        patch.object(worker, "_record_success", new_callable=AsyncMock) as mock_success,
    ):
        mock_claim.return_value = (True, 1)
        mock_load.return_value = dummy_task_def
        mock_exec.return_value = {"slept_seconds": 0.01}

        success = await worker.process_task(task_payload)

        assert success is True
        mock_claim.assert_called_once()
        mock_load.assert_called_once()
        mock_exec.assert_called_once()
        mock_success.assert_called_once()


@pytest.mark.asyncio
async def test_process_task_failure():
    worker = AtlasWorker(worker_name="test-worker")
    worker.worker_id = uuid.uuid4()

    task_payload = {
        "workflow_run_id": str(uuid.uuid4()),
        "task_run_id": str(uuid.uuid4()),
        "task_key": "failing_task",
        "configuration": {},
        "task_type": "PYTHON_FUNCTION",
        "timeout_seconds": 5,
    }

    dummy_task_def = TaskDefinition(
        key="failing_task",
        name="Failing Task",
        configuration={},
    )

    with (
        patch("atlas.worker.worker.claim_task", new_callable=AsyncMock) as mock_claim,
        patch.object(worker, "_load_task_definition", new_callable=AsyncMock) as mock_load,
        patch("atlas.worker.worker.execute_task", new_callable=AsyncMock) as mock_exec,
        patch.object(worker, "_record_failure", new_callable=AsyncMock) as mock_failure,
    ):
        mock_claim.return_value = (True, 1)
        mock_load.return_value = dummy_task_def
        mock_exec.side_effect = RuntimeError("Task exploded")

        success = await worker.process_task(task_payload)

        assert success is False
        mock_claim.assert_called_once()
        mock_load.assert_called_once()
        mock_exec.assert_called_once()
        mock_failure.assert_called_once()
