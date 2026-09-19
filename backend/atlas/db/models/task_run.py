import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any
from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from atlas.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from atlas.db.models.enums import TaskStatus

if TYPE_CHECKING:
    from atlas.db.models.workflow_run import WorkflowRun
    from atlas.db.models.task import Task
    from atlas.db.models.worker import Worker
    from atlas.db.models.task_attempt import TaskAttempt
    from atlas.db.models.event import Event


class TaskRun(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "task_runs"
    __table_args__ = (
        Index("ix_task_runs_run_status", "workflow_run_id", "status"),
        Index("ix_task_runs_status_lease", "status", "lease_expires_at"),
        Index("ix_task_runs_status_retry", "status", "scheduled_retry_at"),
    )

    workflow_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workflow_runs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tasks.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    task_key: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(
        String(50),
        default=TaskStatus.PENDING.value,
        nullable=False,
    )
    worker_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workers.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    lease_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    scheduled_retry_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    current_attempt: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    input_data: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    output_data: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    workflow_run: Mapped["WorkflowRun"] = relationship("WorkflowRun", back_populates="task_runs")
    task: Mapped["Task"] = relationship("Task", back_populates="task_runs")
    worker: Mapped["Worker | None"] = relationship("Worker", back_populates="task_runs")
    attempts: Mapped[list["TaskAttempt"]] = relationship(
        "TaskAttempt",
        back_populates="task_run",
        cascade="all, delete-orphan",
        order_by="TaskAttempt.attempt_number.asc()",
    )
    events: Mapped[list["Event"]] = relationship(
        "Event",
        back_populates="task_run",
        cascade="all, delete-orphan",
    )
