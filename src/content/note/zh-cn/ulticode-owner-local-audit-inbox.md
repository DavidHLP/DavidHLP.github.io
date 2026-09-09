---
title: "跨 Owner 审计别靠跨库写入：UltiCode 的 Local Outbox 与 Consumer Inbox"
timestamp: 2026-09-09 00:00:00+08:00
series: "架构与工程实践"
kind: concept
status: provisional
sources: ["ulticode-reliability-core-f801a1076"]
related: ["ulticode", "ulticode-owner-and-facts", "ulticode-outbox-redis-streams"]
tags: [UltiCode, Audit, DataOwner, Outbox, Inbox, RedisStreams, EventualConsistency, Idempotency, LLM]
description: "从 Auth/App 本地审计 outbox、owner-specific Redis Stream 到 Admin consumer inbox，解释跨 owner 审计如何处理双写、重复投递、租约恢复与最终一致性。"
toc: true
---

> **证据状态**：本文依据 UltiCode `main` 的固定提交 [`f801a1076`](https://github.com/DavidHLP/UltiCode/tree/f801a1076b2fa9aa06ce3d63821f0778b477042c) 中的审计 adapter、dispatcher、Admin inbox bridge、consumer inbox 和数据库迁移整理。仓库存在这些机制，不等于已经证明跨服务 exactly-once 或生产级审计零丢失。

审计日志有一个容易被低估的约束：产生审计事件的动作和保存审计日志的模块，往往不是同一个数据 Owner。

例如，Auth 修改登录策略时，Auth 最清楚这次动作是否真的提交；但 Admin 可能才拥有统一的 `audit_logs` 读模型。如果 Auth 的业务事务提交后，再同步调用 Admin 写一条日志，就会出现一个无法回滚的窗口：业务已经成功，远程写日志失败。反过来先写 Admin，再提交 Auth，则可能留下没有对应业务动作的日志。

这不是“要不要上消息队列”的问题，而是要先决定：哪一个数据库事务负责保证动作与审计意图同时存在，哪个模块负责最终落地，以及重复和失败由谁收敛。

## 直接跨库写入为什么不够

最直接的做法是让 Auth/App 的服务方法在本地事务中直接调用 Admin 的写接口：

```text
begin Auth transaction
  update Auth data
  call Admin.writeAudit()
commit Auth transaction
```

它有三个具体缺口：

1. Admin 请求失败时，本地事务是否回滚取决于远程调用的时序和异常传播；网络超时还可能意味着 Admin 已经写成功，只是响应没有回来。
2. 如果 Admin 的审计表和 Auth/App 的业务表不在同一数据库，普通 `@Transactional` 不能把它们变成一个原子提交。
3. 即使引入一个消息队列，消费者重试仍会让同一事件到达多次；“消息发出去了”也不等于“业务副作用只发生一次”。

在某些低价值、允许丢失的诊断日志中，直接异步打日志已经足够。审计记录通常需要可追溯和可重放，才值得承担下面这组状态机的成本。

## 第一道边界：审计意图留在产生事实的 Owner

UltiCode 没有让 Auth/App 在动作提交时直接写 Admin 的表，而是分别拥有本地 audit outbox：

```text
Auth/App local transaction
    ├── write business state
    └── insert audit_outbox(PENDING, eventId, payload)
              │
              └── local dispatcher
                    └── owner-specific Redis Stream
```

[`AuthAuditSinkAdapter`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/auth/src/main/java/com/ulticode/auth/audit/AuthAuditSinkAdapter.java) 和 [`AppAuditSinkAdapter`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/app/app-web/src/main/java/com/ulticode/app/audit/AppAuditSinkAdapter.java) 的关键价值，不是“多了一张表”，而是把两个必须一起发生的动作放进同一个 Owner 的本地事务：

```text
@Transactional
    ├── commit the Auth/App change
    └── insert local audit_outbox
```

这样，业务动作成功而审计意图完全不存在的窗口被压缩成了本地数据库事务能处理的范围。dispatcher 随后再承担跨系统投递：领取带有 claim owner 的记录，写入对应 Stream，成功后标记 delivered，异常时记录 retry，而不是把投递失败藏在日志里。

这里故意没有让 Admin 直接访问 Auth/App 的表。Admin 得到的是一个事件契约，而不是另一个 Owner 的 Mapper 或 Entity；这保持了数据 Owner 的写入边界。

## 第二道边界：先进入 Inbox，再确认已经接管消息

Admin bridge 的处理顺序很重要：

```text
Redis Stream
    │ read
    ▼
validate eventId / type / owner / payload
    │
    ├── invalid -> poison path
    └── valid
          │
          ▼
consumer_inbox.insertIfAbsent(consumer, eventId, payload)
          │
          └── only then ACK Stream
```

[`AdminAuditIntegrationInboxBridge`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/admin/src/main/java/com/ulticode/modules/admin/audit/AdminAuditIntegrationInboxBridge.java) 先校验消息，再把它接管到 Admin 本地的 `consumer_inbox`。如果进程在写 Inbox 前崩溃，Stream 消息仍然处于未确认状态，可以被重新读取；如果 Inbox 已经插入成功但 ACK 前崩溃，下一次读取会撞上唯一键，`insertIfAbsent` 将它识别为重复，然后安全 ACK。

`consumer_inbox` 的唯一键是 `(consumer, event_id)`。这比只把 `eventId` 设成全局唯一更准确：同一事件可能有多个合法消费者，而每个消费者只需要对自己的副作用去重。

Admin 还检查事件 id 是否和 payload 中的 `auditId` 一致。这个校验看起来很保守，但它防止了“外层消息说是 A，内部 payload 却是 B”的关联错乱；审计日志的幂等主键由同一个事件 id 驱动。

## 第三道边界：Inbox 自己也是一个可恢复状态机

把消息写入 Inbox 只解决了“已经持久接管”。它没有解决消费者执行到一半崩溃的问题，所以 [`ConsumerInboxMapper`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/platform/integration-inbox/src/main/java/com/ulticode/modules/event/inbox/ConsumerInboxMapper.java) 和 [`InboxConsumer`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/platform/integration-inbox/src/main/java/com/ulticode/modules/event/inbox/InboxConsumer.java) 又建立了一层本地状态：

```text
PENDING
  └── claim -> PROCESSING
                 ├── heartbeat/renew
                 ├── success -> PROCESSED
                 └── failure -> PENDING(next_retry_at) or DEAD
```

消费者领取 `PENDING` 或租约已过期的 `PROCESSING` 行，并写入 lease owner/expiry。普通 handler 的业务副作用与 Inbox 的终态更新放在同一事务中：

```text
@Transactional
    ├── apply Admin audit log if event is new
    └── mark inbox row PROCESSED
```

如果 handler 失败，记录错误和下一次重试时间；达到上限后进入 `DEAD`。如果进程在副作用提交前崩溃，事务回滚，Inbox 仍可重试；如果副作用已经提交而终态更新没有提交，两者在同一事务里就不会被拆开。对于无法纳入同一事务的外部副作用，仍然需要下游幂等键或补偿规则。

## 为什么是两层 Outbox/Inbox，而不是一张共享事件表

两层结构看起来重复，实际承担的责任不同：

| 位置 | 负责的问题 | 不能替代什么 |
|---|---|---|
| Auth/App local outbox | 本地业务提交后，审计意图不消失 | 不能保证远程投递一次成功 |
| Redis Stream | 跨 Owner 的异步传输、消费组和 Pending 可见性 | 不能替代数据库幂等和业务事务 |
| Admin consumer inbox | 事件被哪个消费者持久接管，以及重复去重 | 不能保证 handler 的所有外部副作用原子 |
| `audit_logs` | Admin 的本地审计读模型 | 不能回滚 Auth/App 的业务事务 |

如果让所有模块共享一张“事件表”，表面上少了桥接代码，却把不同 Owner 的写权限、迁移节奏和失败恢复绑在一起。更直接的替代方案是两阶段提交，但它要求所有资源都参加同一协调协议；对于数据库、Redis 和独立服务混合的路径，这通常比显式的最终一致性状态机更昂贵。

## 这个设计真正保证了什么

它把几个容易混在一起的保证拆开了：

- **本地原子性**：业务变更和本地审计 outbox 在同一 Owner 的事务中提交。
- **可重试投递**：dispatcher 失败会保留 retry 状态，Stream 未 ACK 的消息仍可被接管。
- **消费端去重**：`(consumer, event_id)` 唯一键和 `insertIfAbsent` 让重复投递不会重复创建同一 Inbox 任务。
- **处理恢复**：消费者租约过期后可以重新领取，失败可退避，长期失败可进入死信状态。
- **审计落库幂等**：Admin 用 event id 作为审计记录的幂等身份，并校验它与 payload 的关联。

它没有保证：跨数据库立即一致、任意外部副作用 exactly-once、消息永不丢失、消费者永不重复执行，或所有 poison event 都能自动修复。准确的说法是：系统允许重复投递和重复尝试，但把最终副作用的资格收敛到本地事务、唯一键和幂等处理器。

## 成本、适用条件与失效边界

这套设计适合下面的条件：事件来源和最终读模型属于不同 Owner；业务动作不能因为审计服务暂时不可用就整体失败；审计事件需要可追溯、可重试和重复检测。

它增加的成本也很实在：至少要维护 outbox、Stream、Inbox 三类状态，处理 claim lease、退避、死信、监控和 schema 兼容，还要给每个事件定义稳定的 id 与 payload 校验。小型单体应用只有一个数据库、审计允许和业务共用事务时，一张本地审计表可能更合适。

最容易失效的地方有三个：

1. 业务写路径漏掉了 outbox 插入，可靠投递链从源头就没有事件。
2. 消费者把外部调用和 `markProcessed` 拆开，却没有幂等键或补偿，Inbox 只能保证“重试了”，不能保证副作用没有重复。
3. 只监控 Stream lag，不监控 Inbox 的 DEAD 数、最老租约和 retry age，系统会看起来“消息已消费”，实际却停在本地状态机里。

## 对 LLM/Agent 系统的迁移

Agent 的工具调用同样可能出现“任务已经接受，但审计事件没有留下”或“工具结果已经落地，确认消息在 ACK 前丢失”。可以把用户请求和工具意图写入调用方的 local outbox，把跨组件传递落到带 event id 的 stream，再让每个副作用消费者拥有自己的 inbox 和幂等规则。

但不要把这套链路简化成“给 Agent 加消息队列”。真正需要迁移的是责任分工：谁拥有事实、谁保存发送意图、谁确认已持久接管、谁负责重复执行的安全性。

## 最小验证路径

源码复核时，按下面的顺序比只看表结构更容易发现断点：

1. 先看 [`AuthAuditSinkAdapter`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/auth/src/main/java/com/ulticode/auth/audit/AuthAuditSinkAdapter.java) 和 [`AppAuditSinkAdapter`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/app/app-web/src/main/java/com/ulticode/app/audit/AppAuditSinkAdapter.java)，确认 outbox 插入是否真的在业务事务路径上。
2. 再看 [`AdminAuditIntegrationInboxBridge`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/admin/src/main/java/com/ulticode/modules/admin/audit/AdminAuditIntegrationInboxBridge.java)，确认 ACK 是否晚于 Inbox 持久化。
3. 最后同时阅读 [`ConsumerInboxMapper`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/platform/integration-inbox/src/main/java/com/ulticode/modules/event/inbox/ConsumerInboxMapper.java)、[`InboxConsumer`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/platform/integration-inbox/src/main/java/com/ulticode/modules/event/inbox/InboxConsumer.java) 和 [`AdminAuditEventConsumer`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/admin/src/main/java/com/ulticode/modules/admin/audit/AdminAuditEventConsumer.java)，检查租约恢复、唯一键和 handler 事务是否闭合。

仓库包含 Auth/App 审计 dispatcher 测试以及 Admin audit/inbox 测试；本次文章写入阶段没有重复执行 UltiCode 的 Maven 测试，也没有把源码测试文件的存在写成真实 Redis 多实例或跨数据库故障演练。
