import logging
from dataclasses import dataclass
from typing import Any
import numpy as np

logger = logging.getLogger("atlas.ml.anomaly")


@dataclass
class AnomalyResult:
    is_anomalous: bool
    anomaly_score: float
    reasons: list[str]


class WorkerAnomalyDetector:
    """Detects degraded or anomalous worker behavior based on telemetry spikes."""

    def __init__(
        self,
        cpu_threshold: float = 85.0,
        mem_threshold: float = 90.0,
        latency_threshold_sec: float = 12.0,
        failure_rate_threshold: float = 0.35,
    ):
        self.cpu_threshold = cpu_threshold
        self.mem_threshold = mem_threshold
        self.latency_threshold_sec = latency_threshold_sec
        self.failure_rate_threshold = failure_rate_threshold

    def evaluate_worker(
        self,
        worker_id: str,
        cpu_pct: float,
        mem_pct: float,
        avg_latency_sec: float,
        recent_failure_rate: float,
    ) -> AnomalyResult:
        """Evaluates worker telemetry and generates an inspectable anomaly report."""
        reasons = []
        score = 0.0

        if cpu_pct > self.cpu_threshold:
            score += 0.30
            reasons.append(f"High CPU saturation ({cpu_pct:.1f}% > {self.cpu_threshold}%)")

        if mem_pct > self.mem_threshold:
            score += 0.25
            reasons.append(f"High Memory pressure ({mem_pct:.1f}% > {self.mem_threshold}%)")

        if avg_latency_sec > self.latency_threshold_sec:
            score += 0.35
            reasons.append(f"Latency spike ({avg_latency_sec:.1f}s > {self.latency_threshold_sec}s)")

        if recent_failure_rate > self.failure_rate_threshold:
            score += 0.40
            reasons.append(f"Excessive failure rate ({recent_failure_rate * 100:.1f}%)")

        final_score = min(1.0, round(score, 2))
        is_anomalous = final_score >= 0.50

        return AnomalyResult(
            is_anomalous=is_anomalous,
            anomaly_score=final_score,
            reasons=reasons,
        )


anomaly_detector = WorkerAnomalyDetector()
