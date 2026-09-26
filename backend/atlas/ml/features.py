from typing import Any
import numpy as np

JOB_TYPE_MAP = {
    "HTTP": 0,
    "PYTHON_FUNCTION": 1,
    "DELAY": 2,
}

FEATURE_NAMES = [
    "job_type_idx",
    "input_size_kb",
    "worker_cpu_pct",
    "worker_mem_pct",
    "queue_depth",
    "retry_count",
    "worker_historical_failure_rate",
]


def extract_features(
    job_type: str,
    input_size_bytes: int = 0,
    worker_cpu_pct: float = 20.0,
    worker_mem_pct: float = 30.0,
    queue_depth: int = 0,
    retry_count: int = 0,
    worker_historical_failure_rate: float = 0.05,
) -> np.ndarray:
    """Extracts a normalized 1D feature vector for a task and candidate worker."""
    job_idx = JOB_TYPE_MAP.get(job_type.upper(), 1)
    input_kb = max(0.0, input_size_bytes / 1024.0)

    return np.array(
        [
            float(job_idx),
            float(input_kb),
            float(worker_cpu_pct),
            float(worker_mem_pct),
            float(queue_depth),
            float(retry_count),
            float(worker_historical_failure_rate),
        ],
        dtype=np.float32,
    )
