import uuid
from datetime import datetime, timezone
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from atlas.api.schemas.run import RunCreate, RunResponse
from atlas.api.schemas.workflow import (
    WorkflowCreate,
    WorkflowResponse,
    WorkflowDetailResponse,
    WorkflowListResponse,
    WorkflowVersionResponse,
)
from atlas.db.models import Workflow, WorkflowVersion, WorkflowRun, Task, TaskRun
from atlas.db.models.enums import WorkflowStatus, TaskStatus
from atlas.db.session import get_db
from atlas.workflow.dag import DAGDefinition
from atlas.workflow.validator import validate_dag

router = APIRouter(prefix="/workflows", tags=["workflows"])


@router.post("", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED)
async def create_workflow(
    workflow_in: WorkflowCreate,
    db: AsyncSession = Depends(get_db),
) -> WorkflowResponse:
    try:
        dag = DAGDefinition(**workflow_in.definition)
        validate_dag(dag)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid DAG definition: {str(e)}",
        )

    existing = await db.execute(
        select(Workflow).where(Workflow.name == workflow_in.name)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Workflow with name '{workflow_in.name}' already exists",
        )

    workflow = Workflow(
        name=workflow_in.name,
        description=workflow_in.description,
    )
    db.add(workflow)
    await db.flush()

    workflow_version = WorkflowVersion(
        workflow_id=workflow.id,
        version=1,
        definition=workflow_in.definition,
    )
    db.add(workflow_version)
    await db.commit()
    await db.refresh(workflow)

    return WorkflowResponse.model_validate(workflow)


@router.get("", response_model=WorkflowListResponse)
async def list_workflows(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
) -> WorkflowListResponse:
    result = await db.execute(select(Workflow).offset(skip).limit(limit))
    workflows = result.scalars().all()
    
    total_result = await db.execute(select(Workflow))
    total = len(total_result.scalars().all())

    items = []
    for w in workflows:
        wv_res = await db.execute(
            select(WorkflowVersion)
            .where(WorkflowVersion.workflow_id == w.id)
            .order_by(WorkflowVersion.version.desc())
            .limit(1)
        )
        wv = wv_res.scalar_one_or_none()
        tasks_list: list[str] = []
        version_num = 1
        if wv:
            version_num = wv.version
            if wv.definition and "tasks" in wv.definition:
                tasks_list = [t.get("name") or t.get("key", "Step") for t in wv.definition["tasks"]]

        resp = WorkflowResponse(
            id=w.id,
            name=w.name,
            description=w.description,
            is_active=w.is_active,
            active_version=version_num,
            tasks_count=len(tasks_list),
            tasks=tasks_list,
            created_at=w.created_at,
            updated_at=w.updated_at,
        )
        items.append(resp)

    return WorkflowListResponse(
        items=items,
        total=total,
    )


@router.get("/{workflow_id}", response_model=WorkflowDetailResponse)
async def get_workflow(
    workflow_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> WorkflowDetailResponse:
    result = await db.execute(
        select(Workflow).where(Workflow.id == workflow_id)
    )
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow {workflow_id} not found",
        )

    versions_result = await db.execute(
        select(WorkflowVersion)
        .where(WorkflowVersion.workflow_id == workflow_id)
        .order_by(WorkflowVersion.version.desc())
    )
    versions = versions_result.scalars().all()

    return WorkflowDetailResponse(
        id=workflow.id,
        name=workflow.name,
        description=workflow.description,
        is_active=workflow.is_active,
        created_at=workflow.created_at,
        updated_at=workflow.updated_at,
        versions=[
            WorkflowVersionResponse.model_validate(v) for v in versions
        ],
    )


@router.post("/{workflow_id}/runs", response_model=RunResponse, status_code=status.HTTP_201_CREATED)
async def start_workflow_run(
    workflow_id: uuid.UUID,
    run_in: RunCreate | None = None,
    db: AsyncSession = Depends(get_db),
) -> RunResponse:
    if run_in is None:
        run_in = RunCreate()

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
        existing_run_res = await db.execute(
            select(WorkflowRun).where(WorkflowRun.idempotency_key == run_in.idempotency_key)
        )
        existing_run = existing_run_res.scalar_one_or_none()
        if existing_run:
            return RunResponse.model_validate(existing_run)

    now = datetime.now(timezone.utc)
    workflow_run = WorkflowRun(
        workflow_version_id=workflow_version.id,
        status=WorkflowStatus.RUNNING.value,
        idempotency_key=run_in.idempotency_key,
        context_data=run_in.context_data,
        started_at=now,
    )
    db.add(workflow_run)
    await db.flush()

    dag = DAGDefinition(**workflow_version.definition)
    for task_def in dag.tasks:
        task_result = await db.execute(
            select(Task).where(
                Task.workflow_version_id == workflow_version.id,
                Task.task_key == task_def.key,
            )
        )
        task = task_result.scalar_one_or_none()

        if not task:
            task = Task(
                workflow_version_id=workflow_version.id,
                task_key=task_def.key,
                name=task_def.name,
                task_type=task_def.type.value,
                dependencies=task_def.dependencies,
                configuration=task_def.configuration,
                retry_policy=task_def.retry_policy.model_dump(),
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

@router.get("/{workflow_id}/runs", response_model=list[RunResponse])
async def list_workflow_runs(
    workflow_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
) -> list[RunResponse]:
    workflow_result = await db.execute(
        select(Workflow).where(Workflow.id == workflow_id)
    )
    if not workflow_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow {workflow_id} not found",
        )

    versions_result = await db.execute(
        select(WorkflowVersion.id).where(WorkflowVersion.workflow_id == workflow_id)
    )
    version_ids = [row for row in versions_result.scalars().all()]
    
    if not version_ids:
        return []

    runs_result = await db.execute(
        select(WorkflowRun)
        .where(WorkflowRun.workflow_version_id.in_(version_ids))
        .order_by(WorkflowRun.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    runs = runs_result.scalars().all()
    return [RunResponse.model_validate(r) for r in runs]
