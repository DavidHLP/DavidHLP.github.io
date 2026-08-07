---
title: "OMP Hook Extension Concept: Decision-Point Nudges, Hard Blocks, and Status Bridges"
timestamp: 2026-07-25 00:00:00+08:00
series: "OMP & Agent Engineering"
kind: concept
status: active
sources: ["legacy-omp-hook-extension-guide"]
related: ["headroom-single-port-evolution", "omp-config-and-rules-guide", "omp-headroom-persistence", "llm-wiki-pattern"]
tags: [Agent,OMP,Codebase,Hooks,DevOps,TUI,Plugin,Extension]
description: "Treats an OMP Hook as an event extension at a tool decision point: sendMessage supplies a soft nudge without blocking, a hard result can reject a call, and setStatus bridges state into the UI. Includes API boundaries, mock and live-session checks, and the explicit warning that a suggestion is not a security boundary."
toc: true
---

This page answers where a Hook belongs, what it should change, and how to prove that it works. The key position is the decision point immediately before a tool call: `sendMessage` is appropriate for a low-risk nudge, while `{ block, reason }` is the blocking channel; `ctx.ui.setStatus` only publishes state to a visible UI and cannot turn a suggestion into security enforcement.

## Core mechanism

### 1. Decision point and two output channels

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

| Channel | Minimal contract | Observable effect it can prove | Effect it must not assume |
| --- | --- | --- | --- |
| Soft nudge | `pi.sendMessage({ customType, content, display, attribution })`, then return `void` | The message enters Agent context and the current tool continues | That the Agent will follow it or that any safety action is blocked |
| Hard block | `return { block: true, reason }` (fields follow the current types) | The current tool call is rejected and the caller receives a reason | That misclassification is impossible or that it replaces server authorization |
| UI status | `ctx.ui.setStatus(key, text)` | State enters the Hook status collection and may be rendered | That it appears in the top border or that long text is never truncated |

### 2. Extension lifecycle and the status bridge

- Hook files are commonly loaded when a session starts. Validate changes in a new session; do not assume hot reload.
- Use `session_start` for probes, project-root discovery, or state initialization. Keep `tool_call` classification fast and failure-tolerant so the tool path is not blocked by diagnostics.
- `setStatus` is an “event → status map → renderer” bridge. A separate Hook-status row and a top statusline segment may have different gates; absence in one location does not prove that the API failed.
- If the top segment is controlled by a closed ID union or preset allowlist, configuration cannot invent a new Hook segment. That is host UI capability, not a Hook-side API.
- Separate visibility from enforcement: the statusline is for observation, a block result controls one call, and an independent permission or write gate remains the real security boundary.

### 3. Prefer stable detection signals

Check stable fields such as `toolName`, path scope in the input, and the project root before relying on fragile natural-language patterns. A Hook should fail soft: catch and record or silently degrade on errors rather than breaking the normal tool flow. Deduplication or throttling reduces noise; it must not silently change hard-block semantics.

## Applicable conditions

- An Agent repeatedly chooses a weaker default tool at a specific decision point and needs an immediate alternative.
- You need to project gate, compression, indexing, or runtime state into the UI for observation rather than fabricate a business result.
- You need to register event logic for a project or session without changing the host program.
- You need to prove logic with synthetic events first, then prove loading and delivery in a fresh session.

## Not applicable and risks

| Boundary | Failure symptom | Correct response |
| --- | --- | --- |
| A soft nudge is not security control | The Agent ignores `sendMessage` and a dangerous call still runs | Use a tested hard gate or server-side authorization for irreversible actions; never treat a nudge as a guarantee |
| Hook APIs are version-sensitive | Types compile but event fields or load locations changed | Check the current type declarations and observe a real event in a fresh session |
| A mock is not runtime proof | The synthetic handler passes but the extension is not loaded or rendered | Follow the mock with a real `tool_call` and TUI check |
| Status row and top segment are separate | `setStatus` has data but not in the expected location | Check status gates, segment union/preset, and renderer path separately |
| UI length and refresh budgets apply | Text is truncated, the border overflows, or state is stale | Keep the segment short, retain a full-text row as evidence, and test at a real terminal size |
| Detection is expensive or throws | Tool calls slow down or are unexpectedly affected | Use fast path/field checks, throttling, and fail-soft `try/catch` |

## Minimal verification

```text
Type/contract check
  → register handlers on mock pi; fire positive, negative, and error events
  → fresh session: trigger a real tool_call; see the nudge and normal result
  → fresh session: exercise a hard-block sample; observe block/reason
  → tmux or real terminal: observe setStatus and the intended statusline path
```

The mock probe should assert at least: non-target tools stay silent, a target tool is nudged once or according to throttling, errors do not escape, and the hard branch returns a rejection. Runtime evidence must include both message/status delivery and the actual tool or UI result; inspecting an exported function is insufficient.

## Evidence and uncertainty

- **Source facts**: `legacy-omp-hook-extension-guide` records `session_start`/`tool_call`, `HookAPI.sendMessage`, `ToolCallEventResult`, `ctx.ui.setStatus`, session-start loading, mock-pi and tmux layered verification, and host restrictions on statusline segments.
- **This page's synthesis**: separating “decision intervention” from “visibility bridging,” and explicitly reducing a soft nudge to advice, prevents observability from being reported as security enforcement.
- **Unconfirmed**: event types, default `display`/`triggerTurn`, status gates, segment names, and hot-reload behavior must be checked against the installed OMP release; this page does not promise a permanent UI location.

## Related pages

- [Headroom single-port evolution](/en/note/headroom-single-port-evolution)
- [OMP configuration layers](/en/note/omp-config-and-rules-guide)
- [Headroom route persistence](/en/note/omp-headroom-persistence)
- [LLM wiki pattern](/en/note/llm-wiki-pattern)
