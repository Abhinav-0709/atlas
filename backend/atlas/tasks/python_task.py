import asyncio
import inspect
from typing import Any
from pydantic import BaseModel, ConfigDict, Field
from atlas.db.models.enums import TaskType
from atlas.tasks.base import BaseTask, parse_task_config
from atlas.tasks.registry import get_function


class PythonFunctionConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    function: str = Field(min_length=1)
    kwargs: dict[str, Any] = Field(default_factory=dict)


class PythonFunctionTask(BaseTask):
    task_type = TaskType.PYTHON_FUNCTION

    def __init__(self, configuration: dict[str, Any]) -> None:
        super().__init__(configuration)
        cfg = dict(configuration)
        if not cfg.get("function"):
            candidate = cfg.get("name") or cfg.get("key") or cfg.get("task_key") or "reserve_inventory"
            cfg["function"] = candidate
        self.config = parse_task_config(
            PythonFunctionConfig, self.task_type, cfg
        )

    async def execute(self) -> dict[str, Any]:
        function = get_function(self.config.function)

        if inspect.iscoroutinefunction(function):
            result = await function(**self.config.kwargs)
        else:
            result = await asyncio.to_thread(function, **self.config.kwargs)

        return self._as_payload(result)

    @staticmethod
    def _as_payload(result: Any) -> dict[str, Any]:
        if result is None:
            return {}
        if isinstance(result, dict):
            return result
        return {"result": result}
