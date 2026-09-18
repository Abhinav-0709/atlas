# Atlas — Distributed Workflow Execution Engine

Atlas is a backend-focused, durable, and recoverable distributed workflow execution engine built around DAG scheduling, state machines, lease-based distributed workers, and strict fault-tolerance.

> 📖 **Developer Handover & Current State**: See [COMPLETION.md](COMPLETION.md) for full details on what has been built in Phase 1 and exact step-by-step instructions for Phase 2 through Phase 6.

---

## 🛠 Project Structure

```
atlas/
├── backend/
│   ├── atlas/
│   │   ├── config.py                 # Pydantic Settings
│   │   ├── main.py                   # FastAPI Application Entrypoint
│   │   └── db/
│   │       ├── base.py               # Declarative Base & Mixins
│   │       ├── session.py            # Async Engine & Session Provider
│   │       └── models/               # All 9 SQLAlchemy Models & Enums
│   ├── alembic/
│   │   └── versions/
│   │       └── 0001_initial_schema.py # Initial Database Migration
│   ├── tests/                        # Automated Pytest Suite
│   └── pyproject.toml                # UV Project & Dependency Definitions
├── infra/
│   └── docker-compose.yml            # PostgreSQL 16 + Redis 7 (do not run until needed)
├── docs/                             # Core Architecture & Agent Guides
└── .env.example
```

---

## 🚀 Getting Started with `uv`

Atlas uses **`uv`** as its fast Python package and project manager.

### 1. Install / Sync Dependencies

Inside the `backend/` directory:

```bash
cd backend
uv sync
```

### 2. Run Database Migrations (When DB is available)

```bash
cd backend
uv run alembic upgrade head
```

### 3. Run the Backend Server

```bash
cd backend
uv run uvicorn atlas.main:app --reload --port 8000
```

### 4. Run Automated Tests

```bash
cd backend
uv run pytest
```
