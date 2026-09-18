import uuid
from typing import TYPE_CHECKING, Any
from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from atlas.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from atlas.db.models.enums import TaskType

if TYPE_CHECKING:
    from atlas.db.models.workflow_version import WorkflowVersion
    from atlas.db.models.task_run import TaskRun


class Task(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "tasks"
    __table_args__ = (
        UniqueConstraint("workflow_version_id", "task_key", name="uq_version_task_key"),
    )

    workflow_version_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workflow_versions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    task_key: Mapped[str] = mapped_column(String(100), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    task_type: Mapped[str] = mapped_column(
        String(50),
        default=TaskType.PYTHON_FUNCTION.value,
        nullable=False,
    )
    dependencies: Mapped[list[str]] = mapped_column(
        JSONB,
        default=list,
        nullable=False,
    )
    configuration: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        default=dict,
        nullable=False,
    )
    retry_policy: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        default=lambda: {
            "max_attempts": 3,
            "backoff_strategy": "exponential",
            "initial_delay": 2,
            "max_delay": 60,
            "jitter": True,
        },
        nullable=False,
    )
    timeout_seconds: Mapped[int] = mapped_column(Integer, default=300, nullable=False)

    # Relationships
    workflow_version: Mapped["WorkflowVersion"] = relationship("WorkflowVersion", back_populates="tasks")
    task_runs: Mapped[list["TaskRun"]] = relationship("TaskRun", back_populates="task")
