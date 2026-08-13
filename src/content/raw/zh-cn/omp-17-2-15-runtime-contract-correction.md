---
title: "OMP 17.2.15 运行时契约更正：Hook 加载、事件、Compaction 与 Headroom 证据边界"
capturedAt: 2026-08-13 00:00:00+00:00
sourceType: upstream-source-fixed-commit
sourceUrl: "https://github.com/can1357/oh-my-pi/tree/06aecdd51f07e689e970ceaa180abe2be0c14bbb"
immutable: true
tags: [OMP, OhMyPi, Hooks, Compaction, Settings, Runtime, Evidence]
description: "对同一 OMP 17.2.15 固定 commit 补充更精确的运行时证据：官方 extension runner 加载路径、Hook 事件与返回契约、compaction 配置、statusline segment union，以及扫描范围内没有 Headroom 集成引用的负证据；不含用户配置、会话或本机路径。"
---

# OMP 17.2.15 运行时契约更正

这份更正快照固定到官方仓库 commit `06aecdd51f07e689e970ceaa180abe2be0c14bbb`（GitHub tag `v17.2.15`）。它补充并收窄同一批公开源码证据；不能据此覆盖或删除早先的 raw 快照。

## 1. 版本与固定点

- 官方包声明：`packages/coding-agent/package.json` 的 `name` 为 `@oh-my-pi/pi-coding-agent`、`version` 为 `17.2.15`、仓库为 `https://github.com/can1357/oh-my-pi.git`。
- GitHub tag `v17.2.15` 指向 commit `06aecdd51f07e689e970ceaa180abe2be0c14bbb`。
- 无状态本机探针仅确认 `omp --version` 输出 `omp/17.2.15`；未读取本机配置、会话或缓存。

## 2. Extension runner 的官方加载路径

固定 commit 的 `docs/hooks.md` 说明：默认 CLI 运行时初始化 extension runner；`--hook` 是 `--extension` 的别名；显式路径被合并到 `additionalExtensionPaths`。

JS/TS Hook 由 Hook capability 发现，而不是只依靠 legacy `HookToolWrapper`：

1. `ExtensionRunner` 调用 capability 注册表的 `discoverExtensionPaths(configuredPaths, cwd)`。
2. 它通过 `loadCapability<Hook>(hookCapability.id, { cwd })` 发现 Hook。
3. 对显式配置路径，再用 `legacy.discoverAndLoadHooks(configuredPaths, cwd)` 兼容旧加载器。
4. `extensibility/hooks/loader.ts` 的 legacy 路径只展开明确路径/目录，不包含按 `hooks/pre`、`hooks/post` 子目录名自动扫描的规则。

因此，旧文中“`hooks/{pre,post}/*.ts` 会自动加载”不能作为已验证事实；全局/项目默认扫描范围还需结合 capability 定义和运行时实验确认。

## 3. Hook 事件与返回契约

来源：`packages/coding-agent/src/extensibility/hooks/types.ts`、`shared-events.ts` 与 `docs/hooks.md`。

`HookAPI.on()` 显式重载 25 个事件：

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

关键契约：

- `tool_call` 原始事件输入包含 `toolName`、`toolCallId`、`input`；handler 可用 `{ block: true }` 阻断。
- `tool_result` 在执行后携带 `content?`、`details?`、`isError?`；成功时可替换结果内容/详情，失败时 wrapper 发出 `isError: true` 的事件再抛回原错误。
- `session_before_switch`/`session_before_branch`/`session_before_tree` 可返回 `{ cancel? }`；`session_before_compact` 可返回 `{ cancel?, compaction? }`；`session.compacting` 可返回额外上下文。
- `sendMessage()` 创建参与 LLM 上下文的 `CustomMessageEntry`；hook 私有状态应使用 `appendEntry()`，避免发给 LLM。
- `HookCommandContext` 有意省略 `switchSession`、`reload`、`compact`、`getContextUsage`，官方注释说明从事件 handler 内调用这些方法可能造成死锁。
- 不可变输入边界：hook 不能修改原始工具参数，也不能替换工具执行；只能阻断调用、在失败时改变 wrapper 最终状态等。

## 4. UI 与 statusline 边界

- `HookUIContext` 提供 `select`、`confirm`、`input`、`editor`、`notify`、`setStatus` 等；`ctx.ui.setStatus(key, text)` 可设置状态，`text` 为 `undefined` 时清除。
- `config/settings-schema.ts` 的 `StatusLineSegmentId` 是 24 项封闭 union：`pi`、`model`、`mode`、`path`、`git`、`pr`、`subagents`、`token_in`、`token_out`、`token_total`、`token_rate`、`cost`、`context_pct`、`context_total`、`time_spent`、`time`、`session`、`hostname`、`cache_read`、`cache_write`、`cache_hit`、`session_name`、`usage`、`collab`，没有 `hook`。
- PR #2001 “Add extension status line segments” 已 closed 且未合并；v17.2.15 主线仍以上述 union 为准。

## 5. Compaction

来源：`docs/compaction.md` 与 `config/settings-schema.ts`。

- 压缩结果是一等会话条目：`CompactionEntry` 包含摘要、可选短摘要、`firstKeptEntryId` 边界和 `tokensBefore`；`BranchSummaryEntry` 为树导航保留分支摘要。
- v17.2.15 schema 的键级边界包括：

```text
compaction.enabled, compaction.midTurnEnabled, compaction.strategy,
compaction.thresholdPercent, compaction.thresholdTokens,
compaction.handoffSaveToDisk, compaction.remoteEnabled,
compaction.remoteStreamingV2Enabled, compaction.reserveTokens,
compaction.keepRecentTokens, compaction.autoContinue,
compaction.remoteEndpoint, compaction.v2RetainedMessageBudget,
compaction.idleEnabled, compaction.idleThresholdTokens,
compaction.idleTimeoutSeconds, compaction.supersedeReads, compaction.dropUseless
snapcompact.systemPrompt, snapcompact.toolResults, snapcompact.shape
ttsr.enabled, ttsr.contextMode, ttsr.interruptMode, ttsr.repeatMode,
ttsr.repeatGap, ttsr.builtinRules, ttsr.disabledRules
```

- `AutoCompactionStartEvent.reason` 为 `threshold | overflow | idle | incomplete`；`action` 为 `context-full | handoff | shake | snapcompact`。
- 官方文档还描述 provider-native streaming compaction、机械删除的 `shake` 和将历史归档为 dense bitmap images 的 snapcompact。

## 6. Headroom 负证据的范围

在 commit `06aecdd` 的完整路径树（6855 项）和 `config/settings-schema.ts` 中没有发现 `headroom` 引用。这个负证据只覆盖上述扫描范围：可说明 OMP 官方仓库在该固定点没有可见的内置 Headroom 集成，不能证明任意外部 wrapper 的行为。`headroom wrap omp` 属于外部项目，需要对 Headroom 自身固定版本另行取证。

## 7. 可重复验证

```bash
npm view @oh-my-pi/pi-coding-agent@17.2.15 version repository.url
curl -s https://api.github.com/repos/can1357/oh-my-pi/tags?per_page=100
curl -s https://raw.githubusercontent.com/can1357/oh-my-pi/06aecdd51f07e689e970ceaa180abe2be0c14bbb/packages/coding-agent/package.json
curl -s https://raw.githubusercontent.com/can1357/oh-my-pi/06aecdd51f07e689e970ceaa180abe2be0c14bbb/docs/hooks.md
curl -s https://raw.githubusercontent.com/can1357/oh-my-pi/06aecdd51f07e689e970ceaa180abe2be0c14bbb/packages/coding-agent/src/extensibility/hooks/types.ts
curl -s https://raw.githubusercontent.com/can1357/oh-my-pi/06aecdd51f07e689e970ceaa180abe2be0c14bbb/packages/coding-agent/src/config/settings-schema.ts
```

## 8. 边界与未证明内容

- provider 注册细节未逐行核验；本页不主张其行为。
- 全局/项目 Hook 默认目录与扫描范围未做运行时实验；只确认 capability 发现与显式路径机制。
- `tool_result.isError` 字段存在，但未对 `HookToolWrapper` 做完整运行时覆盖。
- 外部 Headroom wrapper、Named Profile、`model_cache` 等不属于 OMP 官方仓库证据范围。
