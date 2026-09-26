import pytest
from httpx import AsyncClient, ASGITransport
from atlas.main import app
from atlas.ml.features import extract_features, JOB_TYPE_MAP, FEATURE_NAMES
from atlas.ml.models.runtime import runtime_predictor
from atlas.ml.models.failure import failure_predictor
from atlas.ml.models.anomaly import anomaly_detector
from atlas.ml.scheduler.scorer import WorkerCandidate, worker_scorer
from atlas.ml.scheduler.policy import scheduler_policy_engine, SchedulerPolicyEngine
from atlas.ml.benchmarks.runner import compare_policies


def test_feature_extraction():
    features = extract_features(
        job_type="PYTHON_FUNCTION",
        input_size_bytes=2048,
        worker_cpu_pct=50.0,
        worker_mem_pct=60.0,
        queue_depth=5,
        retry_count=1,
    )
    assert len(features) == len(FEATURE_NAMES)
    assert features[2] == 50.0
    assert features[3] == 60.0


def test_runtime_predictor():
    features = extract_features(
        job_type="HTTP",
        input_size_bytes=1024,
        worker_cpu_pct=20.0,
        worker_mem_pct=30.0,
        queue_depth=1,
        retry_count=0,
    )
    pred_time = runtime_predictor.predict(features)
    assert isinstance(pred_time, float)
    assert pred_time > 0.0


def test_failure_predictor():
    clean_vec = extract_features(
        job_type="PYTHON_FUNCTION",
        input_size_bytes=512,
        worker_cpu_pct=15.0,
        worker_mem_pct=25.0,
        queue_depth=0,
        retry_count=0,
        worker_historical_failure_rate=0.01,
    )
    prob_clean = failure_predictor.predict_probability(clean_vec)
    assert 0.0 <= prob_clean <= 1.0

    # High retries and high resource strain should yield higher failure risk
    risky_vec = extract_features(
        job_type="PYTHON_FUNCTION",
        input_size_bytes=50000,
        worker_cpu_pct=95.0,
        worker_mem_pct=92.0,
        queue_depth=10,
        retry_count=3,
        worker_historical_failure_rate=0.35,
    )
    prob_risky = failure_predictor.predict_probability(risky_vec)
    assert prob_risky >= prob_clean


def test_anomaly_detector():
    # Normal metrics
    res_normal = anomaly_detector.evaluate_worker(
        worker_id="w-1", cpu_pct=30.0, mem_pct=40.0, avg_latency_sec=1.2, recent_failure_rate=0.01
    )
    assert res_normal.is_anomalous is False
    assert len(res_normal.reasons) == 0

    # Anomalous degraded metrics
    res_bad = anomaly_detector.evaluate_worker(
        worker_id="w-bad", cpu_pct=98.0, mem_pct=95.0, avg_latency_sec=15.0, recent_failure_rate=0.45
    )
    assert res_bad.is_anomalous is True
    assert len(res_bad.reasons) >= 2


def test_worker_scorer_ranks_best_first():
    candidates = [
        WorkerCandidate(
            worker_id="w-bad",
            worker_name="degraded-worker",
            cpu_pct=96.0,
            mem_pct=92.0,
            active_tasks=5,
            historical_failure_rate=0.4,
            avg_latency_sec=8.0,
        ),
        WorkerCandidate(
            worker_id="w-good",
            worker_name="optimal-worker",
            cpu_pct=15.0,
            mem_pct=25.0,
            active_tasks=0,
            historical_failure_rate=0.01,
            avg_latency_sec=0.8,
        ),
    ]

    rankings = worker_scorer.rank_workers(
        job_type="PYTHON_FUNCTION",
        input_size_bytes=1024,
        candidates=candidates,
        queue_depth=1,
        retry_count=0,
    )
    assert len(rankings) == 2
    # The optimal worker must be chosen as rank #1 with highest fitness score
    assert rankings[0].worker_id == "w-good"
    assert rankings[0].total_score > rankings[1].total_score


from atlas.ml.scheduler.policy import scheduler_policy_engine, SchedulerPolicyEngine


def test_scheduler_policy_safety_fallback():
    engine = SchedulerPolicyEngine()
    # Empty candidate list should return None safely
    decision_empty = engine.select_worker("HTTP", 1024, [])
    assert decision_empty.selected_worker is None

    candidates = [
        WorkerCandidate("w1", "worker-1", 10.0, 20.0, 0, 0.0, 0.5),
        WorkerCandidate("w2", "worker-2", 80.0, 80.0, 3, 0.1, 2.0),
    ]
    decision = engine.select_worker("HTTP", 1024, candidates, policy="ML_ASSISTED")
    assert decision.selected_worker is not None
    assert decision.selected_worker.worker_id == "w1"
    assert decision.fallback_occurred is False


def test_benchmark_suite():
    results = compare_policies(num_tasks=30)
    assert "ROUND_ROBIN" in results
    assert "LEAST_LOADED" in results
    assert "ML_ASSISTED" in results

    ml_res = results["ML_ASSISTED"]
    rr_res = results["ROUND_ROBIN"]
    # ML Assisted must achieve lower or equal failure rate and lower latency
    assert ml_res.failure_rate_pct <= rr_res.failure_rate_pct
    assert ml_res.avg_latency_sec <= rr_res.avg_latency_sec


@pytest.mark.asyncio
async def test_ml_api_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Test POST /ml/predict
        resp = await client.post(
            "/ml/predict",
            json={
                "job_type": "PYTHON_FUNCTION",
                "input_size_bytes": 1024,
                "queue_depth": 1,
                "retry_count": 0,
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "success"
        assert "rankings" in data
        assert len(data["rankings"]) > 0
        assert data["selected_worker"] is not None

        # 2. Test GET /ml/benchmark
        bench_resp = await client.get("/ml/benchmark")
        assert bench_resp.status_code == 200
        bench_data = bench_resp.json()
        assert "policies" in bench_data
        assert "ML_ASSISTED" in bench_data["policies"]
        assert "ROUND_ROBIN" in bench_data["policies"]
