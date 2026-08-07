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
