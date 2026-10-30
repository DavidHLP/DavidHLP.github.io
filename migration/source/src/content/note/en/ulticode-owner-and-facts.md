---
title: "UltiCode Data Owners and Fact Snapshots: Keeping Cross-Service Submissions Bounded"
timestamp: 2026-09-09 00:00:00+08:00
series: "Architecture and Engineering Practice"
kind: concept
status: provisional
sources: ["ulticode-engineering-highlights-f801a1076"]
related: ["ulticode"]
tags: [UltiCode, OnlineJudge, DataOwner, Contract, Port, Projection, Snapshot, LLM]
description: "How UltiCode's owner boundaries and SubmissionFactsSnapshot turn the source, capture time, and schema version of cross-service facts into an explicit contract."
toc: true
---

> **Evidence status**: This article is based on UltiCode's architecture documents and source at fixed commit f801a1076. “Repository Implemented” means the repository contains the corresponding design and implementation; it does not mean production validation.

An online judge submission API looks simple: a user submits code, the system finds the problem, and then hands it to the Judge. But “find the problem” and “confirm that the user is valid” are cross-module facts. If Submission temporarily queries App, Auth, or Contest inside its own database transaction, the write path also takes on remote calls, authorization decisions, and temporal consistency.

UltiCode first draws the data-owner boundaries, then gathers the external facts needed for a submission into an immutable snapshot. The point is not to add another DTO; it is to make “who supplied the fact, when was it captured, and which version explains it” an inspectable input contract.

## First decide who owns each fact

The current architecture document separates five Data Owners and two Workers:

| Role | Facts and writes it owns | Boundary |
|---|---|---|
| Auth | identity, credentials, refresh state, RBAC, JWKS | does not write another owner's business tables |
| Admin | administration, audit, settings, monitoring, backups, and read models | does not take over App/Submission domain writes |
| App | user profiles, problems, contests, community, interaction, and subscriptions | does not directly own Submission results |
| Submission | submissions, judging state, generations, leases, results, and judging outbox | does not write Problem, TestCase, or Contest tables |
| Notification | notifications, preferences, delivery ledger, email, and retries | does not scatter notification state into business owners |
| Judge/Search Worker | judge execution or derived search indexes | does not write business tables or expose an HTTP business entry point |

Source: [owner and module boundaries](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/docs/architecture/modules.md). Cross-owner calls use provider-owned contracts or consumer-owned ports; shared Entities, Mappers, and business Services are not used as integration protocols.

## Submission receives an immutable fact snapshot

On the App side, [RemoteSubmissionWritePort](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/app/app-web/src/main/java/com/ulticode/modules/submission/port/adapter/RemoteSubmissionWritePort.java) captures before the remote submission:

- userId and userExists;
- problem id, title, slug, time limit, memory limit, and starter code;
- capturedAtEpochMillis and schemaVersion.

The Submission API receives these facts through [SubmissionFactsSnapshot](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/api/submission-api/src/main/java/com/ulticode/submission/api/dto/SubmissionFactsSnapshot.java). Its core validation can be summarized as:

```java
return schemaVersion == CURRENT_SCHEMA_VERSION
        && userExists
        && Objects.equals(userId, requestedUserId)
        && problem != null
        && Objects.equals(problem.id(), requestedProblemId);
```

This does not copy App's database into Submission. It packages the minimum facts needed by one request as a versioned input. Submission can validate the snapshot and write Pending within its own transaction, without an implicit remote query deciding what a given id means “right now.”

## What this design actually solves

First, it shrinks Submission's dependency surface: the write side depends on SubmissionIntakePort and the snapshot contract, not on App/Auth implementation details.

Second, it gives tests an explicit boundary: nonexistent users, stale schema versions, and a mismatch between the snapshot's problem id and the request can all be tested without starting the entire system.

Third, it preserves request-time context for asynchronous judging. When a job is retried later, it carries already-determined input rather than requiring the consumer to reread display data that may have changed.

## What must not be over-interpreted

A fact snapshot is not a complete authorization proof or a global consistency protocol across owners. Snapshot expiry, problem revocation, user-permission changes, Contest admission, and sensitive-field redaction still need independent rules. The snapshot solves which captured facts the submission write depends on; it does not solve every identity or business policy.

## Applying the model to LLM/Agent systems

LLM tool calls likewise need request-time facts: files that may be accessed, user permissions, tool and model versions, an input summary, and resource limits. Making them a timestamped, schema-versioned snapshot is easier to reproduce, audit, and reject as stale than having every Agent in a long chain query global state.

## Minimal verification path

Read [SubmissionFactsSnapshot.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/api/submission-api/src/main/java/com/ulticode/submission/api/dto/SubmissionFactsSnapshot.java) and [RemoteSubmissionWritePort.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/app/app-web/src/main/java/com/ulticode/modules/submission/port/adapter/RemoteSubmissionWritePort.java), then inspect [SubmissionFactsSnapshotTest](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/test/java/com/ulticode/submission/port/SubmissionFactsSnapshotTest.java). The test file is source evidence; this article does not present it as having been executed and passed in this round.

