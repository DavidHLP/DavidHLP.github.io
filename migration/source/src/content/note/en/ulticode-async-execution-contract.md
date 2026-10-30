---
title: "UltiCode Async Execution Contract: Idempotency, Fingerprints, and Bounded Receipts"
timestamp: 2026-09-09 00:00:00+08:00
series: "Architecture and Engineering Practice"
kind: concept
status: provisional
sources: ["ulticode-engineering-highlights-f801a1076"]
related: ["ulticode"]
tags: [UltiCode, OnlineJudge, Async, Idempotency, Fingerprint, StateMachine, Judge0, LLM]
description: "How UltiCode lets synchronous previews and asynchronous execution share a contract, using idempotency keys, SHA-256 fingerprints, a state machine, and memory limits to constrain long-running jobs."
toc: true
---

> **Evidence status**: This article is based on UltiCode's asynchronous execution interface and Judge provider source. The current implementation includes a Docker default adapter, an optional Judge0 adapter, and bounded in-process metadata; durable receipt idempotency across replicas or restarts remains an explicit gap.

Synchronous preview and asynchronous execution solve the same problem at different time scales: the former aims to return quickly, while the latter allows a job to be queued, run, cancelled, or timed out. If both paths define their inputs, states, and errors independently, callers eventually receive two incompatible execution semantics.

## Define the execution contract first

[AsyncSandboxExecutor](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/submission/runtime/async/AsyncSandboxExecutor.java) exposes `submit`, `poll`, and `cancel`, and constrains execution states to:

```text
QUEUED -> RUNNING -> COMPLETED
                  ├-> FAILED
                  ├-> CANCELLED
                  └-> TIMED_OUT
```

`ExecutionRequest` requires a job, test case, visibility, and a non-empty idempotency key. The default key is `job.runId:testCase.id`, and a SHA-256 fingerprint is computed at the same time. Thus, “the same key” is not merely a string comparison; the payload can also be checked for consistency.

## The provider owns entry-point constraints

[CodeExecutionProvider](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge/src/main/java/com/ulticode/judge/provider/CodeExecutionProvider.java) enforces several important boundaries at the entry point:

- synchronous `execute` accepts only `PUBLIC_PREVIEW`;
- business failures are mapped to typed `RpcResult` values, so callers do not parse arbitrary strings;
- asynchronous submission is limited to one test case;
- metadata is reclaimed after completion, cancellation, or timeout, while failed states remain queryable;
- metadata is capped at 1024 entries with a 15-minute TTL.

These limits look conservative, but they prevent a preview endpoint from gradually becoming an unbounded global task manager.

## Adapters may change; semantics must not drift

Docker is the default asynchronous runtime and Judge0 is an optional adapter. Both Docker and Judge0 have idempotent replay tests: a terminal receipt for the same idempotency key can be replayed, while a different payload cannot unconditionally reuse the same handle.

When the execution backend is replaced, what must remain stable is the contract: the input fingerprint, state invariants, cancellation semantics, and terminal result—not an adapter's internal API.

## Current gap: receipts are not a durable queue

The architecture documentation explicitly states that asynchronous receipt metadata is limited to process-local memory. Durable idempotency across replicas and restarts is unfinished, and an external Judge0 instance is not validated by default. Therefore, this article can only claim a “bounded asynchronous execution seam,” not that jobs can be recovered after every restart.

## Applying the model to LLM/Agent systems

Agent jobs should likewise have explicit `QUEUED/RUNNING/COMPLETED/FAILED/CANCELLED/TIMED_OUT` states, idempotency keys, input fingerprints, and metadata limits. When a user clicks “continue execution” repeatedly or multiple Agents take over the same job, payload conflicts must be returned explicitly instead of silently reusing an old result.

## Minimal verification path

Read [AsyncSandboxExecutor.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/submission/runtime/async/AsyncSandboxExecutor.java) and [CodeExecutionProvider.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge/src/main/java/com/ulticode/judge/provider/CodeExecutionProvider.java), then compare them with [DockerAsyncSandboxAdapterTest](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/test/java/com/ulticode/modules/submission/runtime/async/DockerAsyncSandboxAdapterTest.java) and [Judge0AsyncSandboxAdapterTest](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/test/java/com/ulticode/modules/submission/runtime/async/Judge0AsyncSandboxAdapterTest.java).

