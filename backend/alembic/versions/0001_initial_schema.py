"""0001_initial_schema

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-09-18 13:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0001_initial_schema"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Users table
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("username", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    # 2. Workflows table
    op.create_table(
        "workflows",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(op.f("ix_workflows_name"), "workflows", ["name"], unique=True)

    # 3. Workflow Versions table
    op.create_table(
        "workflow_versions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("workflow_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False, server_default=sa.text("1")),
        sa.Column("definition", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("workflow_id", "version", name="uq_workflow_version"),
    )
    op.create_index(op.f("ix_workflow_versions_workflow_id"), "workflow_versions", ["workflow_id"])

    # 4. Tasks table
    op.create_table(
        "tasks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("workflow_version_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workflow_versions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("task_key", sa.String(length=100), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("task_type", sa.String(length=50), nullable=False),
        sa.Column("dependencies", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("configuration", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("retry_policy", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("timeout_seconds", sa.Integer(), nullable=False, server_default=sa.text("300")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("workflow_version_id", "task_key", name="uq_version_task_key"),
    )
    op.create_index(op.f("ix_tasks_workflow_version_id"), "tasks", ["workflow_version_id"])

    # 5. Workers table
    op.create_table(
        "workers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("worker_name", sa.String(length=100), nullable=False),
        sa.Column("hostname", sa.String(length=255), nullable=False),
        sa.Column("pid", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False, server_default=sa.text("'ACTIVE'")),
        sa.Column("last_heartbeat_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("registered_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(op.f("ix_workers_worker_name"), "workers", ["worker_name"], unique=True)
    op.create_index(op.f("ix_workers_last_heartbeat_at"), "workers", ["last_heartbeat_at"])

    # 6. Workflow Runs table
    op.create_table(
        "workflow_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("workflow_version_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workflow_versions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False, server_default=sa.text("'PENDING'")),
        sa.Column("idempotency_key", sa.String(length=255), nullable=True),
        sa.Column("context_data", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(op.f("ix_workflow_runs_workflow_version_id"), "workflow_runs", ["workflow_version_id"])
    op.create_index("ix_workflow_runs_status", "workflow_runs", ["status"])
    op.create_index(
        "ix_workflow_runs_idempotency_key",
        "workflow_runs",
        ["idempotency_key"],
        unique=True,
        postgresql_where=sa.text("idempotency_key IS NOT NULL"),
    )

    # 7. Task Runs table
    op.create_table(
        "task_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("workflow_run_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workflow_runs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("task_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tasks.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("task_key", sa.String(length=100), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False, server_default=sa.text("'PENDING'")),
        sa.Column("worker_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workers.id", ondelete="SET NULL"), nullable=True),
        sa.Column("lease_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("current_attempt", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("input_data", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("output_data", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(op.f("ix_task_runs_workflow_run_id"), "task_runs", ["workflow_run_id"])
    op.create_index(op.f("ix_task_runs_task_id"), "task_runs", ["task_id"])
    op.create_index(op.f("ix_task_runs_worker_id"), "task_runs", ["worker_id"])
    op.create_index("ix_task_runs_run_status", "task_runs", ["workflow_run_id", "status"])
    op.create_index("ix_task_runs_status_lease", "task_runs", ["status", "lease_expires_at"])

    # 8. Task Attempts table
    op.create_table(
        "task_attempts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("task_run_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("task_runs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("attempt_number", sa.Integer(), nullable=False),
        sa.Column("worker_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workers.id", ondelete="SET NULL"), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False, server_default=sa.text("'RUNNING'")),
        sa.Column("error_type", sa.String(length=255), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("logs", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(op.f("ix_task_attempts_task_run_id"), "task_attempts", ["task_run_id"])
    op.create_index(op.f("ix_task_attempts_worker_id"), "task_attempts", ["worker_id"])
    op.create_index("ix_task_attempts_run_attempt", "task_attempts", ["task_run_id", "attempt_number"], unique=True)

    # 9. Events table
    op.create_table(
        "events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("workflow_run_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workflow_runs.id", ondelete="CASCADE"), nullable=True),
        sa.Column("task_run_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("task_runs.id", ondelete="CASCADE"), nullable=True),
        sa.Column("worker_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workers.id", ondelete="SET NULL"), nullable=True),
        sa.Column("event_type", sa.String(length=100), nullable=False),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(op.f("ix_events_workflow_run_id"), "events", ["workflow_run_id"])
    op.create_index(op.f("ix_events_task_run_id"), "events", ["task_run_id"])
    op.create_index(op.f("ix_events_worker_id"), "events", ["worker_id"])
    op.create_index(op.f("ix_events_event_type"), "events", ["event_type"])
    op.create_index("ix_events_run_created", "events", ["workflow_run_id", "created_at"])
    op.create_index("ix_events_task_created", "events", ["task_run_id", "created_at"])


def downgrade() -> None:
    op.drop_table("events")
    op.drop_table("task_attempts")
    op.drop_table("task_runs")
    op.drop_table("workflow_runs")
    op.drop_table("workers")
    op.drop_table("tasks")
    op.drop_table("workflow_versions")
    op.drop_table("workflows")
    op.drop_table("users")
