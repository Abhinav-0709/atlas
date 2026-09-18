import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from atlas.api.schemas.run import (
    RunCreate,
    RunResponse,
    RunDetailResponse,
    TaskRunResponse,
    EventResponse,
)
from atlas.db.models import Workflow, WorkflowVersion, WorkflowRun, TaskRun, Task, Event
from atlas.db.models.enums import WorkflowStatus, TaskStatus
from atlas.db.session import get_db
from atlas.workflow.dag import DAGDefinition
from atlas.workflow.engine import WorkflowEngine

router = APIRouter(prefix="/runs", tags=["runs"])


@router.post("/workflows/{workflow_id}/runs", response_model=RunResponse, status_code=status.HTTP_201_CREATED)
async def start_workflow_run(
    workflow_id: uuid.UUID,
    run_in: RunCreate = Depends(),
    db: AsyncSession = Depends(get_db),
) -> RunResponse:
    workflow_result = await db.execute(
        select(Workflow).where(Workflow.id == workflow_id, Workflow.is_active == True)
    )
    workflow = workflow_result.scalar_one_or_none()
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow {workflow_id} not found",
        )

    version_result = await db.execute(
        select(WorkflowVersion)
        .where(WorkflowVersion.workflow_id == workflow_id, WorkflowVersion.is_active == True)
        .order_by(WorkflowVersion.version.desc())
        .limit(1)
    )
    workflow_version = version_result.scalar_one_or_none()
    if not workflow_version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No active version found for workflow {workflow_id}",
        )

    if run_in.idempotency_key:
        existing_run = await db.execute(
            select(WorkflowRun).where(WorkflowRun.idempotency_key == run_in.idempotency_key)
        )
        if existing_run.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Run with idempotency key '{run_in.idempotency_key}' already exists",
            )

    workflow_run = WorkflowRun(
        workflow_version_id=workflow_version.id,
        status=WorkflowStatus.RUNNING.value,
        idempotency_key=run_in.idempotency_key,
        context_data=run_in.context_data,
    )
    db.add(workflow_run)
    await db.flush()

    dag = DAGDefinition(**workflow_version.definition)
    for task_def in dag.tasks:
        task_result = await db.execute(
            select(Task).where(
                Task.workflow_version_id == workflow_version.id,
                Task.key == task_def.key
            )
        )
        task = task_result.scalar_one_or_none()
        
        if not task:
            task = Task(
                workflow_version_id=workflow_version.id,
                key=task_def.key,
                name=task_def.name,
                task_type=task_def.type.value,
                configuration=task_def.configuration,
                timeout_seconds=task_def.timeout_seconds,
            )
            db.add(task)
            await db.flush()

        task_run = TaskRun(
            workflow_run_id=workflow_run.id,
            task_id=task.id,
            task_key=task_def.key,
            status=TaskStatus.PENDING.value,
        )
        db.add(task_run)

    await db.commit()
    await db.refresh(workflow_run)

    return RunResponse.model_validate(workflow_run)


@router.get("/{run_id}", response_model=RunDetailResponse)
async def get_run(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> RunDetailResponse:
    result = await db.execute(
        select(WorkflowRun).where(WorkflowRun.id == run_id)
    )
    workflow_run = result.scalar_one_or_none()
    
    if not workflow_run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Run {run_id} not found",
        )

    task_runs_result = await db.execute(
        select(TaskRun).where(TaskRun.workflow_run_id == run_id)
    )
    task_runs = task_runs_result.scalars().all()

    return RunDetailResponse(
        id=workflow_run.id,
        workflow_version_id=workflow_run.workflow_version_id,
        status=workflow_run.status,
        idempotency_key=workflow_run.idempotency_key,
        context_data=workflow_run.context_data,
        started_at=workflow_run.started_at,
        completed_at=workflow_run.completed_at,
        created_at=workflow_run.created_at,
        updated_at=workflow_run.updated_at,
        tasks=[TaskRunResponse.model_validate(t) for t in task_runs],
    )


@router.post("/{run_id}/cancel", response_model=RunResponse)
async def cancel_run(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> RunResponse:
    result = await db.execute(
        select(WorkflowRun).where(WorkflowRun.id == run_id)
    )
    workflow_run = result.scalar_one_or_none()
    
    if not workflow_run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Run {run_id} not found",
        )

    if workflow_run.status in [
        WorkflowStatus.SUCCESS.value,
        WorkflowStatus.FAILED.value,
        WorkflowStatus.CANCELLED.value,
    ]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel run in status '{workflow_run.status}'",
        )

    workflow_run.status = WorkflowStatus.CANCELLED.value
    workflow_run.completed_at = datetime.utcnow()
    await db.commit()
    await db.refresh(workflow_run)

    return RunResponse.model_validate(workflow_run)


@router.get("/{run_id}/tasks", response_model=list[TaskRunResponse])
async def get_run_tasks(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> list[TaskRunResponse]:
    run_result = await db.execute(
        select(WorkflowRun).where(WorkflowRun.id == run_id)
    )
    if not run_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Run {run_id} not found",
        )

    task_runs_result = await db.execute(
        select(TaskRun).where(TaskRun.workflow_run_id == run_id)
    )
    task_runs = task_runs_result.scalars().all()

    return [TaskRunResponse.model_validate(t) for t in task_runs]


@router.get("/{run_id}/events", response_model=list[EventResponse])
async def get_run_events(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> list[EventResponse]:
    run_result = await db.execute(
        select(WorkflowRun).where(WorkflowRun.id == run_id)
    )
    if not run_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Run {run_id} not found",
        )

    events_result = await db.execute(
        select(Event).where(Event.workflow_run_id == run_id).order_by(Event.created_at)
    )
    events = events_result.scalars().all()

    return [EventResponse.model_validate(e) for e in events]
