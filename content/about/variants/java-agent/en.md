---
{
  "variant": "java-agent",
  "title": "Java + Agent",
  "lang": "en",
  "role": "Java Backend / Agent Application Developer",
  "summary": "Java backend developer integrating Python Agents with business APIs, focused on tool calls, identity isolation, persistence and recoverable business operations."
}
---

## <span class="resume-section-number">[ SEC 01 ]</span> Internship Experience

### Beyondsoft

<p class="resume-meta">2026.01 - 2026.06</p>

<p class="resume-meta">Backend Developer Intern | Alibaba Cloud Private Cloud · Aegis Host Security</p>

- **Business context**: Contributed to Aegis host-security backend development, covering cluster resource ingestion, AI asset identification, resource-query optimization, and production troubleshooting.
- **GPU resource integration**: Coordinated with platform, ECS, BMS, and BMCP teams and independently implemented cluster-side GPU ingestion and aggregation for statistics, filtering, and related queries.
- **AI asset identification**: Contributed to the feature and independently built OpenClaw/Ollama test containers; used container state, GPU relationships, and vulnerability data to implement asset-state assessment, GPU associations, and risk displays.
- **Complex query optimization**: Analyzed SQL execution plans and adjusted indexes, predicates, and covered fields to reduce latency in resource-list and statistics APIs.
- **Production diagnosis**: Used Arthas `watch` / `trace` / `stack` to inspect call paths, timings, exception stacks, and key parameters, independently locating defects, implementing fixes, and verifying regressions.
- **Container-image troubleshooting**: Diagnosed containerd TLS verification and trust-chain failures while pulling Harbor private images, checking CA,`certs.d`, `hosts.toml`, `imagePullSecrets` and node caches, and documented diagnostic scripts and checklists.

## <span class="resume-section-number">[ SEC 02 ]</span> Project Experience

### UltiCode Online Programming Judge [GitHub](https://github.com/DavidHLP/UltiCode)

<p class="resume-stack">Java 17 / Spring Boot 3 / Spring Security / MySQL / Redis Streams / Dubbo / Flyway / Docker</p>

Personal open-source judge: Java services own identity, problems, submissions and business records; an independent Judge Worker executes judging. The Agent integrates through existing HTTP contracts.

- **Reliable task delivery**: Writes submission and Outbox records in one transaction, delivers to Redis Streams with backoff, and combines deduplication marking with enqueueing in Lua. Timeout recovery and dead letters handle failure windows.
- **Execution-result races**: Uses `generation` + `attemptId`, leases and heartbeats to identify valid attempts. SQL CAS rejects stale verdicts; Docker constrains untrusted-code permissions and resources.
- **Identity and acceptance**: Hashes refresh tokens, consumes each once and rotates within a transaction. Real-MySQL migrations and browser/Judge login, AC/WA, rejudge and ranking acceptance run in CI.

### UltiCode Agent Business Integration (Experimental) [Source](https://github.com/DavidHLP/UltiCode/tree/main/services/agent)

<p class="resume-stack">Python / FastAPI / httpx / LangGraph / SQLite / SSE / MCP / Java Auth & App API</p>

Controlled analysis, multi-turn conversations and optional learning plans for the owner's ordinary practice submissions. Java retains identity and business-data authority; the Agent manages private conversations and local workflow state.

- **Trusted identity and tool boundaries**: Resolves identity through Java `/auth/me` with an isolated cookie client per request. Exposes only allowlisted read-only tools, validates arguments and projects returned fields; the model cannot choose or rewrite ownership.
- **Bounded model/tool loop**: Orchestrates model, tool and result steps with LangGraph, limiting rounds and total duration. Separates tool failure, limit exhaustion and cancellation; tool results remain data, with no authority to issue privileged instructions.
- **Conversations and checkpoints**: Tracks owner, conversation/turn, thread/run and draft version in SQLite. Recovery rechecks ownership; cancellation fences prevent stale runs saving results. Conversation history and learning-plan threads remain distinct.
- **Explicit confirmation and reconciliation**: Editing invalidates old confirmation; saving requires separate confirmation bound to the current version and digest. Unknown Java write outcomes remain unresolved and are reconciled by same-key readback, never blind retries with a new key.
- **Sources and MCP projection**: Preserves source scope, version and position. Authorized source code stays request-scoped, outside conversations, events and checkpoints. Optional stdio MCP exposes only the owner's submission list through the authenticated client and strict field projection.

<p class="resume-meta">Live analysis and persistence are enabled separately. This is reproducible engineering practice, not a claim of production deployment or a completed real-user pilot.</p>

## <span class="resume-section-number">[ SEC 03 ]</span> Professional Skills

### Java backend and reliability

- Familiar with Java, Spring Boot, Spring Security and MyBatis-Plus; practical API design, authentication/authorization, MySQL tuning and transaction boundaries.
- Project experience with Redis cache protection, distributed locks, Streams, Outbox and Docker isolation; understands retries, duplicate consumption and eventual consistency.
- Uses Arthas, SQL plans, Linux and container logs for diagnosis, with concurrent tests, Testcontainers and CI to verify failure scenarios.

### Agent applications and business integration

- Project experience with Python, FastAPI, httpx and LangGraph, integrating existing Java APIs with tool calls, timeouts, cancellation and streamed events.
- Practices server-trusted identity, allowlisted tools, field projection, source consent and context boundaries; separates model suggestions, user confirmation and business writes.
- Practices SQLite conversations/checkpoints, ownership/version checks, idempotent saves and unknown-outcome reconciliation; distinguishes controlled tests, real-service validation and production delivery.

## <span class="resume-section-number">[ SEC 04 ]</span> Education & Honors

### Education

**Luoyang Normal University**

Data Science and Big Data Technology · Bachelor's degree

<p class="resume-meta">GPA: 3.6 / 4.0 (2021.09 - 2026.07)</p>

### Honors

- 2025 Lanqiao Cup Java Software Design Group B · **National Third Prize**

- 2024 Teddy Cup Data Analysis Skills Competition · **National Third Prize**

- 2023 National University Computer Skills Challenge · **National Third Prize**

## <span class="resume-section-number">[ SEC 05 ]</span> Open-source Contributions and Technical Writing

### Open-source contributions

**codebase-memory-mcp**：[PR #1229](https://github.com/DeusData/codebase-memory-mcp/pull/1229) **Merged**. Added Oh My Pi (OMP) client integration with configuration-directory discovery, MCP registration, Skill installation, and install/uninstall workflows, plus configuration-isolation and user-content-preservation tests.

[PR #2203](https://github.com/DeusData/codebase-memory-mcp/pull/2203) **Merged**. Fixed Linux installation staging for trusted root-owned system-path aliases; retains rejection of arbitrary user-owned symlinks and verifies both accepted/rejected paths.

### Selected technical knowledge pages

- [Java production performance diagnosis: a minimal symptom-to-evidence decision tree](/blog/legacy/note/en/java-online-performance-debug/): Connects process/thread stacks, GC, and Arthas observations into containment, evidence preservation, diagnosis, and recovery.
- [containerd TLS: certificate trust and temporary verification bypass](/blog/legacy/note/en/containerd-tls-troubleshooting/): Separates runtime CA, node trust, registry authentication, and image caches into a layered diagnostic path.

