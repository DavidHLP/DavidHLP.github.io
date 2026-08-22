# LLM Wiki 内容收敛设计（KB Convergence Design v1）

> 状态：`active` | 决策人：DavidHLPL + LLM | 生效：2026-08-22
> 约束：`KB.md` 三层不变量不变；`zh-cn` 正典；raw 不可变；`pnpm kb:lint` 必须通过

## 一、问题定义（基于 2026-08-22 全库扫描）

量化事实（`pnpm kb:lint` passed: 49 raw, 41 zh-cn pages, 119 total）：

1. **索引失焦**：`kb-index.md` 143 行，平铺 8 个 series + 49 行 raw 表。读者入口是“列表”不是“路径”，完成一次主题探索需滚动整页，无学习路径、无时效信号、无能力分层。示意图在渲染侧已坍缩为单段文本，导航价值几乎丧失。
2. **分类正交混乱**：8 个 series 横跨“语言/领域/阶段”三维度：
   - `Java 基础与后端调优` (9) 与 `Java 安全、并发与测试` (3) 对同一领域二次切分，只为消除 2026-08-21 的 facet 噪音而归并，未解决正交性。
   - `大数据与存储` (3) vs `系统运维与基础设施` (6) 边界重叠：`mysql-storage` 在大数据，`mysql-performance` 在运维；`hbase` 与 `mysql` 本应同属存储。
   - `Redis 三页`（business / persistence / heima）与 `Docker/Spark` 的聚合 raw 均属 `ingest-*` 批量，无法单条回溯。
3. **原子性破坏**：`hindsight-local-deployment-and-agent-integration` 444 行（中位数 80 行，10 倍离群），单页包含“GPU/CPU 选型、Docker 部署、OMP/Codex 双接入、7 类踩坑、权限与网络”，违背“一个概念一页”原则。
4. **Provisional 逃逸**：8/41 (20%) 为 `provisional`，无毕业标准。`frontend-mybatis-essays` 实为 10 篇零散随笔的收纳袋，不应长期以 synthesis 身份存在；`headroom-single-port-evolution / omp-headroom-persistence / omp-headroom-provider-proxy` 三页描述同一 Headroom 路由生命周期的不同切面，存在覆盖却无主从。
5. **批量 raw 隐藏溯源**：10 个 `ingest-*` raw 各聚合 3–20 篇 Personal/Fuwari 原文（合计 107 篇），provenance 只到“聚合包”粒度，无法精确引用单篇。后续若单篇纠错需新增 bulk correction，已在 2026-08-13 产生 4 次 correction。
6. **翻译副本噪音**：28 个 en/ja `draft: true` pages 为保持 slug 一致而保留，实际污染搜索、分页与统计；正典与翻译比例失衡会误导“覆盖率”度量。

**反方审查（最强反对意见）**：

> “41 页、49 raw，当前已通过 lint 与 build，读者仍可沿 index 逐页访问。重做分类与索引是镀金——不如新增内容。”

反驳：索引与分类是**查询成本**。当前“能访问”≠“能发现”。未收敛时新增内容会加剧平铺与重复，`query` 操作的召回路径（index → wiki → raw）第一步即失效。本次收敛做**呈现层重构，不重写 41 页正文**，用最小 diff 修查询成本，是必要的负债偿还。

## 二、收敛原则（四条）

1. **呈现收敛优先于存储重构**：不动 `raw` 与正文，先收敛 `kb-index.md` 与导航视图。Frontmatter `series` 保持 8 值不变（仅做引用一致性修复），避免 41 页同步改动的回归风险。
2. **一个页面一个可验证主张**：概念页回答“是什么 + 何时用 + 边界”；实体页回答“它是什么 + 已验证到哪”；综合页必须跨 ≥2 个 raw 且产出比较矩阵或决策树。Hindsight 类超纲页必须拆分。
3. **证据粒度可回溯**：新增摄入不再使用 `ingest-*` 聚合包；以“单来源/单主题小包”为准（1 raw ≈ 1–3 篇原文或 1 个固定提交）。存量 10 个 bulk 标记为 `legacy-aggregate`，不再以它为新 synthesis 的 `sources`，增量以 `source: <raw-slug>#<heading>` 细化引用。
4. ** provisional 有毕业门**：每个 provisional 页必须在文件头声明 `毕业条件（3 个可验证检查）`，季度未达标则降级为 `deprecated` 或溶解。

## 三、目标信息架构（IA v2）

### 3.1 呈现层 6 域（仅在 kb-index 分组，不改 frontmatter）

| 域 | 涵盖页面（示例） | 查询意图 |
|---|---|---|
| **A. 知识库与 AI 工程** | llm-wiki-pattern, kb-session-ingest-contract, mcp-codebase-memory-workflow, hindsight-* | “如何维护/查询/排障本库” |
| **B. Java 与并发** | java-atomic-boolean, java-auto-closeable, java-null-value, java-concurrency-deepdive, redis-jackson-java-time, jjwt-013 | “语言机制与边界” |
| **C. 存储与缓存** | redis-business/persistence/heima, mysql-storage/deadlock, hbase-foundation, spark-ecosystem, mysql-performance（存储侧） | “选型、持久化与一致性” |
| **D. 分布式与微服务** | dubbo-nacos, spring-cloud-and-boot, microservice-data-ownership, database-schema-drift, resicache-observer-nested, multi-service-readiness | “拆分、注册与迁移” |
| **E. 基础设施与运维** | docker-fundamentals, containerd-tls, intranet-penetration, testcontainers-docker-api, java-online-performance-debug | “容器、网络、排障与门禁” |
| **F. 工程与架构（综合/实体）** | uisa, plugin-lifecycle, resicache, ulticode, 前端随笔（待溶解） | “架构权衡与项目实体” |

> 映射：现有 8 series → 6 域为**视图聚合**，实现放在 `kb-index.md` 的标题分组，不改 `series` 枚举，遵守“最小 diff”原则。

### 3.2 深度分层（L1–L4，单页标注）

- L1 原理：机制与不变量（如 CAS、RDB/AOF、BGE-M3）
- L2 边界：失效与权衡（如 NullValue 序列化边界、Containerd TLS 跳过验证代价）
- L3 实践：SOP 与门禁（如 multi-service-readiness 的 running/ready 区分、MySQL 排查路径）
- L4 案例：项目实证（如 ResiCache observer、UltiCode port/projection）

综合页必须在首段声明覆盖的 L 层。

### 3.3 质量分级（渐进收敛）

- `active`：≥1 个固定版本/提交证据 + 可重复验证步骤 + `related` 双向闭环
- `provisional`：来源可信但缺少可重复实验或版本固定，或多来源未收敛；必须列 3 条毕业条件
- `deprecated`：被更新 raw 或实验推翻，保留但从 index 主视图移除，仅在“已归档”区可追溯

## 四、页面级收敛处置（41 页）

| 处置 | 页面 | 动作 |
|---|---|---|
| **保持** | 21 个 active concept（如 java-atomic-boolean, redis-persistence-principle, dubbo-nacos-runtime, headroom-compress-retrieve-contract, database-schema-drift 等） | 不动正文；补 `related` 双链（已在 08-21 完成一轮） |
| **拆分** | hindsight-local-deployment-and-agent-integration (444 行) | 拆为 3 页：① `hindsight-local-deployment`（L1-L2 部署与模型选型） ② `hindsight-omp-codex-integration`（实体：双接入与 bank 路由） ③ `hindsight-troubleshooting`（综合：7 踩坑矩阵）。本次设计阶段不执行拆分，下次 ingest 任务执行，需新增 2 个小 raw |
| **溶解** | frontend-mybatis-essays（provisional 收纳袋） | 溶解为：`vue-essays` 归 F 域笔记或直接标记 `deprecated`（无稳定主张）；`mybatis-cache-notes` 并入 `redis-business-patterns` 的延伸阅读；`env-troubleshooting` 并入 `containerd-tls-troubleshooting`。存量页在溶解前保留但从 index 主视图降级至“待溶解”区 |
| **归并候选** | Headroom 三页（single-port-evolution / headroom-persistence / headroom-cc-switch-coexistence / provider-proxy） | 暂不归并。设主从：`headroom-compress-retrieve-contract`（active 契约）为主，`single-port-evolution/persistence` 为历史演进说明（provisional），`cc-switch-coexistence/provider-proxy` 为运行时观测（需 runtime 证据补齐方可毕业） |
| **毕业候选** | uisa-architecture-design, ulticode, java-internship-interview-blog-polished | 明确毕业门：UISA 需补“规模/阈值”脱敏后的可重复约束描述；UltiCode 需补 1 次判题事务的最小实验；面试页需补 1 个生产止损案例的脱敏证据。未补齐前保留 provisional 且在 index 单列“毕业观察” |
| **翻译副本** | 28 个 en/ja draft | 保持 draft，不进入主 index；新增 `scripts/kb-lint.ts` 忽略 draft 的 series 统计（已有一轮清洗），避免继续触碰翻译以制造漂移 |

## 五、Raw 收敛

- 存量 `ingest-*` 10 个标记 `legacy-aggregate`（在 kb-index raw 表新增列标注），只读。
- 增量规则：1 raw ≈ 1 主题小包（≤3 篇原文或 1 固定提交），文件名 `ingest-<domain>-<topic>-<yyyymmdd>`，`sourceType` 明确 `personal-notes-single` / `upstream-fixed-tag` 等，不再用 `personal-notes-and-fuwari` 笼统类型。
- 引用细化：wiki 首段必须声明 `来源事实：<slug>#<小节>` 而非整包引用，便于后续 correction 只追加小包。

## 六、索引收敛（本次执行）

`kb-index.md` 由“平铺列表 + 49 行大表”收敛为：

1. **顶部 6 域导航**（锚点跳转）
2. **学习路径（3 条）**：新手→“LLM-Wiki 机制”→“Java/存储”→“运维排障”；进阶→“分布式与微服务迁移”；Agent→“OMP/Headroom/Hindsight 全链”
3. **毕业观察板**：8 个 provisional 各列 1 行毕业条件
4. **主目录**：按 6 域分组，全部 active/provisional 页面平铺登记（不折叠——`kb:lint` 要求所有 slug 可见登记，域内 ≤10 行折叠无扫描收益，反而增加点击摩擦）
5. **Raw 表**：整体置于 `<details>` 折叠，摘要行给出计数（39 单来源 + 10 legacy-aggregate），新增“聚合类型”列

> **2026-08-23 修订**：初稿的“每域 ≤6 行、超出折叠”与“index 行数 -30%”两条指标经复审撤销。前者与 lint 的全量登记要求冲突且无扫描收益；后者是虚荣指标，行数不衡量查询成本。替换为上述结构性验收。

本次改动**仅 kb-index.md 一个文件**，验证：`pnpm kb:lint && pnpm build` 双通过即视为收敛完成。

## 七、执行路线（3 阶段）

- **Phase 1（本次，2026-08-22）**：本文档 + `kb-index.md` 重构 + series 引号一致性修复（9 文件）。度量：`kb:lint` 通过；`build` 页数不变；raw 表默认折叠；3 条学习路径与毕业观察板存在。
- **Phase 2（下次 ingest）**：执行 Hindsight 拆分 + frontend 溶解，各自新增小 raw，wiki 互链闭环，index 更新。
- **Phase 3（季度）**：Provisional 毕业审视，未毕业则 deprecated；评估是否将 6 域落为真实 `series` 枚举（需 41 页批量迁移，届时再评估收益）。

## 八、不做事项（YAGNI）

- 不为 41 页重写正文、不新增可视化图谱、不引入 CMS、不为 en/ja 补翻译、不把 `ingest-*` 重切为原子 raw（成本 > 收益，存量只读即可）。
- 不引入新的 frontmatter 字段（`domain`/`layer` 仅在 index 与本文档的视图层使用）。

## 九、验证与回滚

- 验证：`pnpm kb:lint` + `pnpm build && grep -c "provisional" src/content/information/zh-cn/kb-index.md` 应为 8。
- 回滚：`git checkout HEAD -- src/content/information/zh-cn/kb-index.md` 单文件回滚；本文档为说明性文件，不影响构建。

---
*Ponytail 注：本设计刻意选择“最少文件、呈现层收敛”而非“存储层重构”。跳过的重工作：41 页 series 批量迁移、10 个 bulk raw 拆分、全文重写。触发重做的阈值：当新增 10+ 页或连续 2 次 query 失败定位到索引时，再评估 Phase 3 的枚举级迁移。*
