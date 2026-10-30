---
title: "UltiCode Outbox 与 Redis Streams：把判题投递做成可恢复状态"
timestamp: 2026-09-09 00:00:00+08:00
series: "架构与工程实践"
kind: concept
status: provisional
sources: ["ulticode-engineering-highlights-f801a1076"]
related: ["ulticode"]
tags: [UltiCode, OnlineJudge, Outbox, RedisStreams, Retry, DeadLetter, Idempotency, LLM]
description: "解释 UltiCode 如何用数据库 outbox、Redis Streams 原子投递、重试/死信和 PEL 回收，把判题消息从一次调用变成可恢复状态。"
toc: true
---

> **证据状态**：本文依据 UltiCode 当前固定提交的 outbox、Redis Streams 和 reaper 源码整理。这里的“可恢复”指实现了持久意图和重试路径，不代表 exactly-once、无限吞吐或生产高可用已经得到验证。

消息队列最危险的故障不是“发送时报错”，而是业务事务已经成功，但“需要发送什么”没有留下可靠记录。在线评测一旦遇到这个窗口，用户看到的是提交成功，Judge 却永远没有任务。

UltiCode 在启用 judge outbox 路径时，把提交和判题意图放进同一数据库事务：

```text
submit @Transactional
    ├── submissions: Pending
    └── judge_outbox: PENDING
             │
             ├── claim: FOR UPDATE SKIP LOCKED
             ├── atomic SET + XADD
             └── judge-workers
```

## Outbox 记录是状态机

[`JudgeOutboxMapper`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/modules/submission/outbox/mapper/JudgeOutboxMapper.java) 按状态和下一次重试时间领取记录，使用 `FOR UPDATE SKIP LOCKED` 避免 dispatcher 之间重复领取同一行。当前 dispatcher 默认批量大小为 50、定时周期为 2 秒；这是源码默认值，不是吞吐指标。

[`JudgeOutboxDispatcher`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/modules/queue/outbox/dispatcher/JudgeOutboxDispatcher.java) 对不同故障做不同状态转换：

| 情况 | 处理 |
|---|---|
| provider 缺失 | retry，保留投递意图 |
| 入队异常 | retry，指数退避，当前上限 60 秒 |
| 缺少 `problemId/userId/language/code` | `DEAD`，避免半空消息被标记为成功 |
| 成功入队 | 标记 sent |

real dispatch 还受 shadow 标记和 cutover watermark 控制，这对迁移期区分影子任务和真实任务很重要。

## 为什么是 Redis Streams，而不是一次 `XADD`

[`RedissonStreamsJudgeQueueAdapter`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/queue/port/adapter/RedissonStreamsJudgeQueueAdapter.java) 的 enqueue 使用 Lua，把去重键写入和 `XADD` 放在同一个原子操作中。去重键包含 `submissionId:generation`。

这避免了一个很具体的故障：如果先执行 `SETNX`，随后在 `XADD` 前进程崩溃，系统会认为消息已经见过，但 Stream 中没有真正的任务。原子脚本不能消除所有外部系统故障，却消除了这个可复现的半步状态。

消费者组从 `0-0` 创建，使建组前的条目仍有机会被消费。worker NACK 时保留 Pending Entries List（PEL），而不是把失败消息静默删除。

## PEL 回收与可观察状态

[`UnackedStreamEntriesReaper`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/queue/outbox/reaper/UnackedStreamEntriesReaper.java) 默认每 10 秒扫描空闲条目，每次 sweep 最多推进一条，并暴露 PEL 大小、队列延迟、最老条目年龄和 DLQ 等指标。当前 visibility timeout 常量为 `1_800_000L`，即 30 分钟；它是实现参数，不是 SLO。

重新领取的任务还要经过判题执行器的 generation/attempt 围栏。也就是说，消息可恢复不等于旧消息拥有永久写入资格。

## 这不是 exactly-once

数据库事务和 Redis 外部操作之间仍然存在边界。更准确的设计描述是：

```text
持久化业务意图
    + 可重试投递
    + 消息级去重
    + 结果写入围栏
    = 可解释的至少一次处理路径
```

这个表述比“消息绝不重复”更可靠，因为重复投递和重复执行仍可能发生，系统真正保证的是重复或过期结果不能随意改变最终状态。

## 对 LLM/Agent 系统的迁移

Agent 的长任务也不应只靠内存队列：用户请求、工具调用意图、执行状态和重试原因需要落到可恢复记录；幂等键识别重复触发；最终写入还要有版本围栏。尤其是“模型请求成功但工具任务未创建”的窗口，与在线评测的提交/outbox 窗口是同一类问题。

## 最小验证路径

阅读 [JudgeOutboxDispatcher.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/modules/queue/outbox/dispatcher/JudgeOutboxDispatcher.java)、[RedissonStreamsJudgeQueueAdapter.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/queue/port/adapter/RedissonStreamsJudgeQueueAdapter.java)，再看 [`SubmissionOutboxDispatcherIT`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/test/java/com/ulticode/modules/queue/outbox/dispatcher/SubmissionOutboxDispatcherIT.java)。
