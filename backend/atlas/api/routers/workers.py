import uuid
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from atlas.api.schemas.worker import WorkerResponse, WorkerListResponse
from atlas.db.models import Worker
from atlas.db.session import get_db

router = APIRouter(prefix="/workers", tags=["workers"])


@router.get("", response_model=WorkerListResponse)
async def list_workers(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
) -> WorkerListResponse:
    result = await db.execute(select(Worker).offset(skip).limit(limit))
    workers = result.scalars().all()
    
    total_result = await db.execute(select(Worker))
    total = len(total_result.scalars().all())

    return WorkerListResponse(
        items=[WorkerResponse.model_validate(w) for w in workers],
        total=total,
    )
