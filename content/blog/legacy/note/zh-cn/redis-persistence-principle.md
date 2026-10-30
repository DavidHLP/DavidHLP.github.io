---
{
  "archiveId": "X-1205",
  "title": "Redis 持久化与原理：RDB/AOF、数据结构与高级机制",
  "en": "ENGINEERING NOTES",
  "category": "工程研究",
  "department": "工程笔记",
  "date": "2026-08-20",
  "lead": "DavidHLPL",
  "clearance": "PUBLIC",
  "abstract": "区分 RDB/AOF 持久化、底层数据结构与过期淘汰，明确持久化选择的可用性与性能边界。",
  "findings": [
    "Original document: src/content/note/zh-cn/redis-persistence-principle.md",
    "Source revision: f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "Evidence status: active"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/note/zh-cn/redis-persistence-principle.md",
  "pubDate": "2026-08-20T16:00:00.000Z",
  "tags": [
    "Redis",
    "Persistence",
    "RDB",
    "AOF",
    "DataStructure",
    "Principle",
    "zh-cn",
    "note"
  ],
  "draft": false,
  "lang": "zh-CN",
  "legacy": {
    "path": "src/content/note/zh-cn/redis-persistence-principle.md",
    "revision": "f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "metadata": {
      "title": "Redis 持久化与原理：RDB/AOF、数据结构与高级机制",
      "timestamp": "2026-08-21 00:00:00+08:00",
      "series": "Java 基础与后端调优",
      "kind": "concept",
      "status": "active",
      "sources": [
        "ingest-redis-persistence"
      ],
      "related": [
        "redis-business-patterns",
        "redis-heima-practice",
        "database-schema-drift"
      ],
      "tags": [
        "Redis",
        "Persistence",
        "RDB",
        "AOF",
        "DataStructure",
        "Principle"
      ],
      "description": "区分 RDB/AOF 持久化、底层数据结构与过期淘汰，明确持久化选择的可用性与性能边界。",
      "toc": true
    }
  }
}
---


持久化与原理篇在 `Redis持久化.md`、`原理篇.md`（56KB）与 `RedisPersistence.md` 中以 RDB/AOF、数据结构与过期策略为核心。本页强调可恢复性与性能取舍。

## 核心机制

- **RDB**：定时快照，恢复快，量大时 fork 成本高，可能丢最近写入。
- **AOF**：追加命令，`everysec/always/no` 三档，`rewrite` 压缩；安全性高但重放慢。
- 原理篇进一步展开 SDS、Dict、ZipList/ListPack、QuickList 等底层结构，以及过期、淘汰（LRU/LFU）与主从复制。

## 适用条件

- 允许少量数据丢失、追求恢复速度 → RDB。
- 追求最小丢失 → AOF（或混合持久化）。

## 不适用与风险

- AOF `always` 在写密集时放大延迟；`rewrite` 期间的 fork/IO 需评估。
- 原理篇版本未固定（黑马课程版本），与线上 Redis 版本可能漂移。

## 最小验证

1. 分别开启 RDB/AOF，kill 后重启对比恢复数据与耗时。
2. `BGREWRITEAOF` 期间压测，观察延迟与 fork。

## 证据与不确定性

- **来源事实**：`ingest-redis-persistence` 原样收录 3 篇原文，原理篇未经版本固定验证。
- **本页综合**：把快照与追加日志的权衡做成选用表。
- **未确认项**：具体 Redis 版本、混合持久化开关、底层结构在不同版本有差异。

## 相关页面

- [redis-business-patterns](/blog/legacy/note/zh-cn/redis-business-patterns/)
- [redis-heima-practice](/blog/legacy/note/zh-cn/redis-heima-practice/)
- [database-schema-drift](/blog/legacy/note/zh-cn/database-schema-drift/)


## 来源与关联文档

- [Redis 持久化与原理聚合快照：RDB/AOF、数据结构与高级机制](/blog/legacy/raw/zh-cn/ingest-redis-persistence/)
- [Redis 业务模式：缓存、分布式锁、消息队列、Feed 流与秒杀](/blog/legacy/note/zh-cn/redis-business-patterns/)
- [Redis 黑马实战与进阶：分布式缓存、多级缓存与最佳实践](/blog/legacy/note/zh-cn/redis-heima-practice/)
- [数据库 Schema 漂移：用 history、schema 与 query 三视图定位](/blog/legacy/note/zh-cn/database-schema-drift/)
