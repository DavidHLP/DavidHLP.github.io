---
{
  "archiveId": "X-1031",
  "title": "Headroom Single-Port Synthesis: Entry, Dynamic Upstreams, and Verification Boundaries",
  "en": "ENGINEERING NOTES",
  "category": "AI 工具",
  "department": "工程笔记",
  "date": "2026-07-31",
  "lead": "DavidHLPL",
  "clearance": "PUBLIC",
  "abstract": "Synthesizes the Headroom single-port routing model: one loopback entry can serve explicitly configured custom providers and dynamic upstreams while preserving protocol differences. It separates OMP role selection, model_cache, request routing, and wrapper lifecycle and verifies each layer independently. Historical routes remain provisional.",
  "findings": [
    "Original document: src/content/note/en/headroom-single-port-evolution.md",
    "Source revision: f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "Evidence status: provisional"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/note/en/headroom-single-port-evolution.md",
  "pubDate": "2026-07-31T16:00:00.000Z",
  "tags": [
    "OMP",
    "Agent",
    "Headroom",
    "DevOps",
    "LLM",
    "Operations",
    "Routing",
    "Proxy",
    "Codex",
    "Kimi",
    "MiniMax",
    "Zhipu",
    "en",
    "note"
  ],
  "draft": false,
  "lang": "en",
  "legacy": {
    "path": "src/content/note/en/headroom-single-port-evolution.md",
    "revision": "f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "metadata": {
      "title": "Headroom Single-Port Synthesis: Entry, Dynamic Upstreams, and Verification Boundaries",
      "timestamp": "2026-08-01 00:00:00+08:00",
      "series": "OMP & Agent Engineering",
      "kind": "synthesis",
      "status": "provisional",
      "draft": true,
      "sources": [
        "legacy-headroom-single-port-evolution",
        "legacy-omp-config-and-rules-guide",
        "legacy-omp-headroom-persistence"
      ],
      "related": [
        "omp-config-and-rules-guide",
        "omp-headroom-persistence",
        "omp-hook-extension-guide",
        "llm-wiki-pattern"
      ],
      "tags": [
        "OMP",
        "Agent",
        "Headroom",
        "DevOps",
        "LLM",
        "Operations",
        "Routing",
        "Proxy",
        "Codex",
        "Kimi",
        "MiniMax",
        "Zhipu"
      ],
      "description": "Synthesizes the Headroom single-port routing model: one loopback entry can serve explicitly configured custom providers and dynamic upstreams while preserving protocol differences. It separates OMP role selection, model_cache, request routing, and wrapper lifecycle and verifies each layer independently. Historical routes remain provisional.",
      "toc": true
    }
  },
  "kind": "synthesis",
  "status": "provisional",
  "sources": [
    "legacy-headroom-single-port-evolution",
    "legacy-omp-config-and-rules-guide",
    "legacy-omp-headroom-persistence"
  ],
  "related": [
    "omp-config-and-rules-guide",
    "omp-headroom-persistence",
    "headroom-cc-switch-coexistence",
    "omp-headroom-provider-proxy",
    "omp-hook-extension-guide",
    "llm-wiki-pattern",
    "headroom-compress-retrieve-contract"
  ]
}
---

> **Graduation requirements (three verifiable checks)**:
> 1. Pinned-version contract tests for explicit `/v1/messages` and `/v1/responses` routes.
> 2. Delete/rebuild damaged `model_cache` and validate cold-start recovery.
> 3. Validate rollback and effective configuration under `BindPaths` isolation.

This page synthesizes one migration conclusion: a single port does not mean that every provider is automatically rewritten to 8787. It means explicitly configured custom providers can share one loopback entry, while request-level data selects the real upstream. The current `headroom wrap omp` automatic scope, OMP model selection, derived `models.db` state, and Headroom lifecycle must be considered separately; historical routes are not current defaults.

## Core mechanism

### 1. Single-port routing causal chain

```mermaid
flowchart LR
  A[OMP role] --> B[modelRoles / model_cache<br/>provider selection]
  B --> C{wrap-managed or explicit custom?}
  C -- built-in anthropic --> D[Wrapper-managed Anthropic route]
  C -- explicit custom --> E[127.0.0.1:8787]
  C -- other default entry --> F[Direct upstream]
  E --> G[base URL + original path + provider headers]
  G --> H[Dynamic upstream/protocol adaptation]
  H --> I[HTTP or Codex WebSocket]
```

| Selector / route type         | Default or historical state                       | Requirement for the single port                                        | Key boundary                                                                                        |
| ----------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Built-in `anthropic`          | `headroom wrap omp` may manage it automatically   | An active wrapped session                                              | Automatic scope is not every provider; the default target remains Anthropic upstream                |
| `openai-codex`, `opencode-go` | Usually direct entries in the current `models.db` | An explicit custom provider is required for loopback                   | Wrap does not rewrite ordinary entries to 8787                                                      |
| Zhipu / Kimi / MiniMax        | Historical custom routes                          | Provider config, loopback base URL, and request headers must all exist | A legacy Kimi target override can silently send headerless Anthropic requests to the wrong upstream |
| Codex Responses               | Historical explicit custom route                  | WebSocket target and protocol must stay aligned                        | Do not assume a normal OpenAI Chat Completions route can cover Responses WebSocket                  |

### 2. Why converge from multiple ports

- **Configuration**: OMP can declare one loopback base URL for providers that need governance; upstream host, original path, and protocol differences remain request-level data.
- **Operations**: No per-provider proxy process or port unit is needed, reducing port collisions and unit drift; the trade-off is a single-port failure affecting every routed provider.
- **Protocol**: HTTP Chat Completions, Anthropic Messages, and Codex Responses WebSocket cannot be distinguished by port alone; provider, original path, and protocol metadata must be preserved.
- **Lifecycle**: The current recommendation is for `headroom wrap omp` to start and own the active proxy; persistent services and manual `headroom proxy` belong to migration history.

### 3. Three layers of route evidence

1. **L1 configuration**: distinguish wrapper-managed built-in `anthropic`, direct `models.db` entries, and explicit custom entries.
2. **L2 protocol**: in the active wrapped session, send a minimal protocol request for a declared selector and confirm loopback reachability, header forwarding, and a valid protocol response.
3. **L3 upstream**: observe proxy inbound/outbound logs and the final HTTP URL or WebSocket `response.completed`; this is the evidence that the intended upstream received the request.

## Applicable conditions

- Several explicitly configured providers need shared local proxy capabilities such as compression, caching, protocol normalization, or unified observation.
- A migration must decouple the port topology from provider count while preserving each provider's path and protocol differences.
- You need to answer separately “what did the role select?”, “which entry did the request use?”, and “which upstream received it?”
- You can accept a wrapper-scoped lifecycle and explicitly clean route state when the session ends.

## Not applicable and risks

| Misuse                                            | Result                                                       | Boundary and response                                                                 |
| ------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Treating 8787 as the global default               | Direct roles bypass the proxy and the diagnosis is wrong     | Check the selector's model/cache entry and whether custom configuration exists        |
| Checking only `/health` or HTTP 200               | Only loopback reachability is proven                         | Perform L2 protocol and L3 final-upstream checks                                      |
| Enabling legacy provider units alongside wrap     | Port contention, stale headers, or misleading logs           | Use only `headroom wrap omp` daily; treat old services as migration residue to remove |
| Applying an HTTP route to Codex WebSocket         | Handshake or Responses events fail                           | Preserve the WebSocket URL, path, and completion-event evidence                       |
| Relying on an old Kimi/Anthropic override         | Headerless requests silently use the wrong upstream          | Remove the legacy override or use an explicit custom-provider route                   |
| Equating proxy traversal with compression savings | A short request reports zero savings and is judged unproxied | Observe loopback, proxy logs, and compression statistics separately                   |
| Treating manual `models.db` edits as persistence  | The process keeps an old cache and rebuilds it after restart | Treat the cache as derived state and validate a new wrapped session                   |

## Minimal verification

```bash
# Recommended current session entry; use the official version/install guidance
headroom wrap omp
```

While the wrapped session is running, execute `headroom doctor` and `headroom perf` from another terminal, then check L1 → L2 → L3. Probe loopback and the final upstream only when a selector has an explicit custom provider; check default direct selectors against their direct upstream separately. At the end, explicitly run `headroom unwrap omp` unless intentionally keeping the proxy.

## Evidence and uncertainty

- **Source facts**: `legacy-headroom-single-port-evolution` records the historical convergence to 127.0.0.1:8787, dynamic headers, the MiniMax override, the Kimi/Anthropic target trap, and Codex WebSocket; `legacy-omp-config-and-rules-guide` separates role-to-model, model-to-entry, request-level routing, and wrapper lifecycle; `legacy-omp-headroom-persistence` describes `models.db` as derived cache.
- **This page's synthesis**: defining a single port as a shared entry for explicit custom routes, then using L1/L2/L3, keeps configuration, protocol, and final-upstream evidence separate.
- **Unconfirmed**: the provider set currently covered automatically by the wrapper, header names, log fields, provider protocol adapters, and whether 8787 is a default all vary with Headroom/OMP versions; historical Zhipu, Kimi, MiniMax, and Codex routes are not default guarantees.

## Related pages

- [OMP configuration layers](/blog/legacy/note/en/omp-config-and-rules-guide/)
- [Headroom route persistence](/blog/legacy/note/en/omp-headroom-persistence/)
- [OMP Hook extension](/blog/legacy/note/en/omp-hook-extension-guide/)
- [LLM wiki pattern](/blog/legacy/note/en/llm-wiki-pattern/)


## Sources and related documents

- [legacy-headroom-single-port-evolution](https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/legacy-headroom-single-port-evolution.md)
- [legacy-omp-config-and-rules-guide](https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/legacy-omp-config-and-rules-guide.md)
- [legacy-omp-headroom-persistence](https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/legacy-omp-headroom-persistence.md)
- [OMP Configuration Layers: Model Roles, Agent Overrides, and Fallback Chains](/blog/legacy/note/en/omp-config-and-rules-guide/)
- [Headroom Route Persistence Synthesis: Named Profiles, model_cache, and Recovery](/blog/legacy/note/en/omp-headroom-persistence/)
- [Headroom with cc-switch / Claude Code Coexistence: Single Synthesis and Security Boundaries](/blog/legacy/note/en/headroom-cc-switch-coexistence/)
- [OMP Headroom Bridge: External Routing Controller and Native Codex/OMP Proxy Boundaries](/blog/legacy/note/en/omp-headroom-provider-proxy/)
- [OMP Hook Extension Concept: Decision-Point Nudges, Hard Blocks, and Status Bridges](/blog/legacy/note/en/omp-hook-extension-guide/)
- [The LLM-Wiki Pattern: Maintaining a Compounding Personal Knowledge Base](/blog/legacy/note/en/llm-wiki-pattern/)
- [Headroom 0.34 Compression and Retrieval Contract: Fields, Modes, and Real-Endpoint Tests](/blog/legacy/note/en/headroom-compress-retrieve-contract/)
