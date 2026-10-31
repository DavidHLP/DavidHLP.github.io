# 英日译文语义复核

以当前 `content/blog/legacy/**/zh-cn/` 为正典，逐篇检查 67 组文章的核心主张、条件、因果、否定、术语、版本和证据强度。短文通读；长篇重点对照章节主张与适用/失败/证据边界，不将结构检查或这一轮重点审阅描述为逐字认证。原始 `src/content/`、`migration/source/`、`legacy.metadata` 保留。

| 文章 | 复核结果 |
| --- | --- |
| java-atomic-boolean | 英日一致：可见性不等于复合操作原子性；CAS 不保证多字段不变量、公平性或更快；有限重试与发布关系保留 |
| java-auto-closeable | 英日一致：所有权先于 TWR；逆序关闭、初始化失败、主/抑制异常；幂等性为建议，不是所有实现保证 |
| java-null-value | 英文一致；日文修正 TTL 或失效的选择关系，补上旧占位值遮蔽新对象的后果和稳定性前提；将“回源/穿透”改为明确日语说明 |
| containerd-tls-troubleshooting | 英日一致：TLS、系统 CA、containerd、凭证、缓存分层；skip_verify 仅临时诊断；1.x/2.x 和每个 Worker 配置条件保留 |
| database-schema-drift | 英日一致：validate 不检查实际 schema；repair 不回放/撤销 DDL；单条原子不等于整文件事务；Flyway 未实跑与 MySQL 8.4.11 实测分开 |
| microservice-data-ownership | 英文一致；日文把 strangler fig 的 intercept 误写为“遮断”，修正为中途接收并向新旧系统分流；保留 outbox 非 exactly-once、saga 非透明 2PC、contract 回滚窗口 |
| multi-service-readiness | 英日一致：running/ready、排序/依赖、失败/重启传播分离；仅显式 Compose 操作传播 restart；真实实验与 systemd 文档推导分开 |
| resicache-single-flight | 英日一致：JVM Future 与跨实例锁、锁内 double-check 分工；等待者超时不取消 leader；加载成功但写回失败仍保留业务值；不承诺全局 exactly-once |
| resicache-early-expiration-cas | 英日一致：ASYNC 只缩 TTL 到 5 秒，不直接 loader、不承诺新鲜度；格式/值版本不同；nanoTime 非全局时钟；per-key 去重不替代 Redis CAS |
| resicache-observer-nested-execution | 英文一致；日文修正 single-flight 误作“单发”及“脱敏”中式术语；保留 fragment 不重开生命周期、per-call token、ThreadLocal 快照与模型非 JVM 并发证明 |
| preface/2026-01-01-00-00-00 | 英日均保留“过早优化”的判断，作者和日期一致 |
| preface/2026-06-19-18-00-00 | 英日均保留先解决问题、后写代码的顺序，作者日期一致 |
| chronicle | 英文日期与事件一致；日文 2025-01-01 的“欢迎来到 Astro”修正为博客创建 |
| linkroll | 日文一致；英文 Svelte/GitHub 品牌口号与中文定义不同，改为相同定义，TypeScript 补上 superset |
| mysql-storage-and-deadlock | 英日一致：InnoDB/MyISAM、事务/锁能力和 5.7/8.0 版本风险；原始中文文件名是可追溯标识 |
| redis-persistence-principle | 英文一致；日文 eviction 从“退避”改为缓存追出；保留 RDB/AOF 恢复、fork/IO 与版本不固定限制 |
| frontend-mybatis-essays | 英日一致：10 篇归档、deprecated、原文保留，不升级为最佳实践或生产结论 |
| spark-bigdata-ecosystem | 英日一致：批/流、Local/Standalone/YARN/K8s、Driver/Executor；单机脚本不证明多节点容错 |
| redis-heima-practice | 英日补明穿透/击穿/雪崩三种不同失效；日文“透过”和“业务串刺”改为具体含义；保留课程、未固定版本、未复现实验的边界 |
| spring-cloud-and-boot | 英日正文一致：装配、传播/隔离、注册、网关、限流与 tracing；版本矩阵与分布式事务边界保留 |
| java-concurrency-deepdive | 英文一致；日文 phantom reference 从直译“幽灵”改为ファントム参照；保留高竞争自旋、ThreadLocal remove、JDK/GC 条件 |
| redis-business-patterns | 英日修正秒杀为 flash sales/数量限定销售；日文穿透不再误作“透过”；最小验证的“回源”不再误作 fallback；锁租约过期与 at-least-once 边界一致 |
| ulticode-generation-attempt-fence | 英日一致：generation 是逻辑代次，attemptId 是执行租约；条件更新保护结果而不阻止旧代码执行；零行更新、ACK stale 和非 exactly-once 保留 |
| ulticode-docker-sandbox | 英日一致：D-form、seccomp fail-closed、125/137/基础设施分类；源码参数不等于容器逃逸审计 |
| ulticode-async-execution-contract | 英日一致：PUBLIC_PREVIEW、单 test case、1024 条/15 分钟、payload fingerprint；跨副本/重启持久幂等明确未完成 |
| ulticode-ci-supply-chain | 英日一致：zero-infra、integration、digest/SBOM/provenance/Cosign；workflow 存在不等于运行通过或生产安全证明 |
| hbase-foundation-and-ops | 英日一致：RowKey/Family/Region、WAL、HMaster 不在读写路径；本地脚本与未固定版本限制保留 |
| jotting/kb-ingest-todo | 英文终端插件误译 endpoint，改为 terminal；日文替换“脱敏/消息”中式术语；候选与稳定知识、完成/未完成条目一致 |
| policy | 英日与当前中文一致：本地偏好、数据使用/披露、服务范围、许可与免责；本轮不修改中文政策或对现行适法性作认证 |
| docker-fundamentals | 日文一致；英文把“服务可达”写成 ps/logs 可达，修正对象；保留 volume/bind、host/bridge、Compose 与 K8s 范围 |
| ulticode-outbox-redis-streams | 英文一致；日文标题“投递”改为任务配送；50/2s、60s、10s/单条/30min 为实现参数，不是 SLO；重复与过期结果限制一致 |
| ulticode-owner-and-facts | 英日一致：五 owner/二 worker、不可变 snapshot、捕获时间/schema；快照不等于完整授权或全局一致性；测试存在非已执行 |
| llm-wiki-pattern | 英日 Query 段补齐必须引用页面或来源的要求；raw 不回写、wiki 可维护、中文正典与译文非独立事实源一致 |
| hindsight-omp-codex-integration | 英日一致：basename Bank 为逻辑分区、碰撞/非 Git 漂移、SSE/202/session/version 协议缺口；历史 0.059s 非基准，未重跑当前服务 |
| hindsight-local-deployment | 英日一致：GPU/CPU 分工、UID 1000 非 Rootless、专用目录映射前提、loopback 非禁止 egress、模型缓存/版本/硬件限制 |
| java-online-performance-debug | 英日主要判断与风险一致：先存证、采样非因果、观测成本/可回滚止损、恢复非根因；本轮不执行文中的生产诊断 |
| headroom-compress-retrieve-contract | 英日关键契约一致：0.34.0、model/messages、顶层统计/original_content、mode/CCR、frozen prefix 与空输入、带 marker 会话的回滚边界 |
| plugin-lifecycle-management | 英日关键主张一致：desired/current/ack/failure、心跳与危险操作分层、百万级是设计假设、锁不替代持久状态和幂等回执 |
| testcontainers-docker-api | 英日关键主张一致：1.20.6/3.4.1/27.5.1，UNKNOWN 回退 1.32，api.version 与 DOCKER_API_VERSION 不混淆，首个 400 与最终环境异常分开 |
| headroom-cc-switch-coexistence | 英日首段漏掉三项毕业条件，补齐 8787→15721 抓包日志、双重整理负例与 BindPaths 权限边界；provisional、分工与 OAuth 限制保留 |
| headroom-single-port-evolution | 英日关键主张一致：显式 custom 共享入口，不自动接管所有 provider；model cache、协议、请求路由与 wrapper 寿命分开；历史路由非默认承诺 |
| java-internship-interview-blog-polished | 补齐英日三项毕业条件；主要论点与证据强度一致，日文缓存“回源/穿透”术语需与 NullValue 一致 |
| ulticode-fenced-singleton-lease | 英日核心语义一致：租约过期不阻止旧执行者恢复；token 限定最终写入，外部副作用/CPU/全局 exactly-once 不在保证内 |
| jjwt-013-security-api | 英日核心语义一致：0.13.0 算法启发式与显式指定、SecretKey/PublicKey、私钥编译/运行失败边界、aud builder 不完成授权 |
| dubbo-nacos-runtime | 英日核心语义一致：接口级注册名、Nacos group 与 Dubbo group/version、all 模式、metadata；mock 与真实 RPC smoke 证据分离 |
| resicache-serialization-migration | 英日核心语义一致：字节格式/类型信任/存量迁移分开；版本 envelope、allowlist、SHADOW/DUAL/CUTOVER/ROLLBACK 与有限扫描不承诺全库事务 |
| omp-headroom-provider-proxy | 补齐英日三项毕业条件；外部控制器不复制认证或 models.db、原生 Responses、共享 CLI/Desktop provider 与请求级路由限制一致 |
| ulticode-owner-local-audit-inbox | 英日核心语义一致：本地 outbox、Stream、consumer inbox、唯一键和 ACK 窗口；不承诺跨库即时一致、零丢失或外部副作用一次执行 |
| resicache-handler-chain-and-observer | 英日核心语义一致：固定 main@2954fff、控制流/snapshot/fragment/token；ThreadLocal 不跨异步线程、fragment 不做 post、end 未见真实主结果 |
| ulticode-core-bounded-testbed | 英日核心语义一致：opt-in/allowlist、有界启动与 close-once；classloader 不等于安全隔离、迟到 context/超时竞争、源码非生产验证 |
| omp-headroom-persistence | 补齐英日三项毕业条件；Named Profile、外部意图、派生 model_cache、旧迁移 reconciler 与当前 wrapper 分开，认证状态不进入声明 |
| intranet-penetration-ssh-guide | 英日核心语义一致：连接方向/公开面/控制与数据平面/恢复；Termius 前提、remotePort、linger 不证明 SSH 或控制面健康 |
| omp-hook-extension-guide | 英日核心语义一致：17.2.15 soft nudge 非安全边界，block/reason 与 UI 状态分开；mock 非真实 TUI，封闭 segment union 不含 hook |
| mysql-performance-troubleshooting | 英日核心语义一致：指标定位分层、KILL 最后手段、命中率非健康证明、Buffer Pool/IO 不由 FORCE INDEX 修复、环境阈值有限定 |
| redis-jackson-java-time | 英日核心语义一致：固定 3.50.0/3.5.13/2.18.2，默认 Jackson 编码即失败、Redisson 默认 Kryo5、classpath 非 module 注册、内存实验非 Redis 网络验证 |
| uisa-architecture-design | 补齐英日三项毕业条件；owner/boundary、retry/幂等、异构节点模型为 provisional，规模/阈值/租户/密钥协议未被 raw 证明 |
| hindsight-troubleshooting | 英日关键语义一致：七项是历史报告、事件日期与捕获日期分离、非当前服务验证；SSE 已支持、basename 非唯一 ID、下载预算非通用阈值；日文 recall 改为检索 |
| kb-session-ingest-contract | 英日关键语义一致：c0ae74e、增量/失败不复用、v19/控制面过滤、checkpoint、manifest；placeholder 非泄漏、regex 非安全证明；日文 redaction 不再误作“脱感” |
| omp-config-and-rules-guide | 英日关键语义一致：role 默认→局部 override→故障 fallback；compaction reason/action 闭集仅适用 17.2.15，规则与入口不代选模型，静态 YAML 非运行验证 |
| resicache | 英日关键语义一致：2954fff、Java21/Boot4/Redis4/optional Redisson、pre-1.0、五种防护边界；测试存在不等于本轮执行或生产容量，ASYNC 不直接加载 |
| ulticode | 英日关键语义一致：f801a1076、owner/worker、outbox/围栏/沙箱/发布门禁与 receipt 持久缺口；无生产证据，源码与博客验证分开；同步日文 Outbox 链接术语 |
| mcp-codebase-memory-workflow | 英日关键语义一致：modern/legacy 固定版本边界、逐请求声明与 initialize 区分；图结果/coverage 都非完整性证明，运行时工具枚举与 depth 未验证 |
| database-written-test-review | 英日关键语义一致：语义先于方言/成本；Oracle、MySQL8.4/InnoDB、Spark 分开；NULL/重复/空结果、TRUNCATE 非可回滚 DELETE、Kettle 无倍数性能承诺 |
| hindsight-local-deployment-and-agent-integration | 英日归档导引与三篇正典对应；历史正文保留为当时报告，不能用其全 loopback 等旧说法覆盖已更新正典的适用限制 |
| introduction | 英日核心经历和项目机制与当前中文对应：参与/独立负责、Outbox/重试、租约/双条件围栏、Docker 约束、refresh token 哈希；未新增量化成就或生产安全承诺 |
| kb-log | 三语日期、主题与历史来源对应；新旧事实分层、不可变 raw/correction、未验证边界保留；日文 redaction/recall 术语修正，历史事件不升级为本轮执行 |
| kb-index | 六域、三路径、12 项观察板与来源登记对应；三语共同笔误 879...→15721 改为 8787→15721，末尾旧 11 项改为当前 12 项；日文术语与文章标签同步 |

## 线上功能复核

生产地址：`https://davidhlp.github.io/`。浏览器实际操作与静态源码检查分别记录。

- 英文：首页、设置、展开后的动效/渲染高级选项、RSS 目标均为英文。
- 日文：语言切换后首页分类、档案标题、辅助名称、设置及高级选项和 RSS `/ja/rss.xml` 跟随切换。
- 页面切换初始显示的 SSR 后备列表与最终交互界面需区分；当前仅确认初始化完成后的结果。
- 中文：设置、搜索筛选/排序、正文词“原子”、无结果/重置提示、详情和关联链接切换为中文。
- 英文：正文词 visibility 搜索、空结果/重置/计数、研究记录和访问日志均为英文；Knowledge Base Index 目录指向英文文章和本地化章节 ID，实际点击 A 域后 URL fragment 和章节定位生效。
- 同篇 AtomicBoolean 的三语导出链接分别为 X-1153 / X-1037 / X-1095；实际 HTTP GET 均为 200、UTF-8 BOM，标题、元数据、正文对应中文/英文/日文。浏览器下载事件未返回保存路径，不将 HTTP 检查称为下载管理器验证。

## 回归防护

两个仓库的现有 `check:content` 在原章节/示例/来源检查上增加引用块清单项计数。它能发现这次整段丢失的毕业条件；自检区分普通列表、代码中的引用示例和 HTML 引用列表。计数仍不证明翻译语义。
