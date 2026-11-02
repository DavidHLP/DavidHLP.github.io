---
{
  "archiveId": "X-1002",
  "title": "Helian Peng (David)",
  "en": "SITE INFORMATION",
  "category": "站点随笔",
  "department": "站点信息",
  "date": "2026-10-05",
  "lead": "DavidHLPL",
  "clearance": "PUBLIC",
  "abstract": "Helian Peng (David) · src/content/information/en/introduction.md",
  "findings": [
    "Original document: src/content/information/en/introduction.md",
    "Source revision: f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/information/en/introduction.md",
  "pubDate": "2026-10-05T05:34:00.000Z",
  "tags": [
    "en",
    "information"
  ],
  "draft": false,
  "lang": "en",
  "legacy": {
    "path": "src/content/information/en/introduction.md",
    "revision": "f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "metadata": {}
  },
  "profile": {
    "role": "Java Backend Engineer",
    "summary": "Java backend developer building UltiCode and ResiCache, with a focus on reliable task delivery, cache protection, and troubleshooting.",
    "location": "Chongqing / Age: 23",
    "contacts": [
      {
        "label": "Email · lysf15520112973@163.com",
        "href": "mailto:lysf15520112973@163.com"
      },
      {
        "label": "GitHub · DavidHLP",
        "href": "https://github.com/DavidHLP"
      },
      {
        "label": "Phone · 15520112973",
        "href": "tel:15520112973"
      },
      {
        "label": "WeChat · B1372998589"
      },
      {
        "label": "Knowledge base",
        "href": "/blog/legacy/information/en/kb-index/"
      }
    ]
  }
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

<p class="resume-meta">2025.10 - Present</p>

<p class="resume-stack">Tech stack: Java 17 / Spring Boot 3 / Spring Security / MyBatis-Plus / MySQL / Redis Streams / Dubbo / Flyway / Docker</p>

Personal open-source online judge for practice, contests, submissions, sandbox judging, and administration. Submission owns submission data; a separate Judge Worker executes tasks, focusing on delivery failures, duplicate execution, and rejudge-result races.

- **Transactional Outbox delivery**: Writes submission and judge Outbox records in one local transaction; background delivery to Redis Streams updates send state and retries with backoff. Lua combines deduplication marking and enqueueing to close the mark-written/message-not-enqueued failure window.
- **Task recovery and dead letters**: Uses `XPENDING` / `XCLAIM` to reclaim timed-out unacknowledged tasks, limiting redelivery by capacity and retry count; exhausted budgets go to dead letters to stop invalid tasks repeatedly consuming judging resources.
- **Rejudge-result race control**: Uses `generation` + `attemptId` to identify valid execution, with leases and heartbeat renewal. Verdict SQL CAS checks both conditions to prevent expired attempts overwriting a newer judging round.
- **Untrusted-code constraints**: Uses Docker network isolation, non-root execution, a read-only root filesystem, capability removal, and Seccomp, plus CPU, memory, PID, and file-descriptor limits to constrain code permissions and resources.
- **Refresh-token replay protection**: Stores only SHA-256 refresh-token hashes. Rotation checks purpose, ownership, and expiry; conditional updates consume an old token only once and issue its replacement in the same transaction to handle concurrent refreshes.
- **Automated acceptance and release verification**: Integrated real-MySQL fresh/upgrade migration checks and browser/Judge acceptance into CI, covering login, AC/WA, rejudging, and contest rankings. Verifies signatures, SBOMs, SLSA provenance, and tag digests for a nine-image release set, rejecting incomplete or conflicting artifacts; acceptance remains separate from production deployment.

### ResiCache Cache Protection Middleware [GitHub](https://github.com/DavidHLP/ResiCache)

<p class="resume-meta">2025.01 - Present</p>

<p class="resume-stack">Tech stack (current development line): Java 21 / Spring Boot 4 / Spring Cache / Redis / Redisson / Micrometer / Testcontainers</p>

Personal open-source Spring Cache protection extension combining enhanced annotations and a handler chain, focused on same-key request coalescing, distributed loading coordination, versioned early expiration, and secure deserialization.

- **Same-key request coalescing**: Uses `ConcurrentHashMap` + `CompletableFuture` for JVM-local Single-flight: the Leader obtains the distributed lock and loads data, Followers share the result, and a locked double-check reduces repeated source loads and lock contention.
- **Layered Bloom filtering**: Combines local and Redis filters. A local hit skips the remote check; a local miss checks Redis and backfills according to the result, without rejecting valid business loads merely because the local filter missed.
- **Versioned early expiration**: Redis Lua atomically checks cache-value version before shortening TTL, so stale async tasks cannot alter a new value's lifetime. Later requests load after expiry, handling races with updates and deletion.
- **Deserialization boundary**: Jackson streaming scans validate type whitelists before parsing the versioned envelope. Regression tests cover malicious type markers and metadata round trips without building a full JSON tree during validation.
- **Async task deduplication**: Maintains a per-key in-flight Future to avoid duplicate scheduling; bounded executor queues and `CallerRunsPolicy` control backlog and handle cleanup races between completion and Future registration.
- **Failure semantics and validation**: Separates business-load exceptions from cache-write failures, returning a successfully loaded value even if write-back fails. Concurrent and real-Redis integration tests cover shared results, exception propagation, new-value TTL protection, and no resurrection after deletion.
- **Cluster and migration safety**: Verified cache-key/lock-key slot co-location on a real three-master Redis Cluster. Implemented serialization shadow reads, dual writes, cutover, and rollback with TTL preservation, CAS rejection of concurrent-value overwrites, and resumption after partial failure.

## <span class="resume-section-number">[ SEC 03 ]</span> Professional Skills

### Java backend and data processing

- Familiar with Java, Spring Boot, Spring MVC, Spring Security, and MyBatis-Plus, with API design, authentication/authorization, and exception-handling experience.
- Familiar with MySQL index design, execution-plan analysis, and slow-SQL tuning; experienced with Redis cache protection, distributed locks, and concurrent loading.
- Project experience with Dubbo, Redis Streams, and Outbox; understands transaction boundaries, duplicate consumption, retries, and eventual consistency.

### Diagnosis and engineering validation

- Combines Arthas, Linux process information, container logs, and SQL plans to diagnose issues, implement fixes, and verify regressions.
- Familiar with Docker images, networking, resource limits, and basic isolation, with containerd/Harbor/private-image TLS troubleshooting experience.
- Familiar with Git, Maven, Docker Compose, Flyway, and Micrometer; uses Testcontainers and concurrent tests for failure/race scenarios.
- Practical experience with GitHub Actions business acceptance, image scanning, signatures, and provenance verification; distinguishes controlled tests, real-service validation, and production delivery for the exact candidate revision.

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

[PR #2203](https://github.com/DeusData/codebase-memory-mcp/pull/2203) **Merged**. Fixed installation staging failures caused by Linux system-path aliases. Allows only trusted root-owned system aliases while retaining rejection of arbitrary user-owned symlinks, with checks for both accepted and rejected paths.

### Selected technical knowledge pages

- [Java production performance diagnosis: a minimal symptom-to-evidence decision tree](/blog/legacy/note/en/java-online-performance-debug/): Connects process/thread stacks, GC, and Arthas observations into containment, evidence preservation, diagnosis, and recovery.
- [containerd TLS: certificate trust and temporary verification bypass](/blog/legacy/note/en/containerd-tls-troubleshooting/): Separates runtime CA, node trust, registry authentication, and image caches into a layered diagnostic path.
