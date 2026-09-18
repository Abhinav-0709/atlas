from collections.abc import Callable
from typing import Any, TypeVar
from atlas.exceptions import UnregisteredFunctionError

TaskFunction = Callable[..., Any]
FuncT = TypeVar("FuncT", bound=TaskFunction)

_FUNCTIONS: dict[str, TaskFunction] = {}


def register_function(name: str) -> Callable[[FuncT], FuncT]:
    def decorator(function: FuncT) -> FuncT:
        if name in _FUNCTIONS:
            raise ValueError(f"function is already registered: {name!r}")
        _FUNCTIONS[name] = function
        return function

    return decorator


def get_function(name: str) -> TaskFunction:
    try:
        return _FUNCTIONS[name]
    except KeyError:
        raise UnregisteredFunctionError(name) from None


def is_registered(name: str) -> bool:
    return name in _FUNCTIONS


def registered_names() -> list[str]:
    return sorted(_FUNCTIONS)


def clear_registry() -> None:
    _FUNCTIONS.clear()
