import asyncio
from typing import Any
from pydantic import BaseModel, ConfigDict, Field
from atlas.db.models.enums import TaskType
from atlas.tasks.base import BaseTask, parse_task_config


class DelayConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    seconds: float = Field(gt=0, le=3600)


class DelayTask(BaseTask):
    task_type = TaskType.DELAY

    def __init__(self, configuration: dict[str, Any]) -> None:
        super().__init__(configuration)
        cfg = dict(configuration)
        if "seconds" not in cfg or not cfg.get("seconds"):
            cfg["seconds"] = 2.0
        self.config = parse_task_config(DelayConfig, self.task_type, cfg)

    async def execute(self) -> dict[str, Any]:
        await asyncio.sleep(self.config.seconds)
        return {"slept_seconds": self.config.seconds}
