import random
import time
from dataclasses import dataclass
from typing import Any
import numpy as np
from atlas.ml.scheduler.policy import SchedulingPolicy, scheduler_policy_engine
from atlas.ml.scheduler.scorer import WorkerCandidate


@dataclass
class BenchmarkTask:
    job_id: str
    job_type: str
    input_size_bytes: int


@dataclass
class BenchmarkMetrics:
    policy: str
    total_tasks: int
    successful_tasks: int
    failed_tasks: int
    failure_rate_pct: float
    avg_latency_sec: float
    p50_latency_sec: float
    p95_latency_sec: float
    throughput_tasks_per_sec: float


def run_benchmark(
    num_tasks: int = 100,
    policy: SchedulingPolicy = "ML_ASSISTED",
    random_seed: int = 42,
) -> BenchmarkMetrics:
    """Executes a deterministic simulated workload across candidate workers with varying properties."""
    random.seed(random_seed)
    np.random.seed(random_seed)

    # 4 synthetic workers with realistic heterogeneous characteristics
    workers = [
        WorkerCandidate("w-fast-01", "Fast-Compute-01", cpu_pct=25.0, mem_pct=35.0, historical_failure_rate=0.02, avg_latency_sec=0.8),
        WorkerCandidate("w-med-02", "Standard-Node-02", cpu_pct=40.0, mem_pct=45.0, historical_failure_rate=0.05, avg_latency_sec=1.5),
        WorkerCandidate("w-busy-03", "Overloaded-03", cpu_pct=88.0, mem_pct=85.0, active_tasks=6, historical_failure_rate=0.20, avg_latency_sec=4.2),
        WorkerCandidate("w-degraded-04", "Degraded-Disk-04", cpu_pct=30.0, mem_pct=40.0, historical_failure_rate=0.45, avg_latency_sec=8.5),
    ]

    latencies = []
    failures = 0
    start_wall_time = time.perf_counter()

    for i in range(num_tasks):
        job_type = random.choice(["HTTP", "PYTHON_FUNCTION", "DELAY"])
        task = BenchmarkTask(
            job_id=f"bench-job-{i}",
            job_type=job_type,
            input_size_bytes=random.randint(1024, 20000),
        )

        decision = scheduler_policy_engine.select_worker(
            job_type=task.job_type,
            input_size_bytes=task.input_size_bytes,
            candidates=workers,
            policy=policy,
        )

        worker = decision.selected_worker or workers[0]

        # Simulate execution based on worker profile
        simulated_time = max(0.2, worker.avg_latency_sec + random.gauss(0, 0.2))
        latencies.append(simulated_time)

        # Simulate failure based on worker failure rate
        if random.random() < worker.historical_failure_rate:
            failures += 1

    total_wall_time = time.perf_counter() - start_wall_time
    # Effective latency metrics
    lat_arr = np.array(latencies)
    avg_lat = float(np.mean(lat_arr))
    p50_lat = float(np.percentile(lat_arr, 50))
    p95_lat = float(np.percentile(lat_arr, 95))

    successes = num_tasks - failures
    failure_pct = round((failures / num_tasks) * 100, 2)
    throughput = round(num_tasks / sum(latencies), 2)

    return BenchmarkMetrics(
        policy=policy,
        total_tasks=num_tasks,
        successful_tasks=successes,
        failed_tasks=failures,
        failure_rate_pct=failure_pct,
        avg_latency_sec=round(avg_lat, 2),
        p50_latency_sec=round(p50_lat, 2),
        p95_latency_sec=round(p95_lat, 2),
        throughput_tasks_per_sec=throughput,
    )


def compare_policies(num_tasks: int = 150):
    """Directly compares Baseline (Round Robin, Least Loaded) vs ML-Assisted Scheduling."""
    print("=" * 65)
    print("  ATLAS EMPIRICAL SCHEDULER BENCHMARK (Baseline vs ML-Assisted)")
    print("=" * 65)
    policies: list[SchedulingPolicy] = ["ROUND_ROBIN", "LEAST_LOADED", "ML_ASSISTED"]
    results = {}

    for p in policies:
        metrics = run_benchmark(num_tasks=num_tasks, policy=p)
        results[p] = metrics
        print(f"\nPolicy: {metrics.policy}")
        print(f"  • Avg Latency:    {metrics.avg_latency_sec}s (P50: {metrics.p50_latency_sec}s, P95: {metrics.p95_latency_sec}s)")
        print(f"  • Failure Rate:   {metrics.failure_rate_pct}% ({metrics.failed_tasks} failed / {metrics.total_tasks} total)")
        print(f"  • Throughput:     {metrics.throughput_tasks_per_sec} tasks/sec")

    print("\n" + "=" * 65)
    ml_res = results["ML_ASSISTED"]
    rr_res = results["ROUND_ROBIN"]
    ll_res = results["LEAST_LOADED"]

    lat_improvement = round(((rr_res.avg_latency_sec - ml_res.avg_latency_sec) / rr_res.avg_latency_sec) * 100, 1)
    fail_reduction = round(((rr_res.failure_rate_pct - ml_res.failure_rate_pct) / max(0.1, rr_res.failure_rate_pct)) * 100, 1)

    print(f"  VERIFIABLE OUTCOME:")
    print(f"  • Latency Reduction vs Round Robin: {lat_improvement}%")
    print(f"  • Failure Rate Reduction:           {fail_reduction}%")
    print("=" * 65)
    return results


if __name__ == "__main__":
    compare_policies()
