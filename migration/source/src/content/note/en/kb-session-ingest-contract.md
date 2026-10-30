---
title: "KB Session Ingestion Pipeline Contract: Incremental Reuse, Redaction v19, and Immutable Raw"
timestamp: 2026-08-13 00:00:00+08:00
series: "Personal AI Knowledge Base"
kind: concept
status: active
draft: true
sources: ["kb-ingest-pipeline-v19"]
related: ["llm-wiki-pattern"]
tags: [Knowledge Base, Ingestion, Redaction, Hashing, Manifest, Raw Evidence]
description: "Pins the minimal contract of the KB session ingestion pipeline at commit c0ae74e: identity/content-hash-driven incremental reuse, no reuse of failed records, redaction v19, internal control-plane filtering, partial checkpoint resume, and immutable raw manifest validation, and clarifies placeholder semantics and redaction boundaries."
toc: true
---

This knowledge base's own session ingestion pipeline converts tool sessions (OMP, Codex, OpenCode, Hindsight, prompt-history) into candidate evidence that can enter the wiki. The core guarantee in one sentence: **sources whose content is unchanged are incrementally reused; sources whose content changed or that failed are reprocessed; only text that passes v19 redaction and internal control-plane filtering is written to disk; the raw evidence layer is locked by the manifest hash.** This page is a contract snapshot of a fixed commit; it only describes verifiable behavior and records no real ledger content or run statistics.

## Applicable versions and scenarios

- Fixed point: commit `c0ae74e72982910e13c46de0b92cf8fb9a8d1751` in the public repository `DavidHLP/DavidHLP.github.io`.
- Evidence files (all at that commit): `KB.md`, `.claude/skills/knowledge-base.md`, `scripts/kb-ingest-sessions.ts`, `scripts/kb-ingest-sessions.test.ts`, `scripts/kb-lint.ts`.
- Applicable scenarios: when you need to judge "whether this run reuses the prior ledger or reprocesses that source", need to redact session text before safely writing it to disk, or need to troubleshoot ingestion/validation failures. After upgrading or changing the pipeline, return to that commit and re-verify the contract.

## Core mechanism: separating identity hash from content hash

Incremental reuse is decided by separating two independent hashes:

- **Identity key**: `tool \0 hashIdentifier(project) \0 hashIdentifier(session)`, without a content hash, used to decide "the same source" across runs. `hashIdentifier(v) = sha256(v.normalize("NFKC"))`; project and session identity are NFKC-normalized before hashing and entry.
- **Content hash**: `contentHash` is computed by source type — OMP / Codex / prompt-history use SHA-256 of the file bytes at read time; OpenCode SQLite uses `sha256(JSON.stringify({session, rawHashes}))` (`rawHashes` is an array of SHA-256 hashes of each row's message/part JSON); Hindsight uses `sha256(JSON.stringify(value))`.
- **Source key**: `source_key = sha256(tool \0 hashIdentifier(project) \0 hashIdentifier(session) \0 contentHash)`, the locating key for ledger entries and partial overrides.
- Candidate dedup fingerprint: `normalizedFingerprint = sha256(normalizeText)`; `normalizeText` = NFKC + `toLocaleLowerCase` + whitespace collapsing + trim.
- Test anchors: same tool/project/session/content ⇒ same sourceKey; appended content ⇒ contentHash and sourceKey change; a different tool ⇒ the key changes; sources with `source_changed_during_read` produce no candidates. prompt-history's `sessionIdentity` is fixed to the file path; after appending content, identity stays the same while contentHash changes.

Meaning: the identity key answers "who", the content hash answers "changed or not", and `source_key` is the ledger entry; do not treat the session identity hash as a content fingerprint.

## Failed records are not reused

Hard conditions for reusing a prior candidate (only enter the unchanged branch when all are satisfied):

1. `prior.parse_status !== "failed"`;
2. `prior.content_hash ===` the current `contentHash`;
3. `redaction_status` ends with `:v19`;
4. the prior ledger is complete (candidates count = candidate_count, and count>0 or rejected is non-empty).

Therefore a source that failed parsing is re-parsed and re-extracted for candidates even when its content hash is unchanged. Test anchor: "reprocesses a previously failed source even when its content hash is unchanged" (change the prior manifest to `parse_status: failed`, clear the candidate ledger, rerun, and assert that the source is reprocessed and candidates are produced again). When a source-level `error` exists, it is recorded in rejected as `malformed_or_unavailable_source`; a source whose file size/mtime differs between reads produces no candidates and counts as failed.

## Redaction v19

- Constant `REDACTION_VERSION = "v19"`; the manifest's `redaction_status` takes the form `redacted:v19` / `none:v19`, and the `v19` suffix is the mandatory gate for reusing a prior ledger — older redaction results are not treated as reusable state.
- `redactText` replaces in a fixed order and records the labels hit (`applied`); output is truncated to `MAX_CANDIDATE = 8000` characters, and the visible-text upper bound per source is `MAX_TEXT = 120_000`.

Field-level replacement categories:

| Category                | Form                                                                                                                                                |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | --- | ------------------------- |
| PEM private key         | `PRIVATE KEY` block → `<REDACTED_TOKEN>`                                                                                                            |
| DSN password            | `scheme://user:pass@` → `<REDACTED_PASSWORD>`                                                                                                       |
| Private repository      | `git@host:path` → `<PRIVATE_REPOSITORY>`                                                                                                            |
| API key                 | `*api*key* = value` → `api_key=<REDACTED_API_KEY>`; `sk-…` (≥16 characters), `AKIA…` (16 characters) → `<REDACTED_API_KEY>`                         |
| Token                   | credentials ≥12 characters after `Bearer`/`Basic` → `<REDACTED_TOKEN>`; `gh[pousr]_…` / `xox[baprs]-…` (≥16 characters) → `<REDACTED_TOKEN>`        |
| Common sensitive fields | `token`/`authorization`/`cookie`/`secret(?:key)? = value` → `token=<REDACTED_TOKEN>`; `password`/`passwd… = value` → `password=<REDACTED_PASSWORD>` |
| Identity                | email (including local forms like `user@host`) → `<PRIVATE_EMAIL>`                                                                                  |
| Host                    | private/loopback addresses (10/127/192.168/172.16–31, `::1`, `fc`/`fd`, `fe8`–`feb`, `localhost`, `\*.internal                                      | local | lan | corp`) → `<PRIVATE_HOST>` |
| Path                    | UNC `\\…`, Windows drive `C:\…`, `/home/…`, `/Users/…`, `~/…`, `file:…`, other absolute paths → `<PRIVATE_PATH>`                                    |

Test anchor: "redacts credentials, identity, hosts, paths, and private repositories": asserts that all 7 placeholder categories appear, and asserts that a batch of concrete secret values (usernames, private hosts, loopback/IPv6 addresses, Windows/UNC/`~`/absolute paths, DSN and Redis passwords, password/cookie/api_key inside JSON, quoted-escape suffixes) do not appear in the result; non-sensitive fields (such as `tokens_saved=42 token_count=10`) are preserved.

## Internal control-plane filtering

- `visible()` keeps only text with `role ∈ {user, assistant}`, non-internal-control-plane text, and non-empty text after redaction; roles and parts such as system / toolCall / toolResult / reasoning do not enter candidates.
- `isInternalConversationText` (decision prefix takes the first 768 characters of the text) discards by class: recording markers (`[user]/[assistant]` prefixes, `**agent|user|assistant**:`, `¶user|think|ai|call:`, `_thinking:_`, `Complete the assignment… thoroughly:`, `Archived transcript scopes:`, `# Session update`, `[irc]`); internal narration; tool envelopes (`call:TOOL:NAME{`, `→ tool(`, `→ tool(args) ⇒`); runtime envelopes (`Parent IRC message`, `Current interruptible wait|operation`, `[budget notice]`, `[async-result]`, `(No response)`); watchdog narration (`Silent…`, `Still context gathering`, `The agent is (mid-turn|scoping|reading|reviewing|gathering)`, `Nothing to critique`, `No action needed`, `Waiting for…`, `I'll wait`); transcript-analysis text; nested envelopes and transcription artifacts.
- Source-level boundaries: OMP `__advisor.jsonl`'s `recordType` is changed to `advisor`, candidates cleared, `skipReason="internal_control_plane"`, `parse_status=skipped`, and after the advisor file is deleted it no longer appears in the manifest (tests cover both directions); Codex `history.jsonl` candidates are cleared with `skipReason="prompt_index_covered_by_session_store"`; OpenCode opens SQLite read-only (`readOnly: true` + transaction) and takes only `type === "text"` parts; Codex consumes each of `response_item`'s `input_text`/`output_text` exactly once, excluding developer/event/reasoning traces.
- When reusing a prior candidate, `hasInternalCandidateText` filtering is run again; filtered-out candidates are recorded in rejected with `rejection_id = sha256(source_key \0 "internal_transcript_filtered")`. Test anchor: after changing a persisted candidate to stale internal transcript containing `_thinking:_` and rerunning ⇒ that source stays unchanged, candidates are cleared, rejected grows, and persisted candidates no longer contain that marker.

## Partial checkpoint resume

- The output directory defaults to `.agent/kb-ingest/` (overridable with the CLI `--output-dir`); the partial ledger trio: `manifest.partial.jsonl`, `candidates.partial.jsonl`, `rejected.partial.jsonl`.
- `persistPartial` runs every 100 sources processed and after all sources are done: atomically writes the three partial ledgers (temp file + rename, directory `0700`, files `0600`) and writes `.agent/checkpoints/current-task.md` (containing the resume cursor = the last processed `source_key`, batch count, failure count, and next action).
- The next run merges partial into prior state: a `source_key` appearing in partial overrides the same-named entry in the formal ledger (same for candidates/rejected), enabling resume from a breakpoint.
- After a successful `--write` finish, the three partial files are deleted; a dry run (without `--write`) is `dry_run=true`, creates no output directory, and writes no ledger.
- Test anchor: "dry-runs without ledger mutation, then preserves unchanged state on write rerun": a dry run creates no output directory; after the first write the source is in the processed state with directory/file permissions `0700`/`0600`; after forging a partial manifest with an updated contentHash and `redaction_status: none:v5`, rerunning recovers that source from partial; rerunning with unchanged content yields the unchanged state; the persisted manifest contains no real usernames or session ids (identity is hashed).

## Raw manifest immutable validation

- Fixed path `src/content/raw/.manifest.sha256`, one line per entry of `<64-hex> <space> <relative path>`.
- Error categories: missing ⇒ `missing raw manifest`; invalid format ⇒ `invalid raw manifest entry`; unregistered raw file ⇒ `raw file missing from manifest`; checksum mismatch ⇒ `raw checksum mismatch`; manifest pointing to a nonexistent file ⇒ `manifest points to missing raw file`.
- `git diff --name-status HEAD -- src/content/raw` (excluding the manifest itself): `M/D/R/C` status ⇒ `raw snapshot changed or deleted`; silently skipped when git is unavailable.
- Remaining checks: note pages must have `kind`/`status`/`sources`; `sources` must resolve to an existing raw slug; the index must register all raw slugs and active/provisional pages; the log must contain parseable entries matching `^## \[\d{4}-\d{2}-\d{2}\] .+`. Any error is aggregated and output with `exit 1`.
- Consistent with `KB.md` / the knowledge-base skill: `src/content/raw/{locale}/` is the immutable evidence layer — LLM is read-only and can only add, never edit/format/translate/delete; lint rejects modification or deletion of registered raw snapshots.

## Placeholder semantics and redaction boundaries

- **Placeholder appearance = successful replacement, not leakage.** Placeholders such as `<PRIVATE_PATH>` are asserted by tests as "must appear" because they are evidence that sensitive content was hit.
- **Leak judgment must scan actual field values** (tests assert that concrete secret values do not appear); placeholder absence/appearance must not be used as the leak criterion.
- **Regex is a best-effort rule-based replacement, not a security proof.** Uncovered forms of private content may slip through (unproven); tests cover only a constructed case set and do not constitute a guarantee for arbitrary input. Sensitive data should still have higher-level review before entering raw.

## Minimal verification and failure diagnosis

On the fixed commit `c0ae74e` checkout, run:

```text
pnpm exec vitest run scripts/kb-ingest-sessions.test.ts
pnpm kb:lint
```

Failure diagnosis order:

1. **Run the focused parser tests first**: on failure, locate the contract section by test name (identity/content hash, failed reuse, redaction, control-plane filtering, partial checkpoint, dry-run semantics); the test assertions are the behavioral contract; all tests use synthetic fixtures and involve no real session data.
2. **Then run `pnpm kb:lint`** and handle failures by error category:
    - First fix raw validation errors (`missing raw manifest` / `raw checksum mismatch` / `raw file missing from manifest` / `manifest points to missing raw file` / `raw snapshot changed or deleted`): raw is the immutable evidence layer, **warnings must not be eliminated by modifying raw**; check the snapshot and manifest or register a new source.
    - Then fix note page metadata (missing `kind`/`status`/`sources`, `sources` not resolving to a raw slug): add frontmatter or correct the links.
    - Finally fix index/log sync (raw slugs or active/provisional pages not registered, log entry format not parseable).
3. Any error is aggregated and output with `exit 1`; fix in "evidence chain → metadata → index/log" order, and do not delete factual sources to silence warnings.

## Rollback and cleanup

- A dry run has no side effects: it creates no output directory and writes no ledger, so it is safe to try.
- Interrupted ingestion: the partial trio and checkpoint files are kept, and the next run automatically merges them into prior state and resumes; after a successful `--write` finish, partial files are deleted automatically.
- To fully rerun from scratch: clear the output directory (default `.agent/kb-ingest/`) and the checkpoint, then rerun; the raw evidence layer is unaffected (output is the pipeline's own product; raw is immutable input).
- Wiki pages may be rewritten, merged, or deprecated; raw is never written back. Falling back to an old contract snapshot = checking out the corresponding fixed commit and following the `KB.md` of that time.

## Failure boundaries

- Redaction coverage is unproven: uncovered forms of private content may slip through, and the regex rule set is not an audit proof.
- This page neither records nor re-verifies real candidate ledger content or run statistics (not a snapshot target).
- **Old bug narratives in historical candidates are not current findings**: the content of earlier candidate entries (such as failed-process descriptions recorded in the `failed_solutions` field) is a knowledge content field, candidate data rather than a pipeline defect, and old narratives must not be read as evidence of a current regression.
- This page only describes the contract and verifiable facts of the fixed commit; it contains no real usernames, absolute paths, credentials, or statistics.

## Evidence and uncertainty

- **Source facts**: `kb-ingest-pipeline-v19` (fixed commit `c0ae74e`) records the hashing scheme, failed-reuse conditions, redaction v19 categories, control-plane filtering rules, partial checkpoints, raw manifest validation, and the corresponding test names; every conclusion can be re-verified line by line along that raw's stable URL.
- **Unconfirmed**: redaction coverage over arbitrary input, real ledger content and run statistics, and pipeline changes after the commit (this page is pinned to `c0ae74e` only; re-verify after upgrading).

## Related pages

- [LLM-Wiki pattern](/en/note/llm-wiki-pattern): an overview of this knowledge base's three-layer architecture and its ingest/query/lint operations; this page is the implementation-level contract of its "ingest" operation.
