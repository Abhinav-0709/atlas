import pytest
from atlas.db.models.enums import TaskStatus, WorkflowStatus
from atlas.workflow.dag import DAGDefinition, TaskDefinition
from atlas.workflow.engine import WorkflowEngine


class TestWorkflowEngine:
    def test_initial_task_states(self):
        dag = DAGDefinition(
            name="test",
            tasks=[
                TaskDefinition(key="a", name="Task A"),
                TaskDefinition(key="b", name="Task B", dependencies=["a"]),
            ],
        )
        engine = WorkflowEngine(dag)
        states = engine.initial_task_states()
        
        assert states["a"] == TaskStatus.PENDING
        assert states["b"] == TaskStatus.PENDING

    def test_get_ready_tasks_no_deps(self):
        dag = DAGDefinition(
            name="test",
            tasks=[
                TaskDefinition(key="a", name="Task A"),
                TaskDefinition(key="b", name="Task B"),
            ],
        )
        engine = WorkflowEngine(dag)
        states = engine.initial_task_states()
        
        ready = engine.get_ready_tasks(states)
        assert set(ready) == {"a", "b"}

    def test_get_ready_tasks_with_deps(self):
        dag = DAGDefinition(
            name="test",
            tasks=[
                TaskDefinition(key="a", name="Task A"),
                TaskDefinition(key="b", name="Task B", dependencies=["a"]),
            ],
        )
        engine = WorkflowEngine(dag)
        states = engine.initial_task_states()
        
        ready = engine.get_ready_tasks(states)
        assert ready == ["a"]
        assert "b" not in ready

    def test_get_ready_tasks_after_completion(self):
        dag = DAGDefinition(
            name="test",
            tasks=[
                TaskDefinition(key="a", name="Task A"),
                TaskDefinition(key="b", name="Task B", dependencies=["a"]),
            ],
        )
        engine = WorkflowEngine(dag)
        states = engine.initial_task_states()
        
        states["a"] = TaskStatus.SUCCESS
        ready = engine.get_ready_tasks(states)
        assert ready == ["b"]

    def test_five_tasks_three_levels(self):
        dag = DAGDefinition(
            name="test",
            tasks=[
                TaskDefinition(key="level1", name="Level 1"),
                TaskDefinition(key="level2a", name="Level 2A", dependencies=["level1"]),
                TaskDefinition(key="level2b", name="Level 2B", dependencies=["level1"]),
                TaskDefinition(key="level3a", name="Level 3A", dependencies=["level2a"]),
                TaskDefinition(key="level3b", name="Level 3B", dependencies=["level2a", "level2b"]),
            ],
        )
        engine = WorkflowEngine(dag)
        states = engine.initial_task_states()
        
        ready = engine.get_ready_tasks(states)
        assert ready == ["level1"]
        
        states["level1"] = TaskStatus.SUCCESS
        ready = engine.get_ready_tasks(states)
        assert set(ready) == {"level2a", "level2b"}
        
        states["level2a"] = TaskStatus.SUCCESS
        ready = engine.get_ready_tasks(states)
        assert ready == ["level2b", "level3a"]
        
        states["level2b"] = TaskStatus.SUCCESS
        states["level3a"] = TaskStatus.SUCCESS
        ready = engine.get_ready_tasks(states)
        assert ready == ["level3b"]

    def test_compute_workflow_status_running(self):
        dag = DAGDefinition(
            name="test",
            tasks=[
                TaskDefinition(key="a", name="Task A"),
                TaskDefinition(key="b", name="Task B"),
            ],
        )
        engine = WorkflowEngine(dag)
        states = engine.initial_task_states()
        
        status = engine.compute_workflow_status(states)
        assert status == WorkflowStatus.RUNNING

    def test_compute_workflow_status_success(self):
        dag = DAGDefinition(
            name="test",
            tasks=[
                TaskDefinition(key="a", name="Task A"),
                TaskDefinition(key="b", name="Task B"),
            ],
        )
        engine = WorkflowEngine(dag)
        states = {"a": TaskStatus.SUCCESS, "b": TaskStatus.SUCCESS}
        
        status = engine.compute_workflow_status(states)
        assert status == WorkflowStatus.SUCCESS

    def test_compute_workflow_status_failed(self):
        dag = DAGDefinition(
            name="test",
            tasks=[
                TaskDefinition(key="a", name="Task A"),
                TaskDefinition(key="b", name="Task B"),
            ],
        )
        engine = WorkflowEngine(dag)
        states = {"a": TaskStatus.SUCCESS, "b": TaskStatus.FAILED}
        
        status = engine.compute_workflow_status(states)
        assert status == WorkflowStatus.FAILED

    def test_compute_workflow_status_timed_out(self):
        dag = DAGDefinition(
            name="test",
            tasks=[TaskDefinition(key="a", name="Task A")],
        )
        engine = WorkflowEngine(dag)
        states = {"a": TaskStatus.TIMED_OUT}
        
        status = engine.compute_workflow_status(states)
        assert status == WorkflowStatus.FAILED

    def test_is_complete(self):
        dag = DAGDefinition(
            name="test",
            tasks=[TaskDefinition(key="a", name="Task A")],
        )
        engine = WorkflowEngine(dag)
        
        states = {"a": TaskStatus.PENDING}
        assert not engine.is_complete(states)
        
        states = {"a": TaskStatus.SUCCESS}
        assert engine.is_complete(states)
        
        states = {"a": TaskStatus.FAILED}
        assert engine.is_complete(states)

    def test_missing_state_raises_error(self):
        dag = DAGDefinition(
            name="test",
            tasks=[
                TaskDefinition(key="a", name="Task A"),
                TaskDefinition(key="b", name="Task B"),
            ],
        )
        engine = WorkflowEngine(dag)
        states = {"a": TaskStatus.PENDING}
        
        with pytest.raises(ValueError, match="no task state supplied for"):
            engine.get_ready_tasks(states)

    def test_tasks_not_ready_when_running(self):
        dag = DAGDefinition(
            name="test",
            tasks=[TaskDefinition(key="a", name="Task A")],
        )
        engine = WorkflowEngine(dag)
        states = {"a": TaskStatus.RUNNING}
        
        ready = engine.get_ready_tasks(states)
        assert ready == []

    def test_tasks_not_ready_when_success(self):
        dag = DAGDefinition(
            name="test",
            tasks=[TaskDefinition(key="a", name="Task A")],
        )
        engine = WorkflowEngine(dag)
        states = {"a": TaskStatus.SUCCESS}
        
        ready = engine.get_ready_tasks(states)
        assert ready == []

    def test_execution_order_preserves_declaration_order(self):
        dag = DAGDefinition(
            name="test",
            tasks=[
                TaskDefinition(key="z", name="Task Z"),
                TaskDefinition(key="a", name="Task A"),
                TaskDefinition(key="m", name="Task M"),
            ],
        )
        engine = WorkflowEngine(dag)
        states = engine.initial_task_states()
        
        ready = engine.get_ready_tasks(states)
        assert ready == ["z", "a", "m"]
