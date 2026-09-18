import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any
from sqlalchemy import DateTime, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from atlas.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from atlas.db.models.enums import WorkflowStatus

if TYPE_CHECKING:
    from atlas.db.models.workflow_version import WorkflowVersion
    from atlas.db.models.task_run import TaskRun
    from atlas.db.models.event import Event


class WorkflowRun(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "workflow_runs"
    __table_args__ = (
        Index("ix_workflow_runs_status", "status"),
        Index("ix_workflow_runs_idempotency_key", "idempotency_key", unique=True, postgresql_where="idempotency_key IS NOT NULL"),
    )

    workflow_version_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workflow_versions.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(50),
        default=WorkflowStatus.PENDING.value,
        nullable=False,
    )
    idempotency_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    context_data: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict, nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    workflow_version: Mapped["WorkflowVersion"] = relationship("WorkflowVersion", back_populates="runs")
    task_runs: Mapped[list["TaskRun"]] = relationship(
        "TaskRun",
        back_populates="workflow_run",
        cascade="all, delete-orphan",
    )
    events: Mapped[list["Event"]] = relationship(
        "Event",
        back_populates="workflow_run",
        cascade="all, delete-orphan",
    )
