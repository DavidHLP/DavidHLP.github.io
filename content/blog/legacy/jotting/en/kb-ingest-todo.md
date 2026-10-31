---
{
  "archiveId": "X-1019",
  "title": "Knowledge-base Ingest Inbox",
  "en": "JOTTINGS",
  "category": "站点随笔",
  "department": "随笔",
  "date": "2026-08-07",
  "lead": "DavidHLPL",
  "clearance": "PUBLIC",
  "abstract": "Sources and questions awaiting evidence review are ingestion candidates, not stable knowledge.",
  "findings": [
    "Original document: src/content/jotting/en/kb-ingest-todo.md",
    "Source revision: f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/jotting/en/kb-ingest-todo.md",
  "pubDate": "2026-08-07T00:00:00.000Z",
  "tags": [
    "Knowledge Base",
    "Ingest",
    "TODO",
    "en",
    "jotting"
  ],
  "draft": false,
  "lang": "en",
  "legacy": {
    "path": "src/content/jotting/en/kb-ingest-todo.md",
    "revision": "f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "metadata": {
      "title": "知识库摄入收件箱",
      "timestamp": "2026-08-07 00:00:00+00:00",
      "tags": [
        "Knowledge Base",
        "Ingest",
        "TODO"
      ],
      "description": "尚未经过证据审查的来源和问题，只能作为摄入候选，不能当作稳定知识。"
    }
  }
}
---

# Knowledge-base Ingest Inbox

This records candidate sources and questions awaiting organization. The inbox is not a knowledge page: after `ingest`, an item must either enter `src/content/raw/zh-cn/` with a corresponding wiki or be explicitly closed with a reason.

## Completed ingestion

These historical articles have completed raw → wiki → index → log:

- Java basics/backend tuning: AtomicBoolean, AutoCloseable, NullValue, Java performance diagnosis, backend internship interview review.
- Operations/infrastructure: containerd TLS, SSH intranet access, MySQL performance.
- OMP/Agent engineering: configuration/rules, Hooks, Headroom single-port evolution and persistence recovery.
- Architecture/engineering: terminal plugin lifecycles and UISA reliable information synchronization.

### 2026-08-21 complete aggregation

- [x] All originals from `Personal-markdown-notes` (bbb2126, 46) and `Fuwari` (07cee2b, 61) were grouped into ten immutable `ingest-*` raws and ten `note` wikis: Docker, HBase, Redis business/persistence/Heima, Java concurrency, Spring Cloud, Spark/big data, MySQL, miscellaneous frontend notes. Three exact duplicates and one empty file are identified in raw; relative image paths were escaped as links for building.
- [x] Hindsight memories/derived conclusions still need accessible-snapshot review. This batch did not promote them to stable concepts ([Hindsight practice](/blog/legacy/note/en/hindsight-local-deployment-and-agent-integration/)).

See the [knowledge-base index](/blog/legacy/information/en/kb-index/).

## Sources awaiting ingestion

- [x] Personal-project README/CONTEXT evidence for `ResiCache` (`75ed279a`) and `UltiCode` (`3f14ac89`) completed raw → entity ([ResiCache](/blog/legacy/note/en/resicache/), [UltiCode](/blog/legacy/note/en/ulticode/)). Runtime evidence for load, sandbox isolation strength, and production deployment remains pending.
- [ ] Collect official documentation/reproducible experiments for newer OMP/Headroom configuration to replace historical provisional conclusions.

## 2026-08-12 session candidate triage

- [x] Headroom 0.34 `/v1/compress` and `/v1/retrieve` fields, modes, and real-endpoint verification gained upstream-source evidence and a formal knowledge page.
- [ ] Review each Hindsight/derived conclusion with accessible service snapshots, upstream source, or repeatable experiments; currently retained only in an ignored redacted ledger.
- [ ] Cluster unmatched OMP/OpenCode/Codex candidates by theme. Workflow prompts, internal Agent messages, and tool traces are not public knowledge and must not be copied wholesale into articles.

## Open questions

- [ ] Which troubleshooting steps are personal experience, and which have official/reproducible support?
- [x] Which pages should merge into shared concepts, and which remain entity-specific? The 2026-08-21 audit retained three Redis pages (business/persistence/Heima) with differing sources/perspectives and reciprocal `related`; seven Headroom/OMP pages have distinct contract/evolution/coexistence/persistence roles and remain separate. Series were consolidated into eight canonical divisions (kb-log 2026-08-21 maintenance).
- [ ] When a new source conflicts with old wiki, should a claim be deprecated or conditioned?

## Completion criteria

- Raw source slug, source URL, or explicit internal evidence.
- Wiki declares `kind`, `status`, and `sources`.
- `kb-index.md` and `kb-log.md` synchronized.
- Original sources are not rewritten to fit new conclusions.
