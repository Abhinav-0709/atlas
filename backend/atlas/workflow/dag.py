from typing import Any
from pydantic import BaseModel, ConfigDict, Field, ValidationInfo, field_validator
from atlas.db.models.enums import BackoffStrategy, TaskType

TASK_KEY_PATTERN = r"^[a-zA-Z0-9][a-zA-Z0-9_-]*$"


class RetryPolicy(BaseModel):
    model_config = ConfigDict(extra="forbid")

    max_attempts: int = Field(default=3, ge=1, le=100)
    backoff_strategy: BackoffStrategy = BackoffStrategy.EXPONENTIAL
    initial_delay: float = Field(default=2.0, gt=0)
    max_delay: float = Field(default=60.0, gt=0)
    jitter: bool = True

    @field_validator("max_delay")
    @classmethod
    def _max_delay_is_reachable(cls, value: float, info: ValidationInfo) -> float:
        initial_delay = info.data.get("initial_delay")
        if initial_delay is not None and value < initial_delay:
            raise ValueError("max_delay must be greater than or equal to initial_delay")
        return value


class TaskDefinition(BaseModel):
    model_config = ConfigDict(extra="forbid")

    key: str = Field(min_length=1, max_length=100, pattern=TASK_KEY_PATTERN)
    name: str = Field(min_length=1, max_length=255)
    type: TaskType = TaskType.PYTHON_FUNCTION
    dependencies: list[str] = Field(default_factory=list)
    configuration: dict[str, Any] = Field(default_factory=dict)
    retry_policy: RetryPolicy = Field(default_factory=RetryPolicy)
    timeout_seconds: int = Field(default=300, gt=0)

    @field_validator("dependencies")
    @classmethod
    def _dependencies_are_unique(cls, value: list[str]) -> list[str]:
        if len(set(value)) != len(value):
            raise ValueError("dependencies must not contain duplicates")
        return value


class DAGDefinition(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    tasks: list[TaskDefinition] = Field(min_length=1)

    def task_map(self) -> dict[str, TaskDefinition]:
        return {task.key: task for task in self.tasks}

    def adjacency(self) -> dict[str, list[str]]:
        return {task.key: list(task.dependencies) for task in self.tasks}
