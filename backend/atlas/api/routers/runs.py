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
