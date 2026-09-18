# Atlas — 2-Day Phased Build Plan

> **Status**: Greenfield — only `docs/` exists. Full build from scratch.
> **Stack**: Python · FastAPI · SQLAlchemy · PostgreSQL · Redis · Next.js · Docker Compose
> **Agent Guide**: Follow `AGENT(2).md` — correctness first, no CRUD shortcuts, explicit state machines.
> **Constraints**: No Kubernetes, no exactly-once, no arbitrary remote code exec, PostgreSQL is source of truth.

---

## Overview

The 12 stages from `IMPLEMENTATION.md` are grouped into **6 phases across 2 days**.  
Each phase has a clear deliverable. We stop and commit at the end of every phase.

```
Day 1  Phase 1 → Foundation & Database Models
       Phase 2 → DAG Engine (In-Process)
       Phase 3 → API Server + Redis Queue

Day 2  Phase 4 → Worker Processes + Leasing
       Phase 5 → Retries, Recovery & Idempotency
       Phase 6 → Observability + Dashboard + Docker
```

---

## Day 1

---

### Phase 1 — Foundation & Project Skeleton
**Maps to**: Impl Stage 1 (partial) + Stage 2 (database models)  
**Estimated Time**: ~2–3 hours  
**Deliverable**: Running project with DB migrations, all models, and Docker Compose

#### What We Build
- Monorepo layout with `backend/`, `worker/`, `frontend/`, `infra/`
- Docker Compose: PostgreSQL + Redis services
- Python environment: `pyproject.toml`, dependencies, env config
- Alembic migrations for all 9 entities
- SQLAlchemy ORM models with proper FK, indexes, and constraints
- Basic health-check FastAPI app (proves DB is connected)

#### Files & Folders Created
```
atlas/
├── backend/
│   ├── atlas/
│   │   ├── __init__.py
│   │   ├── config.py               # Settings via pydantic-settings
│   │   ├── db/
│   │   │   ├── base.py             # SQLAlchemy declarative base
│   │   │   ├── session.py          # Async session factory
│   │   │   └── models/
│   │   │       ├── user.py
│   │   │       ├── workflow.py
│   │   │       ├── workflow_version.py
│   │   │       ├── workflow_run.py
│   │   │       ├── task.py
│   │   │       ├── task_run.py
│   │   │       ├── task_attempt.py
│   │   │       ├── worker.py
│   │   │       └── event.py
│   │   └── main.py                 # FastAPI app (health only)
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   │       └── 0001_initial_schema.py
│   └── pyproject.toml
├── infra/
│   └── docker-compose.yml          # postgres + redis
└── .env.example
```

#### Key Decisions
- `task_runs` has composite index on `(workflow_run_id, status)` — powers scheduler queries
- `task_attempts` indexed on `(task_run_id, attempt_number)`
- `workers` table has `last_heartbeat_at` + `lease_expires_at` columns
- All UUIDs as primary keys
- Status enums defined in Python, stored as VARCHAR in DB

#### Definition of Done
- [ ] `docker compose up` brings up postgres + redis healthy
- [ ] `alembic upgrade head` runs with zero errors
- [ ] `GET /health` returns 200 with DB + Redis ping status

---

### Phase 2 — DAG Engine (In-Process, No Queue)
**Maps to**: Impl Stage 1 (complete) + Stage 2 (state machine)  
**Estimated Time**: ~3–4 hours  
**Deliverable**: A fully working single-process DAG executor with correct state transitions

#### What We Build
- DAG definition model (JSON schema for task graph)
- DAG validator: detects cycles, validates dependencies, validates task IDs
- Workflow Engine: loads definitions, resolves ready tasks, advances state
- State machine: explicit transition rules, invalid transitions raise exceptions
- In-process task executor (runs registered Python functions)
- Task types: `HTTP`, `PYTHON_FUNCTION`, `DELAY` (controlled types per CONSTRAINTS §2)
- Full test suite for DAG logic

#### Files Created
```
backend/atlas/
├── workflow/
│   ├── dag.py                      # DAGDefinition, TaskDefinition models
│   ├── validator.py                # Cycle detection, dep validation
│   └── engine.py                   # WorkflowEngine: advance(), get_ready_tasks()
├── execution/
│   ├── state_machine.py            # Explicit transition table + transition()
│   └── executor.py                 # In-process task execution dispatch
├── tasks/
│   ├── base.py                     # BaseTask interface
│   ├── http_task.py                # HTTP task type
│   ├── python_task.py              # Python function task type
│   └── delay_task.py               # Delay/sleep task type
└── tests/
    ├── test_dag_validator.py
    ├── test_state_machine.py
    └── test_engine.py
```

#### State Machine (exact transitions enforced)
```
PENDING   → READY
READY     → RUNNING
RUNNING   → SUCCESS
RUNNING   → FAILED
FAILED    → RETRYING
RETRYING  → READY
RUNNING   → TIMED_OUT
FAILED    → DEAD_LETTERED    (max_attempts exhausted)
```

#### Definition of Done
- [ ] DAG with 5 tasks and 3 dependency levels executes in correct order
- [ ] Cycle detection raises clear error
- [ ] Invalid state transition raises `InvalidTransitionError`
- [ ] `pytest tests/` passes for all DAG + state machine tests

---

### Phase 3 — API Server + Redis Queue
**Maps to**: Impl Stage 3 (Redis queue) + API layer  
**Estimated Time**: ~3–4 hours  
**Deliverable**: REST API for workflow management + task queue integration

#### What We Build
- Complete FastAPI router structure
- Workflow CRUD: create, version, start run
- Run management: get run, cancel run, get run tasks, get run events
- Redis queue integration: enqueue ready tasks, worker polling interface
- Scheduler (first version): background task that finds READY tasks and pushes to Redis
- Request/response Pydantic schemas

#### API Routes (per AGENT §13)
```
POST   /workflows                    # Create workflow definition
GET    /workflows                    # List workflows
GET    /workflows/{id}               # Get workflow
POST   /workflows/{id}/runs          # Start a workflow run

GET    /runs/{id}                    # Get run status
POST   /runs/{id}/cancel             # Cancel run
GET    /runs/{id}/tasks              # Get task run states
GET    /runs/{id}/events             # Get execution events

GET    /workers                      # List registered workers
GET    /health                       # Health check
```

#### Files Created
```
backend/atlas/
├── api/
│   ├── routers/
│   │   ├── workflows.py
│   │   ├── runs.py
│   │   ├── workers.py
│   │   └── health.py
│   └── schemas/
│       ├── workflow.py
│       ├── run.py
│       └── worker.py
├── queue/
│   ├── client.py                    # Redis connection wrapper
│   └── task_queue.py               # enqueue(), dequeue(), ack()
├── scheduler/
│   ├── scheduler.py                 # Background loop: find READY → enqueue
│   └── lease_reaper.py             # Finds expired leases (stub for Phase 4)
└── tests/
    ├── test_api_workflows.py
    └── test_task_queue.py
```

#### Definition of Done
- [ ] `POST /workflows` + `POST /workflows/{id}/runs` creates DB records
- [ ] Scheduler background loop enqueues READY tasks to Redis
- [ ] Tasks appear in Redis queue and can be dequeued
- [ ] API tests pass with test database

---

## Day 2

---

### Phase 4 — Worker Processes + Leasing + Heartbeats
**Maps to**: Impl Stage 4 (workers) + Stage 5 (leases/heartbeats)  
**Estimated Time**: ~3–4 hours  
**Deliverable**: Real independent worker processes with lease lifecycle and failure safety

#### What We Build
- Standalone worker process (runs separately from API)
- Worker registration: writes to `workers` table on startup
- Task claiming with DB-level locking (no two workers claim same task)
- Lease system: `lease_expires_at` set on claim, renewed via heartbeat
- Heartbeat thread: periodic heartbeat updates `last_heartbeat_at`
- Lease reaper: background loop in scheduler finds expired leases → task returned to READY
- Worker graceful shutdown
- Multi-worker support (multiple processes can run concurrently)

#### Files Created
```
worker/
├── atlas_worker/
│   ├── __init__.py
│   ├── worker.py                   # Main worker loop
│   ├── heartbeat.py                # Background heartbeat thread
│   ├── claimer.py                  # Atomic task claiming with SELECT FOR UPDATE
│   └── executor.py                 # Dispatch to task type handler
├── pyproject.toml
└── Dockerfile

backend/atlas/
├── scheduler/
│   └── lease_reaper.py             # COMPLETE: expired lease recovery
└── tests/
    ├── test_worker_claiming.py     # Tests duplicate claiming rejected
    ├── test_heartbeat.py
    └── test_lease_expiry.py
```

#### Lease Logic
```
Worker claims task:
  UPDATE task_runs SET status='RUNNING', worker_id=X,
         lease_expires_at = NOW() + interval '30 seconds'
  WHERE id=? AND status='READY'

Heartbeat (every 10s):
  UPDATE task_runs SET lease_expires_at = NOW() + interval '30 seconds'
  WHERE id=? AND worker_id=X

Lease reaper (every 15s):
  SELECT * FROM task_runs WHERE status='RUNNING'
    AND lease_expires_at < NOW()
  → Transition back to READY
```

#### Definition of Done
- [ ] Two workers running simultaneously, only one claims each task
- [ ] Kill a worker mid-task → lease reaper recovers it within 30s
- [ ] Worker re-registers cleanly on restart
- [ ] `pytest` passes: duplicate claiming test, lease expiry test

---

### Phase 5 — Retries, Recovery & Idempotency
**Maps to**: Impl Stage 6 (retries) + Stage 7 (crash recovery) + Stage 8 (idempotency)  
**Estimated Time**: ~3–4 hours  
**Deliverable**: Production-grade failure handling — retries with backoff, restart recovery, idempotent execution

#### What We Build
- Retry policy per task: `max_attempts`, `backoff_strategy`, `initial_delay`, `max_delay`, `jitter`
- Exponential backoff with jitter implementation
- Retry scheduler: transitions `FAILED → RETRYING → READY` with computed delay
- Startup recovery: on API/scheduler start, scan for:
  - `RUNNING` tasks with no live worker → recover
  - Unfinished `workflow_runs` → re-advance engine
- Idempotency keys on workflow runs and task attempts
- Dead letter queue: `DEAD_LETTERED` state after max_attempts exceeded
- Event log: write events for every significant state transition

#### Files Created
```
backend/atlas/
├── execution/
│   ├── retry_policy.py             # RetryPolicy model + compute_delay()
│   └── retry_scheduler.py          # Schedule next attempt after backoff
├── recovery/
│   └── startup_recovery.py         # On-boot recovery scan
└── tests/
    ├── test_retry_policy.py
    ├── test_backoff.py
    ├── test_startup_recovery.py
    └── test_idempotency.py
```

#### Retry Backoff Formula
```python
delay = min(initial_delay * (2 ** attempt), max_delay)
delay = delay + random.uniform(0, delay * jitter_factor)
```

#### Definition of Done
- [ ] Task fails 3 times → enters `DEAD_LETTERED` state
- [ ] Exponential backoff delays are computed correctly
- [ ] Restart API server with RUNNING tasks → recovery completes < 5s
- [ ] Submitting same workflow run twice with same idempotency key → idempotent response
- [ ] Events table populated for every state transition

---

### Phase 6 — Observability + Dashboard + Docker
**Maps to**: Impl Stage 9 (events/metrics) + Stage 10 (dashboard) + Stage 11 (dockerized)  
**Estimated Time**: ~3–4 hours  
**Deliverable**: Full metrics exposure, Prometheus scraping, Next.js dashboard, all services in Docker

#### What We Build

**Observability**
- Prometheus metrics endpoint `/metrics` (via `prometheus-fastapi-instrumentator`)
- Custom counters/gauges:
  - `atlas_workflow_runs_total`
  - `atlas_task_runs_total`
  - `atlas_task_failures_total`
  - `atlas_task_retries_total`
  - `atlas_task_duration_seconds` (histogram)
  - `atlas_queue_depth` (gauge)
  - `atlas_active_workers` (gauge)
  - `atlas_expired_leases_total`
- Structured JSON logging with correlation IDs (workflow_id, run_id, task_id, worker_id)

**Dashboard (Next.js)**
- Workflow list page
- Workflow run detail: DAG visualization, task states
- Live run status (polling or SSE)
- Worker list with heartbeat status
- Metrics summary panel

**Infrastructure**
- `Dockerfile` for API, Worker, Frontend
- Complete `docker-compose.yml` with all services
- Prometheus + Grafana services in compose
- Health checks on all containers
- `.env` configuration

#### Files Created
```
backend/atlas/
├── observability/
│   ├── metrics.py                  # Prometheus metric definitions
│   ├── logging.py                  # Structured JSON logger
│   └── middleware.py               # Request correlation ID injection

frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx                # Workflow list
│   │   ├── workflows/[id]/page.tsx # Workflow detail
│   │   └── runs/[id]/page.tsx      # Run detail with DAG view
│   ├── components/
│   │   ├── DAGGraph.tsx
│   │   ├── TaskStatusBadge.tsx
│   │   └── WorkerList.tsx
│   └── lib/api.ts                  # API client

infra/
├── docker-compose.yml              # COMPLETE: all 6 services
├── prometheus/
│   └── prometheus.yml
└── grafana/
    └── dashboards/
        └── atlas.json
```

#### Definition of Done
- [ ] `docker compose up` starts all services cleanly
- [ ] `/metrics` endpoint scraped by Prometheus successfully
- [ ] Dashboard shows live workflow/task states
- [ ] Grafana dashboard shows queue depth and task metrics
- [ ] End-to-end flow: create workflow via API → see it complete in dashboard

---

## Full Stage Mapping

| Implementation Stage | Phase | Day |
|---|---|---|
| Stage 1: Single-process DAG executor | Phase 2 | Day 1 |
| Stage 2: Persistent workflow/task state | Phase 1 | Day 1 |
| Stage 3: Redis-backed task queue | Phase 3 | Day 1 |
| Stage 4: Independent worker processes | Phase 4 | Day 2 |
| Stage 5: Worker leases and heartbeats | Phase 4 | Day 2 |
| Stage 6: Retries and backoff | Phase 5 | Day 2 |
| Stage 7: Crash recovery | Phase 5 | Day 2 |
| Stage 8: Idempotency and concurrency | Phase 5 | Day 2 |
| Stage 9: Event history and metrics | Phase 6 | Day 2 |
| Stage 10: Dashboard | Phase 6 | Day 2 |
| Stage 11: Dockerized deployment | Phase 6 | Day 2 |
| Stage 12: Failure + load testing | Post Day 2 |  |

---

## Constraints Checklist (CONSTRAINTS.md)

| Constraint | How Addressed |
|---|---|
| No arbitrary remote code exec | Controlled task types: HTTP, PYTHON_FUNCTION, DELAY only |
| No Kubernetes for V1 | Docker Compose only |
| No multi-region | Single compose stack |
| No exactly-once | At-least-once + idempotency keys |
| No custom message broker | Redis as queue |
| PostgreSQL = source of truth | Redis holds queue messages only; state in PG |
| No SaaS billing | Excluded entirely |
| No visual workflow builder | API-first; JSON workflow definitions |
| No plugin marketplace | Excluded entirely |
| No UI-first | Dashboard built in Phase 6, after engine works |
| No hidden state | Full startup recovery from DB |
| No premature microservices | Monorepo, 3 processes: API, Scheduler(built-in), Worker |

---

## Agent Workflow Per Feature (AGENT §18)

Every feature we build follows this loop:

1. Understand existing architecture
2. Identify affected components
3. Define state transitions + failure behavior
4. Implement smallest correct version
5. Add tests (happy path + failure paths)
6. Test failure scenarios
7. Update docs

**Definition of Done** per AGENT §19: works + tested (happy + failure) + state transitions correct + persistence correct + logs useful + no unrelated architecture added.

---

## Risk Notes

> [!WARNING]  
> **Lease reaper timing**: The lease window (e.g. 30s) must be significantly longer than the heartbeat interval (e.g. 10s). Getting this wrong causes false recoveries. Design these values as config, not hardcoded.

> [!WARNING]  
> **Scheduler concurrency**: In Phase 3, the scheduler runs as a background task inside the API process. In Phase 6 Docker setup, if multiple API replicas run, the scheduler could double-enqueue tasks. Use a Redis distributed lock or move scheduler to its own process.

> [!NOTE]  
> **Stage 12 (Failure + Load Testing)** is intentionally left for after Day 2. It's a validation phase, not a build phase. We'll simulate: worker crash, scheduler crash, DB restart, Redis restart, duplicate delivery, two workers claiming the same task.
