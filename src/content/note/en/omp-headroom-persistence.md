---
title: "Historical Headroom Route Persistence: Named Profiles and a model_cache Reconciler"
timestamp: 2026-08-06 00:00:00+08:00
series: "OMP Rules & Configuration"
tags: [OMP, Agent, Headroom, DevOps, LLM, Operations, Routing, Proxy, Codex, OpenCode]
description: "A historical migration and recovery report on Headroom routes when OMP updates rewrite runtime model caches, using named profiles, an external route declaration, and an idempotent SQLite reconciler as migration evidence only; current daily startup uses the official headroom wrap omp path."
toc: true
---

# Historical Headroom Route Persistence: Named Profiles and a model_cache Reconciler

The recommended startup path is now the official wrapper, not a persistent service. Follow the [official Headroom README](https://github.com/headroomlabs-ai/headroom/blob/main/README.md):

```bash
# Install the official CLI once (Python 3.13+)
uv tool install --python 3.13 "headroom-ai[all]"

# The only recommended OMP startup entry point
headroom wrap omp

# In another terminal while the wrapped session is running
headroom doctor
headroom perf
headroom dashboard
```

`headroom wrap omp` launches OMP and manages the local proxy required by the current session. Normally, do not create or maintain the legacy `~/.config/systemd/user/headroom-proxy.service`, enable per-provider systemd units, start `headroom proxy --port 8787` manually, or run a reconciler as part of startup. Those are obsolete/manual paths, not the recommended OMP lifecycle. Because wrap persists route state in `models.yml`, process exit does not restore it; after the session explicitly run `headroom unwrap omp` (default: remove wrapper-managed route state and stop the local proxy), using `--no-stop-proxy` only when intentionally keeping the proxy alive.

The persistence model below is useful as historical background for route intent and derived state:

```text
OMP named profile
    │
    ├─ config.yml / models.yml        user configuration and overrides
    ├─ agent.db                       profile-local auth and session state
    └─ models.db                      rebuildable runtime model_cache
                  ▲
                  │ legacy migration-only reconciler
                  │
$HOME/.config/omp/headroom-routes.json external route declaration
                  │
                  ▼
Headroom local proxy                 lifecycle managed by headroom wrap omp
```

The wrapped session owns the active proxy lifecycle, but it does not auto-clean route state on process exit. The declaration and `models.db` are routing/configuration artifacts, not instructions to hand-edit SQLite or keep a user service alive during every session; explicitly run `headroom unwrap omp` when finished.

## 1. Correcting an easy-to-miss assumption

`models.yml`, `models.db`, and `config.yml` are different kinds of configuration:

- `config.yml` stores OMP user behavior such as `modelRoles`, retries, and tools;
- `models.yml` is a static provider/model override layer;
- `models.db` stores the discovered and merged runtime `model_cache`, where provider rows may be marked authoritative.

With the OMP version used for this migration, existing authoritative `model_cache` rows were not reliably taken over by a `models.yml` provider override. Writing a new `baseUrl` into `models.yml` therefore did not mean that the currently selected provider would certainly use it.

The safe layering is consequently:

1. isolate OMP configuration, credentials, and sessions with a named profile;
2. optionally store Headroom routing intent in JSON outside the OMP installation tree;
3. treat `models.db` as derived state;
4. regard the reconciler as a legacy, migration-only recovery tool, never as the normal `headroom wrap omp` startup path.

## 2. Isolating state with a named profile

The profile has its own agent directory:

```text
~/.omp/profiles/headroom/agent/
├── config.yml
├── models.yml
├── agent.db
├── models.db
├── history.db
├── mcp.json
├── agents/
├── hooks/
├── skills/
└── managed-skills/
```

The following command is a legacy profile-isolation diagnostic from the migration, not a current startup entry. Current sessions must begin with `headroom wrap omp`:

```bash
# Legacy migration/profile diagnostic only; not normal startup.
OMP_PROFILE=headroom omp
```

The fixed `omp-headroom` entry below is likewise historical and must not replace `headroom wrap omp`:

```bash
# Legacy migration/profile diagnostic only; not normal startup.
omp-headroom
```

This keeps updates, credential changes, and session history for the default profile separate from the Headroom profile. `agent.db` may contain OAuth/API credentials and must never be committed, copied into an article, or printed in logs.

## 3. Keeping route intent outside OMP

The declaration lives outside the OMP installation directory:

```text
~/.config/omp/headroom-routes.json
```

It describes providers, protocols, the loopback address, and Headroom routing headers. It contains no credentials. The verified shape is:

```json
{
  "schemaVersion": 1,
  "providers": [
    {
      "providerId": "openai-codex",
      "matchApis": ["openai-codex-responses"],
      "baseUrl": "http://127.0.0.1:8787/v1",
      "setHeaders": {},
      "removeHeaders": [
        "x-headroom-base-url",
        "x-headroom-original-path"
      ],
      "minimumMatches": 1
    },
    {
      "providerId": "opencode-go:models-v1:23ukgspsm4tal",
      "matchApis": ["openai-completions"],
      "baseUrl": "http://127.0.0.1:8787/v1",
      "setHeaders": {
        "x-headroom-base-url": "https://opencode.ai/zen/go/v1",
        "x-headroom-original-path": "/chat/completions"
      },
      "removeHeaders": [],
      "minimumMatches": 1
    },
    {
      "providerId": "opencode-go:models-v1:23ukgspsm4tal",
      "matchApis": ["openai-responses"],
      "baseUrl": "http://127.0.0.1:8787/v1",
      "setHeaders": {
        "x-headroom-base-url": "https://opencode.ai/zen/go/v1",
        "x-headroom-original-path": "/responses"
      },
      "removeHeaders": [],
      "minimumMatches": 1
    },
    {
      "providerId": "opencode-go:models-v1:23ukgspsm4tal",
      "matchApis": ["anthropic-messages"],
      "baseUrl": "http://127.0.0.1:8787",
      "setHeaders": {
        "x-headroom-base-url": "https://opencode.ai/zen/go"
      },
      "removeHeaders": ["x-headroom-original-path"],
      "minimumMatches": 1
    }
  ]
}
```

This is the declaration layer, not an OMP catalog. It answers which local entry point a provider/protocol should use and which upstream information must be carried in the request.

## 4. Legacy reconciler: migration-only, not recommended

The reconciler below is retained as historical evidence for an older persistence design. It is not part of normal startup, and `headroom wrap omp` must be used instead for current OMP sessions:

```text
~/.local/bin/omp-headroom-reconcile
```


Its order of operations is:

```text
BEGIN IMMEDIATE
→ read the external route declaration
→ back up the current models.db
→ match model_cache by provider_id + api
→ fail loudly if a required row is missing
→ update only declared baseUrl/header fields
→ preserve catalog metadata, fingerprint, and version
→ set authoritative=1
→ COMMIT
```

The boundaries matter:

- do not delete models;
- do not rebuild the whole `model_cache`;
- do not INSERT provider/model rows that OMP did not generate;
- do not overwrite the current cache version;
- do not turn the route declaration into a second static catalog;
- repeated runs should produce `changed=false`.

The validation confirmed that the reconciler preserved the existing cache version and kept matching rows at `authoritative=1`, rather than forcing an unverified set of fixed database values.

## 5. Legacy update wrapper: migration-only, not recommended

The commands in this section describe the old update-time recovery workflow. Do not use `omp-headroom update` or run the reconciler as the normal way to start OMP. For current sessions, use the official wrapper:

```bash
uv tool install --python 3.13 "headroom-ai[all]"
headroom wrap omp
```

While the wrapped session is active, verify it from another terminal:

```bash
headroom doctor
headroom perf
headroom dashboard
```

The historical command was:

```bash
omp update
```

It did not guarantee that an external declaration had been restored into `models.db`; the old fixed entry point was:

```bash
omp-headroom update
```

Its old flow was:

```text
OMP_PROFILE=headroom omp update
→ validate the profile agent directory
→ run omp-headroom-reconcile
→ print the final provider/cache state
```

This wrapper is retained only to explain the migration. Do not copy tokens, API keys, or a complete provider catalog into it.


## 6. Legacy systemd service: not part of the recommended lifecycle

The old user service at `~/.config/systemd/user/headroom-proxy.service` and its per-provider variants are obsolete. They are not required by `headroom wrap omp`, and normally must not be created, enabled, restarted, or maintained.

For the recommended lifecycle, `headroom wrap omp` manages the local proxy for the current session. OMP still selects the provider and protocol, the route declaration remains optional configuration intent, and `models.db` remains derived runtime state; no persistent systemd process is needed for daily startup.

## 7. Validation evidence (historical reconciliation evidence)


### 7.1 Profile and cache

After checking the profile configuration and credential database, the reconciler check reported:

```text
declared API routes matched
authoritative=1
changed=false
```

### 7.2 Simulated OMP update rewrite

A temporary database was changed to direct upstream URLs, Headroom headers were removed, and `authoritative` was set to `0`. Running the reconciler produced:

```text
reconcile_rc=0
backup_created=true
declared routes restored
authoritative=1
cache_version=preserved
```

This proves that recovery is an update-time operation, not a one-off patch against the current database.

### 7.3 Historical Codex WebSocket request (explicit custom route)

The following evidence belongs to the older migration setup, not to plain `headroom wrap omp`. It was collected through a fixed profile with an explicitly configured Codex custom provider route:

```text
PERSISTED-OK
```

Headroom also logged:

```text
route=chatgpt_subscription
connecting to wss://chatgpt.com/backend-api/codex/responses
last_upstream_type=response.completed
```

This historical request reached the loopback proxy and the Codex subscription WebSocket upstream. The current `openai-codex` role is direct by default; repeat this check only when an explicit custom provider configuration routes it through Headroom.

### 7.4 Historical OpenCode Go HTTP request (explicit custom route)

This older migration evidence used the same profile with an explicitly configured OpenCode Go custom provider route:

```text
PERSISTED-OK
```

The final upstream was confirmed as:

```text
path=https://opencode.ai/zen/go/v1/chat/completions
status=200
```

The current `opencode-go` role is direct by default. A plain `headroom wrap omp` session does not make it a Headroom route; verify it through `proxy.log` only after adding an explicit custom provider configuration.

### 7.5 Do not confuse proxy traversal with compression savings

A short request may pass through Headroom but contain too little compressible content to produce savings. Check these layers separately:

1. OMP's loopback `baseUrl`;
2. Headroom inbound/outbound logs;
3. the final upstream URL or WebSocket;
4. compression statistics in `/stats`.

A loopback URL or HTTP 200 alone does not prove the upstream route is correct. Zero savings alone does not prove that the request bypassed Headroom.
## 8. Security, backups, and rollback boundaries (legacy migration context)

- keep `agent.db`, OAuth tokens, API keys, and session files in the local profile;
- set the external route declaration to mode `600`;
- do not put usable credentials in the systemd unit;
- create a backup before a reconciler write;
- use a transaction so a failure cannot leave half-applied headers;
- stop and report when a required row is missing instead of guessing values;
- roll back by restoring the reconciler backup and the previous declaration, not by deleting the whole `models.db`;
- an already-running OMP process may retain old in-memory settings, so new sessions should consistently use `headroom wrap omp`.
Use the wrapper as the sole normal startup path:

```bash
uv tool install --python 3.13 "headroom-ai[all]"
headroom wrap omp
```

While the wrapped session is active, run the checks from another terminal:

```bash
headroom doctor
headroom perf
headroom dashboard
```

For route verification, exercise a real OMP selector only when it uses the built-in `anthropic` route managed by the active wrapper or an explicitly configured custom-provider route. The plain wrap path does not automatically proxy `openai-codex`, `opencode-go`, Zhipu, Kimi, MiniMax, or Codex routes; the first two are direct by default and the latter routes are historical/conditional. Inspect `~/.headroom/logs/proxy.log` or the final upstream URL/WebSocket for an active Anthropic or explicit custom route, and verify direct roles against their direct upstream separately. A loopback URL or HTTP 200 alone does not prove the request reached the intended provider. When finished, explicitly run `headroom unwrap omp`; the default stops the local proxy, while `--no-stop-proxy` is only for intentionally keeping it alive.


The core rule is simple: **keep route intent where OMP updates cannot overwrite it, treat `models.db` as derived state, and let `headroom wrap omp` own the local proxy lifecycle.**
