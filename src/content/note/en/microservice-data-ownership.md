---
title: "Microservice Data Ownership: Establish the Domain Owner First, Then Talk About Database Splitting and Migration"
timestamp: 2026-08-13 00:00:00+08:00
series: "Architecture & Engineering Practice"
kind: concept
status: active
draft: true
sources: ["microservice-domain-data-ownership", "microservice-domain-data-ownership-correction"]
related: ["database-schema-drift", "multi-service-readiness", "dubbo-nacos-runtime"]
tags: ["Microservices", "Bounded Context", "Data Ownership", "Database-per-Service", "Saga", "Transactional Outbox", "Strangler Fig"]
description: "Establishes an order for determining data ownership with service-private data, bounded context, saga, transactional outbox, and expand-migrate-contract, so a shared physical database, a shared schema, and service autonomy are not conflated."
toc: true
---

**Conclusion first**: The first step of microservice decomposition is not splitting the database into multiple instances, but determining the bounded context, the final write owner, and the data access contract. Service data should be accessed through API/messages; a shared physical database server can be a transitional deployment, while multiple services reading and writing the same business schema/table is the main coupling. Migration proceeds as `expand → migrate → contract`; `contract` must close the rollback window before deleting old objects.

## 1. Determine the owner with a four-layer sequence

```text
business capability / bounded context
  -> owner service
  -> private schema/table
  -> API/event contract
  -> consumer and migration gate
```

Do not reverse-engineer the design owner from "who directly queries this table now"; that usually only reflects historical coupling. A domain should have one final write owner. Replicated tables, read models, or caches in other services must be explicitly marked as derived data, and the refresh, invalidation, and rebuild approach must be defined.

## 2. The boundary of database-per-service

The core of `database-per-service` is that persisted data belongs to the service, and other services must not bypass the service API/messages to directly reach its business tables. The database is part of the service implementation, so the schema and migration should also fall under the owner's change responsibility.

There is a distinction often overlooked:

| Form | Does it automatically equal a shared data boundary |
| --- | --- |
| Multiple services share the same physical database server | No, schema/database isolation can be used as a transition |
| Multiple services read and write the same business schema/table | Yes, it creates development-time and runtime coupling |
| Module-private tables in a modular monolith | Splitting the database is not necessarily required; keeping the module boundary is enough for now |

Changes to a shared schema require coordination among all accessors; queries and locks also affect each other at runtime. Therefore, "already split into multiple processes" does not mean "data autonomy is complete".

## 3. Cross-service consistency: saga and outbox each solve one problem

### Saga

A flow spanning multiple services or resources is split into multiple local transactions, driven by events/commands, with compensating transactions executed on failure. Saga requires visible intermediate states, idempotent compensations, and retryable failures; it does not turn local transactions into transparent 2PC.

Introduce saga only when the flow truly spans multiple services and resources and cannot be re-bounded. Updates within a single service should not become distributed transactions prematurely just because "it might be split in the future".

### Transactional outbox

Business state and outbox records are written in the same local transaction: on commit both exist, on rollback both disappear, and the relay then publishes the events. It solves the atomicity gap between business updates and message records.

The outbox still needs consumer idempotency, duplicate-delivery handling, ordering policy, and monitoring; do not introduce it when there is no event-driven publishing path.

## 4. The three stages of incremental migration

### Expand

Add tables, fields, or APIs while keeping the old reads and writes working. Establish a compatibility surface first; do not delete old columns or switch the unique writer in the first step.

### Migrate

Double-write or replicate with CDC, verify the old and new data and event results, and gradually switch the read path to the new owner. Double-write failures, latency, and replay must be observed and compensated.

### Contract

After the new system becomes the system of record, delete the old objects and compatibility logic. Deleting means the rollback window closes, so first confirm verification, backups, alerts, and an alternative rollback plan. When requests cannot be intercepted, the old system cannot be modified, or there is no verifiable synchronization path, strangler fig should not be applied mechanically.

## Minimal domain audit

Before splitting or migrating, record per domain:

1. the bounded context and business owner;
2. the current system of record and final writer;
3. every service, script, and report that directly reads and writes the same table;
4. whether API, events, and outbox cover every change path;
5. whether saga is really needed and whether compensations are idempotent;
6. the verification gates for expand/migrate/contract;
7. backups and rollback alternatives after contract;
8. the difference between a shared physical instance and a shared schema.

This checklist is a decision standard, not a fact about any specific project. Project-side work must continue reading the schema, queries, configuration, and callers in the pinned commits.

## Common misconceptions

- **"One service, one database server is the only ownership."** Ownership is first defined by the access boundary and the final writer; physical isolation can be completed incrementally.
- **"Shared tables are just a development convenience."** They also produce schema-change coordination and runtime lock/query coupling.
- **"Saga is a painless substitute for distributed transactions."** It introduces compensation, intermediate states, and idempotency requirements.
- **"Adding an outbox guarantees messages are sent exactly once."** The outbox guarantees records are consistent with the local transaction; it does not eliminate duplicate delivery.
- **"Contract is just deleting old code at the end."** It closes the rollback window and must be treated as an independent migration gate.

## Evidence boundary

The layering of revision-pinned documents and live pages is in the repo at `src/content/raw/zh-cn/microservice-domain-data-ownership-correction.md`; neither the initial snapshot nor the correction snapshot proves which services, tables, or owners the current project actually has — real ownership requires source and schema evidence from the target repository.
