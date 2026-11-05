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
  "resumeLabel": "Java",
  "profile": {
    "role": "Java Backend Engineer",
    "summary": "2026 graduate with an Alibaba Cloud private-cloud security backend internship; focused on Java services, reliable tasks, Redis concurrency and production diagnosis.",
    "location": "Chongqing",
    "avatar": "/images/profile-avatar.png",
    "contacts": [
      {
        "label": "Recruiters interested in my experience are welcome to contact me by email."
      },
      {
        "label": "Email · lysf15520112973@163.com",
        "href": "mailto:lysf15520112973@163.com"
      },
      {
        "label": "GitHub · DavidHLP",
        "href": "https://github.com/DavidHLP"
      },
      {
        "label": "Knowledge base",
        "href": "/blog/legacy/information/en/kb-index/"
      }
    ]
  }
}
---

## <span class="resume-section-number">[ SEC 00 ]</span> Selected Strengths

- **Reliable tasks**: Used Outbox, Redis Streams and SQL CAS for UltiCode delivery gaps, duplicates and rejudge races; added real-MySQL and browser/Judge acceptance to CI.
- **Caching and concurrency**: Built same-key request coalescing, distributed loading coordination, version checks and reversible migration in ResiCache; verified failure semantics with real Redis/Cluster and concurrency tests.
- **Open-source collaboration**: Two merged codebase-memory-mcp contributions cover client integration, Linux installer compatibility, installation regressions and user-content preservation.

## <span class="resume-section-number">[ SEC 01 ]</span> Internship Experience

### Beyondsoft

<p class="resume-meta">2026.01 - 2026.06</p>

<p class="resume-meta">Backend Developer Intern | Alibaba Cloud Private Cloud · Aegis Host Security</p>

- **Resource integration**: Contributed to Alibaba Cloud private-cloud Aegis security backend development; coordinated with platform/ECS/BMS/BMCP teams and independently built cluster GPU ingestion and aggregation for statistics, filtering and related queries.
- **AI asset identification**: Contributed to the feature and independently built OpenClaw/Ollama test containers; combined container state, GPU relationships and vulnerability data for asset-state assessment, associations and risk displays.
- **Query optimization and fixes**: Adjusted SQL plans, indexes, predicates and covered fields to reduce list/statistics query latency; used Arthas `watch` / `trace` / `stack` for call paths, timings, exceptions and parameters, independently fixing defects and verifying regressions.
- **Image trust-chain diagnosis**: Located containerd TLS failures pulling Harbor private images; checked CA, `certs.d`, `hosts.toml`, `imagePullSecrets` and node caches, then documented diagnostic scripts and checklists.

## <span class="resume-section-number">[ SEC 02 ]</span> Project Experience

### UltiCode Online Programming Judge [GitHub](https://github.com/DavidHLP/UltiCode)

<p class="resume-meta">2025.10 - Present</p>

<p class="resume-stack">Tech stack: Java 17 / Spring Boot 4 / Spring Security / MyBatis-Plus / MySQL / Redis Streams / Dubbo / Flyway / Docker</p>

Personal open-source judge covering practice, contests, submissions, sandbox judging and administration. Submission owns submission data; a separate Judge Worker handles delivery failures, duplicates and rejudge-result races.

- **Reliable delivery and recovery**: Commits submissions and Outbox records together; updates delivery state with backoff retries. Lua atomically combines deduplication and Redis Streams enqueueing to avoid mark-only failures. `XPENDING` / `XCLAIM` reclaim timed-out unacknowledged work; capacity/retry limits and dead letters bound invalid redelivery.
- **Rejudge-result race control**: Uses `generation` + `attemptId` to identify valid execution, with leases and heartbeat renewal. Verdict SQL CAS checks both conditions to prevent expired attempts overwriting a newer judging round.
- **Untrusted-code constraints**: Uses Docker network isolation, non-root execution, a read-only root filesystem, capability removal, and Seccomp, plus CPU, memory, PID, and file-descriptor limits to constrain code permissions and resources.
- **Refresh-token replay protection**: Stores only SHA-256 refresh-token hashes. Rotation checks purpose, ownership, and expiry; conditional updates consume an old token only once and issue its replacement in the same transaction to handle concurrent refreshes.
- **CI and release verification**: Added real-MySQL fresh/upgrade migration and browser/Judge acceptance to CI (login, AC/WA, rejudging, rankings). Verifies signatures, SBOMs, SLSA provenance and tag digests across nine images; rejects incomplete/conflicting artifacts. Acceptance is separate from production deployment.

### ResiCache Cache Protection Middleware [GitHub](https://github.com/DavidHLP/ResiCache)

<p class="resume-meta">2025.01 - Present</p>

<p class="resume-stack">Tech stack (current development line): Java 21 / Spring Boot 4 / Spring Cache / Redis / Redisson / Micrometer / Testcontainers</p>

Personal open-source Spring Cache extension combining enhanced annotations and a handler chain for same-key request coalescing, distributed loading coordination, versioned early expiration and secure deserialization.

- **Same-key concurrency and async deduplication**: `ConcurrentHashMap` + `CompletableFuture` coalesce JVM requests. A distributed-lock Leader double-checks and loads; Followers share results. Per-key in-flight Futures, bounded queues and `CallerRunsPolicy` control backlog and completion/registration cleanup races.
- **Layered Bloom filtering**: Local hits skip remote checks; misses query Redis and backfill accordingly, without rejecting valid loads solely on a local miss.
- **Versioned early expiration**: Redis Lua atomically checks cache-value version before shortening TTL, so stale async tasks cannot alter a new value's lifetime. Later requests load after expiry, handling races with updates and deletion.
- **Deserialization protection**: Jackson streaming validates the type allowlist before parsing versioned envelopes. Regressions cover malicious types and metadata round trips without building a full JSON tree during validation.
- **Failure semantics and validation**: Separates business-load exceptions from cache-write failures, returning a successfully loaded value even if write-back fails. Concurrent and real-Redis integration tests cover shared results, exception propagation, new-value TTL protection, and no resurrection after deletion.
- **Cluster and migration safety**: Verified cache/lock-key slot co-location on a real three-master Redis Cluster. Serialization migration supports shadow reads, dual writes, cutover, rollback, TTL preservation, CAS protection against concurrent-value overwrites and partial-failure resumption.

## <span class="resume-section-number">[ SEC 03 ]</span> Professional Skills

### Java backend and data processing

- Familiar with Java, Spring Boot, Spring MVC, Spring Security, and MyBatis-Plus, with API design, authentication/authorization, and exception-handling experience.
- Familiar with MySQL index design, execution-plan analysis, and slow-SQL tuning; experienced with Redis cache protection, distributed locks, and concurrent loading.
- Project experience with Dubbo, Redis Streams, and Outbox; understands transaction boundaries, duplicate consumption, retries, and eventual consistency.

### Diagnosis and engineering validation

- Combines Arthas, Linux process information, container logs, and SQL plans to diagnose issues, implement fixes, and verify regressions.
- Familiar with Docker images, networking, resource limits, and basic isolation, with containerd/Harbor/private-image TLS troubleshooting experience.
- Familiar with Git, Maven, Docker Compose, Flyway, and Micrometer; uses Testcontainers and concurrent tests for failure/race scenarios.

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

**[codebase-memory-mcp](https://github.com/DeusData/codebase-memory-mcp)**: Contributed Oh My Pi client integration, MCP registration, install/uninstall and user configuration protection; fixed Linux trusted system-path compatibility and added installer regression coverage.

### Selected technical knowledge pages

- [Java production performance diagnosis: a minimal symptom-to-evidence decision tree](/blog/legacy/note/en/java-online-performance-debug/): Connects process/thread stacks, GC, and Arthas observations into containment, evidence preservation, diagnosis, and recovery.
- [UltiCode Outbox and Redis Streams: Making Judge Delivery Recoverable](/blog/legacy/note/en/ulticode-outbox-redis-streams/): Explains transactional outbox, atomic delivery, retries, dead letters and pending-message recovery.
