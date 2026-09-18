# Atlas — Project Idea

## 1. What Are We Building?

Atlas is a backend-heavy distributed workflow execution engine.

It allows users to define workflows as DAGs (Directed Acyclic Graphs) and reliably execute the individual tasks that make up those workflows across a pool of workers.

Atlas is not primarily a workflow UI. The core product is the execution engine underneath it:

- workflow orchestration
- DAG scheduling
- task queues
- distributed workers
- durable execution state
- retries and backoff
- task timeouts
- worker heartbeats and leases
- failure recovery
- idempotent task execution
- execution history
- logs and metrics

The dashboard exists mainly to observe and control the engine.

---

## 2. The Problem

Executing one background task is easy.

Reliably executing thousands of dependent tasks is not.

Real systems have to handle:

- workers crashing
- machines restarting
- network failures
- slow or unavailable services
- duplicate task delivery
- tasks timing out
- concurrent workers attempting the same task
- partially completed workflows
- scheduler failures
- retries creating duplicate side effects

Atlas solves the infrastructure problem of making background workflows **durable, observable, and recoverable**.

---

## 3. Example

A user could define:

```text
Fetch Users
     |
     +------> Validate Users
     |
     +------> Transform Users
                 |
                 v
            Generate Report
                 |
                 v
              Send Email
```

Atlas determines which tasks are ready, schedules them, assigns them to workers, tracks their state, retries failures when appropriate, and recovers work when workers disappear.

---

## 4. Core Execution Model

Every workflow consists of:

```text
Workflow
  └── Workflow Run
       └── Task Runs
            └── Task Attempts
```

A task progresses through states such as:

```text
PENDING
  ↓
READY
  ↓
RUNNING
  ↓
SUCCESS
```

or:

```text
RUNNING
  ↓
FAILED
  ↓
RETRYING
  ↓
READY
```

A permanently failed task may eventually enter:

```text
DEAD_LETTERED
```

---

## 5. Primary Users

Atlas is intended as an engineering-focused workflow infrastructure project.

Example use cases:

- data processing pipelines
- scheduled backend jobs
- API integration workflows
- report generation
- ETL-style processing
- internal automation
- batch processing
- asynchronous business workflows

---

## 6. Core Design Principles

### Reliability First

A task should not disappear simply because a worker or server fails.

### Durable State

Important execution state must survive process and machine restarts.

### Explicit State Transitions

Workflow and task state changes should be controlled and auditable.

### Failure Is Normal

Failures are expected system events, not exceptional edge cases.

### Observable Execution

Users should be able to understand what happened to every workflow and task.

### Backend First

The execution engine is the primary product. The UI is secondary.

---

## 7. Success Criteria

Atlas is successful when it can demonstrate:

1. A workflow can be defined as a DAG.
2. The scheduler correctly determines runnable tasks.
3. Workers can execute tasks independently.
4. Multiple workers can operate concurrently.
5. Worker failure does not permanently lose leased work.
6. Failed tasks can retry according to policy.
7. Workflow state survives service restarts.
8. Duplicate execution is handled safely.
9. Execution history can explain what happened.
10. The system can be observed through metrics and logs.

---

## 8. What Makes Atlas Interesting?

The goal is not to build another CRUD application.

The goal is to demonstrate real backend and distributed-systems engineering:

- concurrency
- queues
- scheduling
- coordination
- persistence
- failure recovery
- consistency
- idempotency
- observability

Atlas should feel like a small production-grade infrastructure system rather than a college CRUD project.
