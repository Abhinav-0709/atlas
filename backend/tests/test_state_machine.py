import pytest
from atlas.db.models.enums import TaskStatus, WorkflowStatus
from atlas.exceptions import InvalidStateTransitionError
from atlas.execution.state_machine import (
    can_transition_task,
    transition_task,
    is_task_terminal,
    allowed_task_transitions,
    can_transition_workflow,
    transition_workflow,
    is_workflow_terminal,
)


class TestTaskTransitions:
    def test_pending_to_ready(self):
        assert can_transition_task(TaskStatus.PENDING, TaskStatus.READY)
        result = transition_task(TaskStatus.PENDING, TaskStatus.READY)
        assert result == TaskStatus.READY

    def test_ready_to_running(self):
        assert can_transition_task(TaskStatus.READY, TaskStatus.RUNNING)
        result = transition_task(TaskStatus.READY, TaskStatus.RUNNING)
        assert result == TaskStatus.RUNNING

    def test_running_to_success(self):
        assert can_transition_task(TaskStatus.RUNNING, TaskStatus.SUCCESS)

    def test_running_to_failed(self):
        assert can_transition_task(TaskStatus.RUNNING, TaskStatus.FAILED)

    def test_running_to_timed_out(self):
        assert can_transition_task(TaskStatus.RUNNING, TaskStatus.TIMED_OUT)

    def test_running_to_ready_lease_recovery(self):
        assert can_transition_task(TaskStatus.RUNNING, TaskStatus.READY)
        result = transition_task(TaskStatus.RUNNING, TaskStatus.READY)
        assert result == TaskStatus.READY

    def test_failed_to_retrying(self):
        assert can_transition_task(TaskStatus.FAILED, TaskStatus.RETRYING)

    def test_failed_to_dead_lettered(self):
        assert can_transition_task(TaskStatus.FAILED, TaskStatus.DEAD_LETTERED)

    def test_retrying_to_ready(self):
        assert can_transition_task(TaskStatus.RETRYING, TaskStatus.READY)

    def test_terminal_states_cannot_transition(self):
        assert is_task_terminal(TaskStatus.SUCCESS)
        assert is_task_terminal(TaskStatus.TIMED_OUT)
        assert is_task_terminal(TaskStatus.DEAD_LETTERED)
        
        assert len(allowed_task_transitions(TaskStatus.SUCCESS)) == 0
        assert len(allowed_task_transitions(TaskStatus.TIMED_OUT)) == 0
        assert len(allowed_task_transitions(TaskStatus.DEAD_LETTERED)) == 0

    def test_invalid_transition_raises_error(self):
        with pytest.raises(InvalidStateTransitionError) as exc_info:
            transition_task(TaskStatus.PENDING, TaskStatus.SUCCESS)
        assert exc_info.value.current == "PENDING"
        assert exc_info.value.target == "SUCCESS"

    def test_success_to_running_invalid(self):
        with pytest.raises(InvalidStateTransitionError):
            transition_task(TaskStatus.SUCCESS, TaskStatus.RUNNING)

    def test_ready_to_ready_invalid(self):
        with pytest.raises(InvalidStateTransitionError):
            transition_task(TaskStatus.READY, TaskStatus.READY)

    def test_running_to_pending_invalid(self):
        with pytest.raises(InvalidStateTransitionError):
            transition_task(TaskStatus.RUNNING, TaskStatus.PENDING)


class TestWorkflowTransitions:
    def test_pending_to_running(self):
        assert can_transition_workflow(WorkflowStatus.PENDING, WorkflowStatus.RUNNING)

    def test_pending_to_cancelled(self):
        assert can_transition_workflow(WorkflowStatus.PENDING, WorkflowStatus.CANCELLED)

    def test_running_to_success(self):
        assert can_transition_workflow(WorkflowStatus.RUNNING, WorkflowStatus.SUCCESS)

    def test_running_to_failed(self):
        assert can_transition_workflow(WorkflowStatus.RUNNING, WorkflowStatus.FAILED)

    def test_running_to_cancelled(self):
        assert can_transition_workflow(WorkflowStatus.RUNNING, WorkflowStatus.CANCELLED)

    def test_terminal_workflow_states(self):
        assert is_workflow_terminal(WorkflowStatus.SUCCESS)
        assert is_workflow_terminal(WorkflowStatus.FAILED)
        assert is_workflow_terminal(WorkflowStatus.CANCELLED)

    def test_invalid_workflow_transition(self):
        with pytest.raises(InvalidStateTransitionError):
            transition_workflow(WorkflowStatus.SUCCESS, WorkflowStatus.RUNNING)

    def test_pending_to_success_invalid(self):
        with pytest.raises(InvalidStateTransitionError):
            transition_workflow(WorkflowStatus.PENDING, WorkflowStatus.SUCCESS)
