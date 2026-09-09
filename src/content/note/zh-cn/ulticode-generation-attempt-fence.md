---
title: "UltiCode generation 与 attemptId：用条件更新拦截过期判题结果"
timestamp: 2026-09-09 00:00:00+08:00
series: "架构与工程实践"
kind: concept
status: provisional
sources: ["ulticode-engineering-highlights-f801a1076"]
related: ["ulticode"]
tags: [UltiCode, OnlineJudge, Generation, AttemptId, Lease, CAS, Concurrency, LLM]
description: "用 UltiCode 的 generation、attemptId、租约和条件更新解释如何防止重判、超时或旧 Worker 的结果覆盖新状态。"
toc: true
---

> **证据状态**：本文依据 UltiCode 的 Submission mapper、重判服务、租约回收器和 Judge attempt executor 整理。它说明仓库实现了结果围栏，不把源码存在扩大为跨系统 exactly-once 或生产并发证明。

异步判题中，一个 submission 可能经历多次执行：管理员发起重判，原 Worker 超时，租约被回收，或者 Redis 重新投递了旧消息。如果结果写入只按 `submissionId` 定位，最晚到达的旧结果就可能覆盖最新结果。

UltiCode 把“逻辑提交代次”和“具体执行租约”分开表示：

- `generation`：一次提交或重判的逻辑 epoch；
- `attemptId`：某个 Worker 执行租约的 token。

## 把并发规则写进 SQL 条件

关键路径可以压缩成四条条件：

```text
acquire lease:  id + status=Pending + generation
renew lease:    id + current_attempt_id
write verdict:  id + generation + current_attempt_id
rejudge/reaper: expected generation -> generation + 1
```

这些条件在 [`SubmissionMapper`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/modules/submission/mapper/SubmissionMapper.java) 中落成条件更新：

1. 只有处于 Pending 且 generation 匹配时，Worker 才能获取 lease。
2. 只有当前 `attemptId` 仍然持有租约时，心跳才能续租。
3. 只有 id、generation、attemptId 同时匹配时，verdict 才能写入。
4. 重判或租约恢复先用期望 generation 做 CAS，再提升到下一代并创建新的判题意图。

如果更新影响行数为 0，调用方把它解释为租约丢失、generation 过期或竞争者已接管，而不是继续重试写旧结果。判题执行器记录 `judge.stale_result.dropped`，对已经安全判定为过期的消息 ACK。

## 重判和回收如何推进 epoch

[`SubmissionRejudgeService`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/submission/admin/SubmissionRejudgeService.java) 对终态提交使用当前 generation 加一的方式重新打开判题流程，并创建新的 outbox 记录。 [`JudgingLeaseReaper`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/modules/submission/reaper/JudgingLeaseReaper.java) 也采用同样的推进策略恢复过期租约。

因此，旧消息即使在 Redis PEL 中重新出现，也带着旧 generation；它可以被消费、被识别和被安全丢弃，但不能越过 Submission owner 的数据库门口。

## 这是一道边界，不是魔法

结果围栏只能保护它覆盖的写入 seam。它不能自动替代消息持久性、跨 owner 授权、业务审计或外部系统幂等。它也不保证旧代码不会被执行；它保证的是旧执行结果没有资格覆盖新状态。

这正是条件更新的价值：把并发正确性从“所有调用方都要小心”收敛为一条可检查的数据库规则。

## 对 LLM/Agent 系统的迁移

一个 Agent 任务也可能被重试、取消后恢复、切换模型或重新规划。可以把计划版本作为 generation，把一次 provider lease 作为 attemptId，把最终写入限定为 `taskId + planVersion + attemptId`。这样旧工具调用即使晚返回，也只能成为可观测的 stale result，而不是改写当前计划。

## 最小验证路径

先读 [SubmissionMapper.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/modules/submission/mapper/SubmissionMapper.java)，再看 [DefaultJudgeAttemptExecutor.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/queue/processor/DefaultJudgeAttemptExecutor.java) 的 acquire/renew/write/ACK-NACK 路径。对应的集成行为应结合真实 MySQL、Redis 和并发测试验证；本文不声称该验证已在本轮执行。
