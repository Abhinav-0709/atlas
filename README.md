<div align="center">

<img src="https://raw.githubusercontent.com/Abhinav-0709/atlas/main/docs/atlas_logo_placeholder.png" alt="Atlas Logo" width="120" />

# ⚡ Atlas

### Distributed Workflow Execution Engine

**A production-grade, fault-tolerant orchestration platform for running complex DAG-based workflows at scale.**

[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![AWS](https://img.shields.io/badge/AWS-Deployed-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)](https://aws.amazon.com)
[![Prometheus](https://img.shields.io/badge/Prometheus-Metrics-E6522C?style=for-the-badge&logo=prometheus&logoColor=white)](https://prometheus.io)

---

🌐 **Live Demo:** [`https://main.d1abc123.amplifyapp.com`](https://main.d1abc123.amplifyapp.com) &nbsp;|&nbsp; 🔌 **API:** [`https://atlas-api.abhinav.sbs`](https://atlas-api.abhinav.sbs) &nbsp;|&nbsp; 📖 **Swagger Docs:** [`/docs`](https://atlas-api.abhinav.sbs/docs)

</div>

---

## 📋 Table of Contents

- [What is Atlas?](#-what-is-atlas)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [AWS Infrastructure](#-aws-infrastructure)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [Task Types](#-task-types)
- [Getting Started](#-getting-started)
- [Deployment Guide](#-deployment)
- [Observability](#-observability)
- [Engineering Principles](#-engineering-principles)
- [Future Development](#-future-development)

---

## 🧠 What is Atlas?

Atlas is a **backend-heavy, distributed workflow execution engine** designed to orchestrate complex workflows modeled as **Directed Acyclic Graphs (DAGs)**. Think of it as your own lightweight version of Apache Airflow or Temporal, built from scratch with modern Python async tooling.

When you register a workflow in Atlas and trigger a run, the system:
1. Validates the DAG structure for cycles and dependency integrity
2. Creates an immutable **WorkflowVersion** snapshot
3. Schedules eligible tasks into a **Redis queue** in topological dependency order
4. Distributed **Worker daemons** atomically claim and execute tasks
5. The **Scheduler** continuously advances ready tasks as dependencies complete
6. A **Lease Reaper** recovers from crashed workers and expired leases automatically
7. Every state transition is **durably persisted** in PostgreSQL — Redis is only a fast delivery buffer

The engine is designed to be resilient to: worker crashes, network partitions, duplicate task delivery, and infrastructure restarts.

---

## ✨ Key Features

| Category | Feature |
|---|---|
| 🔁 **Durability** | PostgreSQL is the single source of truth. Every transition is persisted before acting. |
| 🧩 **DAG Engine** | DFS 3-color cycle detection, topological dependency resolution, DAG immutability via versioning |
| ⚙️ **Task Types** | `HTTP`, `PYTHON_FUNCTION`, `DELAY` — extensible controlled execution handlers |
| 🔒 **Lease-Based Safety** | Atomic claiming with `UPDATE ... WHERE status='READY'`. No double-execution, ever. |
| 💓 **Heartbeating** | Workers continuously renew their lease. Dead workers are detected and their tasks re-queued. |
| 🔄 **Retry Engine** | Per-task configurable retry policies with `FIXED`, `LINEAR`, or `EXPONENTIAL` backoff + jitter |
| ☠️ **Dead Lettering** | Exhausted tasks are moved to `DEAD_LETTERED` and trigger workflow failure |
| 🚀 **Crash Recovery** | On-boot startup scan re-claims orphaned tasks and marks dead workers automatically |
| 🔑 **Idempotency** | Duplicate workflow runs with the same key return the existing run — no double-triggering |
| 📊 **Observability** | Prometheus metrics, structured JSON logging, `X-Correlation-ID` trace propagation |
| 🖥️ **Operator Dashboard** | Real-time dark-mode UI with DAG visualization, worker fleet monitor, and run history |
| 🐳 **Containerized** | Multi-stage Dockerfiles for both API and Worker; full `docker-compose` topology |

---

## 🛠 Tech Stack

### Backend
| Technology | Version | Role |
|---|---|---|
| **Python** | 3.12+ | Core runtime |
| **FastAPI** | 0.115+ | Async REST API framework |
| **SQLAlchemy** | 2.0+ | Async ORM |
| **asyncpg** | latest | High-perf async PostgreSQL driver |
| **Alembic** | latest | Database schema migrations |
| **Redis (aioredis)** | 7 | Task queue and coordination |
| **Pydantic v2** | 2.x | Schema validation, DAG definitions, settings |
| **pydantic-settings** | latest | Type-safe config from env vars |
| **httpx** | latest | Async HTTP client for HTTP task execution |
| **uvicorn** | latest | ASGI server |
| **uv** | latest | Fast package manager |
| **Prometheus Client** | latest | Custom metrics exposition |
| **pytest + pytest-asyncio** | latest | Automated test suite (74 tests) |

### Frontend
| Technology | Version | Role |
|---|---|---|
| **Next.js** | 15 | React framework with App Router |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Tailwind CSS** | 3.x | Utility-first styling |
| **Framer Motion** | latest | Animations and transitions |
| **React Flow** | latest | Interactive DAG visualization |

### Infrastructure
| Technology | Role |
|---|---|
| **Docker + Docker Compose** | Container orchestration |
| **AWS EC2** | Backend API + Worker hosting |
| **AWS RDS (PostgreSQL 16)** | Managed production database |
| **AWS ElastiCache (Redis 7)** | Managed task queue |
| **AWS Amplify** | Frontend CI/CD and hosting |
| **AWS VPC** | Private network isolation |
| **Nginx / Reverse Proxy** | SSL termination and routing |
| **Prometheus** | Metrics collection and scraping |

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT / BROWSER                            │
│                    (Next.js Dashboard on Amplify)                   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS REST
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        ATLAS API (FastAPI)                          │
│                                                                     │
│   ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐   │
│   │  /workflows     │  │  /runs           │  │  /workers       │   │
│   │  POST, GET      │  │  GET, POST       │  │  GET            │   │
│   └────────┬────────┘  └────────┬─────────┘  └────────┬────────┘   │
│            │                    │                      │            │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │              Background Services (Lifespan Tasks)           │   │
│   │   ┌─────────────────────┐   ┌─────────────────────────┐    │   │
│   │   │   Scheduler Loop    │   │   Lease Reaper Loop     │    │   │
│   │   │ (advance DAG tasks) │   │ (reclaim dead workers)  │    │   │
│   │   └─────────┬───────────┘   └────────────┬────────────┘    │   │
│   └─────────────┼────────────────────────────┼─────────────────┘   │
└─────────────────┼────────────────────────────┼─────────────────────┘
                  │ Enqueue READY tasks         │ Scan expired leases
                  ▼                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    REDIS (ElastiCache)                              │
│                  Task Queue (list-based)                            │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ BLPOP / atomic claim
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     WORKER DAEMON (N replicas)                      │
│                                                                     │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │  AtlasWorker                                                 │  │
│   │                                                              │  │
│   │  1. Poll Redis queue for READY tasks                         │  │
│   │  2. Atomic claim: UPDATE task_runs SET status='RUNNING'      │  │
│   │     WHERE status='READY' AND id=:id  (prevents double exec)  │  │
│   │  3. Initialize TaskAttempt + emit TASK_CLAIMED event         │  │
│   │  4. Start HeartbeatManager (renews lease every 10s)          │  │
│   │  5. Execute: HTTP / PYTHON_FUNCTION / DELAY handler          │  │
│   │  6. Persist result → transition to SUCCESS or FAILED         │  │
│   │  7. Retry policy → RETRYING or DEAD_LETTERED                 │  │
│   └──────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ All state changes
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  POSTGRESQL (RDS)  ← Single Source of Truth         │
│                                                                     │
│  workflows  →  workflow_versions  →  tasks                          │
│  workflow_runs  →  task_runs  →  task_attempts  →  events           │
│  workers                                                            │
└─────────────────────────────────────────────────────────────────────┘
```

### DAG Execution State Machine

```
                    ┌─────────┐
                    │ PENDING │  (task created)
                    └────┬────┘
                         │ dependencies resolved
                    ┌────▼────┐
                    │  READY  │  (enqueued to Redis)
                    └────┬────┘
                         │ worker claims
                    ┌────▼────┐
              ┌────►│ RUNNING │◄──────────────────┐
              │     └────┬────┘                   │ lease recovered
              │          │          ┌──────────────┴────────┐
              │    ┌─────▼──────┐   │   lease_expires_at    │
              │    │  SUCCESS   │   │   exceeded, reaper    │
              │    └────────────┘   │   resets to READY     │
              │                     └───────────────────────┘
              │    ┌────────────┐
  retry      │    │   FAILED   │
  scheduled  │    └────┬───────┘
              │         │ attempts remain
              │    ┌────▼────────┐
              └────│  RETRYING   │  (scheduled_retry_at)
                   └─────────────┘
                         │ attempts exhausted
                   ┌─────▼───────┐
                   │DEAD_LETTERED│  → workflow → FAILED
                   └─────────────┘
```

---

## ☁️ AWS Infrastructure

```
┌──────────────────────────── AWS Cloud ─────────────────────────────────┐
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Public Internet                               │  │
│  └────────────────────────────┬─────────────────────────────────────┘  │
│                                │                                        │
│         ┌──────────────────────┼──────────────────────┐                │
│         ▼                      ▼                      ▼                │
│  ┌──────────────┐   ┌──────────────────────┐  ┌─────────────────────┐  │
│  │  AWS Amplify │   │   EC2 (ap-south-1)   │  │    Route 53 / DNS   │  │
│  │  (Frontend)  │   │   t2.micro / Ubuntu  │  │  atlas-api.abhinav  │  │
│  │  Next.js SSR │   │                      │  │  .sbs               │  │
│  │  Auto CI/CD  │   │  ┌────────────────┐  │  └─────────────────────┘  │
│  └──────────────┘   │  │ atlas_api      │  │                           │
│                      │  │ (Docker :8000) │  │                           │
│  ┌──────────────┐   │  └────────────────┘  │                           │
│  │  AWS VPC     │   │  ┌────────────────┐  │                           │
│  │  Private     │   │  │ infra-worker   │  │                           │
│  │  Subnet      │   │  │ (Docker)       │  │                           │
│  │              │   │  └────────────────┘  │                           │
│  │  ┌─────────┐ │   │  ┌────────────────┐  │                           │
│  │  │   RDS   │◄├───┤  │ atlas_prometheus│  │                           │
│  │  │Postgres │ │   │  │ (Docker :9090) │  │                           │
│  │  │   :5432 │ │   │  └────────────────┘  │                           │
│  │  └─────────┘ │   └──────────────────────┘                           │
│  │  ┌─────────┐ │                                                       │
│  │  │  Redis  │◄┘                                                       │
│  │  │Elasticache                                                        │
│  │  │   :6379 │                                                         │
│  │  └─────────┘                                                         │
│  └──────────────┘                                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

| Resource | Service | Purpose |
|---|---|---|
| **Frontend** | AWS Amplify | Auto-build and host Next.js from GitHub `main` branch |
| **Backend API** | EC2 (Ubuntu, ap-south-1) | Runs `atlas_api` Docker container |
| **Worker** | EC2 (same instance) | Runs `infra-worker` Docker container |
| **Database** | AWS RDS (PostgreSQL 16) | Durable persistent state store |
| **Queue** | AWS ElastiCache (Redis 7) | Fast task delivery queue |
| **Monitoring** | Prometheus (Docker, EC2) | Metrics scraping and storage |
| **DNS** | Custom domain | `atlas-api.abhinav.sbs` → EC2 public IP |

---

## 📁 Project Structure

```
atlas/
├── backend/
│   ├── atlas/
│   │   ├── __init__.py                # Version 0.1.0
│   │   ├── config.py                  # Pydantic Settings (env vars)
│   │   ├── main.py                    # FastAPI app, lifespan, /health, /metrics
│   │   ├── exceptions.py              # Custom exception hierarchy
│   │   ├── api/
│   │   │   ├── routers/
│   │   │   │   ├── workflows.py       # CRUD + trigger runs
│   │   │   │   ├── runs.py            # Run detail, task run status
│   │   │   │   └── workers.py         # Worker fleet status
│   │   │   └── schemas/               # Pydantic request/response models
│   │   ├── db/
│   │   │   ├── base.py                # DeclarativeBase, UUID + Timestamp mixins
│   │   │   ├── session.py             # Async engine + get_db() dependency
│   │   │   └── models/                # 9 SQLAlchemy 2.0 ORM models + enums
│   │   ├── workflow/
│   │   │   └── dag.py                 # DAGDefinition, TaskDefinition, cycle detection
│   │   ├── execution/
│   │   │   ├── executor.py            # Task dispatcher → handler registry
│   │   │   ├── state_machine.py       # Centralized state transitions
│   │   │   └── retry_policy.py        # Backoff computation (fixed/linear/exp)
│   │   ├── scheduler/
│   │   │   ├── scheduler.py           # DAG advancement background loop
│   │   │   └── lease_reaper.py        # Dead lease recovery background loop
│   │   ├── worker/
│   │   │   ├── main.py                # Worker daemon entrypoint
│   │   │   ├── worker.py              # AtlasWorker — claim, execute, persist
│   │   │   ├── claimer.py             # Atomic task claiming
│   │   │   └── heartbeat.py           # Lease renewal background loop
│   │   ├── tasks/
│   │   │   ├── registry.py            # @register_function decorator + lookup
│   │   │   ├── http_task.py           # HTTP task (GET/POST/PUT/etc)
│   │   │   ├── delay_task.py          # Delay/sleep task
│   │   │   └── python_task.py         # Registered Python function executor
│   │   ├── queue/
│   │   │   └── client.py              # Redis async client + pool
│   │   ├── recovery/
│   │   │   └── startup_recovery.py    # Boot-time crash recovery scan
│   │   └── observability/
│   │       ├── metrics.py             # Prometheus counters, histograms, gauges
│   │       ├── logging.py             # Structured JSON log formatter
│   │       └── middleware.py          # X-Correlation-ID middleware
│   ├── alembic/
│   │   ├── env.py                     # Async Alembic runner
│   │   └── versions/
│   │       └── 0001_initial_schema.py # DDL for all 9 tables
│   ├── tests/                         # 74 automated tests
│   ├── Dockerfile                     # Multi-stage: API + Worker
│   ├── pyproject.toml                 # uv dependencies
│   └── seed_workflows.py              # Seeder to create demo workflows
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx             # Root layout
│   │   │   ├── page.tsx               # Landing page
│   │   │   └── dashboard/             # Operator dashboard pages
│   │   ├── components/
│   │   │   ├── Navbar.tsx             # Navigation bar
│   │   │   ├── DAGVisualizer.tsx      # Interactive DAG flow diagram
│   │   │   ├── TriggerModal.tsx       # Workflow trigger with JSON context
│   │   │   ├── TaskStatusPill.tsx     # Colored status badge
│   │   │   └── BentoCard.tsx          # Dashboard card component
│   │   └── lib/
│   │       └── api.ts                 # API client (fetch wrapper)
│   └── package.json
│
├── docker-compose.yml                 # API + Worker + Prometheus orchestration
├── docs/                              # Architecture docs, usage guides
├── .env.example                       # Environment variable template
└── README.md
```

---

## 🗄 Database Schema

Atlas uses **9 PostgreSQL tables** as its durable state store:

```
workflows
    │── workflow_versions  (immutable DAG snapshots)
    │       └── tasks      (task definitions per version)
    │
    └── workflow_runs  (execution instances)
            ├── task_runs      (per-task execution state)
            │       └── task_attempts  (per-attempt history)
            └── events         (append-only audit trail)

workers   (live worker registry)
users     (ownership / identity)
```

| Table | Key Columns | Purpose |
|---|---|---|
| `workflows` | `id`, `name`, `is_active` | Logical workflow entity |
| `workflow_versions` | `workflow_id`, `version`, `definition` (JSONB) | Immutable DAG snapshots |
| `tasks` | `workflow_version_id`, `task_key`, `type`, `dependencies` (JSONB), `configuration` (JSONB), `retry_policy` (JSONB) | Task definitions |
| `workflow_runs` | `workflow_version_id`, `status`, `context_data` (JSONB), `idempotency_key` | Run instances |
| `task_runs` | `workflow_run_id`, `status`, `worker_id`, `lease_expires_at`, `current_attempt` | Per-task execution state |
| `task_attempts` | `task_run_id`, `attempt_number`, `status`, `error_message`, `output_data` | Attempt history |
| `events` | `workflow_run_id`, `task_run_id`, `event_type`, `payload` | Append-only audit trail |
| `workers` | `worker_name`, `hostname`, `pid`, `status`, `last_heartbeat_at` | Live worker registry |
| `users` | `username`, `email` | Ownership identity |

---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Service identification |
| `GET` | `/health` | Live health check (DB + Redis) |
| `GET` | `/metrics` | Prometheus metrics exposition |
| `GET` | `/docs` | Interactive Swagger UI |
| `GET` | `/workflows` | List all registered workflows |
| `POST` | `/workflows` | Create a new workflow with DAG definition |
| `GET` | `/workflows/{id}` | Get workflow details |
| `POST` | `/workflows/{id}/runs` | Trigger a new workflow run |
| `GET` | `/workflows/{id}/runs` | List all runs for a workflow |
| `GET` | `/runs/{run_id}` | Get workflow run details + task states |
| `GET` | `/runs/{run_id}/events` | Get audit event stream for a run |
| `GET` | `/workers` | List all registered workers and status |

---

## ⚡ Task Types

### `HTTP` — Make HTTP requests

```json
{
  "key": "notify_slack",
  "name": "Notify Slack",
  "type": "HTTP",
  "dependencies": ["validate_payment"],
  "configuration": {
    "url": "https://hooks.slack.com/services/xxx/yyy/zzz",
    "method": "POST",
    "json_body": { "text": "Payment validated!" },
    "expected_status_codes": [200]
  }
}
```

### `DELAY` — Pause execution

```json
{
  "key": "cooling_period",
  "name": "Wait 30s before retry",
  "type": "DELAY",
  "dependencies": [],
  "configuration": {
    "seconds": 30.0
  }
}
```

### `PYTHON_FUNCTION` — Run registered Python code

First, register the function in backend:
```python
from atlas.tasks.registry import register_function

@register_function("calculate_tax")
def calculate_tax(amount: float, rate: float = 0.2) -> dict:
    return {"total_tax": amount * rate}
```

Then reference it in the workflow definition:
```json
{
  "key": "tax_calc",
  "name": "Calculate Tax",
  "type": "PYTHON_FUNCTION",
  "dependencies": [],
  "configuration": {
    "function": "calculate_tax",
    "kwargs": { "amount": 499.99, "rate": 0.18 }
  }
}
```

### Retry Policies (per task)

```json
{
  "retry_policy": {
    "max_attempts": 5,
    "backoff_strategy": "exponential",
    "initial_delay": 2.0,
    "max_delay": 60.0,
    "jitter": true
  }
}
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.12+
- Node.js 20+
- Docker + Docker Compose
- `uv` package manager

### Install `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 1. Clone the Repository

```bash
git clone https://github.com/Abhinav-0709/atlas.git
cd atlas
```

### 2. Set Up Backend Environment

```bash
cd backend
cp ../.env.example .env
# Edit .env with your PostgreSQL and Redis connection strings
uv sync
```

### 3. Run Infrastructure (PostgreSQL + Redis locally)

```bash
# Start local DB and Redis via docker
docker run -d --name atlas-postgres -e POSTGRES_USER=atlas -e POSTGRES_PASSWORD=atlas_password -e POSTGRES_DB=atlas_db -p 5432:5432 postgres:16-alpine
docker run -d --name atlas-redis -p 6379:6379 redis:7-alpine
```

### 4. Apply Database Migrations

```bash
uv run alembic upgrade head
```

### 5. Start the Backend API

```bash
uv run uvicorn atlas.main:app --reload --port 8000
```

### 6. Start the Worker Daemon

```bash
# In a new terminal
uv run python -m atlas.worker.main
```

### 7. Set Up and Run Frontend

```bash
cd ../frontend
npm install
npm run dev
# Open http://localhost:3000
```

### 8. Run Tests

```bash
cd backend
uv run pytest -v
# Expected: 74 passed, 14 skipped
```

---

## 🐳 Deployment

### Docker Compose (Production)

```bash
# Build and start all services
sudo docker compose up -d --build

# View logs
sudo docker logs -f atlas_api
sudo docker logs -f infra-worker

# Rebuild after code changes
git pull
sudo docker compose up -d --build
```

### AWS EC2 Backend Deployment

```bash
# SSH into your EC2 instance
ssh -i "your-key.pem" ubuntu@YOUR_EC2_IP

# Navigate to project and pull latest
cd atlas
git pull

# Rebuild containers
sudo docker compose up -d --build
```

### AWS Amplify Frontend Deployment

The frontend deploys automatically when you push to `main`:

```bash
git add .
git commit -m "your changes"
git push origin main
# Amplify picks up the push and rebuilds automatically (~2-3 min)
```

### Environment Variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL async connection string | `postgresql+asyncpg://user:pass@host:5432/db` |
| `REDIS_URL` | Redis connection string | `redis://host:6379/0` |
| `APP_ENV` | Environment (`development`/`production`) | `production` |
| `LOG_LEVEL` | Logging verbosity | `INFO` |
| `DEFAULT_LEASE_DURATION_SECONDS` | Task lease TTL | `30` |
| `HEARTBEAT_INTERVAL_SECONDS` | Worker heartbeat frequency | `10` |
| `LEASE_REAPER_INTERVAL_SECONDS` | Lease scan frequency | `15` |

---

## 📊 Observability

Atlas exposes a full **Prometheus metrics** endpoint at `/metrics`:

| Metric | Type | Description |
|---|---|---|
| `atlas_workflow_runs_total` | Counter | Total workflow runs triggered |
| `atlas_workflow_failures_total` | Counter | Total workflow run failures |
| `atlas_task_runs_total` | Counter | Total task executions |
| `atlas_task_failures_total` | Counter | Total task failures |
| `atlas_task_retries_total` | Counter | Total task retries scheduled |
| `atlas_task_duration_seconds` | Histogram | Task execution latency distribution |
| `atlas_queue_depth` | Gauge | Current Redis queue backlog |
| `atlas_active_workers` | Gauge | Healthy worker pool size |
| `atlas_expired_leases_total` | Counter | Lease reaper recovery count |

**Structured JSON Logging** includes `X-Correlation-ID` header propagation across all requests, making distributed tracing easy.

---

## 🏛 Engineering Principles

These rules are non-negotiable and hard-coded into the system design:

1. **PostgreSQL is the single source of truth** — Redis is only a fast delivery buffer. Never rely on Redis for workflow state.
2. **At-Least-Once Delivery** — Assume duplicate delivery can happen. The atomic claiming mechanism prevents double execution.
3. **Explicit State Transitions** — All state changes go through a centralized state machine. No ad-hoc status updates.
4. **Workers are disposable** — A worker can crash at any moment. The Lease Reaper will recover its tasks within one reaper interval.
5. **No arbitrary shell execution** — Only controlled task types (`HTTP`, `PYTHON_FUNCTION`, `DELAY`) are allowed.
6. **Test the failure paths** — The test suite covers worker crashes, duplicate claims, timeout triggers, retry exhaustion, and cycle detection.

---

## 🔮 Future Development

The following features are planned for future phases of Atlas:

### Phase 7 — Authentication & Multi-Tenancy
- [ ] JWT-based authentication (`/auth/token`, `/auth/refresh`)
- [ ] User registration, login, and session management
- [ ] Workflow ownership scoped to authenticated users
- [ ] API key support for programmatic access
- [ ] Role-based access control (RBAC): `viewer`, `operator`, `admin`

### Phase 8 — Workflow Scheduling & Triggers
- [ ] **Cron-based scheduling** — register workflows to trigger on a cron expression
- [ ] **Webhook triggers** — trigger workflow runs from external HTTP webhooks
- [ ] **Event-driven triggers** — start workflows based on events (e.g., S3 uploads, SNS messages)
- [ ] **Workflow chaining** — output of one workflow triggers another

### Phase 9 — Advanced Task Types
- [ ] **DATABASE task** — execute parameterized SQL queries against registered data sources
- [ ] **EMAIL task** — send transactional emails via SMTP / SES
- [ ] **GRPC task** — invoke gRPC endpoints
- [ ] **SUBPROCESS task** — controlled sandboxed subprocess execution
- [ ] **CONDITIONAL task** — dynamic branching based on upstream task output

### Phase 10 — Scalability & High Availability
- [ ] **Horizontal Worker Scaling** — auto-scale worker replicas based on queue depth
- [ ] **Worker pools** — dedicated workers for specific task types or priorities
- [ ] **Workflow priorities** — high-priority workflows jump the queue
- [ ] **Rate limiting** — per-workflow and per-worker execution rate caps
- [ ] **Kubernetes deployment** — Helm chart for K8s-native deployment

### Phase 11 — Developer Experience
- [ ] **Python SDK** — `from atlas import workflow, task` decorator API
- [ ] **CLI tool** — `atlas trigger`, `atlas status`, `atlas logs` commands
- [ ] **GitHub Actions integration** — trigger workflow runs as part of CI/CD pipelines
- [ ] **OpenTelemetry support** — distributed traces exported to Jaeger / Tempo
- [ ] **Workflow linting** — pre-flight DAG validation before registration

### Phase 12 — Enterprise Features
- [ ] **Audit logging** — full immutable event trail with search and export
- [ ] **Cost estimation** — estimated execution time and resource costs per workflow
- [ ] **SLA monitoring** — alert when workflows breach expected completion SLAs
- [ ] **Multi-region deployment** — active-active worker fleets across AWS regions
- [ ] **Secrets management** — AWS Secrets Manager integration for task credentials

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with ❤️ by **Abhinav**

⭐ Star this repo if you found it useful!

</div>
