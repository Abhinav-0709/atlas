import pytest
from atlas.exceptions import (
    CyclicDependencyError,
    DuplicateTaskKeyError,
    UnknownDependencyError,
)
from atlas.workflow.dag import DAGDefinition, TaskDefinition
from atlas.workflow.validator import validate_dag


def test_valid_dag():
    dag = DAGDefinition(
        name="test-workflow",
        tasks=[
            TaskDefinition(key="a", name="Task A"),
            TaskDefinition(key="b", name="Task B", dependencies=["a"]),
            TaskDefinition(key="c", name="Task C", dependencies=["a"]),
            TaskDefinition(key="d", name="Task D", dependencies=["b", "c"]),
        ],
    )
    validate_dag(dag)


def test_duplicate_task_keys():
    dag = DAGDefinition(
        name="duplicate-keys",
        tasks=[
            TaskDefinition(key="a", name="Task A"),
            TaskDefinition(key="a", name="Task A Again"),
        ],
    )
    with pytest.raises(DuplicateTaskKeyError) as exc_info:
        validate_dag(dag)
    assert exc_info.value.task_key == "a"


def test_unknown_dependency():
    dag = DAGDefinition(
        name="unknown-dep",
        tasks=[
            TaskDefinition(key="a", name="Task A"),
            TaskDefinition(key="b", name="Task B", dependencies=["nonexistent"]),
        ],
    )
    with pytest.raises(UnknownDependencyError) as exc_info:
        validate_dag(dag)
    assert exc_info.value.task_key == "b"
    assert exc_info.value.dependency == "nonexistent"


def test_self_dependency():
    dag = DAGDefinition(
        name="self-dep",
        tasks=[
            TaskDefinition(key="a", name="Task A", dependencies=["a"]),
        ],
    )
    with pytest.raises(CyclicDependencyError):
        validate_dag(dag)


def test_simple_cycle():
    dag = DAGDefinition(
        name="simple-cycle",
        tasks=[
            TaskDefinition(key="a", name="Task A", dependencies=["b"]),
            TaskDefinition(key="b", name="Task B", dependencies=["a"]),
        ],
    )
    with pytest.raises(CyclicDependencyError) as exc_info:
        validate_dag(dag)
    assert len(exc_info.value.cycle) >= 2


def test_longer_cycle():
    dag = DAGDefinition(
        name="longer-cycle",
        tasks=[
            TaskDefinition(key="a", name="Task A", dependencies=["c"]),
            TaskDefinition(key="b", name="Task B", dependencies=["a"]),
            TaskDefinition(key="c", name="Task C", dependencies=["b"]),
        ],
    )
    with pytest.raises(CyclicDependencyError):
        validate_dag(dag)


def test_diamond_dependency():
    dag = DAGDefinition(
        name="diamond",
        tasks=[
            TaskDefinition(key="a", name="Task A"),
            TaskDefinition(key="b", name="Task B", dependencies=["a"]),
            TaskDefinition(key="c", name="Task C", dependencies=["a"]),
            TaskDefinition(key="d", name="Task D", dependencies=["b", "c"]),
        ],
    )
    validate_dag(dag)


def test_disconnected_graph():
    dag = DAGDefinition(
        name="disconnected",
        tasks=[
            TaskDefinition(key="a", name="Task A"),
            TaskDefinition(key="b", name="Task B"),
            TaskDefinition(key="c", name="Task C"),
        ],
    )
    validate_dag(dag)
