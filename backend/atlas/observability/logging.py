import json
import logging
from contextvars import ContextVar
from datetime import datetime, timezone
from typing import Any

# Context variables for trace propagation
current_correlation_id: ContextVar[str | None] = ContextVar("correlation_id", default=None)
current_workflow_id: ContextVar[str | None] = ContextVar("workflow_id", default=None)
current_workflow_run_id: ContextVar[str | None] = ContextVar("workflow_run_id", default=None)
current_task_run_id: ContextVar[str | None] = ContextVar("task_run_id", default=None)
current_worker_id: ContextVar[str | None] = ContextVar("worker_id", default=None)


class StructuredJsonFormatter(logging.Formatter):
    """Formats log records as structured JSON with distributed tracing context."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Add trace context if set
        correlation_id = current_correlation_id.get()
        if correlation_id:
            log_entry["correlation_id"] = correlation_id

        workflow_id = current_workflow_id.get()
        if workflow_id:
            log_entry["workflow_id"] = workflow_id

        workflow_run_id = current_workflow_run_id.get()
        if workflow_run_id:
            log_entry["workflow_run_id"] = workflow_run_id

        task_run_id = current_task_run_id.get()
        if task_run_id:
            log_entry["task_run_id"] = task_run_id

        worker_id = current_worker_id.get()
        if worker_id:
            log_entry["worker_id"] = worker_id

        # Add exception details if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry)


class TraceContext:
    """Context manager to bind trace identifiers to the current async execution context."""

    def __init__(
        self,
        correlation_id: str | None = None,
        workflow_id: str | None = None,
        workflow_run_id: str | None = None,
        task_run_id: str | None = None,
        worker_id: str | None = None,
    ) -> None:
        self.correlation_id = correlation_id
        self.workflow_id = workflow_id
        self.workflow_run_id = workflow_run_id
        self.task_run_id = task_run_id
        self.worker_id = worker_id
        self._tokens: list[tuple[ContextVar[Any], Any]] = []

    def __enter__(self) -> "TraceContext":
        if self.correlation_id is not None:
            self._tokens.append((current_correlation_id, current_correlation_id.set(self.correlation_id)))
        if self.workflow_id is not None:
            self._tokens.append((current_workflow_id, current_workflow_id.set(self.workflow_id)))
        if self.workflow_run_id is not None:
            self._tokens.append((current_workflow_run_id, current_workflow_run_id.set(self.workflow_run_id)))
        if self.task_run_id is not None:
            self._tokens.append((current_task_run_id, current_task_run_id.set(self.task_run_id)))
        if self.worker_id is not None:
            self._tokens.append((current_worker_id, current_worker_id.set(self.worker_id)))
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        for var, token in reversed(self._tokens):
            var.reset(token)


def setup_structured_logging(log_level: int = logging.INFO) -> None:
    """Configures structured JSON logging on root and application loggers."""
    handler = logging.StreamHandler()
    handler.setFormatter(StructuredJsonFormatter())

    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    # Replace existing handlers
    root_logger.handlers = [handler]
