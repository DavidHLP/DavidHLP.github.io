---
title: "Keeping Headroom Routes after OMP Updates: Named Profiles and a model_cache Reconciler"
timestamp: 2026-08-06 00:00:00+08:00
series: "OMP Rules & Configuration"
tags: [OMP, Agent, Headroom, DevOps, LLM, Operations, Routing, Proxy, Codex, OpenCode]
description: "A field report on preserving Headroom routes when OMP updates rewrite runtime model caches, using a named profile, an external route declaration, and an idempotent SQLite reconciler verified with real Codex WebSocket and OpenCode HTTP requests."
toc: true
---

# Keeping Headroom Routes after OMP Updates: Named Profiles and a model_cache Reconciler

The important change was not another proxy URL edit. It was separating configuration into three layers: **user declarations, derived runtime state, and external infrastructure**. OMP can then rebuild its own cache during an update, Headroom can keep one loopback entry point, and route recovery no longer depends on a one-off manual SQLite edit.

The final structure is:

```text
OMP named profile
    │
    ├─ config.yml / models.yml        user configuration and overrides
    ├─ agent.db                       profile-local auth and session state
    └─ models.db                      rebuildable runtime model_cache
                  ▲
                  │ omp-headroom-reconcile
                  │
$HOME/.config/omp/headroom-routes.json external route declaration
                  │
                  ▼
127.0.0.1:8787                        Headroom loopback proxy
```

## 1. Correcting an easy-to-miss assumption

`models.yml`, `models.db`, and `config.yml` are different kinds of configuration:

- `config.yml` stores OMP user behavior such as `modelRoles`, retries, and tools;
- `models.yml` is a static provider/model override layer;
- `models.db` stores the discovered and merged runtime `model_cache`, where provider rows may be marked authoritative.

With the OMP version used for this migration, existing authoritative `model_cache` rows were not reliably taken over by a `models.yml` provider override. Writing a new `baseUrl` into `models.yml` therefore did not mean that the currently selected provider would certainly use it.

The durable design is consequently not “edit `models.yml`” or “manually patch `models.db`”:

1. isolate OMP configuration, credentials, and sessions with a named profile;
2. store Headroom routing intent in JSON outside the OMP installation tree;
3. treat `models.db` as derived state;
4. reconcile the runtime route from the declaration after an OMP update.

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

Select it explicitly:

```bash
OMP_PROFILE=headroom omp
```

Or use the fixed entry point:

```bash
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

## 4. Reconcile only declared runtime rows

The reconciler is:

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

## 5. Make recovery part of the update wrapper

This command:

```bash
omp update
```

updates OMP but does not by itself guarantee that the external Headroom declaration has been restored into `models.db`. The fixed entry point is:

```bash
omp-headroom update
```

Its flow is:

```text
OMP_PROFILE=headroom omp update
→ validate the profile agent directory
→ run omp-headroom-reconcile
→ print the final provider/cache state
```

The regular wrapper can remain thin:

```bash
#!/usr/bin/env bash
set -euo pipefail

export OMP_PROFILE=headroom
exec "$HOME/.local/bin/omp" "$@"
```

The update wrapper handles the special `update` action; other arguments are forwarded unchanged to OMP in the fixed profile. Do not copy tokens, API keys, or a complete provider catalog into the wrapper.

## 6. Keep the Headroom systemd service outside OMP

The user service lives at:

```text
~/.config/systemd/user/headroom-proxy.service
```

It listens only on:

```text
127.0.0.1:8787
```

The service file should not live inside the OMP installation tree and should not contain provider credentials. The separation of responsibilities is:

- OMP selects the provider and protocol;
- `models.db` stores a rebuildable runtime result;
- the external declaration stores durable route intent;
- Headroom handles protocol forwarding, compression, and caching;
- systemd owns the Headroom process lifecycle.

An OMP update therefore cannot overwrite the systemd unit, and restarting Headroom cannot alter OMP's credential database.

## 7. Validation evidence

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

### 7.3 Real Codex WebSocket request

A minimal request through the fixed profile returned:

```text
PERSISTED-OK
```

Headroom also logged:

```text
route=chatgpt_subscription
connecting to wss://chatgpt.com/backend-api/codex/responses
last_upstream_type=response.completed
```

The request therefore reached the loopback proxy and the Codex subscription WebSocket upstream.

### 7.4 Real OpenCode Go HTTP request

A minimal request through the same profile returned:

```text
PERSISTED-OK
```

The final upstream was confirmed as:

```text
path=https://opencode.ai/zen/go/v1/chat/completions
status=200
```

### 7.5 Do not confuse proxy traversal with compression savings

A short request may pass through Headroom but contain too little compressible content to produce savings. Check these layers separately:

1. OMP's loopback `baseUrl`;
2. Headroom inbound/outbound logs;
3. the final upstream URL or WebSocket;
4. compression statistics in `/stats`.

A loopback URL or HTTP 200 alone does not prove the upstream route is correct. Zero savings alone does not prove that the request bypassed Headroom.

## 8. Security, backups, and rollback boundaries

- keep `agent.db`, OAuth tokens, API keys, and session files in the local profile;
- set the external route declaration to mode `600`;
- do not put usable credentials in the systemd unit;
- create a backup before a reconciler write;
- use a transaction so a failure cannot leave half-applied headers;
- stop and report when a required row is missing instead of guessing values;
- roll back by restoring the reconciler backup and the previous declaration, not by deleting the whole `models.db`;
- an already-running OMP process may retain old in-memory settings, so new sessions should consistently use `omp-headroom`.

## 9. The maintenance workflow

```bash
# 1. Edit the external route declaration
$EDITOR ~/.config/omp/headroom-routes.json

# 2. Check without writing
omp-headroom-reconcile --agent-dir "$HOME/.omp/profiles/headroom/agent" --check

# 3. Update OMP and restore routes automatically
omp-headroom update

# 4. Check the runtime cache again
omp-headroom-reconcile --agent-dir "$HOME/.omp/profiles/headroom/agent" --check

# 5. Send a minimal request through the fixed profile
omp-headroom -p --no-session --no-tools --no-extensions --no-rules \
  --model openai-codex/gpt-5.6-luna \
  'Reply with exactly PERSISTED-OK.'

# 6. Check Headroom logs and the final upstream at the same time
```

The core rule is simple: **keep route intent where OMP updates cannot overwrite it, and treat `models.db` as derived state that can be validated, backed up, and rebuilt.**