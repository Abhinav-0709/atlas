import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete
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

    # Look up workflow version and workflow
    wv_res = await db.execute(
        select(WorkflowVersion, Workflow)
        .join(Workflow, Workflow.id == WorkflowVersion.workflow_id)
        .where(WorkflowVersion.id == workflow_run.workflow_version_id)
    )
    wv_row = wv_res.first()
    wf_name = None
    wf_desc = None
    task_meta_map: dict[str, dict[str, str | None]] = {}
    if wv_row:
        wv, wf = wv_row
        wf_name = wf.name
        wf_desc = wf.description
        if wv.definition and "tasks" in wv.definition:
            for t_def in wv.definition["tasks"]:
                task_meta_map[t_def.get("key", "")] = {
                    "name": t_def.get("name"),
                    "type": t_def.get("type"),
                }

    tasks_out = []
    for t in task_runs:
        meta = task_meta_map.get(t.task_key, {})
        t_resp = TaskRunResponse(
            id=t.id,
            workflow_run_id=t.workflow_run_id,
            task_key=t.task_key,
            task_name=meta.get("name") or t.task_key,
            task_type=meta.get("type"),
            status=t.status,
            worker_id=t.worker_id,
            scheduled_retry_at=t.scheduled_retry_at,
            current_attempt=t.current_attempt,
            attempt_count=t.current_attempt,
            started_at=t.started_at,
            completed_at=t.completed_at,
            input_data=t.input_data,
            output_data=t.output_data,
            error_message=t.error_message,
            created_at=t.created_at,
        )
        tasks_out.append(t_resp)

    return RunDetailResponse(
        id=workflow_run.id,
        workflow_version_id=workflow_run.workflow_version_id,
        workflow_name=wf_name,
        workflow_description=wf_desc,
        status=workflow_run.status,
        idempotency_key=workflow_run.idempotency_key,
        context_data=workflow_run.context_data,
        started_at=workflow_run.started_at,
        completed_at=workflow_run.completed_at,
        created_at=workflow_run.created_at,
        updated_at=workflow_run.updated_at,
        tasks=tasks_out,
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


@router.delete("/{run_id}", status_code=status.HTTP_200_OK)
async def delete_run(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> dict[str, any]:
    result = await db.execute(
        select(WorkflowRun).where(WorkflowRun.id == run_id)
    )
    workflow_run = result.scalar_one_or_none()
    if not workflow_run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Run {run_id} not found",
        )
    await db.delete(workflow_run)
    await db.commit()
    return {"deleted": True, "id": str(run_id)}


@router.post("/action/cleanup", status_code=status.HTTP_200_OK)
async def cleanup_runs(
    status_filter: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> dict[str, any]:
    """Clean up runs (e.g. FAILED, CANCELLED, or old runs) for data maintenance."""
    query = delete(WorkflowRun)
    if status_filter:
        query = query.where(WorkflowRun.status == status_filter.upper())
    else:
        # Default cleanup: remove FAILED, CANCELLED
        query = query.where(WorkflowRun.status.in_([WorkflowStatus.FAILED.value, WorkflowStatus.CANCELLED.value]))
    
    result = await db.execute(query)
    await db.commit()
    return {"cleaned_count": result.rowcount}

