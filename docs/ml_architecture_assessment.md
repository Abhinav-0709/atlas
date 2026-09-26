# Atlas ML Intelligence Architecture Assessment (Phase 1)

This document maps the existing Atlas distributed systems architecture to the insertion points for the ML Intelligence Layer, as defined in `docs/new_ml_plan.md`.

---

## 1. Existing Atlas Component Mapping

```text
                                EXISTING ATLAS ARCHITECTURE
                                             │
1. Where job metadata is generated           ├──► FastAPI Routers & DAG Parser
   • Task key, task type, dependencies       │    (`backend/atlas/workflow/dag.py`)
   • Input configurations, timeouts          │    (`backend/atlas/api/routers/workflows.py`)
                                             │
2. Where scheduling decisions happen         ├──► Scheduler Loop & Task Enqueue
   • Resolving ready tasks                   │    (`backend/atlas/scheduler/scheduler.py`)
   • Placing tasks on Redis queue            │    (`backend/atlas/queue/task_queue.py`)
                                             │
3. Where worker metrics are available        ├──► Workers Table & Heartbeat Manager
   • Worker liveness, heartbeat interval     │    (`backend/atlas/worker/heartbeat.py`)
   • Process PID, hostname, active status    │    (`backend/atlas/db/models/worker.py`)
                                             │
4. Where execution results are recorded      ├──► TaskRun & TaskAttempt Updates
   • Execution duration, started/completed   │    (`backend/atlas/worker/worker.py`)
   • Output data payloads, attempt counts    │    (`backend/atlas/db/models/task_run.py`)
                                             │
5. Where failures & retries are handled      ├──► Retry Scheduler & Lease Reaper
   • State machine transitions               │    (`backend/atlas/execution/retry_scheduler.py`)
   • Lease expiration detection              │    (`backend/atlas/scheduler/lease_reaper.py`)
```

---

## 2. Detailed Component Breakdown

### 2.1 Job Metadata Generation
* **Files**: `backend/atlas/workflow/dag.py`, `backend/atlas/api/routers/workflows.py`
* **Current Behavior**: Workflows and tasks are validated against Pydantic models. Task metadata includes `task_key`, `type` (`HTTP`, `PYTHON_FUNCTION`, `DELAY`), `dependencies`, `configuration`, and `timeout_seconds`.
* **ML Hook Point**: Extract static job features: task type, dependency depth, payload byte size, expected timeout.

### 2.2 Scheduling Decisions
* **Files**: `backend/atlas/scheduler/scheduler.py`, `backend/atlas/queue/task_queue.py`
* **Current Behavior**: `find_ready_tasks()` queries `WorkflowRun` where `status = RUNNING`, identifies tasks whose parents have succeeded, and enqueues them onto a Redis FIFO queue.
* **ML Hook Point**: Before blindly enqueuing to FIFO or allowing arbitrary worker claiming, invoke **Intelligent Worker Selection** (`rank_workers()`) to route tasks to optimal workers based on predicted runtime, failure risk, and worker health score.

### 2.3 Worker Health & Telemetry
* **Files**: `backend/atlas/worker/heartbeat.py`, `backend/atlas/db/models/worker.py`
* **Current Behavior**: Active workers update `last_heartbeat_at` in the `workers` table every 10 seconds.
* **ML Hook Point**: Augment worker heartbeats with runtime system telemetry: CPU usage, memory utilization, queue latency, error rate, and active task count.

### 2.4 Execution Results Recording
* **Files**: `backend/atlas/worker/worker.py`, `backend/atlas/db/models/task_attempt.py`
* **Current Behavior**: When a task finishes, `TaskRun` and `TaskAttempt` record `started_at`, `completed_at`, `output_data`, and status `SUCCESS` or `FAILED`.
* **ML Hook Point**: Emit a structured execution record to the **ML Training Telemetry Pipeline** (`atlas/ml/collector.py`) capturing (job features + worker metrics + actual runtime + outcome).

### 2.5 Failure and Recovery Handling
* **Files**: `backend/atlas/execution/retry_scheduler.py`, `backend/atlas/scheduler/lease_reaper.py`
* **Current Behavior**: When a worker fails or a lease expires, the task is rescheduled with exponential backoff or moved to dead-letter.
* **ML Hook Point**: If **Failure Risk Prediction** or **Anomaly Detection** flags a worker as high-risk, the scheduler automatically drains or penalizes that worker before an actual crash occurs.

---

## 3. The ML Intelligence Module Structure

The ML layer is completely separated from the hot execution path in `backend/atlas/ml/`:

```text
backend/atlas/ml/
├── __init__.py
├── telemetry.py          # Structured metric collector for training data
├── dataset.py            # Dataset extraction, validation, and storage
├── features.py           # Feature engineering & transformation
├── models/
│   ├── base.py           # Abstract predictor interface with fallback safety
│   ├── runtime.py        # Regression model (Linear / Random Forest)
│   ├── failure.py        # Classification model (Failure probability)
│   └── anomaly.py        # Worker health anomaly detector (Isolation/Z-Score)
├── scheduler/
│   ├── scorer.py         # Multi-objective worker scoring with explainability
│   └── policy.py         # Traditional vs ML-assisted scheduling policies
└── benchmarks/
    ├── workloads.py      # Synthetic & reproducible workload generator
    └── runner.py         # Benchmark suite comparing FIFO vs ML-Assisted
```

---

## 4. Safety & Non-Negotiable Fallback

If any ML model fails to load, predictions timeout (>50ms), or input features are corrupted:
1. Log an explanatory warning with trace correlation.
2. Gracefully fall back to the existing traditional policy (Least Loaded / Round Robin).
3. The core distributed engine never halts or drops tasks.
