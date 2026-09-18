# Atlas — Agent Engineering Guide

## 1. Role

You are an engineering agent working on Atlas.

Atlas is a distributed workflow execution engine.

Your job is to implement the system incrementally while preserving correctness, reliability, simplicity, and architectural clarity.

Do not treat Atlas as a generic CRUD application.

---

## 2. Primary Objective

Build a reliable execution engine that can:

```text
Define workflow
      ↓
Validate DAG
      ↓
Create workflow run
      ↓
Schedule ready tasks
      ↓
Queue tasks
      ↓
Workers execute
      ↓
Persist results
      ↓
Advance DAG
      ↓
Recover failures
      ↓
Complete workflow
```

---

## 3. Core Principles

### Backend First

Do not prioritize visual polish over execution correctness.

### Durable State

Important state belongs in PostgreSQL.

### Explicit State Machines

Never change task/workflow states casually.

### Failure Is Normal

Always consider:

> What happens if this process dies here?

### Idempotency

Assume a task may execute more than once.

### Restart Safety

Services must be restartable without corrupting workflow state.

### Simple Before Distributed

Do not introduce complexity until the simpler implementation is understood and working.

---

## 4. Source of Truth

When determining execution state:

```text
PostgreSQL = durable source of truth
Redis      = queue / coordination layer
Worker     = execution process
API        = control plane
```

Never make Redis the only source of durable workflow state.

---

## 5. Coding Rules

### Keep Components Small

Prefer focused modules:

```text
scheduler/
worker/
queue/
workflow/
execution/
recovery/
storage/
observability/
```

Avoid giant service files.

### Type Everything

Use Python type hints.

Prefer explicit models over untyped dictionaries throughout the core engine.

### Validate at Boundaries

Validate:

- API input
- workflow definitions
- task configuration
- state transitions

Do not allow invalid state to propagate into the engine.

### Transactions Matter

Whenever multiple durable state changes must represent one logical transition, use appropriate database transactions.

---

## 6. State Transition Rules

Treat state transitions as a state machine.

Do not write code like:

```python
task.status = "SUCCESS"
```

throughout unrelated modules.

Centralize transition logic.

Example:

```text
PENDING → READY
READY → RUNNING
RUNNING → SUCCESS
RUNNING → FAILED
FAILED → RETRYING
RETRYING → READY
```

Invalid transitions should fail explicitly.

---

## 7. Worker Rules

Workers must be disposable.

Never assume:

```text
worker will finish
worker will stay alive
network will remain available
process will not restart
```

Workers should:

1. claim work
2. establish a lease
3. heartbeat
4. execute
5. persist result
6. release/complete the lease

---

## 8. Scheduler Rules

The scheduler must be safe to restart.

Never rely exclusively on:

```python
scheduled_tasks = {}
```

for important scheduling state.

If the scheduler disappears, another scheduler instance or restarted scheduler must be able to continue from durable state.

---

## 9. Queue Rules

The queue is not the workflow database.

A queue message should identify the work.

The durable state should explain:

```text
what the task is
which workflow it belongs to
what state it is in
how many attempts occurred
which worker owns it
```

---

## 10. Retry Rules

Retries must be explicit.

A retry policy should determine:

```text
whether failure is retryable
maximum attempts
delay
backoff
jitter
```

Do not blindly retry every exception.

---

## 11. Error Handling

Errors should contain useful context.

Prefer:

```text
Workflow ID
Workflow Run ID
Task ID
Task Run ID
Attempt ID
Worker ID
Error Type
Error Message
```

Avoid swallowing exceptions.

Never use broad exception handling merely to keep the process alive.

---

## 12. Logging

Logs should describe execution events.

Good:

```text
task_started
task_completed
task_failed
task_retry_scheduled
worker_lease_expired
workflow_completed
```

Include correlation identifiers.

Do not log secrets, tokens, passwords, or credentials.

---

## 13. API Rules

The API should expose control-plane operations.

Examples:

```text
POST   /workflows
GET    /workflows
GET    /workflows/{id}
POST   /workflows/{id}/runs

GET    /runs/{id}
POST   /runs/{id}/cancel

GET    /runs/{id}/tasks
GET    /runs/{id}/events
```

Do not make the API server execute long-running tasks directly.

---

## 14. Database Rules

Use migrations.

Never manually modify production schema as the normal development workflow.

Use foreign keys and indexes intentionally.

Important indexes should support queries such as:

```text
find ready tasks
find active runs
find expired leases
find tasks for workflow run
find events for workflow run
```

---

## 15. Testing Rules

Every major execution feature should have tests.

Especially test:

```text
DAG validation
state transitions
dependency resolution
task claiming
duplicate claiming
retries
timeouts
lease expiration
worker recovery
scheduler restart
workflow recovery
```

Do not only test the happy path.

---

## 16. Failure Testing

When implementing distributed behavior, deliberately simulate:

```text
worker crash
scheduler crash
database restart
Redis restart
network failure
task timeout
duplicate delivery
```

If the system cannot explain what happens after failure, the feature is incomplete.

---

## 17. Do Not Overengineer

Before introducing a new dependency, ask:

1. What problem does it solve?
2. Can PostgreSQL/Redis/current architecture solve it?
3. Does it make Atlas easier to understand?
4. Does it introduce operational complexity?
5. Is it necessary for V1?

Prefer the smallest solution that correctly solves the problem.

---

## 18. Implementation Workflow

For every feature:

### Step 1

Understand the existing architecture.

### Step 2

Identify affected components.

### Step 3

Define state transitions and failure behavior.

### Step 4

Implement the smallest correct version.

### Step 5

Add tests.

### Step 6

Test failure scenarios.

### Step 7

Update documentation.

### Step 8

Only then improve performance or abstraction.

---

## 19. Definition of Done

A feature is not done when the code compiles.

It is done when:

- implementation works
- happy path is tested
- failure path is considered
- state transitions are correct
- persistence behavior is correct
- logs are useful
- documentation is updated
- no unrelated architecture has been introduced

---

## 20. Agent Decision Rule

When uncertain, prioritize:

```text
Correctness
    ↓
Durability
    ↓
Failure Recovery
    ↓
Concurrency Safety
    ↓
Observability
    ↓
Performance
    ↓
Developer Convenience
    ↓
UI Polish
```

Atlas should be built as an engineering system first and a product demo second.
