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

## 逐段复核补充（2026-10-31）

本轮从 `fb23f4c` 继续，逐段阅读中文、英文、日文正文，连同表格、列表、代码注释、图表文字和证据限制。阅读输出仅压缩空格及链接 URL，不删正文段落；历史桥接器的长代码块先确认三语逐字相同，再共读原代码。长文清单按中文正文去除围栏代码块和链接 URL 后不少于 3000 字符筛选，共 34 组，以下全部完成；这是中文正典的翻译一致性复核，不是历史实验复跑或独立事实考据。

| 文章 | 已读章节块（含导语、参考） | 逐段结果 |
| --- | --- | --- |
| ulticode | 13 | 日文发布凭据术语修正。 |
| resicache | 13 | 完整对照，未发现新的语义差异。 |
| kb-session-ingest-contract | 15 | 日文落盘、字符长度、台账及私网术语修正；三语脱敏表的分隔列和主机正则竖线修复。 |
| mcp-codebase-memory-workflow | 10 | 协议表、伪调用和完整性限定一致。 |
| mysql-performance-troubleshooting | 8 | 全部 SQL、阈值、风险和证据限定一致。 |
| containerd-tls-troubleshooting | 8 | 信任、认证、缓存及版本前提一致。 |
| database-schema-drift | 10 | 诊断视图、命令及证据表一致，保留中文原有历史措辞。 |
| multi-service-readiness | 10 | 补译英日文四处安全与诊断注释，命令不变。 |
| intranet-penetration-ssh-guide | 8 | 去除英日文擅加的未授权登录含义，恢复登录中转机而非内网机。 |
| omp-config-and-rules-guide | 8 | 日文补回不存在 rules 总开关的明确限定。 |
| omp-hook-extension-guide | 8 | 英日文补回全局会话作用域和仅返回函数值不够的限定。 |
| headroom-cc-switch-coexistence | 8 | 恢复负例可重复验证要求和脱敏术语。 |
| headroom-single-port-evolution | 8 | 全文、图表、命令和历史假设一致。 |
| omp-headroom-persistence | 8 | 日文恢复重启重建状态会丢失手工修改的含义。 |
| omp-headroom-provider-proxy | 10 | 路由拓扑、配置字段、控制器契约和回滚顺序一致。 |
| jjwt-013-security-api | 10 | 算法位长、签名/验签类型、audience 和编译/运行证据一致。 |
| dubbo-nacos-runtime | 11 | 注册名、分组、参数、心跳和 RPC 验证限定一致。 |
| testcontainers-docker-api | 10 | 修正日文把排错误写成排他的术语。 |
| redis-jackson-java-time | 10 | 补译数组年月日时分秒标签，编解码边界一致。 |
| resicache-single-flight | 11 | 全文、角色、轨迹、代码和历史测试记录一致。 |
| resicache-serialization-migration | 14 | 英日文恢复非 null，避免与非空字符串混淆。 |
| resicache-handler-chain-and-observer | 11 | null 与空值区分，日文关联专题标签修正。 |
| resicache-observer-nested-execution | 12 | 全文及可执行模型对照，日文复盘导读标题修正。 |
| ulticode-fenced-singleton-lease | 10 | SQL 围栏、失效场景、成本及证据边界一致。 |
| ulticode-owner-local-audit-inbox | 11 | 修复日文嵌套来源链接，并恢复导语中的固定提交。 |
| ulticode-core-bounded-testbed | 12 | 英文增加理解成本的方向、英日文 interrupt 与 stop 区分修正。 |
| java-internship-interview-blog-polished | 8 | 恢复热点回源、正常 WAITING/积压和无机制时的反事实；日文职责和排障术语修正。 |
| uisa-architecture-design | 9 | 去除擅加的运行任务 ID 字段；日文执行响应、闭环和协议版本协商修正。 |
| hindsight-troubleshooting | 7 | 英日流程图恢复别名/来源核对条件，历史表免责声明移至对应表前。 |
| hindsight-local-deployment-and-agent-integration | 8 | 历史记录按中文保留；修正日文断点续传、记忆搜索及英日知识蓄积术语 |
| database-written-test-review | 14 | 恢复 %ROWCOUNT 术语，区分批量发送与事务提交及 null/空值；SQL 及独立练习前提保留 |
| introduction | 6 | 逐条核对经历、权限、技术栈和日期；日文禁网改为网络禁用，未新增经历或量化成绩 |
| kb-index | 12 | 核对全部导航、12 组毕业条件、53 行 raw 摘要与维护规则；补齐英日来源代码标记 |
| kb-log | 30 | 核对 29 条历史记录及详细修订表、验证结果和未验边界；补回最初重构移除旧公开 wiki 语义的说明 |

原始 `src/content/`、`migration/source/` 与 `legacy.metadata` 保留。只修订站点适配副本；中文仅修复脱敏表的 Markdown 列结构，没有改写中文结论。

缓存过期后的 NullValue 三语文件已以 `Accept-Encoding: identity` 实际下载、保存并回读：中文 6147、英文 7045、日文 7798 字节，均含 UTF-8 BOM，分别与对应仓库导出文件逐字节一致。内置浏览器的点击产生下载事件，但随后为 canceled / 0 bytes，不能记作浏览器下载管理器通过。发布本轮修改后另行核验更新文件。

## 长文逐段复核与下载验收

1. 对照正文每段、表格每行、流程图和代码注释，核对否定、条件、对象、数量和证据限制；章节数量只能保护结构。
2. 保留精确技术标记：例如 `%ROWCOUNT`、`null`、非空、线程 interrupt/stop、热点回源/热重载不能混用。可执行命令不因本地化而改变。
3. 流程图与正文同时更新；历史表的限定放在对应表前。来源链接避免嵌套损坏，Markdown 表格中的正则竖线需要转义。
4. 历史记录按中文当时的结论翻译，不将历史测试数或部署数据写成本次实测。原始快照及来源元数据保留；个人技术译文只在博客维护。
5. 发布后等待缓存有效期结束，再通过界面观察每种语言的导出地址；实际保存文件并回读，与对应构建产物逐字节比较，同时检查 UTF-8 BOM、标题和正文。记录缓存头与下载结果，区分 HTTP 文件验证和浏览器下载管理器验证。

这些方法复用既有内容检查与导出流程，无新增运行时功能或依赖。博客的逐篇结果见其同名审计文档。

## 剩余文章逐段复核规则补充（2026-10-31）

博客剩余 33 组正文的逐段复核揭示了以下边界，模板与博客同步采用；个人文章仍只在博客维护，不复制进模板示例。

1. 操作流程逐步核对触发条件与先后顺序：“下发后等待 ACK”“收到成功响应后更新状态”不能简化成收到任意响应就推进。
2. 按章节核对导航和引用清单。全篇链接集合相同，不代表“相关页面”没有漏项；同一链接也可能在来源区再次出现。
3. 图表中的职责和示意值也属于译文：不能擅加重排等未声明职责，连字符、下划线及标识符必须与中文正典一致。
4. 技术对象和限定不泛化：序列化客户端不替换成任意客户端，来源确认不写成所有权；“更清晰的优先关系”不升级为绝对优先保证。示例的自然语言注释可翻译，可执行语句、配置值和历史证据不改写。

本轮只修订译文与复核记录，复用既有构建和内容检查。下载功能已由用户确认正常，不再作为待排查项，也不计入本轮验收范围。

## 剩余 33 组正文逐段复核（2026-10-31）

从上一轮 34 组长文清单中扣除后，本轮逐段对照剩余 33 组中文、英文和日文，包含导语、每段正文、列表、表格、流程图、代码及注释、相关页面和来源。阅读时仅压缩输出中的空格和链接 URL，不跳过正文。本轮 33 组与前轮 34 组合计覆盖 67 组；章节数用于说明阅读范围，不作为语义一致的自动证明。

| 文章 | 已读章节块（含导语、参考） | 逐段结果 |
| --- | --- | --- |
| chronicle | 12 | 逐项对照全部日期和历史功能记录，保留原状态标记。 |
| linkroll | 1 | 日文恢复真正欣赏而非感谢站点的含义；价值认同改为自然的共感表述。 |
| policy | 4 | 三语数据、权利、许可和免责条目逐段一致；日文保留权利改为留保术语。 |
| 2026-01-01-00-00-00 | 1 | 三语引文含义一致。 |
| 2026-06-19-18-00-00 | 1 | 三语引文先后次序及含义一致。 |
| kb-ingest-todo | 6 | 全部候选、勾选状态、来源版本、关闭标准与中文一致；保留历史待办。 |
| java-atomic-boolean | 8 | 逐段核对可见性、CAS、临界区和验证边界；日文导语补回 CAS 能保证什么。 |
| java-auto-closeable | 8 | 核对所有权、逆序关闭、主/抑制异常；英日文恢复序列化客户端这一特定对象。 |
| java-null-value | 8 | 核对缓存状态、占位对象、序列化及失效边界；英文补稳定条件，英日恢复回源过载程度。 |
| java-online-performance-debug | 8 | 英日恢复小包风暴与深层原因；日文先存证后处置的时序修正，保留后续受控恢复。 |
| java-concurrency-deepdive | 8 | 逐段核对 CAS、原子类、锁、引用、JDK 限定及验证清单，未发现新增语义差异。 |
| mysql-storage-and-deadlock | 8 | 逐段核对机制、选型、风险、验证和历史版本边界，未发现新增语义差异。 |
| redis-persistence-principle | 8 | 逐段核对机制、选型、风险、验证和历史版本边界，未发现新增语义差异。 |
| redis-business-patterns | 8 | 逐段核对缓存/锁/消息语义、课程来源数量、压测与版本限定，未发现新增语义差异。 |
| redis-heima-practice | 8 | 逐段核对缓存/锁/消息语义、课程来源数量、压测与版本限定，未发现新增语义差异。 |
| docker-fundamentals | 8 | 全部镜像、数据、网络模型与命令、版本和风险前提一致。 |
| hbase-foundation-and-ops | 8 | 核对模型、组件表、运维和数量；英日文明确新版弱化的是 ZooKeeper 的作用/依赖程度。 |
| spark-bigdata-ecosystem | 8 | 逐段核对来源数量、运行/调用模型、验证步骤及版本边界，保留中文的历史表述。 |
| spring-cloud-and-boot | 8 | 逐段核对来源数量、运行/调用模型、验证步骤及版本边界，保留中文的历史表述。 |
| frontend-mybatis-essays | 7 | 核对归档声明、条目数量、来源与 provisional 状态，保留历史摘录。 |
| llm-wiki-pattern | 8 | 英日补回多来源查询反复拼接的解释；日文补一源多页和非外观检查限定；来源确认与所有权概念纠正。 |
| microservice-data-ownership | 9 | 全部 owner/schema、saga/outbox、迁移门禁和证据限定逐段一致。 |
| plugin-lifecycle-management | 9 | 英日恢复成功回执后才推进状态的条件；英文明确下发后等待 ACK；日文回执去除购物小票用语。 |
| headroom-compress-retrieve-contract | 9 | 英日补回相关页面区漏掉的 Headroom 单端口、持久化和 OMP Hook 三条导航；全部 API 字段与回滚条件一致。 |
| resicache-early-expiration-cas | 13 | 核对 CAS、Lua、任务取消与 21+5 项历史测试边界；日文恢复 write 与旧任务优先关系的限定，避免表述成绝对保证。 |
| hindsight-local-deployment | 8 | 修复英日架构图为 CPU Embedding 额外加入 rerank 的错误；翻译示例注释，保留命令、配置与历史未验证边界。 |
| hindsight-omp-codex-integration | 8 | 修复英日路由示意把合法连字符误换为下划线；桥接代码、协议缺口、原始一次写入/召回指标与来源限制一致。 |
| ulticode-async-execution-contract | 8 | 执行状态、幂等指纹、1024/15 分钟 metadata、失败查询与跨副本持久化缺口一致，无需修改。 |
| ulticode-ci-supply-chain | 8 | 静态/集成分层、发布签名证明与生产结论限制一致，无需修改。 |
| ulticode-docker-sandbox | 8 | 逐项核对 Docker 参数、错误分类和 fail-closed/未审计逃逸边界，无需修改。 |
| ulticode-generation-attempt-fence | 7 | 四项 SQL 条件、代次推进、过期 ACK 与只保护结果写入的限定一致，无需修改。 |
| ulticode-outbox-redis-streams | 8 | 状态表、Lua 原子去重、PEL 回收默认值与至少一次语义一致，无需修改。 |
| ulticode-owner-and-facts | 8 | 五个 Owner/两个 Worker、快照字段、校验代码及授权和一致性限制一致，无需修改。 |

中文正典、原始 `src/content/`、`migration/source/` 与完整 `legacy` 来源字段保持不变。修订只落在 `content/blog/legacy/` 的英日站点适配正文，发布时同步重建对应三语档案产物与搜索索引。本文核对翻译忠实度，不重跑历史文章中的服务、硬件、性能或安全实验。
