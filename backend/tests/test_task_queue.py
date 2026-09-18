import pytest
import uuid
import redis.asyncio as aioredis
from atlas.config import settings
from atlas.queue.task_queue import (
    serialize_task,
    deserialize_task,
    TASK_QUEUE_NAME,
)


@pytest.fixture
async def redis_client():
    client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    yield client
    await client.aclose()


@pytest.fixture(autouse=True)
async def clean_queue(redis_client):
    await redis_client.delete(TASK_QUEUE_NAME)
    yield
    await redis_client.delete(TASK_QUEUE_NAME)


@pytest.mark.asyncio
async def test_serialize_deserialize_task():
    task_data = {
        "workflow_run_id": str(uuid.uuid4()),
        "task_run_id": str(uuid.uuid4()),
        "task_key": "test_task",
        "configuration": {"param": "value"},
        "timeout_seconds": 60,
    }
    
    serialized = serialize_task(task_data)
    assert isinstance(serialized, str)
    
    deserialized = deserialize_task(serialized)
    assert deserialized == task_data


@pytest.mark.asyncio
async def test_enqueue_task(redis_client):
    import json
    workflow_run_id = uuid.uuid4()
    task_run_id = uuid.uuid4()
    
    task_data = {
        "workflow_run_id": str(workflow_run_id),
        "task_run_id": str(task_run_id),
        "task_key": "test_task",
        "configuration": {"test": "value"},
        "timeout_seconds": 60,
    }
    await redis_client.rpush(TASK_QUEUE_NAME, json.dumps(task_data))
    
    depth = await redis_client.llen(TASK_QUEUE_NAME)
    assert depth == 1


@pytest.mark.asyncio
async def test_enqueue_multiple_tasks(redis_client):
    import json
    workflow_run_id = uuid.uuid4()
    
    for i in range(5):
        task_data = {
            "workflow_run_id": str(workflow_run_id),
            "task_run_id": str(uuid.uuid4()),
            "task_key": f"task_{i}",
            "configuration": {},
            "timeout_seconds": 60,
        }
        await redis_client.rpush(TASK_QUEUE_NAME, json.dumps(task_data))
    
    depth = await redis_client.llen(TASK_QUEUE_NAME)
    assert depth == 5


@pytest.mark.asyncio
async def test_dequeue_task_non_blocking(redis_client):
    import json
    workflow_run_id = uuid.uuid4()
    task_run_id = uuid.uuid4()
    
    task_data = {
        "workflow_run_id": str(workflow_run_id),
        "task_run_id": str(task_run_id),
        "task_key": "test_task",
        "configuration": {"test": "data"},
        "timeout_seconds": 60,
    }
    await redis_client.rpush(TASK_QUEUE_NAME, json.dumps(task_data))
    
    result = await redis_client.lpop(TASK_QUEUE_NAME)
    assert result is not None
    task = json.loads(result)
    assert task["workflow_run_id"] == str(workflow_run_id)
    assert task["task_run_id"] == str(task_run_id)
    assert task["task_key"] == "test_task"


@pytest.mark.asyncio
async def test_dequeue_empty_queue(redis_client):
    result = await redis_client.lpop(TASK_QUEUE_NAME)
    assert result is None


@pytest.mark.asyncio
async def test_queue_depth(redis_client):
    import json
    initial_depth = await redis_client.llen(TASK_QUEUE_NAME)
    assert initial_depth == 0
    
    task_data = {
        "workflow_run_id": str(uuid.uuid4()),
        "task_run_id": str(uuid.uuid4()),
        "task_key": "task_1",
        "configuration": {},
        "timeout_seconds": 60,
    }
    await redis_client.rpush(TASK_QUEUE_NAME, json.dumps(task_data))
    
    depth = await redis_client.llen(TASK_QUEUE_NAME)
    assert depth == 1


@pytest.mark.asyncio
async def test_clear_queue(redis_client):
    import json
    for i in range(3):
        task_data = {
            "workflow_run_id": str(uuid.uuid4()),
            "task_run_id": str(uuid.uuid4()),
            "task_key": f"task_{i}",
            "configuration": {},
            "timeout_seconds": 60,
        }
        await redis_client.rpush(TASK_QUEUE_NAME, json.dumps(task_data))
    
    assert await redis_client.llen(TASK_QUEUE_NAME) == 3
    
    await redis_client.delete(TASK_QUEUE_NAME)
    
    assert await redis_client.llen(TASK_QUEUE_NAME) == 0


@pytest.mark.asyncio
async def test_fifo_order(redis_client):
    import json
    workflow_run_id = uuid.uuid4()
    
    for i in range(3):
        task_data = {
            "workflow_run_id": str(workflow_run_id),
            "task_run_id": str(uuid.uuid4()),
            "task_key": f"task_{i}",
            "configuration": {},
            "timeout_seconds": 60,
        }
        await redis_client.rpush(TASK_QUEUE_NAME, json.dumps(task_data))
    
    task1_json = await redis_client.lpop(TASK_QUEUE_NAME)
    task1 = json.loads(task1_json)
    assert task1["task_key"] == "task_0"
    
    task2_json = await redis_client.lpop(TASK_QUEUE_NAME)
    task2 = json.loads(task2_json)
    assert task2["task_key"] == "task_1"
    
    task3_json = await redis_client.lpop(TASK_QUEUE_NAME)
    task3 = json.loads(task3_json)
    assert task3["task_key"] == "task_2"
