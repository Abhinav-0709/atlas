import pytest
from httpx import ASGITransport, AsyncClient
from atlas.main import app
from atlas.db.models import (
    Base,
    User,
    Workflow,
    WorkflowVersion,
    Task,
    Worker,
    WorkflowRun,
    TaskRun,
    TaskAttempt,
    Event,
    WorkflowStatus,
    TaskStatus,
    TaskType,
    WorkerStatus,
    EventType,
)


@pytest.mark.asyncio
async def test_root_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "Atlas"
    assert data["status"] == "online"


def test_models_metadata_has_all_nine_tables():
    expected_tables = {
        "users",
        "workflows",
        "workflow_versions",
        "tasks",
        "workers",
        "workflow_runs",
        "task_runs",
        "task_attempts",
        "events",
    }
    actual_tables = set(Base.metadata.tables.keys())
    assert expected_tables.issubset(actual_tables)


def test_enums_completeness():
    assert WorkflowStatus.PENDING == "PENDING"
    assert WorkflowStatus.SUCCESS == "SUCCESS"
    assert TaskStatus.READY == "READY"
    assert TaskStatus.RUNNING == "RUNNING"
    assert TaskStatus.DEAD_LETTERED == "DEAD_LETTERED"
    assert TaskType.HTTP == "HTTP"
    assert TaskType.PYTHON_FUNCTION == "PYTHON_FUNCTION"
    assert WorkerStatus.ACTIVE == "ACTIVE"
    assert EventType.TASK_CLAIMED == "TASK_CLAIMED"
