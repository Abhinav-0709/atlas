import uuid
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from atlas.api.schemas.workflow import (
    WorkflowCreate,
    WorkflowResponse,
    WorkflowDetailResponse,
    WorkflowListResponse,
    WorkflowVersionResponse,
)
from atlas.db.models import Workflow, WorkflowVersion
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

    return WorkflowListResponse(
        items=[WorkflowResponse.model_validate(w) for w in workflows],
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
