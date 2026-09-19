import json
import uuid
from typing import Any
import redis.asyncio as aioredis
from atlas.queue.client import get_redis_pool

TASK_QUEUE_NAME = "atlas:task_queue"


def serialize_task(task_data: dict[str, Any]) -> str:
    return json.dumps(task_data)


def deserialize_task(task_json: str) -> dict[str, Any]:
    return json.loads(task_json)


async def enqueue_task(
    workflow_run_id: uuid.UUID,
    task_run_id: uuid.UUID,
    task_key: str,
    configuration: dict[str, Any],
    timeout_seconds: int = 300,
) -> None:
    redis: Any = get_redis_pool()
    task_data = {
        "workflow_run_id": str(workflow_run_id),
        "task_run_id": str(task_run_id),
        "task_key": task_key,
        "configuration": configuration,
        "timeout_seconds": timeout_seconds,
    }
    await redis.rpush(TASK_QUEUE_NAME, serialize_task(task_data))


async def dequeue_task(block: bool = True, timeout: int = 5) -> dict[str, Any] | None:
    redis: Any = get_redis_pool()
    if block:
        result = await redis.blpop([TASK_QUEUE_NAME], timeout=timeout)
        if result is None:
            return None
        _, task_json = result
    else:
        task_json = await redis.lpop(TASK_QUEUE_NAME)
        if task_json is None:
            return None

    return deserialize_task(str(task_json))


async def get_queue_depth() -> int:
    redis: Any = get_redis_pool()
    return int(await redis.llen(TASK_QUEUE_NAME))


async def clear_queue() -> None:
    redis: Any = get_redis_pool()
    await redis.delete(TASK_QUEUE_NAME)
