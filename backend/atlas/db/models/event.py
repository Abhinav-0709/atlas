import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any
from sqlalchemy import DateTime, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from atlas.db.base import Base, UUIDPrimaryKeyMixin, utc_now

if TYPE_CHECKING:
    from atlas.db.models.workflow_run import WorkflowRun
    from atlas.db.models.task_run import TaskRun


class Event(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "events"
    __table_args__ = (
        Index("ix_events_run_created", "workflow_run_id", "created_at"),
        Index("ix_events_task_created", "task_run_id", "created_at"),
    )

    workflow_run_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workflow_runs.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    task_run_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("task_runs.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    worker_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workers.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    event_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )

    # Relationships
    workflow_run: Mapped["WorkflowRun | None"] = relationship("WorkflowRun", back_populates="events")
    task_run: Mapped["TaskRun | None"] = relationship("TaskRun", back_populates="events")
