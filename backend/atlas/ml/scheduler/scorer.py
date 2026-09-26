from dataclasses import dataclass
from typing import Any
import numpy as np
from atlas.ml.features import extract_features
from atlas.ml.models.anomaly import anomaly_detector
from atlas.ml.models.failure import failure_predictor
from atlas.ml.models.runtime import runtime_predictor


@dataclass
class WorkerCandidate:
    worker_id: str
    worker_name: str
    cpu_pct: float = 20.0
    mem_pct: float = 30.0
    active_tasks: int = 0
    historical_failure_rate: float = 0.05
    avg_latency_sec: float = 2.0


@dataclass
class WorkerEvaluation:
    worker_id: str
    worker_name: str
    total_score: float
    predicted_runtime_sec: float
    failure_probability: float
    anomaly_score: float
    is_anomalous: bool
    reasons: list[str]


class WorkerScorer:
    """Ranks available workers for a given task using runtime, failure, and anomaly predictions."""

    def __init__(
        self,
        weight_runtime: float = 0.35,
        weight_failure: float = 0.40,
        weight_load: float = 0.25,
    ):
        self.weight_runtime = weight_runtime
        self.weight_failure = weight_failure
        self.weight_load = weight_load

    def rank_workers(
        self,
        job_type: str,
        input_size_bytes: int,
        candidates: list[WorkerCandidate],
        queue_depth: int = 0,
        retry_count: int = 0,
    ) -> list[WorkerEvaluation]:
        if not candidates:
            return []

        evaluations: list[WorkerEvaluation] = []

        # Predict metrics for each candidate worker
        for w in candidates:
            features = extract_features(
                job_type=job_type,
                input_size_bytes=input_size_bytes,
                worker_cpu_pct=w.cpu_pct,
                worker_mem_pct=w.mem_pct,
                queue_depth=queue_depth,
                retry_count=retry_count,
                worker_historical_failure_rate=w.historical_failure_rate,
            )

            pred_runtime = runtime_predictor.predict(features)
            fail_prob = failure_predictor.predict_probability(features)
            anomaly = anomaly_detector.evaluate_worker(
                worker_id=w.worker_id,
                cpu_pct=w.cpu_pct,
                mem_pct=w.mem_pct,
                avg_latency_sec=w.avg_latency_sec,
                recent_failure_rate=w.historical_failure_rate,
            )

            # Score calculations (0.0 to 1.0, higher is better)
            # Runtime score: normalized relative to 10s benchmark
            runtime_score = max(0.0, 1.0 - (pred_runtime / 10.0))
            # Failure score: lower risk = higher score
            safety_score = 1.0 - fail_prob
            # Load score: fewer active tasks = higher score
            load_score = max(0.0, 1.0 - (w.active_tasks / 10.0) - (w.cpu_pct / 200.0))

            composite = (
                (self.weight_runtime * runtime_score)
                + (self.weight_failure * safety_score)
                + (self.weight_load * load_score)
            )

            # Penalize anomalous workers heavily
            reasons = []
            if anomaly.is_anomalous:
                composite *= 0.2
                reasons.extend(anomaly.reasons)
            else:
                reasons.append(f"Predicted runtime: {pred_runtime}s")
                reasons.append(f"Failure risk: {fail_prob * 100:.1f}%")
                reasons.append(f"Active load: {w.active_tasks} tasks")

            evaluations.append(
                WorkerEvaluation(
                    worker_id=w.worker_id,
                    worker_name=w.worker_name,
                    total_score=round(composite, 4),
                    predicted_runtime_sec=pred_runtime,
                    failure_probability=fail_prob,
                    anomaly_score=anomaly.anomaly_score,
                    is_anomalous=anomaly.is_anomalous,
                    reasons=reasons,
                )
            )

        # Sort descending by score (highest score first)
        evaluations.sort(key=lambda x: x.total_score, reverse=True)
        return evaluations


worker_scorer = WorkerScorer()
