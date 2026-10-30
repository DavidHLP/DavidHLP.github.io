---
title: "OMP 17.2.15 运行时契约：官方固定点、Hook 事件、Compaction 配置与 Headroom 缺口"
capturedAt: 2026-08-13 00:00:00+00:00
sourceType: upstream-source-fixed-tag
sourceUrl: "https://github.com/can1357/oh-my-pi/tree/v17.2.15"
immutable: true
tags: [OMP, OhMyPi, Hooks, Compaction, Settings, Runtime, Evidence]
description: "从 OMP 官方公开仓库 v17.2.15 固定 tag 的类型声明、官方文档与公开 PR 提取的运行时契约证据：Hook 事件全集、compaction 配置键、statusline segment union，以及官方仓库无 Headroom 集成代码的事实。不含任何用户配置、会话或本机路径。"
---

# OMP 17.2.15 运行时契约

这份证据快照只保留可由公开固定来源复现的字段级事实。版本边界是 npm `@oh-my-pi/pi-coding-agent@17.2.15`，对应 GitHub tag `v17.2.15`（commit `06aecdd51f07e689e970ceaa180abe2be0c14bbb`）。用于校正/补充现有三页（`legacy-omp-config-and-rules-guide.md`、`legacy-omp-hook-extension-guide.md`、`legacy-omp-headroom-persistence.md`）中仅由私人观察支撑的论断。

## 1. 版本与固定点

- npm 注册表：`@oh-my-pi/pi-coding-agent` 的 `dist-tags.latest` 为 `17.2.15`；`repository` 字段为 `git+https://github.com/can1357/oh-my-pi.git`（directory `packages/coding-agent`）。
- GitHub：tag `v17.2.15` 指向 commit `06aecdd51f07e689e970ceaa180abe2be0c14bbb`。
- 本机只读探针：`omp --version` 输出 `omp/17.2.15`，与公开固定点一致；仅此一项本机观测，未读取任何配置、数据库或会话。

## 2. Hook 事件层（官方类型声明）

来源：`packages/coding-agent/src/extensibility/hooks/types.ts` 与 `extensibility/shared-events.ts`（tag v17.2.15）。

- `HookAPI.on()` 在 v17.2.15 显式重载的官方事件全集（24 个）：

```text
session_start, session_before_switch, session_switch,
session_before_branch, session_branch,
session_before_compact, session.compacting, session_compact,
session_shutdown, session_before_tree, session_tree,
context, before_agent_start, agent_start, agent_end,
turn_start, turn_end,
auto_compaction_start, auto_compaction_end,
auto_retry_start, auto_retry_end,
ttsr_triggered, todo_reminder,
tool_call, tool_result
```

- `tool_call` 事件形状为 `{ type: "tool_call", toolName, toolCallId, input }`；handler 可返回 `ToolCallEventResult`（阻断通道）。这与 legacy Hook 页的记录一致。
- **`sendMessage()` 与 `appendEntry()` 是两条不同通道**：`sendMessage` 创建参与 LLM 上下文的 `CustomMessageEntry`；官方 JSDoc 明确“hook state should NOT be sent to the LLM, use appendEntry() instead”。legacy 页只记录了 sendMessage 软通道，未记录 appendEntry 的存在。
- `HookCommandContext`（扩展命令上下文）提供 `newSession`/`branch`/`navigateTree`，并**有意省略** `switchSession`/`reload`/`compact`/`getContextUsage`——注释说明这些方法从事件处理器（如 tool_call、context）内调用会造成死锁。legacy 页未记录此约束。
- `ctx.ui.setStatus(key, text)` 确认存在（`text` 传 `undefined` 清除）；`statusLine.showHookStatus` 为门控配置。
- **加载机制**：`extensibility/hooks/loader.ts` 通过 capability API 发现（`loadCapability<Hook>(hookCapability.id, { cwd })`）+ 显式配置路径加载 hook 文件；该文件内无 `hooks/pre`、`hooks/post` 子目录扫描逻辑（“pre/post”字样出现 0 次）。legacy 页所述 `hooks/{pre,post}/*.ts` 自动加载约定未在此文件出现，属于待重新核对项。
- **statusline segment**：`config/settings-schema.ts` 的 `StatusLineSegmentId` 是 24 项封闭 union（pi、model、mode、path、git、pr、subagents、token_in、token_out、token_total、token_rate、cost、context_pct、context_total、time_spent、time、session、hostname、cache_read、cache_write、cache_hit、session_name、usage、collab），**没有 `"hook"`**；整个 schema 文件无 `hook` 字面量。公开 PR #2001 “feat: Add extension status line segments”（10 文件、+267/−2）**closed 且未合并**。这为 legacy Hook 页案例二的“封闭 union 死胡同”提供了官方源码级确认，其上游提交记录公开可见但未进主线。

## 3. Compaction（官方文档 + 配置 schema）

来源：`docs/compaction.md`、`config/settings-schema.ts`（tag v17.2.15）。

- 压缩产物是**一等会话条目**：`CompactionEntry`（`type: "compaction"`，含 `summary`、可选 `shortSummary`、`firstKeptEntryId` 边界、`tokensBefore`）与 `BranchSummaryEntry`（`type: "branch_summary"`，`/tree` 导航时捕获废弃分支上下文）。
- 官方 settings-schema 在 v17.2.15 存在的配置键：

```text
compaction.enabled, compaction.midTurnEnabled, compaction.strategy,
compaction.thresholdPercent, compaction.thresholdTokens,
compaction.handoffSaveToDisk, compaction.remoteEnabled,
compaction.remoteStreamingV2Enabled, compaction.reserveTokens,
compaction.keepRecentTokens (default 20000), compaction.autoContinue,
compaction.remoteEndpoint, compaction.v2RetainedMessageBudget,
compaction.idleEnabled, compaction.idleThresholdTokens,
compaction.idleTimeoutSeconds, compaction.supersedeReads, compaction.dropUseless
snapcompact.systemPrompt, snapcompact.toolResults, snapcompact.shape
ttsr.enabled, ttsr.contextMode, ttsr.interruptMode, ttsr.repeatMode,
ttsr.repeatGap, ttsr.builtinRules, ttsr.disabledRules
```

  legacy 配置页快照中的 `compaction.idleEnabled`、`compaction.idleThresholdTokens`、`snapcompact.*`、`ttsr.interruptMode` 等键在键级与官方 schema 一致（取值属用户配置，不在此页复述）。
- `AutoCompactionStartEvent`：`reason ∈ threshold | overflow | idle | incomplete`，`action ∈ context-full | handoff | shake | snapcompact`——官方定义的四种自动压缩触发原因与四种动作。
- Hook 可干预压缩：`session_before_compact` handler 返回 `{ cancel?, compaction? }` 可取消或提供自定义压缩；`session.compacting` handler 可返回 `context?: string[]` 向摘要注入额外上下文行。
- 实现面（官方文档）：`compaction-v2-streaming` 为 provider-native streaming compaction；`shake` 为机械内容删除；snapcompact 策略把历史归档为 dense bitmap images（`packages/snapcompact`）。

## 4. Headroom：官方仓库的负证据

- v17.2.15 完整树（6855 条路径）中无任何 `headroom` 路径；`settings-schema.ts`（169510 字节）中 `headroom` 出现 0 次。
- 结论：官方 OMP 仓库在 17.2.15 不包含 Headroom 集成代码；legacy Headroom 页所述 `headroom wrap omp` 属于外部项目（`headroomlabs-ai/headroom`，Python），不是 OMP 内置能力。本任务未核验该外部仓库本身。

## 5. 可重复验证

```bash
# 固定点
npm view @oh-my-pi/pi-coding-agent@17.2.15 version repository.url
curl -s https://api.github.com/repos/can1357/oh-my-pi/tags?per_page=100   # v17.2.15 -> 06aecdd…

# 文件级事实（tag 固定 URL）
curl -s https://raw.githubusercontent.com/can1357/oh-my-pi/v17.2.15/packages/coding-agent/src/extensibility/hooks/types.ts
curl -s https://raw.githubusercontent.com/can1357/oh-my-pi/v17.2.15/packages/coding-agent/src/extensibility/shared-events.ts
curl -s https://raw.githubusercontent.com/can1357/oh-my-pi/v17.2.15/docs/compaction.md
curl -s https://raw.githubusercontent.com/can1357/oh-my-pi/v17.2.15/packages/coding-agent/src/config/settings-schema.ts

# 本机（无状态）
omp --version    # omp/17.2.15
```

## 6. 边界与未证明内容

- provider 注册细节（`config/model-provider-discovery.ts`）未逐行核验，本页不主张其行为。
- hook 的全局/项目目录约定：仅确认 loader.ts 走 capability 发现 + 显式路径；`hooks/pre`/`post` 约定是否存在需在 capability/hook.ts 及调用方复核。
- PR #2001 与 legacy Hook 页案例二的对应关系按标题与文件集合推断（status-line.ts、extension-ui-controller.ts 等），未做逐行比对；且该 PR 未合并，主线现状以 v17.2.15 源码为准。
- 配置实际加载路径（如 legacy 页的 `~/.omp/agent/config.yml`）未在官方文档/源码中确认，属用户环境观察，不构成本页事实。
- `headroomlabs-ai/headroom` 外部仓库未在本任务范围内核验。
