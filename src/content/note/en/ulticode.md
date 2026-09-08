---
title: "UltiCode: Modular Architecture and Domain Boundaries of an Online Judge Platform"
timestamp: 2026-08-21 00:00:00+08:00
series: "Architecture and Engineering Practice"
kind: entity
status: provisional
sources: ["ulticode-project-context"]
related: ["microservice-data-ownership", "dubbo-nacos-runtime", "jjwt-013-security-api", "multi-service-readiness", "database-schema-drift"]
tags: [UltiCode, OnlineJudge, DDD, Port, Projection, Dubbo, Nacos, Sandbox]
description: "Uses the fixed README/CONTEXT as evidence to summarize UltiCode's owner split, deep port/projection modules, judging transaction invariants, and transitional compatibility seams, while marking uncertainty during architectural convergence."
toc: true
---

> **Graduation conditions (3 verifiable checks)**:
> 1. A minimal E2E experiment for the judging transaction (port/projection transaction rollback);
> 2. Counterexamples and refactoring evidence when module owner boundaries are violated;
> 3. Explicit statements and tests for Redis Streams consumption and concurrency boundaries.

`UltiCode` is a full-stack online judge platform covering a problem bank, contests, community, achievements, and an administration console. The backend is a Java 17 + Spring Boot 3.2.5 Maven reactor with multiple modules (auth/admin/app/notification/judge/submission); the frontend consists of strict-mode Vue 3 + TypeScript Console and Management applications. This page describes the declared state of the public repository's fixed main commit `3f14ac89`; the repository is still converging architecturally, so the page is marked `provisional`.

## Core Mechanism

### Owner Split and Gateway

- Each API gateway route has one owner: Auth :9101, Admin :9102, App :9103, Notification :9105, authenticated with JWT + Redis Session.
- Submission is a compatibility owner seam (:9106 / Dubbo 20886 internally), in transition and without business HTTP; an independent Judge worker consumes Redis Streams.
- Infrastructure: MySQL 9.1 (Flyway migrations), Redis 7, and Nacos 2.3.2 as the registry/configuration center (the runtime registration boundary is covered in [Dubbo + Nacos](/note/dubbo-nacos-runtime)).

### Deep Port / Projection Module Pattern

- **Port**: an interface owned by the consuming module and adapted by the providing module (dependency inversion), such as `ContestSubmissionPort`, `TokenBlacklistPort`, and `CurrentUserProvider`. `TokenBlacklistPort` exposes only the read side and fails closed: a Redis failure must not let a revoked token through.
- **Projection**: each domain is a deep module that owns entity-to-VO projection and read-side aggregation (`ProblemProjection`, the `AdminXxxProjection` family), moving VO shaping out of orchestration services.
- **Realtime push seam**: six consuming modules own push ports that invert the WebSocket path, removing the old `RealtimeService` god service.

### Judging Transaction Invariants

- Submission and ContestSubmission are recorded synchronously in the **same transaction** (D-04); post-contest scoring is event-driven through AFTER_COMMIT.
- ContestSubmission is recorded only when the contest is RUNNING and the participant is STARTED (D-05/D-06); Accepted in a virtual contest does not trigger achievements (R6.3/F-08).
- The contents of HIDDEN test cases must never be exposed to users (P0-1).

## Applicability

- Practice, contest, community, and administration scenarios that need a complete online-judge loop.
- Teams willing to collaborate in a multi-module monorepo with private domain modules (`modules/`) and explicit port boundaries.

## Inapplicability and Risks

- The architecture documentation describes an ongoing convergence: the Submission compatibility seam and the Admin read-model seam still have “future phases”, so their interfaces may continue to change.
- The original `wiki/concepts/` ADR layer was retired on 2026-07-09; the design rationale is scattered across commit messages and source Javadocs, increasing traceability cost.
- README ports and versions describe development state and have not been validated in production deployment.

## Minimal Verification

1. Start the infrastructure with Docker Compose and run the `scripts/dev` initialization flow; confirm Nacos registration and gateway-route health (see the multi-service readiness gate in [multi-service-readiness](/note/multi-service-readiness)).
2. Submit one piece of code to validate the Submission → Judge outbox → verdict → AFTER_COMMIT scoring chain.
3. Compare local schema with Flyway migration history to detect drift (method: [Database Schema Drift](/note/database-schema-drift)).

## Evidence and Uncertainty

- **Source facts**: The architecture diagram, owner split, domain vocabulary, and design invariants come from the README and CONTEXT.md at fixed commit `3f14ac89` (`ulticode-project-context`).
- **Synthesis in this page**: The vocabulary is organized into three layers: “owner — seam — invariant”.
- **Unconfirmed**: Unpublished refactoring in the local workspace, which is 25 commits ahead of `origin/main`, is excluded; sandbox D-form isolation strength, judging throughput, and leaderboard-rule correctness have not been independently reproduced.

## Related Pages

- [microservice-data-ownership](/note/microservice-data-ownership)
- [dubbo-nacos-runtime](/note/dubbo-nacos-runtime)
- [jjwt-013-security-api](/note/jjwt-013-security-api)
- [multi-service-readiness](/note/multi-service-readiness)
- [database-schema-drift](/note/database-schema-drift)
