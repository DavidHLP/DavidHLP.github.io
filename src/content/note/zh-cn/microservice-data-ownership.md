---
title: "微服务数据所有权：先定领域 owner，再谈拆库与迁移"
timestamp: 2026-08-13 00:00:00+08:00
series: "架构与工程实践"
kind: concept
status: active
sources: ["microservice-domain-data-ownership", "microservice-domain-data-ownership-correction"]
related: ["database-schema-drift", "multi-service-readiness"]
tags: ["Microservices", "Bounded Context", "Data Ownership", "Database-per-Service", "Saga", "Transactional Outbox", "Strangler Fig"]
description: "用服务私有数据、bounded context、saga、transactional outbox 和 expand-migrate-contract 建立数据所有权判定顺序，避免把共享物理数据库、共享 schema 和服务自治混为一谈。"
toc: true
---

**结论优先**：微服务拆分的第一步不是把数据库拆成多台，而是确定 bounded context、最终写入 owner 和数据访问契约。服务数据应通过 API/消息访问；共享物理数据库服务器可以是过渡部署，多个服务共同读写同一业务 schema/表才是主要耦合。迁移按 `expand → migrate → contract` 推进，`contract` 删除旧对象前必须关闭回滚窗口。

## 1. 用四层顺序判定 owner

```text
业务能力 / bounded context
  -> owner service
  -> private schema/table
  -> API/event contract
  -> consumer 与迁移门禁
```

不要从“现在谁直接查这张表”反推设计 owner；那通常只说明历史耦合。一个领域应有一个最终写入 owner。其他服务的复制表、读模型或缓存必须明确是派生数据，并定义刷新、失效和重建方式。

## 2. database-per-service 的边界

`database-per-service` 的核心是持久化数据归服务所有，其他服务不能绕过服务 API/消息直连其业务表。数据库是服务实现的一部分，schema 和 migration 也应纳入 owner 的变更责任。

这里有一个常被忽略的区别：

| 形态 | 是否自动等于共享数据边界 |
| --- | --- |
| 多服务共用同一物理数据库服务器 | 否，可以隔离 schema/database 作为过渡 |
| 多服务共读写同一业务 schema/表 | 是，形成开发期和运行期耦合 |
| 模块化单体的模块私有表 | 不一定需要拆库，先保持模块边界即可 |

shared schema 的变更需要协调所有访问方；查询和锁还会在运行时互相影响。因此“已经拆成多个进程”不等于“数据自治已经完成”。

## 3. 跨服务一致性：saga 与 outbox 各解决一件事

### Saga

跨多个服务或资源的流程拆成多个本地事务，用事件/命令推进，并在失败时执行补偿事务。Saga 要求中间状态可见、补偿幂等、失败可重试；它不是把本地事务变成透明的 2PC。

只在确实跨服务多资源且无法重新划界时引入 saga。单服务内部更新不应因为“未来可能拆分”就提前变成分布式事务。

### Transactional outbox

业务状态和 outbox 记录写在同一个本地事务中：提交则两者同时存在，回滚则一起消失，relay 再负责发布事件。它解决的是业务更新与消息记录之间的原子性断裂。

Outbox 仍需要消费者幂等、重复投递处理、顺序策略和监控；没有事件驱动发布路径时不必引入它。

## 4. 渐进迁移的三个阶段

### Expand

新增表、字段或 API，保持旧读写仍能工作。先建立兼容面，不要在第一步删除旧列或切换唯一 writer。

### Migrate

双写或使用 CDC 复制，校验新旧数据和事件结果，逐步把读路径切到新 owner。双写失败、延迟和重放必须有观测和补偿。

### Contract

新系统成为 system of record 后，删除旧对象和兼容逻辑。删除意味着回滚窗口关闭，因此要先确认校验、备份、告警和替代回滚方案。不能拦截请求、无法修改旧系统或没有可验证同步路径时，不应机械套用 strangler fig。

## 最小领域审计

拆分或迁移前，逐领域记录：

1. bounded context 与业务 owner；
2. 当前 system of record 与最终 writer；
3. 所有直接读写同表的服务、脚本、报表；
4. API、事件、outbox 是否覆盖每条变更路径；
5. 是否真的需要 saga，补偿是否幂等；
6. expand/migrate/contract 的验证门；
7. contract 后的备份和回滚替代物；
8. 共享物理实例与共享 schema 的区别。

这份清单是判定标准，不是某个具体项目的事实。项目侧必须继续读取固定提交中的 schema、查询、配置和调用方。

## 常见误区

- **“一服务一数据库服务器才算所有权。”** 所有权先由访问边界和最终 writer 定义，物理隔离可以渐进完成。
- **“共享表只是开发便利。”** 它同时产生 schema 变更协调和运行时锁/查询耦合。
- **“Saga 是分布式事务的无痛替代。”** 它引入补偿、中间状态和幂等要求。
- **“加 outbox 就保证消息只发一次。”** outbox 保证记录与本地事务一致，不消除重复投递。
- **“contract 只是最后删旧代码。”** 它关闭回滚窗口，必须作为独立迁移门禁。

## 证据边界

revision-pinned 文档与 live 页面分层见仓库 `src/content/raw/zh-cn/microservice-domain-data-ownership-correction.md`；初始快照和更正快照都不证明当前项目实际有哪些服务、表或 owner，真实归属需要目标仓库的源码与 schema 证据。
