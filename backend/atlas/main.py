from contextlib import asynccontextmanager
from typing import Any
import asyncio
import redis.asyncio as aioredis
from fastapi import Depends, FastAPI, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from atlas import __version__
from atlas.api.routers import workflows, runs, workers
from atlas.config import settings
from atlas.db.session import get_db
from atlas.queue.client import get_redis_pool
from atlas.scheduler.lease_reaper import lease_reaper_loop
from atlas.scheduler.scheduler import scheduler_loop


@asynccontextmanager
async def lifespan(app: FastAPI):
    redis = get_redis_pool()
    app.state.redis = redis
    scheduler_task = asyncio.create_task(scheduler_loop())
    reaper_task = asyncio.create_task(lease_reaper_loop())
    yield
    scheduler_task.cancel()
    reaper_task.cancel()
    await redis.aclose()


app = FastAPI(
    title=settings.APP_NAME,
    version=__version__,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.include_router(workflows.router)
app.include_router(runs.router)
app.include_router(workers.router)


@app.get("/")
async def root() -> dict[str, str]:
    return {
        "service": settings.APP_NAME,
        "version": __version__,
        "status": "online",
        "description": "Atlas Distributed Workflow Execution Engine",
    }


@app.get("/health")
async def health_check(
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    health_status: dict[str, Any] = {
        "status": "healthy",
        "database": "unknown",
        "redis": "unknown",
        "version": __version__,
    }

    # 1. Check PostgreSQL
    try:
        result = await db.execute(text("SELECT 1"))
        if result.scalar() == 1:
            health_status["database"] = "connected"
    except Exception as e:
        health_status["status"] = "unhealthy"
        health_status["database"] = f"error: {str(e)}"

    # 2. Check Redis
    try:
        r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        pong = await r.ping()
        await r.aclose()
        if pong:
            health_status["redis"] = "connected"
    except Exception as e:
        health_status["status"] = "unhealthy"
        health_status["redis"] = f"error: {str(e)}"

    status_code = (
        status.HTTP_200_OK
        if health_status["status"] == "healthy"
        else status.HTTP_503_SERVICE_UNAVAILABLE
    )
    return JSONResponse(status_code=status_code, content=health_status)
