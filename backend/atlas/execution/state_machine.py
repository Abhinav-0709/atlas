from atlas.db.models.enums import TaskStatus, WorkflowStatus
from atlas.exceptions import InvalidStateTransitionError

_TASK_TRANSITIONS: dict[TaskStatus, frozenset[TaskStatus]] = {
    TaskStatus.PENDING: frozenset({TaskStatus.READY}),
    TaskStatus.READY: frozenset({TaskStatus.RUNNING}),
    TaskStatus.RUNNING: frozenset(
        {TaskStatus.SUCCESS, TaskStatus.FAILED, TaskStatus.TIMED_OUT, TaskStatus.READY}
    ),
    TaskStatus.FAILED: frozenset({TaskStatus.RETRYING, TaskStatus.DEAD_LETTERED}),
    TaskStatus.RETRYING: frozenset({TaskStatus.READY}),
    TaskStatus.SUCCESS: frozenset(),
    TaskStatus.TIMED_OUT: frozenset(),
    TaskStatus.DEAD_LETTERED: frozenset(),
}

_WORKFLOW_TRANSITIONS: dict[WorkflowStatus, frozenset[WorkflowStatus]] = {
    WorkflowStatus.PENDING: frozenset(
        {WorkflowStatus.RUNNING, WorkflowStatus.CANCELLED}
    ),
    WorkflowStatus.RUNNING: frozenset(
        {WorkflowStatus.SUCCESS, WorkflowStatus.FAILED, WorkflowStatus.CANCELLED}
    ),
    WorkflowStatus.SUCCESS: frozenset(),
    WorkflowStatus.FAILED: frozenset(),
    WorkflowStatus.CANCELLED: frozenset(),
}


def can_transition_task(current: TaskStatus, target: TaskStatus) -> bool:
    return target in _TASK_TRANSITIONS[current]


def transition_task(current: TaskStatus, target: TaskStatus) -> TaskStatus:
    if not can_transition_task(current, target):
        raise InvalidStateTransitionError(current.value, target.value)
    return target


def is_task_terminal(status: TaskStatus) -> bool:
    return not _TASK_TRANSITIONS[status]


def allowed_task_transitions(current: TaskStatus) -> frozenset[TaskStatus]:
    return _TASK_TRANSITIONS[current]


def can_transition_workflow(
    current: WorkflowStatus,
    target: WorkflowStatus,
) -> bool:
    return target in _WORKFLOW_TRANSITIONS[current]


def transition_workflow(
    current: WorkflowStatus,
    target: WorkflowStatus,
) -> WorkflowStatus:
    if not can_transition_workflow(current, target):
        raise InvalidStateTransitionError(current.value, target.value)
    return target


def is_workflow_terminal(status: WorkflowStatus) -> bool:
    return not _WORKFLOW_TRANSITIONS[status]


def allowed_workflow_transitions(
    current: WorkflowStatus,
) -> frozenset[WorkflowStatus]:
    return _WORKFLOW_TRANSITIONS[current]
