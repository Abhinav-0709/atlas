from typing import TYPE_CHECKING
from sqlalchemy import Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from atlas.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from atlas.db.models.workflow_version import WorkflowVersion


class Workflow(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "workflows"

    name: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    versions: Mapped[list["WorkflowVersion"]] = relationship(
        "WorkflowVersion",
        back_populates="workflow",
        cascade="all, delete-orphan",
        order_by="WorkflowVersion.version.desc()",
    )
