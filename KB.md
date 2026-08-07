# DavidHLPL 个人 AI 知识库宪法

本仓库不再以“文章发布”为中心，而是一个由 LLM 持续维护的个人 AI 知识库。站点仍保留 ThoughtLite 的首页、关于页和多语言外壳；知识内容遵循 Karpathy 的 LLM-Wiki 模式。

## 保护面

以下内容是个人身份层，除非用户明确要求，否则不得改写或删除：

- `src/pages/[...locale]/index.astro`：首页布局、个人档案卡和首页体验。
- `src/content/information/{locale}/introduction.md`：个人简历、经历、项目和技能。
- `src/content/information/{locale}/linkroll.mdx`：关于页使用的链接集合。
- `src/content/information/{locale}/chronicle.yaml`：关于页使用的站点时间线。
- `src/content/information/{locale}/policy.md`：政策页面。

知识库入口 `/kb` 可以扩展导航，但不能把首页或简历改造成知识库列表。

## 三层架构

```text
src/content/raw/{locale}/          原始来源：人采集，LLM 只读，不得修改
src/content/note/{locale}/         Wiki：LLM 维护的 entity/concept/synthesis 页面
src/content/jotting/{locale}/      捕获收件箱：未整理想法，不是稳定知识页
KB.md                              Schema：本宪法与不变量
.claude/skills/knowledge-base.md   Agent 执行规程
src/content/information/{locale}/
  kb-index.md                       面向内容的目录
  kb-log.md                         面向时间的 append-only 操作日志
```

`zh-cn` 是知识库的正典语言。`en` 和 `ja` 只保留站点导航、简历和必要的说明性入口；不为了表面同步而复制一份会漂移的 wiki。需要对外发布翻译时，先完成 `zh-cn` 正典，再由一次明确的翻译任务生成对应版本。

## Wiki 页面类型

所有稳定知识页位于 `src/content/note/{locale}/`，并在 frontmatter 中声明：

- `kind: concept`：解释一个概念、方法或框架。
- `kind: entity`：描述一个具体项目、工具、人物或系统。
- `kind: synthesis`：跨多个来源的比较、演进或结论。
- `status: active | provisional | deprecated`：说明页面当前可信度和生命周期。
- `sources: [source-slug]`：列出支撑页面结论的 raw 来源 slug。
- `related: [page-slug]`：列出需要维护的相关 wiki 页面。

非平凡结论必须有 `sources`。如果来源之间存在冲突，页面必须显式写出“冲突与不确定性”，不能静默选择一方。

## 三个操作

### `ingest <来源>`

把来源放入 `raw`，然后按以下顺序维护：

1. 阅读 raw 全文，确认来源范围、日期和可信度。
2. 和用户确认值得保留的事实、观点或问题。
3. 创建或更新一个或多个 wiki 页面；每个结论写明 `sources`。
4. 补充双向交叉链接，避免孤儿页。
5. 更新对应语言的 `kb-index.md`。
6. 在 `kb-log.md` 追加 `## [YYYY-MM-DD] ingest | 标题` 记录。

raw 文件是证据快照。不得为了让 wiki 看起来正确而修改 raw；来源有误时新增更正来源并在 wiki 中记录冲突。

### `query <问题>`

1. 先读 `src/content/information/zh-cn/kb-index.md`，不要直接盲搜全文。
2. 再阅读相关 wiki 页面及其 `sources` 指向的 raw 文件。
3. 回答时区分来源事实、wiki 综合和当前推断，并附页面链接或来源 slug。
4. 如果回答形成了可复用的比较、决策或新结论，将它归档为新的 `synthesis` 页面。
5. 对有长期价值的查询追加 `query` 日志；普通闲聊不写入知识库。

### `lint`

周期性检查以下项目：

- wiki 页面是否都有可追溯 `sources`。
- `sources` 指向的 raw 文件是否存在。
- `related` 和 Markdown 链接是否断裂。
- `kb-index.md` 是否登记所有 active/provisional 页面。
- `kb-log.md` 是否按时间追加且每条以 `## [YYYY-MM-DD]` 开头。
- 是否存在互相矛盾、被新来源淘汰或缺少独立页面的重要概念。
- 是否有孤儿页、重复页或应该合并的页。
- `raw` 是否被意外修改，且 `src/content/raw/.manifest.sha256` 是否与快照一致。

仓库提供 `pnpm kb:lint` 执行上述可自动化检查；它还会拒绝已登记 raw 快照的修改或删除。

lint 发现问题时，优先修复证据链和索引，再修正文案；不要为了消除告警删除事实来源。

## 文件和 frontmatter 约定

- 文件名使用小写 kebab-case；slug 在三语版本之间保持一致。
- `timestamp`、`capturedAt` 等 `z.date()` 字段保持为未加引号的 YAML 时间戳。
- 含冒号或引号的字符串使用双引号并正确转义。
- 长页面启用 `toc: true`。
- 原始来源只存放在 `src/content/raw/`，不创建公开路由。
- 新增页面、来源和操作必须同时更新 `kb-index.md` 或 `kb-log.md`。

## 当前种子

- raw 来源：`karpathy-llm-wiki`。
- concept 页面：`llm-wiki-pattern`，说明本知识库自身的运行方式。
- 捕获收件箱：`kb-ingest-todo`，记录下一批待摄入的旧资料和问题。

这个文件是 Schema 的一部分。若实践反复证明某条规则不合适，先在操作日志记录原因，再以最小改动更新本文件和 `.claude/skills/knowledge-base.md`。
