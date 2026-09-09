# 知识库操作日志

这是按时间追加的知识库维护记录。历史条目不重写；纠正通过新条目表达。

## [2026-08-07] init | 建立个人 AI 知识库

按 Karpathy 的 LLM-Wiki 模式重构站点，建立 `raw`（不可变来源）、`note`（wiki 知识页）和 Schema（`KB.md`、`knowledge-base` skill）三层。保留首页与个人简历，移除旧博客内容的公开 wiki 语义，并保留三语站点壳层。

## [2026-08-07] ingest | @karpathy-llm-wiki

将 Karpathy 的原始 gist 快照写入 `src/content/raw/zh-cn/karpathy-llm-wiki.md`，建立首个 concept 页面 `llm-wiki-pattern`，同步更新 `kb-index.md` 和本日志。

## [2026-08-07] lint | 初始化检查

确认 raw 只有一个来源，首个 wiki 页面引用该来源，目录已登记页面和收件箱；旧文章尚未重新摄入，暂不视为稳定知识。

## [2026-08-07] ingest | 历史文章知识化迁移

从 Git 提交 `6f3d114a6ef9eb08b730f5f4740afe5b7d22d426` 读取 14 个历史文章主题，建立 `legacy-*` 中文 raw 证据快照，并将内容整理为三语 `note` 页面：Java 基础与后端调优、系统运维与基础设施、OMP 与 Agent 工程、架构与工程实践。原来位于 `jotting` 的三个 Java 页面已提升为稳定知识页；版本敏感的 Headroom、UISA 和面试复盘保留为 `provisional` 综合页。

## [2026-08-07] lint | 历史文章迁移后待验证

已同步更新正典目录、三语目录和摄入收件箱；下一步验证 raw manifest、sources、related、三语元数据、构建产物和死链。

## [2026-08-07] lint | 历史文章迁移验证通过

`pnpm kb:lint` 通过：15 个 raw 来源、45 个三语 wiki 页面，sources、raw manifest、正典目录和日志均闭环。`pnpm check` 无错误，`pnpm build` 成功生成 71 个页面，`pnpm test:run` 通过 129 个测试（1 个跳过）。构建产物内部链接扫描 880 条，仅发现 404/500 模板指向自身错误页的既有链接。

## [2026-08-07] rewrite | 将迁移内容编译为真实知识页

上一轮只完成了历史文章的 raw → note 迁移。本次重新读取 14 个 raw 来源，将 note 正文重写为定义、核心机制、适用条件、边界风险、最小验证、证据与不确定性、相关页面七类结构；删除博客流水账、面试问答和大段配置倾倒。Java 面试、Headroom 路由/持久化、UISA 保留为多来源 `provisional` synthesis，其余页面按可复用概念维护。

## [2026-08-12] ingest | Headroom 0.34.0 API contract

从 Headroom `v0.34.0` 固定版本源码和真实 loopback contract test 提取 `/v1/compress` 与 `/v1/retrieve` 的字段级契约，建立三语知识页。记录缺少 `model` 的 400、顶层 `tokens_saved`、`original_content`、CCR marker 条件和 `frozen_message_count` 的 cache-prefix 语义；本地会话账本中的凭证、路径、主机和会话标识均未进入 raw 或公开页面。

## [2026-08-13] ingest | 会话工程知识第二批沉淀

从上一轮脱敏会话候选中筛选六个可独立复用的主题，并以固定公开源码、规范、仓库提交或一次性最小实验重新取证：会话摄入与 redaction v19、MCP/codebase-memory 图工作流、Redis/Jackson `LocalDateTime`、Flyway/MySQL schema drift、多服务 readiness、OMP 17.2.15 Hook/Compaction。新增五个中文正典 concept 页，更新三份 OMP 页面；`zh-cn` 按 `KB.md` 保持正典，未在没有明确翻译任务时复制 en/ja wiki。

同日发现两份新 raw 在复审期间被扩展证据覆盖。按不可变规则恢复最初快照，并将后续更精确证据分别保存为 `omp-17-2-15-runtime-contract-correction` 与 `multi-service-readiness-contract-correction`；wiki 同时引用原快照和 correction，未改写或删除已捕获证据。

安全复审随后发现 readiness 验证命令未限定 Compose project。新增 `multi-service-readiness-safety-correction`，固定 v5.4.0 的 `-f`/`-p` 与 `down` 边界；正典页改为专用 fixture、唯一 project name，并明确 restart、abort 与 down 的影响。

## [2026-08-13] ingest | 五主题公开证据增量沉淀

从候选账本中选择五个可独立复用主题，并重新绑定到公开、固定版本或固定提交证据：JJWT 0.13.0 签名/验签 API、Testcontainers 1.20.6 Docker API 版本回退、Dubbo 3.3.6 + Nacos 运行时注册、ResiCache observer 嵌套执行，以及微服务领域与数据所有权。新增 5 个脱敏 `raw` 快照和 5 个中文正典 concept 页面，更新本目录与本日志；未创建 en/ja 副本，因为本批没有独立翻译任务。

本批保留版本边界和未验证项：Dubbo/Nacos 真实集成 smoke test、Testcontainers 运行矩阵、JJWT 编译运行断言和 observer 任意深度完整嵌套均未冒充已执行结果。`nacos.check`、`retry.period` 的 registry URL 参数写法已按固定源码校正；未将私有会话、内部地址、凭证或项目未发布实现写入公开内容。

## [2026-08-13] correction | 五主题证据复审与不可变 raw 校正

复审发现 JJWT `PrivateKey`/`verifyWith` 类型边界、Testcontainers `TestEnvironment` 路径与 `999.999` 版本矩阵、Dubbo `register-consumer-url` 配置键以及微服务来源固定 URL 需要收窄。按 raw 不可变规则保留初始五份快照，新增四份 correction raw，并将相关 note 的 `sources` 同时指向初始与 correction；初始 raw 哈希恢复并登记在 `src/content/raw/.manifest.sha256`。复审未发现凭证、私有路径或会话标识进入公开内容。

## [2026-08-13] maintenance | 收窄翻译 wiki 发布范围

按 `KB.md` 的正典边界，将未经过独立翻译任务确认的 14 个历史主题的 28 个 en/ja wiki 副本标记为 `draft: true`，并将 en/ja `kb-index.md` 收敛为导航入口与已明确翻译的页面；同时补齐 zh-cn 正典页面的交叉链接，并移除已发布翻译页对 draft 页面元数据的引用。未修改 raw、保护面或既有日志条目。

## [2026-08-13] ingest | Headroom 与 cc-switch / Claude Code 共存

从 `omp-headroom-provider-proxy` 固定提交及同日脱敏运行时观测中摄入 Headroom 与 cc-switch 共存结论：Claude Code `/v1/messages` 先经 Headroom 8787，再由 cc-switch 15721 做协议转换和凭据注入；OMP `/v1/responses` 保持独立的请求级上游路径。记录 `HEADROOM_CC_SWITCH_RECONCILE=1` 的回写方向、单一整理不变量、`ProtectHome=tmpfs` 下 `BindPaths=%h/.claude` 的安全取舍，以及 `/admin/upstream` 和 `/v1/messages → 127.0.0.1:15721` 的运行时证据。raw 与 wiki 均已脱敏，不包含凭证、会话标识、请求正文或本机绝对路径。

## [2026-08-13] ingest | OMP Headroom Bridge 与原生 Codex 路由

从 `omp-headroom-provider-proxy` 固定提交和当前工作树的脱敏交付证据中摄入一个 entity 页面与一份 raw 快照。记录 `systemd --user` 管理的 loopback Headroom 8787、OMP 的两个显式 provider route、Codex CLI/Desktop 共享用户级 Responses provider、Claude Code/cc-switch 共存边界、`bin/codex-routes` 的 marker/lock/hash/mode/atomic restore 约束，以及 static/lifecycle/fresh-client 验证和 rollback 顺序。未写入凭证、用户配置正文、`models.db`、请求正文、本机绝对路径或未提交代码的伪造固定 URL；明确注明当前工作树尚未形成新的公开 commit。

## [2026-08-17] ingest | Hindsight 本地部署与 OMP / Codex 记忆集成

从 Vectorize Hindsight v0.9.1 固定源码与本地 loopback 实测中摄入全本地化记忆系统部署与 OMP / Codex 统一接入规范。记录 AMD ROCm GPU 下加载 `gemma4:12b` (Q4_K_M GGUF)、CPU Local 运行 `BAAI/bge-m3`、FastMCP stdio 桥接状态机、Git 根目录自适应解析（避免子目录漂移）、Rootless 容器 UID 1000 权限最小化配置，以及 OMP `scoping: per-project` 与 Codex 镜像对齐。新增 1 份脱敏 raw 快照和 1 份中文正典 concept 页面，更新 `kb-index.md` 与本日志。raw 与 wiki 均已脱敏，不包含真实会话标识、请求正文、私有凭证或宿主机绝对路径。

## [2026-08-21] ingest | Personal-markdown-notes 与 Fuwari 全量聚合摄入

从 `Personal-markdown-notes`（固定提交 `bbb2126`，107 篇中 46 篇）与 `Fuwari`（固定提交 `07cee2b`，61 篇）聚合全部 Markdown 证据。按主题聚为 10 个不可变 raw 快照（`ingest-*`）与 10 个 wiki 页面，覆盖 Docker、HBase、Redis 业务/持久化/黑马实战、Java 并发、Spring Cloud、Spark/大数据、MySQL、前指随笔。去重 3 份完全重复文件、1 份空文件（`事务的作用域.md`）并在 raw 中标注；Fuwari 路径含零宽字符的文件名已原样保留 provenance。新增 10 份 raw 已登记 `src/content/raw/.manifest.sha256`，wiki 每页声明 `kind`/`status`/`sources`/`related`，并同步更新 `kb-index.md`。`pnpm kb:lint` 与 `pnpm build` 在本提交验证通过；随笔页标记为 `provisional`，黑马实战与原理篇未冒充固定版本验证。

## [2026-08-21] ingest | ResiCache 与 UltiCode 项目 entity 页

从个人项目公开仓库固定提交提取 README/CONTEXT 证据：ResiCache `75ed279a`（README.md canonical + README.zh-CN.md）与 UltiCode `3f14ac89`（README.md + CONTEXT.md 领域词汇表），建立两份不可变 raw 快照与两个 zh-cn 正典 entity 页。ResiCache 页归纳责任链 handler 顺序、防护默认关闭与序列化信封迁移边界，并与既有 observer 契约页互链；UltiCode 页标记 `provisional`，归纳 owner 划分、port/projection 深模块模式与判题事务不变量。两仓库本地工作区分别领先 origin/main 14/25 个提交的未发布修改均不作为证据。同批完成边界清理：修复 `redis-business-patterns` 三语页面指向不存在 slug `redis-null-value` 的断链（更正为 `java-null-value` 并补双向 `related`）。`pnpm kb:lint` 与 `pnpm build` 在本提交验证通过。

## [2026-08-21] maintenance | series 分类归并清洗

审计发现 6 个单页 series（`Java 后端安全`、`Java 后端并发`、`Java 测试与基础设施`、`LLM 与 Agent 工程`）与两处 series/目录分区错位（`spring-cloud-and-boot`、`database-schema-drift`）。将 6 个页面（三语共 18 处 frontmatter）的 `series` 归并到与 `kb-index.md` 分区一致的正典分类：jjwt、resicache-observer、testcontainers 并入 `Java 安全、并发与测试`；hindsight 并入 `OMP 与 Agent 工程`；spring-cloud 并入 `微服务与 RPC`；database-schema-drift 并入 `架构与工程实践`。归并后 zh-cn 正典收敛为 8 个多页 series，消除筛选 facet 噪音；en/ja 草稿元数据同步保持 slug 级一致。未改动页面正文、sources 与 raw。三语 `/note/` 正文链接与 `related` 引用全量复查无断链。

## [2026-08-23] maintenance | 知识库收敛 Phase 1 与索引重构

按 `docs/kb-convergence-design.md` 执行呈现层收敛：`kb-index.md` 重构为 6 域视图（A 知识库与 AI 工程 / B Java 与并发 / C 存储与缓存 / D 分布式与微服务 / E 基础设施与运维 / F 工程与架构），新增 3 条学习路径与 8 个 provisional 页面的毕业观察板；49 行 raw 表整体置于 `<details>` 折叠并新增聚合类型列，10 个 `ingest-*` 聚合包标记 `legacy-aggregate` 只读。归一 9 个页面的 `series` 引号（此前未加引号导致 facet 分裂）。设计初稿"每域 ≤6 行折叠"与"index 行数 -30%"两条指标经复审撤销并已在设计文档中记录原因。不改 raw、正文与保护面；`pnpm kb:lint` 与 `pnpm build` 验证通过。

## [2026-08-23] maintenance | 知识库收敛 Phase 2：Hindsight 拆分与随笔溶解

执行 LLM-Wiki Phase 2 正典内容收敛：（1）将 445 行巨石页面 `hindsight-local-deployment-and-agent-integration` 按关注点分离与“一概念一页”原则拆解为 3 个正典知识页：`hindsight-local-deployment`（L1/L2 算力分工与 Docker 容器化，concept）、`hindsight-omp-codex-integration`（L4 实体：FastMCP 桥接与多项目动态路由，entity）、`hindsight-troubleshooting`（L3 排障方法与 7 大失效模式矩阵，concept，严格遵循单来源为 concept 的 KB 语义不变量），原巨石页标记为 `deprecated` 导引；（2）溶解 10 篇零散随笔收纳袋 `frontend-mybatis-essays`，标记为 `deprecated` 归档并移出主索引；（3）更新 `kb-index.md` 导航、毕业观察板（7 个 provisional）与已归档区；（4）全量验证通过（`pnpm kb:lint`、`pnpm test:run`、`pnpm build` 全部通过）。

## [2026-09-07] maintenance | 招聘阅读入口与 ResiCache 设计复盘

经用户接受首页定位、两个项目案例入口与技术复盘建议，首页增加岗位介绍、简历/项目/邮件入口，并复用 UltiCode、ResiCache 正典项目页。三语首页提供本地化介绍，英文与日文明确标注案例正文为中文。ResiCache observer 页补充固定源码链接、设计复盘导读和 Node.js 标准库可运行模型，覆盖 fragment 边界、重复生命周期反例、异常收尾与 token 引用配对；明确模型不代表真实 Java/Redis 并发或生产验证。同步更新索引和相关项目双向链接，沿用已有来源，不修改 raw 快照。

## [2026-09-08] maintenance | Hindsight 三篇历史实践的证据与适用边界

本轮完成 3 篇既有中文主体内容的全文维护：保留 0 + 更新 3 + 合并 0 + 归档 0 + 删除 0 + 暂缓 0 = 3。全库仅盘点路径、元数据和直接引用：49 个 raw、132 个 wiki（每种语言 44 个）、3 个收件箱条目。正文处理限下表三篇，raw 只读；首页、简历、其他主题及英文/日文正文未处理。本轮停止，不自动执行下一批。

| 原文标题／路径（均位于 `src/content/note/zh-cn/`） | 类型／读者／核心问题 | 主处置与目标 | 理由与保留信息 | 验证状态 |
|---|---|---|---|---|
| Hindsight 本地算力分工与 Docker 容器化部署 · `hindsight-local-deployment.md` | concept 中的部署实践；本地部署者；算力、网络与挂载如何分工 | 更新，原路径 | 区分容器网络与宿主回环、非 root 进程与 Rootless，移除通用硬件承诺；保留 Compose、Modelfile、权限命令并补使用前提 | 全文及来源人工审阅；官方文档核对；部署未重跑 |
| Hindsight 统一记忆接入：FastMCP 桥接与多项目动态路由 · `hindsight-omp-codex-integration.md` | entity 接入实践；Agent 集成者；客户端如何路由至 Bank | 更新，原路径 | 更正物理隔离、非 Git default 回退；标出 basename 碰撞与完整 MCP 协议缺口；保留历史桥接代码、双端配置、一次检索指标 | 全文与代码静态审阅；协议核对；握手/写入/召回未重跑 |
| Hindsight 记忆系统运行时排障矩阵与失效模式 · `hindsight-troubleshooting.md` | concept 中的实践复盘；排障者；如何从故障选择检查 | 更新，原路径 | 修正模型未找到的推论、Rootless、下载阈值、`ollama list` 与 stdio 启动的验证含义；保留七项故障及六阶段叙事，明确为来源报告 | 全文及上下文人工审阅；文档核对；命令仅作为待执行示例 |

三篇的首次 `timestamp` 均保持 2026-08-23，已有独立修订日期字段未见，故将本次修订/核验日期 2026-09-08 写入正文和日志，不新增 schema 字段。分类均为 `OMP 与 Agent 工程`，标签保持原样：部署页 Hindsight/Docker/Ollama/ROCm/BGE-M3/Architecture；接入页 Hindsight/OMP/Codex/FastMCP/MCP/DynamicRouting；排障页 Hindsight/Troubleshooting/Docker/Permissions/FastMCP/Ollama。所属入口为索引 A 域及 Agent 学习路径。三者分别承担部署、接入、排障职责，不按关键词相近合并，不新增分类或摘要页。

共同来源为 `raw/zh-cn/hindsight-local-deployment-and-agent-integration.md`，`capturedAt` 为 2026-08-17，具体事件时刻未独立记录。Hindsight v0.9.1 是来源指定版本；Ollama 的 `rocm` 是可变标签，OMP/Codex/Node.js/驱动版本与模型 revision、校验和未完整固定。原始事件和指标属于历史报告，不是本轮实测。公开路径保持 `https://davidhlp.github.io/note/<上述文件名去掉 .md>`，无来源到新目标的迁移，无新重定向；既有拆分导引 `/note/hindsight-local-deployment-and-agent-integration` 继续保留。

依赖单独登记：仅更新 `information/zh-cn/kb-index.md` 三条摘要，并在本日志追加本条。三篇互链、原导引页及 en/ja 同名页构成直接内容引用；正文原有附件未删除，代码块、图和实践数据保留。新增接入页“示例的协议缺口”锚点供排障页引用。原有 slug、标题和其他标题锚点保持稳定（桥接示例标题改名的旧锚点另行兼容）。本轮无删除、无新增归档、无新知识页或 raw；恢复依据为开始时干净工作区的 Git 提交 `6ee762b0db89357fc670edd16b4ad910fd6ebcb3`，可逐文件取回原文，不需要重置工作区。

本次访问并采用的外部核验来源（2026-09-08）：[MCP 2025-06-18 transports](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports)（固定协议版本）、[Docker Rootless](https://docs.docker.com/engine/security/rootless/)、[Compose 启动顺序](https://docs.docker.com/compose/how-tos/startup-order/)、[Ollama CLI](https://docs.ollama.com/cli)。后三页未见独立发布日期，不补造日期。另访问 [Hindsight v0.9.1 仓库标签](https://github.com/vectorize-io/hindsight/tree/v0.9.1)，仅确认页面可访问，不将其等同于已核验镜像、配置键或模型身份。外部更正直接链接于对应结论，未改动不可变 raw。

待处理：六篇 en/ja 同名翻译已参与本地构建但尚未同步本次更正，读者仍可能遇到旧表述，列为下一次明确翻译任务候选；模型真实身份/许可证/权重哈希、当前 Ollama 标签、Hindsight 配置键及 OMP/Codex Bank 命名兼容需进一步核验。历史桥接器的完整协议测试未执行，不能视为生产可用代理。Hindsight knowledge pages/心智模型不在本次明确写入授权内，未执行同步，也不声称跨平台已完成。

验证结果：

- **通过**：`node --import tsx scripts/kb-lint.ts` 执行现有知识库检查，49 raw / 132 wiki 通过；`node node_modules/astro/astro.js build` 最终成功生成 84 页；`git diff --check` 通过。使用 Node 入口是因为 `pnpm kb:lint` 在启动阶段报 `unable to open database file`，直接调用 tsx CLI 又因沙箱 IPC `listen EPERM` 中断；这两次均未完成内容检查，随后使用相同脚本的加载器入口成功执行，没有修改规则。
- **通过**：构建 HTML 核验三篇页面的 78 个本地 note/锚点链接与 3 个旧标题兼容锚点；原拆分导引产物仍存在。frontmatter 与原文逐字相同，桥接器 JavaScript 原文未变；代码围栏数量保持，raw 无 diff，日志历史前缀保持不变。无新增文件或内部备份进入发布目录。
- **人工审阅**：修改后三篇全文与原文/raw 对照，保留配置、代码、七项故障、六阶段历程和单次召回数据；删除的是无依据的泛化表达而非独有实践证据。三篇现有入口不合并，索引摘要改为对应的历史适用范围。
- **构建提示**：两轮均出现本轮修改页面的 duplicate-id 警告，第二轮涉及三篇正文和 index/log；构建成功且目标 HTML/链接检查通过，但警告来源尚未定位，不能宣称已消除。本轮未引入同名文件或修改 ID。另有 Node `module.register()` 弃用、PhotoSwipe 静态/动态导入和大 chunk 提示；未运行未修改版本的基线构建，故不把这些提示武断归类为既有或本轮新增故障，未扩展到程序代码修复。
- **未运行**：Astro 独立类型检查、完整单元测试、浏览器视觉检查、线上访问检查，以及本文部署/模型/Agent 运行测试；本轮为内容修订，已完成知识库和实际静态构建检查，但不将其等同于线上发布或服务复现。未提交、推送或发布。

实际改善：纠正隔离与回退的确定性错误，收窄权限、模型和性能结论，明确历史报告与当前验证的区别；保留个人实践和旧访问入口。剩余主要读者风险是英日译文与未补齐的模型/运行时证据。

## [2026-09-09] ingest | UltiCode 当前主线亮点与 LLM 工程迁移

将既有 UltiCode entity 页从固定的 README/CONTEXT 架构概览升级为中文正典长文《UltiCode：把在线评测做成可验证的工程系统》，保留原 slug 与 `provisional` 状态。正文以当前 `main` 固定提交 `f801a1076b2fa9aa06ce3d63821f0778b477042c` 为主要证据，提炼 owner 边界、`SubmissionFactsSnapshot`、DB outbox + Redis Streams、`generation`/`attemptId` 结果围栏、Docker D-form 沙箱、同步/异步执行 contract 以及 static/发布供应链门禁，并单列 LLM/Agent 可迁移结论。

新增不可变 raw 快照 `ulticode-engineering-highlights-f801a1076`，记录当前提交的架构文档、判题/沙箱源码、边界测试名称与 CI 配置选段；保留既有 `ulticode-project-context` 作为历史来源。明确区分 `Repository Implemented`、源码/测试证据、博客仓库本地验证和 `BLOCKED_EXTERNAL`/`OUT_OF_SCOPE`，不将源码存在写成生产流量、高吞吐、HA、零丢失或完整沙箱逃逸证明。同步更新 `kb-index.md` 的学习路径、entity 摘要、raw 计数和来源表；未修改首页、简历保护面、英文/日文正文或 UltiCode 源码。验证结果：`pnpm kb:lint`、`pnpm check`、`pnpm build` 均在启动阶段报 `unable to open database file`，随后用等价的 Node/tsx 入口完成 lint、Astro check 和 build，另有 `git diff --check` 通过；Astro check/build 保留 duplicate-id、Node 弃用、PhotoSwipe 动态/静态导入和大 chunk 提示，未扩展到程序代码修复；未提交、推送或发布。

## [2026-09-09] ingest | ResiCache 当前主线亮点与 LLM 工程迁移

将既有 ResiCache entity 页重写为《ResiCache：把缓存防护写成可验证的并发与一致性边界》，保留原 slug，状态调整为 `provisional`。正文以 `main@2954fff217257e9cf7c906450a75070d5e092637` 的源码和边界测试为主要证据，提炼责任链顺序与开关边界、single-flight 的 leader/follower/reentrant 角色、sealed load outcome、`CachedValue.version` 的 Lua CAS、白名单序列化和 observer scope token，并将 ASYNC 提前过期准确表述为“安全缩短 TTL”，不写成异步直接调用 loader。

新增不可变 raw 快照 `resicache-engineering-highlights-2954fff`，记录当前构建线、核心源码入口、并发/竞态/序列化/生命周期测试名称和证据边界；保留 `resicache-project-overview` 与 observer 契约 raw 作为历史/专项来源。文章增加 LLM/Agent 可迁移结论，但明确这些是基于源码的综合，不是 ResiCache 项目声明；区分 `Repository Implemented`、`Repository Test Evidence`、`Locally Validated`、`BLOCKED_EXTERNAL` 和 `OUT_OF_SCOPE`，不声称生产吞吐、P99、HA、零丢失、SLA 或完整安全审计。同步更新 `kb-index.md` 的 entity 摘要、raw 计数和来源表，更新 `.manifest.sha256`；未修改首页、简历保护面、英文/日文 wiki 或 ResiCache 源码。本轮只验证博客仓库 lint/build/diff，不执行 ResiCache Maven、Redis 或 Testcontainers 运行测试；未提交、推送或发布。

## [2026-09-09] ingest | UltiCode 设计亮点拆解为 LLM-Wiki concept 系列

将 UltiCode entity 总览页保留为系列入口，并新增六篇可独立阅读的中文正典 `concept` 页面：数据 Owner 与 `SubmissionFactsSnapshot`、Outbox 与 Redis Streams、`generation`/`attemptId` 结果围栏、Docker 沙箱与基础设施错误分类、异步执行契约，以及 static contract 到供应链发布门禁。六页共用不可变来源 `ulticode-engineering-highlights-f801a1076`，均保留 `provisional` 状态并与 `/note/ulticode` 双向关联；没有新增重复 raw 或修改 UltiCode 源码。

本轮把项目宣传式的“亮点列表”拆成问题导向文章：每页包含实现机制、源码链接、LLM/Agent 迁移结论、适用边界和最小验证路径；保留“不是 exactly-once、不是生产 HA、不是完整沙箱逃逸证明”的限定。同步更新 `kb-index.md` 的 entity 摘要和 UltiCode concept 分组；未修改首页、简历保护面、英文/日文正文或既有 ResiCache 改动。验证结果以本轮实际执行的 KB lint、Astro check/build 和 `git diff --check` 为准；未提交、推送或发布。

## [2026-09-09] maintenance | ResiCache 设计亮点改写为 LLM-Wiki 文章

根据用户要求，将 ResiCache 页面从亮点清单改写为问题导向的中文正典文章《ResiCache：把缓存防护写成可验证的并发与一致性边界》。文章以一次缓存 miss 的真实执行路径开篇，依次展开责任链、single-flight 与 sealed outcome、值版本 CAS 提前过期、安全版本化序列化、observer 生命周期，再补充 LLM/Agent 可迁移结论和 `Repository Implemented` / `Repository Test Evidence` / `BLOCKED_EXTERNAL` / `OUT_OF_SCOPE` 证据分层。

保留并继续引用不可变 raw `resicache-engineering-highlights-2954fff`、`resicache-project-overview` 和 observer 契约来源；未修改 raw、ResiCache 源码、首页、简历保护面或英文/日文 wiki。特别保留 ASYNC 提前过期“只缩短 TTL、不直接调用 loader”、`VersionEnvelope.version` 与 `CachedValue.version` 分离、写回失败仍返回已加载值等边界。`pnpm kb:lint`/`pnpm build` 的本机数据库沙箱错误仍存在，本轮以等价 Node 入口完成 KB lint、Astro build 和 `git diff --check`；未执行 ResiCache Maven/Redis/Testcontainers 运行测试，未提交、推送或发布。
