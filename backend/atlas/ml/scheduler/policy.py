import logging
from typing import Literal
from atlas.ml.scheduler.scorer import WorkerCandidate, WorkerEvaluation, worker_scorer

logger = logging.getLogger("atlas.ml.policy")

SchedulingPolicy = Literal["FIFO", "ROUND_ROBIN", "LEAST_LOADED", "ML_ASSISTED"]


class SchedulingDecision:
    def __init__(
        self,
        selected_worker: WorkerCandidate | None,
        policy_used: SchedulingPolicy,
        evaluation: WorkerEvaluation | None = None,
        fallback_occurred: bool = False,
    ):
        self.selected_worker = selected_worker
        self.policy_used = policy_used
        self.evaluation = evaluation
        self.fallback_occurred = fallback_occurred


class SchedulerPolicyEngine:
    """Selects target worker using either baseline policies or ML-assisted ranking with safety fallback."""

    def __init__(self):
        self._rr_index = 0

    def select_worker(
        self,
        job_type: str,
        input_size_bytes: int,
        candidates: list[WorkerCandidate],
        policy: SchedulingPolicy = "ML_ASSISTED",
        queue_depth: int = 0,
        retry_count: int = 0,
    ) -> SchedulingDecision:
        if not candidates:
            return SchedulingDecision(None, policy)

        # Baseline: Round Robin
        if policy == "ROUND_ROBIN":
            idx = self._rr_index % len(candidates)
            self._rr_index += 1
            return SchedulingDecision(candidates[idx], "ROUND_ROBIN")

        # Baseline: Least Loaded
        if policy == "LEAST_LOADED":
            best = min(candidates, key=lambda w: (w.active_tasks, w.cpu_pct))
            return SchedulingDecision(best, "LEAST_LOADED")

        # ML-Assisted Scheduling with Guaranteed Fallback
        if policy == "ML_ASSISTED":
            try:
                rankings = worker_scorer.rank_workers(
                    job_type=job_type,
                    input_size_bytes=input_size_bytes,
                    candidates=candidates,
                    queue_depth=queue_depth,
                    retry_count=retry_count,
                )
                if rankings:
                    top_eval = rankings[0]
                    # Map back to candidate object
                    chosen = next((c for c in candidates if c.worker_id == top_eval.worker_id), None)
                    if chosen:
                        return SchedulingDecision(
                            selected_worker=chosen,
                            policy_used="ML_ASSISTED",
                            evaluation=top_eval,
                            fallback_occurred=False,
                        )
            except Exception as e:
                logger.error(f"ML scheduling failure, falling back to LEAST_LOADED: {e}")

            # Safety Fallback
            fallback_worker = min(candidates, key=lambda w: (w.active_tasks, w.cpu_pct))
            return SchedulingDecision(
                selected_worker=fallback_worker,
                policy_used="LEAST_LOADED",
                fallback_occurred=True,
            )

        # Default FIFO fallback
        return SchedulingDecision(candidates[0], "FIFO")


scheduler_policy_engine = SchedulerPolicyEngine()
