# Wiki 分类裁决

以 2026-11-27 当前工作树为准。表中数字是后续补丁每项直接涉及的手工维护文件数。共享文件逐项计入，合批时去重。生成的 TXT、批次索引之外的登记与日志另列于文末。延期项计当前补丁的文件数。C 按每条现有单向边计一项，另有一条随 A14 剪除的原双向边，不单独计入裁决总数。D 的 ACCEPT 确认已经完成的改动。

| 项目 | 结论 | 影响文件数 | 置信度 |
|---|---|---:|---|
| A01 `containerd-tls-troubleshooting` | ACCEPT | 7 | 高 |
| A02 `docker-fundamentals` | ACCEPT | 7 | 高 |
| A03 `hbase-foundation-and-ops` | ACCEPT | 7 | 高 |
| A04 `hindsight-local-deployment` | ACCEPT | 7 | 高 |
| A05 `hindsight-omp-codex-integration` | ACCEPT | 7 | 高 |
| A06 `hindsight-troubleshooting` | ACCEPT | 7 | 高 |
| A07 `java-concurrency-deepdive` | ACCEPT | 7 | 高 |
| A08 `mysql-storage-and-deadlock` | ACCEPT | 7 | 高 |
| A09 `plugin-lifecycle-management` | ACCEPT | 7 | 高 |
| A10 `redis-business-patterns` | ACCEPT | 7 | 高 |
| A11 `redis-persistence-principle` | ACCEPT | 7 | 高 |
| A12 `spark-bigdata-ecosystem` | ACCEPT | 7 | 高 |
| A13 `spring-cloud-and-boot` | ACCEPT | 7 | 高 |
| A14 `redis-heima-practice` | ACCEPT | 7 | 高 |
| B01 `database-written-test-review` | DEFER | 0 | 中 |
| B02 `resicache-serialization-migration` | DEFER | 0 | 中 |
| B03 `mcp-codebase-memory-workflow` | DEFER | 0 | 中 |
| B04 `docker-fundamentals` | REJECT | 0 | 高 |
| B05 `hbase-foundation-and-ops` | REJECT | 0 | 高 |
| B06 `java-concurrency-deepdive` | DEFER | 0 | 中 |
| B07 `spring-cloud-and-boot` | DEFER | 0 | 中 |
| B08 `redis-business-patterns` | ACCEPT | 4 | 高 |
| B09 `omp-config-and-rules-guide` | REJECT | 0 | 高 |
| B10 `ulticode-ci-supply-chain` | REJECT | 0 | 高 |
| C01 `database-written-test-review → database-schema-drift` | ACCEPT | 4 | 中 |
| C02 `database-written-test-review → mysql-performance-troubleshooting` | ACCEPT | 4 | 高 |
| C03 `database-written-test-review → mysql-storage-and-deadlock` | ACCEPT | 4 | 高 |
| C04 `database-written-test-review → spark-bigdata-ecosystem` | ACCEPT | 4 | 中 |
| C05 `docker-fundamentals → containerd-tls-troubleshooting` | ACCEPT | 4 | 中 |
| C06 `docker-fundamentals → intranet-penetration-ssh-guide` | ACCEPT | 4 | 高 |
| C07 `docker-fundamentals → multi-service-readiness` | ACCEPT | 4 | 中 |
| C08 `frontend-mybatis-essays → intranet-penetration-ssh-guide` | REJECT | 0 | 中 |
| C09 `frontend-mybatis-essays → java-concurrency-deepdive` | ACCEPT | 4 | 高 |
| C10 `frontend-mybatis-essays → spring-cloud-and-boot` | ACCEPT | 4 | 高 |
| C11 `hbase-foundation-and-ops → database-schema-drift` | ACCEPT | 4 | 高 |
| C12 `hbase-foundation-and-ops → mysql-storage-and-deadlock` | REJECT | 0 | 中 |
| C13 `hindsight-local-deployment → mcp-codebase-memory-workflow` | ACCEPT | 4 | 高 |
| C14 `hindsight-local-deployment-and-agent-integration → hindsight-local-deployment` | REJECT | 0 | 高 |
| C15 `hindsight-local-deployment-and-agent-integration → hindsight-omp-codex-integration` | REJECT | 0 | 高 |
| C16 `hindsight-local-deployment-and-agent-integration → hindsight-troubleshooting` | REJECT | 0 | 高 |
| C17 `hindsight-omp-codex-integration → omp-config-and-rules-guide` | ACCEPT | 4 | 高 |
| C18 `hindsight-troubleshooting → omp-hook-extension-guide` | ACCEPT | 4 | 高 |
| C19 `java-concurrency-deepdive → java-atomic-boolean` | ACCEPT | 4 | 高 |
| C20 `java-concurrency-deepdive → java-auto-closeable` | ACCEPT | 4 | 高 |
| C21 `java-concurrency-deepdive → java-online-performance-debug` | ACCEPT | 4 | 中 |
| C22 `java-concurrency-deepdive → jjwt-013-security-api` | ACCEPT | 4 | 高 |
| C23 `mysql-storage-and-deadlock → database-schema-drift` | ACCEPT | 4 | 高 |
| C24 `mysql-storage-and-deadlock → multi-service-readiness` | ACCEPT | 4 | 高 |
| C25 `mysql-storage-and-deadlock → mysql-performance-troubleshooting` | ACCEPT | 4 | 高 |
| C26 `redis-business-patterns → redis-jackson-java-time` | ACCEPT | 4 | 高 |
| C27 `redis-business-patterns → resicache-observer-nested-execution` | ACCEPT | 4 | 高 |
| C28 `redis-heima-practice → plugin-lifecycle-management` | ACCEPT | 4 | 高 |
| C29 `redis-heima-practice → redis-business-patterns` | REJECT | 0 | 高 |
| C30 `redis-persistence-principle → database-schema-drift` | ACCEPT | 4 | 高 |
| C31 `resicache → java-null-value` | ACCEPT | 4 | 高 |
| C32 `resicache → redis-business-patterns` | ACCEPT | 4 | 高 |
| C33 `resicache → redis-jackson-java-time` | REJECT | 0 | 中 |
| C34 `resicache-early-expiration-cas → redis-business-patterns` | REJECT | 0 | 高 |
| C35 `resicache-early-expiration-cas → resicache` | ACCEPT | 4 | 高 |
| C36 `resicache-handler-chain-and-observer → resicache` | ACCEPT | 4 | 高 |
| C37 `resicache-handler-chain-and-observer → resicache-observer-nested-execution` | ACCEPT | 4 | 高 |
| C38 `resicache-serialization-migration → redis-jackson-java-time` | REJECT | 0 | 中 |
| C39 `resicache-serialization-migration → resicache` | ACCEPT | 4 | 高 |
| C40 `resicache-single-flight → redis-business-patterns` | REJECT | 0 | 高 |
| C41 `resicache-single-flight → resicache` | ACCEPT | 4 | 高 |
| C42 `spark-bigdata-ecosystem → containerd-tls-troubleshooting` | ACCEPT | 4 | 高 |
| C43 `spark-bigdata-ecosystem → multi-service-readiness` | REJECT | 0 | 中 |
| C44 `spring-cloud-and-boot → containerd-tls-troubleshooting` | ACCEPT | 4 | 高 |
| C45 `spring-cloud-and-boot → dubbo-nacos-runtime` | ACCEPT | 4 | 中 |
| C46 `spring-cloud-and-boot → microservice-data-ownership` | REJECT | 0 | 中 |
| C47 `spring-cloud-and-boot → multi-service-readiness` | ACCEPT | 4 | 中 |
| C48 `ulticode → database-schema-drift` | ACCEPT | 4 | 高 |
| C49 `ulticode → dubbo-nacos-runtime` | ACCEPT | 4 | 高 |
| C50 `ulticode → jjwt-013-security-api` | ACCEPT | 4 | 高 |
| C51 `ulticode → microservice-data-ownership` | ACCEPT | 4 | 高 |
| C52 `ulticode → multi-service-readiness` | ACCEPT | 4 | 高 |
| C53 `ulticode-core-bounded-testbed → ulticode-generation-attempt-fence` | ACCEPT | 4 | 高 |
| C54 `ulticode-core-bounded-testbed → ulticode-owner-and-facts` | REJECT | 0 | 中 |
| C55 `ulticode-fenced-singleton-lease → ulticode-generation-attempt-fence` | ACCEPT | 4 | 中 |
| C56 `ulticode-owner-local-audit-inbox → ulticode-outbox-redis-streams` | ACCEPT | 4 | 高 |
| C57 `ulticode-owner-local-audit-inbox → ulticode-owner-and-facts` | ACCEPT | 4 | 高 |
| D01 `database-written-test-review` | ACCEPT | 0 | 高 |
| D02 `headroom-cc-switch-coexistence` | ACCEPT | 0 | 高 |
| D03 `hindsight-omp-codex-integration` | ACCEPT | 0 | 高 |

**计数**　ACCEPT 62，REJECT 17，DEFER 5，共 84 项。A 为 14／0／0，B 为 1／4／5，C 为 44／13／0，D 为 3／0／0。

### 裁决口径

- `active` 的三个条件独立检查：适用实现的固定版本或提交、可复跑的验证、同主题关系的双向闭环。聚合笔记的 Git 提交能锁定原文，不能锁定它提及的 Docker、MySQL、Redis 等实现版本。测试源代码、待跑清单和历史运行记录各有不同的证明范围。降级针对当前页的整体承诺。正文内已有的窄结论及原始观察继续保留。 [分类登记:57](../DOCUMENT-CLASSIFICATION.md#L57) · [收敛设计:57](../kb-convergence-design.md#L57) · [KB.md:36](../../KB.md#L36)
- Wiki 路径为 `content/blog/legacy/note/{zh-cn,en,ja}/<slug>.md`。索引和日志路径为 `content/blog/legacy/information/{zh-cn,en,ja}/kb-{index,log}.md`。中文裁决先行，现有三语的生命周期、关系和证据字段同批同步。顶层 Wiki 字段发生变动时，在 `migration/publication-overrides.json` 以 `legacy/note/<locale>/<slug>` 同步对应字段，保留键内已有覆盖。读者使用现行 `/blog/legacy/note/<locale>/<slug>/`，既有别名继续指向同一页面。 [KB.md:17](../../KB.md#L17) · [迁移说明:5](../../migration/README.md#L5) · [迁移断言:838](../../scripts/check-content.mjs#L838)
- 当前 YAML 解析结果为每语 58 页，`active/provisional/deprecated` 为 34/22/2，`concept/entity/synthesis` 为 50/3/5。三语的 `kind/status/sources/related` 逐 slug 一致，均保有 `draft: false`。以当前发布层统计覆盖旧审计的冻结层计数。 [分类登记:13](../DOCUMENT-CLASSIFICATION.md#L13) · [发布日志:201](../../content/blog/legacy/information/zh-cn/kb-log.md#L201)

## A. 生命周期

A01–A13 执行时，将每个 slug 的三语顶层 `status` 及发布覆盖设为 `provisional`。在适用范围说明后加三个可证伪的毕业检查，同步三个索引主域状态与毕业板。A01–A13 的域不动。表中的检查是毕业要求，当前裁决以静态证据执行降级。完成 A 后，逐语核对主域与毕业板的唯一 slug 集合，验证 20 个 active、35 个 provisional、3 个 deprecated。

### A01 · containerd-tls-troubleshooting · ACCEPT

- **证据及裁决**　已有 `crictl pull` 分流、证书核对以及 1.x/2.x 配置示例。正文明确当前运行时精确版本、CA/SAN、代理和凭证绑定未知，raw 固定的是历史文稿。原有邻接互链只满足关系门。 [正文:135](../../content/blog/legacy/note/zh-cn/containerd-tls-troubleshooting.md#L135) · [正文:161](../../content/blog/legacy/note/zh-cn/containerd-tls-troubleshooting.md#L161) · [raw:216](../../src/content/raw/zh-cn/legacy-containerd-tls-troubleshooting.md#L216)
- **改动与验证**　E，保留信任链／认证分流。毕业检查①固定 containerd 1.x/2.x 各一精确版本和匿名 Registry fixture；②记录受信 CA 成功、错误 CA/SAN 失败及对应错误层；③固定 Pod 凭证正反例，并验收与 Docker 镜像基础的回链。
- **风险**　将跳过证书验证当成常设修复会扩大 Registry 信任面。保留现有临时诊断限定。

### A02 · docker-fundamentals · ACCEPT

- **证据及裁决**　有构建、挂载、Compose 三个检验意图，但缺固定 Engine/BuildKit/Compose 组合及结果。当前无入边。原文提交只定位七篇笔记。 [正文:111](../../content/blog/legacy/note/zh-cn/docker-fundamentals.md#L111) · [正文:117](../../content/blog/legacy/note/zh-cn/docker-fundamentals.md#L117) · [raw:21](../../src/content/raw/zh-cn/ingest-docker-fundamentals.md#L21)
- **改动与验证**　E。毕业检查①固定 Engine、BuildKit、Compose 与基础镜像，分别记录镜像层和二次构建的缓存命中；②用临时 volume/bind 验证重启与重建的数据差异；③验证 Compose 服务名解析、端口可达、失败场景及 C05/C07 双链。
- **风险**　`docker history` 能展示镜像层，缓存命中取构建输出。已有数据卷的删除语义须和临时 fixture 隔离。

### A03 · hbase-foundation-and-ops · ACCEPT

- **证据及裁决**　已有 Shell 多版本、Java API 与 RowKey 热点检查提纲。正文明确未固定 HBase 版本，也未验证 ZooKeeper 演进与 Phoenix。聚合 raw 的版本是笔记提交。 [正文:109](../../content/blog/legacy/note/zh-cn/hbase-foundation-and-ops.md#L109) · [raw:44](../../src/content/raw/zh-cn/ingest-hbase-foundation.md#L44) · [raw:598](../../src/content/raw/zh-cn/ingest-hbase-foundation.md#L598)
- **改动与验证**　C。毕业检查①固定 HBase、客户端及涉及的 Hadoop/ZooKeeper 组合，核对逻辑 Cell、多版本和物理归属；②用同一 fixture 重跑管理与 Region 分裂观察；③对照顺序/分散 RowKey 的 Region 负载并保留 Spark 双链。
- **风险**　将分裂、预分区或热点观测外推为通用阈值会误导表设计。Phoenix 继续列为证据边界。

### A04 · hindsight-local-deployment · ACCEPT

- **证据及裁决**　Hindsight v0.9.1 有固定标签和历史健康、检索记录。Ollama 的 `rocm` 为可变标签，模型 revision、校验和、驱动及重排证据有缺口，正文明确本轮未执行部署。 [正文:76](../../content/blog/legacy/note/zh-cn/hindsight-local-deployment.md#L76) · [正文:221](../../content/blog/legacy/note/zh-cn/hindsight-local-deployment.md#L221) · [raw:15](../../src/content/raw/zh-cn/hindsight-local-deployment-and-agent-integration.md#L15) · [raw:76](../../src/content/raw/zh-cn/hindsight-local-deployment-and-agent-integration.md#L76)
- **改动与验证**　A。毕业检查①记录 Hindsight/Ollama 镜像 digest、模型 revision/校验和以及支持的设备/驱动；②隔离预检覆盖挂载权限和依赖不可用两路；③用匿名样本验证健康、检索和重启保留，并验收与当前接入、排障页双链。
- **风险**　历史成功只适用于记录的机器与时点。模型来源、显存条件与默认配置各自核验。

### A05 · hindsight-omp-codex-integration · ACCEPT

- **证据及裁决**　Hindsight v0.9.1 固定，OMP、Codex、Node、桥接器组合未固定。正文已将 Bank 定义为逻辑分区，并记录协议缺口和历史观测边界。 [正文:75](../../content/blog/legacy/note/zh-cn/hindsight-omp-codex-integration.md#L75) · [正文:79](../../content/blog/legacy/note/zh-cn/hindsight-omp-codex-integration.md#L79) · [正文:210](../../content/blog/legacy/note/zh-cn/hindsight-omp-codex-integration.md#L210) · [raw:70](../../src/content/raw/zh-cn/hindsight-local-deployment-and-agent-integration.md#L70)
- **改动与验证**　A。毕业检查①固定服务、桥接器、两端 CLI/Node，并用匿名根目录和同名仓库验证 Bank 路由及碰撞边界；②重演完整 MCP 初始化、会话及实际响应类型，覆盖会话失败处理；③用两客户端各跑一次匿名调用并确认路由，完成 C17 回链。
- **风险**　错误恢复为 active 容易使读者把 Bank 当成租户安全隔离，或把历史桥接脚本当成已验证的通用兼容层。

### A06 · hindsight-troubleshooting · ACCEPT

- **证据及裁决**　七类失败汇在一个诊断矩阵，快检明确把脚本语法检查与握手分开。历史 v0.9.1 及观察日期可追溯，当前客户端、长连接及非默认环境未证。 [正文:76](../../content/blog/legacy/note/zh-cn/hindsight-troubleshooting.md#L76) · [正文:80](../../content/blog/legacy/note/zh-cn/hindsight-troubleshooting.md#L80) · [正文:148](../../content/blog/legacy/note/zh-cn/hindsight-troubleshooting.md#L148) · [正文:189](../../content/blog/legacy/note/zh-cn/hindsight-troubleshooting.md#L189) · [raw:92](../../src/content/raw/zh-cn/hindsight-local-deployment-and-agent-integration.md#L92)
- **改动与验证**　A。毕业检查①记录每一诊断分支适用的精确服务、模型或客户端版本；②至少在隔离环境复现权限、URL 和会话三类症状并记录区分信号；③用“语法通过但会话失败”等反例核对误判和跳转。
- **风险**　症状相同的旧故障和新版本故障可能归因不同，特别是模型和 SSE 条件。

### A07 · java-concurrency-deepdive · ACCEPT

- **证据及裁决**　JDK 8/17 的引用资料确有版本点，CAS raw 也有 ABA 例子。发布页的 CAS、锁/中断、ThreadLocal 和 GC 断言没有统一的分题环境，验证提纲未覆盖引用与锁行为。 [正文:78](../../content/blog/legacy/note/zh-cn/java-concurrency-deepdive.md#L78) · [正文:97](../../content/blog/legacy/note/zh-cn/java-concurrency-deepdive.md#L97) · [CAS raw:754](../../src/content/raw/zh-cn/ingest-java-concurrency.md#L754) · [引用 raw:4354](../../src/content/raw/zh-cn/ingest-java-concurrency.md#L4354)
- **改动与验证**　B。毕业检查①记录精确 JDK build，复跑 CAS/ABA 及版本戳对照；②复跑锁竞争、中断与池化 ThreadLocal 清理；③在声明的 JDK/GC 验证引用队列条件与非确定性，确认 C19/C21 双链。
- **风险**　章节标签 `JDK8/17` 不足以证明任意 GC 的回收时机或内部实现。现成 AtomicBoolean 窄页保有其单独证据边界。

### A08 · mysql-storage-and-deadlock · ACCEPT

- **证据及裁决**　发布页给出指定引擎、造交叉加锁及查看死锁的路线，未注明同一次实验的 MySQL 精确版本、隔离级别和锁配置；性能页返链缺失。 [正文:72](../../content/blog/legacy/note/zh-cn/mysql-storage-and-deadlock.md#L72) · [正文:85](../../content/blog/legacy/note/zh-cn/mysql-storage-and-deadlock.md#L85) · [raw:253](../../src/content/raw/zh-cn/ingest-mysql-storage.md#L253)
- **改动与验证**　C，保留一个引擎/死锁判断入口。毕业检查①固定 MySQL 小版本、引擎和隔离级别，跑引擎事务差异 fixture；②在两个匿名事务中稳定观察受害者回滚、死锁日志和重试；③用同序加锁作为对照，核对性能排查双链。
- **风险**　单次 `INNODB STATUS` 是时点证据，不能当成所有锁等待或其他引擎的根因。

### A09 · plugin-lifecycle-management · ACCEPT

- **证据及裁决**　已有状态机、幂等、灰度及五步验证计划。raw 给出设计和容量章节，正文明确未获得生产压测、端能力分布、线协议和阈值校准。与 UISA 的互链不补足这两道质量门。 [正文:100](../../content/blog/legacy/note/zh-cn/plugin-lifecycle-management.md#L100) · [正文:147](../../content/blog/legacy/note/zh-cn/plugin-lifecycle-management.md#L147) · [raw:765](../../src/content/raw/zh-cn/legacy-plugin-lifecycle-management.md#L765)
- **改动与验证**　F。毕业检查①固定一份实现或可运行最小模型，观察重复心跳和并发调度只产生一个未完成操作；②注入重复、迟到和失败回执并验证版本单调、灰度及熔断阻断；③记录离线/恢复测试及容量测试边界，维持 UISA 交叉验证。
- **风险**　设计题的百万端规模是目标。缺少数据和压测时不能承诺吞吐或可用性。

### A10 · redis-business-patterns · ACCEPT

- **证据及裁决**　三轴已有最小测试提纲。正文承认 Redisson、Stream 参数与秒杀阈值未固定，“ACK/NACK”写法还需要分清实际指令与应用失败策略。 [正文:80](../../content/blog/legacy/note/zh-cn/redis-business-patterns.md#L80) · [正文:108](../../content/blog/legacy/note/zh-cn/redis-business-patterns.md#L108) · [消息 raw:1650](../../src/content/raw/zh-cn/ingest-redis-business.md#L1650)
- **改动与验证**　C。毕业检查①固定 Redis/客户端版本，复现缓存失效与空值穿透边界；②用独立客户端验证拿锁、非持有人释放失败、超时及续期边界；③明确 `XACK`、未确认留存、回收及幂等消费各自的结果，并验收 C32/互链。课程独有选段按 B08 合入。
- **风险**　消费组只在满足保留、回收和幂等条件时给出相应交付保证。不能靠提交 ACK 名称或看门狗推导 exactly-once。

### A11 · redis-persistence-principle · ACCEPT

- **证据及裁决**　正文已有重启恢复与重写期间压测提纲，明确黑马原理、混合持久化与底层结构缺固定 Redis 版本。实际 raw 将持久化和内部结构放在不同章节。 [正文:87](../../content/blog/legacy/note/zh-cn/redis-persistence-principle.md#L87) · [正文:97](../../content/blog/legacy/note/zh-cn/redis-persistence-principle.md#L97) · [raw:56](../../src/content/raw/zh-cn/ingest-redis-persistence.md#L56) · [raw:271](../../src/content/raw/zh-cn/ingest-redis-persistence.md#L271)
- **改动与验证**　C。毕业检查①固定 Redis 版本与 RDB/AOF/混合持久化配置；②在临时实例与目录比较异常停机恢复、记录边界和耗时；③重写期间测延迟与 fork 影响，复核业务页互链和无关边已剪。
- **风险**　本地重启结果不能用来承诺掉电窗口、跨机恢复、生产延迟或任意 fsync 组合。

### A12 · spark-bigdata-ecosystem · ACCEPT

- **证据及裁决**　当前样例为 Local SparkPi、Standalone/YARN 及单机集群脚本。正文清楚保留 Spark/Hadoop、部署、队列与 HA 缺口。 [正文:74](../../content/blog/legacy/note/zh-cn/spark-bigdata-ecosystem.md#L74) · [正文:84](../../content/blog/legacy/note/zh-cn/spark-bigdata-ecosystem.md#L84) · [raw:1143](../../src/content/raw/zh-cn/ingest-spark-ecosystem.md#L1143) · [raw:2405](../../src/content/raw/zh-cn/ingest-spark-ecosystem.md#L2405)
- **改动与验证**　C。毕业检查①固定 Spark、JDK、Hadoop 和所用部署模式，重跑 Local；②声明适用模式并记录至少一个相应的 Driver/Executor 放置与 shuffle 对照，加一项失败/重试路径；③若保留 Spark SQL 导引，标记其版本并完成 C04 与 HBase 互链。
- **风险**　Compose 单机记录只支持导航或开发复盘，不能作 YARN/K8s 资源调度和多节点容错证明。

### A13 · spring-cloud-and-boot · ACCEPT

- **证据及裁决**　正文有装配、注册和过滤器提纲，缺完整 Boot/Cloud/Gateway 版本矩阵及事务验证，固定版 Dubbo 证据只覆盖其专项页。 [正文:78](../../content/blog/legacy/note/zh-cn/spring-cloud-and-boot.md#L78) · [正文:89](../../content/blog/legacy/note/zh-cn/spring-cloud-and-boot.md#L89) · [装配 raw:48](../../src/content/raw/zh-cn/ingest-spring-cloud.md#L48) · [事务 raw:331](../../src/content/raw/zh-cn/ingest-spring-cloud.md#L331)
- **改动与验证**　D。毕业检查①固定 BOM/JDK，确认自动装配候选、条件和显式退出；②测试本地事务传播、回滚和代理调用边界；③在固定网关/注册组合验证发现、predicate/filter 与未就绪反例，复核 C45/C47。
- **风险**　历史装配入口与 release train 混用会造成错误做法。局部事务或一次健康 HTTP 响应不验证分布式一致性。

### A14 · redis-heima-practice · ACCEPT

- **证据及裁决**　课程页本身定位为学习清单，秒杀、锁、队列和持久化分别已有更明确的学习入口。多级缓存与批处理有独到内容，先依 B08 选段归并再将历史课程页降为 `deprecated`。raw 清单列六文件，去重栏未标记，无法证实精确重复数。 [课程:72](../../content/blog/legacy/note/zh-cn/redis-heima-practice.md#L72) · [课程:94](../../content/blog/legacy/note/zh-cn/redis-heima-practice.md#L94) · [raw:21](../../src/content/raw/zh-cn/ingest-redis-heima.md#L21) · [业务:78](../../content/blog/legacy/note/zh-cn/redis-business-patterns.md#L78)
- **精确改动**　仅改变三语顶层状态、对应发布覆盖和索引定位 C→G。课程原页保留正文、标题、原锚点和可访问路由，首屏标为历史课程，指向业务模式和 Redis 持久化两页。正文与索引的 raw 摘要改为“清单列六文件，重复数未核实”，保留不可变 raw 和其登记行。保留 `kind: concept`、三个归档 ID `X-1173/X-1057/X-1115` 及 `draft: false`。关系按 C28/C29 与 C 的附带剪边执行。 [中文 ID:3](../../content/blog/legacy/note/zh-cn/redis-heima-practice.md#L3) · [英文 ID:3](../../content/blog/legacy/note/en/redis-heima-practice.md#L3) · [日文 ID:3](../../content/blog/legacy/note/ja/redis-heima-practice.md#L3) · [索引:106](../../content/blog/legacy/information/zh-cn/kb-index.md#L106)
- **验证与风险**　三语站内索引只在 G 登记，学习路径、主域和毕业板无课程条目，raw 表仍可追溯。测试三个旧 URL、别名、归档 ID/TXT 与章节锚点。先验收 B08 的替代导引，避免历史化时丢失多级缓存和批操作材料。

## B. 拆分与归并

### 共同的新增发布门

凡下文 DEFER 的新 slug，触发条件之一是先有可用的原生 Wiki 发布路径。现有 `validateTranslations` 强制每个已发布组都有三语，译文测试还逐页检查实例、链接和元数据一致；迁移完整性测试要求每篇公开记录都有 `legacy`，Mermaid 产物测试从迁移清单反查路由。Astro schema 同时要求独立 `archiveId`。现有 A/B08/C 补丁只改现成页面，走既有发布覆盖即可。新正典页不伪造 `legacy`，也不为过门生成空壳翻译。单列发布能力变更时，用一个真实 zh-cn 原生稿验证路由、独立归档 ID、TXT 与语言回退，再验证全部旧迁移稿及其三语校验完整。若另有明确的三语翻译任务，仍需让原生稿通过迁移完整性与产物检查。 [KB.md:34](../../KB.md#L34) · [三语门:45](../../src/content-language.ts#L45) · [正文检查:288](../../scripts/check-content.mjs#L288) · [迁移检查:825](../../scripts/check-content.mjs#L825) · [Mermaid 检查:872](../../scripts/check-content.mjs#L872) · [归档 ID schema:10](../../src/content.config.ts#L10)

触发后的拆分先发布子页、验收站内链接，再收窄旧正文。保留每种现有语言的旧标题层级、标题文本及重复标题顺序，保留编号、行内代码和引用锚点。旧片段在同一 URL 下显示短摘要并跳到对应局部；回退时恢复旧正文和关系，已有链接仍可到达旧锚点。对照实际渲染 HTML 的 `id` 集合，复核复制链接、文章目录、旧路由别名和 TXT。新子页初始均 `kind: concept, status: provisional`，`sources` 只写可解析的 raw slug，正文标小节与版本，登记至 zh-cn 主域和毕业板并与旧入口形成双链。沿用已验证的译文须有明确翻译任务。

### B01 · database-written-test-review · DEFER

- **证据及裁决**　保持现状至发布门可用，并提交覆盖同表 DML 与恢复的匿名 fixture 及预期结果。正文确有四种独立验证责任，现有长页暂承接 C 的四条回链。 [复盘:84](../../content/blog/legacy/note/zh-cn/database-written-test-review.md#L84) · [同表写:299](../../content/blog/legacy/note/zh-cn/database-written-test-review.md#L299) · [恢复:374](../../content/blog/legacy/note/zh-cn/database-written-test-review.md#L374) · [证明边界:404](../../content/blog/legacy/note/zh-cn/database-written-test-review.md#L404)
- **触发后范围**　以下四页同归 C，`sources: [database-written-test-review]`，各自复用原章节脚注；旧页保留四问框架、基础/游标/字段约束、通用索引策略与清单。旧页所有标题保留，重点为表中标题及其标题下的子标题。

| 新 slug | 使用旧正文及必须保留的旧标题锚点 | raw 出典与验收 |
|---|---|---|
| `sql-join-null-semantics` | §二「连接题：先判断保留哪些行，再判断怎样匹配」、§四「`UNION` 和 `UNION ALL`」、§六第 1/2 题，保留 §六标题与四张表约定 | [raw:47](../../src/content/raw/zh-cn/database-written-test-review.md#L47) · [raw:109](../../src/content/raw/zh-cn/database-written-test-review.md#L109) · [raw:177](../../src/content/raw/zh-cn/database-written-test-review.md#L177)。空输入、未匹配、重复及全 NULL 对照 |
| `sql-date-dialect-boundaries` | §五「日期表达式：先认方言，再计算结果」整节 | [raw:136](../../src/content/raw/zh-cn/database-written-test-review.md#L136) · [参考:478](../../content/blog/legacy/note/zh-cn/database-written-test-review.md#L478)。分别固定 Oracle、MySQL、Spark SQL 文档/实现，核对跨年、格式符和无效日期 |
| `mysql-same-table-dml` | §六第 3/4 题「把某教师所授课程的成绩改为各课程自身的平均分」「为缺少 C002 记录的学生补记录，成绩取该课程现有平均分」 | [raw:219](../../src/content/raw/zh-cn/database-written-test-review.md#L219) · [raw:247](../../src/content/raw/zh-cn/database-written-test-review.md#L247)。固定 MySQL 8.4 小版本，验证派生表物化、唯一键、全 NULL 与并发重跑 |
| `recoverable-batch-extraction` | §七「Kettle：吞吐调优与海量抽取是两个层面的问题」及两个子标题、§八「超大表增删改：先缩小工作范围，再控制执行代价」 | [raw:280](../../src/content/raw/zh-cn/database-written-test-review.md#L280) · [raw:304](../../src/content/raw/zh-cn/database-written-test-review.md#L304)。固定 PDI 和目标库，演练中断、重跑、去重与对账；大表写入保留停止/回退前提 |

- **风险**　四表并发或超大表切换的失败会造成不可逆数据变更。保留事务、业务 NULL、对账和回退限定。把文档语义、样例推导和实测分层。

### B02 · resicache-serialization-migration · DEFER

- **证据及裁决**　保持至原生发布门可用，且有固定 `2954fff` 的信任测试和迁移并发/回滚 fixture 对照。项目 raw 把白名单/前置检查和存量兼容放在同一选段，正文已经分出两条责任线。旧 README 来自 `75ed279`，仅用于历史对照。 [正文:79](../../content/blog/legacy/note/zh-cn/resicache-serialization-migration.md#L79) · [正文:176](../../content/blog/legacy/note/zh-cn/resicache-serialization-migration.md#L176) · [固定 raw:80](../../src/content/raw/zh-cn/resicache-engineering-highlights-2954fff.md#L80) · [旧 README:559](../../src/content/raw/zh-cn/resicache-project-overview.md#L559)
- **触发后范围**　新 `resicache-serialization-trust`，F，`sources: [resicache-engineering-highlights-2954fff]`，收正文 79–175、296–311 中对象信任段、312 后相应测试项。保留旧页标题「反序列化的危险发生在对象创建之前」「ResiCache 的 serializer 做了三层约束」及其 `envelope`、白名单、`streaming preflight` 子锚点。F 域旧页保持 `concept/provisional`，`sources: [resicache-engineering-highlights-2954fff, resicache-project-overview]`，保留正文 176–295 的旧格式前提、`SHADOW_READ`、`DUAL_WRITE`、`CUTOVER`、`ROLLBACK`、清空风险，以及 296–364 的共同前提与迁移部分。混合段分别留下能独立解释边界的摘要与双链。 [迁移阶段:191](../../content/blog/legacy/note/zh-cn/resicache-serialization-migration.md#L191) · [回滚:257](../../content/blog/legacy/note/zh-cn/resicache-serialization-migration.md#L257) · [测试:312](../../content/blog/legacy/note/zh-cn/resicache-serialization-migration.md#L312)
- **验证与风险**　对象页验收正常、受限及不允许输入的前置结果；迁移页验收跨阶段、重放、旧任务遇到新值及回滚保新值。核对格式版本、业务值版本和比较条件各自适用范围。配置/信任通过与并发迁移安全需要各自证据。

### B03 · mcp-codebase-memory-workflow · DEFER

- **证据及裁决**　保持至原生发布门可用，并有一个 `v0.10.2` 固定对照记录，可分别标注静态时代判定、legacy 可调用与 modern 直连限制。正文完整记录两个固定点，尚无真实二进制上的索引/查询实验。 [正文:72](../../content/blog/legacy/note/zh-cn/mcp-codebase-memory-workflow.md#L72) · [正文:100](../../content/blog/legacy/note/zh-cn/mcp-codebase-memory-workflow.md#L100) · [证据边界:167](../../content/blog/legacy/note/zh-cn/mcp-codebase-memory-workflow.md#L167) · [raw:75](../../src/content/raw/zh-cn/mcp-codebase-memory-workflow.md#L75)
- **触发后范围**　新 `mcp-modern-legacy-compatibility`，A，`sources: [mcp-codebase-memory-workflow]`，收正文 72–109 的现代逐请求元数据、旧握手、兼容矩阵、错误分层及固定版本判据。保留旧页锚点「协议时代边界：逐请求 `_meta` vs `initialize` 握手」「v0.10.2 的协议时代归属（决定性兼容事实）」和 110 起工作流、工具参数、覆盖、未证明内容；原页继续说明在运行工作流前应选择的 legacy 契约。 [工作流:110](../../content/blog/legacy/note/zh-cn/mcp-codebase-memory-workflow.md#L110) · [raw 工作流:85](../../src/content/raw/zh-cn/mcp-codebase-memory-workflow.md#L85)
- **验证与风险**　逐条校对规范 `5f5440bb` 与实现 `b377c62a`；使用同一个固定版本记录 legacy 可复跑步骤、modern 直连预期与实测，并在图工作流中复核缺口回退。版本年代或兼容矩阵不能外推给 Hindsight 或未核对的适配器。

### B04 · docker-fundamentals · REJECT

- **证据及裁决**　保持现有一页。镜像产生容器、挂载决定哪些数据跨容器生命周期、Compose 把网络与卷组合起来。当前三段已能单独定位，基础导览用同一个匿名服务例子即可验证三层。新页会主要复写十多行总览和各自未固定的课程命令。 [正文:78](../../content/blog/legacy/note/zh-cn/docker-fundamentals.md#L78) · [正文:88](../../content/blog/legacy/note/zh-cn/docker-fundamentals.md#L88) · [正文:94](../../content/blog/legacy/note/zh-cn/docker-fundamentals.md#L94) · [raw:42](../../src/content/raw/zh-cn/ingest-docker-fundamentals.md#L42)
- **范围、验证及风险**　B04 无改动。保留「镜像分层」「容器操作与数据生命周期」「网络与 Compose 编排」三个现有完整标题及锚点。A02/C05/C07 分别补证据门与入边。构建层、数据保留和服务就绪继续在原章节各自标注。

### B05 · hbase-foundation-and-ops · REJECT

- **证据及裁决**　保持现有一页。RowKey→Region→热点形成一个连续判断；当前模型、架构和设计段简短，三者共享同一排序与分区证据。raw 的 Shell 和客户端长材料留作独立原文入口，现有正文没有一个单独验证过的 Region 运维手册可直接迁出。 [正文:78](../../content/blog/legacy/note/zh-cn/hbase-foundation-and-ops.md#L78) · [正文:93](../../content/blog/legacy/note/zh-cn/hbase-foundation-and-ops.md#L93) · [raw:598](../../src/content/raw/zh-cn/ingest-hbase-foundation.md#L598) · [raw:908](../../src/content/raw/zh-cn/ingest-hbase-foundation.md#L908)
- **范围、验证及风险**　B05 无改动，保留现有「数据模型：逻辑与物理分离」「架构组件」「表设计与运维」完整标题、编号与锚点。A03 的热点和分裂验证需保留原有互相解释的前提；版本和分区限制仍可在同一页落证。

### B06 · java-concurrency-deepdive · DEFER

- **证据及裁决**　保持至原生发布门可用，且每个主题已有固定 JDK 或 GC 的独立证据和可证伪样例。正文是五个要点，只有概要不能充实三个子页；已有 `java-atomic-boolean` 继续承担二值 CAS。 [正文:78](../../content/blog/legacy/note/zh-cn/java-concurrency-deepdive.md#L78) · [最小验证:97](../../content/blog/legacy/note/zh-cn/java-concurrency-deepdive.md#L97) · [AtomicBoolean:76](../../content/blog/legacy/note/zh-cn/java-atomic-boolean.md#L76)
- **触发后范围**　B 域 `java-cas-and-aba` 收正文 80–81及 raw 的 CAS/版本戳/原子类；`java-locks-and-thread-coordination` 收 82–83 的监视器、显式锁与中断协作，保留线程诊断为入口；`java-reference-types` 收 84、95 的强/软/弱/虚引用，分 JDK 8/17 的类型语义与 GC 策略。均 `sources: [ingest-java-concurrency]`。父页保留「核心机制」「适用条件」「不适用与风险」「最小验证」「证据与不确定性」及关联导航的全部锚点并添加对应入口。 [CAS raw:50](../../src/content/raw/zh-cn/ingest-java-concurrency.md#L50) · [中断 raw:2191](../../src/content/raw/zh-cn/ingest-java-concurrency.md#L2191) · [锁 raw:3339](../../src/content/raw/zh-cn/ingest-java-concurrency.md#L3339) · [引用 raw:4354](../../src/content/raw/zh-cn/ingest-java-concurrency.md#L4354)
- **验证与风险**　CAS 用有/无 ABA 的确定性对照；锁与协作用可控同步点验证阻塞、中断和清理；引用测试记录 GC 实现并避免把一次回收时间当保证。AtomicBoolean 示例保留其原归属。

### B07 · spring-cloud-and-boot · DEFER

- **证据及裁决**　保持至原生发布门可用，且有 Boot/Cloud/BOM/JDK 固定组合，各子页有独立验证。现有正文四个概要不足以支撑三篇发布稿，尤其本地事务与跨服务一致性当前只明确边界。 [正文:78](../../content/blog/legacy/note/zh-cn/spring-cloud-and-boot.md#L78) · [边界:89](../../content/blog/legacy/note/zh-cn/spring-cloud-and-boot.md#L89)
- **触发后范围**　D 域 `spring-boot-auto-configuration` 收正文 80 的前半及装配/启动证据；`spring-transaction-boundaries` 收 80 后半、92 与事务 raw；`spring-cloud-discovery-and-gateway` 收 81–82，区分 Nacos/Consul、客户端发现、路由和健康，83 的容错/Trace 在父页保留导航。三页 `sources: [ingest-spring-cloud]`，固定版本 Dubbo 文章以独立关系链接。原页保留「核心机制」「适用条件」「不适用与风险」「最小验证」「证据与不确定性」「相关页面」「来源与关联文档」的锚点。 [装配 raw:48](../../src/content/raw/zh-cn/ingest-spring-cloud.md#L48) · [事务 raw:331](../../src/content/raw/zh-cn/ingest-spring-cloud.md#L331) · [Consul raw:3563](../../src/content/raw/zh-cn/ingest-spring-cloud.md#L3563) · [Nacos raw:4551](../../src/content/raw/zh-cn/ingest-spring-cloud.md#L4551) · [Gateway raw:5824](../../src/content/raw/zh-cn/ingest-spring-cloud.md#L5824)
- **验证与风险**　分别测试装配命中/退出、事务提交/回滚，以及服务发现/网关 predicate/filter/错误路径。避免把配置中心名称与 Dubbo interface/group/version 注册名混用。

### B08 · redis-business-patterns · ACCEPT

- **证据及裁决**　归并到现有 C 域引导页，保留业务页的缓存、锁、消息三个读者入口。课程页独有的多层命中与批操作可作为带原始来源的历史案例；其秒杀、锁和队列例子已被业务页覆盖。三轴都缺运行版本或负例，本批以已有章节承接。 [业务:80](../../content/blog/legacy/note/zh-cn/redis-business-patterns.md#L80) · [课程:81](../../content/blog/legacy/note/zh-cn/redis-heima-practice.md#L81) · [多级缓存 raw:7483](../../src/content/raw/zh-cn/ingest-redis-heima.md#L7483) · [批处理 raw:9724](../../src/content/raw/zh-cn/ingest-redis-heima.md#L9724)
- **精确改动**　保留 `redis-business-patterns`，三语在「1. 缓存模型与一致性」增加两个短案例段：一段介绍 Caffeine/JVM、Redis、Nginx/OpenResty 层次及失效责任；一段介绍 Pipeline/MGET 区别和批次受客户端、响应体与运行限制约束。先列为课程设计，保留案例边界，不搬参数、截图、秒杀/锁/消息重复内容；锁与消息段各留现有标题锚点和 A10 的验证责任。三语 `sources` 保留 `ingest-redis-business` 并追加 `ingest-redis-heima`，正文分别指向上述 raw 章节及 pinned 出典。课程旧正文、三节标题/锚点和历史入口在 A14 保留。 [业务来源:130](../../content/blog/legacy/note/zh-cn/redis-business-patterns.md#L130) · [课程三节:74](../../content/blog/legacy/note/zh-cn/redis-heima-practice.md#L74)
- **验证与风险**　检查 Redis 业务页可独立找到多级缓存失效和批处理两个边界，三语来源一致且脚注指向对应 raw。课程的本机拓扑和操作阈值不得写成通用规范。本批不注册缓存、锁、消息三个新 slug。

### B09 · omp-config-and-rules-guide · REJECT

- **证据及裁决**　保持一页。OMP 17.2.15 的两个压缩命名空间、TTSR 和事件闭集集中在一个短小节，判读目的正是配置、压缩事件与规则命中分别找证据。拆成两篇会分割同一固定版本的键表，现有材料也未独立验证 TTSR 端到端行为。 [正文:123](../../content/blog/legacy/note/zh-cn/omp-config-and-rules-guide.md#L123) · [验证顺序:137](../../content/blog/legacy/note/zh-cn/omp-config-and-rules-guide.md#L137) · [更正 raw:68](../../src/content/raw/zh-cn/omp-17-2-15-runtime-contract-correction.md#L68)
- **范围、验证及风险**　B09 无改动，保留「3. OMP 17.2.15 的 compaction、snapcompact 与 TTSR 边界」和后续验证顺序锚点；C17 在配置路由处新增 Hindsight 的专用交接。用固定 commit 的 settings/schema 和事件类型作为验收参考；用户设置、glob 命中、外部 Headroom 路由各自保留边界。

### B10 · ulticode-ci-supply-chain · REJECT

- **证据及裁决**　保持一页。static、backend 和镜像发布按交付阶段分别已有锚点，当前短篇主张是“静态准入、契约和制品验证各自阻断”。镜像半节已覆盖扫描阻断、SBOM/provenance、digest、签名与 attestation；raw 提供固定 workflow 与测试名称，尚没有独立制品链验证结果。 [正文:80](../../content/blog/legacy/note/zh-cn/ulticode-ci-supply-chain.md#L80) · [正文:101](../../content/blog/legacy/note/zh-cn/ulticode-ci-supply-chain.md#L101) · [正文:105](../../content/blog/legacy/note/zh-cn/ulticode-ci-supply-chain.md#L105) · [raw:77](../../src/content/raw/zh-cn/ulticode-engineering-highlights-f801a1076.md#L77)
- **范围、验证及风险**　B10 无改动，保留 static、backend、镜像发布、证据边界和最小验证标题锚点。可在原页逐段核对零基础设施门、集成负例、同一 digest 的签名/证明匹配。固定流水线配置不会证明每个既有制品都经对应门禁。

## C. 57 条单向 related

下列编号按当前三语共同图的 `source → target` 字典序。每项 ACCEPT 指明新增或剪除的精确方向；REJECT 保留一条明确的原方向。验收按页实读关系解释、新增锚点、原边是否仍在和剪除是否干净。相同技术域、相同包名及通用前提不足以产生反链。旧审计列出的 57 条与本轮三语独立枚举逐条一致。 [审计基线:139](wiki-audit.md#L139)

### C 的执行约定与总验收

- 每条增删同步操作侧的三语 `related`、同语正文链接及 `migration/publication-overrides.json` 对应对象下的 `related`。新增指向表定旧页的相应主题，优先使用保留的章节锚点；剪边将正文的重复等价链接一起删除。例外原边无需改动。只对具备实际机制、案例或明确诊断交接的关系加回向。
- **附带剪边（A14）**　删除 `redis-persistence-principle → redis-heima-practice`，在三语持久化页与覆盖记录执行；保留 `redis-heima-practice → redis-persistence-principle` 为 G→C 的 RDB/AOF 替代入口。旧双向边在课程归档后承担单向导引。这一项增加一个保留单向例外，不增加 57 条的裁决总数。 [持久化导航:103](../../content/blog/legacy/note/zh-cn/redis-persistence-principle.md#L103) · [课程导航:111](../../content/blog/legacy/note/zh-cn/redis-heima-practice.md#L111)
- 三组优先回链确认为 C01–C04 数据库四条，C05 containerd→Docker，以及 C35/C36/C39/C41 的 ResiCache 实体→四子页加 C37 observer 专项→责任链。C07 另把实际 Compose 入口接回 Docker。数据库复盘、Docker 与四个 ResiCache 子页因此都获得入边。旧零入度的 `frontend-mybatis-essays` 与 Hindsight 历史长文留零入度；A14 使第三个归档 `redis-heima-practice` 成为零入度。三条归档路线由 G 接入。 [旧零入度清单:172](wiki-audit.md#L172) · [G 区:167](../../content/blog/legacy/information/zh-cn/kb-index.md#L167)
- 原来每语 187 条边，其中 57 条单向。接受 23 条反链和 21 条单向噪音剪除，加上 A14 附带剪边，最终每语 **188** 条有向边，**14** 条单向（下列 13 项加 A14），三语拓扑一致。保留单向的来源为 8 条 provisional、6 条 deprecated，降级后的 active 来源没有单向边。验收非归档零入度为 0、断边为 0。C 涉及 29 个现有 Wiki slug × 3 与一个共享发布覆盖，共 88 个手工维护文件（跨行去重）。

### C01–C57 逐边裁决

#### C01 · database-written-test-review → database-schema-drift · ACCEPT

新增 `database-schema-drift → database-written-test-review`，原边保留。 用三视图定位以后再核对 DDL/表达式题设。落在 schema/query 检查旁；限定语义与迁移历史是两种证据。 核对新正文交接与版本限定，再比较双向边。 [database-written-test-review:84](../../content/blog/legacy/note/zh-cn/database-written-test-review.md#L84) · [database-schema-drift:136](../../content/blog/legacy/note/zh-cn/database-schema-drift.md#L136)

#### C02 · database-written-test-review → mysql-performance-troubleshooting · ACCEPT

新增 `mysql-performance-troubleshooting → database-written-test-review`，原边保留。 由线上索引/执行计划证据区分题设的索引选择与生产结论。落在 SQL、索引与事务节。 核对新正文交接与版本限定，再比较双向边。 [database-written-test-review:191](../../content/blog/legacy/note/zh-cn/database-written-test-review.md#L191) · [mysql-performance-troubleshooting:100](../../content/blog/legacy/note/zh-cn/mysql-performance-troubleshooting.md#L100)

#### C03 · database-written-test-review → mysql-storage-and-deadlock · ACCEPT

新增 `mysql-storage-and-deadlock → database-written-test-review`，原边保留。 由引擎/事务节到四表写入和跨事务限制，直接承接同表 DML 与并发复核。 核对新正文交接与版本限定，再比较双向边。 [database-written-test-review:299](../../content/blog/legacy/note/zh-cn/database-written-test-review.md#L299) · [mysql-storage-and-deadlock:72](../../content/blog/legacy/note/zh-cn/mysql-storage-and-deadlock.md#L72)

#### C04 · database-written-test-review → spark-bigdata-ecosystem · ACCEPT

新增 `spark-bigdata-ecosystem → database-written-test-review`，原边保留。 在引擎与运行模式之后加 Spark SQL 日期方言例证，指向复盘现有日期锚点；不把 SQL 方言结果当成部署模式证据。 核对新正文交接与版本限定，再比较双向边。 [database-written-test-review:216](../../content/blog/legacy/note/zh-cn/database-written-test-review.md#L216) · [spark-bigdata-ecosystem:74](../../content/blog/legacy/note/zh-cn/spark-bigdata-ecosystem.md#L74) · [Spark SQL raw:682](../../src/content/raw/zh-cn/ingest-spark-ecosystem.md#L682)

#### C05 · docker-fundamentals → containerd-tls-troubleshooting · ACCEPT

新增 `containerd-tls-troubleshooting → docker-fundamentals`，原边保留。 在拉取链分流处交接镜像和运行时基础，注明 Docker 构建/镜像层与 Kubernetes 节点 CA/Secret 职责。 核对新正文交接与版本限定，再比较双向边。 [docker-fundamentals:78](../../content/blog/legacy/note/zh-cn/docker-fundamentals.md#L78) · [containerd-tls-troubleshooting:78](../../content/blog/legacy/note/zh-cn/containerd-tls-troubleshooting.md#L78)

#### C06 · docker-fundamentals → intranet-penetration-ssh-guide · ACCEPT

剪除 `docker-fundamentals → intranet-penetration-ssh-guide`。 Compose 服务名与端口映射没有 SSH 隧道参与，仅挂在导航会误导网络故障分流。 核对两处链接区及段内导航残留，不删原有事实或证据。 [docker-fundamentals:94](../../content/blog/legacy/note/zh-cn/docker-fundamentals.md#L94) · [intranet-penetration-ssh-guide:76](../../content/blog/legacy/note/zh-cn/intranet-penetration-ssh-guide.md#L76)

#### C07 · docker-fundamentals → multi-service-readiness · ACCEPT

新增 `multi-service-readiness → docker-fundamentals`，原边保留。 在 Compose 门禁处补基础配置导引，连接 service/network/volume 与后续 healthcheck 的不同验证点。 核对新正文交接与版本限定，再比较双向边。 [docker-fundamentals:94](../../content/blog/legacy/note/zh-cn/docker-fundamentals.md#L94) · [multi-service-readiness:84](../../content/blog/legacy/note/zh-cn/multi-service-readiness.md#L84)

#### C08 · frontend-mybatis-essays → intranet-penetration-ssh-guide · REJECT

保留单向 `frontend-mybatis-essays → intranet-penetration-ssh-guide`，不增加反链。 归档中的 FRP 环境随笔单向跳到现行 SSH/FRP 决策；现行页不需要引回历史收纳袋。 核对源页仍能到达目标且反向没有重新出现。 [frontend-mybatis-essays:83](../../content/blog/legacy/note/zh-cn/frontend-mybatis-essays.md#L83) · [intranet-penetration-ssh-guide:108](../../content/blog/legacy/note/zh-cn/intranet-penetration-ssh-guide.md#L108)

#### C09 · frontend-mybatis-essays → java-concurrency-deepdive · ACCEPT

剪除 `frontend-mybatis-essays → java-concurrency-deepdive`。 历史 Vue/MyBatis/环境摘录无 Java 并发主张，剪。 核对两处链接区及段内导航残留，不删原有事实或证据。 [frontend-mybatis-essays:78](../../content/blog/legacy/note/zh-cn/frontend-mybatis-essays.md#L78) · [java-concurrency-deepdive:78](../../content/blog/legacy/note/zh-cn/java-concurrency-deepdive.md#L78)

#### C10 · frontend-mybatis-essays → spring-cloud-and-boot · ACCEPT

剪除 `frontend-mybatis-essays → spring-cloud-and-boot`。 Spring Cache 注解与 Boot 装配、注册/网关并非同一验证。现有正文可读，剪泛主题导航。 核对两处链接区及段内导航残留，不删原有事实或证据。 [frontend-mybatis-essays:82](../../content/blog/legacy/note/zh-cn/frontend-mybatis-essays.md#L82) · [spring-cloud-and-boot:78](../../content/blog/legacy/note/zh-cn/spring-cloud-and-boot.md#L78)

#### C11 · hbase-foundation-and-ops → database-schema-drift · ACCEPT

剪除 `hbase-foundation-and-ops → database-schema-drift`。 HBase 逻辑/物理 schema 与 Flyway history/schema/query 诊断不共用机制。 核对两处链接区及段内导航残留，不删原有事实或证据。 [hbase-foundation-and-ops:78](../../content/blog/legacy/note/zh-cn/hbase-foundation-and-ops.md#L78) · [database-schema-drift:84](../../content/blog/legacy/note/zh-cn/database-schema-drift.md#L84)

#### C12 · hbase-foundation-and-ops → mysql-storage-and-deadlock · REJECT

保留单向 `hbase-foundation-and-ops → mysql-storage-and-deadlock`，不增加反链。 HBase 原文明确以关系库作模型对照。保留单向选型出口，MySQL 死锁页无需引回。另见 [HBase raw:63](../../src/content/raw/zh-cn/ingest-hbase-foundation.md#L63)。 核对源页仍能到达目标且反向没有重新出现。 [hbase-foundation-and-ops:78](../../content/blog/legacy/note/zh-cn/hbase-foundation-and-ops.md#L78) · [mysql-storage-and-deadlock:72](../../content/blog/legacy/note/zh-cn/mysql-storage-and-deadlock.md#L72)

#### C13 · hindsight-local-deployment → mcp-codebase-memory-workflow · ACCEPT

剪除 `hindsight-local-deployment → mcp-codebase-memory-workflow`。 本地算力和容器部署未使用图索引或该实现的 fixed legacy 握手。Hindsight 自身的协议边界留在接入页。 核对两处链接区及段内导航残留，不删原有事实或证据。 [hindsight-local-deployment:80](../../content/blog/legacy/note/zh-cn/hindsight-local-deployment.md#L80) · [mcp-codebase-memory-workflow:72](../../content/blog/legacy/note/zh-cn/mcp-codebase-memory-workflow.md#L72)

#### C14 · hindsight-local-deployment-and-agent-integration → hindsight-local-deployment · REJECT

保留单向 `hindsight-local-deployment-and-agent-integration → hindsight-local-deployment`，不增加反链。 历史长文的正式替代之一，保留归档→部署，现行入口无须回指。 核对源页仍能到达目标且反向没有重新出现。 [hindsight-local-deployment-and-agent-integration:72](../../content/blog/legacy/note/zh-cn/hindsight-local-deployment-and-agent-integration.md#L72) · [hindsight-local-deployment:80](../../content/blog/legacy/note/zh-cn/hindsight-local-deployment.md#L80)

#### C15 · hindsight-local-deployment-and-agent-integration → hindsight-omp-codex-integration · REJECT

保留单向 `hindsight-local-deployment-and-agent-integration → hindsight-omp-codex-integration`，不增加反链。 历史长文的正式替代之一，保留归档→接入。历史类型表述按当时记录解读，现行 kind 由 D03 确认。 核对源页仍能到达目标且反向没有重新出现。 [hindsight-local-deployment-and-agent-integration:72](../../content/blog/legacy/note/zh-cn/hindsight-local-deployment-and-agent-integration.md#L72) · [hindsight-omp-codex-integration:79](../../content/blog/legacy/note/zh-cn/hindsight-omp-codex-integration.md#L79)

#### C16 · hindsight-local-deployment-and-agent-integration → hindsight-troubleshooting · REJECT

保留单向 `hindsight-local-deployment-and-agent-integration → hindsight-troubleshooting`，不增加反链。 历史长文的正式替代之一，保留归档→排障，现行入口无须回指。 核对源页仍能到达目标且反向没有重新出现。 [hindsight-local-deployment-and-agent-integration:72](../../content/blog/legacy/note/zh-cn/hindsight-local-deployment-and-agent-integration.md#L72) · [hindsight-troubleshooting:80](../../content/blog/legacy/note/zh-cn/hindsight-troubleshooting.md#L80)

#### C17 · hindsight-omp-codex-integration → omp-config-and-rules-guide · ACCEPT

新增 `omp-config-and-rules-guide → hindsight-omp-codex-integration`，原边保留。 在 OMP 配置分层处加接入入口，指明角色/模型配置与 `mcp.json` 客户端配置的职责分界。 核对新正文交接与版本限定，再比较双向边。 [hindsight-omp-codex-integration:214](../../content/blog/legacy/note/zh-cn/hindsight-omp-codex-integration.md#L214) · [omp-config-and-rules-guide:92](../../content/blog/legacy/note/zh-cn/omp-config-and-rules-guide.md#L92)

#### C18 · hindsight-troubleshooting → omp-hook-extension-guide · ACCEPT

剪除 `hindsight-troubleshooting → omp-hook-extension-guide`。 已记录失败归于 FastMCP 会话/路由；Hook 决策或状态桥接不解释该故障的根因。 核对两处链接区及段内导航残留，不删原有事实或证据。 [hindsight-troubleshooting:132](../../content/blog/legacy/note/zh-cn/hindsight-troubleshooting.md#L132) · [omp-hook-extension-guide:88](../../content/blog/legacy/note/zh-cn/omp-hook-extension-guide.md#L88)

#### C19 · java-concurrency-deepdive → java-atomic-boolean · ACCEPT

新增 `java-atomic-boolean → java-concurrency-deepdive`，原边保留。 二值 CAS 示例到版本戳/ABA 与原子类总览。落在最小 CAS 模型之后。 核对新正文交接与版本限定，再比较双向边。 [java-concurrency-deepdive:80](../../content/blog/legacy/note/zh-cn/java-concurrency-deepdive.md#L80) · [java-atomic-boolean:87](../../content/blog/legacy/note/zh-cn/java-atomic-boolean.md#L87)

#### C20 · java-concurrency-deepdive → java-auto-closeable · ACCEPT

剪除 `java-concurrency-deepdive → java-auto-closeable`。 ThreadLocal、中断和 Future 协作不涉及 AutoCloseable 的资源所有权或关闭异常契约。 核对两处链接区及段内导航残留，不删原有事实或证据。 [java-concurrency-deepdive:83](../../content/blog/legacy/note/zh-cn/java-concurrency-deepdive.md#L83) · [java-auto-closeable:74](../../content/blog/legacy/note/zh-cn/java-auto-closeable.md#L74)

#### C21 · java-concurrency-deepdive → java-online-performance-debug · ACCEPT

新增 `java-online-performance-debug → java-concurrency-deepdive`，原边保留。 在线线程证据发现 BLOCKED/WAITING，再进入并发页的锁与死锁机制。落在症状表之后。 核对新正文交接与版本限定，再比较双向边。 [java-concurrency-deepdive:83](../../content/blog/legacy/note/zh-cn/java-concurrency-deepdive.md#L83) · [java-online-performance-debug:98](../../content/blog/legacy/note/zh-cn/java-online-performance-debug.md#L98)

#### C22 · java-concurrency-deepdive → jjwt-013-security-api · ACCEPT

剪除 `java-concurrency-deepdive → jjwt-013-security-api`。 JUC 与 JJWT 签名 API 的算法/密钥契约无解释性连接。 核对两处链接区及段内导航残留，不删原有事实或证据。 [java-concurrency-deepdive:78](../../content/blog/legacy/note/zh-cn/java-concurrency-deepdive.md#L78) · [jjwt-013-security-api:87](../../content/blog/legacy/note/zh-cn/jjwt-013-security-api.md#L87)

#### C23 · mysql-storage-and-deadlock → database-schema-drift · ACCEPT

剪除 `mysql-storage-and-deadlock → database-schema-drift`。 引擎与运行期死锁的证据不能定位 Flyway 漂移，正文没有 DDL 失败的对照。 核对两处链接区及段内导航残留，不删原有事实或证据。 [mysql-storage-and-deadlock:72](../../content/blog/legacy/note/zh-cn/mysql-storage-and-deadlock.md#L72) · [database-schema-drift:84](../../content/blog/legacy/note/zh-cn/database-schema-drift.md#L84)

#### C24 · mysql-storage-and-deadlock → multi-service-readiness · ACCEPT

剪除 `mysql-storage-and-deadlock → multi-service-readiness`。 两事务造死锁需要可用数据库，却未把启动编排或探针作为死锁判断。 核对两处链接区及段内导航残留，不删原有事实或证据。 [mysql-storage-and-deadlock:85](../../content/blog/legacy/note/zh-cn/mysql-storage-and-deadlock.md#L85) · [multi-service-readiness:84](../../content/blog/legacy/note/zh-cn/multi-service-readiness.md#L84)

#### C25 · mysql-storage-and-deadlock → mysql-performance-troubleshooting · ACCEPT

新增 `mysql-performance-troubleshooting → mysql-storage-and-deadlock`，原边保留。 从 `LATEST DETECTED DEADLOCK` 导向可重复的交叉加锁模型，区分常见锁等待。 核对新正文交接与版本限定，再比较双向边。 [mysql-storage-and-deadlock:85](../../content/blog/legacy/note/zh-cn/mysql-storage-and-deadlock.md#L85) · [mysql-performance-troubleshooting:98](../../content/blog/legacy/note/zh-cn/mysql-performance-troubleshooting.md#L98)

#### C26 · redis-business-patterns → redis-jackson-java-time · ACCEPT

剪除 `redis-business-patterns → redis-jackson-java-time`。 业务页只解释缓存空值及失效机制，无 Java 时间编解码主张；专门边保留在 ResiCache 序列化方向。 核对两处链接区及段内导航残留，不删原有事实或证据。 [redis-business-patterns:80](../../content/blog/legacy/note/zh-cn/redis-business-patterns.md#L80) · [redis-jackson-java-time:76](../../content/blog/legacy/note/zh-cn/redis-jackson-java-time.md#L76)

#### C27 · redis-business-patterns → resicache-observer-nested-execution · ACCEPT

剪除 `redis-business-patterns → resicache-observer-nested-execution`。 业务页讨论锁过期；observer 页讨论 token/fragment。业务页对项目实例的有效出口用 C32。 核对两处链接区及段内导航残留，不删原有事实或证据。 [redis-business-patterns:105](../../content/blog/legacy/note/zh-cn/redis-business-patterns.md#L105) · [resicache-observer-nested-execution:163](../../content/blog/legacy/note/zh-cn/resicache-observer-nested-execution.md#L163)

#### C28 · redis-heima-practice → plugin-lifecycle-management · ACCEPT

剪除 `redis-heima-practice → plugin-lifecycle-management`。 Redis 课程的锁/脚本不解释插件状态机、心跳与端侧发布。 核对两处链接区及段内导航残留，不删原有事实或证据。 [redis-heima-practice:76](../../content/blog/legacy/note/zh-cn/redis-heima-practice.md#L76) · [plugin-lifecycle-management:72](../../content/blog/legacy/note/zh-cn/plugin-lifecycle-management.md#L72)

#### C29 · redis-heima-practice → redis-business-patterns · REJECT

保留单向 `redis-heima-practice → redis-business-patterns`，不增加反链。 历史课程移 G 后仍用该单向导引到业务页的多级缓存与批处理选段。 核对源页仍能到达目标且反向没有重新出现。 [redis-heima-practice:81](../../content/blog/legacy/note/zh-cn/redis-heima-practice.md#L81) · [redis-business-patterns:80](../../content/blog/legacy/note/zh-cn/redis-business-patterns.md#L80)

#### C30 · redis-persistence-principle → database-schema-drift · ACCEPT

剪除 `redis-persistence-principle → database-schema-drift`。 RDB/AOF 恢复和 Flyway schema 漂移是两套证据。 核对两处链接区及段内导航残留，不删原有事实或证据。 [redis-persistence-principle:76](../../content/blog/legacy/note/zh-cn/redis-persistence-principle.md#L76) · [database-schema-drift:84](../../content/blog/legacy/note/zh-cn/database-schema-drift.md#L84)

#### C31 · resicache → java-null-value · ACCEPT

新增 `java-null-value → resicache`，原边保留。 空值占位对照 ResiCache `cacheNullValues` 的具体实例，落在 NullValue 机制段。 核对新正文交接与版本限定，再比较双向边。 [resicache:105](../../content/blog/legacy/note/zh-cn/resicache.md#L105) · [java-null-value:78](../../content/blog/legacy/note/zh-cn/java-null-value.md#L78)

#### C32 · resicache → redis-business-patterns · ACCEPT

新增 `redis-business-patterns → resicache`，原边保留。 把业务页已有裸 `resicache` 提示改成正文链接：缓存保护、加载归属及锁边界的有界项目实例。 核对新正文交接与版本限定，再比较双向边。 [resicache:155](../../content/blog/legacy/note/zh-cn/resicache.md#L155) · [redis-business-patterns:105](../../content/blog/legacy/note/zh-cn/redis-business-patterns.md#L105)

#### C33 · resicache → redis-jackson-java-time · REJECT

保留单向 `resicache → redis-jackson-java-time`，不增加反链。 项目页向读写 codec 配置不对称的比较案例单向引出；Java 时间页证明的是另一组固定版本 codec。 核对源页仍能到达目标且反向没有重新出现。 [resicache:256](../../content/blog/legacy/note/zh-cn/resicache.md#L256) · [redis-jackson-java-time:76](../../content/blog/legacy/note/zh-cn/redis-jackson-java-time.md#L76)

#### C34 · resicache-early-expiration-cas → redis-business-patterns · REJECT

保留单向 `resicache-early-expiration-cas → redis-business-patterns`，不增加反链。 具体 stale-task/缩短 TTL 页单向引向失效策略背景。业务页无需为这个实现再开一条项目入口。 核对源页仍能到达目标且反向没有重新出现。 [resicache-early-expiration-cas:85](../../content/blog/legacy/note/zh-cn/resicache-early-expiration-cas.md#L85) · [redis-business-patterns:80](../../content/blog/legacy/note/zh-cn/redis-business-patterns.md#L80)

#### C35 · resicache-early-expiration-cas → resicache · ACCEPT

新增 `resicache → resicache-early-expiration-cas`，原边保留。 将实体的提前过期段连到专页，明确只缩 TTL、旧任务不能改新值。 核对新正文交接与版本限定，再比较双向边。 [resicache-early-expiration-cas:106](../../content/blog/legacy/note/zh-cn/resicache-early-expiration-cas.md#L106) · [resicache:211](../../content/blog/legacy/note/zh-cn/resicache.md#L211)

#### C36 · resicache-handler-chain-and-observer → resicache · ACCEPT

新增 `resicache → resicache-handler-chain-and-observer`，原边保留。 从总览责任链段进入 `HandlerResult`、顺序和 snapshot 的完整机制。 核对新正文交接与版本限定，再比较双向边。 [resicache-handler-chain-and-observer:104](../../content/blog/legacy/note/zh-cn/resicache-handler-chain-and-observer.md#L104) · [resicache:128](../../content/blog/legacy/note/zh-cn/resicache.md#L128)

#### C37 · resicache-handler-chain-and-observer → resicache-observer-nested-execution · ACCEPT

新增 `resicache-observer-nested-execution → resicache-handler-chain-and-observer`，原边保留。 旧实验模型回到责任链页对照当前实现的 fragment/scope；标注旧模型与当前提交差异。 核对新正文交接与版本限定，再比较双向边。 [resicache-handler-chain-and-observer:181](../../content/blog/legacy/note/zh-cn/resicache-handler-chain-and-observer.md#L181) · [resicache-observer-nested-execution:214](../../content/blog/legacy/note/zh-cn/resicache-observer-nested-execution.md#L214)

#### C38 · resicache-serialization-migration → redis-jackson-java-time · REJECT

保留单向 `resicache-serialization-migration → redis-jackson-java-time`，不增加反链。 混合格式中的 codec 约束可单向参考固定 Java 时间对照；codec 页未证明迁移阶段或 ResiCache 的格式兼容。 核对源页仍能到达目标且反向没有重新出现。 [resicache-serialization-migration:296](../../content/blog/legacy/note/zh-cn/resicache-serialization-migration.md#L296) · [redis-jackson-java-time:157](../../content/blog/legacy/note/zh-cn/redis-jackson-java-time.md#L157)

#### C39 · resicache-serialization-migration → resicache · ACCEPT

新增 `resicache → resicache-serialization-migration`，原边保留。 从实体的安全序列化概览进入旧数据、阶段切换和回退的专项。 核对新正文交接与版本限定，再比较双向边。 [resicache-serialization-migration:176](../../content/blog/legacy/note/zh-cn/resicache-serialization-migration.md#L176) · [resicache:256](../../content/blog/legacy/note/zh-cn/resicache.md#L256)

#### C40 · resicache-single-flight → redis-business-patterns · REJECT

保留单向 `resicache-single-flight → redis-business-patterns`，不增加反链。 锁内 double-check 的项目细节指向通用锁背景，业务页通过 C32 统一进入项目。 核对源页仍能到达目标且反向没有重新出现。 [resicache-single-flight:226](../../content/blog/legacy/note/zh-cn/resicache-single-flight.md#L226) · [redis-business-patterns:85](../../content/blog/legacy/note/zh-cn/redis-business-patterns.md#L85)

#### C41 · resicache-single-flight → resicache · ACCEPT

新增 `resicache → resicache-single-flight`，原边保留。 总览的加载归属段链接 leader/follower/reentrant 与锁内二次检查。 核对新正文交接与版本限定，再比较双向边。 [resicache-single-flight:159](../../content/blog/legacy/note/zh-cn/resicache-single-flight.md#L159) · [resicache:155](../../content/blog/legacy/note/zh-cn/resicache.md#L155)

#### C42 · spark-bigdata-ecosystem → containerd-tls-troubleshooting · ACCEPT

剪除 `spark-bigdata-ecosystem → containerd-tls-troubleshooting`。 Spark 课程的单机构建/启动脚本未解释 CRI Registry TLS 故障。 核对两处链接区及段内导航残留，不删原有事实或证据。 [spark-bigdata-ecosystem:78](../../content/blog/legacy/note/zh-cn/spark-bigdata-ecosystem.md#L78) · [containerd-tls-troubleshooting:78](../../content/blog/legacy/note/zh-cn/containerd-tls-troubleshooting.md#L78)

#### C43 · spark-bigdata-ecosystem → multi-service-readiness · REJECT

保留单向 `spark-bigdata-ecosystem → multi-service-readiness`，不增加反链。 本地 Hadoop 容器启动流程单向提示 Compose running/ready 的限制；通用就绪页无需引回未验证的集群例子。见 [Spark raw:2457](../../src/content/raw/zh-cn/ingest-spark-ecosystem.md#L2457)。 核对源页仍能到达目标且反向没有重新出现。 [spark-bigdata-ecosystem:78](../../content/blog/legacy/note/zh-cn/spark-bigdata-ecosystem.md#L78) · [multi-service-readiness:110](../../content/blog/legacy/note/zh-cn/multi-service-readiness.md#L110)

#### C44 · spring-cloud-and-boot → containerd-tls-troubleshooting · ACCEPT

剪除 `spring-cloud-and-boot → containerd-tls-troubleshooting`。 Nacos/Consul 起停与应用健康不能解释 containerd 节点证书/凭证故障。 核对两处链接区及段内导航残留，不删原有事实或证据。 [spring-cloud-and-boot:81](../../content/blog/legacy/note/zh-cn/spring-cloud-and-boot.md#L81) · [containerd-tls-troubleshooting:78](../../content/blog/legacy/note/zh-cn/containerd-tls-troubleshooting.md#L78)

#### C45 · spring-cloud-and-boot → dubbo-nacos-runtime · ACCEPT

新增 `dubbo-nacos-runtime → spring-cloud-and-boot`，原边保留。 在 Dubbo 发现路径处补 Spring Cloud/Nacos 一般发现对照，保留 Dubbo 接口级注册名、group/version 的证明边界。 核对新正文交接与版本限定，再比较双向边。 [spring-cloud-and-boot:81](../../content/blog/legacy/note/zh-cn/spring-cloud-and-boot.md#L81) · [dubbo-nacos-runtime:116](../../content/blog/legacy/note/zh-cn/dubbo-nacos-runtime.md#L116)

#### C46 · spring-cloud-and-boot → microservice-data-ownership · REJECT

保留单向 `spring-cloud-and-boot → microservice-data-ownership`，不增加反链。 从本地事务边界单向指向跨服务 owner、saga/outbox 的独立责任；通用 ownership 页无需依赖 Spring 导览。 核对源页仍能到达目标且反向没有重新出现。 [spring-cloud-and-boot:89](../../content/blog/legacy/note/zh-cn/spring-cloud-and-boot.md#L89) · [microservice-data-ownership:106](../../content/blog/legacy/note/zh-cn/microservice-data-ownership.md#L106)

#### C47 · spring-cloud-and-boot → multi-service-readiness · ACCEPT

新增 `multi-service-readiness → spring-cloud-and-boot`，原边保留。 在编排器不能代替业务就绪处给出 Spring 注册健康/路由检查入口；保留编排探针与实际可路由的区别。 核对新正文交接与版本限定，再比较双向边。 [spring-cloud-and-boot:94](../../content/blog/legacy/note/zh-cn/spring-cloud-and-boot.md#L94) · [multi-service-readiness:189](../../content/blog/legacy/note/zh-cn/multi-service-readiness.md#L189)

#### C48 · ulticode → database-schema-drift · ACCEPT

剪除 `ulticode → database-schema-drift`。 UltiCode owner/事实契约与 Flyway checksum 诊断没有当前正文证据的依赖关系。 核对两处链接区及段内导航残留，不删原有事实或证据。 [ulticode:147](../../content/blog/legacy/note/zh-cn/ulticode.md#L147) · [database-schema-drift:84](../../content/blog/legacy/note/zh-cn/database-schema-drift.md#L84)

#### C49 · ulticode → dubbo-nacos-runtime · ACCEPT

剪除 `ulticode → dubbo-nacos-runtime`。 项目 owner 设计没有解释 Dubbo interface/group/version 或 Nacos 注册实现。 核对两处链接区及段内导航残留，不删原有事实或证据。 [ulticode:147](../../content/blog/legacy/note/zh-cn/ulticode.md#L147) · [dubbo-nacos-runtime:80](../../content/blog/legacy/note/zh-cn/dubbo-nacos-runtime.md#L80)

#### C50 · ulticode → jjwt-013-security-api · ACCEPT

剪除 `ulticode → jjwt-013-security-api`。 UltiCode 正文未以 JJWT 0.13.0 的签名/验签 API 支撑项目实体结论。 核对两处链接区及段内导航残留，不删原有事实或证据。 [ulticode:147](../../content/blog/legacy/note/zh-cn/ulticode.md#L147) · [jjwt-013-security-api:87](../../content/blog/legacy/note/zh-cn/jjwt-013-security-api.md#L87)

#### C51 · ulticode → microservice-data-ownership · ACCEPT

新增 `microservice-data-ownership → ulticode`，原边保留。 在通用 owner 判定后链接 UltiCode 的已定版项目案例，区分数据 owner 与 Worker。 核对新正文交接与版本限定，再比较双向边。 [ulticode:147](../../content/blog/legacy/note/zh-cn/ulticode.md#L147) · [microservice-data-ownership:80](../../content/blog/legacy/note/zh-cn/microservice-data-ownership.md#L80)

#### C52 · ulticode → multi-service-readiness · ACCEPT

剪除 `ulticode → multi-service-readiness`。 总览的测试与系列目录未解释 Compose/systemd 就绪语义，直接边可剪；Core 专项已有独立入口。 核对两处链接区及段内导航残留，不删原有事实或证据。 [ulticode:120](../../content/blog/legacy/note/zh-cn/ulticode.md#L120) · [multi-service-readiness:84](../../content/blog/legacy/note/zh-cn/multi-service-readiness.md#L84)

#### C53 · ulticode-core-bounded-testbed → ulticode-generation-attempt-fence · ACCEPT

剪除 `ulticode-core-bounded-testbed → ulticode-generation-attempt-fence`。 Core 生命周期的 gate 是 context readiness/收尾，不实行 Submission generation/attempt 写入围栏。 核对两处链接区及段内导航残留，不删原有事实或证据。 [ulticode-core-bounded-testbed:125](../../content/blog/legacy/note/zh-cn/ulticode-core-bounded-testbed.md#L125) · [ulticode-generation-attempt-fence:83](../../content/blog/legacy/note/zh-cn/ulticode-generation-attempt-fence.md#L83)

#### C54 · ulticode-core-bounded-testbed → ulticode-owner-and-facts · REJECT

保留单向 `ulticode-core-bounded-testbed → ulticode-owner-and-facts`，不增加反链。 Core allowlist 所启用的 owner 由事实页给定义；从事实写入反指 Core 实验环境不是必要证据。 核对源页仍能到达目标且反向没有重新出现。 [ulticode-core-bounded-testbed:110](../../content/blog/legacy/note/zh-cn/ulticode-core-bounded-testbed.md#L110) · [ulticode-owner-and-facts:80](../../content/blog/legacy/note/zh-cn/ulticode-owner-and-facts.md#L80)

#### C55 · ulticode-fenced-singleton-lease → ulticode-generation-attempt-fence · ACCEPT

新增 `ulticode-generation-attempt-fence → ulticode-fenced-singleton-lease`，原边保留。 补回向对照两种 stale completion，区分判题 generation/attempt 与单例接管的 token。 核对新正文交接与版本限定，再比较双向边。 [ulticode-fenced-singleton-lease:115](../../content/blog/legacy/note/zh-cn/ulticode-fenced-singleton-lease.md#L115) · [ulticode-generation-attempt-fence:83](../../content/blog/legacy/note/zh-cn/ulticode-generation-attempt-fence.md#L83)

#### C56 · ulticode-owner-local-audit-inbox → ulticode-outbox-redis-streams · ACCEPT

新增 `ulticode-outbox-redis-streams → ulticode-owner-local-audit-inbox`，原边保留。 在 PEL 回收后指向 durable inbox 才 ACK 的 owner 审计例子，区分各自投递/接管责任。 核对新正文交接与版本限定，再比较双向边。 [ulticode-owner-local-audit-inbox:132](../../content/blog/legacy/note/zh-cn/ulticode-owner-local-audit-inbox.md#L132) · [ulticode-outbox-redis-streams:113](../../content/blog/legacy/note/zh-cn/ulticode-outbox-redis-streams.md#L113)

#### C57 · ulticode-owner-local-audit-inbox → ulticode-owner-and-facts · ACCEPT

新增 `ulticode-owner-and-facts → ulticode-owner-local-audit-inbox`，原边保留。 在五个 owner 的边界表后指向跨 owner 审计为何用本地 Outbox/Inbox 的实例。 核对新正文交接与版本限定，再比较双向边。 [ulticode-owner-local-audit-inbox:107](../../content/blog/legacy/note/zh-cn/ulticode-owner-local-audit-inbox.md#L107) · [ulticode-owner-and-facts:80](../../content/blog/legacy/note/zh-cn/ulticode-owner-and-facts.md#L80)

## D. 已实施的 kind 校正

### D01 · database-written-test-review · ACCEPT

- **证据与裁决**　保留 `concept`。正文先问题设、方言、数据和验证条件，最终形成一套复盘方法。34 条引用有价值，当前 frontmatter 只有一个 raw，正文亦明确样例推导与运行结果的缺口。 [正文:84](../../content/blog/legacy/note/zh-cn/database-written-test-review.md#L84) · [正文:413](../../content/blog/legacy/note/zh-cn/database-written-test-review.md#L413) · [raw:4](../../src/content/raw/zh-cn/database-written-test-review.md#L4) · [综合门:29](../kb-convergence-design.md#L29)
- **范围与验证**　无补丁。三语顶层 `concept`、现有 `provisional`、来源集合及覆盖记录核对一致；冻结 `legacy.metadata.kind: synthesis` 保留历史。 [中文:65](../../content/blog/legacy/note/zh-cn/database-written-test-review.md#L65) · [英文:65](../../content/blog/legacy/note/en/database-written-test-review.md#L65) · [日文:65](../../content/blog/legacy/note/ja/database-written-test-review.md#L65) · [发布覆盖:488](../../migration/publication-overrides.json#L488)
- **风险**　将引用数量算作多个独立 raw，会误标单一证据包的综合强度。

### D02 · headroom-cc-switch-coexistence · ACCEPT

- **证据与裁决**　保留 `concept`。单一整理责任组织同一部署的代理分工、路由、运行观察和回滚。唯一 raw 含项目固定点与一次运行观察，结论属于方法及版本条件。 [正文:90](../../content/blog/legacy/note/zh-cn/headroom-cc-switch-coexistence.md#L90) · [正文:155](../../content/blog/legacy/note/zh-cn/headroom-cc-switch-coexistence.md#L155) · [raw:46](../../src/content/raw/zh-cn/headroom-cc-switch-coexistence-runtime.md#L46)
- **范围与验证**　无补丁。三语顶层继续 `concept/provisional`；确认译文仍区分静态配置和实际路由的观测。保留历史 `legacy.metadata.kind`。 [中文:69](../../content/blog/legacy/note/zh-cn/headroom-cc-switch-coexistence.md#L69) · [英文:70](../../content/blog/legacy/note/en/headroom-cc-switch-coexistence.md#L70) · [日文:70](../../content/blog/legacy/note/ja/headroom-cc-switch-coexistence.md#L70) · [发布覆盖:491](../../migration/publication-overrides.json#L491)
- **风险**　共存案例仍受版本和系统权限约束。一次成功不证明所有组合的双重整理都会冲突。

### D03 · hindsight-omp-codex-integration · ACCEPT

- **证据与裁决**　保留 `concept`。页面回答两客户端怎样完成协议转换、选择逻辑 Bank 和识别协议缺口，历史 Node 示例是方法的案例。 [正文:79](../../content/blog/legacy/note/zh-cn/hindsight-omp-codex-integration.md#L79) · [协议缺口:210](../../content/blog/legacy/note/zh-cn/hindsight-omp-codex-integration.md#L210) · [raw:70](../../src/content/raw/zh-cn/hindsight-local-deployment-and-agent-integration.md#L70)
- **范围与验证**　无 kind 补丁。三语顶层均 `concept`，A05 单独改状态，保留历史 `legacy.metadata.kind: entity`。归档长文和历史日志中的分类文字可按当时记录追溯。 [中文:60](../../content/blog/legacy/note/zh-cn/hindsight-omp-codex-integration.md#L60) · [英文:60](../../content/blog/legacy/note/en/hindsight-omp-codex-integration.md#L60) · [日文:60](../../content/blog/legacy/note/ja/hindsight-omp-codex-integration.md#L60) · [发布覆盖:494](../../migration/publication-overrides.json#L494)
- **风险**　恢复为 entity 会使读者误认它是 Hindsight 项目总览。其桥接范围与运行置信度由 A05 分开管理。

## 按此裁决可直接执行的补丁清单

### P0 · 证据、入口、回退基线

1. 用现有发布稿与站点渲染记录三语旧 URL/别名、归档 ID、draft、标题/锚点、索引定位和 raw 哈希。逐项保留 `legacy.metadata`、语言、个人保护面及五个归档列。新 slug 的原生发布支持属于 B 的触发条件。P1 可沿用当前发布契约独立完成。 [保护边界:13](../DOCUMENT-CLASSIFICATION.md#L13) · [迁移断言:843](../../scripts/check-content.mjs#L843)
2. 先完成 B08 三语选段、出典及其发布覆盖，再执行 A14 的 G 归档、指向替代入口的正文导引和 C28/C29 配套关系。现有课程三语页面均继续可达。B08 与 A14 可在同一可回退补丁中提交，但应照此顺序检查。 [业务:80](../../content/blog/legacy/note/zh-cn/redis-business-patterns.md#L80) · [旧索引位置:110](../../content/blog/legacy/information/zh-cn/kb-index.md#L110)

### P1 · 生命周期、关系、登记

1. A01–A13 三语顶层状态、毕业门、主域标签、毕业观察与精确发布覆盖同步。在已需编辑的三个索引内，把现有 22 行／17 个唯一 slug 校正成真实集合：合并 `ulticode` 和四个 ResiCache 子页的重复行，保留各自已写的检查；补上 `ulticode-async-execution-contract`、`ulticode-ci-supply-chain`、`ulticode-core-bounded-testbed`、`ulticode-docker-sandbox`、`ulticode-fenced-singleton-lease` 五条，采用审计列出的检查。首行计数改为 35 个唯一 provisional，观察板说明与 A–F 保留 provisional 条目的现实相符。仅维护三个索引里的现有毕业板，无需修订这五篇正文。 [重复区:58](../../content/blog/legacy/information/zh-cn/kb-index.md#L58) · [五项验收:69](wiki-audit.md#L69) · [索引门:79](../../KB.md#L79)
2. 按 C 增 23 条、剪 22 条（含 A14 的附带剪边），在改动页三语同步相同的 `related` 及对应发布覆盖、保留剩余顺序。将新增链接放到 C 各项指定的段落，按互译正文检查。优先完成数据库四条、Docker 镜像拉取和 ResiCache 五条。清掉剪边在正文中重复的等价链接，不删除历史正文或来源链接。验收 188 条边、14 条获准单向边、0 条断边、0 篇非归档零入度。
3. 同批更新 `docs/DOCUMENT-CLASSIFICATION.md` 的当前状态/队列与裁决引用。三个发布 `kb-log.md` 各追加本次实际维护日一条，简述完成项、验证和剩余触发条件，保留原字节前缀。D 已收正的顶层 kind 逐项验证。以上手工路径去重为 **101** 个（31 个 Wiki slug × 3、3 索引、3 日志、发布覆盖、分类登记）。生成归档用既有命令再生，同一归档 ID 保持原文件名。 [分类待办:202](../DOCUMENT-CLASSIFICATION.md#L202) · [日志规则:53](../../KB.md#L53) · [归档导出:4](../../scripts/export-records.mjs#L4)
4. 由执行补丁的人在 `remote-dev` 跑 `npm run kb:lint`、`npm run build`、`npm run check:content`、`npm run check:viewport`。build 先于依赖 `dist/` 的内容检查。本补丁清单无 Cloudflare 打包改动。额外按本裁决逐语解析完整 slug 与关系、核对构建后 URL/fragment、下载和索引。遇到中途失败，按文件级补丁还原本批顶层元数据、覆盖、索引和正文导引，重新生成对应 TXT；若操作日志已经记录，追加回退记录。 [现有命令:14](../../package.json#L14) · [现有索引检查:104](../../scripts/kb-lint.ts#L104) · [渲染检查:857](../../scripts/check-content.mjs#L857)

### P2 · 按触发条件排期

- B01、B02、B03、B06、B07 保持现有路由与正文，待各自条件具备，再按 B 的精确映射分批执行。B04、B05、B09、B10 没有拆分补丁。生成新 slug 之前，先验收原生发布约束，不冒用原 archive ID 或迁移路径。
- 本轮对备忘录做只读核验。解析了三语 174 份发布页及其与覆盖记录的字段对应，独立核对 raw manifest 的 53 项 SHA-256，按裁决模拟验证状态计数、图差分、剩余例外和零入度。生产及上游实验、构建和远端命令留待对应补丁执行。
