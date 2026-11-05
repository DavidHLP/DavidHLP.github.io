---
{
  "variant": "java-vue",
  "title": "Java + Vue",
  "lang": "en",
  "role": "Java + Vue Full-stack Engineer",
  "summary": "2026 graduate with a security-product backend internship; builds business interfaces and API integrations with Java, Vue 3, TypeScript and Nuxt 4."
}
---

## <span class="resume-section-number">[ SEC 00 ]</span> Selected Strengths

- **End-to-end flows**: Integrated UltiCode problem, submission, verdict and admin flows; real browser/Judge acceptance covers login, AC/WA, rejudging and rankings.
- **Administration and analysis UI**: Built BossAnalyze user tables/forms, a role authorization tree and recruitment filters/charts/paging over existing Java/Spark APIs.
- **Contracts and failures**: Fixed post-refresh CSRF replay, cached timestamps and profile-length contracts; distinguishes real API checks, browser fixtures and write-verification limits.

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

<p class="resume-stack">Java 17 / Spring Boot 4 / Spring Security / MySQL / Redis Streams / Vue 3 / TypeScript / Docker</p>

Personal open-source judge connecting user-side problems, submissions and verdicts with administration of problems and contests. Backend business owners work with an independent Judge Worker.

- **End-to-end business flow**: Connects problem viewing, code editing, submission and verdict pages. Browser and real-Judge acceptance cover login, AC/WA, admin-edit readback, rejudging and contest rankings.
- **Authentication and replay**: Cookie sessions and CSRF cooperate with backend refresh rotation. Replayed requests attach the new CSRF token while retaining payload, account binding and a single-retry limit.
- **Backend reliability**: Transactional Outbox and Redis Streams deliver tasks; Lua combines deduplication and enqueueing. `generation` + `attemptId`, leases and SQL CAS prevent stale verdicts overwriting newer results.
- **Execution and validation**: Docker constrains untrusted code's network, permissions and resources. Real-MySQL fresh/upgrade migrations and browser business acceptance run in CI; release artifacts undergo signature and provenance checks.

### BossAnalyze Recruitment Analytics [GitHub](https://github.com/DavidHLP/BossAnalyze)

<p class="resume-stack">Java 17 / Spring Boot 3 / Spark / Scala / Vue 3 / TypeScript / Nuxt 4 / shadcn-vue / MySQL</p>

Rebuilds management and recruitment-analytics pages around existing Java/Spark APIs, retaining contracts, authorization rules and stored data. Focuses on integration, data states and failure handling.

- **Admin interactions**: Used existing user/role APIs for filtering/paging, detail/create/edit forms and a role authorization tree, with unsaved-change protection, grant read-back and deletion guards.
- **Analytics pages and components**: Implements city/job filters, sample summaries, an SVG scatter plot, client pagination, read-only job details and separate salary rankings, reusing four existing Spark reads.
- **Authentication and permissions**: Requires sign-in and resumes the requested route after login. Ordinary accounts may access analytics; ungranted management routes still return 403. Frontend entry points do not broaden server permissions.
- **Data and interaction states**: Distinguishes empty data, unknown salaries and numeric zero, with loading, failure and retry states. External source links reject executable protocols and credential-bearing URLs.
- **Contract fixes**: A shared parser accepts cached integer-millisecond timestamps and valid date strings. Create/edit introduction limits match existing `varchar(255)`; oversized input is rejected without silent truncation.
- **Regression and responsive checks**: Frontend tests, Nuxt type-check and build pass; filters, pagination, details and narrow layouts were checked. Real APIs were verified with an empty database; populated plots and pagination were separately tested with browser fixtures. Admin mutations were tested with browser interception only, not executed against real accounts.

## <span class="resume-section-number">[ SEC 03 ]</span> Professional Skills

### Java backend

- Familiar with Java, Spring Boot, Spring Security, MyBatis-Plus and MySQL; practical API design, authentication/authorization, SQL plans and index optimization.
- Project experience with Redis cache protection, distributed locks, Streams, Outbox, Dubbo and Docker; understands transactions, retries and eventual consistency.
- Diagnoses issues with Arthas, Linux, container logs and SQL observations, then verifies fixes through regression and real-service checks.

### Vue frontend and integration

- Project experience with Vue 3, TypeScript, Nuxt 4 and shadcn-vue, component decomposition, forms/lists and responsive layouts.
- Practices Cookie/CSRF, login redirects, permission feedback and API parsing; follows backend contracts for null/zero values, timestamps, length limits and error retries.
- Uses frontend regressions, type-checking, builds and browser interactions to verify business flows, distinguishing persisted real data from UI-only fixtures.

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
- [UltiCode Outbox and Redis Streams: Making Judge Delivery Recoverable](https://davidhlp.github.io/blog/legacy/note/en/ulticode-outbox-redis-streams/): Explains transactional outbox, atomic delivery, retries, dead letters and pending-message recovery.
