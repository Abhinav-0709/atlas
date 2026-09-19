from prometheus_client import (
    CONTENT_TYPE_LATEST,
    Counter,
    Gauge,
    Histogram,
    generate_latest,
)

# 1. Workflow Metrics
WORKFLOW_RUNS_TOTAL = Counter(
    "atlas_workflow_runs_total",
    "Total number of workflow runs by workflow name and terminal status",
    ["workflow_name", "status"],
)

WORKFLOW_FAILURES_TOTAL = Counter(
    "atlas_workflow_failures_total",
    "Total number of workflow run failures by workflow name",
    ["workflow_name"],
)

# 2. Task Metrics
TASK_RUNS_TOTAL = Counter(
    "atlas_task_runs_total",
    "Total number of task execution attempts by task type and status",
    ["task_type", "status"],
)

TASK_FAILURES_TOTAL = Counter(
    "atlas_task_failures_total",
    "Total number of task attempt failures by task type and error type",
    ["task_type", "error_type"],
)

TASK_RETRIES_TOTAL = Counter(
    "atlas_task_retries_total",
    "Total number of task retry events scheduled by task key",
    ["task_key"],
)

TASK_DURATION_SECONDS = Histogram(
    "atlas_task_duration_seconds",
    "Duration of task execution in seconds by task type",
    ["task_type"],
    buckets=(0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0, 120.0, 300.0),
)

# 3. Infrastructure & Queue Metrics
QUEUE_DEPTH = Gauge(
    "atlas_queue_depth",
    "Current number of ready tasks pending in the Redis queue",
)

ACTIVE_WORKERS = Gauge(
    "atlas_active_workers",
    "Current count of active registered workers in the fleet",
)

EXPIRED_LEASES_TOTAL = Counter(
    "atlas_expired_leases_total",
    "Total number of task leases expired and recovered by the lease reaper",
)


# Convenience API functions
def record_workflow_status(workflow_name: str, status: str) -> None:
    WORKFLOW_RUNS_TOTAL.labels(workflow_name=workflow_name, status=status).inc()
    if status.upper() == "FAILED":
        WORKFLOW_FAILURES_TOTAL.labels(workflow_name=workflow_name).inc()


def record_task_result(
    task_type: str,
    status: str,
    duration_seconds: float | None = None,
    error_type: str | None = None,
) -> None:
    TASK_RUNS_TOTAL.labels(task_type=task_type, status=status).inc()
    if duration_seconds is not None and duration_seconds >= 0:
        TASK_DURATION_SECONDS.labels(task_type=task_type).observe(duration_seconds)
    if error_type is not None:
        TASK_FAILURES_TOTAL.labels(task_type=task_type, error_type=error_type).inc()


def record_task_retry(task_key: str) -> None:
    TASK_RETRIES_TOTAL.labels(task_key=task_key).inc()


def record_expired_lease() -> None:
    EXPIRED_LEASES_TOTAL.inc()


def set_queue_depth(depth: int) -> None:
    QUEUE_DEPTH.set(max(0, depth))


def set_active_workers(count: int) -> None:
    ACTIVE_WORKERS.set(max(0, count))


def get_prometheus_metrics() -> bytes:
    """Renders all Prometheus metrics in the Prometheus exposition format."""
    return generate_latest()
