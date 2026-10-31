---
{
  "archiveId": "X-1003",
  "title": "Knowledge Base Index",
  "en": "SITE INFORMATION",
  "category": "站点随笔",
  "department": "站点信息",
  "date": "2026-10-05",
  "lead": "DavidHLPL",
  "clearance": "PUBLIC",
  "abstract": "Knowledge Base Index · src/content/information/en/kb-index.md",
  "findings": [
    "Original document: src/content/information/en/kb-index.md",
    "Source revision: f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/information/en/kb-index.md",
  "pubDate": "2026-10-05T05:34:00.000Z",
  "tags": [
    "en",
    "information"
  ],
  "draft": false,
  "lang": "en",
  "legacy": {
    "path": "src/content/information/en/kb-index.md",
    "revision": "f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "metadata": {}
  }
}
---

# Knowledge Base Index

Start here to navigate the knowledge base, rather than a chronological blog archive. For a question, read this index first, then follow page `sources` and cross-links.

The canonical maintenance language is `zh-cn`. The knowledge base follows the [The LLM-Wiki Pattern: Maintaining a Compounding Personal Knowledge Base](/blog/legacy/note/en/llm-wiki-pattern/); contracts are in root [KB.md](https://github.com/DavidHLP/DavidHLP.github.io/blob/main/KB.md) and the [knowledge-base skill](https://github.com/DavidHLP/DavidHLP.github.io/blob/main/.claude/skills/knowledge-base.md).

> **Convergence design**: [KB convergence v1](https://github.com/DavidHLP/DavidHLP.github.io/blob/main/docs/kb-convergence-design.md) organizes presentation into six domains without changing `series` enums, with learning paths and a provisional graduation board. See `docs/kb-convergence-design.md`.

## Navigation and learning paths

**Six domains**: [A Knowledge/AI](#a-knowledge-bases-and-ai-engineering) · [B Java/concurrency](#b-java-and-concurrency) · [C Storage/cache](#c-storage-and-caching) · [D Distributed/microservices](#d-distributed-systems-and-microservices) · [E Infrastructure/operations](#e-infrastructure-and-operations) · [F Engineering/architecture](#f-engineering-and-architecture) · [Graduation](#graduation-watch-12-provisional-pages) · [Archives](#g-archived-and-deprecated) · [Raw](#raw-sources)

### Learning paths by intent

1. **Path 1 — Beginner mental model**：`llm-wiki-pattern` → `kb-session-ingest-contract` → `java-concurrency-deepdive` / `redis-business-patterns` → `java-online-performance-debug` → `multi-service-readiness`。Outcome: independently ingest one small topic.
2. **Path 2 — Distributed systems**：`microservice-data-ownership` → `database-schema-drift` → `dubbo-nacos-runtime` → `spring-cloud-and-boot` → `resicache-observer-nested-execution` → `plugin-lifecycle-management`。Outcome: judge database separation, registration, and migration boundaries.
3. **Path 3 — Agent pipeline**：`omp-config-and-rules-guide` → `omp-hook-extension-guide` → `headroom-compress-retrieve-contract` → `mcp-codebase-memory-workflow` → `hindsight-local-deployment` / `hindsight-omp-codex-integration` → `omp-headroom-provider-proxy`。Outcome: reproduce local OMP/Headroom/Codex memory and routing.

### Graduation watch (12 provisional pages)

| Page | Verifiable checks needed for graduation |
|---|---|
| [Headroom Single-Port Synthesis: Entry, Dynamic Upstreams, and Verification Boundaries](/blog/legacy/note/en/headroom-single-port-evolution/) | Pinned Headroom contract tests for explicit `/v1/messages` and `/v1/responses` routing; `model_cache` rebuild; `BindPaths` rollback. |
| [Headroom Route Persistence Synthesis: Named Profiles, model_cache, and Recovery](/blog/legacy/note/en/omp-headroom-persistence/) | Independent Named Profile isolation reproduction; derived `model_cache` deletion/rebuild; migration-only conditions for the old reconciler. |
| [Headroom with cc-switch / Claude Code Coexistence: Single Synthesis and Security Boundaries](/blog/legacy/note/en/headroom-cc-switch-coexistence/) | Redacted logs/capture of `8787→15721`; dual-write conflict counterexample; finalized `BindPaths` security boundary. |
| [OMP Headroom Bridge: External Routing Controller and Native Codex/OMP Proxy Boundaries](/blog/legacy/note/en/omp-headroom-provider-proxy/) | Coexisting loopback proxy, OMP provider route, and shared Codex provider smoke test; atomic restore/mode detection; repeatable rollback order. |
| [UltiCode: Verifiable Boundaries for Online Judging and Agent Engineering](/blog/legacy/note/en/ulticode/) | Owner boundaries, outbox/Streams delivery, generation/attempt fences, Docker sandbox, traceable release gates. |
| [Enhanced UISA: Owners, Boundaries, and Recovery for Heterogeneous-Node Sync](/blog/legacy/note/en/uisa-architecture-design/) | Replace implicit scale/threshold promises with reproducible retry/idempotency constraints; owner → boundary → recovery decision tree; failure matrix. |
| [Java Backend Interview Retrospective: Project Truth, Engineering Mechanisms, and Production Evidence](/blog/legacy/note/en/java-internship-interview-blog-polished/) | One redacted production containment → diagnosis → recovery case; pinned cache/async evidence; separate capability model from evidence. |
| [Database Written-Test Review: From SQL Semantics to Batch Data Processing](/blog/legacy/note/en/database-written-test-review/) | Pinned Oracle/MySQL/Spark/PDI reproductions; `NULL`, year boundary, same-table read/write tests; Kettle/large-table partitioned extraction recovery and reconciliation. |
| [ResiCache's Cache Responsibility Chain: Control Flow, Nested Fragments, and Observer Lifecycles](/blog/legacy/note/en/resicache-handler-chain-and-observer/) | Current `HandlerResult` flow, snapshot/fragment boundaries, observer token pairing, exceptional cleanup. |
| [Why Cache Stampedes Need a Future, a Distributed Lock, and a Double-Check](/blog/legacy/note/en/resicache-single-flight/) | Ten concurrent callers, leader/follower/reentrant, locked double-check, write-back failure, cross-instance boundaries. |
| [Why Async Early Expiration Only Shortens TTL: Version CAS Makes Stale Jobs Harmless](/blog/legacy/note/en/resicache-early-expiration-cas/) | Real Redis version race, Lua TTL CAS, stale-task rejection, TTL shortening without direct source loading. |
| [Replacing a Redis Serializer Is Not a One-Line Configuration Change: Object Trust and Rollback-Safe Migration](/blog/legacy/note/en/resicache-serialization-migration/) | Type whitelist, streaming preflight, shadow/dual/cutover/rollback, concurrent-write protection. |

> Retain provisional status until graduation, outside the main core-concepts view; quarterly review can mark unmet candidates `deprecated`.

---

## A. Knowledge bases and AI engineering

- [The LLM-Wiki Pattern: Maintaining a Compounding Personal Knowledge Base](/blog/legacy/note/en/llm-wiki-pattern/) — Three layers (raw/wiki/schema) and three operations (ingest/query/lint). Sources: `karpathy-llm-wiki`.
- [KB Session Ingestion Pipeline Contract: Incremental Reuse, Redaction v19, and Immutable Raw](/blog/legacy/note/en/kb-session-ingest-contract/) — Fixed source identity/content hashes, failure reprocessing, control-plane filtering, checkpoint ledger, and redaction audits. Sources: `kb-ingest-pipeline-v19`.
- [MCP Protocol Era Boundary and the codebase-memory-mcp v0.10.2 Graph Workflow](/blog/legacy/note/en/mcp-codebase-memory-workflow/) — Pinned modern MCP contracts with graph search, source, and coverage evidence discipline. Sources: `mcp-codebase-memory-workflow`.
- [Hindsight Local Compute Allocation and Dockerized Deployment](/blog/legacy/note/en/hindsight-local-deployment/) — Historical v0.9.1 deployment: GPU/CPU allocation, container networking, and UID boundaries; model provenance and current reproduction remain unverified. Sources: `hindsight-local-deployment-and-agent-integration`.
- [Hindsight Unified Memory Access: FastMCP Bridge and Dynamic Multi-Project Routing](/blog/legacy/note/en/hindsight-omp-codex-integration/) — Historical bridge, logical Bank partitioning/name collisions, MCP protocol gaps, and a single retrieval record. Sources: `hindsight-local-deployment-and-agent-integration`.
- [Hindsight Runtime Troubleshooting Matrix and Failure Modes](/blog/legacy/note/en/hindsight-troubleshooting/) — Seven historical failures; distinguish local model inventory, running state, syntax checks, and end-to-end validation. Sources: `hindsight-local-deployment-and-agent-integration`.

## B. Java and concurrency

- [AtomicBoolean: Atomic Boolean State and CAS Boundaries](/blog/legacy/note/en/java-atomic-boolean/) — Visibility, atomicity, minimal CAS transitions, and when stronger synchronization is needed. Sources: `legacy-java-atomic-boolean`.
- [AutoCloseable: Resource Ownership and Close-Exception Semantics](/blog/legacy/note/en/java-auto-closeable/) — try-with-resources ownership, closing order, and exception propagation. Sources: `legacy-java-auto-closeable`.
- [NullValue: The Cache-Null Placeholder and Serialization Boundary](/blog/legacy/note/en/java-null-value/) — Null placeholders and serialization recovery against cache penetration. Sources: `legacy-java-null-value`.
- [Java Concurrency Deep Dive: JUC, CAS, Atomics, Locks, and Threading](/blog/legacy/note/en/java-concurrency-deepdive/) — CAS links atomics, locks, cooperation, and reference types; ABA is identified. Sources: `ingest-java-concurrency`.
- [Redisson/Jackson's Default Serialization Behavior for LocalDateTime and the Write-Read Asymmetry Boundary](/blog/legacy/note/en/redis-jackson-java-time/) — Write failure versus cross-mapper read failure. Sources: `redis-jackson-java-time-contract`.
- [Java Production Performance Troubleshooting: A Minimal Symptom-to-Evidence Decision Tree](/blog/legacy/note/en/java-online-performance-debug/) — CPU/thread/GC containment → diagnosis → recovery. Sources: `legacy-java-online-performance-debug`.
- [JJWT 0.13.0: Explicitly Fixing the Signature Algorithm, Verifying by Key Type](/blog/legacy/note/en/jjwt-013-security-api/) — `signWith(Key)`/`verifyWith` key types and audience builder. Sources: `jjwt-013-security-api-contract`, `jjwt-013-security-api-contract-correction`.

## C. Storage and caching

- [Redis Business Patterns: Caching, Distributed Locks, Message Queues, Feed Streams, and Flash Sales](/blog/legacy/note/en/redis-business-patterns/) — Align caching and business semantics through consistency and exclusion. Sources: `ingest-redis-business`.
- [Redis Persistence and Internals: RDB/AOF, Data Structures, and Advanced Mechanisms](/blog/legacy/note/en/redis-persistence-principle/) — Recovery and performance of snapshots versus append logs. Sources: `ingest-redis-persistence`.
- [Redis Heima Practice: Distributed Cache, Multi-Level Cache, and Best Practices](/blog/legacy/note/en/redis-heima-practice/) — A checklist distilled from 200+ pages, with version gaps identified. Sources: `ingest-redis-heima`.
- [MySQL Storage Engines and Deadlock Detection](/blog/legacy/note/en/mysql-storage-and-deadlock/) — Engine capabilities and deadlock-log paths. Sources: `ingest-mysql-storage`.
- [Database Written-Test Review: From SQL Semantics to Batch Data Processing](/blog/legacy/note/en/database-written-test-review/) — Joins, `NULL`, indexes, date dialects, four-table SQL, Kettle, and huge-table operations: semantics → dialect → execution boundaries. Sources: `database-written-test-review`.
- [HBase Fundamentals, Architecture, and Operations: Data Model, Table Design, Shell, and Java API](/blog/legacy/note/en/hbase-foundation-and-ops/) — Logical/physical models, components, table design, and RDBMS tradeoffs. Sources: `ingest-hbase-foundation`.
- [Spark and Big Data Ecosystem: Hadoop, HBase, Spark Runtime Modes, and Clusters](/blog/legacy/note/en/spark-bigdata-ecosystem/) — Batch/stream engines and execution modes. Sources: `ingest-spark-ecosystem`.
- [MySQL Performance Triage: Symptom → Metric → Layer → Safe Mitigation](/blog/legacy/note/en/mysql-performance-troubleshooting/) — Connections, locks, indexes, transactions, IO, and Buffer Pool models. Sources: `legacy-mysql-performance-troubleshooting`.

## D. Distributed systems and microservices

- [Dubbo + Nacos: Verify the Registration Name and group/version First, Then Run a Real Smoke Test](/blog/legacy/note/en/dubbo-nacos-runtime/) — Interface/application registration, metadata, and startup checks. Sources: `dubbo-nacos-runtime-registration`, `dubbo-nacos-runtime-registration-correction`.
- [Spring Boot and Spring Cloud: Auto-Configuration, Transactions, Service Discovery, Gateway, and Observability](/blog/legacy/note/en/spring-cloud-and-boot/) — Anchor call paths in service registration/discovery. Sources: `ingest-spring-cloud`.
- [Microservice Data Ownership: Establish the Domain Owner First, Then Talk About Database Splitting and Migration](/blog/legacy/note/en/microservice-data-ownership/) — bounded context, private schema, saga/outbox, `expand→migrate→contract`. Sources: `microservice-domain-data-ownership`, `microservice-domain-data-ownership-correction`.
- [Database Schema Drift: Locating with the history, schema, and query Views](/blog/legacy/note/en/database-schema-drift/) — Flyway history versus actual schema versus application query; repair is not DDL rollback. Sources: `database-schema-drift-contract`.
- [ResiCache: Observer Nested Execution Must Distinguish Lifecycle, Fragments, and Scope Tokens](/blog/legacy/note/en/resicache-observer-nested-execution/) — Continuation inside locks with pinned source, runnable lifecycle model, and counterexamples; model validation is separate from real concurrency tests. Sources: `resicache-observer-nested-execution-contract`.
- [Multi-Service Startup Readiness: running, ready, and Dependency/Failure/Restart Propagation](/blog/legacy/note/en/multi-service-readiness/) — Compose/systemd ordering, dependencies, and health gates. Sources: `multi-service-readiness-contract`, `multi-service-readiness-contract-correction`, `multi-service-readiness-safety-correction`.

## E. Infrastructure and operations

- [Docker Fundamentals: Image Layers, Container Operations, and Compose Networking](/blog/legacy/note/en/docker-fundamentals/) — Layers, volumes, networking, and Compose boundaries. Sources: `ingest-docker-fundamentals`.
- [containerd TLS: Choosing a Trusted Chain or Temporary Verification Bypass](/blog/legacy/note/en/containerd-tls-troubleshooting/) — CA trust, runtime configuration, Kubernetes credentials, and caching. Sources: `legacy-containerd-tls-troubleshooting`.
- [SSH Intranet Access: Connection Direction, Exposure, and Recovery](/blog/legacy/note/en/intranet-penetration-ssh-guide/) — Compare Tunnel, Tailscale, and FRP. Sources: `legacy-intranet-penetration-ssh-guide`.
- [Testcontainers 1.20.6: Rule Out the Docker API Version First, Then Judge the daemon Unavailable](/blog/legacy/note/en/testcontainers-docker-api/) — Pinned `1.32` fallback, `api.version`, and HTTP 400 diagnosis. Sources: `testcontainers-docker-api-negotiation`, `testcontainers-docker-api-negotiation-correction`.
- [Plugin Lifecycle Management at Million-Endpoint Scale: State, Heartbeats, and Controlled Release](/blog/legacy/note/en/plugin-lifecycle-management/) — States, coalesced heartbeats, idempotency, staged rollout, and circuit breaking. Sources: `legacy-plugin-lifecycle-management`.
- *For operations troubleshooting also see [Java Production Performance Troubleshooting: A Minimal Symptom-to-Evidence Decision Tree](/blog/legacy/note/en/java-online-performance-debug/) in domain B.*

## F. Engineering and architecture

### Entities

- [OMP Headroom Bridge: External Routing Controller and Native Codex/OMP Proxy Boundaries](/blog/legacy/note/en/omp-headroom-provider-proxy/) — **provisional** Loopback Headroom, provider routes, shared Codex provider, transactions, and rollback. Sources: `omp-headroom-provider-proxy-codex-routing-runtime`.
- [ResiCache: Verifiable Concurrency and Consistency Boundaries for Cache Protection](/blog/legacy/note/en/resicache/) — **provisional** Responsibility chains, single-flight, value-version CAS, secure serialization, and observer lifecycles. Sources: `resicache-engineering-highlights-2954fff`, `resicache-project-overview`, `resicache-observer-nested-execution-contract`.
- [UltiCode: Verifiable Boundaries for Online Judging and Agent Engineering](/blog/legacy/note/en/ulticode/) — **provisional** Overview connecting nine articles on owners, auditing, delivery, result fences, leases, sandboxes, async execution, Core lifecycle, and release gates. Sources: `ulticode-engineering-highlights-f801a1076`, `ulticode-project-context`, `ulticode-reliability-core-f801a1076`.

### ResiCache design concepts

- [ResiCache's Cache Responsibility Chain: Control Flow, Nested Fragments, and Observer Lifecycles](/blog/legacy/note/en/resicache-handler-chain-and-observer/) — **provisional** `HandlerResult`, ThreadLocal snapshots, locked fragments, observer token pairing, and exceptional cleanup.
- [Why Cache Stampedes Need a Future, a Distributed Lock, and a Double-Check](/blog/legacy/note/en/resicache-single-flight/) — **provisional** Local single-flight, cross-instance locks, locked double-checks, role changes, and write-back failure.
- [Why Async Early Expiration Only Shortens TTL: Version CAS Makes Stale Jobs Harmless](/blog/legacy/note/en/resicache-early-expiration-cas/) — **provisional** `CachedValue.version`, Lua TTL CAS, per-key cancellation, and stale-task rejection.
- [Replacing a Redis Serializer Is Not a One-Line Configuration Change: Object Trust and Rollback-Safe Migration](/blog/legacy/note/en/resicache-serialization-migration/) — **provisional** Type whitelists, streaming preflight, shadow/dual/cutover/rollback, and concurrent-write protection.

### UltiCode design concepts

- [UltiCode Data Owners and Fact Snapshots: Keeping Cross-Service Submissions Bounded](/blog/legacy/note/en/ulticode-owner-and-facts/) — **provisional** Owners, `SubmissionFactsSnapshot`, fact origin, and schema versions. Sources: `ulticode-engineering-highlights-f801a1076`.
- [Do Not Audit Across Owners by Writing Across Databases: UltiCode's Local Outbox and Consumer Inbox](/blog/legacy/note/en/ulticode-owner-local-audit-inbox/) — **provisional** Owner-local audit outbox, Redis Stream, Admin inbox, duplicate delivery, and lease recovery. Sources: `ulticode-reliability-core-f801a1076`.
- [UltiCode Outbox and Redis Streams: Making Judge Delivery Recoverable](/blog/legacy/note/en/ulticode-outbox-redis-streams/) — **provisional** Outbox states, atomic deduplication, retry/dead-letter, and PEL recovery. Sources: `ulticode-engineering-highlights-f801a1076`.
- [UltiCode Generation and attemptId: Fencing Stale Judging Results with Conditional Updates](/blog/legacy/note/en/ulticode-generation-attempt-fence/) — **provisional** Rejudging, leases, generation epochs, and stale-result fencing. Sources: `ulticode-engineering-highlights-f801a1076`.
- [A Database Lease Is Not Enough: UltiCode Uses Fence Tokens to Stop Stale Singleton Jobs](/blog/legacy/note/en/ulticode-fenced-singleton-lease/) — **provisional** Database time, monotonic fence tokens, reconciliation completion writes, and stale-completion rejection. Sources: `ulticode-reliability-core-f801a1076`.
- [UltiCode Docker Sandbox: Resource Isolation and Infrastructure Error Classification](/blog/legacy/note/en/ulticode-docker-sandbox/) — **provisional** Docker/seccomp/resource limits and user versus infrastructure failures. Sources: `ulticode-engineering-highlights-f801a1076`.
- [UltiCode Async Execution Contract: Idempotency, Fingerprints, and Bounded Receipts](/blog/legacy/note/en/ulticode-async-execution-contract/) — **provisional** submit/poll/cancel, state machine, idempotency keys, and process-local metadata bounds. Sources: `ulticode-engineering-highlights-f801a1076`.
- [Treat a Modular Monolith as a Testbed: UltiCode Core's Allowlist, Timeouts, and Close-Once Lifecycle](/blog/legacy/note/en/ulticode-core-bounded-testbed/) — **provisional** opt-in, owner allowlist, bounded startup, close handoff, and fail-closed readiness. Sources: `ulticode-reliability-core-f801a1076`.
- [UltiCode Verification and Supply-Chain Gates: From Static Contracts to Verifiable Releases](/blog/legacy/note/en/ulticode-ci-supply-chain/) — **provisional** zero-infra/static, integration validation, Trivy, SBOM, provenance, and Cosign. Sources: `ulticode-engineering-highlights-f801a1076`.

### Syntheses and architecture patterns

- [OMP Configuration Layers: Model Roles, Agent Overrides, and Fallback Chains](/blog/legacy/note/en/omp-config-and-rules-guide/) — Configuration responsibilities and precedence. Sources: `legacy-omp-config-and-rules-guide`.
- [OMP Hook Extension Concept: Decision-Point Nudges, Hard Blocks, and Status Bridges](/blog/legacy/note/en/omp-hook-extension-guide/) — Soft nudges, hard gates, and status events. Sources: `legacy-omp-hook-extension-guide`.
- [Headroom 0.34 Compression and Retrieval Contract: Fields, Modes, and Real-Endpoint Tests](/blog/legacy/note/en/headroom-compress-retrieve-contract/) — `/v1/compress`, `/v1/retrieve`, CCR, and contract tests. Sources: `headroom-0-34-compress-retrieve-contract`.
- [Enhanced UISA: Owners, Boundaries, and Recovery for Heterogeneous-Node Sync](/blog/legacy/note/en/uisa-architecture-design/) — **provisional** Owner, reliability, idempotency, heterogeneity, and recovery tradeoffs. Sources: `legacy-uisa-architecture-design`.
- [Headroom Single-Port Synthesis: Entry, Dynamic Upstreams, and Verification Boundaries](/blog/legacy/note/en/headroom-single-port-evolution/) — **provisional** Port 8787 entry, dynamic upstreams, and historical assumptions. Sources: `legacy-headroom-single-port-evolution`.
- [Headroom Route Persistence Synthesis: Named Profiles, model_cache, and Recovery](/blog/legacy/note/en/omp-headroom-persistence/) — **provisional** Isolation, reconciler, and recovery validation. Sources: `legacy-omp-headroom-persistence`.
- [Headroom with cc-switch / Claude Code Coexistence: Single Synthesis and Security Boundaries](/blog/legacy/note/en/headroom-cc-switch-coexistence/) — **provisional** 8787/15721/`/v1/messages`/`BindPaths`. Sources: `headroom-cc-switch-coexistence-runtime`.
- [Java Backend Interview Retrospective: Project Truth, Engineering Mechanisms, and Production Evidence](/blog/legacy/note/en/java-internship-interview-blog-polished/) — **provisional** A capability model rather than an interview question bank. Sources: `legacy-java-internship-interview-blog-polished`.

## G. Archived and deprecated

- [Hindsight Fully Local Deployment and Unified Memory Integration for OMP / Codex (archived)](/blog/legacy/note/en/hindsight-local-deployment-and-agent-integration/) — The historical 445-line monolith split into deployment, integration, and troubleshooting under the one-concept-per-page principle.
- [Frontend and Miscellaneous Essays: Vue, MyBatis, UniApp, Cache Annotations, and Environment Troubleshooting (archived)](/blog/legacy/note/en/frontend-mybatis-essays/) — Ten miscellaneous notes dissolved into an archive; facts remain in immutable raw snapshot `ingest-frontend-essays`.

---

## Raw sources

> Of 53 raw sources, 10 are read-only Personal/Fuwari `legacy-aggregate` packages. New sources no longer use aggregate types.

<details>
<summary>All 53 raw sources (43 individual + 10 legacy-aggregate)</summary>

| slug | Type | Source | Summary | Aggregate |
|---|---|---|---|---|
| `karpathy-llm-wiki` | gist | [Original URL](https://gist.githubusercontent.com/karpathy/442a6bf555914893e9891c11519de94f/raw/ac46de1ad27f92b28ac95459c782c07f6b8c964a/llm-wiki.md) | Incremental personal knowledge-base pattern using LLMs. | — |
| `legacy-java-atomic-boolean` | legacy-blog | [Historical file](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/jotting/zh-cn/java-atomic-boolean.md) | Original AtomicBoolean, volatile, CAS, and concurrent-state notes. | — |
| `legacy-java-auto-closeable` | legacy-blog | [Historical file](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/jotting/zh-cn/java-auto-closeable.md) | Original AutoCloseable and try-with-resources. | — |
| `legacy-java-null-value` | legacy-blog | [Historical file](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/jotting/zh-cn/java-null-value.md) | Original Spring Cache NullValue and null caching. | — |
| `legacy-java-internship-interview-blog-polished` | legacy-blog | [Historical file](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/java-internship-interview-blog-polished.md) | Original Java backend internship interview review. | — |
| `legacy-java-online-performance-debug` | legacy-blog | [Historical file](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/java-online-performance-debug.md) | Original Java CPU, Arthas, and recovery decisions. | — |
| `legacy-containerd-tls-troubleshooting` | legacy-blog | [Historical file](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/containerd-tls-troubleshooting.md) | Original private-registry containerd TLS troubleshooting. | — |
| `legacy-intranet-penetration-ssh-guide` | legacy-blog | [Historical file](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/intranet-penetration-ssh-guide.md) | Original Cloudflare Tunnel, Tailscale, FRP, and SSH. | — |
| `legacy-mysql-performance-troubleshooting` | legacy-blog | [Historical file](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/mysql-performance-troubleshooting.md) | Original MySQL performance SOP and diagnosis. | — |
| `legacy-headroom-single-port-evolution` | legacy-blog | [Historical file](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/headroom-single-port-evolution.md) | Original Headroom single-port architecture evolution. | — |
| `legacy-omp-config-and-rules-guide` | legacy-blog | [Historical file](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/omp-config-and-rules-guide.md) | Original OMP configuration, rules, and model routing. | — |
| `legacy-omp-headroom-persistence` | legacy-blog | [Historical file](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/omp-headroom-persistence.md) | Original Headroom persistence and route recovery. | — |
| `legacy-omp-hook-extension-guide` | legacy-blog | [Historical file](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/omp-hook-extension-guide.md) | Original OMP Hook, graph nudges, and status extensions. | — |
| `legacy-plugin-lifecycle-management` | legacy-note | [Historical file](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/plugin_lifecycle_management_blog.md) | Original large-scale endpoint plugin lifecycles. | — |
| `legacy-uisa-architecture-design` | legacy-note | [Historical file](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/uisa-architecture-design.md) | Original UISA hybrid-cloud and heterogeneous-node architecture. | — |
| `headroom-0-34-compress-retrieve-contract` | upstream-source-and-contract-test | [Pinned source](https://github.com/headroomlabs-ai/headroom/tree/v0.34.0) | Headroom 0.34.0 compression/retrieval API contracts, modes, and real-endpoint checks. | — |
| `kb-ingest-pipeline-v19` | repository | [Pinned commit](https://github.com/DavidHLP/DavidHLP.github.io/tree/c0ae74e72982910e13c46de0b92cf8fb9a8d1751) | Session identity/content hashes, redaction v19, control-plane filters, partial checkpoints, and raw manifests. | — |
| `mcp-codebase-memory-workflow` | upstream-spec-and-source | [Pinned version](https://github.com/DeusData/codebase-memory-mcp/tree/v0.10.2) | MCP 2026-07-28 and codebase-memory-mcp v0.10.2 graph-tool contracts. | — |
| `multi-service-readiness-contract` | upstream-spec-and-manpage | [Pinned specification](https://github.com/compose-spec/compose-spec/blob/11296e387ba76c77db1db768b9153a4304a3c9bd/05-services.md) | Initial Compose/systemd startup, health, dependency, and propagation snapshot. | — |
| `multi-service-readiness-contract-correction` | upstream-spec-source-and-minimal-experiment | [Pinned specification](https://github.com/compose-spec/compose-spec/blob/11296e387ba76c77db1db768b9153a4304a3c9bd/05-services.md) | Additional pinned Docker sources and disposable Redis/Alpine startup-gate experiment; initial raw remains intact. | — |
| `omp-17-2-15-runtime-contract` | upstream-source-fixed-tag | [Pinned tag](https://github.com/can1357/oh-my-pi/tree/v17.2.15) | Initial OMP 17.2.15 Hook, Compaction, statusline, and Headroom evidence boundaries. | — |
| `omp-17-2-15-runtime-contract-correction` | upstream-source-fixed-commit | [Pinned commit](https://github.com/can1357/oh-my-pi/tree/06aecdd51f07e689e970ceaa180abe2be0c14bbb) | Additional ExtensionRunner, event-return contracts, and narrowed negative evidence; initial raw remains intact. | — |
| `redis-jackson-java-time-contract` | upstream-source-and-minimal-experiment | [Pinned tag](https://github.com/redisson/redisson/tree/redisson-3.50.0) | Default Redisson/Spring Data Redis Jackson configuration and LocalDateTime encode/decode experiment. | — |
| `multi-service-readiness-safety-correction` | upstream-source-fixed-tag | [Pinned tag](https://github.com/docker/compose/tree/v5.4.0) | Corrects readiness commands' `-f`/`-p` isolation and `down` deletion boundary. | — |
| `database-schema-drift-contract` | upstream-docs-and-minimal-experiment | [Flyway documentation](https://documentation.red-gate.com/fd/validate-277578898.html) | Flyway 13.2.0/MySQL 8.4 history/schema/query drift diagnosis. | — |
| `database-written-test-review` | user-provided-local-markdown | [Project repository](https://github.com/DavidHLP/DavidHLP.github.io) | User-supplied database written-test review: SQL semantics, dialects, four-table practice, Kettle, huge-table boundaries. | — |
| `jjwt-013-security-api-contract` | upstream-source-fixed-tag | [JJWT 0.13.0 source](https://github.com/jwtk/jjwt/tree/0.13.0) | `signWith`, `verifyWith`, audience builder, and key-type boundaries. | — |
| `testcontainers-docker-api-negotiation` | upstream-source-fixed-commits | [Testcontainers 1.20.6](https://github.com/testcontainers/testcontainers-java/tree/1.20.6) | Docker API `1.32` fallback, `api.version`, and daemon-version gates. | — |
| `dubbo-nacos-runtime-registration` | upstream-source-fixed-tag-and-docs | [Dubbo 3.3.6](https://github.com/apache/dubbo/tree/dubbo-3.3.6) | Nacos interface/application registration, metadata, and smoke-test boundaries. | — |
| `resicache-observer-nested-execution-contract` | upstream-source-fixed-commit | [ResiCache public commit](https://github.com/DavidHLP/ResiCache/tree/75ed279a71b17f227c3170d738eb93e50d876c8a) | Observer tokens, locked fragments, ThreadLocal snapshots, and reentry boundaries. | — |
| `microservice-domain-data-ownership` | upstream-patterns-and-fixed-doc-snapshots | [microservices.io database-per-service](https://microservices.io/patterns/data/database-per-service.html) | Private service data, saga, outbox, and progressive migration ownership. | — |
| `jjwt-013-security-api-contract-correction` | upstream-source-fixed-tag-correction | [JJWT 0.13.0 source](https://github.com/jwtk/jjwt/tree/0.13.0) | Corrects recommended algorithm key sizes, verifyWith overloads, and PrivateKey exceptions; initial raw intact. | — |
| `testcontainers-docker-api-negotiation-correction` | upstream-source-fixed-commits-correction | [Testcontainers 1.20.6](https://github.com/testcontainers/testcontainers-java/tree/1.20.6) | Corrects TestEnvironment path and `999.999` daemon-too-new matrix; initial raw intact. | — |
| `dubbo-nacos-runtime-registration-correction` | upstream-source-fixed-tag-correction | [Dubbo 3.3.6](https://github.com/apache/dubbo/tree/dubbo-3.3.6) | Corrects Nacos registry URL parameter-reading boundaries; initial raw intact. | — |
| `microservice-domain-data-ownership-correction` | upstream-patterns-fixed-docs-correction | [Microsoft pinned data considerations](https://github.com/MicrosoftDocs/architecture-center/blob/02b64c27c3a9eb6f49054297ceb6cec0fa0c68ef/docs/microservices/design/data-considerations.md) | Adds revision-pinned URLs; live pattern pages are used only as captured snapshots. | — |
| `headroom-cc-switch-coexistence-runtime` | repository-and-runtime-observation | [Source](https://github.com/DavidHLP/omp-headroom-provider-proxy/tree/a9349b762657a28ad8b45a672b9996e831e1eedc) | Redacted runtime evidence: Claude Code → Headroom → cc-switch, single compression responsibility, and `BindPaths` tradeoffs. | — |
| `omp-headroom-provider-proxy-codex-routing-runtime` | repository-and-runtime-observation | [Source](https://github.com/DavidHLP/omp-headroom-provider-proxy/tree/a9349b762657a28ad8b45a672b9996e831e1eedc) | Redacted CLI/Desktop evidence for loopback proxy, OMP/Codex routing controller, and Claude Code coexistence. | — |
| `ingest-docker-fundamentals` | personal-notes-and-fuwari | [Personal-markdown-notes bbb2126](https://github.com/DavidHLP/Personal-markdown-notes/tree/bbb21260029584d41d1c667f88c5c8e2b761aad9) | Seven Docker originals: layers, volumes, networking, Compose. | legacy-aggregate |
| `ingest-hbase-foundation` | personal-notes-and-fuwari-overlap | [Personal bbb2126](https://github.com/DavidHLP/Personal-markdown-notes/tree/bbb21260029584d41d1c667f88c5c8e2b761aad9) + [Fuwari 07cee2b](https://github.com/DavidHLP/Fuwari/tree/07cee2baf9cee227807dcd68004c5f2493e5ac52) | Eighteen HBase originals: models, architecture, table design, Shell, Java API. | legacy-aggregate |
| `ingest-redis-business` | personal-notes-and-fuwari | [Personal bbb2126](https://github.com/DavidHLP/Personal-markdown-notes/tree/bbb21260029584d41d1c667f88c5c8e2b761aad9) + [Fuwari 07cee2b](https://github.com/DavidHLP/Fuwari/tree/07cee2baf9cee227807dcd68004c5f2493e5ac52) | Twenty Redis business originals: cache, distributed locks, queues, feeds, flash sales. | legacy-aggregate |
| `ingest-redis-persistence` | personal-notes-and-heima-course | [Personal bbb2126](https://github.com/DavidHLP/Personal-markdown-notes/tree/bbb21260029584d41d1c667f88c5c8e2b761aad9) + [Fuwari 07cee2b](https://github.com/DavidHLP/Fuwari/tree/07cee2baf9cee227807dcd68004c5f2493e5ac52) | Three Redis persistence/internal notes: RDB/AOF and underlying structures. | legacy-aggregate |
| `ingest-redis-heima` | personal-notes-and-heima-course | [Personal bbb2126](https://github.com/DavidHLP/Personal-markdown-notes/tree/bbb21260029584d41d1c667f88c5c8e2b761aad9) | Six Heima Redis files (three exact duplicates): basics, practice, multilevel caches. | legacy-aggregate |
| `ingest-java-concurrency` | personal-notes-and-fuwari | [Fuwari 07cee2b](https://github.com/DavidHLP/Fuwari/tree/07cee2baf9cee227807dcd68004c5f2493e5ac52) | Fifteen JUC/Java originals: CAS, atomics, locks, threading. | legacy-aggregate |
| `ingest-spring-cloud` | personal-notes-and-fuwari | [Fuwari 07cee2b](https://github.com/DavidHLP/Fuwari/tree/07cee2baf9cee227807dcd68004c5f2493e5ac52) | Thirteen Spring Boot/Cloud originals: auto-configuration, transactions, gateway, observability. | legacy-aggregate |
| `ingest-spark-ecosystem` | personal-notes-and-fuwari | [Personal bbb2126](https://github.com/DavidHLP/Personal-markdown-notes/tree/bbb21260029584d41d1c667f88c5c8e2b761aad9) + [Fuwari 07cee2b](https://github.com/DavidHLP/Fuwari/tree/07cee2baf9cee227807dcd68004c5f2493e5ac52) | Seven Spark/big-data originals: engines, execution modes, cluster scripts. | legacy-aggregate |
| `ingest-mysql-storage` | personal-notes-and-fuwari | [Personal bbb2126](https://github.com/DavidHLP/Personal-markdown-notes/tree/bbb21260029584d41d1c667f88c5c8e2b761aad9) + [Fuwari 07cee2b](https://github.com/DavidHLP/Fuwari/tree/07cee2baf9cee227807dcd68004c5f2493e5ac52) | Three MySQL originals: storage engines and deadlocks. | legacy-aggregate |
| `ingest-frontend-essays` | personal-notes-and-fuwari | [Personal bbb2126](https://github.com/DavidHLP/Personal-markdown-notes/tree/bbb21260029584d41d1c667f88c5c8e2b761aad9) + [Fuwari 07cee2b](https://github.com/DavidHLP/Fuwari/tree/07cee2baf9cee227807dcd68004c5f2493e5ac52) | Ten miscellaneous Vue/MyBatis/UniApp/cache/environment notes, dissolved into an archive. | legacy-aggregate |
| `hindsight-local-deployment-and-agent-integration` | upstream-source-and-minimal-experiment | [Pinned source](https://github.com/vectorize-io/hindsight/tree/v0.9.1) | Redacted Hindsight v0.9.1 local deployment, Ollama ROCm LLM, CPU BGE-M3, FastMCP, OMP/Codex evidence. | — |
| `resicache-project-overview` | repository-readme-fixed-commit | [ResiCache public commit](https://github.com/DavidHLP/ResiCache/tree/75ed279a71b17f227c3170d738eb93e50d876c8a) | ResiCache v0.0.2 bilingual README snapshot: positioning, handler order, configuration boundaries, limitations. | — |
| `resicache-engineering-highlights-2954fff` | repository-source-and-test-selected-excerpts-fixed-commit | [Pinned ResiCache main](https://github.com/DavidHLP/ResiCache/tree/2954fff217257e9cf7c906450a75070d5e092637) | Current source excerpts: value-version CAS, single-flight, serialization, observer, boundary tests. | — |
| `ulticode-project-context` | repository-readme-and-context-fixed-commit | [UltiCode pinned commit](https://github.com/DavidHLP/UltiCode/tree/3f14ac8947ef0124739bf02259deb9f567eb092e) | UltiCode README + CONTEXT domain glossary: owners, port/projection, invariants. | — |
| `ulticode-engineering-highlights-f801a1076` | repository-source-and-document-selected-excerpts-fixed-commit | [Pinned UltiCode main](https://github.com/DavidHLP/UltiCode/tree/f801a1076b2fa9aa06ce3d63821f0778b477042c) | Pinned main architecture, judge/sandbox code, boundary tests, CI: owners, outbox, fences, isolation, release gates. | — |
| `ulticode-reliability-core-f801a1076` | repository-source-and-document-selected-excerpts-fixed-commit | [Pinned UltiCode main](https://github.com/DavidHLP/UltiCode/tree/f801a1076b2fa9aa06ce3d63821f0778b477042c) | Audit outbox/consumer inbox, fenced leases, reconciliation, Core opt-in lifecycle: source, migrations, ADRs, tests. | — |

</details>

Raw files reside in `src/content/raw/zh-cn/` for LLM reading, without public routes. Captured snapshots are immutable.

## Capture inbox

- [Knowledge-base Ingest Inbox](/blog/legacy/jotting/en/kb-ingest-todo/) — Upcoming personal-project sources and questions. Historical articles, all 107 originals from Personal-markdown-notes/Fuwari, and ResiCache/UltiCode README/CONTEXT have been ingested. Phase 2 split Hindsight and dissolved miscellaneous frontend notes. Next: Phase 3 quarterly review of 12 provisional pages and incremental new topics.

## Maintenance rules

- Register every active/provisional wiki here with a one-sentence summary.
- Trace every stable conclusion through `sources` to raw.
- Append the [Knowledge Base Operation Log](/blog/legacy/information/en/kb-log/) for new sources/pages.
- Fix evidence chains before wording when lint finds orphans, duplicates, broken links, or conflicts.
- Six presentation domains aggregate views without changing `series`; review graduation quarterly and deprecate unmet candidates.
