---
title: "UltiCode 可靠性与 Core 机制：源码选段固定快照"
capturedAt: 2026-09-09 00:00:00+08:00
sourceType: repository-source-and-document-selected-excerpts-fixed-commit
sourceUrl: "https://github.com/DavidHLP/UltiCode/tree/f801a1076b2fa9aa06ce3d63821f0778b477042c"
immutable: true
tags: [UltiCode, Audit, Outbox, Inbox, FencedLease, Reconciliation, Core, Lifecycle]
description: "补充 UltiCode 当前 main 固定提交中 owner-local 审计投递、consumer inbox、数据库 fenced lease、reconciliation 和 Core opt-in 生命周期的源码、迁移与测试入口。"
---

# 快照说明

这是面向知识页的补充证据索引与选段快照，不是 UltiCode 仓库的完整镜像。所有来源均固定到提交 `f801a1076b2fa9aa06ce3d63821f0778b477042c`。本快照用于说明源码中存在的机制、边界和测试入口，不证明生产部署、生产流量、性能指标或完整的跨服务一致性。

## 来源清单

### Owner-local 审计与 Consumer Inbox

- [AuthAuditSinkAdapter.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/auth/src/main/java/com/ulticode/auth/audit/AuthAuditSinkAdapter.java) 与 [AuthAuditOutboxDispatcher.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/auth/src/main/java/com/ulticode/auth/audit/AuthAuditOutboxDispatcher.java)：Auth 本地审计 outbox 写入、领取、投递和重试。
- [AppAuditSinkAdapter.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/app/app-web/src/main/java/com/ulticode/app/audit/AppAuditSinkAdapter.java) 与 [AppAuditOutboxDispatcher.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/app/app-web/src/main/java/com/ulticode/app/audit/AppAuditOutboxDispatcher.java)：App 本地审计 outbox 与 owner 约束的投递路径。
- [AdminAuditIntegrationInboxBridge.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/admin/src/main/java/com/ulticode/modules/admin/audit/AdminAuditIntegrationInboxBridge.java) 与 [AdminAuditEventConsumer.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/admin/src/main/java/com/ulticode/modules/admin/audit/AdminAuditEventConsumer.java)：Redis 事件进入 Admin 本地 inbox 前的校验、幂等落库与审计日志消费。
- [ConsumerInboxMapper.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/platform/integration-inbox/src/main/java/com/ulticode/modules/event/inbox/ConsumerInboxMapper.java) 与 [InboxConsumer.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/platform/integration-inbox/src/main/java/com/ulticode/modules/event/inbox/InboxConsumer.java)：consumer/event 去重、租约领取、续租、处理完成和退避重试。

### 数据库 fenced lease

- [FencedJobLeaseMapper.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/admin/src/main/java/com/ulticode/modules/lease/FencedJobLeaseMapper.java) 与 [FencedJobLeaseService.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/admin/src/main/java/com/ulticode/modules/lease/FencedJobLeaseService.java)：以数据库时间和单调递增 `fence_token` 实现获取、续租、释放和持有判断。
- [OwnerReconciler.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/admin/src/main/java/com/ulticode/modules/reconciliation/OwnerReconciler.java) 与 [ReconciliationRunMapper.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/admin/src/main/java/com/ulticode/modules/reconciliation/ReconciliationRunMapper.java)：把 fence token 绑定到 reconciliation run，并在完成写入时同时检查 owner、token 和租约未过期。
- [0004-fenced-singleton-leases.md](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/docs/architecture/decisions/0004-fenced-singleton-leases.md) 与 [V20260831110000__Create_Fenced_Job_Leases.sql](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/init-db/migrations/V20260831110000__Create_Fenced_Job_Leases.sql)：设计决策、租约表和 token 字段的数据库基础。

### Core opt-in 生命周期

- [CoreModuleRegistry.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/core/src/main/java/com/ulticode/core/CoreModuleRegistry.java)：模块定义与 allowlist 过滤。
- [CoreOwnerContextManager.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/core/src/main/java/com/ulticode/core/CoreOwnerContextManager.java)：Owner context 的状态、超时、停止和 close-once 交接。
- [CoreOwnerClassLoaders.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/core/src/main/java/com/ulticode/core/CoreOwnerClassLoaders.java)：父优先 classloader 与显式扫描边界。
- [CoreApplicationSmokeTest.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/core/src/test/java/com/ulticode/core/CoreApplicationSmokeTest.java) 与 [CoreOwnerContextManagerLifecycleTest.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/core/src/test/java/com/ulticode/core/CoreOwnerContextManagerLifecycleTest.java)：默认禁用、就绪失败、缺失依赖 fail-closed，以及 startup/timeout/interrupt/stop 竞态的边界测试入口。

## 选段：Owner-local 审计到 Admin Inbox

- Auth 和 App 的审计 sink 将审计记录写入各自 owner 的 `audit_outbox`；dispatcher 领取记录后写入 owner-specific Redis Stream，再按 claim owner 标记 delivered 或 retry。
- Admin bridge 读取 Redis 事件后，先校验 event id、事件类型、owner 和 JSON payload，再以 `insertIfAbsent` 将事件写入 Admin 的 `consumer_inbox`。只有 inbox 落库成功或确认重复后才 ACK Stream；无法解析的消息进入 poison 路径。
- `consumer_inbox` 通过 `(consumer, event_id)` 唯一键去重。消费者租约过期后可被其他实例重新领取；处理成功和 inbox 终态变更在普通 handler 路径中使用同一事务。
- `AdminAuditEventConsumer` 要求 Stream event id 与 payload 的 `auditId` 一致，并使用 event id 作为 Admin 审计日志的幂等主键。

## 选段：数据库 fenced singleton lease

- `fenced_job_leases` 以 `lease_name` 唯一标识单例任务；租约过期后重新获取会提升 `fence_token`。获取、续租和释放均要求 owner token 与 fence token 匹配。
- `OwnerReconciler` 把成功获取的 token 写入 reconciliation run，并在完成时调用带租约条件的更新。`ReconciliationRunMapper` 同时检查 run token、lease owner、lease token 和 `leased_until > CURRENT_TIMESTAMP(3)`。
- `FencedJobLeaseIT` 覆盖一个获胜者以及过期后新 token 使旧 owner 释放失败的场景；`OwnerReconcilerTest` 覆盖丢失租约和旧 token 完成写入被拒绝的场景。

## 选段：Core opt-in bounded testbed

- `CoreModuleRegistry` 当前将 Auth、Admin 标记为 enabled，将 App、Submission、Notification、Search 保持为 disabled；`CoreOwnerContextManager` 还受 `core.owner-contexts.enabled` opt-in 开关控制。
- manager 用 `DISABLED`、`STARTING`、`READY`、`FAILED`、`STOPPED` 等状态表达生命周期；启动任务有单次提交和 per-child timeout，`TIMEOUT_CLAIMED` 负责在 caller、timeout path 与 late callable 之间转移关闭责任。
- 子 context 使用 non-Web、关闭 Flyway/Dubbo 等配置，并以 owner-specific 数据源、Redis 和显式扫描/本地 adapter 组装；父优先 classloader 不是安全隔离边界。
- Core smoke/lifecycle 测试关注默认禁用、ready 失败、缺失 judge fail-closed、close exactly once、timeout-after-done、interrupt、stop during startup 和线程不泄漏。

## 证据边界

本快照记录的是固定提交中的源码、迁移、ADR 和测试入口。Core 当前仍是受 allowlist 限制的实验性 profile，不能据此声称所有 owner 已经可以在一个 JVM 中完成生产级运行；审计链路也不等于跨服务 exactly-once。数据库迁移目录和 architecture 文档未纳入代码图索引，本快照对这些文件采用直接源码阅读。
