---
title: "微服务数据所有权来源更正：补齐 revision-pinned 文档与 live 页面边界"
capturedAt: 2026-08-13 00:00:00+00:00
sourceType: upstream-patterns-fixed-docs-correction
sourceUrl: "https://raw.githubusercontent.com/MicrosoftDocs/architecture-center/02b64c27c3a9eb6f49054297ceb6cec0fa0c68ef/docs/microservices/design/data-considerations.md"
immutable: true
correctionOf: "microservice-domain-data-ownership"
tags: [Microservices, Bounded Context, Data Ownership, Database-per-Service, Saga, Transactional Outbox, Strangler Fig]
description: "对微服务数据所有权初始 raw 补齐 Microsoft 与 dotnet/docs 的完整 revision-pinned URL，并明确 microservices.io/Fowler 页面只按 2026-08-13 抓取的 live 补充来源处理。"
---

# 微服务数据所有权来源更正

本文件是 `microservice-domain-data-ownership` 的独立 correction raw，不覆盖、不删除初始快照。初始 raw 中的短哈希和 live URL 仍保留作为历史捕获记录；本文件提供可重建的固定链接和来源分层。

## Revision-pinned 公开来源

1. Microsoft Architecture Center `data-considerations.md`，commit `02b64c27c3a9eb6f49054297ceb6cec0fa0c68ef`：
   <https://raw.githubusercontent.com/MicrosoftDocs/architecture-center/02b64c27c3a9eb6f49054297ceb6cec0fa0c68ef/docs/microservices/design/data-considerations.md>
2. Microsoft Architecture Center `strangler-fig.md`，commit `0a1c25e5c632aaa7023db0c29dcda58db172ae44`：
   <https://raw.githubusercontent.com/MicrosoftDocs/architecture-center/0a1c25e5c632aaa7023db0c29dcda58db172ae44/docs/patterns/strangler-fig.md>
3. dotnet/docs `ddd-oriented-microservice.md`，commit `0ceaa6b57e2ccb7fbbc325a46f62b812ba4e2e4c`：
   <https://raw.githubusercontent.com/dotnet/docs/0ceaa6b57e2ccb7fbbc325a46f62b812ba4e2e4c/docs/architecture/microservices/microservice-ddd-cqrs-patterns/ddd-oriented-microservice.md>

稳定引用映射：Microsoft data considerations 支持服务数据私有边界与共享物理服务器/共享 schema 的区别；Microsoft strangler fig 支持 expand/迁移/system-of-record/删除旧对象和回滚窗口边界；dotnet/docs 支持 Bounded Context 与微服务对应关系。

## 无 revision pin 的补充来源

以下页面在 2026-08-13 抓取，只能作为本次 raw 的补充模式来源，不能当作未来仍不变的上游版本：

- <https://microservices.io/patterns/data/database-per-service.html>
- <https://microservices.io/patterns/data/shared-database.html>
- <https://microservices.io/patterns/data/saga.html>
- <https://microservices.io/patterns/data/transactional-outbox.html>
- <https://martinfowler.com/bliki/BoundedContext.html>
- <https://martinfowler.com/bliki/ParallelChange.html>
- <https://martinfowler.com/bliki/StranglerFigApplication.html>
- <https://martinfowler.com/articles/microservices.html>

需要严格取证或升级文章时，先重新获取这些 live 页面，或将相关命题限制为上述 pinned 文档能支持的范围。不得把 live 页面当前内容推断成永久 API/规范。
