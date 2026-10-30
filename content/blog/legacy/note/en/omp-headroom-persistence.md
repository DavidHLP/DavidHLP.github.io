---
{
  "archiveId": "X-1082",
  "title": "Headroom Route Persistence Synthesis: Named Profiles, model_cache, and Recovery",
  "en": "ENGINEERING NOTES",
  "category": "工程研究",
  "department": "工程笔记",
  "date": "2026-08-05",
  "lead": "DavidHLPL",
  "clearance": "DRAFT",
  "abstract": "Synthesizes Headroom route persistence when OMP rewrites runtime model caches: Named Profiles isolate intent and credentials, an external declaration can preserve route intent, model_cache remains rebuildable derived state, and the legacy reconciler is limited to isolated migration recovery. Current wrapper lifecycle and version dependencies are explicit.",
  "findings": [
    "Original document: src/content/note/en/omp-headroom-persistence.md",
    "Source revision: f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "Evidence status: provisional"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/note/en/omp-headroom-persistence.md",
  "pubDate": "2026-08-05T16:00:00.000Z",
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
    "OpenCode",
    "en",
    "note"
  ],
  "draft": true,
  "lang": "en",
  "legacy": {
    "path": "src/content/note/en/omp-headroom-persistence.md",
    "revision": "f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "metadata": {
      "title": "Headroom Route Persistence Synthesis: Named Profiles, model_cache, and Recovery",
      "timestamp": "2026-08-06 00:00:00+08:00",
      "series": "OMP & Agent Engineering",
      "kind": "synthesis",
      "status": "provisional",
      "draft": true,
      "sources": [
        "legacy-omp-headroom-persistence",
        "legacy-headroom-single-port-evolution",
        "legacy-omp-config-and-rules-guide"
      ],
      "related": [
        "headroom-single-port-evolution",
        "omp-config-and-rules-guide",
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
        "OpenCode"
      ],
      "description": "Synthesizes Headroom route persistence when OMP rewrites runtime model caches: Named Profiles isolate intent and credentials, an external declaration can preserve route intent, model_cache remains rebuildable derived state, and the legacy reconciler is limited to isolated migration recovery. Current wrapper lifecycle and version dependencies are explicit.",
      "toc": true
    }
  }
}
---


This page answers how route intent, user state, and runtime model cache can avoid contaminating one another after an OMP update, and how a damaged legacy route can be recovered safely. The model is: isolate configuration and authentication with a Named Profile, keep route intent in an external declaration when needed, treat `models.db` `model_cache` as rebuildable derived state, and keep the reconciler as migration evidence rather than a normal `headroom wrap omp` startup step.

## Core mechanism

### 1. Separate intent, user state, and derived state

```mermaid
flowchart TB
  P[Named Profile] --> C[config.yml<br/>OMP behavior and modelRoles]
  P --> O[models.yml<br/>static provider/model override]
  P --> A[agent.db<br/>credential and session state]
  P --> M[models.db<br/>runtime model_cache]
  R[External route declaration<br/>optional route intent] --> X[Legacy reconciler<br/>migration only]
  X -->|backup/match/transactional update| M
  W[headroom wrap omp] --> H[active local proxy<br/>wrapper-owned lifecycle]
```

| Artifact                    | Role                                                            | Safe conclusion                                                 | What must not be inferred                                        |
| --------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------- |
| Named Profile               | Isolates a set of OMP config, credentials, history, and cache   | Updating one profile need not contaminate another               | The profile automatically repairs routes or hides credentials    |
| `config.yml`                | User behavior, `modelRoles`, retries, tools, and related intent | It selects roles and runtime controls                           | The selected provider must use a particular base URL             |
| `models.yml`                | Static provider/model override layer                            | It can express an override intent                               | An existing authoritative cache row will certainly be taken over |
| `models.db` / `model_cache` | Runtime derived state after discovery/merge                     | It can be rebuilt and must be checked in the live runtime       | It is a safe long-term hand-editing contract                     |
| External route declaration  | Optional route intent outside the OMP directory                 | It can provide recovery input after an update                   | It can store credentials or replace the provider catalog         |
| Reconciler                  | Controlled recovery tool from the old migration                 | It can back up, match, and transactionally update existing rows | It should run before every normal startup                        |

### 2. Safe recovery chain for the legacy reconciler

Keep this historical flow only in an isolated migration environment:

1. Validate the target profile and external declaration without reading or copying tokens or API keys.
2. Back up the current `models.db`, then match existing cache rows by stable provider identity and API.
3. Fail loudly when no row matches; do not guess an INSERT for a new provider/model or rebuild the entire catalog.
4. Update only declared route fields such as `baseUrl` and dynamic headers; preserve metadata, fingerprint, version, and the `authoritative=1` meaning.
5. Commit in one transaction; roll back on failure and report `changed`, match status, and cache version.
6. Validate the final entry and upstream in a new session; an old process's in-memory config is not recovery proof.

### 3. Current recommended lifecycle

For daily use, let the official `headroom wrap omp` manage the active proxy. During the session, `headroom doctor`, `headroom perf`, and `headroom dashboard` provide observations. After the session, explicitly run `headroom unwrap omp`; use `--no-stop-proxy` only when intentionally keeping the proxy. Legacy systemd units, manual proxy commands, and the reconciler are not the recommended startup chain.

## Applicable conditions

- An OMP update rebuilds `model_cache` while the team still needs auditable route intent.
- Multiple OMP profiles must isolate credentials, session history, and runtime model catalogs.
- A migration must restore an explicit custom provider from a backup without hand-rebuilding OMP's catalog.
- You need to distinguish correct configuration, rebuilt cache, and an actually working proxy.

## Not applicable and risks

| Risk                                        | Misdiagnosis or symptom                                                              | Boundary and response                                                                     |
| ------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Treating `models.yml` as a strong override  | A new base URL is written but an authoritative cache still uses the old entry        | Check the live `model_cache` and final upstream for the release; do not promise takeover  |
| Hand-editing `models.db`                    | The process keeps old memory and the next restart rebuilds the change away           | Only do this in isolated migration evidence with a backup and transaction result          |
| Putting the reconciler in normal startup    | Every startup rewrites cache and hides catalog or version changes                    | Use the wrapper daily; limit the reconciler to legacy migration recovery                  |
| Treating `agent.db` as configuration        | Credentials or session state leak into Git, logs, or the external declaration        | Keep profile state private; keep route declarations credential-free and audit permissions |
| Inserting when no row matches               | A provider OMP never discovered is fabricated and later updates become unpredictable | Fail loudly and inspect the current catalog and release first                             |
| Checking only loopback or 200               | Route and recovery are reported as successful without upstream evidence              | Combine proxy inbound/outbound, final URL/WebSocket, and a new-session check              |
| Assuming normal exit cleans route state     | The next session inherits an unexpected loopback or stale headers                    | Explicitly run `headroom unwrap omp` unless intentionally keeping the proxy               |
| Leaving double compression or old overrides | Savings/output anomalies cannot be attributed                                        | Disable context-mode, legacy overrides, and proxy layers one at a time and remeasure      |

## Minimal verification

Minimal observation for the current lifecycle:

```text
Fresh session: headroom wrap omp
  → doctor/perf (proxy availability)
  → L1 inspect profile, models.yml, model_cache
  → L2 send a minimal request for an explicit route
  → L3 inspect proxy logs and final upstream
  → headroom unwrap omp
```

If the legacy reconciler must be tested, use a temporary database copy and non-production credentials: introduce a controlled `baseUrl`/header/authoritative mismatch, then verify backup creation, row restoration, preserved `cache_version`, transactional rollback on failure, and `changed=false` on the second run. This proves reconciler idempotence; it does not prove that the current wrapper runs it automatically.

## Evidence and uncertainty

- **Source facts**: `legacy-omp-headroom-persistence` records Named Profiles, the `config.yml`/`models.yml`/`agent.db`/`models.db` layers, external declarations, the legacy reconciler's backup/match/transaction semantics, and recovery output; `legacy-headroom-single-port-evolution` records single-port and protocol checks; `legacy-omp-config-and-rules-guide` separates role selection, entry routing, and wrapper lifecycle.
- **This page's synthesis**: decoupling route intent from `model_cache`, then separating current-wrapper verification from migration-only reconciler verification, prevents a historical script from becoming a product startup contract.
- **Unconfirmed**: the Named Profile CLI, database schema, authoritative-override rules, when the wrapper writes or clears `models.yml`, process-exit memory behavior, and provider protocol behavior depend on OMP/Headroom versions; cross-version compatibility is not claimed.

## Related pages

- [Headroom single-port synthesis](/blog/legacy/note/zh-cn/headroom-single-port-evolution/)
- [OMP configuration layers](/blog/legacy/note/zh-cn/omp-config-and-rules-guide/)
- [OMP Hook extension](/blog/legacy/note/zh-cn/omp-hook-extension-guide/)
- [LLM wiki pattern](/blog/legacy/note/en/llm-wiki-pattern/)


## Sources and related documents

- [历史 Headroom 路由恢复：Named Profile 与 model_cache Reconciler](/blog/legacy/raw/zh-cn/legacy-omp-headroom-persistence/)
- [Headroom 单端口演进：让 Zhipu、Kimi、MiniMax 与 Codex 共用 8787](/blog/legacy/raw/zh-cn/legacy-headroom-single-port-evolution/)
- [OMP 配置与规则体系全指南：全局配置、Headroom 代理与 Agent 规则系统](/blog/legacy/raw/zh-cn/legacy-omp-config-and-rules-guide/)
- [Headroom Single-Port Synthesis: Entry, Dynamic Upstreams, and Verification Boundaries](/blog/legacy/note/zh-cn/headroom-single-port-evolution/)
- [OMP Configuration Layers: Model Roles, Agent Overrides, and Fallback Chains](/blog/legacy/note/zh-cn/omp-config-and-rules-guide/)
- [OMP Hook Extension Concept: Decision-Point Nudges, Hard Blocks, and Status Bridges](/blog/legacy/note/zh-cn/omp-hook-extension-guide/)
- [The LLM-Wiki Pattern: Maintaining a Compounding Personal Knowledge Base](/blog/legacy/note/en/llm-wiki-pattern/)
