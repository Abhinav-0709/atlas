from atlas.exceptions import (
    CyclicDependencyError,
    DuplicateTaskKeyError,
    UnknownDependencyError,
)
from atlas.workflow.dag import DAGDefinition

_WHITE = 0
_GREY = 1
_BLACK = 2


def validate_dag(dag: DAGDefinition) -> None:
    _assert_unique_task_keys(dag)
    _assert_dependencies_exist(dag)
    _assert_acyclic(dag)


def _assert_unique_task_keys(dag: DAGDefinition) -> None:
    seen: set[str] = set()
    for task in dag.tasks:
        if task.key in seen:
            raise DuplicateTaskKeyError(task.key)
        seen.add(task.key)


def _assert_dependencies_exist(dag: DAGDefinition) -> None:
    known_keys = {task.key for task in dag.tasks}
    for task in dag.tasks:
        for dependency in task.dependencies:
            if dependency not in known_keys:
                raise UnknownDependencyError(task.key, dependency)


def _assert_acyclic(dag: DAGDefinition) -> None:
    cycle = _find_cycle(dag.adjacency())
    if cycle is not None:
        raise CyclicDependencyError(cycle)


def _find_cycle(adjacency: dict[str, list[str]]) -> list[str] | None:
    colour = dict.fromkeys(adjacency, _WHITE)
    parent: dict[str, str | None] = {}

    for root in adjacency:
        if colour[root] != _WHITE:
            continue

        colour[root] = _GREY
        parent[root] = None
        stack = [(root, iter(adjacency[root]))]

        while stack:
            node, remaining = stack[-1]
            descended = False

            for neighbour in remaining:
                if colour[neighbour] == _GREY:
                    return _build_cycle(parent, node, neighbour)
                if colour[neighbour] == _WHITE:
                    colour[neighbour] = _GREY
                    parent[neighbour] = node
                    stack.append((neighbour, iter(adjacency[neighbour])))
                    descended = True
                    break

            if not descended:
                colour[node] = _BLACK
                stack.pop()

    return None


def _build_cycle(
    parent: dict[str, str | None],
    node: str,
    target: str,
) -> list[str]:
    path = [node]
    while path[-1] != target:
        previous = parent[path[-1]]
        if previous is None:
            break
        path.append(previous)
    path.reverse()
    path.append(target)
    return path
