from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from atlas.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin, utc_now
from atlas.db.models.enums import WorkerStatus

if TYPE_CHECKING:
    from atlas.db.models.task_run import TaskRun
    from atlas.db.models.task_attempt import TaskAttempt


class Worker(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "workers"

    worker_name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    hostname: Mapped[str] = mapped_column(String(255), nullable=False)
    pid: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(
        String(50),
        default=WorkerStatus.ACTIVE.value,
        nullable=False,
    )
    last_heartbeat_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        index=True,
        nullable=False,
    )
    registered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )

    # Relationships
    task_runs: Mapped[list["TaskRun"]] = relationship("TaskRun", back_populates="worker")
    task_attempts: Mapped[list["TaskAttempt"]] = relationship("TaskAttempt", back_populates="worker")
