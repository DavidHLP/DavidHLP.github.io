---
title: "Headroom 0.34 Compression and Retrieval Contract: Fields, Modes, and Real-Endpoint Tests"
timestamp: 2026-08-12 00:00:00+08:00
series: "OMP & Agent Engineering"
kind: concept
status: active
sources: ["headroom-0-34-compress-retrieve-contract"]
related: ["llm-wiki-pattern"]
tags: [Headroom, API, Compression, CCR, Contract Testing, Agent]
description: "Pins the Headroom 0.34.0 /v1/compress and /v1/retrieve request, response, and mode boundaries, and explains why mocks and real loopback contract tests must share one schema."
toc: true
---

Treat the Headroom 0.34.0 API as a versioned contract rather than inferring fields from the dashboard, type names, or mocks. `/v1/compress` requires `model` and `messages`, compression metrics are top-level response fields, and `/v1/retrieve` returns `original_content`. An adapter can pass a self-consistent mock suite while getting all three wrong against the real proxy.

## Contract at a glance

### `POST /v1/compress`

```json
{
	"model": "<MODEL_NAME>",
	"messages": [{ "role": "user", "content": "..." }],
	"config": {}
}
```

A successful non-empty request on the normal compression path exposes these top-level fields:

```text
messages
tokens_before
tokens_after
tokens_saved
compression_ratio
transforms_applied
transforms_summary
ccr_hashes
```

Boundaries:

- Missing `model` or `messages` returns HTTP 400.
- The endpoint consumes `messages`; a Codex Responses `input` array must be converted first.
- `tokens_saved` is top-level, not nested under `stats`.
- An empty message list returns before config validation and omits `transforms_summary`; the caller must still decide whether an empty list is meaningful.

### `POST /v1/retrieve`

```json
{ "hash": "<CCR_HASH>" }
```

A successful response contains:

```text
hash
original_content
original_tokens
original_item_count
compressed_item_count
tool_name
retrieval_count
```

A missing `hash` returns HTTP 400; an absent or expired hash returns HTTP 404. Read `original_content` rather than probing for nonexistent `content` or `found` fields.

## Compression modes are not interchangeable

| `config.mode`         | Marker      | Store write | Requirement                                                               |
| --------------------- | ----------- | ----------- | ------------------------------------------------------------------------- |
| omitted               | no          | no          | Default path; no CCR retrieval loop is required                           |
| `ccr`                 | conditional | conditional | The caller injects a retrieval tool and can reach loopback `/v1/retrieve` |
| `lossy_inline`        | no          | no          | Lossless fold first, then Kompress on the remainder                       |
| `lossless_then_lossy` | no          | no          | Compatibility alias for `lossy_inline`                                    |

`ccr_hashes` reports markers actually inserted. Even in `ccr` mode, ordinary text or a general function message does not guarantee a marker. SmartCrusher row-drop on structured tool output is a verified marker-producing path. Tests must not equate enabling `ccr` with a non-empty `ccr_hashes` array.

## Freezing the provider-cache prefix

For a non-empty request on the normal compression path, `config.frozen_message_count` must be a non-negative integer. It freezes the first N messages already stored in the provider prompt cache: they remain visible to cross-message analysis but are returned byte-for-byte unchanged, avoiding cache-prefix rewrites. An empty message list returns before this validation.

It points in the opposite direction from protecting recent messages:

- `frozen_message_count` pins the leading provider-cache prefix;
- `protect_recent` protects recent messages near the tail.

Confusing them causes cache misses or preserves old messages that should have been compressed.

## Why mocks produce false positives

Three self-consistent but incorrect mock assumptions were observed:

1. reading `stats.tokens_saved`;
2. reading `content` or `found` from retrieval;
3. allowing `model` to be omitted.

If implementation and mock share those assumptions, unit tests still pass. The minimal fix is to extract the schema from the pinned release source, then require both mocks and loopback contract tests to follow it.

## Minimum contract test

Cover at least four assertions:

1. `/v1/compress` without `model` returns 400;
2. a valid response exposes top-level `tokens_saved`;
3. `/v1/retrieve` uses `original_content`;
4. only a fixture that actually inserts a marker expects non-empty `ccr_hashes`.

Isolate the transport environment when calling the real loopback endpoint. In some environments Bun `fetch` uses `HTTP_PROXY` without bypassing loopback as expected. Clear proxy variables in the test process or use a client that explicitly avoids proxying loopback; otherwise a connection failure can be misdiagnosed as an API-contract failure.

## Scope, risk, and rollback

This page is scoped to `headroom-ai==0.34.0`. On upgrade, reread the pinned release source and rerun the same contract tests, especially for required fields, response nesting, mode aliases, and CCR-store behavior.

Rollback does not require deleting data: restore new requests to the default marker-free mode. Keep the retrieval tool available for any active conversation that already contains CCR markers until that conversation ends, or start a new conversation before disabling `/v1/retrieve` tool injection. If the CCR store already contains entries, clean it through Headroom's lifecycle rather than modifying internal store files.

## Related pages

- [LLM-Wiki pattern](/en/note/llm-wiki-pattern)
