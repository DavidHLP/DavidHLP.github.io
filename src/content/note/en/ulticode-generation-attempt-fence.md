---
title: "UltiCode Generation and attemptId: Fencing Stale Judging Results with Conditional Updates"
timestamp: 2026-09-09 00:00:00+08:00
series: "Architecture and Engineering Practice"
kind: concept
status: provisional
sources: ["ulticode-engineering-highlights-f801a1076"]
related: ["ulticode"]
tags: [UltiCode, OnlineJudge, Generation, AttemptId, Lease, CAS, Concurrency, LLM]
description: "How UltiCode uses generations, attemptIds, leases, and conditional updates to stop rejudges, timeouts, or old workers from overwriting newer state."
toc: true
---

> **Evidence status**: This article is based on UltiCode's Submission mapper, rejudge service, lease reaper, and Judge attempt executor. It describes a result fence implemented in the repository; it does not expand source evidence into an exactly-once or production-concurrency proof across systems.

In asynchronous judging, a submission can be executed more than once: an administrator may rejudge it, the original Worker may time out, a lease may be reclaimed, or Redis may redeliver an old message. If result writes locate records only by `submissionId`, the oldest result to arrive last can overwrite the newest result.

UltiCode represents the logical submission generation and the concrete execution lease separately:

- `generation`: the logical epoch of a submission or rejudge;
- `attemptId`: the token for one Worker execution lease.

## Put concurrency rules into SQL conditions

The critical path can be reduced to four conditions:

```text
acquire lease:  id + status=Pending + generation
renew lease:    id + current_attempt_id
write verdict:  id + generation + current_attempt_id
rejudge/reaper: expected generation -> generation + 1
```

In [SubmissionMapper](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/modules/submission/mapper/SubmissionMapper.java), these become conditional updates:

1. A Worker acquires a lease only when the submission is Pending and the generation matches.
2. A heartbeat renews the lease only while the current `attemptId` still owns it.
3. A verdict is written only when id, generation, and `attemptId` all match.
4. A rejudge or lease recovery first performs a CAS against the expected generation, then advances to the next generation and creates a new judging intent.

When the update affects zero rows, the caller interprets it as a lost lease, stale generation, or takeover by a competitor, rather than continuing to write an old result. The judge executor records `judge.stale_result.dropped` and ACKs messages already identified as safely stale.

## How rejudges and reaping advance the epoch

[SubmissionRejudgeService](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/submission/admin/SubmissionRejudgeService.java) reopens a terminal submission by incrementing its current generation and creating a new outbox record. [JudgingLeaseReaper](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/modules/submission/reaper/JudgingLeaseReaper.java) uses the same progression to recover expired leases.

Therefore, even if an old message reappears in the Redis PEL, it carries an old generation. It can be consumed, identified, and safely discarded, but it cannot pass the Submission owner's database gate.

## This is a boundary, not magic

A result fence protects only the write seam it covers. It does not replace message durability, cross-owner authorization, business auditing, or idempotency in external systems. It also does not guarantee that old code will never execute; it guarantees that an old execution result has no authority to overwrite new state.

That is the value of conditional updates: concurrency correctness is narrowed from “every caller must be careful” to one database rule that can be inspected.

## Applying the model to LLM/Agent systems

An Agent task can also be retried, resumed after cancellation, switched to another model, or replanned. The plan version can serve as `generation`, a provider lease as `attemptId`, and the final write can be constrained by `taskId + planVersion + attemptId`. A late tool result then remains an observable stale result instead of rewriting the current plan.

## Minimal verification path

Read [SubmissionMapper.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/modules/submission/mapper/SubmissionMapper.java), then inspect the acquire/renew/write/ACK-NACK path in [DefaultJudgeAttemptExecutor.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/queue/processor/DefaultJudgeAttemptExecutor.java). The corresponding integration behavior should be verified with real MySQL, Redis, and concurrency tests; this article does not claim that verification was run in this round.

