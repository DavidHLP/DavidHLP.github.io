---
title: "Enhanced UISA: Owners, Boundaries, and Recovery for Heterogeneous-Node Sync"
timestamp: 2026-03-25 00:00:00+00:00
series: "Architecture & Engineering Practice"
kind: synthesis
status: provisional
draft: true
sources: ["legacy-uisa-architecture-design", "legacy-plugin-lifecycle-management"]
related: ["plugin-lifecycle-management"]
tags: [Architecture, Distribution, Security, Infrastructure, Sync, HybridCloud]
description: "A synthesis of Enhanced UISA and the plugin-lifecycle source, reorganized around owner/boundary, sync protocol, reliability and idempotency, heterogeneous nodes, failure recovery, and trade-offs rather than an architecture-blog sequence. Scale and thresholds remain source assumptions, not production promises."
toc: true
---

## Definition

This page does not retell UISA as a four-layer diagram. It synthesizes two raw sources to answer: when a general information-sync substrate meets a plugin lifecycle control plane, who owns each state, how messages synchronize, how failure is retried and audited, and which performance and safety trade-offs must be explicit. The result is provisional: it is a design model, not proof that a deployment meets the source's scale claims.

## Core mechanisms

### 1. Owner / boundary: split responsibility by state ownership

| Owner          | Facts owned inside the boundary                                                               | Must not assume ownership of                          |
| -------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Edge Agent     | Node identity, collection, plugin execution, local cache, and version                         | Final central policy decisions                        |
| Secure Gateway | Authentication, protocol conversion, rate limiting, connection governance, offline forwarding | Long-lived asset or task truth                        |
| Sync Engine    | Scheduling, Diff, task state machine, version conflicts, and retries                          | The endpoint's actual execution result before receipt |
| Durable stores | Identity, asset snapshots, tasks, time series, and audit records                              | Directly replacing an executor for dispatch           |
| Plugin policy  | `desired/current/ack/failure`, capability gates, canary, and breaker                          | Every rule of generic asset synchronization           |

The boundary says that an Agent's `current` is an observation, a policy service's `desired` is intent, and task-store state is recoverable control evidence. A Gateway may absorb a peak, but a successful in-memory forward is not task completion.

### 2. Sync protocol: registration, heartbeat, task, and receipt close the loop

The minimum sequence is below; concrete HTTP/RPC fields remain an implementation decision:

1. Initial registration binds a `Business ID`; the center creates a long-lived `System UUID` and issues a short-lived `Session Token`.
2. Ordinary requests carry UUID, token, timestamp, nonce, signature, and Payload Hash. The Gateway validates them before core processing to resist forgery, tampering, and replay.
3. The Agent sends metrics, plugin/asset summaries, and running task IDs in a merged heartbeat. The Gateway validates and rate-limits; normal load can forward directly, while high load writes to MQ for batch consumption.
4. Any outbound task is persisted in `Task DB` with a global `task_id` before dispatch; it is sent directly when online or placed in an offline queue when not.
5. The Agent returns `NoChange`, Diff data, or failure. The engine verifies Hash/signature, updates the asset with a version condition, and writes audit plus queue cleanup only after success.

```text
register -> heartbeat -> persist(task_id) -> dispatch|queue
         -> ack/diff -> validate -> versioned write -> audit
```

### 3. Reliability and idempotency: several constraints converge together

| Constraint                            | Prevents                                  | Observable result                                          |
| ------------------------------------- | ----------------------------------------- | ---------------------------------------------------------- |
| `task_id` idempotency                 | Duplicate delivery and replay             | One task cannot complete twice                             |
| Version + optimistic lock             | Concurrent overwrite                      | Zero affected rows triggers refetch and Diff recomputation |
| Payload Hash / signature              | Tampering and forged origin               | Payload is rejected and a security event is recorded       |
| Bounded retry + TTL                   | Infinite retries and offline buildup      | Expiry becomes `Failed` with a reason                      |
| Audit snapshots + Diff                | Unreplayable, unrepairable changes        | Before/after state can be traced                           |
| Plugin operation key + canary/breaker | Duplicate or fleet-wide dangerous actions | Block reasons, receipts, and failure rates remain visible  |

Generic sync targets eventual consistency that is observable, recoverable, and convergent. The plugin page's `desired/current/ack/failure` is the domain projection of this task state machine, not a competing source of truth.

### 4. Heterogeneous nodes: a capability matrix comes before uniform dispatch

| Node/environment                 | Difference to adapt                                                  | Allowed strategy                                             |
| -------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| ECS / physical server            | Identity source, OS, architecture, and network path                  | Agent collection plus version/Hash incremental sync          |
| Edge node / gateway              | Intermittent links, proxy forwarding, and bandwidth limits           | Local cache, offline queue, wake on recovery                 |
| Container                        | systemd, kernel-module privilege, and possibly restricted filesystem | Plugin allowlist; skip unsupported work                      |
| No root / read-only / Serverless | Cannot install services or persist files                             | Capability filter; do not treat it as retryable installation |
| Hardened environment             | Scripts may be intercepted                                           | Explicit executor/protocol adapter and recorded failure      |

A unified Agent and protocol adapters can hide transport differences, but cannot erase capability boundaries. Each plugin or task still needs explicit prerequisites.

### 5. Failure recovery: offline is a lifecycle state, not an exception branch

| Failure                               | Control-plane action                                                       | Recovery or terminal condition                        |
| ------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------- |
| Network interruption or Agent offline | Mark `Offline`; put tasks in the offline queue                             | Wake on heartbeat; expire to failure at TTL           |
| Gateway outage                        | Load-balancer failover; keep token/queue state in durable external storage | Continue unfinished work after reconnection           |
| MQ backlog                            | Add consumers and degrade non-core telemetry                               | Batch consumption catches up                          |
| Hash/signature failure                | Drop payload and write a security log                                      | Force full sync or investigate manually               |
| Optimistic-lock conflict              | Read the latest version and recompute Diff                                 | Retry up to the limit                                 |
| Database write failure                | Keep task `Pending`; never report success                                  | Retry after the database recovers                     |
| High plugin-version failure rate      | Open breaker and stop later install/upgrade                                | Explicit operator release or a new observation window |

Plugin state can become logically offline first and be batch-cleaned after retention. Asset sync uses full repair for Hash errors, broken version chains, or repeated incremental failure.

### 6. Trade-offs: “high reliability” is not free

| Choice                                           | Gains                                   | Cost                                                       |
| ------------------------------------------------ | --------------------------------------- | ---------------------------------------------------------- |
| Eventual consistency over strong synchronization | Resilience to offline nodes and jitter  | Readers accept lag and depend on compensation              |
| Incremental + Hash/Diff                          | Lower normal transfer and write cost    | Version-chain management and full repair on anomalies      |
| Persist tasks before execution                   | Recovery and auditability               | More latency, storage, and state-machine complexity        |
| Merged heartbeat + MQ                            | Peak shaving and fewer requests         | Asynchronous processing and non-immediate observations     |
| Long-lived push                                  | Low latency for lightweight operations  | Depends on connection stability; poor for complex installs |
| Script proxy                                     | Auditable, controllable multi-step work | Longer path and extra execution capability                 |
| Canary + breaker                                 | Limits a bad plugin's blast radius      | Slower rollout plus threshold and operator workflow        |

## Applicable conditions

- One platform manages ECS, IDC physical servers, edge nodes, containers, or other heterogeneous sources.
- Tasks may be created while a node is offline and must later resume, expire, or fail with audit evidence.
- The business accepts eventual consistency and can operate task, audit, MQ/cache, and compensation infrastructure.
- Endpoints can hold a stable system identity, short-lived token, local version/cache, and a capability-aware executor.

## Not applicable and risks

- The owner/boundary table is not a deployable product topology; sharding, tenant isolation, key lifecycle, and protocol versioning remain undecided.
- This is not suitable for a domain that requires real-time strong consistency, permanently online nodes, or one install command across every OS and privilege model.
- The UISA raw does not provide a production capacity baseline. Million-scale appears only as an illustrative scenario in the plugin raw and cannot be used to infer QPS, SLO, or cost.
- Token lifetime, offline TTL, per-node backlog, canary percentage, and breaker thresholds are examples that require calibration against real failures.
- Incremental sync requires stable asset keys and a version chain; full repair after a Hash mismatch or broken chain needs separate traffic and contention analysis.
- Connecting the plugin control plane to the generic sync protocol is this page's synthesis; neither raw source proves a unified wire contract or a complete ownership implementation.

## Minimum validation

1. Register one `Business ID` twice and replay an old nonce: the binding remains unique and expired/replayed requests are rejected.
2. Submit one `task_id` twice: only one state transition and audit record occur, with a recognizable duplicate result.
3. Submit an old-version Diff concurrently: the optimistic conflict is visible and the system refetches and recomputes instead of overwriting newer data.
4. Create a task while a node is offline, then restore heartbeat: the task wakes from the queue; expiry becomes failure with a reason.
5. Send an invalid Hash/signature and an unsupported capability declaration: the payload is rejected or work is skipped with security/audit evidence.
6. Generate plugin-version receipts above the breaker threshold: later actions are blocked and ordinary heartbeat cannot bypass release.

## Evidence and uncertainty

- **Source facts**: `legacy-uisa-architecture-design` describes dual identity, short-lived tokens, signature/Hash/nonce checks, MQ peak-shaving, version and Diff sync, offline queues, task state machines, optimistic locking, audit, and a failure matrix.
- **Source facts**: `legacy-plugin-lifecycle-management` describes merged heartbeats, current/target versions and plugin states, operation deduplication, capability filters, canary/breaker controls, and receipt-based recovery.
- **Synthesis in this page**: the sources are mapped to owner/boundary, with plugin safety gates treated as a domain policy layer above generic task synchronization; the trade-off table is a cross-source comparison.
- **Unconfirmed**: production capacity, cross-service transaction boundaries, key rotation, protocol negotiation, tenant isolation, and real failure rates are not established by the raw sources.

## Related pages

- [Plugin lifecycle management](/en/note/plugin-lifecycle-management)
