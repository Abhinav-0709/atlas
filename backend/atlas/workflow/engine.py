from collections.abc import Mapping
from atlas.db.models.enums import TaskStatus, WorkflowStatus
from atlas.workflow.dag import DAGDefinition, TaskDefinition
from atlas.workflow.validator import validate_dag

_FAILURE_STATUSES = frozenset(
    {TaskStatus.FAILED, TaskStatus.TIMED_OUT, TaskStatus.DEAD_LETTERED}
)


class WorkflowEngine:
    def __init__(self, dag: DAGDefinition) -> None:
        validate_dag(dag)
        self._dag = dag
        self._tasks = dag.task_map()

    @property
    def dag(self) -> DAGDefinition:
        return self._dag

    @property
    def tasks(self) -> Mapping[str, TaskDefinition]:
        return self._tasks

    def initial_task_states(self) -> dict[str, TaskStatus]:
        return dict.fromkeys(self._tasks, TaskStatus.PENDING)

    def get_ready_tasks(self, states: Mapping[str, TaskStatus]) -> list[str]:
        self._require_complete(states)
        return [
            key
            for key, task in self._tasks.items()
            if states[key] is TaskStatus.PENDING
            and all(
                states[dependency] is TaskStatus.SUCCESS
                for dependency in task.dependencies
            )
        ]

    def compute_workflow_status(
        self,
        states: Mapping[str, TaskStatus],
    ) -> WorkflowStatus:
        self._require_complete(states)
        statuses = [states[key] for key in self._tasks]

        if all(status is TaskStatus.SUCCESS for status in statuses):
            return WorkflowStatus.SUCCESS
        if any(status in _FAILURE_STATUSES for status in statuses):
            return WorkflowStatus.FAILED
        return WorkflowStatus.RUNNING

    def is_complete(self, states: Mapping[str, TaskStatus]) -> bool:
        return self.compute_workflow_status(states) is not WorkflowStatus.RUNNING

    def _require_complete(self, states: Mapping[str, TaskStatus]) -> None:
        missing = set(self._tasks) - set(states)
        if missing:
            raise ValueError(f"no task state supplied for: {sorted(missing)}")
