"""0002_add_scheduled_retry_at

Revision ID: 0002_add_scheduled_retry_at
Revises: 0001_initial_schema
Create Date: 2026-09-19 14:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0002_add_scheduled_retry_at"
down_revision: Union[str, Sequence[str], None] = "0001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "task_runs",
        sa.Column("scheduled_retry_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_task_runs_status_retry",
        "task_runs",
        ["status", "scheduled_retry_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_task_runs_status_retry", table_name="task_runs")
    op.drop_column("task_runs", "scheduled_retry_at")
