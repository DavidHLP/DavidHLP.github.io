---
title: "Bringing Hook Statuses to the OMP Top Bar: A Full Journey from Misdiagnosis to Upstream Patch"
timestamp: 2026-07-25 00:00:00+08:00
series: "OMP Plugin & Extension Development"
tags: [OMP, Agent, Hooks, TUI, DevOps, Plugin, Extension]
description: "A record of turning a simple requirement—displaying GitHub write gate (GH-gate) status on OMP statusline—into a upstream patch. Documents TUI verification using headless tmux, identifying schema dead-ends, rejecting session_name workarounds, and handling border budget overflow with text truncation."
toc: true
---

# Bringing Hook Statuses to the OMP Top Bar: A Full Journey from Misdiagnosis to Upstream Patch

OMP (`Oh My Pi`) extension hooks can publish status text via `ctx.ui.setStatus(key, text)`. My `github-write-gate` hook (a hard gate intercepting write operations like `git push` and `gh pr create`) publishes `GH-gate armed · blocks git push / gh pr / API writes` during `session_start`. The requirement was simple: **display this status directly on the top statusline border**.

What seemed like a minor UI tweak ultimately uncovered a misdiagnosis, a schema dead-end, a rejected workaround, and an upstream patch across multiple core files.

---

## 1. The Misdiagnosis: Status Was Already Rendering

The initial assumption was that `setStatus` failed to work. However, source tracing (`runner.ts` → `extension-ui-controller.ts` → `component.ts`'s `#hookStatuses` map) proved the data flow was intact. The actual rendering target was a **standalone line above the editor**, gated by `statusLine.showHookStatus` (default `true`)—rather than the top statusline border (`[M]/[D]/[A]`) expected by the user.

### Verification Methodology: Headless tmux In Lieu of Manual Screenshots
TUI rendering verification traditionally relies on human screenshots. We replaced this with a fully scriptable headless tmux pipeline:

```bash
tmux new-session -d -s probe -x 220 -y 50 'omp' && sleep 25 \
  && tmux capture-pane -t probe -p | grep -n 'GH-gate'
tmux kill-session -t probe
```

- `-d` detached with fixed 220×50 dimensions ensures reproducible layout rendering.
- `capture-pane -p` outputs plain text frames; `grep -n` pinpoints the exact line number to distinguish top border versus standalone line rendering.

---

## 2. The Dead-End: Top Border Segment Union is Closed

While `statusLine.leftSegments/rightSegments` appear configurable in settings, schema-level `StatusLineSegmentId` is a **closed union of 24 items** (`pi|model|mode|path|git|pr|...|collab`) with no slot for `hook`.

**Conclusion: Pure configuration options cannot inject hook status into the top border.**

---

## 3. Rejected Workaround: Hijacking `session_name`

Investigation revealed `setSessionName()` exists in the extension API, and the default preset's `rightSegments` includes `session_name`. Writing status text to session name indeed rendered it on the far right of the top border.

However, this workaround was rejected for three reasons:
1. **Polluting the Session Resume Picker**: Session selection menus would display gate status strings as session names.
2. **Race Conditions with Auto-Naming**: Writing at `session_start` overrides user provenance, blocking subsequent automatic session naming.
3. **Redundancy**: The standalone line already displayed the status text.

---

## 4. The Proper Fix: Upstream `hook` Segment Patch

Opening the closed union required an upstream patch adding a native `hook` segment:

| File | Change |
| --- | --- |
| `settings-schema.ts` | Added `"hook"` to the `StatusLineSegmentId` union |
| `types.ts` | Injected `hookStatuses: ReadonlyMap<string, string>` into `SegmentContext` |
| `component.ts` | Unconditionally injected active `#hookStatuses` into segment context |
| `segments.ts` | Added `hookSegment`: sorted keys, dot-delimited, muted styling, default 32-char truncation |
| `presets.ts` | Added `"hook"` to the default preset's `rightSegments` |

### Boundary Discovery: Border Budget Truncation
When switching to long path directories (containing branch names and PR IDs), the new segment disappeared because the border builder truncates rightmost segments when space is constrained. Setting `segmentOptions.hook.maxLength` (default 32) truncated the 53-character gate status to `GH-gate armed · blocks git push…`, rendering stably under full layout load.

---

## 5. Rollback Pitfalls

When installing a patched CLI binary via local wrappers, disabling `showHookStatus: false` creates a pitfall: reverting the binary without resetting `showHookStatus: true` leaves stock OMP with zero visible hook status.

Correct rollback requires two steps:
```bash
mv -f ~/.local/bin/omp.stock ~/.local/bin/omp
omp config set statusLine.showHookStatus true
```
