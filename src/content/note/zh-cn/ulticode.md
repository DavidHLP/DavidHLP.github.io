---
title: "UltiCode：在线评测平台的模块化架构与领域边界"
timestamp: 2026-08-21 00:00:00+08:00
series: "架构与工程实践"
kind: entity
status: provisional
sources: ["ulticode-project-context"]
related: ["microservice-data-ownership", "dubbo-nacos-runtime", "jjwt-013-security-api", "multi-service-readiness", "database-schema-drift"]
tags: [UltiCode, OnlineJudge, DDD, Port, Projection, Dubbo, Nacos, Sandbox]
description: "以固定提交 README/CONTEXT 为证据归纳 UltiCode 的 owner 划分、port/projection 深模块模式、判题事务不变量与过渡期兼容 seam，标注架构收敛中的不确定性。"
toc: true
---

`UltiCode` 是一个全栈在线评测（Online Judge）平台，覆盖题库、竞赛、社区、成就与管理后台。后端为 Java 17 + Spring Boot 3.2.5 的 Maven reactor 多模块（auth/admin/app/notification/judge/submission），前端为 Vue 3 + TypeScript 严格模式的 Console 与 Management 双应用。本页描述公开仓库 main 固定提交 `3f14ac89` 的声明状态；该仓库处于架构收敛期，页面整体标记 `provisional`。

## 核心机制

### Owner 划分与网关

- 每个 API 网关路由对应一个 owner：Auth :9101、Admin :9102、App :9103、Notification :9105，JWT + Redis Session 鉴权。
- Submission 是兼容 owner seam（:9106 / Dubbo 20886 内部），处于过渡期、无业务 HTTP；Judge worker 独立进程消费 Redis Streams。
- 基础设施：MySQL 9.1（Flyway 迁移）、Redis 7、Nacos 2.3.2 注册配置中心（运行时注册边界见 [Dubbo + Nacos](/note/dubbo-nacos-runtime)）。

### Port / Projection 深模块模式

- **Port**：由消费方模块拥有的接口，由提供方模块适配实现（依赖倒置），如 `ContestSubmissionPort`、`TokenBlacklistPort`、`CurrentUserProvider`。`TokenBlacklistPort` 只暴露读侧且 fail-closed——Redis 故障时撤销令牌不能漏过。
- **Projection**：每个领域一个深模块，拥有实体→VO 投影与读侧聚合（`ProblemProjection`、`AdminXxxProjection` 系列），把 VO 塑形从编排服务中下沉。
- **Realtime push seam**：六个消费方拥有的推送 port 反转 WebSocket 路径，删除了旧 `RealtimeService` god service。

### 判题事务不变量

- Submission 与 ContestSubmission 在**同一事务**内同步记录（D-04）；赛后计分走 AFTER_COMMIT 事件驱动。
- ContestSubmission 仅在竞赛 RUNNING 且参与者 STARTED 时记录（D-05/D-06）；虚拟赛 Accepted 不触发成就（R6.3/F-08）。
- HIDDEN 测试用例内容永不泄露给用户（P0-1）。

## 适用条件

- 需要练习、竞赛、社区、管理闭环的刷题/内部培训平台场景。
- 接受多模块单仓 + 模块私有领域（`modules/`）+ 显式 port 边界的协作方式。

## 不适用与风险

- 架构文档自述处于收敛期：submission 兼容 seam、admin read model seam 均有"future phases"待办，接口形态可能继续变化。
- 原 `wiki/concepts/` ADR 层已于 2026-07-09 退役，设计依据散落在 commit message 与源码 Javadoc 中，追溯成本高。
- README 的端口与版本反映开发态，未经生产部署验证。

## 最小验证

1. 按 docker-compose 启动基础设施后跑 `scripts/dev` 初始化流程，确认 Nacos 注册与网关路由健康（多服务就绪门禁见 [multi-service-readiness](/note/multi-service-readiness)）。
2. 提交一份代码验证 Submission → Judge outbox → verdict → AFTER_COMMIT 计分链路。
3. 用 Flyway 迁移历史核对本地 schema 是否漂移（方法见 [数据库 Schema 漂移](/note/database-schema-drift)）。

## 证据与不确定性

- **来源事实**：架构图、owner 划分、领域词汇表、设计不变量均来自固定提交 `3f14ac89` 的 README 与 CONTEXT.md（`ulticode-project-context`）。
- **本页综合**：把词汇表中的模块概念归纳为"owner—seam—不变量"三层。
- **未确认项**：本地工作区领先 origin/main 25 个提交的未发布重构未纳入；沙箱 D-form 隔离强度、判题吞吐、榜单规则正确性均未做独立实验复核。

## 相关页面

- [microservice-data-ownership](/note/microservice-data-ownership)
- [dubbo-nacos-runtime](/note/dubbo-nacos-runtime)
- [jjwt-013-security-api](/note/jjwt-013-security-api)
- [multi-service-readiness](/note/multi-service-readiness)
- [database-schema-drift](/note/database-schema-drift)
