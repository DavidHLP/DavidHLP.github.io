---
title: "Knowledge Base Ingest Inbox"
timestamp: 2026-08-07 00:00:00+00:00
tags: [Knowledge Base, Ingest, TODO]
description: "Candidate sources and questions that have not completed evidence review and must not be treated as stable knowledge."
---

# Knowledge Base Ingest Inbox

This inbox records candidate sources and questions. It is not a knowledge page: after `ingest`, an item must become a raw source with a corresponding wiki page or be explicitly closed with a reason.

## Completed ingestion

These historical article groups have completed the raw → wiki → index → log loop:

- Java foundations and backend tuning: AtomicBoolean, AutoCloseable, NullValue, Java production troubleshooting, and the Java backend internship retrospective.
- Operations and infrastructure: containerd TLS, SSH through private networks, and MySQL performance troubleshooting.
- OMP and agent engineering: configuration and rules, Hook extensions, Headroom single-port evolution, and Headroom persistence recovery.
- Architecture and engineering practice: terminal plugin lifecycle management and UISA high-reliability synchronization.

See the [Knowledge Base Index](/kb) for the page map.

## Pending sources

- [ ] Collect README files, design decisions, and runtime evidence for `ResiCache` and `UltiCode`, then create entity pages.
- [ ] Collect official documentation or reproducible experiments for newer OMP / Headroom configurations and replace version-sensitive provisional claims.

## 2026-08-12 session-candidate routing

- [x] The Headroom 0.34 `/v1/compress` and `/v1/retrieve` fields, modes, and live-endpoint checks now have upstream-source evidence and have been promoted to a stable knowledge page.
- [ ] Hindsight memories and derived claims still require an accessible service snapshot, upstream source, or reproducible experiment; for now they remain only in the ignored, redacted ledger.
- [ ] Unmatched OMP, OpenCode, and Codex candidates remain topic clusters. Workflow prompts, internal agent messages, and tool traces are not public knowledge and must not be copied into articles in bulk.

## Open questions

- [ ] Which troubleshooting steps are personal experience, and which are supported by official documentation or reproducible experiments?
- [ ] Which pages should become shared concepts, and which should remain local implementations of separate entities?
- [ ] When a new source conflicts with existing wiki content, should the old claim be deprecated or retained conditionally?

## Completion criteria

- A raw source slug, source URL, or explicit internal evidence exists.
- The wiki page declares `kind`, `status`, and `sources`.
- `kb-index.md` and `kb-log.md` are synchronized.
- The original source is not rewritten to fit a new conclusion.
