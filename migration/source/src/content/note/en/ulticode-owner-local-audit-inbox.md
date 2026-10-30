---
title: "Do Not Audit Across Owners by Writing Across Databases: UltiCode's Local Outbox and Consumer Inbox"
timestamp: 2026-09-09 00:00:00+08:00
series: "Architecture and Engineering Practice"
kind: concept
status: provisional
sources: ["ulticode-reliability-core-f801a1076"]
related: ["ulticode", "ulticode-owner-and-facts", "ulticode-outbox-redis-streams"]
tags: [UltiCode, Audit, DataOwner, Outbox, Inbox, RedisStreams, EventualConsistency, Idempotency, LLM]
description: "How Auth/App local audit outboxes, owner-specific Redis Streams, and an Admin consumer inbox handle double writes, duplicate delivery, lease recovery, and eventual consistency across owners."
toc: true
---

> **Evidence status**: This article is based on the audit adapters, dispatchers, Admin inbox bridge, consumer inbox, and database migrations in UltiCode's fixed main commit f801a1076. The repository contains these mechanisms; it does not prove cross-service exactly-once processing or zero-loss production auditing.

Audit logging has a constraint that is easy to underestimate: the action that produces an audit event and the module that stores the audit log are often different Data Owners.

For example, when Auth changes a login policy, Auth knows best whether the action really committed, while Admin may own the unified audit_logs read model. If Auth synchronously calls Admin to write a log after the business transaction commits, there is an irreversible window: the business action succeeded but the remote log write failed. If Admin is written first and Auth commits afterward, a log may remain with no corresponding business action.

This is not primarily a question of whether to add a message queue. First decide which database transaction guarantees that the action and audit intent exist together, which module owns final materialization, and who converges duplicates and failures.

## Why direct cross-database writes are insufficient

The direct approach is for an Auth/App service method to call an Admin write API inside its local transaction:

```text
begin Auth transaction
  update Auth data
  call Admin.writeAudit()
commit Auth transaction
```

There are three concrete gaps:

1. If the Admin request fails, whether the local transaction rolls back depends on remote-call timing and exception propagation; a network timeout may mean that Admin already wrote successfully but the response never returned.
2. If the Admin audit table and the Auth/App business table are in different databases, ordinary @Transactional cannot make them one atomic commit.
3. Even with a message queue, consumer retries can deliver the same event multiple times; “the message was sent” does not mean the business side effect happened only once.

For low-value diagnostic logs that may be dropped, direct asynchronous logging can be sufficient. Audit records usually need traceability and replayability, which is when the following state-machine cost becomes worthwhile.

## First boundary: keep audit intent in the owner that produced the fact

UltiCode does not let Auth/App write Admin's table directly during the action commit. Each owns a local audit outbox:

```text
Auth/App local transaction
    ├── write business state
    └── insert audit_outbox(PENDING, eventId, payload)
              │
              └── local dispatcher
                    └── owner-specific Redis Stream
```

The key value of AuthAuditSinkAdapter and AppAuditSinkAdapter is not “one more table.” It puts the two actions that must happen together into one owner's local transaction:

```text
@Transactional
    ├── commit the Auth/App change
    └── insert local audit_outbox
```

The window where the business action succeeds but no audit intent exists is reduced to what a local database transaction can handle. The dispatcher then takes responsibility for cross-system delivery: it claims records with a claim owner, writes to the corresponding Stream, marks them delivered on success, and records retry on failure instead of hiding delivery failure in logs.

Admin intentionally does not read Auth/App tables directly. It receives an event contract rather than another owner's Mapper or Entity, preserving the Data Owner write boundary.

## Second boundary: enter the Inbox before acknowledging ownership

The Admin bridge order matters:

```text
Redis Stream
    │ read
    ▼
validate eventId / type / owner / payload
    │
    ├── invalid -> poison path
    └── valid
          │
          ▼
consumer_inbox.insertIfAbsent(consumer, eventId, payload)
          │
          └── only then ACK Stream
```

AdminAuditIntegrationInboxBridge validates the message first, then takes it into Admin's local consumer_inbox. If the process crashes before writing the Inbox, the Stream message remains unacknowledged and can be read again. If the Inbox was inserted but the ACK was interrupted, the next read hits the unique key; insertIfAbsent identifies the duplicate and the message can be safely ACKed.

The consumer inbox unique key is (consumer, event_id). This is more accurate than making eventId globally unique: one event may have multiple legitimate consumers, while each consumer needs deduplication only for its own side effects.

Admin also checks that the event id matches auditId in the payload. It looks conservative, but prevents an outer message saying A while its internal payload says B; the same event id drives the audit log's idempotency key.

## Third boundary: the Inbox is a recoverable state machine too

Writing a message to the Inbox only solves durable takeover. It does not solve a consumer crash halfway through processing, so ConsumerInboxMapper and InboxConsumer create another local state:

```text
PENDING
  └── claim -> PROCESSING
                 ├── heartbeat/renew
                 ├── success -> PROCESSED
                 └── failure -> PENDING(next_retry_at) or DEAD
```

The consumer claims PENDING rows or PROCESSING rows whose lease expired, and writes a lease owner/expiry. A normal handler's business side effect and the Inbox terminal update run in one transaction:

```text
@Transactional
    ├── apply Admin audit log if event is new
    └── mark inbox row PROCESSED
```

When the handler fails, the error and next retry time are recorded; after the limit, the row enters DEAD. If the process crashes before the side effect commits, the transaction rolls back and the Inbox can retry. If the side effect commits but the terminal update does not, the same transaction prevents them from being split. External side effects that cannot join the transaction still need downstream idempotency keys or compensation rules.

## Why two Outbox/Inbox layers instead of one shared event table

The two-layer structure looks repetitive, but the responsibilities differ:

| Location | Problem it handles | What it cannot replace |
|---|---|---|
| Auth/App local outbox | the audit intent survives the local business commit | does not guarantee one successful remote delivery |
| Redis Stream | cross-owner asynchronous transport, consumer groups, and pending visibility | does not replace database idempotency or business transactions |
| Admin consumer inbox | which consumer durably took the event and duplicate suppression | does not make every handler side effect atomic |
| audit_logs | Admin's local audit read model | cannot roll back the Auth/App business transaction |

If every module shared one event table, bridge code would appear smaller, but write permissions, migration schedules, and failure recovery for different Owners would become coupled. A more direct alternative is two-phase commit, but it requires every resource to join one coordination protocol. For a path mixing databases, Redis, and independent services, an explicit eventual-consistency state machine is usually cheaper.

## What this design actually guarantees

It separates guarantees that are often conflated:

- **Local atomicity**: the business change and local audit outbox commit in one Owner transaction.
- **Retryable delivery**: dispatcher failure keeps retry state, and an unacknowledged Stream message can be taken over.
- **Consumer deduplication**: the (consumer, event_id) unique key and insertIfAbsent prevent duplicate delivery from creating the same Inbox task twice.
- **Processing recovery**: an expired consumer lease can be reclaimed, failures can back off, and long-term failures can enter a dead-letter state.
- **Idempotent audit persistence**: Admin uses the event id as the audit record's idempotent identity and checks its relation to the payload.

It does not guarantee immediate cross-database consistency, exactly-once external side effects, that messages never disappear, that consumers never execute twice, or that every poison event can be repaired automatically. The accurate description is: delivery and attempts may repeat, but final side-effect authority is narrowed by local transactions, unique keys, and idempotent handlers.

## Cost, fit, and failure boundaries

This design fits when the event source and final read model belong to different Owners, the business action must not fail merely because the audit service is temporarily unavailable, and audit events need traceability, retries, and duplicate detection.

The costs are real: at least outbox, Stream, and Inbox state must be maintained; claim leases, backoff, dead letters, monitoring, and schema compatibility must be handled; every event needs a stable id and payload validation. A small monolith with one database and audit allowed in the same transaction may be better served by one local audit table.

Three failure patterns are easy to miss:

1. The business write path omits the outbox insert, so the reliable delivery chain has no event at its source.
2. The consumer separates an external call from markProcessed without an idempotency key or compensation; the Inbox proves only that a retry occurred, not that the side effect was not duplicated.
3. Only Stream lag is monitored while DEAD count, oldest Inbox lease, and retry age are ignored; the system looks consumed while the local state machine is stalled.

## Applying the model to LLM/Agent systems

Agent tool calls can likewise reach “the task was accepted but no audit event was recorded” or “the tool result was applied but the confirmation was lost before ACK.” Write the user request and tool intent to the caller's local outbox, carry it across components in a stream with an event id, and give each side-effect consumer its own Inbox and idempotency rules.

Do not reduce this to “add a message queue to the Agent.” The portable responsibility split is: who owns the fact, who saves the send intent, who confirms durable takeover, and who makes repeated execution safe.

## Minimal verification path

During source review, this order exposes gaps more reliably than looking only at table definitions:

1. Read AuthAuditSinkAdapter and AppAuditSinkAdapter to confirm that the outbox insert really sits on the business transaction path.
2. Read AdminAuditIntegrationInboxBridge to confirm that the Stream ACK occurs after Inbox persistence.
3. Read ConsumerInboxMapper, InboxConsumer, and AdminAuditEventConsumer together to check lease recovery, uniqueness, and closure of the handler transaction.

The repository contains Auth/App audit-dispatcher tests and Admin audit/inbox tests. This article-writing round did not rerun UltiCode's Maven tests and does not present the existence of test files as a real Redis multi-instance or cross-database failure exercise.

