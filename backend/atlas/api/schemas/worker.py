import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class WorkerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    worker_name: str
    hostname: str
    pid: int
    status: str
    last_heartbeat_at: datetime | None
    registered_at: datetime
    created_at: datetime


class WorkerListResponse(BaseModel):
    items: list[WorkerResponse]
    total: int
