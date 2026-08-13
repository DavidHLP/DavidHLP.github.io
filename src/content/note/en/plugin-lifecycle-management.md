---
title: "Plugin Lifecycle Management at Million-Endpoint Scale: State, Heartbeats, and Controlled Release"
timestamp: 2026-06-02 00:00:00+08:00
series: "Architecture & Engineering Practice"
kind: concept
status: active
draft: true
sources: ["legacy-plugin-lifecycle-management"]
related: ["uisa-architecture-design"]
tags: [Distributed Systems, Architecture Design, Endpoint Management, Canary Release, High Availability]
description: "A control-plane model for making plugin install, upgrade, uninstall, and rule delivery converge safely through a desired/current/ack/failure state machine, merged heartbeats, idempotent dispatch, canary circuit breakers, and explicit source assumptions about scale and endpoint capabilities."
toc: true
---

## Definition
This page answers one question: how can plugin installation, upgrade, uninstallation, and rule delivery converge safely when endpoint capabilities differ, networks jitter, and actions can be destructive? It is a control-plane model, not a validated capacity plan; million-scale operation, capability variance, and recovery behavior are design assumptions in the source.

## Core mechanisms

### 1. State machine: separate intent, observation, and result

For each endpoint–plugin key, retain at least four dimensions instead of collapsing everything into `Online/Offline`.

| Dimension | Meaning | Primary source |
| --- | --- | --- |
| `desired` | Policy-required version, rule, or installation state | Control-plane policy |
| `current` | Latest version and runtime state reported by the Agent | Merged heartbeat |
| `ack` | Whether a particular install/upgrade/uninstall operation was executed and acknowledged | Operation receipt |
| `failure` | Latest error, consecutive failures, and blocking reason | Receipts and failure counters |

The minimum loop is: `desired != current` creates a candidate action; capability and safety checks run first; dispatch waits for an `ack`; only success advances `current`; failure updates `failure` and selects retry or blocking. A heartbeat timeout marks the observation logically offline; it does not prove an uninstall succeeded.

```text
desired <- policy
current <- heartbeat
ack, failure <- receipt(operation)
reconcile(desired, current, ack, failure)
```

### 2. Merged heartbeats: decouple observation from execution

The Agent reports endpoint identity, OS/environment, and multiple plugin states once. The gateway validates and rate-limits the report, then processes plugin observations asynchronously. Heartbeat handling refreshes observations and triggers scheduling; it does not wait synchronously for an install result. Heartbeats may be dropped or degraded, while install/upgrade paths must not bypass safety gates.

The source's capacity arithmetic is illustrative: with 1 million endpoints and one heartbeat every 60 seconds, merging gives about `1,000,000 / 60 ≈ 16,667 QPS`; ten separate plugin heartbeats would be roughly ten times that. This motivates merging, not a capacity promise. Thread pools and queues must be bounded so heartbeat backlog cannot take down a service node.

### 3. Idempotent dispatch: a lock is a concurrency gate, not business truth

Build a dispatch key from `uuid + plugin + op + targetVersion`. A distributed lock prevents concurrent handling; persisted last-operation time and state catch lock expiry, duplicate consumption, and network retries.

```text
lock:{uuid}:{plugin}:{op}:{targetVersion}
```

The sequence is: read state → reject a recent dispatch → check blacklist, canary, and breaker → create an operation record and dispatch → update operation time. Duplicate receipts for one operation should be safely recognizable and must not advance the version or repeat side effects; the concrete operation-ID field remains an implementation contract to define.

### 4. Canary and breaker: limit blast radius before observing results

| Guard | Dimensions | Purpose |
| --- | --- | --- |
| Capability filter | OS, version, architecture, environment, privilege | Do not dispatch to unsupported endpoints |
| Canary | UUID, region, organization, OS, stable-hash percentage | Test a fixed small population |
| High-risk canary | Dedicated allowlist for kernel, driver, or system-hook plugins | Raise the gate for dangerous plugins |
| Breaker | Failure receipts by plugin/version/operation/OS | Stop later dispatches and alert |

The source's `5-minute sample >= 100`, failure rate `>= 20%`, and `>= 30` consecutive failures are example thresholds; a severe kernel error may block immediately. Percentage canaries need a stable hash so repeated decisions for one endpoint remain consistent.

### 5. Eventual consistency and recovery

Accept heartbeat delay, lost receipts, duplicate reports, and lagging versions; converge through repeated observation rather than forcing every request to be strongly synchronous:

1. On a receipt, update the operation log and plugin state; failures enter retry and failure statistics.
2. On heartbeat timeout, mark `Offline` first and retain the record for recovery; clean it in batches only after the retention window.
3. When heartbeat returns, compare `desired/current` and dispatch only still-needed work.
4. Put OS-incompatible combinations on a TTL-backed blacklist so every heartbeat does not repeat the same failure.
5. Releasing a breaker requires an explicit operator action or observation window; an ordinary heartbeat must not silently bypass it.

## Applicable conditions

- Endpoint count and heartbeat frequency are high, and the Agent can aggregate several plugin states.
- Plugins need long-running operation, version upgrades, rule updates, and receipts.
- The control plane can tolerate seconds of state lag and has compensation, audit, and retry paths.
- Capabilities differ: containers, no-root endpoints, read-only filesystems, Serverless, and hardened environments need allowlists or blacklists.
- Lightweight rule updates can use long-lived push; heavyweight installation and multi-step upgrades can use a script proxy, with different availability assumptions.

## Not applicable and risks

- “Millions/tens of millions” in the source is not a load-test result; thread counts, queue sizes, heartbeat periods, and retention windows require workload-specific validation.
- This model does not promise strong consistency or real-time visibility. Permanent endpoint loss can only leave pending or failed evidence.
- A failed kernel plugin may crash a system, sever its network, or disconnect a large population; ordinary canary rules are insufficient.
- Example canary, breaker, and blacklist TTL values are not portable configuration.
- A distributed lock without durable state, idempotent receipts, and audit leaves duplicate side effects when the lock expires.

## Minimum validation

1. Send duplicate heartbeats from one endpoint: observation refreshes, but only one unfinished operation is created.
2. Dispatch the same `uuid/plugin/targetVersion` on two nodes: one acquires the lock and the other produces an observable skip.
3. Send success, duplicate, delayed, and failure receipts: the version advances once and counters agree with breaker statistics.
4. Interrupt heartbeats and then restore them: state becomes `Offline`, then compensation follows `desired/current` without replaying confirmed work.
5. Exercise canary hit, canary miss, capability rejection, and breaker-open populations; dangerous work must remain blocked.

## Evidence and uncertainty

- **Source facts**: `legacy-plugin-lifecycle-management` describes merged heartbeats, a plugin state machine, lock-plus-timestamp deduplication, capability filters, stable-hash canaries, failure-rate statistics by plugin version, receipt closure, and offline cleanup.
- **Synthesis in this page**: `desired/current/ack/failure` gives those fields one control-plane vocabulary, and “degrade heartbeats, block dangerous actions” is made an explicit boundary.
- **Unconfirmed**: the source does not provide production load tests, real capability distributions, an operation-ID wire contract, calibrated thresholds, or product policy for permanent offline endpoints.

## Related pages

- [Enhanced UISA information-sync architecture](/en/note/uisa-architecture-design)
