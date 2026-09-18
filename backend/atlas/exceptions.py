class AtlasError(Exception):
    pass


class DAGValidationError(AtlasError):
    pass


class DuplicateTaskKeyError(DAGValidationError):
    def __init__(self, task_key: str) -> None:
        self.task_key = task_key
        super().__init__(f"duplicate task key: {task_key!r}")


class UnknownDependencyError(DAGValidationError):
    def __init__(self, task_key: str, dependency: str) -> None:
        self.task_key = task_key
        self.dependency = dependency
        super().__init__(
            f"task {task_key!r} depends on unknown task {dependency!r}"
        )


class CyclicDependencyError(DAGValidationError):
    def __init__(self, cycle: list[str]) -> None:
        self.cycle = cycle
        super().__init__(f"cyclic dependency detected: {' -> '.join(cycle)}")


class InvalidStateTransitionError(AtlasError):
    def __init__(self, current: str, target: str) -> None:
        self.current = current
        self.target = target
        super().__init__(f"illegal state transition: {current} -> {target}")


class TaskExecutionError(AtlasError):
    pass


class UnsupportedTaskTypeError(TaskExecutionError):
    def __init__(self, task_type: str) -> None:
        self.task_type = task_type
        super().__init__(f"no handler registered for task type: {task_type}")


class UnregisteredFunctionError(TaskExecutionError):
    def __init__(self, function_name: str) -> None:
        self.function_name = function_name
        super().__init__(f"function is not registered: {function_name!r}")


class TaskTimeoutError(TaskExecutionError):
    def __init__(self, task_key: str, timeout_seconds: int) -> None:
        self.task_key = task_key
        self.timeout_seconds = timeout_seconds
        super().__init__(
            f"task {task_key!r} exceeded its timeout of {timeout_seconds}s"
        )


class TaskConfigurationError(TaskExecutionError):
    def __init__(self, task_type: str, reason: str) -> None:
        self.task_type = task_type
        self.reason = reason
        super().__init__(f"invalid configuration for {task_type} task: {reason}")
