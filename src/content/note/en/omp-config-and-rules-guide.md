---
title: "OMP Configuration & Rules Master Guide: Global Config, Headroom Proxy, and Agent Rules System"
timestamp: 2026-08-01 00:00:00+08:00
series: "OMP Rules & Architecture"
tags: [OMP, Agent, Headroom, DevOps, LLM, Operations, RTK, Rules, Configuration, Architecture]
description: "A comprehensive guide to the OMP configuration and rules ecosystem for AI Agent orchestration — covering the global configuration with 10 model roles and fallback chains, the Headroom compression proxy layer for custom provider onboarding with three-level routing verification, and the Agent rules system with multi-source discovery, three injection modes, and the silent paths/globs pitfall."
toc: true
---

# OMP Configuration & Rules Master Guide: Global Config, Headroom Proxy, and Agent Rules System

OMP (Oh My Pi) is a highly customizable AI Agent orchestration framework. Running it stably in production requires mastering three dimensions simultaneously: **global configuration** determines model routing and fault tolerance, the **proxy layer** governs traffic management and cost optimization, and the **rules system** dictates what constraints the Agent follows in which scenarios.

This article is a consolidated version of three OMP专题 articles, building a complete narrative of the OMP configuration ecosystem — from global config to the proxy layer to the rules system.

---

## 1. OMP Configuration Ecosystem Overview & Design Philosophy

The OMP configuration ecosystem revolves around three core concerns:

1. **Model Routing & Fault Tolerance**: Via `~/.omp/agent/config.yml`, define 10 model roles, fallback anchor pools, and all-role fallback chains to achieve a fine-grained balance between capability and cost.
2. **Traffic Governance**: Via the Headroom compression proxy layer, uniformly integrate custom model providers into OMP, applying transparent compression, caching, and protocol normalization to all passing traffic.
3. **Constraint Injection**: Via the Rules system's multi-source discovery, unified normalization, and three injection modes, translate team conventions into code-level constraints.

The relationship between the three: global config decides "which model to use," Headroom decides "how traffic flows," and the rules system decides "how the Agent behaves." Understanding these three layers lets you master OMP's complete lifecycle from installation to operations.

---

## 2. Global Configuration: Model Roles, Fallback Chains, and Runtime Control

### 2.1 Complete Global Configuration Snapshot

Below is the complete, active configuration snapshot from `~/.omp/agent/config.yml`:

```yaml
setupVersion: 1
modelRoles: 
  plan: zhipu-coding-plan/glm-5.2:max
  advisor: zhipu-coding-plan/glm-5.2
  slow: google-antigravity/claude-sonnet-4-6:high
  task: zhipu-coding-plan/glm-4.7:high
  designer: google-antigravity/gemini-3.6-flash-high
  smol: minimax-code-cn/MiniMax-M3:low
  tiny: zhipu-coding-plan/glm-4.7:low
  commit: google-antigravity/gemini-3.1-flash-lite
  vision: google-antigravity/gemini-3.6-flash-high
  default: google-antigravity/gemini-3.6-flash:medium

_fallback_anchors: 
  strong: 
    - minimax-code-cn/MiniMax-M3:high
    - kimi-code/k3:high
    - google-antigravity/claude-sonnet-4-6:high
  light: 
    - zhipu-coding-plan/glm-4.7:low
    - minimax-code-cn/MiniMax-M2.7:low
    - google-antigravity/gemini-3.1-flash-lite

retry: 
  enabled: true
  maxRetries: 5
  baseDelayMs: 2000
  fallbackRevertPolicy: cooldown-expiry
  fallbackChains: 
    slow: 
      - kimi-code/k3:high
      - minimax-code-cn/MiniMax-M3:high
      - google-antigravity/claude-sonnet-4-6:high
    plan: 
      - minimax-code-cn/MiniMax-M3:high
      - kimi-code/k3:high
      - google-antigravity/claude-sonnet-4-6:high
    advisor: 
      - minimax-code-cn/MiniMax-M3:high
      - kimi-code/k3:high
      - google-antigravity/claude-sonnet-4-6:high
    default: 
      - kimi-code/kimi-for-coding:high
      - zhipu-coding-plan/glm-4.7:high
      - google-antigravity/gemini-3.6-flash-high
    task: 
      - zhipu-coding-plan/glm-4.7:high
      - kimi-code/kimi-for-coding:high
      - google-antigravity/gemini-3.6-flash-high
    designer: 
      - google-antigravity/gemini-3.6-flash-high
      - kimi-code/k3:high
      - minimax-code-cn/MiniMax-M3:high
    vision: 
      - kimi-code/k3:high
      - minimax-code-cn/MiniMax-M3:high
      - google-antigravity/gemini-3.6-flash-high
    smol: 
      - zhipu-coding-plan/glm-4.7:low
      - google-antigravity/gemini-3.1-flash-lite
    tiny: 
      - kimi-code/kimi-for-coding:low
      - google-antigravity/gemini-3.1-flash-lite
    commit: 
      - zhipu-coding-plan/glm-4.7:low
      - kimi-code/kimi-for-coding:low
  usageAwareFallback: true
  usageReservePolicy: auto
  usageReservePct: 10

advisor: 
  enabled: true
  subagents: true
symbolPreset: ascii
theme: 
  dark: dark-volcanic
  light: light
disabledExtensions: []
memory: 
  backend: hindsight
hindsight: 
  apiUrl: http://localhost:42888
autolearn: 
  enabled: true
  autoContinue: true
defaultThinkingLevel: auto
dev: 
  autoqaConsent: granted
prewalk: 
  enabled: true
display: 
  showTokenUsage: true
compaction: 
  idleEnabled: true
  idleThresholdTokens: 200000
task: 
  prewalk: true
  eager: preferred
goal: 
  continuationModes: 
    - interactive
branchSummary: 
  enabled: true
snapcompact: 
  systemPrompt: none
  toolResults: true
ttsr: 
  interruptMode: prose-only
checkpoint: 
  enabled: false
computer: 
  enabled: false
statusLine: 
  showHookStatus: false
```

### 2.2 Model Roles Topology & Fallback Anchors

OMP dispatches agent workloads to specialized models via `modelRoles` and establishes resilience pools using `_fallback_anchors`.

```mermaid
flowchart TD
    subgraph Topology["Model Roles Topology (10 Roles)"]
        Plan["plan / advisor<br/>(GLM-5.2)"]
        Slow["slow<br/>(Claude Sonnet 4.6)"]
        Task["task / default / designer / vision<br/>(GLM-4.7 / Gemini 3.6 Flash)"]
        Light["smol / tiny / commit<br/>(MiniMax-M3 / Gemini Flash Lite)"]
    end

    subgraph Anchors["Fallback Anchors (_fallback_anchors)"]
        StrongAnchors["strong Anchor Pool<br/>• MiniMax-M3:high<br/>• Kimi-k3:high<br/>• Claude-Sonnet-4-6:high"]
        LightAnchors["light Anchor Pool<br/>• GLM-4.7:low<br/>• MiniMax-M2.7:low<br/>• Gemini-3.1-Flash-Lite"]
    end

    Plan --> StrongAnchors
    Slow --> StrongAnchors
    Task --> StrongAnchors
    Light --> LightAnchors
```

#### 10 Model Roles Breakdown

- **Planning & Architecture (`plan` / `advisor`)**: Powered by `zhipu-coding-plan/glm-5.2` for global architecture design and advisory.
- **Deep Reasoning (`slow`)**: Uses `google-antigravity/claude-sonnet-4-6:high` for complex debugging and critical refactoring.
- **Standard Workers (`task` / `default` / `designer` / `vision`)**: Driven by `GLM-4.7:high` and `Gemini 3.6 Flash` for high-throughput coding, UI design, and multimodal processing.
- **Fast Scans (`smol` / `tiny` / `commit`)**: Managed by `MiniMax-M3:low` and `Gemini 3.1 Flash Lite` for rapid Git commits and quick file scans.

#### Decoupled Fallback Anchor Pools (`_fallback_anchors`)

The `_fallback_anchors` section abstracts underlying models into two tier pools:
- **`strong` Anchor Pool**: Includes `MiniMax-M3:high`, `Kimi-k3:high`, and `Claude-Sonnet-4-6:high`. Designed as backups for reasoning-heavy roles.
- **`light` Anchor Pool**: Includes `GLM-4.7:low`, `MiniMax-M2.7:low`, and `Gemini-3.1-Flash-Lite`. Serves as low-cost fallbacks for lightweight tasks.

### 2.3 All 9 Role Fallback Chains (`fallbackChains`) & Usage Awareness

When API rate limits (RPM/TPM) or transient outages occur, OMP activates explicit fallback routes for **all 9 core roles**:

1. **Heavy Reasoning & Planning (`slow`, `plan`, `advisor`)**: Fallback route `Kimi-k3:high` → `MiniMax-M3:high` → `Claude-Sonnet-4-6:high`.
2. **Standard Workers & UI Vision (`default`, `task`, `designer`, `vision`)**: Priority fallback to `Kimi-for-coding` / `GLM-4.7:high` / `Gemini 3.6 Flash High`.
3. **Lightweight Quick Scans (`smol`, `tiny`, `commit`)**: Fallback from lightweight models to `GLM-4.7:low` / `Gemini 3.1 Flash Lite` / `Kimi-for-coding:low`.

#### Auto Revert & Quota Reserve Policies

- **`fallbackRevertPolicy: cooldown-expiry`**: Automatically reverts to the primary model once its cooldown period expires.
- **`usageAwareFallback: true` & `usageReservePct: 10`**: Proactively triggers fallback switches when approaching rate limits, reserving a 10% buffer.

### 2.4 Fine-Grained Execution Control Flags

#### Thinking & Exploration Switches

- **`defaultThinkingLevel: auto`**: Dynamically adjusts Chain-of-Thought (CoT) depth based on task complexity.
- **`task.prewalk: true` & `prewalk.enabled: true`**: Mandates pre-exploration of dependency graphs before code modifications.
- **`task.eager: preferred`**: Prioritizes parallel dispatching when modular sub-tasks are identified.

#### Interaction & Interrupt Modes

- **`goal.continuationModes: [interactive]`**: Uses interactive continuation mode to prevent Agent detachment.
- **`ttsr.interruptMode: prose-only`**: Restricts Turn-To-Speak interrupts to natural prose only.
- **`branchSummary.enabled: true`**: Automatically generates structured Git branch change summaries.
- **`snapcompact.toolResults: true`**: Cleans raw tool outputs during 200k Token idle context compaction.

#### Developer & Experimental Options

- **`dev.autoqaConsent: granted`**: Grants consent for automated QA testing in development environments.
- **`checkpoint.enabled: false` & `computer.enabled: false`**: Explicitly disables experimental Checkpoint snapshotting and Computer Use desktop interaction.

### 2.5 Long-Term Memory & Hard Guardrails

1. **Hindsight Long-term Memory (`backend: hindsight`)**: Connects to the local Hindsight daemon (`http://localhost:42888`) to persist architectural insights, lessons learned, and user preferences across sessions.
2. **Autolearn (`autolearn.enabled: true`)**: Automatically extracts reusable lessons/skills into `~/.omp/agent/managed-skills/`.
3. **Pre-Tool-Call Guardrail (GitHub Write Gate)**: Via `~/.omp/agent/hooks/pre/github-write-gate.ts`, physically blocks `git push`, `gh pr`, and other write operations unless explicitly confirmed by the user or `OMPGATE_OFF=1` is set.

---

## 3. Headroom Compression Proxy: Single-Port Dynamic Routing

Global config decides "which model to use"; Headroom solves "how traffic flows."

The normal OMP lifecycle now follows the [official Headroom README](https://github.com/headroomlabs-ai/headroom/blob/main/README.md), not a persistent systemd service:

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

`headroom wrap omp` launches OMP and manages the local proxy required by that session. Normally, do not create or maintain the legacy `~/.config/systemd/user/headroom-proxy.service`, enable per-provider systemd units, or start `headroom proxy --port 8787` manually. Those are obsolete/manual paths, not the recommended OMP lifecycle.

> **Evolution note (2026-08-01):** The earlier version of this article assigned multiple Headroom ports by provider. That topology and its persistent service units are legacy and not recommended. The official wrap-only path automatically covers only OMP's built-in `anthropic` provider and keeps its configured Anthropic upstream. The current `openai-codex` and `opencode-go` roles remain direct; Zhipu, Kimi, MiniMax, and Codex loopback routes are historical/conditional custom-provider evidence.

### 3.1 Why a Compression Proxy Layer?

OMP routes requests to different provider/model pairs based on roles. Ideally, every provider would offer prompt caching, context compression, and tool-result caching. In practice, not every upstream supports these natively. Headroom fills the gap as a local reverse proxy that transparently compresses, caches, and normalizes the protocol for traffic that passes through it.

**Proxy coverage principle: only providers that need governance go through the proxy; everything else stays direct.** Under the current wrap-only path, the built-in `anthropic` provider uses its configured Anthropic upstream and the current `openai-codex`/`opencode-go` roles remain direct. Zhipu, Kimi, MiniMax, and Codex enter a 127.0.0.1:8787 proxy only when an explicit custom provider configuration and routing headers/environment are present; those routes are migration evidence, not the default.

#### The Value Picture: RTK Is the Workhorse

Runtime measurement by "how many tokens it saved":
- **RTK CLI filtering** contributes roughly **86.7% of savings** (stripping tool-output noise);
- **Prefix-cache stability** holds a **~100% hit rate** under `--mode cache`;
- **Active compression** contributes **under 1%** (only non-Read bodies).

Headroom is best described as a "cache stabilizer + protocol normalizer"; the real savings come from RTK's tool-output noise reduction.

### 3.2 Overall Architecture: One Entry Point and Request-Level Upstreams

The proxy reads request data such as `x-headroom-base-url` and `x-headroom-original-path` only when an explicitly configured custom route uses them. The built-in `anthropic` provider keeps its configured Anthropic upstream; `headroom wrap omp` does not set `ANTHROPIC_TARGET_API_URL`, and an unmarked Anthropic request is not implicitly sent to Kimi.

```mermaid
flowchart LR
  A["OMP roles"] --> AN["Built-in anthropic<br/>wrap automatic<br/>Anthropic upstream"]
  A --> D["Current openai-codex / opencode-go<br/>direct models.db entries"]
  A --> H["Conditional custom entry<br/>127.0.0.1:8787<br/>historical migration"]
  H --> Z["Zhipu<br/>explicit custom config"]
  H --> K["Kimi<br/>explicit header/env/config"]
  H --> M["MiniMax<br/>historical models.yml override"]
  H --> C["Codex<br/>explicit Responses WebSocket"]
  Z --> ZU["open.bigmodel.cn"]
  K --> KU["api.kimi.com/coding"]
  M --> MU["api.minimaxi.com/v1"]
  C --> CU["chatgpt.com/backend-api/codex"]
```

The provider routes are three categories, not four automatic cases:

| Provider | Client-side routing | Headroom upstream |
| --- | --- | --- |
| Built-in `anthropic` | Automatic wrapper-managed route; no implicit Kimi target | The configured Anthropic upstream |
| `openai-codex` / `opencode-go` | Current direct `models.db` entries; no automatic loopback rewrite | Their configured direct upstream |
| Zhipu | Historical/conditional custom route; explicit `x-headroom-*` configuration required | `https://open.bigmodel.cn/api/coding/paas/v4/chat/completions` |
| Kimi | Historical/conditional custom route; explicit header, environment variable, or provider config required | `https://api.kimi.com/coding/v1/messages` |
| MiniMax | Historical `models.yml` override/custom route; not required by wrap | `https://api.minimaxi.com/v1/chat/completions` |
| Codex | Historical/conditional custom route; explicit Responses WebSocket configuration required | `wss://chatgpt.com/backend-api/codex/responses` |

If a non-OMP Anthropic client must preserve real Anthropic routing, use its configured direct endpoint or attach `x-headroom-base-url=https://api.anthropic.com` explicitly in a custom route. Do not replace the wrapper with a persistent manually started service. A Kimi target is an explicit custom-routing choice, not a safety net.

The key to understanding this architecture is knowing what each artifact owns — and what it does not:

| Layer | Artifact (file/object) | Owns | Does NOT own |
| --- | --- | --- | --- |
| **1. Role → model binding** | `config.yml` (`modelRoles`, `task.agentModelOverrides`, `retry.fallbackChains`) | Which provider/model each OMP role uses; the fallback graph | Network routing |
| **2. Model → entry binding** | Current `models.db`/`model_cache` state | The configured direct entry or an explicitly configured custom entry | Automatic retargeting of non-Anthropic rows or retaining a loopback route after the session stops |
| **3. Request-level routing** | `x-headroom-base-url`, `x-headroom-original-path`, and historical `models.yml` overrides | Maps an explicitly configured custom entry to the real upstream and preserves the original path | Role assignment and credential generation |
| **4. Wrap-managed proxy lifecycle** | `headroom wrap omp` | Starts and manages the local proxy for the current session | Which OMP role selected the request |

Two further orthogonal concerns:
- **Credential store** (`agent.db` table `auth_credentials`): Headroom only forwards auth headers from OMP; it never injects credentials itself.
- **CLI configuration** (`~/.kimi-code/config.toml`, etc.): Provides provider, OAuth, and header semantics to standalone CLIs; OMP does not necessarily read every CLI configuration.

### 3.3 Single-Port Onboarding Flow

The single-port setup is not about creating another unit for every provider. It is about closing the loop between model routing, request headers, and the proxy started by `headroom wrap omp`:

```mermaid
flowchart TD
  Q1{"Is this the built-in anthropic provider or an explicit custom route?"}
  Q1 -- No --> T1["Keep the configured direct upstream<br/>no automatic loopback rewrite"]
  Q1 -- Yes --> Q2{"Does the request carry<br/>dynamic upstream headers?"}
  Q2 -- No --> D1["Use the configured Anthropic upstream<br/>no implicit Kimi default"]
  Q2 -- Yes --> P1["Check x-headroom-base-url<br/>and x-headroom-original-path"]
  D1 --> P2["Keep wrap as the lifecycle owner<br/>do not split provider ports"]
  P1 --> P2
  P2 --> P3["Run the wrap-managed session<br/>and confirm the local listener"]
  P3 --> P4["Run selectors only for explicit<br/>custom-provider routes"]
  P4 --> P5["Read the real upstream URL in proxy.log<br/>then record routing evidence"]
```

#### Official wrap startup

Use this block for a normal OMP session:

```bash
uv tool install --python 3.13 "headroom-ai[all]"
headroom wrap omp
```

Verify it from another terminal while the wrapped session is active:

```bash
headroom doctor
headroom perf
headroom dashboard
```

The wrapper manages the session-local proxy. Do not replace it with a persistent service or a manually started direct proxy.

#### MiniMax Built-In Provider Override (Historical Migration Evidence)

An earlier migration used `models.yml` to override the built-in provider. The following block is historical evidence only: current `headroom wrap omp` does not require it. Process exit does not restore `models.yml`; after the wrapped session, explicitly run `headroom unwrap omp` (default: stop the local proxy) or use `--no-stop-proxy` only when intentionally keeping the proxy alive. Do not add this override as a daily startup step:

```yaml
# Historical migration evidence only; not required by the current wrap lifecycle.
providers:
  minimax-code-cn:
    baseUrl: http://127.0.0.1:8787/v1
    headers:
      x-headroom-base-url: https://api.minimaxi.com/v1
      x-headroom-original-path: /chat/completions
```

This historical override uses `x-headroom-base-url` for the real upstream and `x-headroom-original-path` to preserve `/chat/completions`. It is not a current startup requirement.

#### Kimi Default-Target Boundary

Kimi CLI Anthropic requests can select Kimi explicitly with `x-headroom-base-url=https://api.kimi.com/coding`. The following environment variable belongs to the legacy custom-routing setup only:

```text
# Legacy explicit override; headroom wrap omp does not set this.
ANTHROPIC_TARGET_API_URL=https://api.kimi.com/coding
```

Plain `headroom wrap omp` keeps the configured Anthropic upstream. An unmarked request is sent to Kimi only when this variable or an equivalent custom header/provider route is explicitly configured. If ordinary Claude traffic should use 8787, it needs a separate entry point, an explicit header, or conditional routing based on client identity.

#### Codex's Special Route

Codex subscription uses the Responses WebSocket in the historical/custom route:

```text
/v1/responses
→ wss://chatgpt.com/backend-api/codex/responses
```

The current `openai-codex` role remains direct unless explicitly configured otherwise. For a custom route, do not set `OPENAI_TARGET_API_URL`; logs must show the Responses WebSocket and `response.completed`, not merely a successful ordinary `/v1/chat/completions` request.

#### Legacy services and manual cache edits: migration-only, not recommended

The old provider units, drop-ins, persistent `headroom-proxy.service`, and direct `headroom proxy --port 8787` command are obsolete. They are retained only as migration history; do not create, enable, restart, or maintain them for a normal OMP session. `headroom wrap omp` is the only recommended lifecycle entry point.

`models.db` and `models.yml` are runtime/override artifacts, not a daily startup contract. Do not hand-edit `models.db`, run a reconciler, or leave OMP pointed at a loopback URL after stopping the wrapped session. Start a fresh session with `headroom wrap omp` instead.

#### `models.db` and the Process Cache

The process cache is derived state. If a historical migration requires checking `authoritative=1` or a provider override, record it as migration evidence; do not turn database edits or a persistent service into normal operations. The wrapper establishes the session-local proxy and client wiring.


### 3.4 Three-Level Routing Verification

Verifying that traffic actually traverses the proxy must not stop at a health endpoint or HTTP 200. Build three levels of evidence while a wrapped session is active:

| Level | Verification means | What it proves | What it does not prove |
| --- | --- | --- | --- |
| **L1 Config** | Inspect the built-in `anthropic` automatic route, current direct `models.db` entries, and any explicit custom entries | Which routes are automatic, direct, or conditional | That a historical loopback route is active |
| **L2 Protocol** | Send the smallest request through the active wrapped session only for the configured route | Proxy reachability, protocol handling, and credential passthrough | That every provider is routed through loopback |
| **L3 Orchestrator-native** | Run selectors only for explicit custom routes and inspect final upstream URLs/`PERF` in `proxy.log`; verify direct roles against their direct upstream | The selected route reached the intended upstream | — |


**L3 verification command (conditional custom-provider evidence only; run from another terminal while an already-running wrapped session is active):**

This native `omp --no-session ...` smoke test is not a standalone `omp` startup entry. Start the session with `headroom wrap omp` first, and run the loop only when every selector has explicit custom provider configuration. The current `openai-codex` and `opencode-go` roles are direct by default.

```bash
# Historical/conditional custom-provider smoke; not the default wrap topology.
for selector in \
  zhipu-coding-plan/glm-4.7 \
  kimi-code/k3 \
  minimax-code-cn/MiniMax-M3 \
  openai-codex/gpt-5.6-luna; do
  env -u ALL_PROXY -u all_proxy -u HTTP_PROXY -u HTTPS_PROXY \
    omp --no-session --no-tools --no-skills --no-rules --no-extensions \
      --mode=json --model "$selector" -p 'Reply with exactly PONG'
done
```

Then inspect `~/.headroom/logs/proxy.log`:

| Provider | Decisive upstream evidence | Expected result |
| --- | --- | --- |
| Zhipu | `path=https://open.bigmodel.cn/api/coding/paas/v4/chat/completions` | `status=200` |
| Kimi | `path=https://api.kimi.com/coding/v1/messages` | `status=200` |
| MiniMax | `path=https://api.minimaxi.com/v1/chat/completions` | `status=200` |
| Codex | `wss://chatgpt.com/backend-api/codex/responses` | `response.completed` |

### 3.5 RTK and Headroom: Independent but Composed

RTK and Headroom are two independent components: RTK filters CLI/tool output noise near the Agent end; Headroom maintains prefix caching and context compression at the network layer. Single-port routing changes Headroom's network entry point, not this responsibility boundary.

```mermaid
flowchart LR
  subgraph Edge["Orchestrator side (near the agent)"]
    T["tool call<br/>shell / read / grep ..."]
    R["RTK<br/>strips tool-output noise"]
  end
  subgraph Proxy["Headroom proxy layer (127.0.0.1:8787)"]
    H["cache freeze<br/>CCR deferred injection<br/>content-router compression"]
  end
  subgraph Up["Request-selected upstream"]
    U["Zhipu / Kimi / MiniMax / Codex"]
  end
  T --> R
  R -->|"filtered content"| H
  H --> U
```

#### Interception Distinction

- **Inline HTTP redirection** (e.g., `curl` intercepted): Handled by the orchestrator's `context-mode` plugin.
- **Large command output redirection** (e.g., log truncation): Handled by RTK.

### 3.6 Daily Operations and Probes

#### Wrap lifecycle

The wrapper owns the local proxy lifecycle for the current OMP session. Do not use service-control commands or leave a stopped session configured to send traffic to loopback.

```bash
# Normal startup
uv tool install --python 3.13 "headroom-ai[all]"
headroom wrap omp
```

While the wrapped session is active, run these checks from another terminal:

```bash
headroom doctor
headroom perf
headroom dashboard
```
When finished, explicitly run `headroom unwrap omp`; the default removes wrapper-managed route state and stops the local proxy. Use `headroom unwrap omp --no-stop-proxy` only when intentionally keeping the proxy alive; otherwise loopback state may remain.

```bash
headroom unwrap omp
```

#### Probe Notes

- `/livez` and the dashboard reflect the active proxy session;
- generic Claude, Codex, shell-env, or budget warnings from `headroom doctor` do not replace real selector and upstream URL evidence;
- the final authority is `~/.headroom/logs/proxy.log` or the final upstream URL/WebSocket, not a loopback HTTP 200 alone.
---

## 4. Rules System: Multi-Source Discovery, Three Injection Modes, and the paths/globs Pitfall

Global config decides "which model to use," Headroom decides "how traffic flows," and the rules system decides "how the Agent behaves."

### 4.1 Background: Rules as Configuration

An Agent orchestration framework needs a "context-aware constraint layer." The same Agent must respect one set of rules when editing Java backends and another when writing frontend code. Rules are the vehicle for these context-bound constraints.

A rule system must resolve three things:

- **Where rules come from**: Multiple harnesses (omp, Claude Code, Cursor, pi, etc.) each have their own rule directories — how to unify them;
- **How rules are normalized**: Different frontmatter fields — how to standardize into one structure;
- **When rules are injected**: Path-matched, edit-stream, or every-turn injection.

OMP's approach: each source has a discovery module, all discovered rules flow into a single `buildRuleFromMarkdown()`, forced into one canonical shape, then routed to one of three injection modes based on frontmatter.

### 4.2 Global Architecture: Multi-Source Discovery to Unified Injection

```mermaid
flowchart LR
  subgraph Sources["Rule Sources (Discovery Modules)"]
    B[".omp/rules/*.md<br/>.omp/rules/*.mdc<br/>(builtin.ts)"]
    R[".omp/RULES.md<br/>Sticky, always-apply<br/>(builtin.ts)"]
    C[".claude/rules/*.md<br/>(claude.ts + builtin.ts)"]
    CU[".cursor/rules/*.mdc<br/>(cursor.ts)"]
    A[".agent/rules/*.md<br/>(agents.ts)"]
    AG["AGENTS.md<br/>(agents-md.ts)"]
    O["opencode / codex /<br/>gemini / cline etc.<br/>(respective modules)"]
  end
  subgraph Build["buildRuleFromMarkdown()<br/>src/discovery/helpers.ts"]
    P["parseFrontmatter<br/>→ Canonical RuleFrontmatter"]
  end
  subgraph Reg["Capability Registry"]
    R1["Rule[]<br/>name, content, globs,<br/>alwaysApply, condition,<br/>astCondition, scope"]
  end
  subgraph Inject["Runtime"]
    CTX["Path-scoped<br/>globs match → inject"]
    TTSR["Stream-scoped<br/>condition + scope → TTSR interrupt"]
    STICKY["Sticky<br/>alwaysApply → re-inject every turn"]
  end
  B --> Build
  R --> Build
  C --> Build
  CU --> Build
  A --> Build
  AG --> Build
  O --> Build
  Build --> Reg
  Reg --> CTX
  Reg --> TTSR
  Reg --> STICKY
```

#### Three Rule Injection Modes

Every loaded rule is routed to exactly one of three runtime modes based on its frontmatter:

| Mode | Trigger Condition | Runtime Behavior |
| --- | --- | --- |
| **Path-scoped** | `globs: [...]` matches the file being edited/read | Rule body injected into context only when the candidate path matches |
| **Stream-scoped (TTSR)** | `condition:` / `astCondition:` + `scope:` (e.g., `tool:edit(*.ts)`) | Triggers as a **stream interrupt** when patterns match edit/write/read content |
| **Sticky (always-apply)** | `alwaysApply: true`, or top-level `RULES.md` file | Re-injected near the current turn every round — never lost in long conversations |

A rule lacking all three keys degrades to an **agent-requested** rule: indexed by `description:` for on-demand retrieval, never auto-injected.

### 4.3 Discovery Chain: Which Paths Are Scanned

#### Native OMP Paths (builtin.ts `loadRules`)

| Path (traversed upward from cwd) | Scope | Behavior |
| --- | --- | --- |
| `.omp/rules/*.md` and `*.mdc` | Project | Standard rule files — frontmatter determines injection mode |
| `~/.omp/agent/rules/*.md` and `*.mdc` | User | Same — applies to all projects on this machine |
| `.omp/RULES.md` (nearest, upward to repo root) | Project | **Sticky always-apply** — ignores frontmatter, forced on |
| `~/.omp/agent/RULES.md` | User | **Sticky always-apply** — global baseline |

Upward traversal stops at `os.homedir()`. The first `.omp/` directory found takes effect; if none, OMP falls back to the git root.

#### Cross-Harness Paths

| Module | Scanned paths | Format notes |
| --- | --- | --- |
| `agents-md.ts` | `AGENTS.md` (nearest, upward) + nested subtrees | Domain guidance, not path-scoped rules |
| `claude.ts` | `~/.claude/` + `<cwd>/.claude/` | Scans `rules/`, `commands/`, `tools/`, `skills/` etc. |
| `cursor.ts` | `.cursor/rules/*.mdc` + legacy `.cursorrules` | MDC frontmatter: `description`, `globs`, `alwaysApply` |
| `agents.ts` | `.agent/rules/`, `.agents/rules/` (upward + user home) | Generic agent ecosystem directory convention |
| `codex.ts`, `gemini.ts`, `opencode.ts`, `cline.ts` etc. | Each harness's own directory | Each registers, all normalize to the same canonical rule shape |

#### Which Paths Are **NOT** Scanned

| Path | Reason |
| --- | --- |
| `.pi/rules/` | pi-specific convention. OMP has no `pi.ts` discovery module — **this is why symlink bridging exists** |
| `rules:` key in `mcp.json` | No-op. `mcp-schema.json` declares `additionalProperties: false` at top level — unknown keys are silently dropped |
| `rules:` block in `config.yml` | This config key doesn't exist. OMP has `memory.*`, `advisor.*`, `modelRoles.*`, `retry.*` — but no `rules.*` |

### 4.4 Canonical Frontmatter: RuleFrontmatter

Verified against `src/capability/rule.ts` (`RuleFrontmatter`) and `src/discovery/helpers.ts` (`buildRuleFromMarkdown`).

```yaml
---
# Canonical OMP frontmatter (any subset, all optional)
description: "One-liner for on-demand retrieval. Required when no globs/condition."
globs:
  - "backend-spring/src/**/*.java"
  - "docker/sandbox/harness/java/src/**/*.java"
alwaysApply: false        # true → sticky, re-inject every turn
condition:                # Regex triggering TTSR interrupt
  - "^import\\s+java\\.util\\.Date$"
astCondition:             # ast-grep pattern; edit/write streams only
  - "new $T($$$ARGS)"
scope:                    # TTSR stream-scoped token
  - "tool:edit(*.java)"
  - "tool:write(*.java)"
interruptMode: prose-only # never | prose-only | tool-only | always
---

# Rule body — Markdown

- Specific, actionable constraints using MUST / SHOULD / NEVER.
- Reading order: parent file describes WHEN to enter; child file describes HOW.
```

#### Authoritative Frontmatter Key Reference

| Key | Does OMP read it? | Notes |
| --- | --- | --- |
| `description` | ✅ | Used for on-demand retrieval when no scope match |
| `globs` | ✅ | **OMP's only recognized path-scoped key** |
| `alwaysApply` | ✅ | `true` → sticky always-apply |
| `condition` / `ttsr_trigger` / `ttsrTrigger` | ✅ | Three aliases accepted |
| `astCondition` | ✅ | ast-grep pattern; edit/write streams only |
| `scope` | ✅ | Stream token, e.g., `text`, `thinking`, `tool:edit(*.ts)` |
| `interruptMode` | ✅ | Per-rule override of `ttsr.interruptMode` |
| **`paths`** | ❌ **Not read** | See pitfall below — pi-rules / Claude Code format |
| **`kind`** | ❌ Ignored | pi-rules marker (`kind: rules`), OMP doesn't distinguish by this key |
| **`summary`** | ❌ Ignored | pi-rules summary, falls into `[key: string]: unknown` |
| **`triggers`** | ❌ Ignored | pi-rules trigger, same as above |

### 4.5 The paths vs. globs Interop Pitfall (Source-Verified)

**This is the most common silent failure mode when migrating rule sets from pi-rules or Claude Code to OMP.**

#### Mechanism

`buildRuleFromMarkdown()` only reads `frontmatter.globs`:

```ts
let globs: string[] | undefined;
if (Array.isArray(frontmatter.globs)) {
  globs = frontmatter.globs.filter((item): item is string => typeof item === "string");
} else if (typeof frontmatter.globs === "string") {
  globs = [frontmatter.globs];
}
```

No discovery module post-processes frontmatter to translate `paths:` into `globs:`.

#### Symptom

A rule written with `paths:` gets loaded by OMP, but `globs` resolves to `undefined`. The rule degrades to **agent-requested** mode — **it will never auto-inject on path match**. And there is **no warning, no log, no error**. The rule simply won't trigger when you edit `*.java` files.

#### Two Fixes (pick one per repo)

**(a) Use OMP canonical format** — replace `paths:` with `globs:`:

```yaml
---
globs:
  - "backend-spring/src/**/*.java"
description: "Java 17 backend source rules."
---
```

**(b) Dual-key frontmatter** — keep both keys, each harness reads what it recognizes:

```yaml
---
kind: rules                 # pi-rules marker (OMP ignores, pi requires)
paths:                      # pi-rules / Claude Code path scope
  - "backend-spring/src/**/*.java"
globs:                      # OMP canonical path scope
  - "backend-spring/src/**/*.java"
summary: Java backend rules. # pi-rules summary (OMP ignores)
description: "Java backend rules. # OMP retrieval key (pi ignores)"
---
```

> **Shared directories (`.claude/rules/`, `.pi/rules/`) recommend approach (b)**. The 4-key redundancy is mechanical and survives any harness switch.

### 4.6 Rule Onboarding Decision Tree & Bridging

```mermaid
flowchart TD
  Q1{"Is the rule project-specific<br/>or machine-global?"}
  Q1 -- "Machine-global" --> U1["~/.omp/agent/rules/&lt;name&gt;.md<br/>or ~/.omp/agent/RULES.md (sticky)"]
  Q1 -- "Project" --> Q2{"Which harnesses will load it?"}
  Q2 -- "OMP only" --> O1[".omp/rules/&lt;name&gt;.md<br/>Use canonical OMP frontmatter"]
  Q2 -- "OMP + pi + Claude" --> D1["Dual-key frontmatter<br/>(approach b above)<br/>Place in .claude/rules/<br/>+ symlink .omp/rules → ../.claude/rules"]
  Q2 -- "pi only" --> P1[".pi/rules/&lt;name&gt;.md<br/>pi-rules format (paths required)"]
  Q2 --> Q3{"When should the rule trigger?"}
  Q3 -- "When editing matching paths" --> G1["Set globs: (dual-key also sets paths:)"]
  Q3 -- "When patterns appear in edit/write streams" --> T1["Set condition / astCondition + scope"]
  Q3 -- "Every turn" --> A1["alwaysApply: true<br/>or rename to RULES.md at scope root"]
  Q3 -- "On-demand only" --> D2["Set description: only"]
  G1 --> V1["omp ttsr scan -v &lt;path&gt;"]
  T1 --> V1
  A1 --> V1
  D2 --> V1
```

#### pi-rules → OMP Bridging (once per repo)

If the repo's canonical rule tree is `.pi/rules/`, bridge with a **directory symlink**:

```bash
# At repo root
mkdir -p .omp
ln -s ../.pi/rules .omp/rules
```

> **Note**: Bridging only makes files "visible" to OMP's scanner — it does **not** translate `paths:` to `globs:`. Must be combined with the dual-key fix above.

### 4.7 Three Laws of Rule Writing

1. **Breadth before depth.** Parent files describe *when* to enter child files — not *how* to do things there.
2. **No repetition.** If a fact is in a child file, the parent shouldn't restate it. Repetition drifts; drift erodes trust.
3. **Description as decision.** Each `description` must answer: *When should the Agent enter here?* Not just "what's here," but *when it's relevant*.

#### Specific Wording Rules

- Use `MUST` / `SHOULD` / `NEVER` (RFC 2119).
- One constraint per bullet.
- Use canonical path/pattern names.
- Negative constraints (`NEVER`, `MUST NOT`) must include a **reason**.

---

## 5. End-to-End Verification Checklist

Consolidating verification content from all three articles into a unified verification manual.

### Global Configuration Verification

- [ ] `config.yml` parses correctly with a YAML parser
- [ ] Every role in `modelRoles` has a corresponding model definition
- [ ] `fallbackChains` contains no references to disabled or unavailable models
- [ ] `usageReservePct` is set reasonably (recommended: 10%)

### Headroom Proxy Verification

- [ ] Read the [official Headroom README](https://github.com/headroomlabs-ai/headroom/blob/main/README.md) and install the CLI with `uv tool install --python 3.13 "headroom-ai[all]"`
- [ ] Start OMP only with `headroom wrap omp`; the wrapper manages the local proxy for the active session
- [ ] While the wrapped session is active, `headroom doctor`, `headroom perf`, and `headroom dashboard` complete
- [ ] L1/L2/L3 evidence distinguishes the automatic built-in `anthropic` route, current direct roles, and any explicitly configured custom route
- [ ] Do not treat a loopback HTTP 200, a stopped session, a hand-edited `models.db`, or a reconciler result as proof of current routing


### Rules System Verification

- [ ] `cd <repo> && omp ttsr list` shows the expected number of rules (TTSR rules only)
- [ ] `omp ttsr scan -v <candidate path>` shows path-scoped rules are attached
- [ ] `omp ttsr test --rule <rule file> --source tool --path <path> <snippet>` triggers for positive snippets, silent for negative ones
- [ ] Shared directories: grep confirms dual-key frontmatter — when `paths:` exists, `grep -L "globs:" <repo>/.omp/rules/*.md` should return empty
- [ ] Symlink bridging: `readlink .omp/rules` resolves; `find -L .omp/rules -type f | wc -l` matches source
- [ ] Top-level `RULES.md` (if present) parses as Markdown; one sticky rule per scope
- [ ] No `rules:` key in `mcp.json` (silently dropped, don't rely on it)

---

## 6. Known Traps & Lessons Learned

Consolidating pitfall records from all three articles into a unified experience manual.

### Global Configuration Traps

| Trap | Symptom | Mitigation |
| --- | --- | --- |
| **`fallbackChains` retains disabled models** | Primary model works, but fallback hits a disabled model | After changing primary roles, grep-check model references in `fallbackChains` |
| **`config.yml` changes not immediately effective** | Current session behavior unchanged | OMP loads config per session; next session auto-applies, no restart needed |

### Headroom Proxy Traps

| Trap | Symptom | Mitigation |
| --- | --- | --- |
| **WSL2 mirrored-net port haunting** | A manually chosen port appears free but raw bind throws `EADDRINUSE` | Start the session with `headroom wrap omp`; inspect wrapper/proxy logs and `ss` only as supporting evidence |
| **Headroom request-level path routing error** | `/paas/v4`, `/coding/v1`, or `/chat/completions` is duplicated and returns 404 | Preserve `x-headroom-base-url` and `x-headroom-original-path` only in an explicit custom route; do not set `OPENAI_TARGET_API_URL` for Codex |
| **Legacy `RestartSec` crash-loop** | An obsolete systemd unit enters a restart loop | Do not tune or revive the legacy unit; use `headroom wrap omp` |
| **Manual `authoritative=0` rollback** | A hand-edited `baseUrl` reverts or is ignored | Treat `models.db` as derived state; do not patch it for daily startup, and start a fresh wrapped session |
| **OMP caches derived state in memory** | A manual DB change does not affect the current process | Do not rely on DB edits; launch a new `headroom wrap omp` session and verify the actual upstream |
| **Legacy Kimi default target** | An unmarked Anthropic request is silently sent to Kimi only after an old env/header override is configured | Plain wrap keeps the Anthropic upstream; remove the legacy override or use an explicit Kimi header/provider route |
| **Retired provider units remain** | Old processes still route traffic or write old logs | Treat units as legacy migration debris; do not enable `headroom-proxy.service`, and use `headroom wrap omp` for normal startup |
| **Subagent model override silently ignored** | Subagent uses the parent's model instead of the configured one | Verification must reach L3 (`proxy.log` + final upstream URL) during a wrapped session |
| **context-mode + Headroom double compression** | Model output is too terse and loses context | Disable one layer at a time to isolate: end the wrapped session or disable the `context-mode` plugin |

### Rules System Traps

| Trap | Symptom | Mitigation |
| --- | --- | --- |
| **`paths:` vs `globs:` mismatch** | Rule loaded but never triggers on path match; no error logs | Use `globs:` (OMP) or dual-key frontmatter (shared directories) |
| **`rules:` key in `mcp.json`** | Silently dropped; rule never appears | `mcp-schema.json` forbids unknown top-level keys. Use rule files instead |
| **`.pi/rules/` not loaded by OMP** | pi-specific convention; OMP has no `pi.ts` discovery module | Symlink bridge: `.omp/rules → ../.pi/rules` |
| **Top-level `RULES.md` ignored in deep subtrees** | Sticky rules don't apply in nested subtrees | Place `RULES.md` at repo root, not subdirectories |
| **`alwaysApply: true` fills context** | Every rule re-injected every turn, context bloats | Reserve `alwaysApply` for true global constraints. 95% of cases prefer `globs:` or TTSR |
| **Symlinked `.omp/rules/` goes stale** | New files in source tree don't appear | Use directory symlinks (not per-file). Verify with `omp ttsr list` after additions |
| **`AGENTS.md` and `rules/*.md` duplicate** | Same constraint on both sides inevitably drifts | `AGENTS.md` writes *boundaries & process*; `rules/*.md` writes *path-scoped constraints* |
| **Mixed multi-harness frontmatter in one file** | Readers can't tell which harness recognizes which key | Add comment labels per key, or split into separate files by harness |

---

By "clarifying global config layers, enforcing three-level routing verification, unifying rule normalization, and maintaining tool composition," you can build an efficient, stable, and auditable OMP Agent governance architecture in production.
