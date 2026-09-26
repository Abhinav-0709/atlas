from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel, Field
from atlas.ml.benchmarks.runner import run_benchmark, compare_policies
from atlas.ml.scheduler.scorer import WorkerCandidate, worker_scorer

router = APIRouter(prefix="/ml", tags=["ml"])


class PredictRequest(BaseModel):
    job_type: str = Field(default="PYTHON_FUNCTION", description="HTTP, PYTHON_FUNCTION, or DELAY")
    input_size_bytes: int = Field(default=4096, ge=0)
    queue_depth: int = Field(default=2, ge=0)
    retry_count: int = Field(default=0, ge=0)
    candidates: list[dict[str, Any]] = Field(
        default_factory=lambda: [
            {"worker_id": "wkr-1", "worker_name": "worker-fast-01", "cpu_pct": 20.0, "mem_pct": 30.0, "active_tasks": 0, "historical_failure_rate": 0.02, "avg_latency_sec": 0.9},
            {"worker_id": "wkr-2", "worker_name": "worker-busy-02", "cpu_pct": 85.0, "mem_pct": 80.0, "active_tasks": 4, "historical_failure_rate": 0.15, "avg_latency_sec": 3.8},
            {"worker_id": "wkr-3", "worker_name": "worker-degraded-03", "cpu_pct": 35.0, "mem_pct": 40.0, "active_tasks": 1, "historical_failure_rate": 0.40, "avg_latency_sec": 7.2},
        ]
    )


@router.post("/predict")
async def predict_and_rank(req: PredictRequest) -> dict[str, Any]:
    """Ranks available workers for a given task using ML runtime and failure prediction."""
    candidates = [
        WorkerCandidate(
            worker_id=c.get("worker_id", "unknown"),
            worker_name=c.get("worker_name", "unknown"),
            cpu_pct=float(c.get("cpu_pct", 20.0)),
            mem_pct=float(c.get("mem_pct", 30.0)),
            active_tasks=int(c.get("active_tasks", 0)),
            historical_failure_rate=float(c.get("historical_failure_rate", 0.05)),
            avg_latency_sec=float(c.get("avg_latency_sec", 1.5)),
        )
        for c in req.candidates
    ]

    rankings = worker_scorer.rank_workers(
        job_type=req.job_type,
        input_size_bytes=req.input_size_bytes,
        candidates=candidates,
        queue_depth=req.queue_depth,
        retry_count=req.retry_count,
    )

    return {
        "status": "success",
        "job_type": req.job_type,
        "selected_worker": rankings[0].worker_name if rankings else None,
        "rankings": [
            {
                "worker_id": r.worker_id,
                "worker_name": r.worker_name,
                "total_score": r.total_score,
                "predicted_runtime_sec": r.predicted_runtime_sec,
                "failure_probability_pct": round(r.failure_probability * 100, 1),
                "is_anomalous": r.is_anomalous,
                "reasons": r.reasons,
            }
            for r in rankings
        ],
    }


@router.get("/benchmark")
async def get_benchmark_comparison() -> dict[str, Any]:
    """Runs and returns an empirical comparison between Round Robin, Least Loaded, and ML-Assisted scheduling."""
    results = compare_policies(num_tasks=100)
    return {
        "workload": "100 heterogeneous DAG tasks across 4 simulated worker profiles",
        "policies": {
            k: {
                "avg_latency_sec": v.avg_latency_sec,
                "p50_latency_sec": v.p50_latency_sec,
                "p95_latency_sec": v.p95_latency_sec,
                "failure_rate_pct": v.failure_rate_pct,
                "throughput_tasks_per_sec": v.throughput_tasks_per_sec,
                "successful_tasks": v.successful_tasks,
                "failed_tasks": v.failed_tasks,
            }
            for k, v in results.items()
        },
    }
