import uuid
from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field


class RunCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    idempotency_key: str | None = Field(default=None, max_length=255)
    context_data: dict[str, Any] = Field(default_factory=dict)


class RunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workflow_version_id: uuid.UUID
    status: str
    idempotency_key: str | None
    context_data: dict[str, Any]
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class TaskRunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workflow_run_id: uuid.UUID
    task_key: str
    status: str
    worker_id: uuid.UUID | None = None
    current_attempt: int = 0
    attempt_count: int = Field(default=0, validation_alias="current_attempt")
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime


class EventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workflow_run_id: uuid.UUID | None = None
    task_run_id: uuid.UUID | None = None
    event_type: str
    task_key: str | None = None
    worker_id: uuid.UUID | None = None
    payload: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class RunDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workflow_version_id: uuid.UUID
    status: str
    idempotency_key: str | None
    context_data: dict[str, Any]
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime
    tasks: list[TaskRunResponse] = []
