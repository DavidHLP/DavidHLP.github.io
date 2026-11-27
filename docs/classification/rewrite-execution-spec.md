# Wiki 重写执行规格

> 日期：2026-11-27 | 裁决来源：[decisions-wiki.md](decisions-wiki.md) §B、§C、§P1/P2
> 执行者：Antigravity `gemini-4-hydrogen`（thought_level high）
> 约束：不修改 raw、`legacy.metadata`、既有 archive ID/URL/draft、保护面；不做 Git 写操作。

## 目标

完成 `decisions-wiki.md` 中仍为 DEFER 的五组页面拆分，并补齐关系正文交接与遗留文档路径。B04/B05/B09/B10 的 REJECT 项不得拆分。

## 前置工程（T0）

新正典页没有 `legacy` 来源，当前 `scripts/check-content.mjs:831` 要求每条发布记录都有 `legacy`。必须先建立原生 Wiki 发布路径：

1. 允许 `content/blog/legacy/note/<locale>/` 下无 `legacy` 字段的原生页通过迁移完整性检查，且不伪造 `legacy`。
2. 原生页必须具备：唯一 `archiveId`、`translationKey`（三语一致）、`source` 为可解析的 raw/上游 URL、`kind: concept`、`status: provisional`、`sources` 仅列 raw slug。
3. 迁移稿的既有断言不得放宽：`legacy.metadata` 逐字节、草稿、归档 ID、路由、TXT 导出仍按原规则校验。
4. 三语翻译门：新页必须三语同时发布，`kind/status/sources/related/pubDate` 一致，标题/代码/表格/引用结构不低配。
5. 归档 ID 从 `X-1300` 起按序分配，先扫描全仓确保不重复；不得复用任何既有 ID。

## 票（按依赖）

### T1 · B01 数据库复盘拆分（依赖 T0）

新页与父页范围严格按 [decisions-wiki.md](decisions-wiki.md) B01 表：

| 新 slug | 来源章节 | 父页保留 |
|---|---|---|
| `sql-join-null-semantics` | §二、§四、§六第 1/2 题 | §一、§三、§六标题与四表约定 |
| `sql-date-dialect-boundaries` | §五 | 日期节保留摘要与跳转 |
| `mysql-same-table-dml` | §六第 3/4 题 | 四问框架与通用索引策略 |
| `recoverable-batch-extraction` | §七、§八 | 清单与恢复前提 |

父页 `database-written-test-review` 保留全部旧标题、编号、锚点与旧 URL；每个被移出章节保留短摘要和指向新页的链接。新页 `sources: [database-written-test-review]`（raw slug），`related` 与父页双向。

### T2 · B02 ResiCache 序列化拆分（依赖 T0）

新页 `resicache-serialization-trust`，F 域，`sources: [resicache-engineering-highlights-2954fff]`。收对象信任段、白名单、`streaming preflight`、信任测试；父页 `resicache-serialization-migration` 保留旧格式、`SHADOW_READ`/`DUAL_WRITE`/`CUTOVER`/`ROLLBACK`、清空风险与迁移并发。保留子锚点 `envelope`、`streaming preflight` 与全部旧标题。

### T3 · B03 MCP 兼容拆分（依赖 T0）

新页 `mcp-modern-legacy-compatibility`，A 域，`sources: [mcp-codebase-memory-workflow]`。收逐请求 `_meta`、`initialize` 握手、兼容矩阵、错误分层、`v0.10.2` 归属；父页保留工作流、工具参数、覆盖与未证明内容，并保留两个决定性命中标题。

### T4 · B06 Java 并发拆分（依赖 T0）

新页：`java-cas-and-aba`、`java-locks-and-thread-coordination`、`java-reference-types`，B 域，`sources: [ingest-java-concurrency]`。父页 `java-concurrency-deepdive` 保留「核心机制」「适用条件」「不适用与风险」「最小验证」「证据与不确定性」及关联导航锚点，并加三处入口；`java-atomic-boolean` 归属不变。

### T5 · B07 Spring 拆分（依赖 T0）

新页：`spring-boot-auto-configuration`、`spring-transaction-boundaries`、`spring-cloud-discovery-and-gateway`，D 域，`sources: [ingest-spring-cloud]`。父页 `spring-cloud-and-boot` 保留六个旧标题锚点与容错/Trace 导航；Dubbo 页以独立关系链接。

### T6 · 索引、日志、登记（依赖 T1–T5）

- 三语 `content/blog/legacy/information/<locale>/kb-index.md`：新页登记到对应主域与 35+ provisional 毕业板，父页摘要收窄；保持三语 slug 集合一致。
- 三语 `kb-log.md`：追加本次重写记录，标题数一致。
- `docs/DOCUMENT-CLASSIFICATION.md`：更新 58 → 70 slug 台账与待办状态。
- 新原生页如需发布覆盖，写 `migration/publication-overrides.json`，键为 `legacy/note/<locale>/<slug>`，只写允许字段。

### T7 · 关系正文交接（依赖 T1–T5）

按 `decisions-wiki.md` §C 的 23 条新增反链，在源页指定段落补一句交接并链接目标；§C 的 22 条剪边删除正文中的等价重复链接。三语同步。不得改动 `related` 之外的既有事实与来源链接。

### T8 · 遗留文档（可并行）

- `docs/kb-convergence-design.md`：旧 `src/content/information/...` 路径改为 `content/blog/legacy/information/...`，`pnpm` 命令改 `npm`。
- 清理 `docs/DOCUMENT-CLASSIFICATION.md` 中已完成的待办表述。

## 验收

```bash
npm run build
npm run check:content
npm run kb:lint
npm run check:viewport
```

附加：
- 三语各 70 个 note slug，`active/provisional/deprecated` 计数一致。
- 每条新增边双向或按裁决的单向例外；非归档零入度为 0。
- 旧 URL、旧锚点、TXT 路由、归档 ID、`draft` 全部可达且未变。
- 新页三语标题/代码/表格/引用结构不低配，无中文混入 en、无缺失日文假名。
