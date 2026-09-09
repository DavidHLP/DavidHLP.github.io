---
title: "UltiCode 数据 Owner 与事实快照：跨服务提交如何保持边界"
timestamp: 2026-09-09 00:00:00+08:00
series: "架构与工程实践"
kind: concept
status: provisional
sources: ["ulticode-engineering-highlights-f801a1076"]
related: ["ulticode"]
tags: [UltiCode, OnlineJudge, DataOwner, Contract, Port, Projection, Snapshot, LLM]
description: "从 UltiCode 的 owner 划分和 SubmissionFactsSnapshot 出发，说明跨服务写入如何把事实来源、捕获时间和 schema 版本变成显式契约。"
toc: true
---

> **证据状态**：本文依据 UltiCode `main` 固定提交 [`f801a1076`](https://github.com/DavidHLP/UltiCode/tree/f801a1076b2fa9aa06ce3d63821f0778b477042c) 的架构文档和源码整理。`Repository Implemented` 表示仓库存在相应设计与实现，不等于生产验证。

在线评测的提交接口看起来很简单：用户提交代码，系统找到题目，之后交给 Judge 执行。但“找到题目”和“确认用户有效”都属于跨模块事实。如果 Submission 在自己的数据库事务里临时查询 App、Auth 或 Contest，写入路径就会同时承担远程调用、权限判断和时序一致性。

UltiCode 的做法是先划清数据 Owner，再把提交所需的外部事实收敛成一个不可变快照。这里的重点不是增加 DTO，而是让“事实来自谁、什么时候捕获、按哪个版本解释”成为可以被检查的输入契约。

## 先划清谁拥有事实

当前架构文档将系统拆成五个 Data Owner 和两个 Worker：

| 角色 | 负责的事实与写入 | 边界 |
|---|---|---|
| Auth | 身份、凭据、刷新状态、RBAC、JWKS | 不替其他 owner 写业务表 |
| Admin | 管理、审计、设置、监控、备份和读模型 | 不接管 App/Submission 领域写入 |
| App | 用户资料、题目、竞赛、社区、互动和订阅 | 不直接拥有 Submission 结果 |
| Submission | 提交、判题状态、generation、租约、结果和判题 outbox | 不写 Problem、TestCase、Contest 表 |
| Notification | 通知、偏好、投递 ledger、邮件和重试 | 不把通知状态散落到业务 owner |
| Judge/Search Worker | 判题执行或派生搜索索引 | 不写业务表、不提供 HTTP 业务入口 |

来源：[owner 与模块边界](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/docs/architecture/modules.md)。跨 owner 的调用使用 provider-owned contract 或 consumer-owned port，禁止把共享 Entity、Mapper 或业务 Service 当成集成协议。

## Submission 接收不可变事实快照

App 侧的 [`RemoteSubmissionWritePort`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/app/app-web/src/main/java/com/ulticode/modules/submission/port/adapter/RemoteSubmissionWritePort.java) 在远程提交前捕获：

- `userId` 和 `userExists`；
- 题目 id、标题、slug、时间限制、内存限制和 starter code；
- `capturedAtEpochMillis` 与 `schemaVersion`。

Submission API 通过 [`SubmissionFactsSnapshot`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/api/submission-api/src/main/java/com/ulticode/submission/api/dto/SubmissionFactsSnapshot.java) 接收这些事实。它的核心校验可以概括为：

```java
return schemaVersion == CURRENT_SCHEMA_VERSION
        && userExists
        && Objects.equals(userId, requestedUserId)
        && problem != null
        && Objects.equals(problem.id(), requestedProblemId);
```

这一步不是把 App 的数据库复制到 Submission，而是把一次请求所需的最小事实封装成版本化输入。Submission 可以在自己的事务内校验快照并写入 Pending 状态，不必再通过隐式的远程查询决定“这个 id 当前代表什么”。

## 这个设计真正解决了什么

第一，它缩短了 Submission 的依赖面：写入端依赖 `SubmissionIntakePort` 和快照契约，而不是依赖 App/Auth 的实现细节。

第二，它让测试可以构造明确的边界：用户不存在、schema 版本过期、快照中的题目 id 与请求不一致，都可以在不启动整个系统的情况下验证。

第三，它为异步判题保留了请求时上下文。之后消息重试时，任务携带的是已经确定的输入，而不是要求消费者重新读取一组可能变化的显示信息。

## 不能过度解释的地方

事实快照不是完整的授权证明，也不是跨 owner 的全局一致性协议。快照有效期、题目撤销、用户权限变化、Contest admission 和敏感字段脱敏仍需要独立规则。它解决的是“提交写入路径依赖哪些已捕获事实”，而不是替系统解决所有身份与业务策略。

## 对 LLM/Agent 系统的迁移

LLM 工具调用同样需要一组请求时事实：允许访问的文件、用户权限、工具版本、模型版本、输入摘要和资源限额。把这些内容组成带时间和 schema 的 snapshot，比让长链路中的每个 Agent 临时查询全局状态更容易复现、审计和拒绝过期请求。

## 最小验证路径

先阅读 [SubmissionFactsSnapshot.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/api/submission-api/src/main/java/com/ulticode/submission/api/dto/SubmissionFactsSnapshot.java) 和 [RemoteSubmissionWritePort.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/app/app-web/src/main/java/com/ulticode/modules/submission/port/adapter/RemoteSubmissionWritePort.java)，再看 [`SubmissionFactsSnapshotTest`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/test/java/com/ulticode/submission/port/SubmissionFactsSnapshotTest.java)。测试文件的存在是源码证据；本文没有把它写成“本次已执行并通过”。
