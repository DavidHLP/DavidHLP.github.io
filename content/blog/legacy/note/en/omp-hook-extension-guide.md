---
{
  "archiveId": "X-1054",
  "title": "OMP Hook Extension Concept: Decision-Point Nudges, Hard Blocks, and Status Bridges",
  "en": "ENGINEERING NOTES",
  "category": "AI 工具",
  "department": "工程笔记",
  "date": "2026-07-24",
  "lead": "DavidHLPL",
  "clearance": "PUBLIC",
  "abstract": "Treats an OMP Hook as an event extension at a tool decision point: sendMessage supplies a soft nudge without blocking, a hard result can reject a call, and setStatus bridges state into the UI. Includes API boundaries, mock and live-session checks, and the explicit warning that a suggestion is not a security boundary.",
  "findings": [
    "Original document: src/content/note/en/omp-hook-extension-guide.md",
    "Source revision: f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "Evidence status: active"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/note/en/omp-hook-extension-guide.md",
  "pubDate": "2026-07-24T16:00:00.000Z",
  "tags": [
    "Agent",
    "OMP",
    "Codebase",
    "Hooks",
    "DevOps",
    "TUI",
    "Plugin",
    "Extension",
    "en",
    "note"
  ],
  "draft": false,
  "lang": "en",
  "legacy": {
    "path": "src/content/note/en/omp-hook-extension-guide.md",
    "revision": "f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "metadata": {
      "title": "OMP Hook Extension Concept: Decision-Point Nudges, Hard Blocks, and Status Bridges",
      "timestamp": "2026-07-25 00:00:00+08:00",
      "series": "OMP & Agent Engineering",
      "kind": "concept",
      "status": "active",
      "draft": true,
      "sources": [
        "legacy-omp-hook-extension-guide"
      ],
      "related": [
        "headroom-single-port-evolution",
        "omp-config-and-rules-guide",
        "omp-headroom-persistence",
        "llm-wiki-pattern"
      ],
      "tags": [
        "Agent",
        "OMP",
        "Codebase",
        "Hooks",
        "DevOps",
        "TUI",
        "Plugin",
        "Extension"
      ],
      "description": "Treats an OMP Hook as an event extension at a tool decision point: sendMessage supplies a soft nudge without blocking, a hard result can reject a call, and setStatus bridges state into the UI. Includes API boundaries, mock and live-session checks, and the explicit warning that a suggestion is not a security boundary.",
      "toc": true
    }
  },
  "kind": "concept",
  "status": "active",
  "sources": [
    "legacy-omp-hook-extension-guide",
    "omp-17-2-15-runtime-contract",
    "omp-17-2-15-runtime-contract-correction"
  ],
  "related": [
    "headroom-single-port-evolution",
    "omp-config-and-rules-guide",
    "omp-headroom-persistence",
    "llm-wiki-pattern",
    "headroom-compress-retrieve-contract"
  ]
}
---

This page answers where a Hook belongs, what it should change, and how to prove that it works. The key position is the decision point immediately before a tool call: `sendMessage` is appropriate for a low-risk nudge, while `{ block, reason }` is the blocking channel; `ctx.ui.setStatus` only publishes state to a visible UI and cannot turn a suggestion into security enforcement.

## Core mechanism

### 1. Complete event list, decision points, and output channels

```mermaid
flowchart LR
  A[tool_call event] --> B[Read toolName/input]
  B --> C{Nudge or reject?}
  C -- nudge --> D[pi.sendMessage<br/>custom message]
  D --> E[return void<br/>call continues]
  C -- explicit rejection --> F[return {block, reason}]
  F --> G[Call rejected; caller retries]
  H[Lifecycle/tool event] --> I[ctx.ui.setStatus]
  I --> J[Hook status map] --> K[Status row/optional segment]
```

At the pinned OMP `17.2.15` release, `HookAPI.on()` explicitly lists:

- **Session and tree**: `session_start`, `session_before_switch`, `session_switch`, `session_before_branch`, `session_branch`, `session_before_compact`, `session.compacting`, `session_compact`, `session_shutdown`, `session_before_tree`, `session_tree`.
- **Context and Agent turns**: `context`, `before_agent_start`, `agent_start`, `agent_end`, `turn_start`, `turn_end`.
- **Automatic recovery and reminders**: `auto_compaction_start`, `auto_compaction_end`, `auto_retry_start`, `auto_retry_end`, `ttsr_triggered`, `todo_reminder`.
- **Tool boundaries**: `tool_call`, `tool_result`. `tool_call` carries `toolName`, `toolCallId`, and `input`; handlers may return a blocking result.

This is the type-level event set for v17.2.15, not a guarantee that every event fires in every version, loading method, or session.

| Channel | Minimal contract | Established effect | Not guaranteed |
|---|---|---|---|
| LLM soft nudge | `pi.sendMessage({ customType, content, display, attribution })`, then return `void` | Creates a `CustomMessageEntry` in LLM context; current tool continues | Agent compliance or blocking of unsafe actions |
| Hook state/session record | `pi.appendEntry(...)` | Records Hook state that official documentation says should not be sent to the LLM | Automatic UI visibility or replacement for blocking/authorization |
| Hard block | `return { block: true, reason }` (check current types) | Rejects the current call; caller must handle it | No misclassification, or replacement of server-side authorization/write gates |
| UI state | `ctx.ui.setStatus(key, text)` | Adds renderable Hook state; `undefined` clears it | Top-row placement or no text truncation |

### 2. Extension lifecycle and status bridge

- The loader discovers Hooks through the capability API and explicit configured paths. The v17.2.15 loader evidence does not show automatic scanning of `hooks/pre` or `hooks/post`; do not present it as a default convention.
- `session_start` can initialize probes, cache project roots, or set state. Keep `tool_call` classification fast and failure-tolerant.
- `setStatus` bridges event → status map → renderer. The v17.2.15 `statusLine` segment ID is a closed union of 24 members without `hook`. Configuration cannot invent a segment. Public PR #2001 is closed and unmerged, not mainline functionality.
- Visibility and enforcement differ: status is observation, a block result controls one invocation, and independent authorization/write gates remain the security boundary.

### 3. HookCommandContext's deadlock-safety boundary

Extension command context exposes `newSession`, `branch`, and `navigateTree`, but deliberately omits `switchSession`, `reload`, `compact`, and `getContextUsage`. Calling those actions inside handlers such as `tool_call` or `context` can deadlock. Their absence is a safety boundary, not an API gap. Move such requests outside event handlers and validate in a fresh session.

### 4. Stable detection signals

Prefer `toolName`, input path scope, and project root to fragile natural-language patterns. Fail soft: catch and record errors or degrade quietly without breaking normal tools. Deduplication/throttling reduces noise without changing hard-block semantics.

## Applicable conditions

- An Agent repeatedly chooses a weaker default tool at a specific decision point and needs an immediate alternative.
- You need to project gate, compression, indexing, or runtime state into the UI for observation rather than fabricate a business result.
- You need to register event handlers for project or global sessions without changing the host program.
- You need to prove logic with synthetic events first, then prove loading and delivery in a fresh session.

## Not applicable and risks

| Boundary                                | Failure symptom                                                          | Correct response                                                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| A soft nudge is not security control    | The Agent ignores `sendMessage` and a dangerous call still runs          | Use a tested hard gate or server-side authorization for irreversible actions; never treat a nudge as a guarantee |
| Hook APIs are version-sensitive         | Types compile but event fields or load locations changed                 | Check the current type declarations and observe a real event in a fresh session                                  |
| A mock is not runtime proof             | The synthetic handler passes but the extension is not loaded or rendered | Follow the mock with a real `tool_call` and TUI check                                                            |
| Status row and top segment are separate | `setStatus` has data but not in the expected location                    | Check status gates, segment union/preset, and renderer path separately                                           |
| UI length and refresh budgets apply     | Text is truncated, the border overflows, or state is stale               | Keep the segment short, retain a full-text row as evidence, and test at a real terminal size                     |
| Detection is expensive or throws        | Tool calls slow down or are unexpectedly affected                        | Use fast path/field checks, throttling, and fail-soft `try/catch`                                                |

## Minimal verification

```text
Type/contract check
  → register handlers on mock pi; fire positive, negative, and error events
  → fresh session: trigger a real tool_call; see the nudge and normal result
  → fresh session: exercise a hard-block sample; observe block/reason
  → tmux or real terminal: observe setStatus and the intended statusline path
```

The mock probe should assert at least: non-target tools stay silent, a target tool is nudged once or according to throttling, errors do not escape, and the hard branch returns a rejection. Runtime evidence must include both message/status delivery and the actual tool or UI result; inspecting source exports or function return values alone is insufficient.

## Evidence and uncertainty

- **Source facts**: `legacy-omp-hook-extension-guide` records early events, `HookAPI.sendMessage`, `ToolCallEventResult`, `ctx.ui.setStatus`, mock-pi, and tmux checks. `omp-17-2-15-runtime-contract` preserves the initial pinned tag; `omp-17-2-15-runtime-contract-correction` adds ExtensionRunner, complete event groups, sendMessage/appendEntry separation, deadlock-safe omissions in HookCommandContext, and the closed statusline union without `hook`.
- **Synthesis**: separating events, LLM messages/state records, decision intervention, and visibility prevents observability from being misreported as enforced safety.
- **Version and uncertainty**: official facts above apply only to the OMP `17.2.15` tag. Event delivery, default `display`/`triggerTurn`, status gates, load paths, and hot reload still need installed-version and fresh-session checks. Automatic `hooks/pre`/`post` scanning is not established.

## Related pages

- [Headroom single-port evolution](/blog/legacy/note/en/headroom-single-port-evolution/)
- [OMP configuration layers](/blog/legacy/note/en/omp-config-and-rules-guide/)
- [Headroom route persistence](/blog/legacy/note/en/omp-headroom-persistence/)
- [LLM wiki pattern](/blog/legacy/note/en/llm-wiki-pattern/)


## Sources and related documents

- [legacy-omp-hook-extension-guide](https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/legacy-omp-hook-extension-guide.md)
- [omp-17-2-15-runtime-contract](https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/omp-17-2-15-runtime-contract.md)
- [omp-17-2-15-runtime-contract-correction](https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/omp-17-2-15-runtime-contract-correction.md)
- [Headroom Single-Port Synthesis: Entry, Dynamic Upstreams, and Verification Boundaries](/blog/legacy/note/en/headroom-single-port-evolution/)
- [OMP Configuration Layers: Model Roles, Agent Overrides, and Fallback Chains](/blog/legacy/note/en/omp-config-and-rules-guide/)
- [Headroom Route Persistence Synthesis: Named Profiles, model_cache, and Recovery](/blog/legacy/note/en/omp-headroom-persistence/)
- [The LLM-Wiki Pattern: Maintaining a Compounding Personal Knowledge Base](/blog/legacy/note/en/llm-wiki-pattern/)
- [Headroom 0.34 Compression and Retrieval Contract: Fields, Modes, and Real-Endpoint Tests](/blog/legacy/note/en/headroom-compress-retrieve-contract/)
