import uuid
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from atlas.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin, utc_now
from atlas.db.models.enums import TaskStatus

if TYPE_CHECKING:
    from atlas.db.models.task_run import TaskRun
    from atlas.db.models.worker import Worker


class TaskAttempt(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "task_attempts"
    __table_args__ = (
        Index("ix_task_attempts_run_attempt", "task_run_id", "attempt_number", unique=True),
    )

    task_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("task_runs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    attempt_number: Mapped[int] = mapped_column(Integer, nullable=False)
    worker_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workers.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(50),
        default=TaskStatus.RUNNING.value,
        nullable=False,
    )
    error_type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    logs: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    task_run: Mapped["TaskRun"] = relationship("TaskRun", back_populates="attempts")
    worker: Mapped["Worker | None"] = relationship("Worker", back_populates="task_attempts")
