---
title: "A Database Lease Is Not Enough: UltiCode Uses Fence Tokens to Stop Stale Singleton Jobs"
timestamp: 2026-09-09 00:00:00+08:00
series: "Architecture and Engineering Practice"
kind: concept
status: provisional
sources: ["ulticode-reliability-core-f801a1076"]
related: ["ulticode", "ulticode-generation-attempt-fence"]
tags: [UltiCode, FencedLease, DistributedLock, Reconciliation, CAS, MySQL, Concurrency, LLM]
description: "Why an expiry time alone is insufficient, and how UltiCode's fenced_job_leases and reconciliation-run writes invalidate an old executor at the database boundary."
toc: true
---

> **Evidence status**: This article is based on UltiCode's FencedJobLeaseMapper, FencedJobLeaseService, OwnerReconciler, ReconciliationRunMapper, ADR, and MySQL migration at a fixed commit. Source and boundary tests show that stale completion is rejected; they do not mean every external side effect is fenced or that singleton jobs are exactly-once.

Assume the system allows only one reconciliation job at a time. Instance A acquires a lease and starts scanning. After some time A pauses and the lease expires. Instance B acquires a new lease and completes a new scan. A then resumes and executes its final step: writing its own result as “the job is complete.”

If the database update checks only lease_name or owner_token, A may still succeed. It was once a valid owner, while the database only knows that “a lease exists now,” not which lease generation produced this write. B's new result can then be overwritten by the stale executor.

That is the difference between an ordinary lease and a fenced lease: the lease decides who may start; the fence token decides who still has the authority to finish.

## Why the naive design fails

### An in-process lock solves only one process

synchronized, ReentrantLock, or a singleton Bean can stop duplicate execution inside one JVM. Once the service restarts, a second replica appears, or an independent operations script runs, that lock's scope ends. It suits an offline job with exactly one process; it does not suit a service cluster whose database write is treated as global fact.

### An owner plus expiry still lets an old owner return

A typical lease table has lease_name, owner_token, and leased_until. Acquiring an expired lease and checking owner and time on writes looks sufficient for crash recovery, but it does not express “which acquisition is this?”

Time checks are not enough either. An old worker may pause after the check and continue writing after the lease expires and a new owner takes over. Application-local time may also differ from database time.

### A Redis lock is not fencing automatically

A Redis lock can coordinate acquisition, but if a downstream database update does not carry and check a monotonically increasing token, an old owner can still finish its write after the lock expires. Switching the lock to another store does not automatically provide stale-writer protection.

## UltiCode's core mechanism: increment the lease generation on takeover

UltiCode stores singleton-job leases in fenced_job_leases and assigns a fence_token to each valid takeover:

```text
lease_name = admin:reconciliation

first owner:  owner=A, fence=7, leased_until=T1
lease expires
new owner:   owner=B, fence=8, leased_until=T2
```

FencedJobLeaseMapper takes over only when the lease has expired and increments the token. Acquire, renew, release, and isHeld all require lease_name + owner_token + fence_token to match. Lease-time checks use the database's CURRENT_TIMESTAMP(3), rather than treating the application clock as the sole source of truth.

This resolves the ambiguity between “who is the current owner?” and “which lease generation does this owner belong to?” A still has the old fence 7 even if it holds its old owner token; after B takes over, the database is at fence 8 and A's later updates can be rejected by condition.

## The real fence belongs at the completion write

Obtaining a token is not enough. It must travel to the final write so the check is applied where an old worker can do the most damage.

OwnerReconciler acquires admin:reconciliation, records the owner token and fence token on the reconciliation run, and renews during execution. When completing the run, ReconciliationRunMapper uses a conditional update with a join:

```sql
UPDATE reconciliation_runs AS r
JOIN fenced_job_leases AS l
  ON l.lease_name = :leaseName
SET r.status = :status,
    r.finished_at = :finishedAt
WHERE r.run_id = :runId
  AND r.fence_token = :runFenceToken
  AND l.owner_token = :ownerToken
  AND l.fence_token = :fenceToken
  AND l.leased_until > CURRENT_TIMESTAMP(3)
```

This is a simplified example extracted from the implementation; other fields are omitted, but the semantic conditions remain. If any condition fails, the affected-row count is zero. The caller must not treat zero rows as “try the write again later”; it should interpret it as a lost lease, stale token, or takeover by a competitor.

That differs from writing only:

```java
if (lease.isHeld()) {
    run.setFinished(true);
}
```

The Java check and database update have a race between them. A conditional update puts the check and the write into one atomic database operation.

## Why not use a database pessimistic lock directly

SELECT ... FOR UPDATE protects a row inside one transaction, but reconciliation may run for a long time. Keeping the database transaction open would hold locks, amplify resource use, and fit poorly with multiple external steps.

A fenced lease splits the long job into short transactions: acquire, renew, record progress, finish. Each step uses the token to verify current authority. It gives up the simplicity of “the entire job is under one lock,” but lets the job run outside one long transaction while the database still decides whether the final commit is valid.

This does not make pessimistic locks useless. They may be more direct in a short local critical section. For work involving networks, files, or long computation, lease plus fencing usually matches the lifecycle better.

## What this design actually solves

- **Cross-instance coordination**: one lease_name and database constraints let multiple instances compete for one singleton job.
- **Expired takeover**: if an old instance does not renew, a new instance can take over after expiry.
- **Stale completion invalidation**: the new takeover increments the fence token, so the old executor cannot satisfy the final-write conditions.
- **Database-time consistency**: lease validity uses the database clock rather than treating local application time as authoritative.
- **Observable failure**: zero affected rows is an explicit stale/lost-lease signal, not a silent overwrite.

It does not solve whether already-called external APIs can be rolled back, whether files were written, whether a third party checks the token, whether an old worker keeps consuming CPU, or whether the whole business runs exactly once. Fencing mainly protects the write seam that carries the token; side effects without that condition still need idempotency keys, compensation, or their own fencing protocol.

## Cost, fit, and failure boundaries

Signals that this fits include: the job must be a singleton; it may outlive the lease TTL; instances may pause, restart, or be replaced; and final state can be written back to the same database.

The costs are clear: the token must travel from acquisition to every side-effecting write; renewals and TTL need monitoring; every terminal update needs the correct conditions; and tests must cover an old owner returning after a new owner takes over. If all work completes in one short transaction, a row lock or unique constraint is simpler.

The easiest boundary to miss is fencing acquisition but not fencing completion, publication, deletion, or success marking. That produces a numbered lock without preventing stale completion.

## Applying the model to LLM/Agent scheduling

A long-running Agent task can also have multiple executors because of model switching, cancel-and-resume, or worker restart. A plan version or task epoch can serve as the fence token, and tool results, the final summary, and task-state updates can all be required to carry it. An old plan may run to natural completion, but it cannot mark the new plan complete.

The transferable question is not “should the Agent get a distributed lock?” It is: which side effects must verify the current plan version again at the database boundary? A tool that relies only on an in-memory isCurrent check can still become stale between checking and writing.

## Minimal verification path

Read the acquire/renew/release conditions in [FencedJobLeaseMapper](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/admin/src/main/java/com/ulticode/modules/lease/FencedJobLeaseMapper.java), then read the completion update in [ReconciliationRunMapper](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/admin/src/main/java/com/ulticode/modules/reconciliation/ReconciliationRunMapper.java). Finally inspect [FencedJobLeaseIT](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/admin/src/test/java/com/ulticode/modules/lease/FencedJobLeaseIT.java) and [OwnerReconcilerTest](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/admin/src/test/java/com/ulticode/modules/reconciliation/OwnerReconcilerTest.java): one verifies that an old release fails after takeover, and the other verifies that an old owner's completion write is rejected.

The UltiCode analysis phase actually ran and passed the two MySQL 8 Testcontainers integration tests for this fenced lease and the targeted reconciliation unit tests. This validates selected contention scenarios, not performance, network partitions, or every external side effect.

