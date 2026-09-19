import json
import logging
import uuid
import pytest
from httpx import ASGITransport, AsyncClient

from atlas.main import app
from atlas.observability.logging import (
    StructuredJsonFormatter,
    TraceContext,
    current_correlation_id,
    current_workflow_id,
)
from atlas.observability.metrics import (
    get_prometheus_metrics,
    record_expired_lease,
    record_task_result,
    record_task_retry,
    record_workflow_status,
    set_active_workers,
    set_queue_depth,
)


# ==============================================================================
# 1. Prometheus Metrics Tests
# ==============================================================================

def test_prometheus_metric_recorders():
    # Increment metrics
    record_workflow_status("test_workflow", "SUCCESS")
    record_workflow_status("test_workflow", "FAILED")
    record_task_result("HTTP", "SUCCESS", duration_seconds=0.42)
    record_task_result("PYTHON_FUNCTION", "FAILED", duration_seconds=1.2, error_type="ValueError")
    record_task_retry("step_fetch")
    record_expired_lease()
    set_queue_depth(15)
    set_active_workers(4)

    # Render exposition output
    metrics_data = get_prometheus_metrics().decode("utf-8")

    assert "atlas_workflow_runs_total" in metrics_data
    assert "atlas_workflow_failures_total" in metrics_data
    assert "atlas_task_runs_total" in metrics_data
    assert "atlas_task_failures_total" in metrics_data
    assert "atlas_task_retries_total" in metrics_data
    assert "atlas_task_duration_seconds" in metrics_data
    assert "atlas_queue_depth 15" in metrics_data
    assert "atlas_active_workers 4" in metrics_data
    assert "atlas_expired_leases_total" in metrics_data


@pytest.mark.asyncio
async def test_metrics_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/metrics")
        assert response.status_code == 200
        assert "text/plain" in response.headers["content-type"]
        assert "atlas_" in response.text


# ==============================================================================
# 2. Structured JSON Logging Tests
# ==============================================================================

def test_structured_json_formatter_basic():
    formatter = StructuredJsonFormatter()
    record = logging.LogRecord(
        name="atlas.test",
        level=logging.INFO,
        pathname="test.py",
        lineno=10,
        msg="Test event message",
        args=(),
        exc_info=None,
    )

    formatted = formatter.format(record)
    parsed = json.loads(formatted)

    assert parsed["level"] == "INFO"
    assert parsed["logger"] == "atlas.test"
    assert parsed["message"] == "Test event message"
    assert "timestamp" in parsed


def test_trace_context_propagation():
    formatter = StructuredJsonFormatter()
    record = logging.LogRecord(
        name="atlas.worker",
        level=logging.ERROR,
        pathname="worker.py",
        lineno=42,
        msg="Task failed",
        args=(),
        exc_info=None,
    )

    # Initially context is empty
    initial_parsed = json.loads(formatter.format(record))
    assert "workflow_id" not in initial_parsed
    assert "correlation_id" not in initial_parsed

    wf_id = str(uuid.uuid4())
    corr_id = "trace-xyz-999"

    # Within TraceContext
    with TraceContext(workflow_id=wf_id, correlation_id=corr_id):
        inside_parsed = json.loads(formatter.format(record))
        assert inside_parsed["workflow_id"] == wf_id
        assert inside_parsed["correlation_id"] == corr_id

    # After exit, context is reset
    after_parsed = json.loads(formatter.format(record))
    assert "workflow_id" not in after_parsed
    assert "correlation_id" not in after_parsed


# ==============================================================================
# 3. Correlation ID Middleware Tests
# ==============================================================================

@pytest.mark.asyncio
async def test_correlation_id_middleware_generates_header():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. No correlation ID header provided -> server generates one
        response1 = await client.get("/")
        assert response1.status_code == 200
        assert "X-Correlation-ID" in response1.headers
        generated_id = response1.headers["X-Correlation-ID"]
        assert len(generated_id) > 0

        # 2. Correlation ID header provided -> server echoes and preserves it
        custom_id = "custom-trace-header-12345"
        response2 = await client.get("/", headers={"X-Correlation-ID": custom_id})
        assert response2.status_code == 200
        assert response2.headers["X-Correlation-ID"] == custom_id
