# Atlas — AWS Infrastructure Guide

## 1. Purpose

Atlas is a distributed workflow/job execution engine built around DAG-based scheduling, asynchronous task execution, durable state, worker coordination, retries, and failure recovery.

AWS is used as the infrastructure layer for Atlas. Each AWS service has a clearly defined responsibility.

### Core principle

> **Workers are disposable. Execution state is durable.**

A worker may crash, restart, or disappear without losing the authoritative state of a workflow run.

---

# 2. AWS Architecture

```text
                         ┌──────────────┐
                         │    Client    │
                         └──────┬───────┘
                                │
                                ▼
                     ┌───────────────────┐
                     │    Atlas API      │
                     │      EC2          │
                     └─────────┬─────────┘
                               │
                         Create / Run
                               │
                               ▼
                     ┌───────────────────┐
                     │    Scheduler      │
                     │       EC2         │
                     └─────────┬─────────┘
                               │
                          Ready Tasks
                               │
                               ▼
                     ┌───────────────────┐
                     │       SQS         │
                     │    Task Queue     │
                     └─────────┬─────────┘
                               │
                ┌──────────────┼──────────────┐
                ▼              ▼              ▼
             ┌───────┐      ┌───────┐      ┌───────┐
             │Worker │      │Worker │      │Worker │
             │ EC2   │      │ EC2   │      │ EC2   │
             └───┬───┘      └───┬───┘      └───┬───┘
                 │              │              │
                 └──────────────┼──────────────┘
                                │
               ┌────────────────┼────────────────┐
               ▼                ▼                ▼
         ┌──────────┐     ┌──────────┐     ┌──────────┐
         │ DynamoDB │     │    S3    │     │CloudWatch│
         │  State   │     │Artifacts │     │Observability│
         └──────────┘     └──────────┘     └──────────┘
```

---

# 3. AWS Services

## 3.1 EC2 — Compute

### Purpose

EC2 runs the Atlas application components.

For the initial version, EC2 can host:

- Atlas API
- Scheduler
- Worker processes

As the system grows, workers can be moved onto separate EC2 instances.

### Initial deployment

```text
EC2 Instance
├── Atlas API
├── Scheduler
└── Worker Pool
```

### Scaled deployment

```text
API EC2
   │
   ▼
Scheduler EC2
   │
   ▼
SQS
   │
   ├── Worker EC2 #1
   ├── Worker EC2 #2
   └── Worker EC2 #3
```

### Atlas responsibilities on EC2

**API**
- Accept workflow definitions
- Create workflow runs
- Expose execution status
- Expose task/run history

**Scheduler**
- Parse DAG dependencies
- Determine runnable tasks
- Enqueue ready tasks
- React to completed/failed tasks

**Workers**
- Consume tasks from SQS
- Execute task logic
- Send heartbeats
- Update task state
- Produce outputs
- Handle task failures

---

# 4. SQS — Distributed Task Queue

SQS is the communication layer between the scheduler and workers.

The scheduler should not directly invoke individual workers.

Instead:

```text
Scheduler
    │
    │ Task Message
    ▼
  SQS
    │
    ▼
 Worker
```

## Why SQS?

Atlas needs:

- Asynchronous execution
- Scheduler/worker decoupling
- Multiple workers
- Queue buffering
- At-least-once delivery
- Visibility timeout
- Retry handling
- Dead-letter handling

## Example

A workflow:

```text
A ──► B ──► D
└──► C ────► D
```

When `A` completes:

```text
Scheduler
   │
   ├── Task B → SQS
   └── Task C → SQS
```

Multiple workers can then consume B and C concurrently.

## Visibility timeout

When a worker receives a task:

```text
SQS
 │
 └── Task A
       │
       ▼
    Worker
       │
       └── visibility timeout starts
```

If the worker successfully completes the task, it deletes the message.

If the worker crashes before completion, the message becomes visible again and another worker can process it.

Atlas must therefore make task execution **idempotent**.

---

# 5. DynamoDB — Durable Execution State

DynamoDB is the authoritative persistent state store for Atlas.

It stores the state required to reconstruct workflow execution.

## What DynamoDB stores

### Workflow

```text
workflow_id
name
definition
status
created_at
updated_at
```

### Workflow Run

```text
run_id
workflow_id
status
started_at
completed_at
```

### Task Execution

```text
task_id
run_id
workflow_id
status
attempt
worker_id
started_at
completed_at
lease_expires_at
error
output_reference
```

## Example states

```text
PENDING
   ↓
READY
   ↓
RUNNING
   ↓
SUCCESS
```

Failure path:

```text
RUNNING
   ↓
FAILED
   ↓
RETRY_PENDING
   ↓
READY
```

Permanent failure:

```text
FAILED
   ↓
DEAD_LETTER / TERMINAL_FAILURE
```

## Important principle

DynamoDB is the source of truth.

Do not rely on:

- Worker memory
- EC2 local disk
- Redis alone
- SQS messages alone

to represent authoritative workflow state.

---

# 6. S3 — Artifacts and Large Payloads

S3 stores data that is too large or inappropriate for SQS/DynamoDB.

Examples:

- Large task inputs
- Task outputs
- Generated files
- Workflow artifacts
- Execution logs when long-term storage is required

## Example structure

```text
s3://atlas-artifacts/
│
├── workflows/
│
├── runs/
│   ├── run-123/
│   │   ├── task-a/
│   │   │   ├── input.json
│   │   │   └── output.json
│   │   │
│   │   ├── task-b/
│   │   └── task-c/
│
└── logs/
```

Instead of sending a large payload through SQS:

```text
Worker
   │
   ▼
S3
   │
   └── object key
          │
          ▼
       DynamoDB
```

SQS/DynamoDB can contain the reference to the object rather than the entire payload.

---

# 7. CloudWatch — Observability

CloudWatch provides Atlas with operational visibility.

## Logs

Collect logs from:

- API
- Scheduler
- Workers

Example:

```text
[Scheduler] run=123 task=A status=READY
[Worker] worker=7 task=A status=STARTED
[Worker] worker=7 task=A status=SUCCESS
[Scheduler] run=123 task=B status=READY
```

## Metrics

Atlas should expose/record metrics such as:

```text
workflows_submitted
workflow_runs_started
workflow_runs_completed
tasks_submitted
tasks_completed
tasks_failed
tasks_retried
task_execution_latency
queue_depth
worker_failures
```

## Alarms

Examples:

```text
SQS queue depth too high
        ↓
CloudWatch Alarm
        ↓
Operator notification
```

```text
Task failure rate too high
        ↓
CloudWatch Alarm
```

Observability is important because Atlas is a distributed system. Debugging cannot depend only on local application logs.

---

# 8. IAM — AWS Permissions

IAM controls access between Atlas and AWS resources.

Do not hard-code AWS access keys inside the application.

Use IAM roles attached to EC2 instances.

## API role

The API may need:

```text
DynamoDB
├── Read
└── Write

SQS
└── SendMessage

S3
├── Read
└── Write
```

## Worker role

Workers may need:

```text
SQS
├── ReceiveMessage
├── DeleteMessage
└── ChangeMessageVisibility

DynamoDB
├── Read
└── Write

S3
├── Read
└── Write
```

Permissions should follow the principle of least privilege.

---

# 9. VPC — Network Isolation

Atlas EC2 infrastructure should run inside an AWS VPC.

Conceptually:

```text
                         Internet
                            │
                            ▼
                     ┌─────────────┐
                     │     VPC     │
                     │             │
                     │   EC2       │
                     │             │
                     └──────┬──────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
             SQS        DynamoDB          S3
```

Security groups should restrict inbound traffic.

For the first version, networking should remain simple and understandable rather than introducing unnecessary infrastructure.

---

# 10. Atlas Task Lifecycle on AWS

A complete task execution should look approximately like this:

```text
1. Client creates workflow
          │
          ▼
2. API stores workflow in DynamoDB
          │
          ▼
3. Client starts workflow run
          │
          ▼
4. Scheduler creates run state
          │
          ▼
5. Scheduler evaluates DAG
          │
          ▼
6. Ready task is written to SQS
          │
          ▼
7. Worker receives task
          │
          ▼
8. Worker claims/updates task state
          │
          ▼
9. Worker executes task
          │
          ├──────────────► S3 if large output
          │
          ▼
10. Worker updates DynamoDB
          │
          ▼
11. Scheduler evaluates dependent tasks
          │
          ▼
12. New ready tasks enter SQS
```

---

# 11. Failure Recovery

Failure handling is a core feature of Atlas.

## Worker crashes

```text
Worker
   │
   │ executing Task A
   X
 CRASH
```

The task remains represented in DynamoDB.

SQS visibility eventually expires.

```text
SQS
 │
 └── Task A visible again
          │
          ▼
      Worker 2
```

Atlas then checks the durable state and decides whether the task should be retried.

---

# 12. Heartbeats and Leases

Atlas workers should periodically report that they are still executing a task.

```text
Worker
  │
  ├── heartbeat
  ├── heartbeat
  ├── heartbeat
  └── heartbeat
```

DynamoDB can maintain:

```text
worker_id
lease_expires_at
last_heartbeat_at
```

If the lease expires:

```text
lease expired
     ↓
task considered abandoned
     ↓
recovery logic
     ↓
retry task
```

This prevents permanently stuck tasks.

---

# 13. Idempotency

Because SQS provides at-least-once delivery, a task may potentially be delivered more than once.

Atlas must therefore protect against duplicate execution effects.

Example:

```text
Message A
   │
   ├── Worker 1
   │
   └── Worker 2
```

The system should use task/run identifiers and state transitions to prevent an already-completed task from incorrectly applying its effects again.

Every task should have a stable execution identity.

```text
workflow_id
run_id
task_id
attempt
```

---

# 14. Dead-Letter Queue

Atlas should use an SQS Dead-Letter Queue for messages that repeatedly fail.

```text
Main Queue
    │
    ├── Attempt 1
    ├── Attempt 2
    ├── Attempt 3
    └── ...
          │
          ▼
       DLQ
```

The DLQ allows failed messages to be isolated rather than continuously retried.

Atlas can expose these failures through its dashboard/API.

---

# 15. Retry Strategy

Retries should be controlled by Atlas rather than blindly retrying everything.

Example:

```text
Attempt 1
   ↓
wait
   ↓
Attempt 2
   ↓
wait longer
   ↓
Attempt 3
   ↓
terminal failure / DLQ
```

Use exponential backoff with a configurable maximum retry count.

Example conceptual policy:

```text
delay = base_delay × 2^attempt
```

The exact values should be configurable rather than hard-coded into business logic.

---

# 16. Recommended V1 AWS Architecture

Keep the first version relatively small.

### Required

```text
EC2
SQS
DynamoDB
S3
CloudWatch
IAM
VPC
```

### V1 deployment

```text
                 ┌───────────────┐
                 │    Client     │
                 └───────┬───────┘
                         │
                         ▼
                 ┌───────────────┐
                 │ Atlas EC2     │
                 │               │
                 │ API           │
                 │ Scheduler     │
                 │ Worker        │
                 └───────┬───────┘
                         │
                    ┌────┴────┐
                    ▼         ▼
                  SQS       DynamoDB
                    │
                    ▼
                  S3
                    │
                    ▼
               CloudWatch
```

This is sufficient to build the core distributed execution system.

---

# 17. Future Scaling Architecture

Once the core system is stable:

```text
                         ┌──────────┐
                         │   ALB    │
                         └────┬─────┘
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
                  API-1     API-2     API-3
                              │
                              ▼
                         Scheduler
                              │
                              ▼
                            SQS
                              │
               ┌──────────────┼──────────────┐
               ▼              ▼              ▼
           Worker-1       Worker-2       Worker-3
               │              │              │
               └──────────────┼──────────────┘
                              │
                ┌─────────────┼─────────────┐
                ▼             ▼             ▼
             DynamoDB        S3        CloudWatch
```

Workers can eventually move from EC2 process management to ECS/Fargate containers.

Auto Scaling can then dynamically increase/decrease worker capacity based on workload.

---

# 18. Services We Should NOT Add Initially

Avoid adding infrastructure just because AWS provides it.

For Atlas V1, do not introduce these unless there is a concrete requirement:

- Kubernetes/EKS
- Redis/ElastiCache
- ECS/Fargate
- Lambda
- API Gateway
- ALB
- Step Functions
- EventBridge

The goal is to build Atlas's own orchestration logic.

Using AWS Step Functions, for example, would undermine the purpose of implementing the DAG scheduler ourselves.

---

# 19. Service Responsibility Summary

| AWS Service | Responsibility |
|---|---|
| **EC2** | Run API, scheduler, and workers |
| **SQS** | Queue and distribute executable tasks |
| **DynamoDB** | Durable workflow/run/task state |
| **S3** | Large payloads and artifacts |
| **CloudWatch** | Logs, metrics, and alarms |
| **IAM** | Authentication/authorization for AWS resources |
| **VPC** | Network isolation |
| **ALB** | Future API load balancing |
| **ECS/Fargate** | Future containerized worker infrastructure |
| **ElastiCache** | Optional future caching/coordination |
| **Auto Scaling** | Future dynamic worker capacity |

---

# 20. Core Design Rule

Atlas should use AWS as infrastructure, not as the workflow engine.

AWS provides:

```text
Compute       → EC2
Queue         → SQS
Persistence   → DynamoDB
Artifacts     → S3
Observability → CloudWatch
Security      → IAM
Networking    → VPC
```

Atlas provides:

```text
DAG Scheduling
Task State Machine
Worker Coordination
Leases
Heartbeats
Retries
Backoff
Idempotency
Failure Recovery
Workflow Execution
```

That separation is important.

The project should demonstrate that Atlas itself understands distributed workflow execution while AWS supplies reliable primitives underneath it.

---

# 21. Target V1

The first working AWS deployment should prove:

- [ ] API runs on EC2
- [ ] Scheduler runs on EC2
- [ ] Worker runs on EC2
- [ ] Workflow definitions are persisted
- [ ] Workflow runs are persisted
- [ ] Tasks are distributed through SQS
- [ ] Workers update durable task state
- [ ] DAG dependencies are respected
- [ ] Multiple independent tasks execute concurrently
- [ ] Worker failure can be recovered
- [ ] Tasks support retries
- [ ] SQS visibility timeout is configured
- [ ] DLQ is configured
- [ ] Large outputs can be stored in S3
- [ ] CloudWatch captures logs/metrics
- [ ] EC2 uses IAM roles instead of hard-coded AWS credentials
- [ ] VPC/security groups are configured
- [ ] Duplicate task delivery is handled safely

---

# 22. Final Architecture Principle

Atlas should be designed around this failure model:

```text
Anything can fail.

API can fail.
Scheduler can fail.
Worker can fail.
Network can fail.
Messages can be duplicated.
Messages can be delayed.
Tasks can timeout.
Machines can disappear.

But:

Workflow state must remain recoverable.
```

AWS provides the primitives that make this possible.

Atlas provides the orchestration intelligence that turns those primitives into a durable distributed workflow execution system.
