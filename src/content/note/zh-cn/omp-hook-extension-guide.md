---
title: "OMP Hook 扩展概念：决策点提示、硬阻断与状态桥接"
timestamp: 2026-07-25 00:00:00+08:00
series: "OMP 与 Agent 工程"
kind: concept
status: active
sources: ["legacy-omp-hook-extension-guide"]
related: ["headroom-single-port-evolution", "omp-config-and-rules-guide", "omp-headroom-persistence", "llm-wiki-pattern"]
tags: [Agent,OMP,Codebase,Hooks,DevOps,TUI,Plugin,Extension]
description: "把 OMP Hook 抽象为位于工具决策点的事件扩展：soft hook 用 sendMessage 提醒但不阻断，hard result 才能拒绝调用；setStatus 通过事件桥接到 UI。页面给出 API 边界、mock 与真实会话验证，并明确软提示不是安全强制边界。"
toc: true
---

这页回答 Hook 应该放在哪里、应该改变什么，以及怎样证明它真的生效。核心定位是“在工具调用即将发生的决策点观察并干预”：`sendMessage` 适合低风险的软提示，返回 `{ block, reason }` 才是阻断通道；`ctx.ui.setStatus` 只是把状态送到可见 UI，不能把提示升级为安全控制。

## 核心机制

### 1. 决策点与两条输出通道

```mermaid
flowchart LR
  A[tool_call 事件] --> B[读取 toolName/input]
  B --> C{需要提醒还是拒绝?}
  C -- 提醒 --> D[pi.sendMessage<br/>custom message]
  D --> E[return void<br/>工具继续]
  C -- 明确拒绝 --> F[return {block, reason}]
  F --> G[调用被拒绝并要求重试]
  H[生命周期/工具事件] --> I[ctx.ui.setStatus]
  I --> J[Hook 状态 map] --> K[状态行/可选 segment]
```

| 通道 | 最小契约 | 可证明的效果 | 不能假定的效果 |
| --- | --- | --- | --- |
| 软提示 | `pi.sendMessage({ customType, content, display, attribution })` 后返回 `void` | 消息进入 Agent 上下文，当前工具照常执行 | Agent 一定采纳建议；任何安全动作都被拦截 |
| 硬阻断 | `return { block: true, reason }`（字段以当前类型为准） | 当前工具调用被拒绝，调用方需要处理结果 | 误判不会发生；它替代了服务端权限或写门禁 |
| UI 状态 | `ctx.ui.setStatus(key, text)` | 状态进入 Hook 状态集合并可被 UI 渲染 | 状态行一定在顶部显示；长文本不会截断 |

### 2. 扩展生命周期和状态桥

- Hook 文件通常在会话启动时加载；新增或修改后应以新会话验证，不能把热加载当作默认行为。
- `session_start` 可建立探针、缓存项目根或初始化状态；`tool_call` 应只做快速、可失败的分类，避免阻塞工具路径。
- `setStatus` 是“事件 → 状态 map → 渲染器”的桥。独立 Hook 状态行和顶部 statusline segment 可能由不同开关控制，不能只凭一个位置是否出现判断 API 失败。
- 顶部 segment 若由封闭的 ID union 或 preset 白名单控制，配置并不自动增加一个新的 Hook segment；这属于宿主 UI 能力，而不是 Hook 侧 API。
- 状态可见性和调用强制性必须解耦：状态行用于观察，阻断结果用于一次调用的控制，真正的安全边界仍应由独立的权限/写门禁承担。

### 3. 让检测信号稳定

优先检查结构稳定的字段，例如 `toolName`、输入中的路径范围和项目根，而不是依赖脆弱的自然语言 pattern。Hook 应 fail-soft：异常被捕获并记录或静默退化，不能因为提示逻辑失败而破坏正常工具流。去重或节流只为避免噪声，不应改变硬阻断语义。

## 适用条件

- Agent 在一个具体工具决策点持续选择低质量默认工具，需要即时的替代选项提示。
- 需要把门禁、压缩、索引或运行状态投影到 UI，供人观察而不是伪造业务结果。
- 需要在不改动主程序的情况下为项目或全局会话注册事件处理器。
- 需要先用合成事件证明逻辑，再用全新会话证明加载和送达。

## 不适用与风险

| 边界 | 失败表现 | 正确处理 |
| --- | --- | --- |
| 软提示不是安全控制 | Agent 忽略 `sendMessage`，危险调用仍发生 | 对不可恢复的动作使用受测试的硬门禁或服务端授权；不要把 nudge 当保证 |
| Hook API 随版本变化 | 类型编译通过但事件字段或加载位置变化 | 对照当前类型声明；在新的会话中观察真实事件 |
| mock 不等于运行时 | 合成 handler 通过，实际没有加载或渲染 | mock 后必须做真实 `tool_call` 和 TUI 验证 |
| 状态行与顶部 segment 分离 | `setStatus` 有数据但用户看不到预期位置 | 分别检查状态开关、segment union/preset 和渲染通道 |
| 状态长度和刷新频率受 UI 限制 | 文本省略、边框溢出或显示陈旧 | 只放短状态，保留独立行作为完整证据，并验证真实终端尺寸 |
| 检测过重或抛错 | 工具调用延迟、正常调用被意外影响 | 采用路径/字段快速判定、限流和 fail-soft `try/catch` |

## 最小验证

```text
类型/契约检查
  → mock pi 注册 handler，触发正向、负向、异常事件
  → 新会话触发真实 tool_call，确认提示出现且工具仍返回
  → 新会话执行硬阻断样例，确认 block/reason 可见
  → tmux 或真实终端观察 setStatus 与目标 statusline 通道
```

mock 探针至少断言：非目标工具静默、目标工具只提示一次或按节流规则提示、异常不抛出、硬分支返回拒绝。运行时证据必须同时包含消息/状态到达和工具或 UI 的实际结果；仅检查源码导出或函数返回不够。

## 证据与不确定性

- **来源事实**：`legacy-omp-hook-extension-guide` 记录 `session_start`/`tool_call`、`HookAPI.sendMessage`、`ToolCallEventResult`、`ctx.ui.setStatus`、会话启动加载、mock-pi 与 tmux 分层验证，以及 statusline segment 的宿主限制。
- **本页综合**：把“决策干预”和“可见性桥接”分成两条因果链，并把软提示明确降级为建议机制，是为了避免把可观察性误报成强制安全。
- **未确认项**：当前 OMP 版本的事件类型、默认 `display`/`triggerTurn`、状态行开关、segment 名称和热加载行为需按安装版本复核；本页不承诺某个 UI 位置永久存在。

## 相关页面

- [Headroom 单端口演进](/note/headroom-single-port-evolution)
- [OMP 配置分层](/note/omp-config-and-rules-guide)
- [Headroom 路由持久化](/note/omp-headroom-persistence)
- [LLM wiki pattern](/note/llm-wiki-pattern)
