# Atlas — Project State & Handover Guide (COMPLETION.md)

> **Current Status**: **Phase 1 Complete**. Phase 2 Ready to Begin.  
> **Target Audience**: Any engineer joining the Atlas codebase to continue implementation seamlessly.  
> **Key References**: [docs/IDEA.md](docs/IDEA.md), [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md), [docs/CONSTRAINTS.md](docs/CONSTRAINTS.md), [docs/AGENT(2).md](docs/AGENT(2).md).

---

## 1. Executive Summary

Atlas is a backend-heavy, distributed workflow execution engine. It is designed to orchestrate workflows represented as Directed Acyclic Graphs (DAGs) across disposable, distributed workers with lease-based recovery, explicit state machines, and durable state persistence.

As of **Phase 1 completion**, the core foundation, Python package management via `uv`, the complete database schema with 9 entities, asynchronous database connectivity, initial Alembic migrations, configuration management, health probe endpoints, and automated tests are fully operational and verified.

---

## 2. What Has Been Completed (Phase 1)

### 2.1 Python Tooling & Package Management (`uv`)
- **Package Manager**: Fast Python package management powered by `uv` (using Python `>=3.12`).
- **Dependencies (`backend/pyproject.toml`)**:
  - `fastapi`: Async HTTP API control plane.
  - `uvicorn[standard]`: ASGI server.
  - `sqlalchemy[asyncio]`: Async ORM and SQL toolkit (v2.0+).
  - `asyncpg`: High-performance async PostgreSQL driver.
  - `alembic`: Database schema migrations.
  - `pydantic-settings`: Type-safe application configuration from environment variables.
  - `redis`: Async Redis client for task queues and coordination.
  - `httpx`: Async HTTP client for outbound task executions and API testing.
  - `pytest`, `pytest-asyncio`: Automated test runner configured with `pythonpath = ["."]`.

### 2.2 Configuration Layer (`backend/atlas/config.py`)
- Centralized `Settings` model loading from `.env` and environment variables.
- Configurable database connection string, Redis URL, logging level, lease durations, heartbeat intervals, and reaper timing.

### 2.3 Database Layer (`backend/atlas/db/`)
- **Base & Mixins (`backend/atlas/db/base.py`)**:
  - `Base`: SQLAlchemy `DeclarativeBase`.
  - `UUIDPrimaryKeyMixin`: Generates UUIDv4 primary keys for all entities.
  - `TimestampMixin`: Timezone-aware UTC `created_at` and `updated_at`.
- **Session Provider (`backend/atlas/db/session.py`)**:
  - Async engine configured with connection pooling (`pool_pre_ping=True`).
  - `AsyncSessionLocal` async sessionmaker.
  - `get_db()` async generator dependency for FastAPI route injection.

### 2.4 Domain Data Models (`backend/atlas/db/models/`)
All 9 core entities from the architecture spec have been implemented with foreign keys, cascade behaviors, and high-performance indexes:

| Model | Table | Purpose & Key Design Details |
|---|---|---|
| `User` | `users` | User identity for workflow ownership. Unique indexes on `username` and `email`. |
| `Workflow` | `workflows` | Logical workflow entity with unique `name` index. |
| `WorkflowVersion` | `workflow_versions` | Immutable workflow version. Stores the DAG `definition` as `JSONB`. Unique constraint on `(workflow_id, version)`. |
| `Task` | `tasks` | Logical task definitions inside a workflow version. Stores `task_key`, `dependencies` (`JSONB`), `configuration` (`JSONB`), `retry_policy` (`JSONB`), and `timeout_seconds`. |
| `Worker` | `workers` | Worker registry tracking worker identity (`worker_name`, `hostname`, `pid`), status (`ACTIVE`, `PAUSED`, `DEAD`), and `last_heartbeat_at`. |
| `WorkflowRun` | `workflow_runs` | Execution instance of a `WorkflowVersion`. Contains `status`, `context_data` (`JSONB`), and unique partial index on `idempotency_key`. |
| `TaskRun` | `task_runs` | State of a task within a workflow run. Includes `worker_id`, `lease_expires_at`, `current_attempt`. **Composite indexes**: `(workflow_run_id, status)` for scheduler queries, and `(status, lease_expires_at)` for the lease reaper. |
| `TaskAttempt` | `task_attempts` | Per-execution attempt log. Stores `attempt_number`, `worker_id`, `status`, `error_type`, `error_message`, `logs`, and timings. Unique index on `(task_run_id, attempt_number)`. |
| `Event` | `events` | Append-only audit trail recording state transitions, claiming events, and worker interactions. Indexes on `(workflow_run_id, created_at)` and `(task_run_id, created_at)`. |
| `Enums` | `enums.py` | Type-safe enums: `WorkflowStatus`, `TaskStatus`, `TaskType`, `WorkerStatus`, `EventType`. |

### 2.5 Database Migrations (`backend/alembic/`)
- Async Alembic environment (`env.py`) connected to `atlas.config.settings.DATABASE_URL` and `atlas.db.models.Base.metadata`.
- `0001_initial_schema.py`: Complete initial migration script defining all 9 tables, constraints, foreign keys, and indexes.

### 2.6 Application Entrypoint (`backend/atlas/main.py`)
- FastAPI application instance with metadata, OpenAPI docs enabled.
- `GET /`: Service identification endpoint.
- `GET /health`: Async probe that tests live connectivity to both PostgreSQL (`SELECT 1`) and Redis (`PING`), returning HTTP 200 when healthy or HTTP 503 when degraded.

### 2.7 Infrastructure & Tooling
- `infra/docker-compose.yml`: Multi-container spec for PostgreSQL 16 (Alpine) and Redis 7 (Alpine) with health checks (*kept stopped by default*).
- `.env.example` and `backend/.env`: Local environment configuration templates.
- `.gitignore`: Standard exclusions for Python virtual environments, compiled bytecode, test caches, and secrets.
- Test suite: `backend/tests/test_health_and_models.py` passing (`3 passed in 2.80s`).

---

## 3. Directory Layout

```text
atlas/
├── backend/
│   ├── alembic/
│   │   ├── versions/
│   │   │   └── 0001_initial_schema.py  # DDL for all 9 tables & indexes
│   │   └── env.py                      # Async migration runner
│   ├── alembic.ini                     # Alembic configuration
│   ├── atlas/
│   │   ├── __init__.py                 # Version 0.1.0
│   │   ├── config.py                   # Pydantic Settings
│   │   ├── main.py                     # FastAPI entrypoint & /health probe
│   │   └── db/
│   │       ├── base.py                 # DeclarativeBase, UUIDPrimaryKeyMixin, TimestampMixin
│   │       ├── session.py              # Async engine and get_db session dependency
│   │       └── models/                 # SQLAlchemy 2.0 ORM Models
│   │           ├── __init__.py         # Exports all models & Base
│   │           ├── enums.py            # WorkflowStatus, TaskStatus, TaskType, etc.
│   │           ├── user.py             # User entity
│   │           ├── workflow.py         # Workflow entity
│   │           ├── workflow_version.py # WorkflowVersion entity
│   │           ├── task.py             # Task definition entity
│   │           ├── worker.py           # Worker registry entity
│   │           ├── workflow_run.py     # WorkflowRun execution entity
│   │           ├── task_run.py         # TaskRun state entity
│   │           ├── task_attempt.py     # TaskAttempt execution history entity
│   │           └── event.py            # Event audit trail entity
│   ├── tests/
│   │   └── test_health_and_models.py   # Model integrity & endpoint tests
│   ├── pyproject.toml                  # UV dependencies and test settings
│   └── README.md
├── docs/                               # Architectural constraints & guidebooks
│   ├── AGENT(2).md
│   ├── CONSTRAINTS.md
│   ├── IDEA.md
│   ├── IMPLEMENTATION.md
│   └── timeline.md
├── infra/
│   └── docker-compose.yml              # Postgres 16 & Redis 7 (standby)
├── .env.example
├── .gitignore
├── COMPLETION.md                       # This handover guide
└── README.md
```

---

## 4. How a New Developer Should Complete the Rest

Follow the phases strictly in order. Do not skip to API or UI before the execution engine passes all tests.

---

### Phase 2: In-Process DAG Engine & State Machine
**Goal**: Build the pure, in-memory execution logic and state machine before introducing queues or background workers.

#### What to Build:
1. **DAG Definition & Validation (`backend/atlas/workflow/`)**:
   - `dag.py`: Pydantic schema for DAG validation (`DAGDefinition`, `TaskDefinition`).
   - `validator.py`:
     - Validate task uniqueness within the DAG.
     - Validate that every dependency referenced in `dependencies` exists in the DAG.
     - Detect cycles using Kahn's algorithm or Depth-First Search (raise `CyclicDependencyError`).
2. **Centralized State Machine (`backend/atlas/execution/state_machine.py`)**:
   - Implement strict state transitions. Prohibit direct assignment like `task.status = "SUCCESS"`.
   - Allowed transitions:
     - `PENDING -> READY`
     - `READY -> RUNNING`
     - `RUNNING -> SUCCESS`
     - `RUNNING -> FAILED`
     - `FAILED -> RETRYING`
     - `RETRYING -> READY`
     - `RUNNING -> TIMED_OUT`
     - `FAILED -> DEAD_LETTERED`
   - Raise `InvalidStateTransitionError` for any illegal transition.
3. **Workflow Engine (`backend/atlas/workflow/engine.py`)**:
   - Given a workflow definition and a set of completed task runs, compute which downstream tasks now have all upstream dependencies in `SUCCESS` state.
   - Advance workflow state (`RUNNING -> SUCCESS` when all tasks succeed, or `RUNNING -> FAILED` when an unrecoverable failure occurs).
4. **Controlled Task Types (`backend/atlas/tasks/`)**:
   - Controlled task execution interface (`BaseTask`).
   - `HTTPTask`: Perform outbound HTTP calls via `httpx`.
   - `PythonFunctionTask`: Execute pre-registered safe Python functions.
   - `DelayTask`: Sleep/pause task for testing timing.
   - *(Constraint: No arbitrary remote shell execution)*.
5. **Phase 2 Verification**:
   - Write tests in `backend/tests/test_dag_validator.py`, `backend/tests/test_state_machine.py`, and `backend/tests/test_engine.py`.
   - Ensure a 5-node diamond DAG executes in strict dependency order.

---

### Phase 3: REST API & Redis Task Queue
**Goal**: Expose control-plane endpoints and connect task delivery to Redis.

#### What to Build:
1. **API Routers (`backend/atlas/api/routers/`)**:
   - `workflows.py`: `POST /workflows` (validates DAG & saves version 1), `GET /workflows`, `GET /workflows/{id}`.
   - `runs.py`: `POST /workflows/{id}/runs` (creates `WorkflowRun` + `TaskRun` records in `PENDING`), `GET /runs/{id}`, `POST /runs/{id}/cancel`, `GET /runs/{id}/tasks`, `GET /runs/{id}/events`.
   - `workers.py`: `GET /workers`.
2. **Redis Queue Client (`backend/atlas/queue/`)**:
   - `task_queue.py`: JSON task envelope serialization (`task_run_id`, `task_key`, `workflow_run_id`, `attempt`).
   - Redis List or Stream operations (`rpush`, `blpop`).
3. **Scheduler Loop (`backend/atlas/scheduler/scheduler.py`)**:
   - Background async loop finding `READY` tasks and pushing them onto the Redis queue.
   - Atomic transition of task status to avoid double queuing.

---

### Phase 4: Distributed Workers & Leasing
**Goal**: Run separate, disposable worker processes that claim tasks with leases and heartbeat.

#### What to Build:
1. **Worker Process (`worker/` or `backend/atlas/worker/`)**:
   - Worker startup: Register in `workers` table with hostname, PID, and `ACTIVE` status.
   - Claiming mechanism: Atomically claim tasks using database-level locking (`SELECT ... FOR UPDATE SKIP LOCKED` or conditional update).
   - Lease setting: Assign `worker_id` and set `lease_expires_at = NOW() + 30 seconds`.
2. **Worker Heartbeat (`backend/atlas/worker/heartbeat.py`)**:
   - Periodic background task (every 10 seconds) extending `lease_expires_at` while the task is executing.
3. **Lease Reaper (`backend/atlas/scheduler/lease_reaper.py`)**:
   - Periodic loop (every 15 seconds) scanning `task_runs` where `status = 'RUNNING'` and `lease_expires_at < NOW()`.
   - Expired tasks are reset to `READY` so another worker can claim them; log an `Event` of type `TASK_LEASE_EXPIRED`.

---

### Phase 5: Retries, Crash Recovery & Idempotency
**Goal**: Handle process crashes, service restarts, and duplicate task executions gracefully.

#### What to Build:
1. **Retry Engine (`backend/atlas/execution/retry_policy.py`)**:
   - Read task retry policy (`max_attempts`, `backoff_strategy`, `initial_delay`, `max_delay`, `jitter`).
   - Exponential backoff formula with random jitter.
   - When attempts exceed `max_attempts`, transition task to `DEAD_LETTERED`.
2. **Startup Recovery (`backend/atlas/recovery/startup_recovery.py`)**:
   - On API/scheduler boot, query all unfinished `workflow_runs` and reconcile their active tasks against live workers.
   - Clean up abandoned tasks deterministically.
3. **Idempotency**:
   - Honor `idempotency_key` on `workflow_runs` to return existing runs on duplicate submissions.
   - Ensure workers handle duplicate task deliveries safely.

---

### Phase 6: Observability, Dashboard & Containerization
**Goal**: Expose production metrics, build the operator UI, and package the entire distributed system.

#### What to Build:
1. **Prometheus Metrics (`backend/atlas/observability/metrics.py`)**:
   - Expose `/metrics` with `atlas_workflow_runs_total`, `atlas_task_runs_total`, `atlas_task_failures_total`, `atlas_queue_depth`, `atlas_active_workers`, `atlas_task_duration_seconds`.
   - Structured JSON logging with correlation IDs (`workflow_run_id`, `task_run_id`, `worker_id`).
2. **Next.js Dashboard (`frontend/`)**:
   - Workflow list and trigger interface.
   - Run details showing live DAG graph and task states.
   - Worker fleet monitoring.
3. **Docker Compose Orchestration (`infra/docker-compose.yml`)**:
   - Wire API, Worker replicas, PostgreSQL, Redis, and Prometheus.

---

## 5. Non-Negotiable Engineering Rules (AGENT.md)

1. **PostgreSQL is the single source of truth**: Redis is only a fast buffer for task delivery. Never rely on Redis for workflow state.
2. **At-Least-Once Delivery**: Assume duplicate delivery can happen. Do not claim magical exactly-once execution.
3. **Explicit State Transitions**: Centralize all state transitions in the state machine.
4. **Workers are disposable**: Assume a worker can crash at any second. Tasks must be recovered by the lease reaper.
5. **No arbitrary shell execution**: Stick strictly to controlled task types (`HTTP`, `PYTHON_FUNCTION`, `DELAY`).
6. **Test failures, not just happy paths**: Test worker crashes, duplicate task claims, timeout triggers, and cycle detection.

---

## 6. Developer Quick Commands

All backend commands are run from the `backend/` directory:

```bash
# Navigate to backend
cd backend

# Sync dependencies
uv sync

# Run tests
uv run pytest

# Run FastAPI development server
uv run uvicorn atlas.main:app --reload --port 8000

# Apply migrations (requires PostgreSQL)
uv run alembic upgrade head

# Generate a new migration
uv run alembic revision --autogenerate -m "description_of_change"
```
