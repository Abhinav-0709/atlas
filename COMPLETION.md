# Atlas — Project State & Handover Guide (COMPLETION.md)

> **Current Status**: **Phase 5 Complete (Retries, Crash Recovery & Idempotency)**. Ready for **Phase 6 (Observability, Dashboard & Containerization)**.  
> **Target Audience**: Any engineer joining the Atlas codebase to continue implementation seamlessly.  
> **Key References**: [docs/IDEA.md](docs/IDEA.md), [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md), [docs/CONSTRAINTS.md](docs/CONSTRAINTS.md), [docs/AGENT(2).md](docs/AGENT(2).md).

---

## 1. Executive Summary

Atlas is a backend-heavy, distributed workflow execution engine. It is designed to orchestrate workflows represented as Directed Acyclic Graphs (DAGs) across disposable, distributed workers with lease-based recovery, explicit state machines, and durable state persistence.

All **Phases 1 through 5** are now implemented, code-reviewed, and verified:
1. **Phase 1 (Foundation & Database)**: uv package manager, 9 SQLAlchemy models, async session, Alembic migrations.
2. **Phase 2 (DAG Engine & State Machine)**: Pydantic DAG definitions, DFS 3-color cycle detection, dependency resolution, centralized explicit state transitions, controlled task handlers (`HTTP`, `PYTHON_FUNCTION`, `DELAY`).
3. **Phase 3 (REST API & Redis Queue)**: Complete FastAPI routes for workflows, runs, and workers; Redis async task queue; background scheduler loop; lease reaper loop.
4. **Phase 4 (Distributed Workers & Leasing)**: Standalone worker daemon, atomic task claiming (`UPDATE ... WHERE status='READY'`), heartbeat context renewing leases and worker liveness, task outcome persistence, and terminal workflow detection.
5. **Phase 5 (Retries, Crash Recovery & Idempotency)**: Configurable retry policies (fixed, linear, exponential with jitter), retry scheduler (`RETRYING` vs `DEAD_LETTERED`), on-boot startup crash recovery scan for orphaned tasks and dead workers, and workflow run idempotency key enforcement.

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

## 3. Review of Incoming Work (Phases 2 & 3 Verification)

The incoming commit implemented the pure DAG engine, the state machine, task types, API routers, and Redis task queue. During comprehensive code review, several critical bugs were identified and fixed:

1. **State Machine Lease Recovery Bug Fixed (`backend/atlas/execution/state_machine.py`)**:
   - `_TASK_TRANSITIONS[TaskStatus.RUNNING]` was missing `TaskStatus.READY`. The lease reaper recovering expired worker leases threw `InvalidStateTransitionError`.
   - *Resolution*: Permitted `RUNNING -> READY` transition for lease recovery and added automated test.
2. **Column Name Mismatches Fixed (`scheduler.py` & `runs.py`)**:
   - Code accessed `t.key` on `Task` database records instead of the mapped column `t.task_key`.
   - *Resolution*: Updated to `t.task_key` throughout scheduler and workflow run instantiation.
3. **Pydantic Schema Serialization Mismatches Fixed (`backend/atlas/api/schemas/run.py`)**:
   - `TaskRunResponse` looked for `attempt_count` when the ORM model defines `current_attempt`.
   - `EventResponse` required `task_key` when the ORM model defines `task_run_id`.
   - *Resolution*: Updated schemas with appropriate fields and validation aliases.
4. **REST Route Hierarchy Fixed (`workflows.py` & `runs.py`)**:
   - `POST /workflows/{id}/runs` was erroneously registered under the `/runs` prefix as `/runs/workflows/{id}/runs`.
   - *Resolution*: Moved route to `workflows.py` (`POST /workflows/{workflow_id}/runs`).
5. **Lease Reaper Added to Lifespan (`backend/atlas/main.py`)**:
   - `lease_reaper_loop()` was implemented but never started in FastAPI lifespan. Added background task creation and cancellation alongside `scheduler_loop()`.
6. **Graceful Test Fallback**:
   - Offline tests now gracefully run all unit tests without failing when external Redis/Postgres services are down. `48 passed, 14 skipped`.

---

## 4. Phase 4 Completed: Distributed Workers & Leasing

Phase 4 deliverables are fully built and verified:
1. **Atomic Claiming (`backend/atlas/worker/claimer.py`)**:
   - Executes atomic conditional update `WHERE id = :id AND status = 'READY'`.
   - Guaranteed protection against two workers claiming or executing the same task simultaneously.
   - Automatically initializes `TaskAttempt` and emits `TASK_CLAIMED` audit event.
2. **Heartbeat & Lease Management (`backend/atlas/worker/heartbeat.py`)**:
   - `HeartbeatManager` runs an async background renewal loop extending `lease_expires_at` and touching `Worker.last_heartbeat_at`.
   - Closes and cancels cleanly upon task completion or failure.
3. **AtlasWorker Daemon (`backend/atlas/worker/worker.py` & `main.py`)**:
   - Dispatches tasks to controlled handlers via `executor.py`.
   - Records successes (`output_data`), failures (`error_message`), and timeouts (`TaskTimeoutError`).
   - Emits `TASK_COMPLETED` and `TASK_FAILED` events.
   - Handles graceful shutdown signals (`SIGINT`, `SIGTERM`).
4. **DAG Terminal Advancement (`backend/atlas/scheduler/scheduler.py`)**:
   - Automatically computes overall workflow completion and updates `WorkflowRun` to `SUCCESS` or `FAILED`.
5. **Comprehensive Test Suite (`backend/tests/test_worker.py`)**:
   - 8 new unit tests covering worker registration, atomic claim success, double-claim collision prevention, heartbeat context, and execution error recording.

---

## 5. Phase 5 Completed: Retries, Crash Recovery & Idempotency
 
Phase 5 deliverables are fully built and verified:
1. **Retry Engine (`backend/atlas/execution/retry_policy.py`)**:
   - `compute_backoff_delay`: supports `FIXED`, `LINEAR`, and `EXPONENTIAL` backoff with random jitter (`jitter_factor = 0.2`) bounded by `max_delay`.
   - `should_retry`: enforces attempt thresholds (`current_attempt < max_attempts`).
   - Supports deterministic custom jitter functions for test reproducibility.
2. **Failure Handler & Dead Lettering (`backend/atlas/execution/retry_scheduler.py`)**:
   - `handle_task_failure`: updates `TaskAttempt` (capturing error type, message, completed time), writes `TASK_FAILED` event.
   - If attempts remain: transitions `TaskRun` to `RETRYING`, computes `scheduled_retry_at`, clears worker lease, writes `TASK_RETRY_SCHEDULED` event.
   - If attempts exhausted: transitions `TaskRun` to `DEAD_LETTERED`, writes `TASK_DEAD_LETTERED` event, triggering workflow terminal `FAILED` state.
3. **Startup Crash Recovery Engine (`backend/atlas/recovery/startup_recovery.py`)**:
   - Runs automatically on engine/API startup in `lifespan`.
   - Step 1: Detects active workers whose heartbeats are older than cutoff (60s), marks them `DEAD`, writes `WORKER_HEARTBEAT_TIMEOUT` event.
   - Step 2: Identifies `RUNNING` tasks with expired leases or dead workers, resets their status to `READY`, clears leases, writes `TASK_LEASE_EXPIRED` event.
   - Step 3: Reconciles active workflow runs. Idempotent and deterministic across successive runs.
4. **Scheduler Integration (`backend/atlas/scheduler/scheduler.py`)**:
   - Scheduler loop evaluates `RETRYING` tasks: once `scheduled_retry_at <= now()`, transitions them `RETRYING -> READY`, clears retry timestamp, and enqueues to Redis.
5. **Idempotency Enforcement (`backend/atlas/api/routers/workflows.py`)**:
   - Submitting workflow runs with the same `idempotency_key` returns the existing `RunResponse` idempotently without duplicate runs.
6. **Comprehensive Test Suite (`backend/tests/test_retries_and_recovery.py`)**:
   - 13 new unit tests covering backoff calculations, threshold logic, failure transitions, dead-letter transitions, timeout handling, startup crash recovery, idempotency key responses, and worker failure integration.
   - Full suite passes: `69 passed, 14 skipped in 30.79s`, pyright `0 errors`.

---

## 6. Next: Phase 6 (Observability, Dashboard & Containerization)

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
