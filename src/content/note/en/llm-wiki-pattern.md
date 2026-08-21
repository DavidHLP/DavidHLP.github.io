---
title: "The LLM-Wiki Pattern: Maintaining a Compounding Personal Knowledge Base"
timestamp: 2026-08-07 00:00:00+00:00
series: "Personal AI Knowledge Base"
kind: concept
status: active
sources: ["karpathy-llm-wiki"]
related: ["headroom-compress-retrieve-contract"]
tags: [LLM, Knowledge Base, Wiki, RAG, Agent]
description: "The operating manual for DavidHLPL's personal AI knowledge base: raw sources, wiki pages, schema, and the ingest/query/lint loop."
toc: true
top: 1
---

> This page describes the operating model of the knowledge base itself. The primary source is [`karpathy-llm-wiki`](https://gist.githubusercontent.com/karpathy/442a6bf555914893e9891c11519de94f/raw/ac46de1ad27f92b28ac95459c782c07f6b8c964a/llm-wiki.md). The maintenance contract lives in [KB.md](https://github.com/DavidHLP/DavidHLP.github.io/blob/main/KB.md) and the [knowledge-base skill](https://github.com/DavidHLP/DavidHLP.github.io/blob/main/.claude/skills/knowledge-base.md).

## Definition

The LLM-Wiki pattern is not a file-upload RAG system that reconstructs an answer from scratch for every question. The LLM reads source material and compiles facts, concepts, entities, comparisons, and uncertainty into a persistent, linked set of Markdown pages.

The key difference is simple: **the wiki compounds.**

Cross-references remain available, contradictions are made explicit, and synthesis pages evolve as new sources arrive. A useful answer can be filed back into the wiki instead of disappearing into chat history.

## Why it matters: the accumulation gap in RAG

| Dimension       | Traditional RAG / file upload         | LLM-Wiki                                |
| --------------- | ------------------------------------- | --------------------------------------- |
| Knowledge shape | Raw documents retrieved at query time | Persistent, pre-compiled wiki           |
| Synthesis cost  | Reassembled for every query           | Compiled during ingest and kept current |
| Contradictions  | Rediscovered repeatedly               | Recorded explicitly in pages            |
| Compounding     | Usually starts from zero              | Each ingest expands the network         |

RAG is not necessarily inaccurate; it simply does not accumulate enough. LLM-Wiki moves the bookkeeping and synthesis work into the ingest step.

## Three layers

| Layer       | Location                                    | Role                                          | Mutability                          |
| ----------- | ------------------------------------------- | --------------------------------------------- | ----------------------------------- |
| Raw sources | `src/content/raw/{locale}/`                 | Clipped articles, papers, documents, and data | Read-only                           |
| Wiki        | `src/content/note/{locale}/`                | `concept`, `entity`, and `synthesis` pages    | Incrementally maintained by the LLM |
| Schema      | `KB.md`, `.claude/skills/knowledge-base.md` | The maintenance contract                      | Evolves slowly                      |

The separation lets the wiki be rewritten without overwriting evidence. Every non-trivial conclusion should trace back to raw through `sources`.

## Three operations

### Ingest

Save a source in raw, confirm the important facts, create or update wiki pages, maintain cross-references, update `kb-index.md`, and append an entry to `kb-log.md`. One source may touch many pages, but raw is never edited afterwards.

### Query

Read the index first, then the relevant wiki pages and their raw evidence. Distinguish source facts, existing synthesis, and current inference. Comparisons, decisions, and analyses that remain useful should become `synthesis` pages.

### Lint

Look for contradictions, stale claims, orphan pages, broken links, unsupported conclusions, unindexed pages, and concepts that should be split or merged. Turn lint findings into the next ingest or query instead of polishing the surface only.

## Navigation files

- [`kb-index.md`](/en/kb) is the content-oriented catalogue of concepts, entities, syntheses, and raw sources.
- [`kb-log.md`](/en/kb#log) is an append-only timeline. Each entry starts with `## [YYYY-MM-DD] type | title`, so it can be searched with `grep '^## \['`.

- The next batch of work is tracked in the [ingest inbox](/en/jotting/kb-ingest-todo).

## Current boundary and next direction

`zh-cn` is the canonical language of this knowledge base. `en` and `ja` keep the site entry points and this explanatory page translated; they are not independent sources of truth.

The old operations, Java, and architecture blog posts were removed from the public wiki list. Whether they deserve re-ingestion requires source ownership, deduplication, and evidence review; previous publication is not enough to make a claim stable.

Future pages should grow three connected networks:

1. **Entity pages** for personal projects, tools, frameworks, and runtime environments.
2. **Concept pages** for transferable methods, principles, and troubleshooting models.
3. **Synthesis pages** for comparisons, evolutions, and personal decisions across sources.
