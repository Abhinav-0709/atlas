import uuid
from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field


class WorkflowCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    definition: dict[str, Any]


class WorkflowResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str | None
    is_active: bool
    active_version: int = 1
    tasks_count: int = 0
    tasks: list[str] = []
    created_at: datetime
    updated_at: datetime


class WorkflowVersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workflow_id: uuid.UUID
    version: int
    definition: dict[str, Any]
    is_active: bool
    created_at: datetime


class WorkflowDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    versions: list[WorkflowVersionResponse] = []


class WorkflowListResponse(BaseModel):
    items: list[WorkflowResponse]
    total: int
