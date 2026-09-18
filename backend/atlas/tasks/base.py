from abc import ABC, abstractmethod
from typing import Any, ClassVar, TypeVar
from pydantic import BaseModel, ValidationError
from atlas.db.models.enums import TaskType
from atlas.exceptions import TaskConfigurationError

ModelT = TypeVar("ModelT", bound=BaseModel)


def parse_task_config(
    model: type[ModelT],
    task_type: TaskType,
    configuration: dict[str, Any],
) -> ModelT:
    try:
        return model.model_validate(configuration)
    except ValidationError as exc:
        raise TaskConfigurationError(task_type.value, str(exc)) from exc


class BaseTask(ABC):
    task_type: ClassVar[TaskType]

    def __init__(self, configuration: dict[str, Any]) -> None:
        self.configuration = configuration

    @abstractmethod
    async def execute(self) -> dict[str, Any]:
        pass
