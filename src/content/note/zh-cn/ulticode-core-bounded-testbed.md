---
title: "把模块化单体当实验场：UltiCode Core 的 Allowlist、超时与 Close-once 生命周期"
timestamp: 2026-09-09 00:00:00+08:00
series: "架构与工程实践"
kind: concept
status: provisional
sources: ["ulticode-reliability-core-f801a1076"]
related: ["ulticode", "ulticode-owner-and-facts", "ulticode-generation-attempt-fence"]
tags: [UltiCode, ModularMonolith, Lifecycle, ClassLoader, Allowlist, FailClosed, Testing, LLM]
description: "从 UltiCode Core 的 owner context 管理器出发，解释如何用 opt-in、allowlist、有界启动和 close-once 交接，把模块化单体限制为可回滚的拓扑实验场。"
toc: true
---

> **证据状态**：本文依据 UltiCode 固定提交中的 Core registry、owner context manager、classloader、smoke/lifecycle 测试和架构文档整理。当前实现把 Core 限制为 opt-in、allowlist 驱动的实验 profile；本文不把它描述成已经覆盖全部业务路径的生产模块化单体。

把多个模块放进同一个 JVM，最先解决的通常不是部署数量，而是验证问题：能不能在不启动完整分布式拓扑的情况下，检查 owner wiring、端口契约、启动顺序和停止行为？

但“为每个模块创建一个 `ApplicationContext`”并不能自动得到一个安全的模块化单体。一个子 context 可能卡在启动；父进程可能已经把它标记为失败，后台线程却稍后创建出资源；超时路径和正常路径还可能同时调用 `close()`。如果所有模块默认一起启动，实验代码本身就可能改变默认拓扑和故障半径。

UltiCode 的 Core 机制值得讲解的地方，是它没有把这个 profile 当作另一套默认运行模式，而是把它收敛成一个有边界的 testbed：默认关闭、显式 allowlist、有界启动、明确状态，以及 close-once 的资源交接。

## 朴素的多 context 方案缺少什么

最直接的实现大概是：遍历模块，提交一个启动任务；等待超时；失败就关闭 context。

```java
for (Module module : modules) {
    executor.submit(() -> start(module));
}

if (!future.get(timeout, MILLISECONDS)) {
    context.close();
}
```

这个伪代码同时隐藏了几个竞态：

- timeout 发生时，后台任务可能还没有决定是否已经创建 context；
- timeout 线程和启动线程都可能认为自己拥有关闭责任；
- 父线程返回后，迟到的 context 可能仍然变成 READY；
- stop 只中断线程，不代表 Spring context、classloader 或 executor 已经关闭；
- 仅凭包名隔离依赖，并不能阻止父 classpath 中的类被复用。

因此，Core 的难点不是“启动几个 Spring Boot”，而是管理一次启动尝试的所有权：谁创建资源，谁负责关闭，什么时候结果已经过期。

## 第一道边界：默认不启动，Registry 再做 Allowlist

[`CoreModuleRegistry`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/core/src/main/java/com/ulticode/core/CoreModuleRegistry.java) 当前把 Auth、Admin 标记为 enabled，把 App、Submission、Notification、Search 保持为 disabled。与此同时，`CoreOwnerContextManager` 还受 `core.owner-contexts.enabled` opt-in 配置控制，默认值为 `false`。

这两个开关不是重复配置：

```text
Core profile enabled?      -> 是否允许进入实验路径
Registry allowlist enabled? -> 哪些 owner 有资格被启动
```

只有同时满足时，模块才会进入启动队列。它解决的是一个很实际的风险：未来有人添加了新的 owner 定义，不应该因为“发现了模块”就自动改变默认部署拓扑。

这也解释了为什么没有采用“默认尝试启动所有模块，再把启动失败的隐藏起来”。失败隐藏会把依赖缺失、端口冲突或错误扫描变成半可用状态；allowlist 则把范围写成显式的安全上限。

## 第二道边界：把生命周期写成状态机

`CoreOwnerContextManager` 使用明确状态表达 owner context 的生命周期：

```text
DISABLED
   │ opt-in + allowlist
   ▼
STARTING ───────────────┐
   │                    │ timeout / exception
   ▼                    ▼
 READY                 FAILED
   │ stop                │ stop/cleanup
   └───────────────► STOPPED
```

状态的价值在于拒绝模糊的“context 对象非空即 ready”判断。一个已经创建但依赖缺失的 context 不能被业务入口当作可用；一个启动超时的 owner 也不能因为后台任务晚返回而重新变成 READY。

Core 的 smoke test 进一步把默认禁用、readiness 未就绪返回 503 和缺少必要 Judge 依赖时 fail-closed 写成可观察行为。这里的 `503` 不是业务功能，而是防止系统把“没有准备好”伪装成空响应或部分成功。

## 第三道边界：Timeout 不只是抛异常，还要交接 Close 责任

启动一个 context 会产生一组需要回收的资源：Spring context、线程、classloader 以及可能已经打开的连接。超时之后，最危险的不是任务失败，而是有两个执行者同时清理，或者谁都没有清理。

UltiCode 用 `TIMEOUT_CLAIMED` 这样的原子交接状态，把一次 startup attempt 的关闭责任分给三个可能的执行者之一：

```text
startup attempt
       │
       ├── startAll caller completes first -> caller closes/owns result
       ├── timeout path wins              -> timeout path closes
       └── late callable creates context  -> late callable closes
```

每次启动尝试的资源关闭次数应是 0 或 1：没有创建 context 时是 0，创建后必须恰好由一个路径关闭。正常完成、超时后迟到、线程中断和 stop during startup 都要走同一条 ownership handoff 规则，而不能在每个异常分支里随手加一个 `close()`。

这是一种比“在 finally 里关闭所有东西”更窄但更可靠的做法。`finally` 能保证某个调用栈退出时执行清理，却不能决定另一个并发调用栈是否已经接管了同一个资源。

## ClassLoader 不是安全边界

[`CoreOwnerClassLoaders`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/core/src/main/java/com/ulticode/core/CoreOwnerClassLoaders.java) 使用父优先策略。它可以辅助资源加载和模块化组织，但父优先意味着同名类可能从父 classpath 被复用；它不是安全隔离，也不能单独证明依赖版本隔离。

真正承担边界的仍是显式约束：

- Registry allowlist 决定哪些 owner 可以启动；
- child context 使用明确的组件扫描范围；
- Core profile 关闭 Web、Flyway、Dubbo 等不需要的自动启动面；
- 数据源、Redis 和 adapter 使用 owner-specific 配置；
- readiness 在依赖未就绪时 fail-closed。

这也是为什么架构文档中把 Core 当前状态保留为 OPEN，并记录了 exec-jar 场景下 parent-first classpath 与重叠扫描带来的问题。一个方便启动的 classloader 方案，不能被包装成“模块之间已经完全隔离”。

## 为什么不直接拆成独立进程

独立进程提供更强的依赖、线程和故障隔离，生产服务通常也更容易从资源限制和发布角度理解。但它的验证成本更高：需要启动完整网络拓扑、注册中心、数据库和配置，才能测试跨 owner wiring。

Core 的合理定位是补充一个低成本实验面：在默认 distributed profile 不变的前提下，允许少量 owner 在一个 JVM 内启动，用来检查上下文生命周期和受控的拓扑组合。它不是在两个部署模型之间做“谁更先进”的选择，而是把验证用 profile 和生产 profile 分开。

如果 Core 开始承载全部业务 HTTP/WS journey、自动扫描所有 owner、共享任意数据源，或者成为默认启动路径，就不再是同一个问题；此时应重新评估独立进程、容器边界和真正的模块依赖隔离。

## 这个设计真正解决了什么

- **默认拓扑不漂移**：Core opt-in + Registry allowlist 防止新模块自动加入运行路径。
- **启动失败可见**：状态机和 fail-closed readiness 不把半启动状态当成功。
- **并发清理可证明**：一次 startup attempt 的资源关闭责任有明确唯一归属。
- **实验成本受控**：可以在一个进程内验证部分 owner wiring，而不改变 distributed 默认模式。
- **测试关注真实竞态**：timeout-after-done、interrupt、stop during startup 和 thread leak 都有对应边界测试入口。

它没有解决：父 classpath 的依赖冲突、真正的安全隔离、全部业务 journey、跨进程网络故障、生产流量下的资源容量，也没有把所有 owner 自动变成可嵌入模块。Core 是生命周期和拓扑实验面，不是“微服务自动模块化”的证明。

## 成本、适用条件与失效边界

当团队需要快速验证少数模块的装配关系，又不希望为每次测试启动完整分布式环境时，这种 bounded testbed 有价值。前提是：允许明确的 opt-in；能列出有限的 allowlist；能给每个 child context 设定超时；能接受 parent-first classloader 不是安全边界。

它增加的成本包括状态机、线程池、资源交接、测试竞态和配置矩阵。模块数量很多、依赖版本冲突严重或测试必须覆盖真实网络/隔离行为时，把所有东西塞进一个 JVM 可能反而增加理解成本。

最容易失效的地方有三个：

1. 只测试“启动成功”，不测试超时后迟到返回，导致 context 泄漏或错误变成 READY。
2. 只做 allowlist，不限制扫描、数据源和外部 client，结果只是把跨 Owner 依赖搬进同一个进程。
3. 把 Core smoke test 当成生产验证，忽略文档中明确的 OPEN 状态和尚未覆盖的 HTTP/WS journey。

## 对 LLM/Agent 系统的迁移

Agent runtime 也可能同时运行多个 provider、工具插件或任务上下文。这里可迁移的不是“每个插件都创建一个 classloader”，而是三条规则：默认不启用实验能力；用 allowlist 明确哪些工具有资格加载；为每次启动、取消和超时定义唯一的资源关闭责任。

尤其是取消竞态：一个工具调用已经超时，但后台 provider 仍可能稍后返回。系统需要像 Core 的 late callable 一样，把迟到结果归入已失效的 attempt，并确保 context、连接和临时文件只由一个路径回收。

## 最小验证路径

源码阅读顺序可以是：先看 [`CoreModuleRegistry`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/core/src/main/java/com/ulticode/core/CoreModuleRegistry.java) 和 [`CoreOwnerContextManager`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/core/src/main/java/com/ulticode/core/CoreOwnerContextManager.java)，确认 opt-in、allowlist、状态与 timeout；再看 [`CoreOwnerClassLoaders`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/core/src/main/java/com/ulticode/core/CoreOwnerClassLoaders.java)，确认没有把父优先加载误读成安全隔离；最后阅读 [`CoreApplicationSmokeTest`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/core/src/test/java/com/ulticode/core/CoreApplicationSmokeTest.java) 和 [`CoreOwnerContextManagerLifecycleTest`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/core/src/test/java/com/ulticode/core/CoreOwnerContextManagerLifecycleTest.java)。

本次分析对 Core 采用了源码、架构文档和测试入口的静态复核；没有重复执行 Core 模块 Maven 测试，也没有把 smoke/lifecycle 测试文件的存在写成生产运行证明。当前可确认的是设计边界和测试意图，不能扩展为全量模块启动成功。
