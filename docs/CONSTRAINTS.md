# Atlas — Constraints

This document defines what Atlas intentionally will **not** attempt to solve.

These are engineering boundaries, not excuses for missing functionality.

---

## 1. Scope

Atlas is a learning-focused but production-inspired workflow execution engine.

We are building the execution infrastructure, not an entire automation ecosystem.

---

## 2. No Arbitrary Remote Code Execution

Atlas must not initially allow users to submit arbitrary code that executes directly on the host machine.

Task execution should use controlled task types.

Examples:

```text
HTTP
PYTHON_FUNCTION
DATABASE
DELAY
```

Additional task types can be introduced through a controlled worker interface.

---

## 3. No Kubernetes Dependency for V1

Atlas must run locally with Docker Compose.

Kubernetes may be explored later, but V1 must not require it.

The project should demonstrate distributed concepts without hiding them behind Kubernetes.

---

## 4. No Multi-Region System

V1 targets a single deployment region.

We are not solving:

- multi-region replication
- global consensus
- cross-region failover
- geographic data locality

These are separate distributed-systems problems.

---

## 5. No Exactly-Once Guarantee

Atlas should not claim true exactly-once execution.

The execution model should be designed around:

> **At-least-once delivery + idempotent task handling**

This reflects realistic distributed-system behavior.

---

## 6. No Custom Message Broker in V1

We will use Redis initially.

We are not building:

- Kafka
- RabbitMQ
- NATS
- a custom consensus protocol
- a custom persistent message broker

The interesting engineering problem is workflow orchestration, not reinventing an entire message broker.

---

## 7. PostgreSQL Is the Durable Source of Truth

Redis is used for task delivery and coordination.

Important workflow state must live in PostgreSQL.

The system must not depend on Redis memory as the only record of execution state.

---

## 8. No Full-Scale SaaS Billing System

V1 does not include:

- subscriptions
- payments
- invoices
- usage billing
- organization billing

These are product concerns outside the core engine.

---

## 9. No Complex Visual Workflow Builder Initially

The first workflow definitions can be submitted through JSON/API.

A visual drag-and-drop builder is secondary.

The engine must work without a frontend.

---

## 10. No Plugin Marketplace

V1 will not attempt to create an ecosystem of third-party plugins.

Task types should remain intentionally small and controlled.

---

## 11. No Unlimited Workflow Complexity

The system should support meaningful DAGs, but V1 is not designed for arbitrarily huge graphs.

Performance targets should be established through benchmarks rather than promising infinite scale.

---

## 12. No AI as the Core Engine

AI is not required for Atlas.

If AI is added later, it should solve a specific supporting problem such as:

- workflow suggestions
- failure explanation
- log summarization

AI must not replace deterministic scheduling or execution logic.

---

## 13. No UI-First Development

We will not spend weeks polishing the dashboard before the execution engine works.

Priority:

```text
Correctness
    >
Reliability
    >
Observability
    >
API
    >
UI polish
```

---

## 14. No Hidden State

Important system behavior must not depend on undocumented in-memory state.

If the process restarts, the system should be able to reconstruct the necessary execution state from durable storage.

---

## 15. No Premature Microservices

We will separate components when there is a real architectural reason.

We will not create ten services simply to make the architecture diagram look impressive.

Start simple.

Introduce separation where it improves:

- fault isolation
- scalability
- ownership
- reliability
- execution behavior

---

## 16. Engineering Rule

Every feature should answer at least one of these questions:

> Does it improve reliable execution?

> Does it improve recovery?

> Does it improve observability?

> Does it demonstrate an important backend/distributed-systems concept?

If not, it probably does not belong in Atlas V1.
