# 知识库正典层逐篇分类审计

审计对象为当前工作树，基线 `c4e49d150650b555d1b226c3dc487b39216eea53`。范围内 **251 份文档，119 条分类记录**。`src/content/raw/zh-cn/` 的目录、Git 文件清单、raw manifest 和正典索引均指向 **53** 份 raw 正文。题面的 252 份包含 1 份差额。若把上一级 `src/content/raw/.manifest.sha256` 计作控制文件，读取总数为 252，raw 正文仍为 53。三个发布层 introduction 为保护面旁证，另计。

| 计数对象 | 结果 |
|---|---|
| 文档文件 | Wiki 174、raw 53、收件箱 3、information 15、序文 6 |
| 层按文件计 | wiki 174、raw-evidence 53、inbox 3、navigation 12、protected-identity 9 |
| 正典 Wiki kind（声明） | concept 47、entity 4、synthesis 7 |
| 正典 Wiki status（声明） | active 34、provisional 22、deprecated 2 |
| 三语 Wiki kind（声明） | concept 141、entity 12、synthesis 21 |
| 三语 Wiki status（原始快照声明） | active 106、provisional 66、deprecated 2 |
| 正典 Wiki 当前主域（E 的 Java 排障交叉引用另计） | A 6、B 7、C 8、D 6、E 5、F 24、G 2、M 0 |
| 正典 Wiki 建议主域（结构拆分前） | A 13、B 6、C 8、D 5、E 5、F 19、G 2、M 0 |
| 全范围文档建议主域（每份译文按其正典域计） | A 52、B 25、C 32、D 24、E 21、F 66、G 7、M 24 |
| raw 粒度 | legacy-aggregate 10；小包 38、边界 7、超出 8 |

以 `KB.md` 的层级、`.claude/skills/knowledge-base.md` 的执行规则、`docs/kb-convergence-design.md` 的 IA v2 与质量门作为裁决依据。A–F 为知识主视图，G 为历史归档，M 为站点与内容运营。域是索引视图字段。L1 原理、L2 边界、L3 实践、L4 项目案例。状态评估分别看固定的适用版本、可重复的验证方法、已记录的验证结果和双向关系。源码断言存在只证明有测试入口；历史运行观察只证明当时已记录的结果。

逐个文件读取 YAML、标题、开篇、结论和证据/相关页段。较长 raw 的聚合主题由各来源清单、原文分隔和结论定位。译文对照正文的关键命题、成立条件和出典，并对有差异的条目定位行号。链路统计以解析到本地文件、同语种正向/反向关系为准；外部 URL 的在线可达性、上游项目运行测试和完整逐句翻译校对均未执行。文件行号指当前工作树。路径列的三语式表示相同 slug 在三个 locale 各有一个文件。

## 优先问题

1. **毕业板少 10 篇。** 22 篇正典 provisional 均已登记主域，但毕业板仅列 12，正文只有 6 篇在开头显式写了三项检查。ResiCache 总览和 UltiCode 九篇子页漏登；包括仍称 receipt 在进程内的页面。复核板首、实体及子页索引行。 [毕业板](../../src/content/information/zh-cn/kb-index.md#L19) · [ResiCache](../../src/content/information/zh-cn/kb-index.md#L93) · [UltiCode 九页](../../src/content/information/zh-cn/kb-index.md#L105)
2. **原始英日译文与正典的证据等级、技术命题漂移。** 两种语言各有 3 项状态差、5 项来源集合差；Hindsight 接入将 Bank 写成物理隔离，中文明确是逻辑分区、存在碰撞和协议缺口。发布层经过后来迁移已吸收部分更正，逐项处理剩余差异，保留业主已批准的发布开关。 [英文接入](../../src/content/note/en/hindsight-omp-codex-integration.md#L22) · [日文接入](../../src/content/note/ja/hindsight-omp-codex-integration.md#L22) · [正典协议缺口](../../src/content/note/zh-cn/hindsight-omp-codex-integration.md#L151) · [发布覆盖](../../migration/publication-overrides.json#L2)
3. **现有 lint 不能证明正典分类完整。** 它遍历发布副本的 Wiki，用字符串包含检查索引，检查日志时只找一条日期，未枚举 `related`。正典 57 条单向边可以同时存在，且索引中的路径位置和废弃状态互斥也未经检查。 [检查目标](../../scripts/kb-lint.ts#L12) · [检查循环](../../scripts/kb-lint.ts#L92) · [索引检查](../../scripts/kb-lint.ts#L104)
4. **数据库笔试整页的 kind 和粒度均需处理。** 442 行、一个 raw slug；连接/NULL、日期方言、四表更新、Kettle、超大表恢复各有不同证据和复现环境。正文罗列一手外链很有价值，但还没有达到设计所要求的多 raw 合成。 [来源](../../src/content/note/zh-cn/database-written-test-review.md#L7) · [日期表达式](../../src/content/note/zh-cn/database-written-test-review.md#L150) · [批量抽取](../../src/content/note/zh-cn/database-written-test-review.md#L294)
5. **项目总览复写拆解页，ResiCache observer 还形成跨版本重复。** UltiCode 总览已有九篇目录，后半又讲同一 outbox、围栏、沙箱等；ResiCache `2954fff` 责任链子页与 `75ed279` observer 专页都讲 fragment/token，后者独有可运行模型。保留各固定版本的证据，明确每项内容的主入口。 [UltiCode 系列](../../src/content/note/zh-cn/ulticode.md#L24) · [ResiCache 责任链](../../src/content/note/zh-cn/resicache-handler-chain-and-observer.md#L119) · [observer 反例](../../src/content/note/zh-cn/resicache-observer-nested-execution.md#L37)

## 检查结果

- 在仓库规定的 `remote-dev` 尝试 SSH 预检与 `pnpm kb:lint`、等价 Node 入口（当前 `package.json:23` 使用 `node --experimental-strip-types scripts/kb-lint.ts`）。连接在命令启动前被关闭，SSH 退出 255，错误 `Connection closed by 198.18.0.17 port 34281`。两条入口都没有执行到脚本，**所要求的远端 lint 未验证**。检查环境受到仓库规则约束。
- 只读独立核验以安全 YAML 解析、文件枚举和 SHA-256 为基础。53 条 manifest 全部匹配，额外/缺失条目 0，当前 Git 基线到工作树的 `src/content` 无差异。174 页均有 `kind/status/sources/related`，现存 raw slug 与同语 Wiki slug 的解析错误均为 0。逐节解析的正典 A–F 各有入口，共登记 56 个唯一页面；两个 deprecated 只出现在 G，主域和三个学习路径均未引用它们。两页旧 slug 的发布路由仍登记。
- 正典日志的 29 条日期标题非递减，英/日快照各 8 条，均停于 2026-08-12；日志是历史记录，校正应追加。未对全部历史中间提交做 append-only 重演。本站发布集合维护位置由 Astro schema 的 loader 决定。 [schema](../../src/content.config.ts#L9) · [发布路由映射](../../migration/manifest.json#L1547)
- Hindsight raw 的真实 `sourceType` 是 `local-deployment-and-contract-test`，正典索引 raw 行登记为 `upstream-source-and-minimal-experiment`。Redis 黑马快照正文来源清单列 6 条而没有哪 3 条完全重复的标注，不能用聚合描述推定去重后的精确篇数。 [Hindsight raw](../../src/content/raw/zh-cn/hindsight-local-deployment-and-agent-integration.md#L4) · [raw 索引](../../src/content/information/zh-cn/kb-index.md#L189) · [黑马原始清单](../../src/content/raw/zh-cn/ingest-redis-heima.md#L21)
- 本会话的 Hindsight 搜索和页面列表均返回本地服务 `ECONNREFUSED`。裁决采用工作树正文和配置。

## Wiki 分级与合并、拆分裁决

- **kind 不合**。正典 7 个 synthesis 中，数据库笔试、Headroom 共存、前端随笔各仅一条 raw。前两项分别应收为复盘方法入口加独立机制页、版本具体的共存 concept；前端随笔已归档，保留其历史标签与旧 slug，禁止从活跃库计入“有效综合”。其余四个 synthesis 有 2 条以上 raw 和比较/决策结构，保留；首段补实际 L 层覆盖。Hindsight 接入当前为 entity，但正文主要是桥接教程，宜收为 context-bank 选路和协议边界 concept。ResiCache、UltiCode、OMP Headroom Bridge 都有明确实体，项目实现细节的 concept 以机制问题为标题，允许以固定项目实证立论。 [单源共存](../../src/content/note/zh-cn/headroom-cc-switch-coexistence.md#L5) · [设计分级](../../docs/kb-convergence-design.md#L38)
- **已判定合并的内容**。保留 `resicache` 与 `ulticode` 原 slug 作总览，五组/九组机制分别由已有子页承接。ResiCache 责任链页保留顺序、`HandlerResult` 与 snapshot，fragment/token 机制和两版本对照收敛到 `resicache-observer-nested-execution`，在原章节留前往对应版本的入口。Redis 黑马课程把独有多级缓存与批操作选段交给 Redis 业务导读或拆分页，秒杀/锁/队列以业务页为主，课程入口作为历史学习清单归档。Headroom 保留 API、单端口历史、持久化、共存、bridge 五页；只移走重叠段落，重建缓存交给持久化，BindPaths 交给共存，API 字段仍只在压缩/找回契约。 [Redis 业务](../../src/content/note/zh-cn/redis-business-patterns.md#L18) · [Redis 课程](../../src/content/note/zh-cn/redis-heima-practice.md#L18) · [Headroom 历史](../../src/content/note/zh-cn/headroom-single-port-evolution.md#L50) · [持久化](../../src/content/note/zh-cn/omp-headroom-persistence.md#L22)
- **超过 300 行的正典共三篇**。数据库笔试 442 行，拆 SQL/NULL、跨方言日期、四表同表 DML、批量抽取与恢复；Redis 序列化 304 行，按对象信任与迁移切换分出两个验证责任；Hindsight 老页 448 行，已经拆分及 archive，保留既有 URL，后续只需明示历史入口和替代关系。三语原始快照另有 en/ja 数据库笔试各 383 行、en/ja 序列化各 303 行、en/ja Hindsight 老页各 445 行，随对应正典处置。长 raw 保持快照。
- **三项以上独立验证目标的短页或长总览**。Docker（镜像/数据/网络）、HBase（模型/运维/表设计）、Java 并发（CAS/协作/引用）、Spring Boot/Cloud（装配/事务/注册网关）、Redis 业务（缓存/锁/消息）、OMP 配置（选模/压缩/规则）及两个项目总览应拆分或转为导航；MCP 图工作流把协议兼容独立出页，UltiCode 交付页拆静态验证与供应链门禁。Redis 持久化、小范围 MySQL 存储与死锁、Java 面试方法及 UISA 综合均保留核心决策入口，先收窄旁支或链接专项，尤其 UISA 的故障矩阵与多项机制共同支撑同一个 owner/恢复模型。Hindsight 排障七项均用于一个症状到下一步的判断，保留同一矩阵；独有模型或桥接细节由现成的部署/接入页维护。
- **active 强度**。三篇 Hindsight 历史实践即使标有 v0.9.1 固定点，镜像、模型、客户端和协议复现仍有缺口；改为 provisional。课程型聚合及大规模插件设计的适用版本或运行证据不足，矩阵列为 `fix-status` 的现有 active 应暂改 provisional。已有正式版本而只确认静态 API 的 JJWT、Testcontainers、OMP 等，继续以已证明的 API/源码界定 active；零回链和缺实验不应视为整个运行系统已验证。Java 基础几篇可保留稳定、可运行的机制主张，补固定 JDK/Spring/工具版本。所有标为 active 的页仍应经双向边完成验收。 [Hindsight 日志](../../src/content/information/zh-cn/kb-log.md#L95) · [插件设计边界](../../src/content/note/zh-cn/plugin-lifecycle-management.md#L101) · [JJWT 运行边界](../../src/content/note/zh-cn/jjwt-013-security-api.md#L137)

## 22 篇 provisional 的毕业门

“部分”表示有原始观测、源码或可运行指引覆盖部分条件，现有材料无法证明整组三项达标。“缺”指原稿文件头无三项。建议的三项检查均要求固定环境或提交，并把实际结果链接到独立证据。结论是 **0 篇可以据现有材料直接升 active**。

| slug | 现有门与达标判断 | 可执行的三项验证 |
|---|---|---|
| headroom-single-port-evolution | 文件头 3/3；部分，区分已显式路由和默认直连，恢复文档尚待独立验证 | 显式 Messages/Responses 契约；冷启动重建 model_cache；BindPaths 回滚达标 |
| omp-headroom-persistence | 文件头 3/3；部分，历史触发条件已给，复现实验缺 | Named Profile 凭据隔离；损坏派生 cache 删除重建且保持配置；reconciler 仅在一次性迁移触发并可退出 |
| headroom-cc-switch-coexistence | 文件头 3/3；部分，正文有成功消息链、权限说明；双重整理对照与定版仍缺 | 同一请求关联脱敏上游日志；隔离 fixture 比较单/双整理的可观测差异；验证绑定权限和回滚。把“冲突必现”改成可证伪断言 |
| omp-headroom-provider-proxy | 文件头 3/3；部分，验证覆盖特定工作树，固定提交只给 lineage | 绑定完整实现的固定提交再做三路 smoke；中途失败 atomic restore 与 mode；按顺序回滚并比对初态 |
| uisa-architecture-design | 文件头 3/3；部分，owner 与矩阵成文，未交付运行案例 | 重试/幂等的可重复失败负载；验证 owner→恢复决策树；五类异构失败用例及结果 |
| java-internship-interview-blog-polished | 文件头 3/3；部分，已有能力模型与案例模板，缺真实固定证据 | 一份脱敏生产止损记录；固定缓存/异步契约；报告逐条区分能力推断和技术事实 |
| database-written-test-review | 文件头缺；索引已有三组；正文 §338 说明哪些内容无运行验证 | 固定 SQL 方言版本矩阵；NULL/跨年/同表 DML fixture；可恢复抽取、分片及对账演练 |
| resicache | 文件头和观察板缺；§260 分层列出静态证据 | 固定五个机制入口与版本矩阵；执行项目最小并发与 TTL/SER 验证集；将生产、跨实例和安全结论限制在已证明边界 |
| resicache-handler-chain-and-observer | 文件头缺；观察板为主题摘要；正文 §179 有测试覆盖 | 序列与 HandlerResult 控制流；重建 snapshot 和 fragment 作用域隔离；token 配对及异常收尾 |
| resicache-single-flight | 文件头缺；观察板为主题摘要；正文 §247 有测试清单 | 十路并发只有一个有效 loader；锁内二次检查含跨实例；重入和写回失败状态分开 |
| resicache-early-expiration-cas | 文件头缺；观察板为主题摘要；正文 §231 有测试清单 | 固定 Redis 实机用旧/新版竞态；旧任务不改变 TTL；成功只缩短 TTL 且不触发 loader |
| resicache-serialization-migration | 文件头缺；观察板为主题摘要；正文 §254 有测试清单 | 白名单/preflight 拒绝异常输入；三阶段切换和回滚可重演；并发重写时旧迁移不得覆盖新值 |
| ulticode | 文件头缺；索引为覆盖范围，正文 §231 起列待验证约束 | 固定提交执行 static/unit/integration 并记实际版本；演练多副本/重启下 receipt 与投递；独立验证沙箱边界 |
| ulticode-owner-and-facts | 文件头及观察板缺；末段源码阅读路径 | 拒绝错误 owner；拒绝错误 schemaVersion/缺失事实；事务重放前后的事实快照一致 |
| ulticode-owner-local-audit-inbox | 文件头及观察板缺；末段列固定测试入口 | owner 业务与 outbox 同成同败；durable inbox 后才 ACK；重复/租约过期后只接管有效一次 |
| ulticode-outbox-redis-streams | 文件头及观察板缺；§59 有语义边界 | 业务/outbox 原子落库；重复投递去重；PEL 回收与死信能追溯 |
| ulticode-generation-attempt-fence | 文件头及观察板缺；§23 有 SQL 契约 | stale generation 写入零行；旧 attemptId 写入零行；正确新结果只完成一次 |
| ulticode-fenced-singleton-lease | 文件头及观察板缺；§117 是核验入口 | 接管时 fence 单调递增；旧 holder 不能完工；长期任务恰当续期/停止 |
| ulticode-docker-sandbox | 文件头及观察板缺；§68 明列无完整安全证明 | 固定目标内核/引擎和资源隔离；执行与基础设施错误双路径；产出独立隔离审查结果 |
| ulticode-async-execution-contract | 文件头及观察板缺；§49 有进程内限制 | 同幂等键同/异指纹；submit/poll/cancel 状态机；receipt 容量与重启限制 |
| ulticode-core-bounded-testbed | 文件头及观察板缺；§149 有源码次序 | allowlist 拒绝与 readiness fail-closed；启动超时和资源交接；确保 close-once |
| ulticode-ci-supply-chain | 文件头及观察板缺；§67 有源码入口 | zero-infra 通过并验证未启动服务；集成 gate 失败实际阻断；固定产物 provenance、SBOM 与签名验证 |

## 语言差异与保护面

源快照各有 **37** 篇 `draft: true` 和 21 篇无 draft 声明，原始三语都有 58 个 slug。原始译文每种语言有 3 个 status、5 个 sources、12 个 related 集合差异，kind 全相同。正文发现 10 个强漂移、1 个部分漂移，英日两版的差异方向一致。以下状态是原始快照。当前发布层每语种 58 篇，所有 `draft: false`，四个 Wiki 顶层字段已对齐正典；抽查发布 Hindsight 物理隔离更正、OMP 17.2.15、ResiCache 与 UltiCode 新版来源、observer 可运行反例均已同步。旧整页历史内容仍应保持显式时点和档案入口。 [实际覆盖](../../migration/publication-overrides.json#L2) · [发布 JA 接入](../../content/blog/legacy/note/ja/hindsight-omp-codex-integration.md#L83) · [发布 EN observer](../../content/blog/legacy/note/en/resicache-observer-nested-execution.md#L96)

| 原始 Wiki slug | EN/JA draft | 语义抽查 | frontmatter 与正典差异 | 关键证据 |
| --- | --- | --- | --- | --- |
| `containerd-tls-troubleshooting` | 是/是 | 仅交叉链接 | related | 正文关键命题在所查样本一致；见两份 related。 [containerd-tls-troubleshooting:8](../../src/content/note/en/containerd-tls-troubleshooting.md#L8) · [containerd-tls-troubleshooting:8](../../src/content/note/ja/containerd-tls-troubleshooting.md#L8) |
| `frontend-mybatis-essays` | 是/是 | 强 | status | 译文仍自称 provisional synthesis；正典 14–35 为已溶解归档。 [frontend-mybatis-essays:14](../../src/content/note/en/frontend-mybatis-essays.md#L14) · [frontend-mybatis-essays:14](../../src/content/note/ja/frontend-mybatis-essays.md#L14) |
| `headroom-compress-retrieve-contract` | 否/否 | 仅交叉链接 | related | 正文关键命题在所查样本一致；见两份 related。 [headroom-compress-retrieve-contract:8](../../src/content/note/en/headroom-compress-retrieve-contract.md#L8) · [headroom-compress-retrieve-contract:8](../../src/content/note/ja/headroom-compress-retrieve-contract.md#L8) |
| `headroom-single-port-evolution` | 是/是 | 仅交叉链接 | related | 正文关键命题在所查样本一致；见两份 related。 [headroom-single-port-evolution:8](../../src/content/note/en/headroom-single-port-evolution.md#L8) · [headroom-single-port-evolution:8](../../src/content/note/ja/headroom-single-port-evolution.md#L8) |
| `hindsight-local-deployment-and-agent-integration` | 是/是 | 强 | status, related | 译文 active 并缺归档导引；正文仍为整套历史部署，正典 deprecated 且有三篇替代。 [hindsight-local-deployment-and-agent-integration:14](../../src/content/note/en/hindsight-local-deployment-and-agent-integration.md#L14) · [hindsight-local-deployment-and-agent-integration:14](../../src/content/note/ja/hindsight-local-deployment-and-agent-integration.md#L14) |
| `hindsight-local-deployment` | 否/否 | 强 | 一致 | 译文笼统声明离线，正典要求确认缓存、外部依赖和模型 provenance。 [hindsight-local-deployment:14](../../src/content/note/en/hindsight-local-deployment.md#L14) · [hindsight-local-deployment:14](../../src/content/note/ja/hindsight-local-deployment.md#L14) |
| `hindsight-omp-codex-integration` | 否/否 | 强 | 一致 | 译文说 Bank 物理隔离，正典为逻辑分区并说明 basename 碰撞及协议缺口。 [hindsight-omp-codex-integration:22](../../src/content/note/en/hindsight-omp-codex-integration.md#L22) · [hindsight-omp-codex-integration:22](../../src/content/note/ja/hindsight-omp-codex-integration.md#L22) |
| `hindsight-troubleshooting` | 否/否 | 强 | 一致 | 译文将当时标签缺失写成官方模型结论，正典把别名与模型身份分开。 [hindsight-troubleshooting:38](../../src/content/note/en/hindsight-troubleshooting.md#L38) · [hindsight-troubleshooting:38](../../src/content/note/ja/hindsight-troubleshooting.md#L38) |
| `java-null-value` | 是/是 | 仅交叉链接 | related | 正文关键命题在所查样本一致；见两份 related。 [java-null-value:8](../../src/content/note/en/java-null-value.md#L8) · [java-null-value:8](../../src/content/note/ja/java-null-value.md#L8) |
| `java-online-performance-debug` | 是/是 | 仅交叉链接 | related | 正文关键命题在所查样本一致；见两份 related。 [java-online-performance-debug:8](../../src/content/note/en/java-online-performance-debug.md#L8) · [java-online-performance-debug:8](../../src/content/note/ja/java-online-performance-debug.md#L8) |
| `llm-wiki-pattern` | 否/否 | 仅交叉链接 | related | 正文关键命题在所查样本一致；见两份 related。 [llm-wiki-pattern:8](../../src/content/note/en/llm-wiki-pattern.md#L8) · [llm-wiki-pattern:8](../../src/content/note/ja/llm-wiki-pattern.md#L8) |
| `mysql-performance-troubleshooting` | 是/是 | 仅交叉链接 | related | 正文关键命题在所查样本一致；见两份 related。 [mysql-performance-troubleshooting:8](../../src/content/note/en/mysql-performance-troubleshooting.md#L8) · [mysql-performance-troubleshooting:8](../../src/content/note/ja/mysql-performance-troubleshooting.md#L8) |
| `omp-config-and-rules-guide` | 是/是 | 强 | sources | 缺 OMP 17.2.15 compaction、snapcompact、TTSR 与两份 runtime raw。 [omp-config-and-rules-guide:14](../../src/content/note/en/omp-config-and-rules-guide.md#L14) · [omp-config-and-rules-guide:14](../../src/content/note/ja/omp-config-and-rules-guide.md#L14) |
| `omp-headroom-persistence` | 是/是 | 强 | sources, related | 总体恢复结论仍近似，固定 17.2.15 证据与现代配置条件缺失。 [omp-headroom-persistence:16](../../src/content/note/en/omp-headroom-persistence.md#L16) · [omp-headroom-persistence:16](../../src/content/note/ja/omp-headroom-persistence.md#L16) |
| `omp-hook-extension-guide` | 是/是 | 强 | sources, related | 缺新版事件全集、真实 ExtensionRunner、返回与上下文限制，以及两份 raw。 [omp-hook-extension-guide:14](../../src/content/note/en/omp-hook-extension-guide.md#L14) · [omp-hook-extension-guide:14](../../src/content/note/ja/omp-hook-extension-guide.md#L14) |
| `resicache-observer-nested-execution` | 是/是 | 部分 | related | 基本三层结论一致，缺正典 16–94 的固定源码指针和最小可运行反例。 [resicache-observer-nested-execution:14](../../src/content/note/en/resicache-observer-nested-execution.md#L14) · [resicache-observer-nested-execution:14](../../src/content/note/ja/resicache-observer-nested-execution.md#L14) |
| `resicache` | 否/否 | 强 | status, sources | 仍以 75ed279/v0.0.2 的 68 行概览和 active 为主；中文是 2954fff 的 282 行案例、provisional。 [resicache:14](../../src/content/note/en/resicache.md#L14) · [resicache:14](../../src/content/note/ja/resicache.md#L14) |
| `ulticode` | 否/否 | 强 | sources, related | 仍以 3f14ac89 README/CONTEXT 旧概览为主，缺 f801a1076 两份 raw 和九篇机制拆解。 [ulticode:20](../../src/content/note/en/ulticode.md#L20) · [ulticode:20](../../src/content/note/ja/ulticode.md#L20) |

- 正典 `src/content/information` 的 `kb-index`、`kb-log` 为 navigation。英文和日文归档索引声称只公开两篇、无实体或 synthesis，与当前发布层冲突。当前公开索引位于 `content/blog/legacy/information`，已有三语六域，其 12 条观察板同样过时。英日原始收件箱中文为主，翻译差异与摄入状态同时存在，已完成来源应与当前计划分开表达。 [原 EN 索引](../../src/content/information/en/kb-index.md#L9) · [发布 EN 索引](../../content/blog/legacy/information/en/kb-index.md#L50) · [JA 收件箱](../../src/content/jotting/ja/kb-ingest-todo.md#L23)
- 八个非 Wiki slug 的矩阵将 linkroll、chronicle、policy 列为 M 域的 protected-identity。三个 introduction 未出现在原始 information 目录，实际保护面为 `content/blog/legacy/information/{zh-cn,en,ja}/introduction.md`。当前工作树三份介绍均已有别的本地改动，审计照现状读分类。计划及影响估算排除身份正文、时间线、友链和政策。chronicle 的英文缺 2026-02-23 三条，与中/日存在已存差异，作为边界观察保留；序文是展示语录，归 M/navigation。 [保护规则](../../KB.md#L5) · [介绍 zh-cn](../../content/blog/legacy/information/zh-cn/introduction.md#L51) · [介绍 en](../../content/blog/legacy/information/en/introduction.md#L51) · [介绍 ja](../../content/blog/legacy/information/ja/introduction.md#L51)

## 可执行整改顺序

以下 **10 项**均为建议，当前未实施。目标基准为实际加载的 `content/blog/legacy`。原始快照、raw、原始 `legacy.metadata`、受保护内容、现有 archive ID 和 URL 保持保存。以同一任务批次更新三种发布语言，对已存在的已证翻译直接复用。涉及新主题证据时，只在获得摄入授权后追加新 raw 与 manifest 记录。估算按去重后的目标路径计算，不含上游验证工程、将来获得授权的 raw 摄入、新页的后续英日翻译，以及为新页注册发布入口可能新增的发布映射。

估算 **192 个**去重路径。包括 52 个已有 Wiki slug × 3（取阶段合并、状态、毕业、关系及拆分入口并集）、3 个索引、3 个日志、3 个收件箱、2 个旧归档英日页、1 个检查脚本、最多 24 个新正典页。理论上限按候选反链全保留计算；剪除弱边后可能更少。

| 优先级 | 影响文件与精确动作 | 验证 | 风险与回滚边界 |
|---|---|---|---|
| 1 · P0 | `scripts/kb-lint.ts`。显式将快照内容和发布副本设为两个检查入口。两者均校验 kind/status 枚举、sources/related 存在及作用域；逐节解析 A–F/G，精确匹配完整 slug，断言 active/provisional 必须在主域、deprecated 仅在 G；原始已登记例外以本次基线登记并只容许减少。日期标题校验非递减，保留 raw 哈希及 Git 不可变门。归档互链允许单向；把正文链接解析 scoped 到 Wiki 别名、当前发布路径与站内锚点。 | 在 remote-dev 执行 `pnpm kb:lint`。用最小 fixture 断言缺来源、假 substring 命中、主视图废弃泄漏、孤儿/单向、乱序日期均有清楚结果。对照脚本分别报两类根目录。 | 历史单向边及锚点别名会引起噪音。先核准基线，禁用自动修复，保持脚本可独立回滚。 |
| 2 · P0 | 现有 22 个 provisional slug 的三语发布页及三个发布索引。正文首段前增加上表三个编号检查，六篇已有的仅修不明确条件。三个索引的毕业观察改为按实际状态计算口径，先补 10 个缺项，再纳入任务 4 的新增 provisional。删除“全部 provisional 不进主视图”歧义，主域保留完整登记且标 provisional，其中单列学习路径只承诺可验证边界；更新捕获收件箱摘要中的旧 11。 | 同三语按状态计数，观察板 slug 集合与 provisional 完全一致，且正文每页 3 条可证伪门；查相同的三项已经入板，固定的证据与待跑项明确。 | 只改状态治理文案和观测入口，已列的历史成果仍待对应测试，不自动毕业。 |
| 3 · P1 | 发布 EN/JA 两个 `hindsight-local-deployment-and-agent-integration.md`，归档头已是 deprecated，保留 `draft: false` 和旧 URL。把历史正文中无日期的模型身份/离线保证放在明确历史标注下，并把三篇替代链接置前。其余强/部分漂移主要限于冻结的原始译文，沿用发布层已同步的 `kind/status/sources/related`，加校验防止下一次迁移拿旧正文覆盖公开版本。 | 按差异表回查三种发布语言的首节、版本边界和出典，确认 58/语言与现有草稿开关及别名不变。 | 历史原文明示档案属性。语言发布是既有业主决策，分类处理不翻转开关。 |
| 4 · P1 | 矩阵现为 active 且含 `fix-status` 的 13 个 slug 的三语发布页设置 `status: provisional`，同步正文、可见证据摘要和三个索引。课程页使用“固定运行版本与最小复现／明确适用边界／登记反向引用”作为三门。Hindsight 分别验证模型+镜像/预检/复现，桥接分别验证逻辑分区+碰撞/完整 MCP 会话/双客户端，排障验证版本/复现场景/误判负例。保留其他 active 的固定事实范围；基础概念补运行矩阵或收窄表述。 | 固定 source revision、fixture 与预期结果，证据摘要与顶层 status 一致，三个索引更新观察板。部署命令仅在隔离环境实跑。 | 表示可信边界收窄。有效证据复核通过后可单页重新毕业。保留归档 ID 和现有路由。 |
| 5 · P1 | 三个发布索引按 Wiki 矩阵的“主域现状→建议”移动条目。OMP 配置/Hook、Headroom API/单端口/持久化/共存/Bridge 从 F 到 A；Java 线上排障主列从 B 到 E，B 留交叉入口；插件 E→F，ResiCache observer D→F 并留 D 的交叉入口。Hindsight 接入、Headroom 共存、数据库复盘入口三语顶层 `kind: concept`，同步 F 的“综合”结构及各语种证据摘要。其余四个 synthesis 首段注明矩阵 L 层及来源综合用途。 | 精确检查每个 active/provisional 只有一个主域行，交叉链接单独标注；三语拓扑一致，保留 `series` 现有值与迁移旧元数据。 | 旧学习路径和小节 anchor 需保留或明确映射。 |
| 6 · P1 | 按下方正典单向边清单处理发布三语 `related`。对 active/provisional 的同主题边给目标页加原 slug；对高噪音历史边先剪弱链接，G 中的到替代页链接保持方向。优先处理 database-written-test-review 的 4 个存储回链、Docker←containerd、ResiCache 四子页←实体/专项。把同页出现的交叉入口同步成正文链接。 | 比较本报告基线 57 条单向和 8 个零入度，验收 active/provisional 剩余零入度为 0、broken 为 0。合并后按最终 slug 重算，未经证实的关系不要反向加边。 | 随意把分类相同等同于有关系会制造噪音。下方给确定的主要反链、建议剪除与逐边后备复核规则。 |
| 7 · P1 | 按合并裁决改 `resicache`、`ulticode` 与它们的既有拆解；observer 专页保留 `75ed279` 的模型并只加入新版差异及相应 sources；责任链页面删去复写解释、保留跳转。Headroom：单端口仅保留历史视图，cache 恢复转持久化，权限/rollback 转共存。Redis 课程页保留 `kind: concept` 的历史字段、设 `status: deprecated` 移 C→G，业务导览先承接独有材料。 | 复核引用对应原版本，旧项目/课程/Headroom 入口与正文锚点可达；目录无双份同一核心主张。 | 归并可损失历史限定。以“已证明于提交 X／仅版本 Y 观测”维护两套证据，勿据模型推生产行为。 |
| 8 · P2 | 按下表拆分。已有原 slug 保留作窄入口；新知识页暂用 `kind: concept, status: provisional`，每页一个验证目标，`sources` 引已有不可变证据并在正文标出处段，`related` 含其入口和互链；发布 C/B/E/D/A/F 相应小节，先发布正典，翻译按明确任务推进。 | 长页三项标签及 300 行门重新评估，新页均符合毕业三门且每项断言能回到 raw；验证 route/anchor 未漂移以及规定的内容和构建检查。 | 小切片按批次启用，原页保留导航及旧锚点。需要新证据的主张保留 provisional 并明确限制；不得直接重写聚合 raw。 |
| 9 · P2 | 三个发布索引的 raw 表，将 Hindsight `sourceType` 改为 `local-deployment-and-contract-test`，redis-heima 摘要仅保留“清单列 6 文件，重复待追证”，为 10 个 legacy-aggregate 保留标注且优先给存量正文落到具体来源子标题。把 7 份补正的指向纳入本表后复核。 | 再核 53 个 SHA-256、源类型与 raw 行数逐一相等；逐条核验原 → 更正 → Wiki。检查 OMP 三个调用点使用同一固定来源，双链旧引用不产发布 raw 副本。 | 新发现证据错误应写 correction 后追加，禁止补写旧 raw 的标识栏。 |
| 10 · P2 | 三语发布 `jotting/.../kb-ingest-todo.md` 按“已摄入/候选/待验证”改当前摘要，保留历史事实，Hindsight 案例优先链部署/排障；三个发布 `kb-log.md` 按实际时间追加一次 `maintenance`，登记状态、域、拆分页、翻译验证、未验证项和回滚范围。 | 比对 Git 中既有日志字节前缀，追加日期可解析；导航仍沿 `/kb` 到具体 Wiki 和证据。 | 记录只追加。旧导航快照和保护面保持冻结。 |

### 拆分目标和证据边界

下表新 slug 是执行建议。先完成最清晰的四表 DML、迁移安全和兼容性三个拆分，然后按受影响查询排序。每项保留入口的旧锚点。

| 原 slug / 章节 | 新知识页 slug 或既有保留目标 | 首轮证据 |
|---|---|---|
| database-written-test-review §61 / §150 / §191 / §294 | `sql-join-null-semantics`、`sql-date-dialect-boundaries`、`mysql-same-table-dml`、`recoverable-batch-extraction`；原页保留四问方法与索引 | 原 `database-written-test-review` 各节的一手引用。跨方言、并发和恢复须以后以固定 source 运行才升级 |
| resicache-serialization-migration §21–117；§118–290 | 新 `resicache-serialization-trust` 承载类型信任与 preflight；原页保留 migration 并发与 rollback | `resicache-engineering-highlights-2954fff` 的安全序列化小节与固定测试 |
| mcp-codebase-memory-workflow §16–53 | 新 `mcp-modern-legacy-compatibility`；原页保留图工作流与 coverage | 现有同名 raw 的两个协议/实现固定点 |
| docker-fundamentals §18、§28、§34 | `docker-image-layering`、`docker-data-lifecycle`、`docker-compose-networking` | 对应三组原文，逐段归因 `ingest-docker-fundamentals` |
| hbase-foundation-and-ops §18、§24、§33 | `hbase-data-model`、`hbase-region-operations`、`hbase-rowkey-design` | `ingest-hbase-foundation` 中模型、架构、表设计三节 |
| java-concurrency-deepdive §16 | `java-cas-and-aba`、`java-locks-and-thread-coordination`、`java-reference-types`；AtomicBoolean 已有小页 | `ingest-java-concurrency` 下 CAS、锁/中断与 JDK 引用文件 |
| spring-cloud-and-boot §16 | `spring-boot-auto-configuration`、`spring-transaction-boundaries`、`spring-cloud-discovery-and-gateway` | `ingest-spring-cloud` 的逐篇小节，Dubbo/Nacos 只做独立相关索引 |
| redis-business-patterns §18、§23、§28 | `redis-cache-invalidation`、`redis-distributed-lock-boundaries`、`redis-stream-delivery-semantics`；Feed/秒杀留作案例入口 | `ingest-redis-business` 按小节回链；课程的多级缓存和批操作只收入独到部分 |
| omp-config-and-rules-guide §49、§63 | `omp-compaction-and-snapcompact`、`omp-ttsr-rule-enforcement`；原页只维护选模/降级 | OMP 17.2.15 的原始及更正，按组件版本核验 |
| ulticode-ci-supply-chain §39、§43 | 新 `ulticode-release-supply-chain` 收 SBOM、签名和 provenance；原页保留验证门禁 | `ulticode-engineering-highlights-f801a1076` 的验证与交付门禁小节 |

## 正典关系及校验口径

正典 `related` 187 条有向边，其中 130 条有对应返链（65 对），57 条单向。英日各 153 条，返链 68 条（34 对）、单向 85 条。三语均无双边皆空的完全孤儿；正典 8 篇、英日各 15 篇没有入边。正文旧 `/note/` 链接目标相对同语种 slug 存在性均通过；正典 120 个正文页面连接都包含于 frontmatter，另有 67 个 frontmatter 连接未写进正文。表内“出/入”用于快速定位，箭头清单给出下一步精确目标。

反链先固化三组：数据库复盘 ← MySQL 性能/存储、DB schema drift、Spark；Docker ← containerd；ResiCache 四子页 ← ResiCache 实体（其中责任链亦接 observer）。后者在总览 phase 缩短后保留显式入口。明示可剪的低相关边包括 `redis-heima-practice → plugin-lifecycle-management`、`redis-persistence-principle → database-schema-drift`，以及归档前端随笔到 `java-concurrency-deepdive` 的弱关系。以下未列为剪除的 active/provisional 单向边是反向补链候选；只保留章内确实解释的关联。归档页只验证到替代入口，不补齐指向归档的 backlink。

| 当前来源 slug | 缺失回向的目标 slug |
| --- | --- |
| `database-written-test-review` | `database-schema-drift`, `mysql-performance-troubleshooting`, `mysql-storage-and-deadlock`, `spark-bigdata-ecosystem` |
| `docker-fundamentals` | `containerd-tls-troubleshooting`, `intranet-penetration-ssh-guide`, `multi-service-readiness` |
| `frontend-mybatis-essays` | `intranet-penetration-ssh-guide`, `java-concurrency-deepdive`, `spring-cloud-and-boot` |
| `hbase-foundation-and-ops` | `database-schema-drift`, `mysql-storage-and-deadlock` |
| `hindsight-local-deployment` | `mcp-codebase-memory-workflow` |
| `hindsight-local-deployment-and-agent-integration` | `hindsight-local-deployment`, `hindsight-omp-codex-integration`, `hindsight-troubleshooting` |
| `hindsight-omp-codex-integration` | `omp-config-and-rules-guide` |
| `hindsight-troubleshooting` | `omp-hook-extension-guide` |
| `java-concurrency-deepdive` | `java-atomic-boolean`, `java-auto-closeable`, `java-online-performance-debug`, `jjwt-013-security-api` |
| `mysql-storage-and-deadlock` | `database-schema-drift`, `multi-service-readiness`, `mysql-performance-troubleshooting` |
| `redis-business-patterns` | `redis-jackson-java-time`, `resicache-observer-nested-execution` |
| `redis-heima-practice` | `plugin-lifecycle-management`, `redis-business-patterns` |
| `redis-persistence-principle` | `database-schema-drift` |
| `resicache` | `java-null-value`, `redis-business-patterns`, `redis-jackson-java-time` |
| `resicache-early-expiration-cas` | `redis-business-patterns`, `resicache` |
| `resicache-handler-chain-and-observer` | `resicache`, `resicache-observer-nested-execution` |
| `resicache-serialization-migration` | `redis-jackson-java-time`, `resicache` |
| `resicache-single-flight` | `redis-business-patterns`, `resicache` |
| `spark-bigdata-ecosystem` | `containerd-tls-troubleshooting`, `multi-service-readiness` |
| `spring-cloud-and-boot` | `containerd-tls-troubleshooting`, `dubbo-nacos-runtime`, `microservice-data-ownership`, `multi-service-readiness` |
| `ulticode` | `database-schema-drift`, `dubbo-nacos-runtime`, `jjwt-013-security-api`, `microservice-data-ownership`, `multi-service-readiness` |
| `ulticode-core-bounded-testbed` | `ulticode-generation-attempt-fence`, `ulticode-owner-and-facts` |
| `ulticode-fenced-singleton-lease` | `ulticode-generation-attempt-fence` |
| `ulticode-owner-local-audit-inbox` | `ulticode-outbox-redis-streams`, `ulticode-owner-and-facts` |

正典无入边：`database-written-test-review`, `docker-fundamentals`, `frontend-mybatis-essays`, `hindsight-local-deployment-and-agent-integration`, `resicache-early-expiration-cas`, `resicache-handler-chain-and-observer`, `resicache-serialization-migration`, `resicache-single-flight`。

## 分类矩阵

三份语言版本共享一行，正典 Wiki 和 raw 同名者按层独立（例如 `database-written-test-review`）。W 表“✓N/M”表示 sources N 个、related M 个均可解析；对译文差异另行列示。箭头指整改目标，“匹配”仍受证据列和毕业门约束。

### Wiki（58 slug × 3 语言）

路径为 `src/content/note/{zh-cn,en,ja}/<slug>.md`。每行链接定位其正典证据。语言列草稿标记顺序为 en/ja，均为源快照。

| slug / 正典文件 | zh-cn 存在 · en/ja draft · 漂移 | 层 | 域及 L 层 | kind 声明与裁决 | status 声明与证据 | sources/related 与单向出/入 | 主裁决 | 正文依据 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `containerd-tls-troubleshooting` · [containerd-tls-troubleshooting:14](../../src/content/note/zh-cn/containerd-tls-troubleshooting.md#L14) | 有；是/是；抽查一致（FM related） | wiki | E · L2/L3 | concept／匹配 | active → provisional | ✓1/3，单向 0/3 | fix-status | CA 信任与临时跳检是同一拉取决策，§最小验证可跟做，缺按 containerd 1.x/2.x 固定的复现记录。 |
| `database-schema-drift` · [database-schema-drift:24](../../src/content/note/zh-cn/database-schema-drift.md#L24) | 有；是/是；抽查一致 | wiki | D · L1/L2/L3 | concept／匹配 | active／限证据范围 | ✓1/3，单向 0/5 | add-related | history、schema、query 三视图独立，固定 Flyway 13.2.0 与 MySQL 8.4.11，CLI 未跑仍可保留已证的版本契约。 |
| `database-written-test-review` · [database-written-test-review:338](../../src/content/note/zh-cn/database-written-test-review.md#L338) | 有；否/否；抽查一致 | wiki | C · L1/L2/L3 | synthesis → concept（方法入口） | provisional／尚欠门 | ✓1/4，单向 4/0，零入 | split, reclassify-kind | 单 raw 连接 SQL 语义、跨方言表达式、四表 DML 与批量抽取，442 行汇编应收为复盘方法入口并拆出专页。 |
| `docker-fundamentals` · [docker-fundamentals:16](../../src/content/note/zh-cn/docker-fundamentals.md#L16) | 有；是/是；抽查一致 | wiki | E · L1/L2/L3 | concept／匹配 | active → provisional | ✓1/3，单向 3/0，零入 | split, fix-status | 镜像分层、数据生命周期和网络/Compose 可各自验证，七篇旧 raw 支持导读，具体运行版本仍待固定。 |
| `dubbo-nacos-runtime` · [dubbo-nacos-runtime:103](../../src/content/note/zh-cn/dubbo-nacos-runtime.md#L103) | 有；是/是；抽查一致 | wiki | D · L2/L3/L4 | concept／匹配 | active／限证据范围 | ✓2/2，单向 0/2 | add-related | 注册名、group/version 与真实调用是一条发现诊断链，固定 3.3.6 更正配置键，现场 smoke 结果需单独记录。 |
| `frontend-mybatis-essays` · [frontend-mybatis-essays:14](../../src/content/note/zh-cn/frontend-mybatis-essays.md#L14) | 有；是/是；强（FM status） | wiki | G | synthesis／历史标签 | deprecated／归档匹配 | ✓1/3，单向 3/0，零入 | archive | 归档声明与正文一致，Vue、MyBatis、环境随笔是索引摘录，旧 synthesis 标签只代表历史归类。 |
| `hbase-foundation-and-ops` · [hbase-foundation-and-ops:16](../../src/content/note/zh-cn/hbase-foundation-and-ops.md#L16) | 有；是/是；抽查一致 | wiki | C · L1/L2/L3 | concept／匹配 | active → provisional | ✓1/3，单向 2/0 | split, fix-status | 数据模型、Region 运维、RowKey 设计可分别查阅，18 篇快照足以导览，未固定 HBase 版本。 |
| `headroom-cc-switch-coexistence` · [headroom-cc-switch-coexistence:19](../../src/content/note/zh-cn/headroom-cc-switch-coexistence.md#L19) | 有；是/是；抽查一致 | wiki | F→A · L2/L3/L4 | synthesis → concept | provisional／尚欠门 | ✓1/4，单向 0/0 | reclassify-kind, reclassify-domain | 一份 raw 证明特定共存案例，路由责任、回写与权限是同一链；收窄为单一整理责任 concept，保留版本限定。 |
| `headroom-compress-retrieve-contract` · [headroom-compress-retrieve-contract:90](../../src/content/note/zh-cn/headroom-compress-retrieve-contract.md#L90) | 有；否/否；抽查一致（FM related） | wiki | F→A · L1/L2/L3 | concept／匹配 | active／限证据范围 | ✓1/6，单向 0/0 | reclassify-domain | 固定 Headroom 0.34.0 的两个真实端点足以判定 mock 假阳性，是 Agent 适配契约。 |
| `headroom-single-port-evolution` · [headroom-single-port-evolution:50](../../src/content/note/zh-cn/headroom-single-port-evolution.md#L50) | 有；是/是；抽查一致（FM related） | wiki | F→A · L2/L3/L4 | synthesis／匹配 | provisional／尚欠门 | ✓3/7，单向 0/0 | merge, reclassify-domain | 三个 raw 支持历史路由分层；重复冷启动缓存重建和 BindPaths 回滚应由持久化及共存页维护。 |
| `hindsight-local-deployment-and-agent-integration` · [hindsight-local-deployment-and-agent-integration:15](../../src/content/note/zh-cn/hindsight-local-deployment-and-agent-integration.md#L15) | 有；是/是；强（FM status, related） | wiki | G | concept／历史标签 | deprecated／归档匹配 | ✓1/3，单向 3/0，零入 | archive | 已由部署、接入和排障三页接替，448 行命令与实测旧叙述保留历史导引价值；旧 concept 标签覆盖多项主题。 |
| `hindsight-local-deployment` · [hindsight-local-deployment:16](../../src/content/note/zh-cn/hindsight-local-deployment.md#L16) | 有；否/否；强 | wiki | A · L1/L2/L3/L4 | concept／匹配 | active → provisional | ✓1/3，单向 1/1 | fix-status | 容器部署是独立问题，Hindsight 有标签但模型、镜像与驱动未完整固定，离线边界尚待复现。 |
| `hindsight-omp-codex-integration` · [hindsight-omp-codex-integration:151](../../src/content/note/zh-cn/hindsight-omp-codex-integration.md#L151) | 有；否/否；强 | wiki | A · L2/L3/L4 | entity → concept | active → provisional | ✓1/3，单向 1/1 | reclassify-kind, fix-status | 正文以桥接器示例与两种客户端配置讲接入方法，协议状态机仍有缺口；单一方法裁为 concept。 |
| `hindsight-troubleshooting` · [hindsight-troubleshooting:16](../../src/content/note/zh-cn/hindsight-troubleshooting.md#L16) | 有；否/否；强 | wiki | A · L2/L3/L4 | concept／匹配 | active → provisional | ✓1/3，单向 1/1 | fix-status | 七个故障服务同一排查决策，历史记录与文档只能支持有条件的 SOP，部署和协议均未重跑。 |
| `intranet-penetration-ssh-guide` · [intranet-penetration-ssh-guide:18](../../src/content/note/zh-cn/intranet-penetration-ssh-guide.md#L18) | 有；是/是；抽查一致 | wiki | E · L2/L3 | concept／匹配 | active／限证据范围 | ✓1/2，单向 0/2 | keep | Cloudflare、Tailscale、FRP 的五轴选型及恢复是一个远程访问决策，保留历史版本限定并标明验证对象。 |
| `java-atomic-boolean` · [java-atomic-boolean:63](../../src/content/note/zh-cn/java-atomic-boolean.md#L63) | 有；是/是；抽查一致 | wiki | B · L1/L2/L3 | concept／匹配 | active／限证据范围 | ✓1/3，单向 0/1 | keep | 双线程一次副作用断言直接验证 CAS 的二值转换边界，性能结论保持条件化。 |
| `java-auto-closeable` · [java-auto-closeable:74](../../src/content/note/zh-cn/java-auto-closeable.md#L74) | 有；是/是；抽查一致 | wiki | B · L1/L2/L3 | concept／匹配 | active／限证据范围 | ✓1/3，单向 0/1 | keep | 逆序关闭、主异常和 suppressed 异常都能用最小资源探针复核。 |
| `java-concurrency-deepdive` · [java-concurrency-deepdive:14](../../src/content/note/zh-cn/java-concurrency-deepdive.md#L14) | 有；是/是；抽查一致 | wiki | B · L1/L2/L3 | concept／匹配 | active → provisional | ✓1/4，单向 4/1 | split, fix-status | CAS/ABA、锁/线程协作、引用类型是三个问题，15 篇旧包适合作导图，JDK 边界未固定。 |
| `java-internship-interview-blog-polished` · [java-internship-interview-blog-polished:22](../../src/content/note/zh-cn/java-internship-interview-blog-polished.md#L22) | 有；是/是；抽查一致 | wiki | F · L2/L3/L4 | synthesis／匹配 | provisional／尚欠门 | ✓3/4，单向 0/0 | keep | 三源合成项目归属→机制→生产证据三层决策表，仍缺脱敏生产止损与版本固定；F 符合工程能力主题。 |
| `java-null-value` · [java-null-value:18](../../src/content/note/zh-cn/java-null-value.md#L18) | 有；是/是；抽查一致（FM related） | wiki | B · L1/L2/L3 | concept／匹配 | active／限证据范围 | ✓1/5，单向 0/1 | keep | 缓存 miss 与 negative hit、单例/序列化边界都服务于 Java 缓存占位机制。 |
| `java-online-performance-debug` · [java-online-performance-debug:14](../../src/content/note/zh-cn/java-online-performance-debug.md#L14) | 有；是/是；抽查一致（FM related） | wiki | B→E · L2/L3/L4 | concept／匹配 | active／限证据范围 | ✓1/5，单向 0/1 | reclassify-domain | 止损、保留现场、定位 PID/TID/GC 和恢复的主要查询是运行事故，E 主列，B 保留跨域引用。 |
| `jjwt-013-security-api` · [jjwt-013-security-api:137](../../src/content/note/zh-cn/jjwt-013-security-api.md#L137) | 有；是/是；抽查一致 | wiki | B · L1/L2/L3 | concept／匹配 | active／限证据范围 | ✓2/1，单向 0/2 | keep | 签名选算法、验签类型和 aud 是固定 Java 库 API 迁移契约，源码核实与运行测试缺席已明示。 |
| `kb-session-ingest-contract` · [kb-session-ingest-contract:95](../../src/content/note/zh-cn/kb-session-ingest-contract.md#L95) | 有；是/是；抽查一致 | wiki | A · L1/L2/L3/L4 | concept／匹配 | active／限证据范围 | ✓1/1，单向 0/0 | add-related | 固定 c0ae74e 的增量复用和落盘门禁有聚焦测试入口，适合从 LLM-Wiki 模式反链。 |
| `llm-wiki-pattern` · [llm-wiki-pattern:36](../../src/content/note/zh-cn/llm-wiki-pattern.md#L36) | 有；否/否；抽查一致（FM related） | wiki | A · L1/L2 | concept／匹配 | active／限证据范围 | ✓1/7，单向 0/0 | add-related | 三层架构及 ingest/query/lint 是模式定义，可用本库的索引、raw、wiki 与日志作为检验路径。 |
| `mcp-codebase-memory-workflow` · [mcp-codebase-memory-workflow:16](../../src/content/note/zh-cn/mcp-codebase-memory-workflow.md#L16) | 有；是/是；抽查一致 | wiki | A · L1/L2/L3 | concept／匹配 | active／限证据范围 | ✓1/1，单向 0/1 | split | 协议时代兼容与图负结论覆盖检查可独立核验；留图工作流，抽协议兼容，静态结果与真实二进制分列。 |
| `microservice-data-ownership` · [microservice-data-ownership:16](../../src/content/note/zh-cn/microservice-data-ownership.md#L16) | 有；是/是；抽查一致 | wiki | D · L1/L2/L3 | concept／匹配 | active／限证据范围 | ✓2/3，单向 0/2 | keep | 先判 owner 再选数据库与渐进迁移，Saga/Outbox 是该决策的后续分支，已用 correction 固定文档。 |
| `multi-service-readiness` · [multi-service-readiness:79](../../src/content/note/zh-cn/multi-service-readiness.md#L79) | 有；是/是；抽查一致 | wiki | D · L1/L2/L3 | concept／匹配 | active／限证据范围 | ✓3/5，单向 0/5 | keep | 固定 Compose 镜像与两份更正支撑启动隔离；业务 ready、排序与传播展现的是同一门禁决策。 |
| `mysql-performance-troubleshooting` · [mysql-performance-troubleshooting:18](../../src/content/note/zh-cn/mysql-performance-troubleshooting.md#L18) | 有；是/是；抽查一致（FM related） | wiki | C · L2/L3/L4 | concept／匹配 | active／限证据范围 | ✓1/4，单向 0/2 | add-related | 四层定位归结到数据库瓶颈与止损，适合接回 MySQL 锁、SQL 复盘和 Flyway 跨页入口。 |
| `mysql-storage-and-deadlock` · [mysql-storage-and-deadlock:16](../../src/content/note/zh-cn/mysql-storage-and-deadlock.md#L16) | 有；是/是；抽查一致 | wiki | C · L1/L2/L3 | concept／匹配 | active → provisional | ✓1/3，单向 3/2 | fix-status | 引擎能力和死锁日志路径连到以 InnoDB 为边界的诊断，来源有三篇但引擎运行版本未固定。 |
| `omp-config-and-rules-guide` · [omp-config-and-rules-guide:49](../../src/content/note/zh-cn/omp-config-and-rules-guide.md#L49) | 有；是/是；强（FM sources） | wiki | F→A · L1/L2/L3 | concept／匹配 | active／限证据范围 | ✓3/4，单向 0/1 | split, reclassify-domain | 角色/覆盖/fallback 与 compaction、snapcompact、TTSR 是两类契约；将后者抽出，正典有 17.2.15 更正。 |
| `omp-headroom-persistence` · [omp-headroom-persistence:22](../../src/content/note/zh-cn/omp-headroom-persistence.md#L22) | 有；是/是；强（FM sources, related） | wiki | F→A · L2/L3/L4 | synthesis／匹配 | provisional／尚欠门 | ✓5/7，单向 0/0 | reclassify-domain | Named Profile、意图与派生缓存共属恢复分层综合；保留旧 reconciler 的一次性迁移取证。 |
| `omp-headroom-provider-proxy` · [omp-headroom-provider-proxy:99](../../src/content/note/zh-cn/omp-headroom-provider-proxy.md#L99) | 有；是/是；抽查一致 | wiki | F→A · L3/L4 | entity／匹配 | provisional／尚欠门 | ✓1/4，单向 0/0 | reclassify-domain | 外部路由控制器有实体边界；固定提交标 lineage，本次工作树交付及回滚仍需绑定提交与可重现实验。 |
| `omp-hook-extension-guide` · [omp-hook-extension-guide:18](../../src/content/note/zh-cn/omp-hook-extension-guide.md#L18) | 有；是/是；强（FM sources, related） | wiki | F→A · L1/L2/L3 | concept／匹配 | active／限证据范围 | ✓3/5，单向 0/1 | reclassify-domain | 事件软提示、硬阻断与状态显示是同一 Hook 决策，17.2.15 固定来源支撑静态边界。 |
| `plugin-lifecycle-management` · [plugin-lifecycle-management:16](../../src/content/note/zh-cn/plugin-lifecycle-management.md#L16) | 有；是/是；抽查一致 | wiki | E→F · L1/L2/L3 | concept／匹配 | active → provisional | ✓1/1，单向 0/1 | fix-status, reclassify-domain | 端侧控制面模型讲状态、幂等与受控发布；容量假设无生产或固定实验支撑，应先标 provisional。 |
| `redis-business-patterns` · [redis-business-patterns:18](../../src/content/note/zh-cn/redis-business-patterns.md#L18) | 有；是/是；抽查一致 | wiki | C · L1/L2/L3 | concept／匹配 | active → provisional | ✓1/4，单向 2/4 | split, fix-status | 缓存一致性、分布式互斥和消息语义各有验证，现页保留选路导览，不能把同一课程的覆盖当运行验证。 |
| `redis-heima-practice` · [redis-heima-practice:18](../../src/content/note/zh-cn/redis-heima-practice.md#L18) | 有；是/是；抽查一致 | wiki | C · L3 | concept／历史标签 | active → deprecated | ✓1/3，单向 2/0 | merge, archive | 正文是课程学习清单，秒杀/锁/队列与业务页重复，多级缓存及 pipeline 选段可迁移，源包继续可查。 |
| `redis-jackson-java-time` · [redis-jackson-java-time:102](../../src/content/note/zh-cn/redis-jackson-java-time.md#L102) | 有；是/是；抽查一致 | wiki | B · L1/L2/L3 | concept／匹配 | active／限证据范围 | ✓1/3，单向 0/3 | keep | 固定版本的纯内存 8 组断言支撑默认写入失败与跨 mapper 读失败的区别。 |
| `redis-persistence-principle` · [redis-persistence-principle:16](../../src/content/note/zh-cn/redis-persistence-principle.md#L16) | 有；是/是；抽查一致 | wiki | C · L1/L2/L3 | concept／匹配 | active → provisional | ✓1/3，单向 1/0 | fix-status | RDB/AOF 恢复权衡可独立保存，底层结构与淘汰由未固定版本的课程引出，应限为索引提示。 |
| `resicache-early-expiration-cas` · [resicache-early-expiration-cas:143](../../src/content/note/zh-cn/resicache-early-expiration-cas.md#L143) | 有；否/否；抽查一致 | wiki | F · L1/L2/L3/L4 | concept／匹配 | provisional／尚欠门 | ✓2/2，单向 2/0，零入 | add-related | 版本 CAS 防止旧任务改新值，ASYNC 仅缩 TTL，任务取消与锁内校验是同一反例链。 |
| `resicache-handler-chain-and-observer` · [resicache-handler-chain-and-observer:153](../../src/content/note/zh-cn/resicache-handler-chain-and-observer.md#L153) | 有；否/否；抽查一致 | wiki | F · L1/L2/L3/L4 | concept／匹配 | provisional／尚欠门 | ✓3/2，单向 2/0，零入 | merge, add-related | 责任链顺序与 HandlerResult 独立，§fragment/token 与旧 observer 专页重合；保留新提交的差异。 |
| `resicache-observer-nested-execution` · [resicache-observer-nested-execution:103](../../src/content/note/zh-cn/resicache-observer-nested-execution.md#L103) | 有；是/是；部分（FM related） | wiki | D→F · L2/L3/L4 | concept／匹配 | active／限证据范围 | ✓1/2，单向 0/2 | merge, reclassify-domain | 旧固定提交及单独可执行模型是独有证据，保留为 fragment/token 专页并接上新版本比较。 |
| `resicache-serialization-migration` · [resicache-serialization-migration:46](../../src/content/note/zh-cn/resicache-serialization-migration.md#L46) | 有；否/否；抽查一致 | wiki | F · L1/L2/L3/L4 | concept／匹配 | provisional／尚欠门 | ✓2/2，单向 2/0，零入 | split, add-related | 304 行兼讲白名单/preflight 与影子、切换、回滚并发保护，应拆成对象信任与迁移两条验证链。 |
| `resicache-single-flight` · [resicache-single-flight:101](../../src/content/note/zh-cn/resicache-single-flight.md#L101) | 有；否/否；抽查一致 | wiki | F · L1/L2/L3/L4 | concept／匹配 | provisional／尚欠门 | ✓2/2，单向 2/0，零入 | add-related | leader/follower/reentrant、双重检查和写回结果共同回答一次加载的归属，测试入口不等于本轮已跑。 |
| `resicache` · [resicache:56](../../src/content/note/zh-cn/resicache.md#L56) | 有；否/否；强（FM status, sources） | wiki | F · L2/L3/L4 | entity／匹配 | provisional／尚欠门 | ✓3/4，单向 3/4 | merge, add-related | 实体适合总览，当前五组实现说明复写拆解页；缩短为项目定位、版本与证据地图。 |
| `spark-bigdata-ecosystem` · [spark-bigdata-ecosystem:16](../../src/content/note/zh-cn/spark-bigdata-ecosystem.md#L16) | 有；是/是；抽查一致 | wiki | C · L1/L2/L3 | concept／匹配 | active → provisional | ✓1/3，单向 2/1 | fix-status | 引擎/运行模式服务选型，七篇聚合支持历史导览；Spark/Hadoop 与 YARN/HA 需定版。 |
| `spring-cloud-and-boot` · [spring-cloud-and-boot:16](../../src/content/note/zh-cn/spring-cloud-and-boot.md#L16) | 有；是/是；抽查一致 | wiki | D · L1/L2/L3 | concept／匹配 | active → provisional | ✓1/4，单向 4/1 | split, fix-status | 自动装配、事务、注册发现到网关可独立核验；保留微服务调用链导航并按问题下钻。 |
| `testcontainers-docker-api` · [testcontainers-docker-api:87](../../src/content/note/zh-cn/testcontainers-docker-api.md#L87) | 有；是/是；抽查一致 | wiki | E · L1/L2/L3 | concept／匹配 | active／限证据范围 | ✓2/2，单向 0/0 | add-related | 1.20.6 的 1.32 fallback 与 400 误判是单个诊断命题；固定源码和更正可查，版本止于 1.20.6。 |
| `uisa-architecture-design` · [uisa-architecture-design:24](../../src/content/note/zh-cn/uisa-architecture-design.md#L24) | 有；是/是；抽查一致 | wiki | F · L2/L3/L4 | synthesis／匹配 | provisional／尚欠门 | ✓2/1，单向 0/0 | keep | 两 raw 的 owner 与控制面失败矩阵有实质综合，身份、离线恢复、治理共同组成一条设计主张；缺实测。 |
| `ulticode-async-execution-contract` · [ulticode-async-execution-contract:49](../../src/content/note/zh-cn/ulticode-async-execution-contract.md#L49) | 有；否/否；抽查一致 | wiki | F · L2/L3/L4 | concept／匹配 | provisional／尚欠门 | ✓1/1，单向 0/0 | add-related | 同步/异步共用契约是单一主张，显式注明 receipt 只在进程内，跨重启证明仍缺。 |
| `ulticode-ci-supply-chain` · [ulticode-ci-supply-chain:43](../../src/content/note/zh-cn/ulticode-ci-supply-chain.md#L43) | 有；否/否；抽查一致 | wiki | F · L2/L3/L4 | concept／匹配 | provisional／尚欠门 | ✓1/1，单向 0/0 | split | 静态/集成验证的 gate 与镜像 SBOM、签名、provenance 是独立交付职责，应分节入口与发布专项。 |
| `ulticode-core-bounded-testbed` · [ulticode-core-bounded-testbed:81](../../src/content/note/zh-cn/ulticode-core-bounded-testbed.md#L81) | 有；否/否；抽查一致 | wiki | F · L2/L3/L4 | concept／匹配 | provisional／尚欠门 | ✓1/3，单向 2/0 | keep | allowlist、超时、close-once 共同定义受限测试场；ClassLoader 边界注明不提供隔离保证。 |
| `ulticode-docker-sandbox` · [ulticode-docker-sandbox:68](../../src/content/note/zh-cn/ulticode-docker-sandbox.md#L68) | 有；否/否；抽查一致 | wiki | F · L2/L3/L4 | concept／匹配 | provisional／尚欠门 | ✓1/1，单向 0/0 | keep | 沙箱资源限制与故障归因可按同一执行场景检验，仍需目标环境和独立安全证据。 |
| `ulticode-fenced-singleton-lease` · [ulticode-fenced-singleton-lease:54](../../src/content/note/zh-cn/ulticode-fenced-singleton-lease.md#L54) | 有；否/否；抽查一致 | wiki | F · L2/L3/L4 | concept／匹配 | provisional／尚欠门 | ✓1/2，单向 1/0 | keep | 租约接管后旧任务完工必须被 fence 拒绝，是可独立复核的单一并发协议。 |
| `ulticode-generation-attempt-fence` · [ulticode-generation-attempt-fence:23](../../src/content/note/zh-cn/ulticode-generation-attempt-fence.md#L23) | 有；否/否；抽查一致 | wiki | F · L2/L3/L4 | concept／匹配 | provisional／尚欠门 | ✓1/1，单向 0/2 | keep | SQL 围栏约束旧结果写回，和任务租约的 fencing 共享概念但保护对象不同。 |
| `ulticode-outbox-redis-streams` · [ulticode-outbox-redis-streams:59](../../src/content/note/zh-cn/ulticode-outbox-redis-streams.md#L59) | 有；否/否；抽查一致 | wiki | F · L2/L3/L4 | concept／匹配 | provisional／尚欠门 | ✓1/1，单向 0/1 | keep | 判题投递状态、PEL 回收与幂等边界解决同一个可恢复投递问题。 |
| `ulticode-owner-and-facts` · [ulticode-owner-and-facts:35](../../src/content/note/zh-cn/ulticode-owner-and-facts.md#L35) | 有；否/否；抽查一致 | wiki | F · L2/L3/L4 | concept／匹配 | provisional／尚欠门 | ✓1/1，单向 0/2 | add-related | 不可变 SubmissionFactsSnapshot 界定提交写入授权的事实来源；适合从通用 owner 页反链。 |
| `ulticode-owner-local-audit-inbox` · [ulticode-owner-local-audit-inbox:66](../../src/content/note/zh-cn/ulticode-owner-local-audit-inbox.md#L66) | 有；否/否；抽查一致 | wiki | F · L2/L3/L4 | concept／匹配 | provisional／尚欠门 | ✓1/3，单向 2/0 | keep | Owner-local outbox 到先持久化 Inbox 再 ACK 属于同一审计接管链，和判题 outbox 应分开。 |
| `ulticode` · [ulticode:24](../../src/content/note/zh-cn/ulticode.md#L24) | 有；否/否；强（FM sources, related） | wiki | F · L2/L3/L4 | entity／匹配 | provisional／尚欠门 | ✓3/14，单向 5/0 | merge | 实体已列九篇拆解，主文再次详述七条设计与迁移启示；缩回项目入口并迁移独有证据。 |

### 收件箱、导航与保护面（8 slug × 3 语言）

这三类不声明 Wiki kind/status，也不要求 raw/related。三语版本均存在，无 draft 声明。正文证据链接指向正典。

| slug / 路径 | 语言覆盖与差异 | 层 | 域 | kind/status | 证据链 | 裁决 | 正文依据 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `src/content/jotting/{zh-cn,en,ja}/kb-ingest-todo.md` | 源快照 en/ja 中文为主；已摄入段一致，新增待验证摘要滞后 | inbox | M | — | 不适用 | keep | 正文 §已完成摄入与 §待回答问题明确候选和证据门。 [kb-ingest-todo:10](../../src/content/jotting/zh-cn/kb-ingest-todo.md#L10) |
| `src/content/information/{zh-cn,en,ja}/kb-index.md` | 英日原始目录未更新，仍只列两篇翻译；实际发布目录已扩展 | navigation | M | — | 不适用 | keep | 正典按 A–G 编排及汇总 raw，毕业板和来源行需修正。 [kb-index:19](../../src/content/information/zh-cn/kb-index.md#L19) |
| `src/content/information/{zh-cn,en,ja}/kb-log.md` | 29／8／8 条；en/ja 止于 2026-08-12 | navigation | M | — | 不适用 | keep | 正文声明操作史为追加记录，新更正只追加。 [kb-log:3](../../src/content/information/zh-cn/kb-log.md#L3) |
| `src/content/information/{zh-cn,en,ja}/chronicle.yaml` | 三语有；en 缺 2026-02-23 记录 | protected-identity | M | — | 不适用 | keep | 各日期列博客从创建到个性化的用户时间线。 [chronicle:1](../../src/content/information/zh-cn/chronicle.yaml#L1) |
| `src/content/information/{zh-cn,en,ja}/linkroll.mdx` | 三语有；五目标及荐链主张一致 | protected-identity | M | — | 不适用 | keep | 正文包含站主对手工维护与真实推荐的立场。 [linkroll:40](../../src/content/information/zh-cn/linkroll.mdx#L40) |
| `src/content/information/{zh-cn,en,ja}/policy.md` | 三语有；抽查主题偏好、条款和免责主张一致 | protected-identity | M | — | 不适用 | keep | 站点隐私政策、服务条款、许可和免责声明。 [policy:1](../../src/content/information/zh-cn/policy.md#L1) |
| `src/content/preface/{zh-cn,en,ja}/2026-01-01-00-00-00.md` | 三语有；语录意思一致 | navigation | M | — | 不适用 | keep | 展示 Knuth 的过早优化引语。 [2026-01-01-00-00-00:6](../../src/content/preface/zh-cn/2026-01-01-00-00-00.md#L6) |
| `src/content/preface/{zh-cn,en,ja}/2026-06-19-18-00-00.md` | 三语有；语录意思一致 | navigation | M | — | 不适用 | keep | 展示先解决问题再写代码的约翰逊引语。 [2026-06-19-18-00-00:6](../../src/content/preface/zh-cn/2026-06-19-18-00-00.md#L6) |

## raw 逐份映射

`legacy-aggregate` 来自索引的显式标注。1 raw ≈ 1 小包定义为 1–3 篇同主题原文或固定提交的证据选段。“边界”表示规模形式符合或只有一个原稿，但按内容混入可独立追溯的命题。对应页按正典 frontmatter 的 `sources` 反查，三语相同的 slug 只列一次。更正栏包含原→更正以及更正→原，另标 OMP 历史来源的后续补强关系。

路径为 `src/content/raw/zh-cn/<slug>` 加 `.md`。以下各项 kind/status 均不适用。

| raw slug / 文件 | 层 / 域 | 语言 | sourceType（实际值） | 对应 Wiki | legacy-aggregate | 修正或补强 | 小包判断及正文理由 | 裁决 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `database-schema-drift-contract` · [database-schema-drift-contract:35](../../src/content/raw/zh-cn/database-schema-drift-contract.md#L35) | raw-evidence · D | zh-cn；英日不复制 | `upstream-docs-and-minimal-experiment` | `database-schema-drift` | 否 | — | 是，Flyway history 与 MySQL 在线 schema 同一漂移诊断。 | keep |
| `database-written-test-review` · [database-written-test-review:304](../../src/content/raw/zh-cn/database-written-test-review.md#L304) | raw-evidence · C | zh-cn；英日不复制 | `user-provided-local-markdown` | `database-written-test-review` | 否 | — | 边界，单篇原稿符合单来源，但 SQL 方言、四表写入、Kettle/超大表跨主题。 | keep |
| `dubbo-nacos-runtime-registration-correction` · [dubbo-nacos-runtime-registration-correction:16](../../src/content/raw/zh-cn/dubbo-nacos-runtime-registration-correction.md#L16) | raw-evidence · D | zh-cn；英日不复制 | `upstream-source-fixed-tag-correction` | `dubbo-nacos-runtime` | 否 | ← `dubbo-nacos-runtime-registration` | 是，仅收注册 URL 配置键差异。 | keep |
| `dubbo-nacos-runtime-registration` · [dubbo-nacos-runtime-registration:19](../../src/content/raw/zh-cn/dubbo-nacos-runtime-registration.md#L19) | raw-evidence · D | zh-cn；英日不复制 | `upstream-source-fixed-tag-and-docs` | `dubbo-nacos-runtime` | 否 | → `dubbo-nacos-runtime-registration-correction` | 是，同一固定 Dubbo 注册发现行为。 | keep |
| `headroom-0-34-compress-retrieve-contract` · [headroom-0-34-compress-retrieve-contract:15](../../src/content/raw/zh-cn/headroom-0-34-compress-retrieve-contract.md#L15) | raw-evidence · A | zh-cn；英日不复制 | `upstream-source-and-contract-test` | `headroom-compress-retrieve-contract` | 否 | — | 是，两端点属于同一压缩取回协议。 | keep |
| `headroom-cc-switch-coexistence-runtime` · [headroom-cc-switch-coexistence-runtime:46](../../src/content/raw/zh-cn/headroom-cc-switch-coexistence-runtime.md#L46) | raw-evidence · A | zh-cn；英日不复制 | `repository-and-runtime-observation` | `headroom-cc-switch-coexistence` | 否 | — | 是，同一部署的路由与回写/安全边界。 | keep |
| `hindsight-local-deployment-and-agent-integration` · [hindsight-local-deployment-and-agent-integration:15](../../src/content/raw/zh-cn/hindsight-local-deployment-and-agent-integration.md#L15) | raw-evidence · A | zh-cn；英日不复制 | `local-deployment-and-contract-test` | `hindsight-local-deployment-and-agent-integration`, `hindsight-local-deployment`, `hindsight-omp-codex-integration`, `hindsight-troubleshooting` | 否 | — | 边界，一份部署记录，但模型/容器、桥接和排障三主题，固定标签只覆盖 Hindsight。 | keep |
| `ingest-docker-fundamentals` · [ingest-docker-fundamentals:21](../../src/content/raw/zh-cn/ingest-docker-fundamentals.md#L21) | raw-evidence · E | zh-cn；英日不复制 | `personal-notes-and-fuwari` | `docker-fundamentals` | 是 | — | 否，7 篇，镜像、运行、卷与网络。 | keep |
| `ingest-frontend-essays` · [ingest-frontend-essays:21](../../src/content/raw/zh-cn/ingest-frontend-essays.md#L21) | raw-evidence · G | zh-cn；英日不复制 | `personal-notes-and-fuwari` | `frontend-mybatis-essays` | 是 | — | 否，10 篇，前端、MyBatis、系统排障等。 | keep |
| `ingest-hbase-foundation` · [ingest-hbase-foundation:21](../../src/content/raw/zh-cn/ingest-hbase-foundation.md#L21) | raw-evidence · C | zh-cn；英日不复制 | `personal-notes-and-fuwari-overlap` | `hbase-foundation-and-ops` | 是 | — | 否，18 篇，模型、架构、运维、设计与 API。 | keep |
| `ingest-java-concurrency` · [ingest-java-concurrency:21](../../src/content/raw/zh-cn/ingest-java-concurrency.md#L21) | raw-evidence · B | zh-cn；英日不复制 | `personal-notes-and-fuwari` | `java-concurrency-deepdive` | 是 | — | 否，15 篇，原子类、锁、线程与引用。 | keep |
| `ingest-mysql-storage` · [ingest-mysql-storage:21](../../src/content/raw/zh-cn/ingest-mysql-storage.md#L21) | raw-evidence · C | zh-cn；英日不复制 | `personal-notes-and-fuwari` | `mysql-storage-and-deadlock` | 是 | — | 边界，三篇在上限内，面试题、引擎与死锁横跨两个核心问题。 | keep |
| `ingest-redis-business` · [ingest-redis-business:21](../../src/content/raw/zh-cn/ingest-redis-business.md#L21) | raw-evidence · C | zh-cn；英日不复制 | `personal-notes-and-fuwari` | `redis-business-patterns` | 是 | — | 否，20 篇，缓存、锁、消息、Feed 与秒杀。 | keep |
| `ingest-redis-heima` · [ingest-redis-heima:21](../../src/content/raw/zh-cn/ingest-redis-heima.md#L21) | raw-evidence · C | zh-cn；英日不复制 | `personal-notes-and-heima-course` | `redis-heima-practice` | 是 | — | 否，来源清单 6 条；发布材料声称 5 篇且 3 重复，清单重复栏为空，无法据此判精确去重数。 | keep |
| `ingest-redis-persistence` · [ingest-redis-persistence:21](../../src/content/raw/zh-cn/ingest-redis-persistence.md#L21) | raw-evidence · C | zh-cn；英日不复制 | `personal-notes-and-heima-course` | `redis-persistence-principle` | 是 | — | 边界，三篇在上限内，但原理篇含非持久化的内部结构与过期。 | keep |
| `ingest-spark-ecosystem` · [ingest-spark-ecosystem:21](../../src/content/raw/zh-cn/ingest-spark-ecosystem.md#L21) | raw-evidence · C | zh-cn；英日不复制 | `personal-notes-and-fuwari` | `spark-bigdata-ecosystem` | 是 | — | 否，七篇，多个引擎、运行模式和部署脚本。 | keep |
| `ingest-spring-cloud` · [ingest-spring-cloud:21](../../src/content/raw/zh-cn/ingest-spring-cloud.md#L21) | raw-evidence · D | zh-cn；英日不复制 | `personal-notes-and-fuwari` | `spring-cloud-and-boot` | 是 | — | 否，13 篇，自动装配、事务、服务发现与可观测。 | keep |
| `jjwt-013-security-api-contract-correction` · [jjwt-013-security-api-contract-correction:16](../../src/content/raw/zh-cn/jjwt-013-security-api-contract-correction.md#L16) | raw-evidence · B | zh-cn；英日不复制 | `upstream-source-fixed-tag-correction` | `jjwt-013-security-api` | 否 | ← `jjwt-013-security-api-contract` | 是，同版本算法强度与 key 类型更正。 | keep |
| `jjwt-013-security-api-contract` · [jjwt-013-security-api-contract:35](../../src/content/raw/zh-cn/jjwt-013-security-api-contract.md#L35) | raw-evidence · B | zh-cn；英日不复制 | `upstream-source-fixed-tag` | `jjwt-013-security-api` | 否 | → `jjwt-013-security-api-contract-correction` | 是，同一版本签名、验签与 audience。 | keep |
| `karpathy-llm-wiki` · [karpathy-llm-wiki:35](../../src/content/raw/zh-cn/karpathy-llm-wiki.md#L35) | raw-evidence · A | zh-cn；英日不复制 | `gist` | `llm-wiki-pattern` | 否 | — | 是，一个固定 gist 讲同一知识库模式。 | keep |
| `kb-ingest-pipeline-v19` · [kb-ingest-pipeline-v19:26](../../src/content/raw/zh-cn/kb-ingest-pipeline-v19.md#L26) | raw-evidence · A | zh-cn；英日不复制 | `repository` | `kb-session-ingest-contract` | 否 | — | 是，固定摄入提交，多个阶段构成同一落盘契约。 | keep |
| `legacy-containerd-tls-troubleshooting` · [legacy-containerd-tls-troubleshooting:37](../../src/content/raw/zh-cn/legacy-containerd-tls-troubleshooting.md#L37) | raw-evidence · E | zh-cn；英日不复制 | `legacy-blog` | `containerd-tls-troubleshooting` | 否 | — | 是，一份私仓 TLS 故障分层长文。 | keep |
| `legacy-headroom-single-port-evolution` · [legacy-headroom-single-port-evolution:68](../../src/content/raw/zh-cn/legacy-headroom-single-port-evolution.md#L68) | raw-evidence · A | zh-cn；英日不复制 | `legacy-blog` | `headroom-single-port-evolution`, `omp-headroom-persistence` | 否 | — | 是，一份迁移时间线，主要针对同一入口。 | keep |
| `legacy-intranet-penetration-ssh-guide` · [legacy-intranet-penetration-ssh-guide:211](../../src/content/raw/zh-cn/legacy-intranet-penetration-ssh-guide.md#L211) | raw-evidence · E | zh-cn；英日不复制 | `legacy-blog` | `intranet-penetration-ssh-guide` | 否 | — | 是，一份 SSH 远程接入选型。 | keep |
| `legacy-java-atomic-boolean` · [legacy-java-atomic-boolean:144](../../src/content/raw/zh-cn/legacy-java-atomic-boolean.md#L144) | raw-evidence · B | zh-cn；英日不复制 | `legacy-blog` | `java-atomic-boolean` | 否 | — | 是，一份二值 CAS 文章。 | keep |
| `legacy-java-auto-closeable` · [legacy-java-auto-closeable:102](../../src/content/raw/zh-cn/legacy-java-auto-closeable.md#L102) | raw-evidence · B | zh-cn；英日不复制 | `legacy-blog` | `java-auto-closeable` | 否 | — | 是，一份作用域关闭语义文章。 | keep |
| `legacy-java-internship-interview-blog-polished` · [legacy-java-internship-interview-blog-polished:54](../../src/content/raw/zh-cn/legacy-java-internship-interview-blog-polished.md#L54) | raw-evidence · F | zh-cn；英日不复制 | `legacy-blog` | `java-internship-interview-blog-polished` | 否 | — | 边界，一份面试原文，工程机制横跨缓存、排障与基础设施。 | keep |
| `legacy-java-null-value` · [legacy-java-null-value:125](../../src/content/raw/zh-cn/legacy-java-null-value.md#L125) | raw-evidence · B | zh-cn；英日不复制 | `legacy-blog` | `java-internship-interview-blog-polished`, `java-null-value` | 否 | — | 是，一份空值占位文章。 | keep |
| `legacy-java-online-performance-debug` · [legacy-java-online-performance-debug:37](../../src/content/raw/zh-cn/legacy-java-online-performance-debug.md#L37) | raw-evidence · E | zh-cn；英日不复制 | `legacy-blog` | `java-internship-interview-blog-polished`, `java-online-performance-debug` | 否 | — | 是，高 CPU 与现场执行的一份排查来源。 | keep |
| `legacy-mysql-performance-troubleshooting` · [legacy-mysql-performance-troubleshooting:49](../../src/content/raw/zh-cn/legacy-mysql-performance-troubleshooting.md#L49) | raw-evidence · C | zh-cn；英日不复制 | `legacy-blog` | `mysql-performance-troubleshooting` | 否 | — | 是，一份五层性能诊断手册。 | keep |
| `legacy-omp-config-and-rules-guide` · [legacy-omp-config-and-rules-guide:19](../../src/content/raw/zh-cn/legacy-omp-config-and-rules-guide.md#L19) | raw-evidence · A | zh-cn；英日不复制 | `legacy-blog` | `headroom-single-port-evolution`, `omp-config-and-rules-guide`, `omp-headroom-persistence` | 否 | 后续补强 → `omp-17-2-15-runtime-contract` 与其 correction | 边界，一份原文含角色路由、代理和规则三套契约。 | keep |
| `legacy-omp-headroom-persistence` · [legacy-omp-headroom-persistence:68](../../src/content/raw/zh-cn/legacy-omp-headroom-persistence.md#L68) | raw-evidence · A | zh-cn；英日不复制 | `legacy-blog` | `headroom-single-port-evolution`, `omp-headroom-persistence` | 否 | 后续补强 → `omp-17-2-15-runtime-contract` 与其 correction | 是，同一路由状态隔离及恢复。 | keep |
| `legacy-omp-hook-extension-guide` · [legacy-omp-hook-extension-guide:20](../../src/content/raw/zh-cn/legacy-omp-hook-extension-guide.md#L20) | raw-evidence · A | zh-cn；英日不复制 | `legacy-blog` | `omp-hook-extension-guide` | 否 | 后续补强 → `omp-17-2-15-runtime-contract` 与其 correction | 是，两个案例都验证同一个 Hook 决策点。 | keep |
| `legacy-plugin-lifecycle-management` · [legacy-plugin-lifecycle-management:58](../../src/content/raw/zh-cn/legacy-plugin-lifecycle-management.md#L58) | raw-evidence · F | zh-cn；英日不复制 | `legacy-note` | `plugin-lifecycle-management`, `uisa-architecture-design` | 否 | — | 是，同一终端插件控制面设计。 | keep |
| `legacy-uisa-architecture-design` · [legacy-uisa-architecture-design:29](../../src/content/raw/zh-cn/legacy-uisa-architecture-design.md#L29) | raw-evidence · F | zh-cn；英日不复制 | `legacy-note` | `uisa-architecture-design` | 否 | — | 是，同一异构节点同步系统设计。 | keep |
| `mcp-codebase-memory-workflow` · [mcp-codebase-memory-workflow:75](../../src/content/raw/zh-cn/mcp-codebase-memory-workflow.md#L75) | raw-evidence · A | zh-cn；英日不复制 | `upstream-spec-and-source` | `mcp-codebase-memory-workflow` | 否 | — | 边界，两个版本固定点，包含协议兼容与图查询验证两项问题。 | keep |
| `microservice-domain-data-ownership-correction` · [microservice-domain-data-ownership-correction:16](../../src/content/raw/zh-cn/microservice-domain-data-ownership-correction.md#L16) | raw-evidence · D | zh-cn；英日不复制 | `upstream-patterns-fixed-docs-correction` | `microservice-data-ownership` | 否 | ← `microservice-domain-data-ownership` | 是，仅收同一所有权论证的固定文档更正。 | keep |
| `microservice-domain-data-ownership` · [microservice-domain-data-ownership:28](../../src/content/raw/zh-cn/microservice-domain-data-ownership.md#L28) | raw-evidence · D | zh-cn；英日不复制 | `upstream-patterns-and-fixed-doc-snapshots` | `microservice-data-ownership` | 否 | → `microservice-domain-data-ownership-correction` | 是，源多但同一数据所有权判定。 | keep |
| `multi-service-readiness-contract-correction` · [multi-service-readiness-contract-correction:59](../../src/content/raw/zh-cn/multi-service-readiness-contract-correction.md#L59) | raw-evidence · D | zh-cn；英日不复制 | `upstream-spec-source-and-minimal-experiment` | `multi-service-readiness` | 否 | → `multi-service-readiness-safety-correction`<br>← `multi-service-readiness-contract` | 是，同一启动契约的固定来源及匿名实验。 | keep |
| `multi-service-readiness-contract` · [multi-service-readiness-contract:28](../../src/content/raw/zh-cn/multi-service-readiness-contract.md#L28) | raw-evidence · D | zh-cn；英日不复制 | `upstream-spec-and-manpage` | `multi-service-readiness` | 否 | → `multi-service-readiness-contract-correction`<br>→ `multi-service-readiness-safety-correction` | 是，同一运行/就绪决定，横比 Compose/systemd。 | keep |
| `multi-service-readiness-safety-correction` · [multi-service-readiness-safety-correction:24](../../src/content/raw/zh-cn/multi-service-readiness-safety-correction.md#L24) | raw-evidence · D | zh-cn；英日不复制 | `upstream-source-fixed-tag` | `multi-service-readiness` | 否 | ← `multi-service-readiness-contract`<br>← `multi-service-readiness-contract-correction` | 是，聚焦同一实验的项目隔离与清理。 | keep |
| `omp-17-2-15-runtime-contract-correction` · [omp-17-2-15-runtime-contract-correction:15](../../src/content/raw/zh-cn/omp-17-2-15-runtime-contract-correction.md#L15) | raw-evidence · A | zh-cn；英日不复制 | `upstream-source-fixed-commit` | `omp-config-and-rules-guide`, `omp-headroom-persistence`, `omp-hook-extension-guide` | 否 | ← `omp-17-2-15-runtime-contract` | 是，同一固定提交，多处 delta 应按章节回溯。 | keep |
| `omp-17-2-15-runtime-contract` · [omp-17-2-15-runtime-contract:15](../../src/content/raw/zh-cn/omp-17-2-15-runtime-contract.md#L15) | raw-evidence · A | zh-cn；英日不复制 | `upstream-source-fixed-tag` | `omp-config-and-rules-guide`, `omp-headroom-persistence`, `omp-hook-extension-guide` | 否 | → `omp-17-2-15-runtime-contract-correction` | 是，同一固定版本提交，Hooks/Compaction 等章节分别回溯。 | keep |
| `omp-headroom-provider-proxy-codex-routing-runtime` · [omp-headroom-provider-proxy-codex-routing-runtime:13](../../src/content/raw/zh-cn/omp-headroom-provider-proxy-codex-routing-runtime.md#L13) | raw-evidence · A | zh-cn；英日不复制 | `repository-and-runtime-observation` | `omp-headroom-provider-proxy` | 否 | — | 是，一份项目架构与运行时摘要，固定 URL 只识别 lineage。 | keep |
| `redis-jackson-java-time-contract` · [redis-jackson-java-time-contract:34](../../src/content/raw/zh-cn/redis-jackson-java-time-contract.md#L34) | raw-evidence · B | zh-cn；英日不复制 | `upstream-source-and-minimal-experiment` | `redis-jackson-java-time` | 否 | — | 是，同一 Java 时间类型编解码实验。 | keep |
| `resicache-engineering-highlights-2954fff` · [resicache-engineering-highlights-2954fff:17](../../src/content/raw/zh-cn/resicache-engineering-highlights-2954fff.md#L17) | raw-evidence · F | zh-cn；英日不复制 | `repository-source-and-test-selected-excerpts-fixed-commit` | `resicache-early-expiration-cas`, `resicache-handler-chain-and-observer`, `resicache-serialization-migration`, `resicache-single-flight`, `resicache` | 否 | — | 是，满足一固定提交例外；责任链、CAS、序列化等应按章节引用。 | keep |
| `resicache-observer-nested-execution-contract` · [resicache-observer-nested-execution-contract:24](../../src/content/raw/zh-cn/resicache-observer-nested-execution-contract.md#L24) | raw-evidence · F | zh-cn；英日不复制 | `upstream-source-fixed-commit` | `resicache-handler-chain-and-observer`, `resicache-observer-nested-execution`, `resicache` | 否 | — | 是，同一固定提交、同一观察者生命周期。 | keep |
| `resicache-project-overview` · [resicache-project-overview:21](../../src/content/raw/zh-cn/resicache-project-overview.md#L21) | raw-evidence · F | zh-cn；英日不复制 | `repository-readme-fixed-commit` | `resicache-early-expiration-cas`, `resicache-handler-chain-and-observer`, `resicache-serialization-migration`, `resicache-single-flight`, `resicache` | 否 | — | 是，双语 README 为同一提交与同一项目定位。 | keep |
| `testcontainers-docker-api-negotiation-correction` · [testcontainers-docker-api-negotiation-correction:16](../../src/content/raw/zh-cn/testcontainers-docker-api-negotiation-correction.md#L16) | raw-evidence · E | zh-cn；英日不复制 | `upstream-source-fixed-commits-correction` | `testcontainers-docker-api` | 否 | ← `testcontainers-docker-api-negotiation` | 是，同一兼容性契约的固定路径与反例更正。 | keep |
| `testcontainers-docker-api-negotiation` · [testcontainers-docker-api-negotiation:29](../../src/content/raw/zh-cn/testcontainers-docker-api-negotiation.md#L29) | raw-evidence · E | zh-cn；英日不复制 | `upstream-source-fixed-commits` | `testcontainers-docker-api` | 否 | → `testcontainers-docker-api-negotiation-correction` | 是，同一 API 协商失败场景。 | keep |
| `ulticode-engineering-highlights-f801a1076` · [ulticode-engineering-highlights-f801a1076:30](../../src/content/raw/zh-cn/ulticode-engineering-highlights-f801a1076.md#L30) | raw-evidence · F | zh-cn；英日不复制 | `repository-source-and-document-selected-excerpts-fixed-commit` | `ulticode-async-execution-contract`, `ulticode-ci-supply-chain`, `ulticode-docker-sandbox`, `ulticode-generation-attempt-fence`, `ulticode-outbox-redis-streams`, `ulticode-owner-and-facts`, `ulticode` | 否 | — | 是，固定同一提交，方向较多，按机制小节引用。 | keep |
| `ulticode-project-context` · [ulticode-project-context:21](../../src/content/raw/zh-cn/ulticode-project-context.md#L21) | raw-evidence · F | zh-cn；英日不复制 | `repository-readme-and-context-fixed-commit` | `ulticode` | 否 | — | 是，同一提交的 README 与领域词汇表。 | keep |
| `ulticode-reliability-core-f801a1076` · [ulticode-reliability-core-f801a1076:17](../../src/content/raw/zh-cn/ulticode-reliability-core-f801a1076.md#L17) | raw-evidence · F | zh-cn；英日不复制 | `repository-source-and-document-selected-excerpts-fixed-commit` | `ulticode-core-bounded-testbed`, `ulticode-fenced-singleton-lease`, `ulticode-owner-local-audit-inbox`, `ulticode` | 否 | — | 是，固定同一提交，后续按 audit、lease、Core 分段。 | keep |
