# 知识库目录

本页是知识库的内容入口，不是传统博客归档。回答问题时先读这里，再沿页面的 `sources` 和交叉链接下钻。

正典维护语言：`zh-cn`。知识库遵循 [LLM-Wiki 模式](/note/llm-wiki-pattern)，维护契约见仓库根目录的 [KB.md](https://github.com/DavidHLP/DavidHLP.github.io/blob/main/KB.md) 与 [knowledge-base skill](https://github.com/DavidHLP/DavidHLP.github.io/blob/main/.claude/skills/knowledge-base.md)。

## 概念页（concept）

### 知识库自身

- [LLM-Wiki 模式：用 LLM 增量维护一个持久的个人知识库](/note/llm-wiki-pattern) — 解释 raw、wiki、schema 三层，以及 ingest、query、lint 三个操作。来源：`karpathy-llm-wiki`。
- [KB 会话摄入管道契约：增量复用、redaction v19 与不可变 raw](/note/kb-session-ingest-contract) — 固定来源身份/内容哈希、失败重处理、控制面过滤、断点账本与脱敏审计边界。

### Java 基础与后端调优

- [AtomicBoolean：原子布尔状态与 CAS 边界](/note/java-atomic-boolean) — 解释可见性、原子性与 CAS 如何构成最小状态转换，并明确何时应改用更强同步工具。
- [AutoCloseable：资源所有权与关闭异常语义](/note/java-auto-closeable) — 归纳 try-with-resources 的所有权、关闭顺序和异常传播边界。
- [NullValue：缓存 null 的占位对象与序列化边界](/note/java-null-value) — 说明空对象、单例和序列化恢复如何共同避免缓存穿透。
- [Java 线上性能排障：从症状到证据的最小决策树](/note/java-online-performance-debug) — 将 CPU/线程/GC 排障压缩为可验证的止损、定位和恢复路径。
- [Redisson/Jackson 对 LocalDateTime 的默认序列化行为与写读不对称边界](/note/redis-jackson-java-time) — 区分默认写入失败与跨 mapper/serializer 配置不一致造成的读取失败。
- [Java 并发深度：JUC、CAS、原子类、锁与线程机制](/note/java-concurrency-deepdive) — 以 CAS 为内核串联原子类、锁、线程协作与引用类型，标注高竞争与 ABA 边界。来源：`ingest-java-concurrency`。
- [Redis 业务模式：缓存、分布式锁、消息队列、Feed 流与秒杀](/note/redis-business-patterns) — 以一致性、互斥、语义为锚收敛缓存与业务模式。来源：`ingest-redis-business`。
- [Redis 持久化与原理：RDB/AOF、数据结构与高级机制](/note/redis-persistence-principle) — 区分快照与追加日志的恢复与性能边界。来源：`ingest-redis-persistence`。
- [Redis 黑马实战与进阶：分布式缓存、多级缓存与最佳实践](/note/redis-heima-practice) — 把 200+ 页课程提炼为清单，标注版本与实验缺口。来源：`ingest-redis-heima`。

### Java 安全、并发与测试

- [JJWT 0.13.0：显式固定签名算法，按 key 类型验签](/note/jjwt-013-security-api) — 区分 `signWith(Key)` 的推荐算法、显式算法、`verifyWith` key 类型和 audience builder。
- [ResiCache：observer 嵌套执行必须区分生命周期、fragment 与 scope token](/note/resicache-observer-nested-execution) — 说明 around hook、锁内 fragment、ThreadLocal 快照和 single-flight 的边界。
- [Testcontainers 1.20.6：先排查 Docker API 版本，再判断 daemon 不可用](/note/testcontainers-docker-api) — 固定 `1.32` fallback、`api.version` 和 Docker API 400 的诊断顺序。

### 微服务与 RPC

- [Dubbo + Nacos：先核对注册名、group/version，再做真实 smoke test](/note/dubbo-nacos-runtime) — 解释接口级/应用级注册、metadata、启动检查和版本匹配。
- [Spring Boot 与 Spring Cloud：自动装配、事务、注册发现、网关与可观测性](/note/spring-cloud-and-boot) — 以注册发现为锚归纳调用链路。来源：`ingest-spring-cloud`。

### 系统运维与基础设施

- [containerd TLS：证书信任链与临时跳过验证的决策](/note/containerd-tls-troubleshooting) — 区分 CA 信任、运行时配置、Kubernetes 凭证和缓存造成的失败。
- [SSH 内网访问方案：连接方向、暴露面与故障恢复](/note/intranet-penetration-ssh-guide) — 按数据流、控制面和故障恢复比较 Tunnel、Tailscale、FRP。
- [MySQL 性能排查：现象→指标→定位层→安全缓解](/note/mysql-performance-troubleshooting) — 用连接、锁、索引、事务、IO 和 Buffer Pool 建立问题模型。
- [多服务启动就绪：running、ready 与依赖/失败/重启传播](/note/multi-service-readiness) — 区分 Compose/systemd 的排序、依赖、健康门禁和失败/重启传播。
- [Docker 基础：镜像分层、容器操作与 Compose 网络](/note/docker-fundamentals) — 归纳镜像分层、数据卷、网络与 Compose 的适用与边界。来源：`ingest-docker-fundamentals`。
- [HBase 基础、架构与运维：数据模型、表设计、Shell 与 Java API](/note/hbase-foundation-and-ops) — 收敛逻辑/物理模型、架构组件与表设计，明确与 RDBMS 的取舍。来源：`ingest-hbase-foundation`。
- [MySQL 存储引擎与死锁检测](/note/mysql-storage-and-deadlock) — 区分引擎能力与死锁日志路径。来源：`ingest-mysql-storage`。
- [Spark 与大数据生态：Hadoop、HBase、Spark 运行模式与集群](/note/spark-bigdata-ecosystem) — 对比批/流引擎与 Spark 运行模式。来源：`ingest-spark-ecosystem`。

### OMP 与 Agent 工程

- [OMP 配置分层：模型角色、Agent 覆盖与降级链](/note/omp-config-and-rules-guide) — 解释配置责任边界、优先级和从声明到运行时验证的顺序。
- [OMP Hook 扩展概念：决策点提示、硬阻断与状态桥接](/note/omp-hook-extension-guide) — 区分软提示、硬护栏和状态栏事件桥接，不把 nudge 当安全边界。
- [Headroom 0.34 压缩与检索契约：字段、模式与真实端点验证](/note/headroom-compress-retrieve-contract) — 固定 `/v1/compress`、`/v1/retrieve` 的真实字段、CCR 模式和 contract test 边界。
- [MCP 协议时代边界与 codebase-memory-mcp v0.10.2 图工作流](/note/mcp-codebase-memory-workflow) — 固定 modern MCP 契约与图搜索、源码和 coverage 证据纪律。
- [Hindsight 完全本地化部署与 OMP / Codex 统一记忆集成实践](/note/hindsight-local-deployment-and-agent-integration) — 记录 Vectorize Hindsight 记忆引擎的全本地化部署（AMD ROCm GPU LLM + CPU Embedding），以及为 OMP 与 Codex 配置自适应多项目动态路由记忆的完整实施、深度踩坑与根因排查。

### 架构与工程实践

- [微服务数据所有权：先定领域 owner，再谈拆库与迁移](/note/microservice-data-ownership) — 用 bounded context、private schema、saga、outbox 和 `expand → migrate → contract` 建立迁移门禁。

- [百万级终端插件生命周期管理：状态、心跳与受控发布](/note/plugin-lifecycle-management) — 以状态、合并心跳、幂等调度、灰度和熔断组织终端控制面。
- [数据库 Schema 漂移：用 history、schema 与 query 三视图定位](/note/database-schema-drift) — 区分 Flyway history 校验、实际 schema 漂移和应用查询错误，明确 repair 不是 DDL 回滚。

## 实体页（entity）

- [OMP Headroom Bridge：外部路由控制器与原生 Codex/OMP 代理边界](/note/omp-headroom-provider-proxy) — 记录 loopback Headroom、OMP provider route、原生 Codex CLI/Desktop Responses provider、Claude Code/cc-switch 共存、事务安全、验证与回滚边界。
- [ResiCache：Spring Cache 的可编排缓存防护责任链](/note/resicache) — 归纳 `@RedisCacheable` 责任链 handler 顺序、防护默认关闭边界与序列化信封迁移成本。来源：`resicache-project-overview`。
- [UltiCode：在线评测平台的模块化架构与领域边界](/note/ulticode) — **provisional** 归纳 owner 划分、port/projection 深模块模式与判题事务不变量。来源：`ulticode-project-context`。

## 综合页（synthesis）

- [Java 后端面试复盘：项目真实性、工程机制与生产证据](/note/java-internship-interview-blog-polished) — **provisional** 综合项目表达、缓存机制和生产排障证据，不是面试题清单。
- [Headroom 单端口路由综合：入口、动态上游与验证边界](/note/headroom-single-port-evolution) — **provisional** 综合 8787 入口、动态上游和历史路由假设。
- [Headroom 路由持久化综合：Named Profile、model_cache 与恢复](/note/omp-headroom-persistence) — **provisional** 归纳状态隔离、reconciler 和恢复验证，不代表所有版本都适用。
- [Enhanced UISA：异构节点信息同步的 owner、边界与恢复模型](/note/uisa-architecture-design) — **provisional** 综合 owner、可靠性、幂等、异构能力和失败恢复的设计权衡。
- [Headroom 与 cc-switch / Claude Code 共存：单一整理与安全边界](/note/headroom-cc-switch-coexistence) — **provisional** 综合 Headroom 8787、cc-switch 15721、Claude Code `/v1/messages` 与 systemd `BindPaths` 的运行时链路和安全取舍。
- [前端与综合随笔：Vue、MyBatis、UniApp、缓存注解与环境排障](/note/frontend-mybatis-essays) — **provisional** 归档零散随笔，不作为稳定概念证据。来源：`ingest-frontend-essays`。

## 原始来源（raw）

| slug                                                | 类型                                        | 来源                                                                                                                                                                                                                       | 摘要                                                                                                           |
| --------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `karpathy-llm-wiki`                                 | gist                                        | [原始 URL](https://gist.githubusercontent.com/karpathy/442a6bf555914893e9891c11519de94f/raw/ac46de1ad27f92b28ac95459c782c07f6b8c964a/llm-wiki.md)                                                                          | 用 LLM 增量构建个人知识库的模式说明。                                                                          |
| `legacy-java-atomic-boolean`                        | legacy-blog                                 | [历史文件](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/jotting/zh-cn/java-atomic-boolean.md)                                                                  | AtomicBoolean、volatile、CAS 和并发状态管理原文。                                                              |
| `legacy-java-auto-closeable`                        | legacy-blog                                 | [历史文件](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/jotting/zh-cn/java-auto-closeable.md)                                                                  | AutoCloseable 与 try-with-resources 原文。                                                                     |
| `legacy-java-null-value`                            | legacy-blog                                 | [历史文件](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/jotting/zh-cn/java-null-value.md)                                                                      | Spring Cache NullValue 与缓存 null 原文。                                                                      |
| `legacy-java-internship-interview-blog-polished`    | legacy-blog                                 | [历史文件](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/java-internship-interview-blog-polished.md)                                                 | Java 后端实习面试复盘原文。                                                                                    |
| `legacy-java-online-performance-debug`              | legacy-blog                                 | [历史文件](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/java-online-performance-debug.md)                                                           | Java 线上 CPU、Arthas 和恢复决策原文。                                                                         |
| `legacy-containerd-tls-troubleshooting`             | legacy-blog                                 | [历史文件](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/containerd-tls-troubleshooting.md)                                                          | containerd 私有仓库 TLS 排障原文。                                                                             |
| `legacy-intranet-penetration-ssh-guide`             | legacy-blog                                 | [历史文件](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/intranet-penetration-ssh-guide.md)                                                          | Cloudflare Tunnel、Tailscale、FRP 与 SSH 原文。                                                                |
| `legacy-mysql-performance-troubleshooting`          | legacy-blog                                 | [历史文件](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/mysql-performance-troubleshooting.md)                                                       | MySQL 性能 SOP 与排障原文。                                                                                    |
| `legacy-headroom-single-port-evolution`             | legacy-blog                                 | [历史文件](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/headroom-single-port-evolution.md)                                                          | Headroom 单端口架构演进原文。                                                                                  |
| `legacy-omp-config-and-rules-guide`                 | legacy-blog                                 | [历史文件](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/omp-config-and-rules-guide.md)                                                              | OMP 配置、规则和模型路由原文。                                                                                 |
| `legacy-omp-headroom-persistence`                   | legacy-blog                                 | [历史文件](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/omp-headroom-persistence.md)                                                                | Headroom 持久化和路由恢复原文。                                                                                |
| `legacy-omp-hook-extension-guide`                   | legacy-blog                                 | [历史文件](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/omp-hook-extension-guide.md)                                                                | OMP Hook、图谱提示和状态栏扩展原文。                                                                           |
| `legacy-plugin-lifecycle-management`                | legacy-note                                 | [历史文件](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/plugin_lifecycle_management_blog.md)                                                        | 大规模终端插件生命周期管理原文。                                                                               |
| `legacy-uisa-architecture-design`                   | legacy-note                                 | [历史文件](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/uisa-architecture-design.md)                                                                | UISA 混合云与异构节点架构原文。                                                                                |
| `headroom-0-34-compress-retrieve-contract`          | upstream-source-and-contract-test           | [固定版本源码](https://github.com/headroomlabs-ai/headroom/tree/v0.34.0)                                                                                                                                                   | Headroom 0.34.0 压缩与检索 API 契约、模式和真实端点验证。                                                      |
| `kb-ingest-pipeline-v19`                            | repository                                  | [固定提交](https://github.com/DavidHLP/DavidHLP.github.io/tree/c0ae74e72982910e13c46de0b92cf8fb9a8d1751)                                                                                                                   | 会话身份/内容哈希、redaction v19、控制面过滤、partial checkpoint 与 raw manifest 契约。                        |
| `mcp-codebase-memory-workflow`                      | upstream-spec-and-source                    | [固定版本](https://github.com/DeusData/codebase-memory-mcp/tree/v0.10.2)                                                                                                                                                   | MCP 2026-07-28 规范与 codebase-memory-mcp v0.10.2 图工具契约。                                                 |
| `multi-service-readiness-contract`                  | upstream-spec-and-manpage                   | [固定规范](https://github.com/compose-spec/compose-spec/blob/11296e387ba76c77db1db768b9153a4304a3c9bd/05-services.md)                                                                                                      | Compose 与 systemd 的启动、健康、依赖和传播边界初始快照。                                                      |
| `multi-service-readiness-contract-correction`       | upstream-spec-source-and-minimal-experiment | [固定规范](https://github.com/compose-spec/compose-spec/blob/11296e387ba76c77db1db768b9153a4304a3c9bd/05-services.md)                                                                                                      | 追加固定 Docker 来源及一次性 Redis/Alpine 启动门禁实验，不覆盖初始 raw。                                       |
| `omp-17-2-15-runtime-contract`                      | upstream-source-fixed-tag                   | [固定 tag](https://github.com/can1357/oh-my-pi/tree/v17.2.15)                                                                                                                                                              | OMP 17.2.15 Hook、Compaction、statusline 与 Headroom 证据边界初始快照。                                        |
| `omp-17-2-15-runtime-contract-correction`           | upstream-source-fixed-commit                | [固定 commit](https://github.com/can1357/oh-my-pi/tree/06aecdd51f07e689e970ceaa180abe2be0c14bbb)                                                                                                                           | 追加 ExtensionRunner、事件返回契约与收窄的负证据，不覆盖初始 raw。                                             |
| `redis-jackson-java-time-contract`                  | upstream-source-and-minimal-experiment      | [固定 tag](https://github.com/redisson/redisson/tree/redisson-3.50.0)                                                                                                                                                      | Redisson/Spring Data Redis 默认 Jackson 配置与 LocalDateTime 编解码实验。                                      |
| `multi-service-readiness-safety-correction`         | upstream-source-fixed-tag                   | [固定 tag](https://github.com/docker/compose/tree/v5.4.0)                                                                                                                                                                  | 更正 readiness 验证命令的 `-f`/`-p` 项目隔离与 `down` 删除边界。                                               |
| `database-schema-drift-contract`                    | upstream-docs-and-minimal-experiment        | [Flyway 文档](https://documentation.red-gate.com/fd/validate-277578898.html)                                                                                                                                               | Flyway 13.2.0 与 MySQL 8.4 history/schema/query 漂移诊断契约。                                                 |
| `jjwt-013-security-api-contract`                    | upstream-source-fixed-tag                   | [JJWT 0.13.0 源码](https://github.com/jwtk/jjwt/tree/0.13.0)                                                                                                                                                               | `signWith`、`verifyWith`、audience builder 和 key 类型边界。                                                   |
| `testcontainers-docker-api-negotiation`             | upstream-source-fixed-commits               | [Testcontainers 1.20.6](https://github.com/testcontainers/testcontainers-java/tree/1.20.6)                                                                                                                                 | Docker API `1.32` fallback、`api.version` 和 daemon 版本门禁。                                                 |
| `dubbo-nacos-runtime-registration`                  | upstream-source-fixed-tag-and-docs          | [Dubbo 3.3.6](https://github.com/apache/dubbo/tree/dubbo-3.3.6)                                                                                                                                                            | Nacos 接口级/应用级注册、metadata 和 smoke test 边界。                                                         |
| `resicache-observer-nested-execution-contract`      | upstream-source-fixed-commit                | [ResiCache 公开提交](https://github.com/DavidHLP/ResiCache/tree/75ed279a71b17f227c3170d738eb93e50d876c8a)                                                                                                                  | observer token、锁内 fragment、ThreadLocal 快照和重入边界。                                                    |
| `microservice-domain-data-ownership`                | upstream-patterns-and-fixed-doc-snapshots   | [microservices.io database-per-service](https://microservices.io/patterns/data/database-per-service.html)                                                                                                                  | 服务私有数据、saga、outbox 和渐进迁移所有权判定。                                                              |
| `jjwt-013-security-api-contract-correction`         | upstream-source-fixed-tag-correction        | [JJWT 0.13.0 源码](https://github.com/jwtk/jjwt/tree/0.13.0)                                                                                                                                                               | 更正推荐算法位长、verifyWith 重载和 PrivateKey 异常边界，不覆盖初始 raw。                                      |
| `testcontainers-docker-api-negotiation-correction`  | upstream-source-fixed-commits-correction    | [Testcontainers 1.20.6](https://github.com/testcontainers/testcontainers-java/tree/1.20.6)                                                                                                                                 | 更正 TestEnvironment 路径与 `999.999` daemon too new 矩阵，不覆盖初始 raw。                                    |
| `dubbo-nacos-runtime-registration-correction`       | upstream-source-fixed-tag-correction        | [Dubbo 3.3.6](https://github.com/apache/dubbo/tree/dubbo-3.3.6)                                                                                                                                                            | 更正 Nacos registry URL 参数读取边界，不覆盖初始 raw。                                                         |
| `microservice-domain-data-ownership-correction`     | upstream-patterns-fixed-docs-correction     | [Microsoft pinned data considerations](https://github.com/MicrosoftDocs/architecture-center/blob/02b64c27c3a9eb6f49054297ceb6cec0fa0c68ef/docs/microservices/design/data-considerations.md)                                | 补齐 revision-pinned URL，并标明 live 模式页只按抓取快照使用。                                                 |
| `headroom-cc-switch-coexistence-runtime`            | repository-and-runtime-observation          | [固定项目提交](https://github.com/DavidHLP/omp-headroom-provider-proxy/tree/a9349b762657a28ad8b45a672b9996e831e1eedc)                                                                                                      | Claude Code 经 Headroom 到 cc-switch 的链路、单一整理边界与 `BindPaths` 安全取舍的脱敏运行时证据。             |
| `omp-headroom-provider-proxy-codex-routing-runtime` | repository-and-runtime-observation          | [固定项目提交](https://github.com/DavidHLP/omp-headroom-provider-proxy/tree/a9349b762657a28ad8b45a672b9996e831e1eedc)                                                                                                      | OMP Headroom Bridge 的 loopback proxy、OMP/Codex 路由控制器、Claude Code 共存边界和脱敏 CLI/Desktop 验证证据。 |
| `ingest-docker-fundamentals`                        | personal-notes-and-fuwari                   | [Personal-markdown-notes bbb2126](https://github.com/DavidHLP/Personal-markdown-notes/tree/bbb21260029584d41d1c667f88c5c8e2b761aad9)                                                                                       | Docker 7 篇原文聚合：镜像分层、数据卷、网络与 Compose。                                                        |
| `ingest-hbase-foundation`                           | personal-notes-and-fuwari-overlap           | [Personal bbb2126](https://github.com/DavidHLP/Personal-markdown-notes/tree/bbb21260029584d41d1c667f88c5c8e2b761aad9) + [Fuwari 07cee2b](https://github.com/DavidHLP/Fuwari/tree/07cee2baf9cee227807dcd68004c5f2493e5ac52) | HBase 18 篇原文聚合：数据模型、架构、表设计、Shell 与 Java API。                                               |
| `ingest-redis-business`                             | personal-notes-and-fuwari                   | [Personal bbb2126](https://github.com/DavidHLP/Personal-markdown-notes/tree/bbb21260029584d41d1c667f88c5c8e2b761aad9) + [Fuwari 07cee2b](https://github.com/DavidHLP/Fuwari/tree/07cee2baf9cee227807dcd68004c5f2493e5ac52) | Redis 业务 20 篇聚合：缓存、分布式锁、队列、Feed 流与秒杀。                                                    |
| `ingest-redis-persistence`                          | personal-notes-and-heima-course             | [Personal bbb2126](https://github.com/DavidHLP/Personal-markdown-notes/tree/bbb21260029584d41d1c667f88c5c8e2b761aad9) + [Fuwari 07cee2b](https://github.com/DavidHLP/Fuwari/tree/07cee2baf9cee227807dcd68004c5f2493e5ac52) | Redis 持久化与原理 3 篇：RDB/AOF 与底层结构。                                                                  |
| `ingest-redis-heima`                                | personal-notes-and-heima-course             | [Personal bbb2126](https://github.com/DavidHLP/Personal-markdown-notes/tree/bbb21260029584d41d1c667f88c5c8e2b761aad9)                                                                                                      | 黑马 Redis 6 文件（3 完全重复）聚合：快速入门、实战、多级缓存。                                                |
| `ingest-java-concurrency`                           | personal-notes-and-fuwari                   | [Fuwari 07cee2b](https://github.com/DavidHLP/Fuwari/tree/07cee2baf9cee227807dcd68004c5f2493e5ac52)                                                                                                                         | JUC/Java 15 篇聚合：CAS、原子类、锁与线程机制。                                                                |
| `ingest-spring-cloud`                               | personal-notes-and-fuwari                   | [Fuwari 07cee2b](https://github.com/DavidHLP/Fuwari/tree/07cee2baf9cee227807dcd68004c5f2493e5ac52)                                                                                                                         | Spring Boot/Cloud 13 篇聚合：自动装配、事务、网关与可观测性。                                                  |
| `ingest-spark-ecosystem`                            | personal-notes-and-fuwari                   | [Personal bbb2126](https://github.com/DavidHLP/Personal-markdown-notes/tree/bbb21260029584d41d1c667f88c5c8e2b761aad9) + [Fuwari 07cee2b](https://github.com/DavidHLP/Fuwari/tree/07cee2baf9cee227807dcd68004c5f2493e5ac52) | Spark/大数据 7 篇聚合：引擎概述、运行模式与集群脚本。                                                          |
| `ingest-mysql-storage`                              | personal-notes-and-fuwari                   | [Personal bbb2126](https://github.com/DavidHLP/Personal-markdown-notes/tree/bbb21260029584d41d1c667f88c5c8e2b761aad9) + [Fuwari 07cee2b](https://github.com/DavidHLP/Fuwari/tree/07cee2baf9cee227807dcd68004c5f2493e5ac52) | MySQL 3 篇聚合：存储引擎与死锁检测。                                                                           |
| `ingest-frontend-essays`                            | personal-notes-and-fuwari                   | [Personal bbb2126](https://github.com/DavidHLP/Personal-markdown-notes/tree/bbb21260029584d41d1c667f88c5c8e2b761aad9) + [Fuwari 07cee2b](https://github.com/DavidHLP/Fuwari/tree/07cee2baf9cee227807dcd68004c5f2493e5ac52) | 零散随笔 10 篇聚合：Vue、MyBatis、UniApp、缓存与环境排障（provisional）。                                      |
| `hindsight-local-deployment-and-agent-integration`  | upstream-source-and-minimal-experiment      | [固定版本源码](https://github.com/vectorize-io/hindsight/tree/v0.9.1)                                                                                                                                                      | Vectorize Hindsight v0.9.1 本地部署、Ollama ROCm LLM、CPU BGE-M3 嵌入、FastMCP 桥接及 OMP/Codex 配置脱敏证据。 |
| `resicache-project-overview`                        | repository-readme-fixed-commit              | [ResiCache 固定提交](https://github.com/DavidHLP/ResiCache/tree/75ed279a71b17f227c3170d738eb93e50d876c8a)                                                                                                                  | ResiCache v0.0.2 README 双语快照：定位、责任链顺序、配置边界与已知限制。                                       |
| `ulticode-project-context`                          | repository-readme-and-context-fixed-commit  | [UltiCode 固定提交](https://github.com/DavidHLP/UltiCode/tree/3f14ac8947ef0124739bf02259deb9f567eb092e)                                                                                                                    | UltiCode README + CONTEXT 领域词汇表快照：owner 划分、port/projection 与设计不变量。                           |

raw 文件位于 `src/content/raw/zh-cn/`，只供 LLM 阅读，不生成公开路由。来源快照写入后不可修改。

## 捕获收件箱

- [知识库摄入收件箱](/jotting/kb-ingest-todo) — 记录下一批个人项目来源和待回答问题；历史文章、Personal-markdown-notes / Fuwari 两仓库 107 篇原文与 ResiCache / UltiCode 项目 README/CONTEXT 已完成摄入。

## 维护规则

- 每个 active/provisional wiki 页面必须在这里登记，并提供一句话摘要。
- 每个稳定结论必须能够通过 `sources` 回溯到 raw。
- 新增来源或页面后，同步追加 [操作日志](/kb#log)。
- lint 发现孤儿页、重复页、断链或冲突时，先修证据链，再修文案。
