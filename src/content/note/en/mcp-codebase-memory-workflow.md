---
title: "MCP Protocol Era Boundary and the codebase-memory-mcp v0.10.2 Graph Workflow"
timestamp: 2026-08-13 00:00:00+08:00
series: "OMP & Agent Engineering"
kind: concept
status: active
draft: true
sources: ["mcp-codebase-memory-workflow"]
related: ["llm-wiki-pattern"]
tags: [MCP, Specification, Knowledge Graph, Code Intelligence, Workflow, Codebase Memory]
description: "The boundary and error codes between the MCP 2026-07-28 modern per-request _meta and the legacy initialize handshake, plus the codebase-memory-mcp v0.10.2 graph-search workflow: graph results are not a completeness proof, and negative conclusions must return to coverage and source code."
toc: true
---

When treating a code-graph tool as an evidence source, first separate the two version boundaries: the MCP specification `2026-07-28` (modern) switched to **per-request stateless declarations** with no `initialize` handshake, while codebase-memory-mcp `v0.10.2` is a **legacy-era server** that supports at most `2025-11-25`, which modern clients cannot connect to directly. The compatibility facts between the two determine which contract the workflow uses to verify, while the discipline of the graph tool itself determines whether the conclusion is trustworthy: **graph results are not a completeness proof, and negative conclusions must rely on coverage checks plus a source-code fallback**.

## Protocol-era boundary: per-request `_meta` vs the `initialize` handshake

The "modern" version of the MCP 2026-07-28 specification (commit `5f5440bb`) removes the connection-level negotiation handshake and makes each request self-describing:

| Dimension                      | legacy (2025-11-25 and earlier)                                                                                                           | modern (2026-07-28 onward)                                                                                                                         |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Session establishment          | `initialize` handshake + `notifications/initialized`                                                                                      | No handshake, no `notifications/initialized`                                                                                                       |
| Version/capability declaration | Negotiated during the handshake                                                                                                           | Carried in each request's `_meta`                                                                                                                  |
| Server-state assumption        | Session state allowed                                                                                                                     | **Stateless**: inferring capabilities/version/identity from earlier requests on the same connection is forbidden; a stdio process is not a session |
| Version discovery              | Negotiated                                                                                                                                | The server must implement `server/discover` (the client may call it first)                                                                         |
| Compatibility                  | A dual-era implementation can support both eras at once, distinguishing by request shape (modern `_meta` → modern; `initialize` → legacy) | Same rule                                                                                                                                          |

The modern per-request `_meta` fields (from `basic/index.mdx`):

- `io.modelcontextprotocol/protocolVersion`: **required**.
- `io.modelcontextprotocol/clientCapabilities`: **required**.
- `io.modelcontextprotocol/clientInfo`, `logLevel`: optional.

**Error codes must be distinguished by contract**:

| Error                                  | Error code          | Trigger condition                                               | Attached data                                                                                  |
| -------------------------------------- | ------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Invalid params                         | `-32602` (HTTP 400) | A required `_meta` field is missing or the request is malformed | —                                                                                              |
| `MissingRequiredClientCapabilityError` | `-32021` (HTTP 400) | The server needs a capability the client did not declare        | `data.requiredCapabilities` lists the missing items                                            |
| `UnsupportedProtocolVersionError`      | `-32022`            | The protocol version does not match                             | `data.supported` lists the supported versions; the client selects a common version and retries |

Extension negotiation goes through `capabilities.extensions` (extension identifier → settings object); when one side does not support an extension, it falls back to core protocol behavior or reports an error. Response `resultType`: `"complete"` means success, `"input_required"` means more input is needed (MRTR multi-round requests), unknown values are treated as invalid, and the default is `"complete"`.

## v0.10.2's protocol-era attribution (decisive compatibility fact)

The `src/mcp/mcp.c` at pinned commit `b377c62a` is a **legacy-era (initialize handshake) server**, not a 2026-07-28 modern server:

- `SUPPORTED_PROTOCOL_VERSIONS[]` (lines 1222–1231) contains only `"2025-11-25"`, `"2025-06-18"`, `"2025-03-26"`, `"2024-11-05"` from newest to oldest, **without `2026-07-28`**.
- Lines 1262–1293 implement the legacy `initialize` handshake in `cbm_mcp_initialize_response_for_profile` (reads the request parameter `protocolVersion`, echoes it if supported, returns `protocolVersion` + `serverInfo` + `capabilities`); the `"initialize"` method is handled in request dispatch starting at line 11341.
- The source contains no handling of `server/discover`, the modern per-request `_meta` protocol fields, or `notifications/initialized`.

Under the 2026-07-28 specification's compatibility matrix, the "Modern client | Legacy server" combination **Fails**: a modern client cannot run the workflow below directly against v0.10.2. Validating v0.10.2 requires the legacy `2025-11-25` contract (`initialize` handshake + `notifications/initialized` notification), or a dual-era adapter.

## Minimal workflow: confirm → search → call chain → source → coverage

The upstream-endorsed order comes from the pinned source `MCP_SERVER_INSTRUCTIONS` (starting at line 1233). v0.10.2 is a legacy server, so the lifecycle must first be completed under the `2025-11-25` contract (or through a dual-era adapter); the pseudo-call order is as follows (excluding local configuration):

```text
0. initialize { protocolVersion: "2025-11-25" }      # legacy handshake: negotiate version + capabilities
1. notifications/initialized                          # notify initialization complete (no such step in modern 2026-07-28)
2. list_projects                        # confirm the project is indexed; only call index_repository when it is not
3. index_repository { repo_path }       # only when the repo is not indexed or a forced refresh is needed; the response reports skipped/parse_partial gaps
4. index_status { project }             # project health + coverage report (node/edge counts, root path, git context)
5. check_index_coverage { project, scopes: [...] }
                                        # read metadata.generation_matches to confirm the graph and coverage record are the same generation
6. search_graph { project, query | name_pattern }   # discover symbols, take the exact qualified_name
7. trace_path { function_name, project, direction: "both" }   # callers + callees
8. get_code_snippet { qualified_name, project }     # read the exact source by qualified_name
9. check_index_coverage { project, paths: [...] }   # check coverage for every path referenced or operated on
10. query_graph { graph: "missed" }      # full gap check before exhaustive assertions
```

Step notes:

- **First confirm index generation and health**: use `list_projects` and `index_status` to confirm the project exists, its index state, and the coverage report; call `index_repository` only when the repo is not indexed or a refresh is explicitly needed. The `check_index_coverage` result is still a best-effort signal, not a completeness proof.
- When `trace_path` returns 0 results, the README explicitly says to first search with `search_graph(name_pattern=...)` before querying; the README's tier contract requires `search_graph` before `trace_path` and `get_code_snippet`.
- `get_code_snippet` is a read tool, not a search tool: the source comment is explicit — "First call search_graph to find the exact qualified_name, then pass it here. This is a read tool, not a search tool." When a short name is ambiguous, it returns suggestions.

## Tool-parameter contract cheat sheet (per the pinned source `TOOLS[]`)

| Tool                   | Required                                                                         | Key optional / behavior                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `index_repository`     | `repo_path`                                                                      | `mode` enum `full/moderate/fast/cross-repo-intelligence`; `persistence` writes the team-shared artifact `.codebase-memory/graph.db.zst`                                                                                                                                                                                                                                                                                                                                              |
| `search_graph`         | `project`                                                                        | When `query` (BM25) is present, `name_pattern` is ignored; `semantic_query` must be a **string array** (a single string is a type error); `format` enum `tree` (default)/`json`; the response contains `total` and `has_more` for pagination                                                                                                                                                                                                                                         |
| `trace_path`           | `function_name`, `project`                                                       | `direction` enum `inbound/outbound/both` (default `both`); `depth` defaults to 3 (README notes Depth 1–5); `mode` enum `calls/data_flow/cross_service`; `limit` defaults to 100 (1–5000); `truncated:true` + `next` cursor for continuation, a `cursor` invalid after reindex returns `stale_cursor`; `include_tests` defaults to false; `include_evidence` adds per-hop resolution strategies (`lsp\|language_rule\|heuristic\|unresolved`) and confidence; alias `trace_call_path` |
| `get_code_snippet`     | `qualified_name`, `project`                                                      | `include_neighbors` defaults to false; when `coverage_note` is returned, handle it under coverage discipline                                                                                                                                                                                                                                                                                                                                                                         |
| `check_index_coverage` | `project`; at least one of `paths`/`scopes` (both missing → rejected at runtime) | `paths` ≤128 exact paths, `scopes` ≤32 path prefixes; `scope_limit` defaults to 200 (1–1000); the status is independent of filesystem metadata freshness                                                                                                                                                                                                                                                                                                                             |
| `index_status`         | `project`                                                                        | `verbose` optional; returns node/edge counts, root path, git context, and the coverage report                                                                                                                                                                                                                                                                                                                                                                                        |
| `query_graph`          | —                                                                                | Read-only openCypher subset (`MATCH`/`WHERE`/`RETURN`, etc.), 100k-row cap; `graph:"missed"` queries the miss graph of files not fully indexed                                                                                                                                                                                                                                                                                                                                       |

Other tools: `list_projects` (lists indexed projects), `delete_project`, `get_graph_schema` (node labels/edge types/properties, the README recommends running it first), `get_architecture` (languages/packages/routes/hotspots/clusters), `search_code` (graph-enhanced grep, only within indexed files, patterns `compact/full/files`), `detect_changes` (git diff → affected symbols + blast radius, `inbound` default), `manage_adr`, `ingest_traces`. There are 15 MCP tools in total.

## Graph results ≠ a completeness proof

These boundaries, repeatedly stressed upstream, must be observed for negative/exhaustiveness conclusions:

- `index_repository`/`index_status`: "absence of a flag is NOT a completeness guarantee" — the signal is only best-effort.
- `check_index_coverage`: "indexed_no_recorded_gap is not a completeness guarantee"; line ranges in `parse_partial` files may be missing from the graph, so you should "prefer grep inside flagged ranges".
- `get_code_snippet`: when it returns `coverage_note`, "prefer grep there and treat the returned source as ground truth".
- Files skipped entirely (gitignore/.cbmignore/skip-lists) do not appear in normal graph results; `not_indexed` is by design, not a failure.

Therefore, "X is not found in the graph" or "trace_path has no callers" cannot be written directly as a negative conclusion. First use `check_index_coverage` (`scopes`) to check coverage status and gaps — but `indexed_no_recorded_gap` is likewise not a completeness proof; coverage checks only expose recorded gaps and cannot endorse that the file was "indeed fully indexed". For relevant ranges, read/grep the source directly (prioritizing `parse_partial`/`not_indexed` regions), and use source facts as the final basis for negative conclusions.

## Boundaries and unproven content

- This page covers only two fixed points: the MCP `2026-07-28` specification and the codebase-memory-mcp `v0.10.2` tool contract; the `2026-07-28` authorization/transports/subscriptions details are not expanded; the legacy `initialize`/`notifications/initialized` sequence only references the `2025-06-18` lifecycle document and is not checked item-by-item against earlier version differences.
- **No indexing/query experiments were run**: all API descriptions are summaries of the upstream README and pinned source; the "15 tools" count comes from the README badge and the source `TOOLS[]` (15 items) and was not runtime-enumerated against the binary; `trace_path`'s depth range (README "Depth 1-5") and schema default (3, no declared upper bound) come from different documentation locations and were not runtime-verified.
- In v0.10.2, `semantic_query` is a parameter mode of `search_graph`, not a standalone tool (the README wording is somewhat ambiguous; the source `TOOLS[]` is authoritative).
- Runtime validation of v0.10.2 must follow the legacy `2025-11-25` contract (first `initialize` to negotiate `protocolVersion`, then send `notifications/initialized`, then go `list_projects` → `index_repository` → `search_graph` → `trace_path` → `get_code_snippet` → `check_index_coverage`), and this flow does not apply to direct connections from a modern `2026-07-28` client; this page did not run that runtime experiment.

## Evidence and uncertainty

- **Source facts**: the `mcp-codebase-memory-workflow` snapshot pins two upstream versions — MCP specification tag `2026-07-28` (commit `5f5440bb26a62e2cf3440b92da5a667efa03b267`) and codebase-memory-mcp release `v0.10.2` (commit `b377c62a4e8b7ad64ccd295e4aa88abc8d275180`); field-level contracts come from the specification mdx and `TOOLS[]`, `MCP_SERVER_INSTRUCTIONS`, `SUPPORTED_PROTOCOL_VERSIONS[]` (lines 1222–1231), and the `initialize` dispatch logic (from line 11341) in `src/mcp/mcp.c`. The protocol-era attribution (highest `2025-11-25`, no `2026-07-28`, "Modern client | Legacy server" is Fails) is the decisive fact the raw sources give from the pinned code.
- **This page's synthesis**: organizes the specification and source into an executable model of "era boundary → minimal workflow → completeness discipline"; error codes, required fields, enum values, and generation fields all come item-by-item from the raw sources.
- **Unconfirmed**: no runtime indexing/query experiment supports this; tool behavior on the real binary, the `trace_path` depth upper bound, and the 15-tool runtime enumeration are all unverified. Future versions (above either fixed point) must be rechecked.

## Related pages

- [LLM wiki pattern](/en/note/llm-wiki-pattern): the way this knowledge base compiles such sources into evidence-driven wiki pages
