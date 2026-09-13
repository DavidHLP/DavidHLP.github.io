---
title: "UltiCode Outbox and Redis Streams: Making Judge Delivery Recoverable"
timestamp: 2026-09-09 00:00:00+08:00
series: "Architecture and Engineering Practice"
kind: concept
status: provisional
sources: ["ulticode-engineering-highlights-f801a1076"]
related: ["ulticode"]
tags: [UltiCode, OnlineJudge, Outbox, RedisStreams, Retry, DeadLetter, Idempotency, LLM]
description: "How UltiCode uses a database outbox, atomic Redis Streams delivery, retries/dead letters, and PEL recovery to turn a judging message into recoverable state."
toc: true
---

> **Evidence status**: This article is based on the current fixed-commit outbox, Redis Streams, and reaper source in UltiCode. “Recoverable” here means that durable intent and retry paths are implemented; it does not mean exactly-once processing, unlimited throughput, or production HA has been verified.

The most dangerous queue failure is not “sending returned an error.” It is that the business transaction succeeded, but no reliable record remained of what needed to be sent. In an online judge, that window leaves the user seeing a successful submission while the Judge never receives a job.

When the judge outbox path is enabled, UltiCode puts the submission and judging intent in the same database transaction:

```text
submit @Transactional
    ├── submissions: Pending
    └── judge_outbox: PENDING
             │
             ├── claim: FOR UPDATE SKIP LOCKED
             ├── atomic SET + XADD
             └── judge-workers
```

## An outbox record is a state machine

[JudgeOutboxMapper](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/modules/submission/outbox/mapper/JudgeOutboxMapper.java) claims records by status and next retry time, using `FOR UPDATE SKIP LOCKED` so dispatchers do not claim the same row repeatedly. The current dispatcher defaults to batches of 50 and a two-second schedule; these are source defaults, not throughput metrics.

[JudgeOutboxDispatcher](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/modules/queue/outbox/dispatcher/JudgeOutboxDispatcher.java) maps different failures to different state transitions:

| Situation | Handling |
|---|---|
| provider is missing | retry, preserving delivery intent |
| enqueue throws | retry with exponential backoff, currently capped at 60 seconds |
| missing `problemId/userId/language/code` | `DEAD`, preventing a half-empty message from being marked successful |
| enqueue succeeds | mark sent |

Real dispatch is also controlled by shadow flags and a cutover watermark, which matters when distinguishing shadow tasks from real tasks during migration.

## Why Redis Streams instead of one XADD

[RedissonStreamsJudgeQueueAdapter](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/queue/port/adapter/RedissonStreamsJudgeQueueAdapter.java) uses Lua during enqueue to put the deduplication key and `XADD` in one atomic operation. The deduplication key contains `submissionId:generation`.

This prevents a specific failure: if the process performs `SETNX` and then crashes before `XADD`, the system believes the message was already seen even though the Stream has no actual job. The atomic script cannot eliminate every external-system failure, but it removes this reproducible half-step state.

The consumer group is created from `0-0`, so entries that existed before group creation still have a chance to be consumed. When a worker NACKs, the message remains in the Pending Entries List (PEL) instead of being silently deleted.

## PEL recovery and observable state

[UnackedStreamEntriesReaper](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/queue/outbox/reaper/UnackedStreamEntriesReaper.java) scans idle entries every 10 seconds by default, advances at most one entry per sweep, and exposes PEL size, queue delay, oldest-entry age, and DLQ metrics. The current visibility-timeout constant is `1_800_000L`, or 30 minutes; it is an implementation parameter, not an SLO.

Reclaimed jobs still pass through the generation/attempt fence in the judge executor. Recoverable delivery does not give an old message permanent permission to write.

## This is not exactly-once

The boundary between the database transaction and external Redis operations remains. A more accurate description is:

```text
persistent business intent
    + retryable delivery
    + message-level deduplication
    + fenced result writes
    = explainable at-least-once processing path
```

This is more reliable than saying “messages never repeat,” because duplicate delivery and duplicate execution can still happen. What the system actually protects is the final state from arbitrary duplicate or stale results.

## Applying the model to LLM/Agent systems

Long-running Agent tasks should not rely only on an in-memory queue. User requests, tool-call intent, execution state, and retry reasons need recoverable records; idempotency keys identify duplicate triggers; final writes still need version fences. The window where “the model request succeeded but the tool job was not created” is the same class of problem as the submission/outbox window in an online judge.

## Minimal verification path

Read [JudgeOutboxDispatcher.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/modules/queue/outbox/dispatcher/JudgeOutboxDispatcher.java) and [RedissonStreamsJudgeQueueAdapter.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/queue/port/adapter/RedissonStreamsJudgeQueueAdapter.java), then inspect [SubmissionOutboxDispatcherIT](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/test/java/com/ulticode/modules/queue/outbox/dispatcher/SubmissionOutboxDispatcherIT.java).

