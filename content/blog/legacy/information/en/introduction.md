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
  }
}
---

<div class="not-prose flex flex-col md:flex-row justify-between items-start border-b border-weak/20 pb-6 mb-8 gap-4 select-text">
  <div>
    <h1 class="text-3xl font-serif font-light mb-1">Helian Peng (David)</h1>
    <p class="text-xs font-mono text-weak uppercase tracking-wider">// Java Backend Engineer</p>
  </div>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs font-mono text-secondary">
    <div>City: Chongqing / Age: 23</div>
    <div>WeChat: B1372998589</div>
    <div>Email: <a href="mailto:lysf15520112973@163.com" class="hover:underline">lysf15520112973@163.com</a></div>
    <div>Phone: 15520112973</div>
    <div>GitHub: <a href="https://github.com/DavidHLP" target="_blank" class="hover:underline">github.com/DavidHLP</a></div>
    <div>Knowledge base: <a href="/blog/legacy/information/en/kb-index/" target="_blank" class="hover:underline">davidhlp.github.io/kb</a></div>
  </div>
</div>

## <span class="font-mono text-xs text-weak uppercase tracking-widest mr-2">[ SEC 01 ]</span> Internship Experience

<div class="relative pl-6 border-l border-weak/10 my-4 flex flex-col gap-6">
  <div class="relative select-text">
    <span class="absolute -left-[29px] top-2 w-2.5 h-2.5 rounded-full bg-background border-2 border-primary"></span>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
      <div class="font-serif font-medium text-lg text-primary">Beyondsoft</div>
      <div class="text-xs font-mono text-weak">// 2026.01 - 2026.06</div>
    </div>
    <div class="text-xs font-mono text-remark mb-3 uppercase tracking-wider">Backend Developer Intern | Alibaba Cloud Private Cloud · Aegis Host Security</div>
    <ul class="list-disc pl-4 text-sm text-secondary space-y-2">
      <li><strong>Business context</strong>: Contributed to Aegis host-security backend development, covering cluster resource ingestion, AI asset identification, resource-query optimization, and production troubleshooting.</li>
      <li><strong>GPU resource integration</strong>: Coordinated with platform, ECS, BMS, and BMCP teams and independently implemented cluster-side GPU ingestion and aggregation for statistics, filtering, and related queries.</li>
      <li><strong>AI asset identification</strong>: Contributed to the feature and independently built OpenClaw/Ollama test containers; used container state, GPU relationships, and vulnerability data to implement asset-state assessment, GPU associations, and risk displays.</li>
      <li><strong>Complex query optimization</strong>: Analyzed SQL execution plans and adjusted indexes, predicates, and covered fields to reduce latency in resource-list and statistics APIs.</li>
      <li><strong>Production diagnosis</strong>: Used Arthas <code>watch</code> / <code>trace</code> / <code>stack</code> to inspect call paths, timings, exception stacks, and key parameters, independently locating defects, implementing fixes, and verifying regressions.</li>
      <li><strong>Container-image troubleshooting</strong>: Diagnosed containerd TLS verification and trust-chain failures while pulling Harbor private images, checking CA,<code>certs.d</code>, <code>hosts.toml</code>, <code>imagePullSecrets</code> and node caches, and documented diagnostic scripts and checklists.</li>
    </ul>
  </div>
</div>

## <span class="font-mono text-xs text-weak uppercase tracking-widest mr-2">[ SEC 02 ]</span> Project Experience

<div class="relative pl-6 border-l border-weak/10 my-4 flex flex-col gap-8">
  <div class="relative select-text">
    <span class="absolute -left-[29px] top-2 w-2.5 h-2.5 rounded-full bg-background border-2 border-primary"></span>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
      <div class="font-serif font-medium text-lg text-primary flex items-center gap-2">
        <span>UltiCode Online Programming Judge</span>
        <a href="https://github.com/DavidHLP/UltiCode" target="_blank" class="text-xs font-mono text-weak hover:text-primary">[GITHUB]</a>
      </div>
      <div class="text-xs font-mono text-weak">// 2025.10 - Present</div>
    </div>
    <div class="text-xs font-mono text-remark mb-3 uppercase">Tech stack: Java 17 / Spring Boot 3 / Spring Security / MyBatis-Plus / MySQL / Redis Streams / Dubbo / Flyway / Docker</div>
    <p class="text-sm text-secondary leading-relaxed mb-3">Personal open-source online judge for practice, contests, submissions, sandbox judging, and administration. Submission owns submission data; a separate Judge Worker executes tasks, focusing on delivery failures, duplicate execution, and rejudge-result races.</p>
    <ul class="list-disc pl-4 text-sm text-secondary space-y-2">
      <li><strong>Transactional Outbox delivery</strong>: Writes submission and judge Outbox records in one local transaction; background delivery to Redis Streams updates send state and retries with backoff. Lua combines deduplication marking and enqueueing to close the mark-written/message-not-enqueued failure window.</li>
      <li><strong>Task recovery and dead letters</strong>: Uses <code>XPENDING</code> / <code>XCLAIM</code> to reclaim timed-out unacknowledged tasks, limiting redelivery by capacity and retry count; exhausted budgets go to dead letters to stop invalid tasks repeatedly consuming judging resources.</li>
      <li><strong>Rejudge-result race control</strong>: Uses <code>generation</code> + <code>attemptId</code> to identify valid execution, with leases and heartbeat renewal. Verdict SQL CAS checks both conditions to prevent expired attempts overwriting a newer judging round.</li>
      <li><strong>Untrusted-code constraints</strong>: Uses Docker network isolation, non-root execution, a read-only root filesystem, capability removal, and Seccomp, plus CPU, memory, PID, and file-descriptor limits to constrain code permissions and resources.</li>
      <li><strong>Refresh-token replay protection</strong>: Stores only SHA-256 refresh-token hashes. Rotation checks purpose, ownership, and expiry; conditional updates consume an old token only once and issue its replacement in the same transaction to handle concurrent refreshes.</li>
    </ul>
  </div>
  <div class="relative select-text">
    <span class="absolute -left-[29px] top-2 w-2.5 h-2.5 rounded-full bg-background border-2 border-primary"></span>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
      <div class="font-serif font-medium text-lg text-primary flex items-center gap-2">
        <span>ResiCache Cache Protection Middleware</span>
        <a href="https://github.com/DavidHLP/ResiCache" target="_blank" class="text-xs font-mono text-weak hover:text-primary">[GITHUB]</a>
      </div>
      <div class="text-xs font-mono text-weak">// 2025.01 - Present</div>
    </div>
    <div class="text-xs font-mono text-remark mb-3 uppercase">Tech stack (current development line): Java 21 / Spring Boot 4 / Spring Cache / Redis / Redisson / Micrometer / Testcontainers</div>
    <p class="text-sm text-secondary leading-relaxed mb-3">Personal open-source Spring Cache protection extension combining enhanced annotations and a handler chain, focused on same-key request coalescing, distributed loading coordination, versioned early expiration, and secure deserialization.</p>
    <ul class="list-disc pl-4 text-sm text-secondary space-y-2">
      <li><strong>Same-key request coalescing</strong>: Uses <code>ConcurrentHashMap</code> + <code>CompletableFuture</code> for JVM-local Single-flight: the Leader obtains the distributed lock and loads data, Followers share the result, and a locked double-check reduces repeated source loads and lock contention.</li>
      <li><strong>Layered Bloom filtering</strong>: Combines local and Redis filters. A local hit skips the remote check; a local miss checks Redis and backfills according to the result, without rejecting valid business loads merely because the local filter missed.</li>
      <li><strong>Versioned early expiration</strong>: Redis Lua atomically checks cache-value version before shortening TTL, so stale async tasks cannot alter a new value's lifetime. Later requests load after expiry, handling races with updates and deletion.</li>
      <li><strong>Deserialization boundary</strong>: Jackson streaming scans validate type whitelists before parsing the versioned envelope. Regression tests cover malicious type markers and metadata round trips without building a full JSON tree during validation.</li>
      <li><strong>Async task deduplication</strong>: Maintains a per-key in-flight Future to avoid duplicate scheduling; bounded executor queues and <code>CallerRunsPolicy</code> control backlog and handle cleanup races between completion and Future registration.</li>
      <li><strong>Failure semantics and validation</strong>: Separates business-load exceptions from cache-write failures, returning a successfully loaded value even if write-back fails. Concurrent and real-Redis integration tests cover shared results, exception propagation, new-value TTL protection, and no resurrection after deletion.</li>
    </ul>
  </div>
</div>

## <span class="font-mono text-xs text-weak uppercase tracking-widest mr-2">[ SEC 03 ]</span> Professional Skills

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-4 select-text">
  <div class="border border-weak/10 p-5 bg-background/50 relative">
    <span class="absolute -top-1 -left-1 text-[8px] font-mono text-weak/50">+</span>
    <span class="absolute -top-1 -right-1 text-[8px] font-mono text-weak/50">+</span>
    <span class="absolute -bottom-1 -left-1 text-[8px] font-mono text-weak/50">+</span>
    <span class="absolute -bottom-1 -right-1 text-[8px] font-mono text-weak/50">+</span>
    <h3 class="text-xs font-mono text-primary uppercase mb-2">// Java backend and data processing</h3>
    <ul class="list-disc pl-4 text-xs text-secondary space-y-1.5">
      <li>Familiar with Java, Spring Boot, Spring MVC, Spring Security, and MyBatis-Plus, with API design, authentication/authorization, and exception-handling experience.</li>
      <li>Familiar with MySQL index design, execution-plan analysis, and slow-SQL tuning; experienced with Redis cache protection, distributed locks, and concurrent loading.</li>
      <li>Project experience with Dubbo, Redis Streams, and Outbox; understands transaction boundaries, duplicate consumption, retries, and eventual consistency.</li>
    </ul>
  </div>
  <div class="border border-weak/10 p-5 bg-background/50 relative">
    <span class="absolute -top-1 -left-1 text-[8px] font-mono text-weak/50">+</span>
    <span class="absolute -top-1 -right-1 text-[8px] font-mono text-weak/50">+</span>
    <span class="absolute -bottom-1 -left-1 text-[8px] font-mono text-weak/50">+</span>
    <span class="absolute -bottom-1 -right-1 text-[8px] font-mono text-weak/50">+</span>
    <h3 class="text-xs font-mono text-primary uppercase mb-2">// Diagnosis and engineering validation</h3>
    <ul class="list-disc pl-4 text-xs text-secondary space-y-1.5">
      <li>Combines Arthas, Linux process information, container logs, and SQL plans to diagnose issues, implement fixes, and verify regressions.</li>
      <li>Familiar with Docker images, networking, resource limits, and basic isolation, with containerd/Harbor/private-image TLS troubleshooting experience.</li>
      <li>Familiar with Git, Maven, Docker Compose, Flyway, and Micrometer; uses Testcontainers and concurrent tests for failure/race scenarios.</li>
    </ul>
  </div>
</div>

## <span class="font-mono text-xs text-weak uppercase tracking-widest mr-2">[ SEC 04 ]</span> Education & Honors

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-4 select-text">
  <div class="flex flex-col gap-2">
    <h3 class="text-xs font-mono text-weak uppercase tracking-wider">// Education</h3>
    <div class="border-l border-weak/20 pl-4 py-1">
      <div class="font-serif font-medium text-base text-primary">Luoyang Normal University</div>
      <div class="text-xs text-secondary">Data Science and Big Data Technology · Bachelor's degree</div>
      <div class="text-xs font-mono text-remark mt-1">GPA: 3.6 / 4.0 (2021.09 - 2026.07)</div>
    </div>
  </div>
  <div class="flex flex-col gap-2">
    <h3 class="text-xs font-mono text-weak uppercase tracking-wider">// Honors</h3>
    <div class="border-l border-weak/20 pl-4 py-1 text-xs text-secondary space-y-1.5">
      <div>🏆 2025 Lanqiao Cup Java Software Design Group B · <strong>National Third Prize</strong></div>
      <div>🏆 2024 Teddy Cup Data Analysis Skills Competition · <strong>National Third Prize</strong></div>
      <div>🏆 2023 National University Computer Skills Challenge · <strong>National Third Prize</strong></div>
    </div>
  </div>
</div>

## <span class="font-mono text-xs text-weak uppercase tracking-widest mr-2">[ SEC 05 ]</span> Open-source Contributions and Technical Writing

<div class="border-t border-weak/10 pt-6 mt-8 flex flex-col gap-6 select-text">
  <div>
    <h3 class="text-xs font-mono text-weak uppercase tracking-wider mb-2">// Open-source contributions</h3>
    <p class="text-sm text-secondary leading-relaxed">
      <strong>codebase-memory-mcp</strong>：<a href="https://github.com/DeusData/codebase-memory-mcp/pull/1229" target="_blank" rel="noopener noreferrer" class="hover:underline">PR #1229</a> <strong>Merged</strong>. Added Oh My Pi (OMP) client integration with configuration-directory discovery, MCP registration, Skill installation, and install/uninstall workflows, plus configuration-isolation and user-content-preservation tests.
    </p>
  </div>
  <div>
    <h3 class="text-xs font-mono text-weak uppercase tracking-wider mb-2">// Selected technical knowledge pages</h3>
    <ul class="list-disc pl-4 text-sm text-secondary space-y-2">
      <li><a href="/blog/legacy/note/en/java-online-performance-debug/" class="hover:underline">Java production performance diagnosis: a minimal symptom-to-evidence decision tree</a>: Connects process/thread stacks, GC, and Arthas observations into containment, evidence preservation, diagnosis, and recovery.</li>
      <li><a href="/blog/legacy/note/en/containerd-tls-troubleshooting/" class="hover:underline">containerd TLS: certificate trust and temporary verification bypass</a>: Separates runtime CA, node trust, registry authentication, and image caches into a layered diagnostic path.</li>
    </ul>
  </div>
</div>
