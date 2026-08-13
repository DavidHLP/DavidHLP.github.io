---
title: "微服务领域边界与数据所有权：从 database-per-service 到渐进迁移"
capturedAt: 2026-08-13 00:00:00+00:00
sourceType: upstream-patterns-and-fixed-doc-snapshots
sourceUrl: "https://microservices.io/patterns/data/database-per-service.html"
immutable: true
tags: [Microservices, Bounded Context, Data Ownership, Database-per-Service, Saga, Transactional Outbox, Strangler Fig]
description: "固定 microservices.io、Martin Fowler 与 Microsoft Architecture Center 的公开模式资料，提炼服务私有数据、跨服务一致性、outbox 事件发布和 expand-migrate-contract 迁移边界；不推断具体项目的真实表所有权。"
---

# 微服务领域边界与数据所有权：从 database-per-service 到渐进迁移

## 固定公开来源

- <https://microservices.io/patterns/data/database-per-service.html>
- <https://microservices.io/patterns/data/shared-database.html>
- <https://microservices.io/patterns/data/saga.html>
- <https://microservices.io/patterns/data/transactional-outbox.html>
- <https://martinfowler.com/bliki/BoundedContext.html>
- <https://martinfowler.com/bliki/ParallelChange.html>
- <https://martinfowler.com/bliki/StranglerFigApplication.html>
- <https://martinfowler.com/articles/microservices.html>
- Microsoft Architecture Center `data-considerations.md` 固定提交 `02b64c27`
- Microsoft Architecture Center `strangler-fig.md` 固定提交 `0a1c25e5`

本快照整理的是公开架构模式，不是任何私有项目的服务清单、表清单或迁移计划。

## 可验证的通用事实

### 1. 服务应拥有自己的持久化边界

`database-per-service` 的关键不是“每个服务必须有一台数据库服务器”，而是服务的数据由服务自己持有，其他服务通过 API 或消息访问。数据库 schema、表结构和迁移属于服务实现的一部分；跨服务直连同一张业务表会把实现细节变成隐式公共 API。

共享物理数据库服务器并不等于共享数据边界。可以在同一数据库实例上建立不同 schema 或数据库，真正需要避免的是多个服务共同读写同一 schema/同一业务表。

### 2. shared database 同时制造开发期和运行期耦合

共享 schema 的迁移必须与所有访问方协调，产生开发期耦合；不同服务的查询、锁和事务又会在运行期互相影响。它可能是短期迁移过渡，但不应被误写成已经完成的服务自治。

模块化单体是重要边界：如果模块之间有清晰的私有表和访问 API，未必需要立即拆成独立数据库；“物理拆库”不是数据所有权的唯一证明。

### 3. 跨服务一致性通常用 saga，不把 2PC 当默认答案

跨多个服务或资源的业务流程可以拆成一组本地事务，用事件或命令推进下一步，并在失败时执行补偿事务。Saga 的代价是补偿语义、可见的中间状态和幂等处理；它不是把本地事务自动升级为全局原子事务。

只有真正跨服务多资源、且无法由单服务重新划界解决的场景才需要 saga。单服务内部事务或同一数据库内的简单更新不应无故引入 saga。

### 4. transactional outbox 连接业务更新与事件发布

如果服务在同一数据库事务里写入业务状态和 outbox 记录，则事务提交意味着 outbox 记录存在，异步 relay 可以继续发布事件；事务回滚则两者一起回滚。它解决的是“业务更新成功但消息没有可靠记录”的原子性断裂。

Outbox 不自动解决：重复投递、消费者幂等、事件顺序、跨区域复制或 broker 永久可用。事件驱动场景才需要它；没有异步事件发布的同步调用不必强行套 outbox。

## 渐进迁移：expand → migrate → contract

### 1. 先扩展兼容面

Parallel Change/expand-migrate-contract 的核心顺序是：

1. **Expand**：增加新表/新字段/新 API，保持旧读写仍可用；
2. **Migrate**：双写或通过 CDC 复制，校验新旧数据一致，逐步切换读路径；
3. **Contract**：新系统成为 system of record 后删除旧对象和兼容代码。

`contract` 不是可有可无的清理。删除旧对象意味着回滚窗口关闭，因此必须为每个领域单独确认数据校验、观测、备份和回滚替代方案。若不能拦截请求、无法修改旧系统或没有可验证的双写/同步路径，strangler/parallel change 只能作为待验证方案，不能照搬。

### 2. 所有权判定先于迁移顺序

一个实用判定顺序是：

```text
业务能力/Bounded Context
  -> owner service
  -> private schema/table
  -> API/event contract
  -> consumers and migration gate
```

反过来从“谁当前直接查询这张表”推断 owner 会把历史耦合误当成设计边界。一个领域只能有一个最终写入 owner；其他服务的复制表、读模型或缓存必须标注为派生数据，并有刷新/失效协议。

## 最小审计清单

对一个准备拆分或迁移的领域，至少记录：

1. bounded context 和业务 owner；
2. 当前 system of record 与最终 writer；
3. 直接读写同一表的服务、脚本和报表；
4. API、事件和 outbox 是否覆盖所有变更路径；
5. 是否需要 saga，补偿是否幂等；
6. expand/migrate/contract 的每个验证门；
7. contract 后的备份和回滚替代物；
8. 共享物理实例与共享 schema 是否被明确区分。

这份清单只提供判定标准；真实服务边界仍必须以目标仓库固定提交、schema、查询和运行配置对账。

## 来源边界与未验证内容

- Fowler 的 bounded context、Parallel Change 和 Strangler Fig 是设计模式资料，不是具体组织的架构事实；
- Microsoft 文档的双写、CDC 和 system-of-record 迁移建议需要结合目标系统的幂等、延迟和回滚能力；
- 公开资料没有提供本项目反向依赖扫描或表所有权自动审计工具链；
- 某些 Saga 论文镜像只作为历史背景，正文采用公开模式页面可复核的结论；
- 不把会话中的项目名、内部地址、表名、凭证或未公开实现写入本快照。
