import uuid
from typing import TYPE_CHECKING, Any
from sqlalchemy import Boolean, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from atlas.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from atlas.db.models.workflow import Workflow
    from atlas.db.models.workflow_run import WorkflowRun
    from atlas.db.models.task import Task


class WorkflowVersion(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "workflow_versions"
    __table_args__ = (
        UniqueConstraint("workflow_id", "version", name="uq_workflow_version"),
    )

    workflow_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workflows.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    definition: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    workflow: Mapped["Workflow"] = relationship("Workflow", back_populates="versions")
    tasks: Mapped[list["Task"]] = relationship(
        "Task",
        back_populates="workflow_version",
        cascade="all, delete-orphan",
    )
    runs: Mapped[list["WorkflowRun"]] = relationship(
        "WorkflowRun",
        back_populates="workflow_version",
    )
