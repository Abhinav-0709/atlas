import asyncio
from typing import Any
from atlas.db.models.enums import TaskType
from atlas.exceptions import TaskTimeoutError, UnsupportedTaskTypeError
from atlas.tasks.base import BaseTask
from atlas.tasks.delay_task import DelayTask
from atlas.tasks.http_task import HTTPTask
from atlas.tasks.python_task import PythonFunctionTask
from atlas.workflow.dag import TaskDefinition

_TASK_CLASSES: dict[TaskType, type[BaseTask]] = {
    TaskType.HTTP: HTTPTask,
    TaskType.PYTHON_FUNCTION: PythonFunctionTask,
    TaskType.DELAY: DelayTask,
}


def supported_task_types() -> list[TaskType]:
    return list(_TASK_CLASSES)


def build_task(definition: TaskDefinition) -> BaseTask:
    try:
        task_class = _TASK_CLASSES[definition.type]
    except KeyError:
        raise UnsupportedTaskTypeError(definition.type.value) from None
    return task_class(definition.configuration)


async def execute_task(definition: TaskDefinition) -> dict[str, Any]:
    task = build_task(definition)
    try:
        async with asyncio.timeout(definition.timeout_seconds) as timeout:
            return await task.execute()
    except TimeoutError as exc:
        if timeout.expired():
            raise TaskTimeoutError(
                definition.key, definition.timeout_seconds
            ) from exc
        raise
