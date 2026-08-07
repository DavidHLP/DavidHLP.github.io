# Knowledge Base Index

This is the content-oriented entry point for the knowledge base. Read it before drilling into wiki pages and their `sources`.

The canonical wiki and raw sources are maintained in `zh-cn` so the LLM maintains one source of truth. Open the [canonical index](/kb), the [LLM-Wiki pattern](/note/llm-wiki-pattern), or the [ingest inbox](/jotting/kb-ingest-todo).

The maintenance contract lives in [KB.md](https://github.com/DavidHLP/DavidHLP.github.io/blob/main/KB.md) and the [knowledge-base skill](https://github.com/DavidHLP/DavidHLP.github.io/blob/main/.claude/skills/knowledge-base.md).

## Concept pages

### Knowledge base

- [LLM-Wiki pattern](/note/llm-wiki-pattern) — the operating model for raw sources, wiki pages, schema, ingest, query, and lint.

### Java foundations and backend tuning

- [AtomicBoolean and CAS state management](/note/java-atomic-boolean)
- [AutoCloseable and try-with-resources](/note/java-auto-closeable)
- [Spring Cache NullValue](/note/java-null-value)
- [Java production performance troubleshooting](/note/java-online-performance-debug)

### Operations and infrastructure

- [containerd TLS certificate troubleshooting](/note/containerd-tls-troubleshooting)
- [SSH through complex private networks](/note/intranet-penetration-ssh-guide)
- [MySQL performance troubleshooting](/note/mysql-performance-troubleshooting)

### OMP and agent engineering

- [OMP configuration and rules](/note/omp-config-and-rules-guide)
- [OMP Hook extensions](/note/omp-hook-extension-guide)

### Architecture and engineering practice

- [Terminal plugin lifecycle management](/note/plugin-lifecycle-management)

## Entity pages

None yet. Personal projects, tools, frameworks, and runtime environments will be added after their sources are collected and ownership is confirmed.

## Synthesis pages

- [Java backend internship interview retrospective](/note/java-internship-interview-blog-polished)
- [Headroom single-port evolution](/note/headroom-single-port-evolution)
- [OMP Headroom persistence and route recovery](/note/omp-headroom-persistence)
- [UISA high-reliability information synchronization architecture](/note/uisa-architecture-design)

## Raw sources

Canonical raw evidence is maintained under `src/content/raw/zh-cn/` and is never exposed as a public route:

- `karpathy-llm-wiki`
- `legacy-java-atomic-boolean`
- `legacy-java-auto-closeable`
- `legacy-java-null-value`
- `legacy-java-internship-interview-blog-polished`
- `legacy-java-online-performance-debug`
- `legacy-containerd-tls-troubleshooting`
- `legacy-intranet-penetration-ssh-guide`
- `legacy-mysql-performance-troubleshooting`
- `legacy-headroom-single-port-evolution`
- `legacy-omp-config-and-rules-guide`
- `legacy-omp-headroom-persistence`
- `legacy-omp-hook-extension-guide`
- `legacy-plugin-lifecycle-management`
- `legacy-uisa-architecture-design`

## Ingest inbox

- [Knowledge Base Ingest Inbox](/jotting/kb-ingest-todo) — remaining personal-project sources and open questions; the historical articles have now been ingested.

The canonical index and append-only operation log are maintained in `zh-cn`. Translations are presentation copies, not independent facts.
