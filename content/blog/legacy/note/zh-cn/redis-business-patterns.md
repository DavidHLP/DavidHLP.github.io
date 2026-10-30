---
{
  "archiveId": "X-1202",
  "title": "Redis 业务模式：缓存、分布式锁、消息队列、Feed 流与秒杀",
  "en": "ENGINEERING NOTES",
  "category": "工程研究",
  "department": "工程笔记",
  "date": "2026-08-20",
  "lead": "DavidHLPL",
  "clearance": "PUBLIC",
  "abstract": "以缓存一致性、锁正确性、消息语义为锚，收敛 Redis 在业务场景中的模式与反模式。",
  "findings": [
    "Original document: src/content/note/zh-cn/redis-business-patterns.md",
    "Source revision: f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "Evidence status: active"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/note/zh-cn/redis-business-patterns.md",
  "pubDate": "2026-08-20T16:00:00.000Z",
  "tags": [
    "Redis",
    "Cache",
    "DistributedLock",
    "MessageQueue",
    "Feed",
    "Seckill",
    "zh-cn",
    "note"
  ],
  "draft": false,
  "lang": "zh-CN",
  "legacy": {
    "path": "src/content/note/zh-cn/redis-business-patterns.md",
    "revision": "f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "metadata": {
      "title": "Redis 业务模式：缓存、分布式锁、消息队列、Feed 流与秒杀",
      "timestamp": "2026-08-21 00:00:00+08:00",
      "series": "Java 基础与后端调优",
      "kind": "concept",
      "status": "active",
      "sources": [
        "ingest-redis-business"
      ],
      "related": [
        "redis-persistence-principle",
        "java-null-value",
        "redis-jackson-java-time",
        "resicache-observer-nested-execution"
      ],
      "tags": [
        "Redis",
        "Cache",
        "DistributedLock",
        "MessageQueue",
        "Feed",
        "Seckill"
      ],
      "description": "以缓存一致性、锁正确性、消息语义为锚，收敛 Redis 在业务场景中的模式与反模式。",
      "toc": true
    }
  }
}
---


两仓库 20 篇 Redis 业务笔记互为镜像（同一主题在 Personal 与 Fuwari 各出现一次，中英文对照）。本页以缓存一致性、锁正确性、消息语义为锚，收敛为可复用模式，而非课程流水账。

## 核心机制

### 1. 缓存模型与一致性

- `Redi缓存模型和思路.md` 与 `Redis-Caching-Models.md` 区分 Cache-Aside、Read/Write-Through 与失效策略；TTL、主动淘汰与延迟双删各有取舍。
- 缓存 null（见 `java-null-value`）用占位避免穿透；`Spring Cache` 注解在 `CacheableAndCacheEvict` 中有单独说明。

### 2. 分布式锁与并发控制

- 乐观锁（CAS/版本号）适合读多写少、冲突可重试；悲观锁/Redisson 分布式锁适合临界区需互斥。
- `分布式锁.md` 与 `Distributed-Locks-with-Redis.md` 用 `SET NX EX` 原子性，`Redission` 篇引入看门狗续期；但锁的持有期、续期与可重入边界需按版本核对。

### 3. 消息队列、Feed 流与秒杀

- `Redis消息队列.md` 对比 List/Stream/PubSub；Stream 的消费组与 ACK 才是可靠语义。
- Feed 流（推/拉/推拉结合）与秒杀（库存扣减、限流、异步队列）在 `Feed流设计模型.md` 与 `Seckill-System.md` 中按场景拆解，但具体容量参数未实测。
- 工具类与 Session 替代在 `Redis工具类实现.md` 与 `Replacing-Traditional-Sessions-with-Redis.md` 中给出封装示例。

## 适用条件

- 缓存：读多写少、可容忍短暂不一致、热点可预估。
- 锁：临界区短、超时可控、锁粒度明确。
- 队列：允许 at-least-once，消费可幂等。

## 不适用与风险

- 强事务、精确一次语义、复杂查询不适合纯 Redis。
- 分布式锁的过期早于业务执行会造成双活；看门狗续期、网络分区与时钟漂移需显式评估（见 `resicache` 相关页）。
- 秒杀与 Feed 流的容量设计未做压测，不可直接套阈值。

## 最小验证

1. 缓存：命中/穿透/击穿场景分别压测，记录 TTL 与回源。
2. 锁：两进程并发 `SET NX` 抢锁，验证超时释放与 `Lua` 解锁原子性。
3. 队列：Stream 消费组 ACK/NACK，断线重放验证。

## 证据与不确定性

- **来源事实**：`ingest-redis-business` 收录 20 篇原文，含中英文重复。
- **本页综合**：把业务流水账收敛为一致性—互斥—语义三轴。
- **未确认项**：Redisson 版本、Stream 消费组参数、秒杀阈值均未固定版本验证，需按当前环境复核。

## 相关页面

- [redis-persistence-principle](/blog/legacy/note/zh-cn/redis-persistence-principle/)
- [java-null-value](/blog/legacy/note/zh-cn/java-null-value/)
- [redis-jackson-java-time](/blog/legacy/note/zh-cn/redis-jackson-java-time/)
- [resicache-observer-nested-execution](/blog/legacy/note/zh-cn/resicache-observer-nested-execution/)


## 来源与关联文档

- [Redis 业务模式聚合快照：缓存、分布式锁、消息队列、Feed 流与秒杀](/blog/legacy/raw/zh-cn/ingest-redis-business/)
- [Redis 持久化与原理：RDB/AOF、数据结构与高级机制](/blog/legacy/note/zh-cn/redis-persistence-principle/)
- [NullValue：缓存 null 的占位对象与序列化边界](/blog/legacy/note/zh-cn/java-null-value/)
- [Redisson/Jackson 对 LocalDateTime 的默认序列化行为与写读不对称边界](/blog/legacy/note/zh-cn/redis-jackson-java-time/)
- [ResiCache：observer 嵌套执行必须区分生命周期、fragment 与 scope token](/blog/legacy/note/zh-cn/resicache-observer-nested-execution/)
