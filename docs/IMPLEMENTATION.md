# Atlas — Implementation Plan

## 1. Architecture

Initial architecture:

```text
                     Client
                       |
                       v
                 ┌───────────┐
                 │ API Server│
                 └─────┬─────┘
                       |
                       v
              ┌─────────────────┐
              │ Workflow Engine │
              └────────┬────────┘
                       |
                       v
                 ┌───────────┐
                 │ Scheduler │
                 └─────┬─────┘
                       |
                       v
                  ┌────────┐
                  │  Redis │
                  │ Queue  │
                  └───┬────┘
                      |
          ┌───────────┼───────────┐
          v           v           v
      Worker 1    Worker 2    Worker 3
          |           |           |
          └───────────┼───────────┘
                      |
                      v
                PostgreSQL
                      |
             ┌────────┴────────┐
             v                 v
          Metrics            Logs
             |
             v
       Observability
```

---

## 2. Technology Direction

The initial stack is intentionally simple.

### Backend

- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- Redis

### Workers

- Python worker processes
- Docker for local isolation

### Frontend

- Next.js
- TypeScript

The frontend is not allowed to dictate backend architecture.

### Infrastructure

- Docker / Docker Compose
- Prometheus for metrics
- AWS for later deployment

---

## 3. Major Services

### API Server

Responsible for:

- authentication
- workflow creation
- workflow validation
- workflow versioning
- starting workflow runs
- querying execution state
- controlling runs

The API should not directly execute tasks.

---

### Workflow Engine

Responsible for:

- loading workflow definitions
- validating DAGs
- resolving dependencies
- determining task readiness
- transitioning workflow state
- advancing workflows after task completion

---

### Scheduler

Responsible for:

- finding runnable tasks
- handling scheduled workflows
- placing runnable tasks onto the queue
- respecting concurrency policies

The scheduler should be restartable.

It must not rely on in-memory state as the source of truth.

---

### Queue

Redis is used initially for task delivery.

The queue provides:

- task buffering
- worker consumption
- asynchronous execution
- basic delivery coordination

Important execution state remains in PostgreSQL.

Redis is not the durable source of truth for workflow state.

---

### Worker

A worker:

1. requests a task
2. claims the task
3. starts a heartbeat/lease
4. executes the task
5. records success/failure
6. acknowledges completion
7. releases its lease

Workers must be disposable.

The system should assume workers can disappear at any time.

---

## 4. Database Model

Initial entities:

```text
users
workflows
workflow_versions
workflow_runs
tasks
task_runs
task_attempts
workers
events
```

### workflows

Stores logical workflow identity.

### workflow_versions

Stores immutable workflow definitions.

### workflow_runs

Represents one execution of a workflow.

### tasks

Represents logical tasks inside a workflow version.

### task_runs

Represents execution state for a task within a specific workflow run.

### task_attempts

Stores individual execution attempts.

### workers

Tracks worker identity and liveness.

### events

Stores important execution events for history and debugging.

---

## 5. DAG Execution

A workflow definition should represent:

```text
task_id
name
type
dependencies
configuration
retry_policy
timeout
```

Before execution:

1. validate task IDs
2. validate dependency references
3. detect cycles
4. validate configuration
5. create a workflow version

Workflow versions should be immutable once execution begins.

---

## 6. State Machine

Task state transitions should be explicit.

Example:

```text
PENDING
  |
  v
READY
  |
  v
RUNNING
  |
  +----------+
  |          |
  v          v
SUCCESS    FAILED
             |
             v
          RETRYING
             |
             v
           READY
```

A task must not be able to jump arbitrarily between states.

Invalid transitions must be rejected.

---

## 7. Task Leasing

A worker should not permanently own a task.

When claiming a task:

```text
task
  |
  v
lease acquired
  |
  v
worker executes
```

The worker periodically sends a heartbeat.

If the heartbeat stops:

```text
lease expires
     |
     v
task becomes recoverable
```

Another worker may then claim it.

This prevents abandoned tasks from remaining permanently RUNNING.

---

## 8. Retries

Each task may define:

```text
max_attempts
backoff_strategy
initial_delay
max_delay
jitter
```

Example:

```text
Attempt 1 → FAIL
             |
          2 seconds
             |
Attempt 2 → FAIL
             |
          4 seconds
             |
Attempt 3 → SUCCESS
```

Retries should only happen for retryable failures.

Permanent failures should not be endlessly retried.

---

## 9. Idempotency

Atlas should assume that at-least-once execution can result in duplicate execution.

Every execution must therefore have stable identifiers.

For example:

```text
workflow_run_id
task_run_id
attempt_id
idempotency_key
```

The engine should make state transitions atomic and provide mechanisms for task implementations to safely handle duplicate delivery.

Atlas should not casually claim exactly-once execution.

---

## 10. Recovery

On service startup:

```text
Atlas starts
    |
    v
Load durable state
    |
    v
Find unfinished workflow runs
    |
    v
Find expired task leases
    |
    v
Recover eligible tasks
    |
    v
Resume scheduling
```

Recovery logic must be deterministic and safe to run more than once.

---

## 11. Observability

Atlas should expose metrics such as:

```text
workflow_runs_total
workflow_failures_total
task_runs_total
task_failures_total
task_retries_total
task_duration_seconds
queue_depth
active_workers
expired_leases_total
```

Execution logs should include:

```text
workflow_id
workflow_run_id
task_id
task_run_id
attempt_id
worker_id
timestamp
event
```

---

## 12. Development Order

### Stage 1

Single-process DAG executor.

### Stage 2

Persistent workflow/task state.

### Stage 3

Redis-backed task queue.

### Stage 4

Independent worker processes.

### Stage 5

Worker leases and heartbeats.

### Stage 6

Retries and backoff.

### Stage 7

Crash recovery.

### Stage 8

Idempotency and concurrency control.

### Stage 9

Event history and metrics.

### Stage 10

Dashboard.

### Stage 11

Dockerized distributed deployment.

### Stage 12

Failure testing and load testing.

---

## 13. Testing Strategy

Atlas should test failure, not only success.

Important scenarios:

- worker crashes during execution
- worker crashes after task completion but before acknowledgement
- scheduler restarts
- API restarts
- database temporarily becomes unavailable
- Redis restarts
- task times out
- task repeatedly fails
- duplicate task delivery
- two workers attempt the same task
- workflow contains invalid DAG
- workflow contains a cycle
- service restarts with unfinished workflows

A distributed execution engine is only credible if its failure behavior is tested.
