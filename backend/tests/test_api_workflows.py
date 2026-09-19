import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from atlas.main import app
from atlas.db.session import AsyncSessionLocal
from atlas.config import settings


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def clean_db():
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
    except Exception:
        pytest.skip(f"Database is not accessible on {settings.DATABASE_URL}")

    async with AsyncSessionLocal() as session:
        await session.execute(text("DELETE FROM task_runs"))
        await session.execute(text("DELETE FROM workflow_runs"))
        await session.execute(text("DELETE FROM workflow_versions"))
        await session.execute(text("DELETE FROM workflows"))
        await session.commit()
    yield


@pytest.mark.asyncio
async def test_create_workflow(client: AsyncClient, clean_db):
    workflow_data = {
        "name": "test-workflow-unique-1",
        "description": "A test workflow",
        "definition": {
            "name": "test",
            "tasks": [
                {"key": "task_a", "name": "Task A", "type": "PYTHON_FUNCTION"},
                {"key": "task_b", "name": "Task B", "type": "PYTHON_FUNCTION", "dependencies": ["task_a"]},
            ]
        }
    }
    
    response = await client.post("/workflows", json=workflow_data)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "test-workflow-unique-1"
    assert "id" in data


@pytest.mark.asyncio
async def test_create_workflow_invalid_dag(client: AsyncClient, clean_db):
    workflow_data = {
        "name": "invalid-workflow-unique",
        "definition": {
            "name": "invalid",
            "tasks": [
                {"key": "a", "name": "Task A"},
                {"key": "b", "name": "Task B", "dependencies": ["nonexistent"]},
            ]
        }
    }
    
    response = await client.post("/workflows", json=workflow_data)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_list_workflows(client: AsyncClient, clean_db):
    response = await client.get("/workflows")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_get_workflow(client: AsyncClient, clean_db):
    workflow_data = {
        "name": "get-test-workflow-unique",
        "definition": {
            "name": "test",
            "tasks": [{"key": "a", "name": "Task A"}]
        }
    }
    
    create_response = await client.post("/workflows", json=workflow_data)
    workflow_id = create_response.json()["id"]
    
    response = await client.get(f"/workflows/{workflow_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == workflow_id


@pytest.mark.asyncio
async def test_start_workflow_run(client: AsyncClient, clean_db):
    workflow_data = {
        "name": "run-test-workflow-unique",
        "definition": {
            "name": "test",
            "tasks": [
                {"key": "task_a", "name": "Task A", "type": "DELAY", "configuration": {"seconds": 1}},
            ]
        }
    }
    
    create_response = await client.post("/workflows", json=workflow_data)
    workflow_id = create_response.json()["id"]
    
    run_response = await client.post(f"/workflows/{workflow_id}/runs", json={})
    assert run_response.status_code == 201
    data = run_response.json()
    assert "id" in data
    assert data["status"] == "RUNNING"


@pytest.mark.asyncio
async def test_get_run(client: AsyncClient, clean_db):
    workflow_data = {
        "name": "get-run-workflow-unique",
        "definition": {
            "name": "test",
            "tasks": [{"key": "a", "name": "Task A"}]
        }
    }
    
    create_response = await client.post("/workflows", json=workflow_data)
    workflow_id = create_response.json()["id"]
    
    run_response = await client.post(f"/workflows/{workflow_id}/runs", json={})
    run_id = run_response.json()["id"]
    
    response = await client.get(f"/runs/{run_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == run_id


@pytest.mark.asyncio
async def test_cancel_run(client: AsyncClient, clean_db):
    workflow_data = {
        "name": "cancel-workflow-unique",
        "definition": {
            "name": "test",
            "tasks": [{"key": "a", "name": "Task A"}]
        }
    }
    
    create_response = await client.post("/workflows", json=workflow_data)
    workflow_id = create_response.json()["id"]
    
    run_response = await client.post(f"/workflows/{workflow_id}/runs", json={})
    run_id = run_response.json()["id"]
    
    cancel_response = await client.post(f"/runs/{run_id}/cancel")
    assert cancel_response.status_code == 200
    data = cancel_response.json()
    assert data["status"] == "CANCELLED"
