---
{
  "archiveId": "X-1004",
  "title": "Knowledge Base Operation Log",
  "en": "SITE INFORMATION",
  "category": "站点随笔",
  "department": "站点信息",
  "date": "2026-10-05",
  "lead": "DavidHLPL",
  "clearance": "PUBLIC",
  "abstract": "Knowledge Base Operation Log · src/content/information/en/kb-log.md",
  "findings": [
    "Original document: src/content/information/en/kb-log.md",
    "Source revision: f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/information/en/kb-log.md",
  "pubDate": "2026-10-05T05:34:00.000Z",
  "tags": [
    "en",
    "information"
  ],
  "draft": false,
  "lang": "en",
  "legacy": {
    "path": "src/content/information/en/kb-log.md",
    "revision": "f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "metadata": {}
  }
}
---

# Knowledge Base Operation Log

This is an append-only record of knowledge-base maintenance. Historical entries are not rewritten; corrections are expressed as new entries.

## [2026-08-07] init | Personal AI knowledge base established

Restructured the site around Karpathy's LLM-Wiki pattern with three layers: immutable `raw` sources, LLM-maintained `note` pages, and the Schema in `KB.md` and the `knowledge-base` skill. The homepage, resume, and multilingual shell remain protected.

## [2026-08-07] ingest | @karpathy-llm-wiki

Saved the original Karpathy gist as `src/content/raw/zh-cn/karpathy-llm-wiki.md`, created the first `llm-wiki-pattern` concept page, and synchronized the index and operation log.

## [2026-08-07] lint | Initial check

Confirmed one raw source, one source-backed wiki page, and synchronized index/inbox. The old articles had not yet been ingested as stable knowledge at that point.

## [2026-08-07] ingest | Historical articles restaged as knowledge pages

Read 14 historical article topics from Git commit `6f3d114a6ef9eb08b730f5f4740afe5b7d22d426`, created `legacy-*` Chinese raw evidence snapshots, and restaged the content as tri-lingual `note` pages across Java foundations and backend tuning, operations and infrastructure, OMP and agent engineering, and architecture practice. The three former Java jottings were promoted to knowledge pages; version-sensitive Headroom, UISA, and interview retrospective material remain `provisional` synthesis pages.

## [2026-08-07] lint | Post-migration verification pending

The canonical and presentation indexes and the ingest inbox are synchronized. The next step is to verify the raw manifest, sources, related links, tri-lingual metadata, build output, and dead links.

## [2026-08-07] lint | Historical article migration verified

`pnpm kb:lint` passed with 15 raw sources and 45 tri-lingual wiki pages; sources, the raw manifest, the canonical index, and the operation log are synchronized. `pnpm check` reported no errors, `pnpm build` generated 71 pages, and `pnpm test:run` passed 129 tests (1 skipped). The built-site link scan checked 880 internal links and found only the existing 404/500 self-reference links.

## [2026-08-07] rewrite | Historical notes compiled into real knowledge pages

The previous pass only moved historical articles into raw-backed notes. This pass reread all 14 raw sources and rewrote the note bodies around definition, core mechanism, applicability, boundary risks, minimum verification, evidence and uncertainty, and related pages. Blog chronology, interview Q&A, and large configuration dumps were removed. The Java interview, Headroom routing/persistence, and UISA pages remain multi-source `provisional` syntheses; the rest are reusable concepts.

## [2026-08-12] ingest | Headroom 0.34.0 API contract

Extracted the field-level `/v1/compress` and `/v1/retrieve` contract from the pinned `v0.34.0` source and a real loopback contract test, then created the tri-lingual knowledge page. The page records the missing-`model` 400, top-level `tokens_saved`, `original_content`, conditional CCR markers, and `frozen_message_count` cache-prefix semantics; credentials, paths, hosts, and session identifiers from local ledgers were excluded from raw and public pages.


## [2026-08-13] ingest | Second batch of session engineering knowledge

Six reusable themes were selected from redacted candidates and re-evidenced with pinned public source/specifications/commits or disposable minimal experiments: ingestion/redaction v19, MCP/codebase-memory graph workflow, Redis/Jackson `LocalDateTime`, Flyway/MySQL schema drift, multi-service readiness, and OMP 17.2.15 Hook/Compaction. Five Chinese canonical concepts were added and three OMP pages updated. Under `KB.md`, `zh-cn` remained canonical; no en/ja copies were made without an explicit translation task.

Two new raw snapshots had been overwritten by expanded evidence during review. Their originals were restored; later evidence became `omp-17-2-15-runtime-contract-correction` and `multi-service-readiness-contract-correction`. Wiki pages cite both, without rewriting/deleting captured evidence.

A safety review found unscoped Compose verification commands. `multi-service-readiness-safety-correction` pinned v5.4.0 `-f`/`-p` and `down` boundaries. The canonical page now uses a dedicated fixture/unique project and states restart/abort/down effects.

## [2026-08-13] ingest | Five themes grounded in public evidence

Five candidates were rebound to fixed versions/commits: JJWT 0.13.0 signature/verification APIs, Testcontainers 1.20.6 Docker API fallback, Dubbo 3.3.6 + Nacos registration, ResiCache observer nesting, and microservice domain/data ownership. Five redacted raw snapshots and Chinese concepts were added; index/log updated. No en/ja copies were made without a translation task.

Dubbo/Nacos integration smoke tests, the Testcontainers runtime matrix, JJWT compile/runtime assertions, and arbitrary-depth observer nesting were not reported as executed. Registry URL uses of `nacos.check`/`retry.period` were corrected against pinned source. Private sessions, internal addresses, credentials, and unpublished implementations were excluded.

## [2026-08-13] correction | Evidence review and immutable raw correction

Review narrowed JJWT `PrivateKey`/`verifyWith`, Testcontainers `TestEnvironment` paths and `999.999` matrix, Dubbo `register-consumer-url`, and pinned microservice URLs. The initial five snapshots were retained and four correction raws added. Notes cite both; original hashes were restored in `src/content/raw/.manifest.sha256`. No credentials, private paths, or session identifiers were found in public content.

## [2026-08-13] maintenance | Narrow translated wiki publication

Following `KB.md`, 28 en/ja copies of 14 historical topics without independent translation confirmation were marked `draft: true`. Their indexes were reduced to navigation and explicitly translated pages. Chinese cross-links were completed and published translations' metadata links to drafts removed. Raw, protected pages, and existing log entries were unchanged.

## [2026-08-13] ingest | Headroom coexisting with cc-switch / Claude Code

Pinned `omp-headroom-provider-proxy` source and same-day redacted runtime observations show Claude Code `/v1/messages` entering Headroom 8787 before cc-switch 15721 performs protocol conversion and credential injection; OMP `/v1/responses` retains separate request-level upstreams. The record includes `HEADROOM_CC_SWITCH_RECONCILE=1` write-back direction, single compression responsibility, the `BindPaths=%h/.claude` tradeoff under `ProtectHome=tmpfs`, and observed `/admin/upstream` plus `/v1/messages → 127.0.0.1:15721`. Raw/wiki contain no credentials, session IDs, request bodies, or host absolute paths.

## [2026-08-13] ingest | OMP Headroom Bridge and native Codex routing

One entity/raw was ingested from pinned repository source and redacted current-worktree delivery evidence. It records user-systemd loopback Headroom 8787, two explicit OMP provider routes, shared user-level Codex CLI/Desktop Responses provider, Claude Code/cc-switch boundaries, `bin/codex-routes` marker/lock/hash/mode/atomic-restore constraints, static/lifecycle/fresh-client checks, and rollback order. Credentials, user configuration bodies, `models.db`, request bodies, host absolute paths, and fabricated URLs for uncommitted code were excluded. The current worktree was explicitly not yet a new public commit.

## [2026-08-17] ingest | Local Hindsight and OMP / Codex memory integration

Pinned Vectorize Hindsight v0.9.1 source and local-loopback observations supplied deployment/integration records: AMD ROCm `gemma4:12b` Q4_K_M GGUF, CPU Local `BAAI/bge-m3`, FastMCP stdio state, Git-root routing against subdirectory drift, the source's Rootless/UID-1000 permission configuration, and OMP `scoping: per-project` alignment with Codex. One redacted raw and Chinese concept were added; index/log updated. Real session IDs, request bodies, private credentials, and host absolute paths were excluded.

## [2026-08-21] ingest | Complete Personal-markdown-notes / Fuwari aggregation

All 107 Markdown originals were aggregated: 46 from Personal-markdown-notes `bbb2126`, 61 from Fuwari `07cee2b`. Ten immutable `ingest-*` raws/wiki pages cover Docker, HBase, Redis business/persistence/Heima, Java concurrency, Spring Cloud, Spark/big data, MySQL, and miscellaneous frontend notes. Three exact duplicates and one empty `事务的作用域.md` were identified in raw; zero-width characters in Fuwari filenames retain exact provenance. New raws were registered in `src/content/raw/.manifest.sha256`; each wiki declares kind/status/sources/related. Index, `pnpm kb:lint`, and `pnpm build` were updated/validated in that commit. Miscellaneous notes remain provisional; Heima/principles pages do not claim pinned-version validation.

## [2026-08-21] ingest | ResiCache and UltiCode entities

Pinned public README/CONTEXT evidence produced two immutable raws and Chinese entities: ResiCache `75ed279a` (canonical README.md + README.zh-CN.md) and UltiCode `3f14ac89` (README.md + CONTEXT.md glossary). ResiCache covers handler order, protections off by default, serializer migration, and observer cross-links. Provisional UltiCode covers owners, port/projection deep modules, and judging transaction invariants. Local unpublished worktrees ahead of origin/main by 14/25 commits were excluded. Broken `redis-null-value` links in all three `redis-business-patterns` versions became `java-null-value`, with reciprocal related metadata. Lint/build passed in that commit.

## [2026-08-21] maintenance | Consolidate series facets

Audit found six singleton series across Java backend security/concurrency/testing and LLM/Agent engineering, plus misplaced spring-cloud-and-boot and database-schema-drift facets. Eighteen frontmatters across six three-language groups were aligned with the index: jjwt/resicache-observer/testcontainers → Java security, concurrency and testing; hindsight → OMP/Agent engineering; spring-cloud → microservices/RPC; schema drift → architecture/engineering. Chinese canonical content now has eight multi-page series; en/ja draft metadata remains slug-aligned. Bodies, sources, and raw were unchanged. All three-language `/note/` body/related links were checked without breaks.

## [2026-08-23] maintenance | Convergence Phase 1 and index redesign

Following `docs/kb-convergence-design.md`, index presentation became six domains: knowledge/AI, Java/concurrency, storage/cache, distributed/microservices, infrastructure/operations, engineering/architecture. Three learning paths and an eight-page provisional graduation board were added. All 49 raw rows moved into `<details>` with an aggregate column; ten `ingest-*` packages became read-only `legacy-aggregate`. Quotes in nine series fields were normalized to stop split facets. Review withdrew “collapse each domain to ≤6 rows” and “reduce index lines by 30%,” recording why. Raw, bodies, and protected pages were unchanged; lint/build passed.

## [2026-08-23] maintenance | Phase 2: Hindsight split and miscellaneous archive

The 445-line Hindsight monolith became three canonical pages: `hindsight-local-deployment` (L1/L2 compute/Docker concept), `hindsight-omp-codex-integration` (L4 FastMCP/dynamic-routing entity), and `hindsight-troubleshooting` (L3 seven-failure concept, respecting the single-source concept invariant). The original became a deprecated guide. The ten-note frontend collection was dissolved/deprecated and removed from the main index. Navigation, graduation board (seven provisional), and archives were updated. `pnpm kb:lint`, `pnpm test:run`, and `pnpm build` all passed.

## [2026-09-07] maintenance | Recruitment entry points and ResiCache design review

After user acceptance, the homepage added role introduction and resume/project/email entry points, reusing canonical UltiCode/ResiCache pages. All three homepages have localized introductions; English/Japanese explicitly identify Chinese case-study bodies. The observer page gained pinned source links, a review guide, and a Node standard-library model covering fragments, duplicate lifecycle counterexamples, exceptional cleanup, and reference-identity token pairing. The model is not real Java/Redis concurrency or production validation. Index and reciprocal project links were updated using existing sources; raw snapshots were untouched.

## [2026-09-08] maintenance | Evidence boundaries for three historical Hindsight articles

Three existing Chinese bodies were reviewed and updated: retain 0 + update 3 + merge 0 + archive 0 + delete 0 + defer 0 = 3. Whole-library inventory covered paths, metadata, and direct references only: 49 raw, 132 wiki (44/language), three inbox items. Body changes were limited to the three below; raw remained read-only. Home, resume, other topics, and en/ja bodies were not processed. That batch stopped without automatically starting another.

| Original under `src/content/note/zh-cn/` | Type / audience / question | Disposition | Reason and retained content | Validation |
|---|---|---|---|---|
| `hindsight-local-deployment.md` | Deployment concept; local deployers; compute/network/mount allocation | Update in place | Separate container network/host loopback and non-root/Rootless; remove universal hardware promises; retain Compose, Modelfile, ownership commands with prerequisites | Full text/raw review and official docs; deployment not rerun |
| `hindsight-omp-codex-integration.md` | Integration entity; Agent integrators; routing clients to Banks | Update in place | Correct physical-isolation/non-Git-default claims; explain basename collisions and incomplete MCP; retain bridge, dual-client configuration, single-retrieval metrics | Text/code static review and protocol comparison; handshake/write/recall not rerun |
| `hindsight-troubleshooting.md` | Troubleshooting concept; operators; selecting diagnostic checks | Update in place | Correct model-not-found inference, Rootless, download threshold, list/stdio validation meaning; retain seven failures and six-stage narrative as source reports | Full context/doc review; commands remain examples |

Original timestamps remain 2026-08-23; no independent revision-date field existed, so the 2026-09-08 review date was written in bodies/log without adding schema. All remain in OMP/Agent engineering. Tags remain deployment: Hindsight/Docker/Ollama/ROCm/BGE-M3/Architecture; integration: Hindsight/OMP/Codex/FastMCP/MCP/DynamicRouting; troubleshooting: Hindsight/Troubleshooting/Docker/Permissions/FastMCP/Ollama. Index domain A and Agent learning path remain their entry points. Distinct deployment/integration/troubleshooting responsibilities were not merged by shared keywords; no new category/summary page was added.

The shared source is `raw/zh-cn/hindsight-local-deployment-and-agent-integration.md`, capturedAt 2026-08-17 without independent event timestamps. Source Hindsight is v0.9.1, but Ollama `rocm` is mutable; OMP/Codex/Node/drivers and model revisions/checksums are incompletely pinned. Events/metrics are historical reports. Public paths remain `https://davidhlp.github.io/note/<filename without .md>`, without a migration or new redirect; the old monolith guide remains.

Only three index summaries and this log entry were updated as dependencies. Mutual links, old guide, and en/ja counterparts remain direct references. Attachments, code, diagrams, and practice data were retained. A protocol-gaps anchor was added for troubleshooting; existing slugs/titles/other anchors remain, including compatibility for the renamed bridge heading. No deletion, new archive, wiki, or raw was introduced. The clean starting commit `6ee762b0db89357fc670edd16b4ad910fd6ebcb3` permits per-file restoration without resetting the worktree.

External references checked on 2026-09-08: [MCP 2025-06-18 transports](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports), [Docker Rootless](https://docs.docker.com/engine/security/rootless/), [Compose startup order](https://docs.docker.com/compose/how-tos/startup-order/), and [Ollama CLI](https://docs.ollama.com/cli). No independent publication date was visible for the last three. The [Hindsight v0.9.1 tag](https://github.com/vectorize-io/hindsight/tree/v0.9.1) was accessible, but that alone does not verify image, configuration keys, or model identity. Corrections link directly to supporting conclusions without changing raw.

Pending then: six en/ja translations built locally but lacked those corrections, so were candidates for an explicit translation task. Model identity/license/weight hash, current Ollama tag, Hindsight keys, and client Bank naming still needed verification. Full bridge protocol tests were not run; it was not production-ready evidence. Hindsight knowledge pages/mental models were outside that batch's explicit write scope and were not synchronized; cross-platform completion was not claimed.

Validation recorded for that revision:

- **Passed**: `node --import tsx scripts/kb-lint.ts` (49 raw/132 wiki), final `node node_modules/astro/astro.js build` (84 pages), and diff checks. Native pnpm failed at startup with `unable to open database file`; direct tsx CLI failed on sandbox IPC `listen EPERM`. Neither completed content checking. The same script through the Node loader subsequently succeeded without changing rules.
- **Passed**: Built HTML checks covered 78 local note/anchor links, three compatibility anchors, and the monolith guide. Frontmatter/bridge JavaScript remained byte-identical, fence counts unchanged, raw clean, historical log prefix preserved, and no backup files published.
- **Manual review**: All three texts compared with originals/raw, retaining configuration/code, seven failures, six stages, and single-recall data. Unsupported generalizations were removed, not unique practice evidence. Separate entry points and historical index summaries remained.
- **Build notices**: Both runs showed duplicate-id warnings for changed pages; the second included index/log. Builds and links passed, but the warning origin was unresolved. No same-name files or ID changes were introduced. Node `module.register()` deprecation, PhotoSwipe static/dynamic imports, and large chunks were reported. Without an unchanged baseline, they were not arbitrarily assigned to this revision or called preexisting; no program-code expansion followed.
- **Not run**: Independent Astro typecheck, full unit tests, browser visuals, live-site checks, or deployment/model/Agent runtime tests. Content lint/build did not establish publishing or service reproduction. No commit, push, or publication occurred.

The revision corrected isolation/fallback and narrowed permissions/model/performance claims while retaining practice and old paths. Remaining reader risks were stale en/ja and incomplete model/runtime evidence.

## [2026-09-09] ingest | Current UltiCode highlights and LLM engineering

The entity became the Chinese long-form “UltiCode: a verifiable engineering system,” retaining slug/provisional status. Pinned main `f801a1076b2fa9aa06ce3d63821f0778b477042c` grounds owners, `SubmissionFactsSnapshot`, DB outbox/Streams, generation/attempt fences, Docker D-form, sync/async contracts, static/release supply-chain gates, and separate LLM/Agent lessons.

New immutable `ulticode-engineering-highlights-f801a1076` captures architecture, judge/sandbox source, boundary-test names, and CI excerpts; older project-context remains. Repository implementation/source/test evidence, blog-local checks, BLOCKED_EXTERNAL/OUT_OF_SCOPE are distinguished from production, throughput, HA, zero loss, and complete escape prevention. Index learning paths/entity/raw counts/source table were updated; home/resume, en/ja, and UltiCode source untouched. Native pnpm lint/check/build failed at startup with the database error, but equivalent Node/tsx lint/Astro check/build and diff checks passed. Duplicate-id, Node, PhotoSwipe, and chunk notices remained without code expansion. No commit/push/publication.

## [2026-09-09] ingest | Current ResiCache highlights and LLM engineering

The entity was rewritten as verifiable concurrency/consistency boundaries, retaining slug and becoming provisional. Pinned `main@2954fff217257e9cf7c906450a75070d5e092637` grounds chain ordering/toggles, leader/follower/reentrant, sealed outcomes, `CachedValue.version` Lua CAS, whitelist serialization, and observer scope tokens. ASYNC safely shortens TTL; it does not call the loader directly.

New immutable `resicache-engineering-highlights-2954fff` records build line, source entries, concurrency/race/serialization/lifecycle tests and limits; project-overview and observer raw remain. LLM/Agent lessons are synthesis, not project feature claims. Repository Implemented/Test Evidence, Locally Validated, BLOCKED_EXTERNAL, OUT_OF_SCOPE remain separate from production throughput/P99/HA/zero loss/SLA/security audit. Index entity/raw counts/table and `.manifest.sha256` updated; home/resume, en/ja, ResiCache source untouched. Only blog lint/build/diff were validated; no Maven/Redis/Testcontainers, commit, push, or publication.

## [2026-09-09] ingest | Six UltiCode concepts

The entity remains the series entry; six independent Chinese provisional concepts cover owners/snapshots, outbox/Streams, generation/attempt, Docker/infrastructure errors, async execution, and static-to-supply-chain gates. They share immutable `ulticode-engineering-highlights-f801a1076` and reciprocal `/note/ulticode` links, without duplicate raw or UltiCode edits.

Each is problem-led with mechanisms, source links, LLM lessons, boundaries, and minimal checks. Exactly-once, production HA, and complete escape-prevention claims remain excluded. Index entity/concept groups updated; home/resume, en/ja, existing ResiCache changes untouched. Verification is the actually executed KB lint/Astro check/build/diff for that batch. No commit/push/publication.

## [2026-09-09] maintenance | ResiCache as an LLM-Wiki article

At user request, the highlight list became a problem-led canonical article following a miss through the chain, single-flight/sealed outcomes, value-version CAS, secure versioned serialization, and observer lifecycles, then LLM lessons and evidence tiers.

Existing immutable highlights/project-overview/observer sources remain. Raw, ResiCache code, home/resume, en/ja untouched. Boundaries retained: ASYNC shortens TTL without invoking loader; envelope/value versions differ; write-back failure still returns loaded data. Native pnpm's local database/sandbox error remained; equivalent Node KB lint/Astro build/diff passed. No ResiCache Maven/Redis/Testcontainers or commit/push/publication.

## [2026-09-09] ingest | Three remaining UltiCode concepts

Owner-local audit Outbox/Consumer Inbox, fenced singleton leases, and Core opt-in bounded testbed became separate Chinese concepts. The existing generation/attempt page was retained in the nine-page series without duplicate URLs.

New immutable `ulticode-reliability-core-f801a1076` adds pinned audit adapters/dispatcher, Admin inbox bridge, consumer inbox, fenced leases, reconciliation, Core lifecycle, migrations, ADRs, and tests. Local transactions, ACK ordering, `(consumer,event_id)`, fence conditions, allowlists, timeout handoff, and close-once retain explicit scope; no cross-service exactly-once, production HA, complete isolation, or full Core-start proof. Index, entity, raw manifest updated; UltiCode source/home/resume/en/ja untouched. Diff, equivalent Node/tsx KB lint, Astro check/build passed: check 0 errors/0 warnings/2 hints; 93 built pages. Native pnpm remained blocked by database error; duplicate-id/Node/PhotoSwipe/chunk notices remained. No commit/push/publication.

## [2026-09-09] ingest | Four ResiCache concepts

All four candidates became Chinese provisional concepts: chain/observer nesting, single-flight/distributed lock, version-CAS early expiration, secure serialization/staged migration. Existing overview and observer pages remained unmodified; no raw was added/changed, and highlights/project-overview/observer evidence is reused.

Index concept groups/graduation board register each page. Pinned main `2954fff217257e9cf7c906450a75070d5e092637` source, boundary tests, and that batch's local validation do not establish production performance, HA, exactly-once, or a full security audit. Home/resume, ResiCache code, and en/ja were untouched; no commit/push/publication.

## [2026-09-13] ingest | Database written-test review as a standard article

User-supplied `database_written_test_review.md` became canonical provisional synthesis `database-written-test-review`. Structure: review framework → semantics/dialects → boundaries → execution/recovery → limits → reusable checklist. SQL examples, four-table exercises, Kettle, and huge-table handling remain, with Oracle/MySQL/Spark SQL/PDI scope. No en/ja translation was made then.

New immutable raw records the original and is cited through sources. Index domain C, graduation board, 53-source count/table, and raw manifest updated. Original Downloads file, home/resume, existing Rhine changes untouched; no commit/push/publication.

Diff checks passed. Native pnpm KB lint failed on tsx IPC `listen EPERM`, then equivalent Node-loader lint passed (53 raw/146 wiki). `pnpm check` passed with 0 errors/0 warnings/4 hints; build generated 98 pages, the `/note/database-written-test-review` route, and OG metadata. Existing duplicate-id/Node/PhotoSwipe/chunk notices remained without code expansion. Oracle/MySQL/Spark/Kettle runtime, benchmarks, browser visuals, and live publishing were not verified.
