# 知识库正典层之外文档全量分类审计与治理报告

> **审计基准日期**：2026-11-27 | **仓库**：`/home/david/Projects/DavidHLP.github.io` | **HEAD**：`c4e49d1`
> **审计范围**：除 `src/content/raw/`（54 份）与 `src/content/note/`（174 份正典/旧副本）之外的全部维护文档、根目录文档、Agent 规程、生成镜像、不可变迁移来源、归档 TXT 与配置文件，总计 **932 份**（其中逐份精读分类 73 份，全量镜像映射与自动化正文/元数据比对 201 份 + 22 份高风险页人工精读对照，不可变来源与导出物按分组登记 658 份）。

---

## 1. 总览统计（按层 / 六域 / 文档类型 / 生命周期 / 裁决）

### 1.1 按 KB 层分布（共 932 份）

| KB 层 | 计数 | 占比 |
|---|---:|---:|
| `archival-source` | 458 | 49.1% |
| `generated-mirror` | 393 | 42.2% |
| `project-maintenance` | 40 | 4.3% |
| `config` | 16 | 1.7% |
| `agent-contract` | 12 | 1.3% |
| `protected-identity` | 6 | 0.6% |
| `schema` | 3 | 0.3% |
| `inbox` | 2 | 0.2% |
| `navigation` | 2 | 0.2% |
| **合计** | **932** | **100.0%** |

### 1.2 按六域（+ G 归档废弃 / M 站点与内容运营）分布

| 域 | 计数 |
|---|---:|
| A 知识库与 AI 工程 | 56 |
| B Java 与并发 | 25 |
| C 存储与缓存 | 24 |
| D 分布式与微服务 | 18 |
| E 基础设施与运维 | 19 |
| F 工程与架构 | 58 |
| G 归档废弃 | 464 |
| M 站点与内容运营 | 268 |
| **合计** | **932** |

### 1.3 按文档类型 / 生命周期 / 裁决分布

| 维度 | 分布统计 |
|---|---|
| **文档类型** | `evidence` 459 · `reference` 222 · `concept` 142 · `synthesis` 21 · `config` 17 · `entity` 12 · `skill` 12 · `design-spec` 9 · `index` 8 · `README` 8 · `ADR` 6 · `runbook` 5 · `log` 4 · `audit` 4 · `glossary` 1 · `changelog` 1 · `attribution` 1 |
| **生命周期** | `immutable` 458 · `active` 343 · `provisional` 75 · `deprecated` 43 · `historical` 13 |
| **裁决** | `register-only` 659 · `keep` 192 · `archive` 25 · `merge` 23 · `deprecate` 19 · `protect` 12 · `reclassify-to-wiki` 2 |

---

## 2. 核心治理发现（Top 5 最严重问题）

1. **[严重 / P0] 知识库"双轨裂脑"：`KB.md` 与 `scripts/kb-lint.ts` 指向完全不同的知识库根目录，且 `content/blog/legacy/` 已出现 123 份实质漂移与 3 份镜像独有文件**
   - **证据**：[KB.md:20-27](../../KB.md#L20-L27) 与 [.claude/skills/knowledge-base.md:10-25](../../.claude/skills/knowledge-base.md#L10-L25) 均规定 Wiki 页位于 `src/content/note/{{locale}}/`、索引与日志位于 `src/content/information/{{locale}}/kb-index.md` 与 `kb-log.md`；但实际校验脚本 [scripts/kb-lint.ts:12-15](../../scripts/kb-lint.ts#L12-L15) 已将 `publishedRoot` 指向 `content/blog/legacy/`（`note/`、`information/zh-cn/kb-index.md`、`kb-log.md`），[src/content.config.ts:11](../../src/content.config.ts#L11) 也仅从 `content/blog` 加载发布内容。同时 [migration/README.md:5](../../migration/README.md#L5) 声明"编辑 `content/blog/legacy/`，原 `src/content/` 保持不变"。结果导致 `content/blog/legacy/` 中 201 份文件已有 **123 份 `drifted`**（含 `zh-cn` 4 份实质修补、`en` 56 份、`ja` 63 份译文重写与 `draft: false` 启用）、**3 份 `extra`**（`information/*/introduction.md` 于 2026-11-25 脱敏重建后仅存于镜像层，已从 `src/content/` 删除）。
   - **影响**：任何新启动的 Agent 按 `KB.md` 写入 `src/content/note/`，既不会进入网站构建，也无法通过 `npm run kb:lint` 校验；而按 `migration/README.md` 写入 `content/blog/legacy/` 又直接违背 `KB.md` 宪法条文。

2. **[严重 / P0] `AGENTS.md` 与 `.claude/` 技能体系存在严重自相矛盾与大面积技术栈过期（ThoughtLite 幽灵规则仍在误导 Agent）**
   - **证据**：[AGENTS.md:5-11](../../AGENTS.md#L5-L11) 声明使用 `content/site.json`、`content/blog/`、`npm run build/check:content/check:viewport`；紧接着 [AGENTS.md:20-65](../../AGENTS.md#L20-L65) 原封不动粘贴了迁移前 [migration/source/CLAUDE.md:1-51](../../migration/source/CLAUDE.md#L1-L51) 的旧内容，声称包管理器是 `pnpm`、UI 是 `Astro + Svelte`、配置文件是 `site.config.ts`、路由是 `src/pages/[...locale]/`、每次任务必须加载 7 个 `.claude/skills/*.md`。而除 `knowledge-base.md` 外的其余 7 个技能及 [.claude/rules/skill-autoload.md:5-25](../../.claude/rules/skill-autoload.md#L5-L25) 全部描述已删除的 ThoughtLite 组件与目录。另外 [AGENTS.md:38-42](../../AGENTS.md#L38-L42) 自身在相邻两行内同时写 `src/content/note/` 和 `content/blog/legacy/information/{{locale}}/introduction.md`。
   - **影响**：Agent 每次启动都会被强制加载 6 份错误技能文档，按不存在的 `site.config.ts`、`pnpm` 和 Svelte 组件构造代码或路径。

3. **[高 / P1] `docs/` 索引失效与核心工程参考手册全面过期（24/33 漏登记 + 幽灵断链 + 命令/技术栈失真）**
   - **证据**：[docs/README.md:7-20](../../docs/README.md#L7-L20) 仅登记 9 份文件（含自身），实际 `docs/` 有 **33 份文件**，漏登记高达 **24 份**（涵盖全部 6 份 ADR、3 份 agents、ABOUT、I18N、PWA、CLOUDFLARE-DEPLOYMENT、kb-convergence-design 等）。[docs/UPDATE_SUMMARY.md:13](../../docs/UPDATE_SUMMARY.md#L13) 引用不存在的 `CODEMAPS/README.md`；[README.md:36](../../README.md#L36) 引用不存在的 `docs/ABOUT-CONTENT-AUDIT.md`；[docs/SCRIPTS.md:6-122](../../docs/SCRIPTS.md#L6-L122)、[docs/ENV.md:44-105](../../docs/ENV.md#L44-L105)、[docs/RUNBOOK.md:12-266](../../docs/RUNBOOK.md#L12-L266) 及 4 份 [docs/CODEMAPS/architecture.md](../../docs/CODEMAPS/architecture.md) 仍停留在 Astro 5 + Svelte 5 + Biome + pnpm + `site.config.ts`，与 [package.json:10-44](../../package.json#L10-L44)（Astro 7.3.6 + Three.js + Prettier + Vitest + npm）完全脱节。

4. **[高 / P1] 多语言 README 与 GitHub 协作模板滞留上游/旧主题信息，存在错误外部引导**
   - **证据**：[README.md](../../README.md) 已更新为 RhineLabUI-Astro + `npm` 说明，但 [README.zh-cn.md:1-147](../../README.zh-cn.md#L1-L147) 与 [README.ja.md:1-147](../../README.ja.md#L1-L147) 仍标题为 `ThoughtLite 知识库` 并指引 `pnpm install --frozen-lockfile`、`src/rhine/`、`site.config.ts`。[CONTRIBUTING.md:184](../../CONTRIBUTING.md#L184) 指引贡献者 fork `tuyuritio/astro-theme-thought-lite`；[.github/ISSUE_TEMPLATE/config.yml:3-8](../../.github/ISSUE_TEMPLATE/config.yml#L3-L8) 与 [.github/pull_request_template.md:4](../../.github/pull_request_template.md#L4) 仍外链至 ThoughtLite；[.github/ISSUE_TEMPLATE/bug_report.yaml:28-60](../../.github/ISSUE_TEMPLATE/bug_report.yaml#L28-L60) 要求选择 `cloudflare` 分支并运行 `pnpx astro info`。

5. **[中 / P2] 知识内容与配置文件存在孤立遗留与工具链错配（`arthas.md` 孤悬、`PR15-ATTRIBUTION.md` 断引用、`.serena` 与 `pnpm-workspace.yaml` 错配）**
   - **证据**：[arthas.md:1-244](../../arthas.md#L1-L244) 是根目录下一篇独立 Java 诊断文章，既不在 `src/content/raw/`（无来源可追溯），也不在 `content/blog/legacy/` 或 `kb-index.md` 中，与 `java-online-performance-debug` 重叠。[PR15-ATTRIBUTION.md:10](../../PR15-ATTRIBUTION.md#L10) 引用的 `scripts/check-pr15-port.mjs` 与 `scripts/check-pr15-rendering.mjs` 在当前 `scripts/` 中不存在；[.serena/project.yml:38-39](../../.serena/project.yml#L38-L39) 配置 `language_servers: [svelte]`；[pnpm-workspace.yaml:1-7](../../pnpm-workspace.yaml#L1-L7) 仍保留 pnpm 补丁配置，而 `package.json` 已用 `npm` + `scripts/patch-rolling-number.mjs`。

---

## 3. 逐文件分类矩阵（`docs/`、根目录、Agent 层）

### 3.1 `docs/` 目录逐文件表（33 份）

| 文件 | KB 层 | 六域 | 文档类型 | 生命周期 | 裁决 | 审计依据与说明 |
|---|---|---|---|---|---|---|
| `docs/README.md` | project-maintenance | M 站点与内容运营 | index | active | merge | 仅登记 9 份（含自身）ThoughtLite 时代文档，漏登记 24 份；应重写为当前仓库 docs 总索引 |
| `docs/ABOUT.md` | project-maintenance | M 站点与内容运营 | runbook | active | keep | 与当前 `content/about/` 及 `content/blog/legacy/information/*/introduction.md`、已移除 PDF 导出一致（c4e49d1） |
| `docs/ABOUT-ACCEPTANCE.md` | project-maintenance | M 站点与内容运营 | audit | active | keep | 记录 2026-11-01 About 页验收证据与未测项边界；需随近期移除打印按钮更新一节备注 |
| `docs/BUSINESS-AUDIT.md` | project-maintenance | M 站点与内容运营 | audit | historical | archive | 2026-10-10 RhineLabUI-Astro 业务审查（B01-B09），已进入实施闭环，留作历史审计 |
| `docs/BUSINESS-IMPLEMENTATION.md` | project-maintenance | M 站点与内容运营 | audit | historical | archive | B01-B09 实施与 PR #3 验收记录；引用旧 commit 与已完成的整改任务图 |
| `docs/CLOUDFLARE-DEPLOYMENT.md` | project-maintenance | M 站点与内容运营 | runbook | active | keep | 与 `package.json` `build:cloudflare`、`scripts/package-cloudflare.mjs` 及 `PWA.md` 一致 |
| `docs/ENV.md` | project-maintenance | M 站点与内容运营 | reference | deprecated | deprecate | ThoughtLite 遗留文档：引用已不存在的 `site.config.ts`、`pnpm`、Svelte、Swup 与 `$config` 别名 |
| `docs/I18N.md` | project-maintenance | M 站点与内容运营 | design-spec | active | keep | 记录当前 `zh-CN`/`en`/`ja` 67 组 201 篇全内容语言切换与 `check:content` 验收规则 |
| `docs/I18N-SEMANTIC-AUDIT.md` | project-maintenance | M 站点与内容运营 | audit | historical | archive | 2026-10-31 67 组英日译文语义复核台账，属于历史验收快照 |
| `docs/PWA.md` | project-maintenance | M 站点与内容运营 | runbook | active | keep | 与当前 `scripts/build-pwa.mjs`、`scripts/pwa-worker.js`、`/update.html` 一致 |
| `docs/RUNBOOK.md` | project-maintenance | M 站点与内容运营 | runbook | deprecated | deprecate | ThoughtLite 遗留运维手册：命令全为 `pnpm build/check/lint`、引用 `feed.xml`、Svelte、`src/content/{collection}` |
| `docs/SCRIPTS.md` | project-maintenance | M 站点与内容运营 | reference | deprecated | deprecate | ThoughtLite 遗留脚本手册：列出已删除的 `pnpm new/lint/count/prepare`、Biome、`site-validation.yaml`，遗漏全部现行 `npm run` 脚本 |
| `docs/UPDATE_SUMMARY.md` | project-maintenance | M 站点与内容运营 | log | deprecated | archive | 2026-06-01 历史文档更新汇总；引用不存在的 `CODEMAPS/README.md` |
| `docs/computation-design.md` | project-maintenance | M 站点与内容运营 | design-spec | deprecated | archive | ThoughtLite 时代首页计算图视觉实验记录，已被后续 layout-rollback 与 RhineLabUI 取代 |
| `docs/layout-rollback.md` | project-maintenance | M 站点与内容运营 | design-spec | deprecated | archive | 2026-09-08 ThoughtLite 布局回滚记录，已被 2026-09-11 RhineLabUI 替换 |
| `docs/mono-color-design.md` | project-maintenance | M 站点与内容运营 | design-spec | deprecated | archive | ThoughtLite 时代双色印刷设计方案（`src/styles/editorial.css`），已停用 |
| `docs/sailing-print.md` | project-maintenance | M 站点与内容运营 | design-spec | deprecated | archive | 帆船配图初版生成记录（Prompt 为 `undefined`），已废弃 |
| `docs/sailing-print-no-text.md` | project-maintenance | M 站点与内容运营 | design-spec | deprecated | archive | 帆船配图无文字修订记录（Prompt 为 `undefined`），已被 RhineLabUI 3D 舞台取代 |
| `docs/rhine-migration.md` | project-maintenance | M 站点与内容运营 | design-spec | historical | archive | 2026-09-11 ThoughtLite 内嵌 `src/rhine/` 阶段迁移记录（含 `pnpm`、`Swup` 说明），已被 RhineLabUI-Astro 模板替代 |
| `docs/kb-convergence-design.md` | schema | A 知识库与 AI 工程 | design-spec | active | reclassify-to-wiki | 6 域 IA v2 与 provisional 毕业门禁设计；当前由 `kb-index.md` 直接引用，建议保留或经 raw 沉淀为概念/综合页 |
| `docs/adr/0001-monolocale-shortcut.md` | project-maintenance | F 工程与架构 | ADR | deprecated | archive | ThoughtLite 时代 `site.config.ts`/`src/utils/content.ts` 架构决策，代码已不在当前仓库 |
| `docs/adr/0002-og-pipeline.md` | project-maintenance | F 工程与架构 | ADR | deprecated | archive | ThoughtLite 时代 `src/graph/render.ts` satori/sharp OG 管线决策，当前仓库无 `src/graph/` |
| `docs/adr/0003-locale-aware-url-synthesis.md` | project-maintenance | F 工程与架构 | ADR | deprecated | archive | ThoughtLite 时代 `src/utils/content-fetch.ts` 决策，当前路由已迁移到 `src/blog-path.ts` 等 |
| `docs/adr/0004-i18n-key-fallback.md` | project-maintenance | F 工程与架构 | ADR | deprecated | archive | ThoughtLite 时代 `i18nit` 决策，当前使用 `src/ui-language.ts` 与 `content/locales.json` |
| `docs/adr/0005-universal-listable-shape.md` | project-maintenance | F 工程与架构 | ADR | deprecated | archive | ThoughtLite 时代 `ContentCard[]`/`Heatmap.astro` 决策，组件已删除 |
| `docs/adr/0006-og-endpoint-factory.md` | project-maintenance | F 工程与架构 | ADR | deprecated | archive | ThoughtLite 时代 `defineContentGraphEndpoint` 决策，当前已不存在 |
| `docs/CODEMAPS/architecture.md` | project-maintenance | F 工程与架构 | reference | deprecated | deprecate | 2026-06-01 生成：描述 Astro 5 + Svelte 5 + Tailwind 4 + pnpm，与当前 Astro 7.3.6 + Three.js + npm 冲突 |
| `docs/CODEMAPS/content.md` | project-maintenance | M 站点与内容运营 | reference | deprecated | deprecate | 2026-06-01 生成：仅描述 `src/content/{note,jotting,preface,information}`，未反映 `content/blog/legacy/` 与 `src/content.config.ts` |
| `docs/CODEMAPS/dependencies.md` | project-maintenance | F 工程与架构 | reference | deprecated | deprecate | 2026-06-01 生成：列出不存在的 `svelte`、`tailwindcss`、`@swup/astro`、`@biomejs/biome`、`satori`、`sharp` |
| `docs/CODEMAPS/frontend.md` | project-maintenance | F 工程与架构 | reference | deprecated | deprecate | 2026-07-02 生成：描述已全部删除的 `[...locale]/`、`App.astro`、`Base.astro`、`Heatmap.astro`、`ContentList.svelte` |
| `docs/agents/domain.md` | agent-contract | A 知识库与 AI 工程 | skill | provisional | merge | 通用 `mattpocock/skills` 模板，指向 `GLOSSARY.md` 与 `docs/adr/`（两者本身均停留在 ThoughtLite 时代） |
| `docs/agents/issue-tracker.md` | agent-contract | A 知识库与 AI 工程 | skill | provisional | keep | `gh` CLI Issue/Wayfinder 规程；注意 `docs/BUSINESS-IMPLEMENTATION.md:50` 记录仓库曾关闭 issues，需确认当前启用状态 |
| `docs/agents/triage-labels.md` | agent-contract | A 知识库与 AI 工程 | config | provisional | keep | 五类 triage 标签映射表（`mattpocock/skills` 配套） |

### 3.2 根目录文档逐文件表（11 份）

| 文件 | KB 层 | 六域 | 文档类型 | 生命周期 | 裁决 | 审计依据与说明 |
|---|---|---|---|---|---|---|
| `AGENTS.md` | agent-contract | A 知识库与 AI 工程 | skill | active | merge | 顶部 1-12 行为 RhineLabUI-Astro 规则，14-65 行为旧 `CLAUDE.md`（pnpm/Svelte/`site.config.ts`/`src/pages/[...locale]/`），内部自相矛盾 |
| `KB.md` | schema | A 知识库与 AI 工程 | design-spec | active | merge | 知识库宪法：仍写 `src/content/note`、`src/content/information/{locale}/kb-index.md` 与 `pnpm kb:lint`，与 `scripts/kb-lint.ts`（检查 `content/blog/legacy/`）及 `npm run kb:lint` 冲突 |
| `GLOSSARY.md` | project-maintenance | F 工程与架构 | glossary | deprecated | deprecate | ThoughtLite 统一语言词表（原 `CONTEXT.md`），描述已删除的 `ContentCard`、`Section`、`Heatmap.astro`、`src/utils/*` |
| `CONTRIBUTING.md` | project-maintenance | M 站点与内容运营 | runbook | deprecated | deprecate | ThoughtLite 贡献指南：要求 `pnpm`、Biome、`pnpm new`，且第 184 行仍引导 Fork `tuyuritio/astro-theme-thought-lite` |
| `README.md` | project-maintenance | M 站点与内容运营 | README | active | keep | RhineLabUI-Astro 博客主 README（含 `npm` 命令）；仅第 36 行链接 `docs/ABOUT-CONTENT-AUDIT.md` 断链需修复 |
| `README.zh-cn.md` | project-maintenance | M 站点与内容运营 | README | deprecated | merge | 仍标题为 `ThoughtLite 知识库`，描述 `pnpm`、`site.config.ts`、`src/rhine/`、`src/pages/[...locale]/`，未随 `README.md` 同步更新 |
| `README.ja.md` | project-maintenance | M 站点与内容运营 | README | deprecated | merge | 同 `README.zh-cn.md`，滞留在 ThoughtLite + 内嵌 Rhine 阶段，未同步 RhineLabUI-Astro |
| `CHANGELOG.md` | project-maintenance | M 站点与内容运营 | changelog | historical | archive | 上游 `astro-theme-thought-lite` v0.36.3 历史变更记录，不再反映当前博客迭代 |
| `PR15-ATTRIBUTION.md` | project-maintenance | M 站点与内容运营 | attribution | active | keep | RhineLabUI PR #15 Web 渲染优化移植署名与基准证据，引用现已不在 `scripts/` 的 `check-pr15-*.mjs`（需加注或归档） |
| `arthas.md` | inbox | B Java 与并发 | concept | provisional | reclassify-to-wiki | 根目录遗留的独立 Arthas 线上诊断文章（244 行），未纳入 `raw` 与 `kb-index.md`，建议作为 raw 或归并入 `java-online-performance-debug` |
| `pnpm-workspace.yaml` | config | E 基础设施与运维 | config | deprecated | deprecate | 仅含 `onlyBuiltDependencies` 与 `@kitlangton/rolling-number@0.4.1` pnpm 补丁声明；项目已切换至 `npm`（`package-lock.json` + `scripts/patch-rolling-number.mjs`） |

### 3.3 Agent 层逐文件表（`.claude/` 9 份）

| 文件 | KB 层 | 六域 | 文档类型 | 生命周期 | 裁决 | 审计依据与说明 |
|---|---|---|---|---|---|---|
| `.claude/rules/skill-autoload.md` | agent-contract | A 知识库与 AI 工程 | skill | deprecated | merge | 指向 ThoughtLite 时代 6 个技能（漏列 `knowledge-base.md`，且仍称 ThoughtLite Astro 主题） |
| `.claude/skills/knowledge-base.md` | schema | A 知识库与 AI 工程 | skill | active | merge | 核心 KB 规程，但仍引用 `src/content/note/`、`pnpm kb:lint`，需与 `scripts/kb-lint.ts`（`content/blog/legacy/`）对齐 |
| `.claude/skills/astro-theme-dev.md` | agent-contract | M 站点与内容运营 | skill | deprecated | deprecate | 描述 ThoughtLite `src/pages/[...locale]/`、`App.astro`、`Base.astro`、`src/graph/`、`pnpm` |
| `.claude/skills/component-patterns.md` | agent-contract | M 站点与内容运营 | skill | deprecated | deprecate | 描述已删除的 `Heatmap.astro`、`Note.svelte`、`Sensitive.svelte`、`Linkroll.astro`、`TOC.astro` |
| `.claude/skills/content-authoring.md` | agent-contract | M 站点与内容运营 | skill | deprecated | deprecate | 描述旧 `src/content/` frontmatter（`timestamp`/`series`/`toc`），未涵盖 `content/blog/legacy/` 与 `archiveId`/`category`/`findings` |
| `.claude/skills/i18n-integration.md` | agent-contract | M 站点与内容运营 | skill | deprecated | deprecate | 描述已删除的 `site.config.ts`、`src/i18n/index.ts`、`App.astro`、`src/graph/` 字体映射 |
| `.claude/skills/markdown-writing-rules.md` | agent-contract | M 站点与内容运营 | skill | deprecated | deprecate | 描述 ThoughtLite 扩展语法（Ruby/Spoiler/Emoji/Alerts）与旧 frontmatter，与 `src/content.config.ts` 不一致 |
| `.claude/skills/multi-lang-content.md` | agent-contract | M 站点与内容运营 | skill | deprecated | deprecate | 描述旧 `src/content/` 三语与单语言模式切换（`site.config.ts`），且未体现 `KB.md` 的 `zh-cn` 正典约束 |
| `.claude/skills/site-config-mastery.md` | agent-contract | M 站点与内容运营 | skill | deprecated | deprecate | 描述已删除的 `site.config.ts`、`PUBLIC_TIMEZONE`、`src/icons/site-logo.svg`，而非 `content/site.json` |

---

## 4. 生成镜像层映射表（`content/blog/legacy/**`，共 201 份）

说明：
- 镜像层由 [scripts/import-legacy.mjs](../../scripts/import-legacy.mjs) 在 `f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64` 时从 `src/content/` 一次性导出，之后**被当作实际可编辑和发布层**（[migration/README.md:5](../../migration/README.md#L5) 与 [scripts/kb-lint.ts:12](../../scripts/kb-lint.ts#L12) 均指向此处）。
- **状态判定标准**（已剥离适配器机械转换：`/note/`→`/blog/legacy/` 链接重写、YAML/MDX→Markdown 格式转换、文末自动追加的 `## 来源与关联文档`、`draft`/`status`/`kind`/`sources`/`related` 显式字段提取）：
  - `in-sync`（**75 份**）：去除适配器机械转换后，正文与元数据与 `src/content/` 一致。
  - `drifted`（**123 份**）：在 `content/blog/legacy/` 中发生过迁移后的正文修订或元数据变更（`en`/`ja` 含 2026-10-30 启用发布的译文与 10-31 逐段语义重写；`zh-cn` 含 4 份实际修补）。
  - `extra`（**3 份**）：`information/*/introduction.md` 于 2026-11-25 脱敏重建后仅存于镜像层，已从 `src/content/` 删除。
  - `missing`（**0 份**）：`src/content/{note,jotting,information,preface}` 中所有 198 份文件均已进入镜像。

### 4.1 Note 镜像映射表（58 个 slug × 3 语言 = 174 行）

| # | slug | 语言 | archiveId | 正典/对应路径 | 镜像路径 | KB 层 | 六域 | 生命周期 | mirror 状态 | 差异说明 | 裁决 |
|---:|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `containerd-tls-troubleshooting` | `zh-cn` | `X-1138` | `src/content/note/zh-cn/containerd-tls-troubleshooting.md` | `content/blog/legacy/note/zh-cn/containerd-tls-troubleshooting.md` | `generated-mirror` | E 基础设施与运维 | `active` | `in-sync` | 适配器转换一致 | `keep` |
| 2 | `containerd-tls-troubleshooting` | `en` | `X-1022` | `src/content/note/en/containerd-tls-troubleshooting.md` | `content/blog/legacy/note/en/containerd-tls-troubleshooting.md` | `generated-mirror` | E 基础设施与运维 | `active` | `drifted` | 正文修订+元数据(draft:True->False,related) | `keep` |
| 3 | `containerd-tls-troubleshooting` | `ja` | `X-1080` | `src/content/note/ja/containerd-tls-troubleshooting.md` | `content/blog/legacy/note/ja/containerd-tls-troubleshooting.md` | `generated-mirror` | E 基础设施与运维 | `active` | `drifted` | 正文修订+元数据(draft:True->False,related) | `keep` |
| 4 | `database-schema-drift` | `zh-cn` | `X-1139` | `src/content/note/zh-cn/database-schema-drift.md` | `content/blog/legacy/note/zh-cn/database-schema-drift.md` | `generated-mirror` | D 分布式与微服务 | `active` | `in-sync` | 适配器转换一致 | `keep` |
| 5 | `database-schema-drift` | `en` | `X-1023` | `src/content/note/en/database-schema-drift.md` | `content/blog/legacy/note/en/database-schema-drift.md` | `generated-mirror` | D 分布式与微服务 | `active` | `drifted` | 元数据(draft:True->False) | `keep` |
| 6 | `database-schema-drift` | `ja` | `X-1081` | `src/content/note/ja/database-schema-drift.md` | `content/blog/legacy/note/ja/database-schema-drift.md` | `generated-mirror` | D 分布式与微服务 | `active` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 7 | `database-written-test-review` | `zh-cn` | `X-1140` | `src/content/note/zh-cn/database-written-test-review.md` | `content/blog/legacy/note/zh-cn/database-written-test-review.md` | `generated-mirror` | C 存储与缓存 | `provisional` | `in-sync` | 适配器转换一致 | `keep` |
| 8 | `database-written-test-review` | `en` | `X-1024` | `src/content/note/en/database-written-test-review.md` | `content/blog/legacy/note/en/database-written-test-review.md` | `generated-mirror` | C 存储与缓存 | `provisional` | `drifted` | 正文修订 | `keep` |
| 9 | `database-written-test-review` | `ja` | `X-1082` | `src/content/note/ja/database-written-test-review.md` | `content/blog/legacy/note/ja/database-written-test-review.md` | `generated-mirror` | C 存储与缓存 | `provisional` | `drifted` | 正文修订 | `keep` |
| 10 | `docker-fundamentals` | `zh-cn` | `X-1141` | `src/content/note/zh-cn/docker-fundamentals.md` | `content/blog/legacy/note/zh-cn/docker-fundamentals.md` | `generated-mirror` | E 基础设施与运维 | `active` | `in-sync` | 适配器转换一致 | `keep` |
| 11 | `docker-fundamentals` | `en` | `X-1025` | `src/content/note/en/docker-fundamentals.md` | `content/blog/legacy/note/en/docker-fundamentals.md` | `generated-mirror` | E 基础设施与运维 | `active` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 12 | `docker-fundamentals` | `ja` | `X-1083` | `src/content/note/ja/docker-fundamentals.md` | `content/blog/legacy/note/ja/docker-fundamentals.md` | `generated-mirror` | E 基础设施与运维 | `active` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 13 | `dubbo-nacos-runtime` | `zh-cn` | `X-1142` | `src/content/note/zh-cn/dubbo-nacos-runtime.md` | `content/blog/legacy/note/zh-cn/dubbo-nacos-runtime.md` | `generated-mirror` | D 分布式与微服务 | `active` | `in-sync` | 适配器转换一致 | `keep` |
| 14 | `dubbo-nacos-runtime` | `en` | `X-1026` | `src/content/note/en/dubbo-nacos-runtime.md` | `content/blog/legacy/note/en/dubbo-nacos-runtime.md` | `generated-mirror` | D 分布式与微服务 | `active` | `drifted` | 元数据(draft:True->False) | `keep` |
| 15 | `dubbo-nacos-runtime` | `ja` | `X-1084` | `src/content/note/ja/dubbo-nacos-runtime.md` | `content/blog/legacy/note/ja/dubbo-nacos-runtime.md` | `generated-mirror` | D 分布式与微服务 | `active` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 16 | `frontend-mybatis-essays` | `zh-cn` | `X-1143` | `src/content/note/zh-cn/frontend-mybatis-essays.md` | `content/blog/legacy/note/zh-cn/frontend-mybatis-essays.md` | `generated-mirror` | G 归档废弃 | `deprecated` | `in-sync` | 适配器转换一致 | `archive` |
| 17 | `frontend-mybatis-essays` | `en` | `X-1027` | `src/content/note/en/frontend-mybatis-essays.md` | `content/blog/legacy/note/en/frontend-mybatis-essays.md` | `generated-mirror` | G 归档废弃 | `deprecated` | `drifted` | 正文修订+元数据(draft:True->False,status) | `archive` |
| 18 | `frontend-mybatis-essays` | `ja` | `X-1085` | `src/content/note/ja/frontend-mybatis-essays.md` | `content/blog/legacy/note/ja/frontend-mybatis-essays.md` | `generated-mirror` | G 归档废弃 | `deprecated` | `drifted` | 正文修订+元数据(draft:True->False,status) | `archive` |
| 19 | `hbase-foundation-and-ops` | `zh-cn` | `X-1144` | `src/content/note/zh-cn/hbase-foundation-and-ops.md` | `content/blog/legacy/note/zh-cn/hbase-foundation-and-ops.md` | `generated-mirror` | C 存储与缓存 | `active` | `in-sync` | 适配器转换一致 | `keep` |
| 20 | `hbase-foundation-and-ops` | `en` | `X-1028` | `src/content/note/en/hbase-foundation-and-ops.md` | `content/blog/legacy/note/en/hbase-foundation-and-ops.md` | `generated-mirror` | C 存储与缓存 | `active` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 21 | `hbase-foundation-and-ops` | `ja` | `X-1086` | `src/content/note/ja/hbase-foundation-and-ops.md` | `content/blog/legacy/note/ja/hbase-foundation-and-ops.md` | `generated-mirror` | C 存储与缓存 | `active` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 22 | `headroom-cc-switch-coexistence` | `zh-cn` | `X-1145` | `src/content/note/zh-cn/headroom-cc-switch-coexistence.md` | `content/blog/legacy/note/zh-cn/headroom-cc-switch-coexistence.md` | `generated-mirror` | A 知识库与 AI 工程 | `provisional` | `in-sync` | 适配器转换一致 | `keep` |
| 23 | `headroom-cc-switch-coexistence` | `en` | `X-1029` | `src/content/note/en/headroom-cc-switch-coexistence.md` | `content/blog/legacy/note/en/headroom-cc-switch-coexistence.md` | `generated-mirror` | A 知识库与 AI 工程 | `provisional` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 24 | `headroom-cc-switch-coexistence` | `ja` | `X-1087` | `src/content/note/ja/headroom-cc-switch-coexistence.md` | `content/blog/legacy/note/ja/headroom-cc-switch-coexistence.md` | `generated-mirror` | A 知识库与 AI 工程 | `provisional` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 25 | `headroom-compress-retrieve-contract` | `zh-cn` | `X-1146` | `src/content/note/zh-cn/headroom-compress-retrieve-contract.md` | `content/blog/legacy/note/zh-cn/headroom-compress-retrieve-contract.md` | `generated-mirror` | A 知识库与 AI 工程 | `active` | `in-sync` | 适配器转换一致 | `keep` |
| 26 | `headroom-compress-retrieve-contract` | `en` | `X-1030` | `src/content/note/en/headroom-compress-retrieve-contract.md` | `content/blog/legacy/note/en/headroom-compress-retrieve-contract.md` | `generated-mirror` | A 知识库与 AI 工程 | `active` | `drifted` | 正文修订+元数据(related) | `keep` |
| 27 | `headroom-compress-retrieve-contract` | `ja` | `X-1088` | `src/content/note/ja/headroom-compress-retrieve-contract.md` | `content/blog/legacy/note/ja/headroom-compress-retrieve-contract.md` | `generated-mirror` | A 知识库与 AI 工程 | `active` | `drifted` | 正文修订+元数据(related) | `keep` |
| 28 | `headroom-single-port-evolution` | `zh-cn` | `X-1147` | `src/content/note/zh-cn/headroom-single-port-evolution.md` | `content/blog/legacy/note/zh-cn/headroom-single-port-evolution.md` | `generated-mirror` | A 知识库与 AI 工程 | `provisional` | `in-sync` | 适配器转换一致 | `keep` |
| 29 | `headroom-single-port-evolution` | `en` | `X-1031` | `src/content/note/en/headroom-single-port-evolution.md` | `content/blog/legacy/note/en/headroom-single-port-evolution.md` | `generated-mirror` | A 知识库与 AI 工程 | `provisional` | `drifted` | 正文修订+元数据(draft:True->False,related) | `keep` |
| 30 | `headroom-single-port-evolution` | `ja` | `X-1089` | `src/content/note/ja/headroom-single-port-evolution.md` | `content/blog/legacy/note/ja/headroom-single-port-evolution.md` | `generated-mirror` | A 知识库与 AI 工程 | `provisional` | `drifted` | 正文修订+元数据(draft:True->False,related) | `keep` |
| 31 | `hindsight-local-deployment` | `zh-cn` | `X-1149` | `src/content/note/zh-cn/hindsight-local-deployment.md` | `content/blog/legacy/note/zh-cn/hindsight-local-deployment.md` | `generated-mirror` | A 知识库与 AI 工程 | `active` | `in-sync` | 适配器转换一致 | `keep` |
| 32 | `hindsight-local-deployment` | `en` | `X-1033` | `src/content/note/en/hindsight-local-deployment.md` | `content/blog/legacy/note/en/hindsight-local-deployment.md` | `generated-mirror` | A 知识库与 AI 工程 | `active` | `drifted` | 正文修订 | `keep` |
| 33 | `hindsight-local-deployment` | `ja` | `X-1091` | `src/content/note/ja/hindsight-local-deployment.md` | `content/blog/legacy/note/ja/hindsight-local-deployment.md` | `generated-mirror` | A 知识库与 AI 工程 | `active` | `drifted` | 正文修订 | `keep` |
| 34 | `hindsight-local-deployment-and-agent-integration` | `zh-cn` | `X-1148` | `src/content/note/zh-cn/hindsight-local-deployment-and-agent-integration.md` | `content/blog/legacy/note/zh-cn/hindsight-local-deployment-and-agent-integration.md` | `generated-mirror` | G 归档废弃 | `deprecated` | `in-sync` | 适配器转换一致 | `archive` |
| 35 | `hindsight-local-deployment-and-agent-integration` | `en` | `X-1032` | `src/content/note/en/hindsight-local-deployment-and-agent-integration.md` | `content/blog/legacy/note/en/hindsight-local-deployment-and-agent-integration.md` | `generated-mirror` | G 归档废弃 | `deprecated` | `drifted` | 正文修订+元数据(draft:True->False,status,related) | `archive` |
| 36 | `hindsight-local-deployment-and-agent-integration` | `ja` | `X-1090` | `src/content/note/ja/hindsight-local-deployment-and-agent-integration.md` | `content/blog/legacy/note/ja/hindsight-local-deployment-and-agent-integration.md` | `generated-mirror` | G 归档废弃 | `deprecated` | `drifted` | 正文修订+元数据(draft:True->False,status,related) | `archive` |
| 37 | `hindsight-omp-codex-integration` | `zh-cn` | `X-1150` | `src/content/note/zh-cn/hindsight-omp-codex-integration.md` | `content/blog/legacy/note/zh-cn/hindsight-omp-codex-integration.md` | `generated-mirror` | A 知识库与 AI 工程 | `active` | `drifted` | 正文修订 | `merge` |
| 38 | `hindsight-omp-codex-integration` | `en` | `X-1034` | `src/content/note/en/hindsight-omp-codex-integration.md` | `content/blog/legacy/note/en/hindsight-omp-codex-integration.md` | `generated-mirror` | A 知识库与 AI 工程 | `active` | `drifted` | 正文修订 | `keep` |
| 39 | `hindsight-omp-codex-integration` | `ja` | `X-1092` | `src/content/note/ja/hindsight-omp-codex-integration.md` | `content/blog/legacy/note/ja/hindsight-omp-codex-integration.md` | `generated-mirror` | A 知识库与 AI 工程 | `active` | `drifted` | 正文修订 | `keep` |
| 40 | `hindsight-troubleshooting` | `zh-cn` | `X-1151` | `src/content/note/zh-cn/hindsight-troubleshooting.md` | `content/blog/legacy/note/zh-cn/hindsight-troubleshooting.md` | `generated-mirror` | A 知识库与 AI 工程 | `active` | `in-sync` | 适配器转换一致 | `keep` |
| 41 | `hindsight-troubleshooting` | `en` | `X-1035` | `src/content/note/en/hindsight-troubleshooting.md` | `content/blog/legacy/note/en/hindsight-troubleshooting.md` | `generated-mirror` | A 知识库与 AI 工程 | `active` | `drifted` | 正文修订 | `keep` |
| 42 | `hindsight-troubleshooting` | `ja` | `X-1093` | `src/content/note/ja/hindsight-troubleshooting.md` | `content/blog/legacy/note/ja/hindsight-troubleshooting.md` | `generated-mirror` | A 知识库与 AI 工程 | `active` | `drifted` | 正文修订 | `keep` |
| 43 | `intranet-penetration-ssh-guide` | `zh-cn` | `X-1152` | `src/content/note/zh-cn/intranet-penetration-ssh-guide.md` | `content/blog/legacy/note/zh-cn/intranet-penetration-ssh-guide.md` | `generated-mirror` | E 基础设施与运维 | `active` | `in-sync` | 适配器转换一致 | `keep` |
| 44 | `intranet-penetration-ssh-guide` | `en` | `X-1036` | `src/content/note/en/intranet-penetration-ssh-guide.md` | `content/blog/legacy/note/en/intranet-penetration-ssh-guide.md` | `generated-mirror` | E 基础设施与运维 | `active` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 45 | `intranet-penetration-ssh-guide` | `ja` | `X-1094` | `src/content/note/ja/intranet-penetration-ssh-guide.md` | `content/blog/legacy/note/ja/intranet-penetration-ssh-guide.md` | `generated-mirror` | E 基础设施与运维 | `active` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 46 | `java-atomic-boolean` | `zh-cn` | `X-1153` | `src/content/note/zh-cn/java-atomic-boolean.md` | `content/blog/legacy/note/zh-cn/java-atomic-boolean.md` | `generated-mirror` | B Java 与并发 | `active` | `in-sync` | 适配器转换一致 | `keep` |
| 47 | `java-atomic-boolean` | `en` | `X-1037` | `src/content/note/en/java-atomic-boolean.md` | `content/blog/legacy/note/en/java-atomic-boolean.md` | `generated-mirror` | B Java 与并发 | `active` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 48 | `java-atomic-boolean` | `ja` | `X-1095` | `src/content/note/ja/java-atomic-boolean.md` | `content/blog/legacy/note/ja/java-atomic-boolean.md` | `generated-mirror` | B Java 与并发 | `active` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 49 | `java-auto-closeable` | `zh-cn` | `X-1154` | `src/content/note/zh-cn/java-auto-closeable.md` | `content/blog/legacy/note/zh-cn/java-auto-closeable.md` | `generated-mirror` | B Java 与并发 | `active` | `in-sync` | 适配器转换一致 | `keep` |
| 50 | `java-auto-closeable` | `en` | `X-1038` | `src/content/note/en/java-auto-closeable.md` | `content/blog/legacy/note/en/java-auto-closeable.md` | `generated-mirror` | B Java 与并发 | `active` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 51 | `java-auto-closeable` | `ja` | `X-1096` | `src/content/note/ja/java-auto-closeable.md` | `content/blog/legacy/note/ja/java-auto-closeable.md` | `generated-mirror` | B Java 与并发 | `active` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 52 | `java-concurrency-deepdive` | `zh-cn` | `X-1155` | `src/content/note/zh-cn/java-concurrency-deepdive.md` | `content/blog/legacy/note/zh-cn/java-concurrency-deepdive.md` | `generated-mirror` | B Java 与并发 | `active` | `in-sync` | 适配器转换一致 | `keep` |
| 53 | `java-concurrency-deepdive` | `en` | `X-1039` | `src/content/note/en/java-concurrency-deepdive.md` | `content/blog/legacy/note/en/java-concurrency-deepdive.md` | `generated-mirror` | B Java 与并发 | `active` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 54 | `java-concurrency-deepdive` | `ja` | `X-1097` | `src/content/note/ja/java-concurrency-deepdive.md` | `content/blog/legacy/note/ja/java-concurrency-deepdive.md` | `generated-mirror` | B Java 与并发 | `active` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 55 | `java-internship-interview-blog-polished` | `zh-cn` | `X-1156` | `src/content/note/zh-cn/java-internship-interview-blog-polished.md` | `content/blog/legacy/note/zh-cn/java-internship-interview-blog-polished.md` | `generated-mirror` | B Java 与并发 | `provisional` | `in-sync` | 适配器转换一致 | `keep` |
| 56 | `java-internship-interview-blog-polished` | `en` | `X-1040` | `src/content/note/en/java-internship-interview-blog-polished.md` | `content/blog/legacy/note/en/java-internship-interview-blog-polished.md` | `generated-mirror` | B Java 与并发 | `provisional` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 57 | `java-internship-interview-blog-polished` | `ja` | `X-1098` | `src/content/note/ja/java-internship-interview-blog-polished.md` | `content/blog/legacy/note/ja/java-internship-interview-blog-polished.md` | `generated-mirror` | B Java 与并发 | `provisional` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 58 | `java-null-value` | `zh-cn` | `X-1157` | `src/content/note/zh-cn/java-null-value.md` | `content/blog/legacy/note/zh-cn/java-null-value.md` | `generated-mirror` | B Java 与并发 | `active` | `in-sync` | 适配器转换一致 | `keep` |
| 59 | `java-null-value` | `en` | `X-1041` | `src/content/note/en/java-null-value.md` | `content/blog/legacy/note/en/java-null-value.md` | `generated-mirror` | B Java 与并发 | `active` | `drifted` | 正文修订+元数据(draft:True->False,related) | `keep` |
| 60 | `java-null-value` | `ja` | `X-1099` | `src/content/note/ja/java-null-value.md` | `content/blog/legacy/note/ja/java-null-value.md` | `generated-mirror` | B Java 与并发 | `active` | `drifted` | 正文修订+元数据(draft:True->False,related) | `keep` |
| 61 | `java-online-performance-debug` | `zh-cn` | `X-1158` | `src/content/note/zh-cn/java-online-performance-debug.md` | `content/blog/legacy/note/zh-cn/java-online-performance-debug.md` | `generated-mirror` | B Java 与并发 | `active` | `in-sync` | 适配器转换一致 | `keep` |
| 62 | `java-online-performance-debug` | `en` | `X-1042` | `src/content/note/en/java-online-performance-debug.md` | `content/blog/legacy/note/en/java-online-performance-debug.md` | `generated-mirror` | B Java 与并发 | `active` | `drifted` | 正文修订+元数据(draft:True->False,related) | `keep` |
| 63 | `java-online-performance-debug` | `ja` | `X-1100` | `src/content/note/ja/java-online-performance-debug.md` | `content/blog/legacy/note/ja/java-online-performance-debug.md` | `generated-mirror` | B Java 与并发 | `active` | `drifted` | 正文修订+元数据(draft:True->False,related) | `keep` |
| 64 | `jjwt-013-security-api` | `zh-cn` | `X-1159` | `src/content/note/zh-cn/jjwt-013-security-api.md` | `content/blog/legacy/note/zh-cn/jjwt-013-security-api.md` | `generated-mirror` | B Java 与并发 | `active` | `in-sync` | 适配器转换一致 | `keep` |
| 65 | `jjwt-013-security-api` | `en` | `X-1043` | `src/content/note/en/jjwt-013-security-api.md` | `content/blog/legacy/note/en/jjwt-013-security-api.md` | `generated-mirror` | B Java 与并发 | `active` | `drifted` | 元数据(draft:True->False) | `keep` |
| 66 | `jjwt-013-security-api` | `ja` | `X-1101` | `src/content/note/ja/jjwt-013-security-api.md` | `content/blog/legacy/note/ja/jjwt-013-security-api.md` | `generated-mirror` | B Java 与并发 | `active` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 67 | `kb-session-ingest-contract` | `zh-cn` | `X-1160` | `src/content/note/zh-cn/kb-session-ingest-contract.md` | `content/blog/legacy/note/zh-cn/kb-session-ingest-contract.md` | `generated-mirror` | A 知识库与 AI 工程 | `active` | `drifted` | 正文修订 | `merge` |
| 68 | `kb-session-ingest-contract` | `en` | `X-1044` | `src/content/note/en/kb-session-ingest-contract.md` | `content/blog/legacy/note/en/kb-session-ingest-contract.md` | `generated-mirror` | A 知识库与 AI 工程 | `active` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 69 | `kb-session-ingest-contract` | `ja` | `X-1102` | `src/content/note/ja/kb-session-ingest-contract.md` | `content/blog/legacy/note/ja/kb-session-ingest-contract.md` | `generated-mirror` | A 知识库与 AI 工程 | `active` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 70 | `llm-wiki-pattern` | `zh-cn` | `X-1161` | `src/content/note/zh-cn/llm-wiki-pattern.md` | `content/blog/legacy/note/zh-cn/llm-wiki-pattern.md` | `generated-mirror` | A 知识库与 AI 工程 | `active` | `in-sync` | 适配器转换一致 | `keep` |
| 71 | `llm-wiki-pattern` | `en` | `X-1045` | `src/content/note/en/llm-wiki-pattern.md` | `content/blog/legacy/note/en/llm-wiki-pattern.md` | `generated-mirror` | A 知识库与 AI 工程 | `active` | `drifted` | 正文修订+元数据(related) | `keep` |
| 72 | `llm-wiki-pattern` | `ja` | `X-1103` | `src/content/note/ja/llm-wiki-pattern.md` | `content/blog/legacy/note/ja/llm-wiki-pattern.md` | `generated-mirror` | A 知识库与 AI 工程 | `active` | `drifted` | 正文修订+元数据(related) | `keep` |
| 73 | `mcp-codebase-memory-workflow` | `zh-cn` | `X-1162` | `src/content/note/zh-cn/mcp-codebase-memory-workflow.md` | `content/blog/legacy/note/zh-cn/mcp-codebase-memory-workflow.md` | `generated-mirror` | A 知识库与 AI 工程 | `active` | `in-sync` | 适配器转换一致 | `keep` |
| 74 | `mcp-codebase-memory-workflow` | `en` | `X-1046` | `src/content/note/en/mcp-codebase-memory-workflow.md` | `content/blog/legacy/note/en/mcp-codebase-memory-workflow.md` | `generated-mirror` | A 知识库与 AI 工程 | `active` | `drifted` | 元数据(draft:True->False) | `keep` |
| 75 | `mcp-codebase-memory-workflow` | `ja` | `X-1104` | `src/content/note/ja/mcp-codebase-memory-workflow.md` | `content/blog/legacy/note/ja/mcp-codebase-memory-workflow.md` | `generated-mirror` | A 知识库与 AI 工程 | `active` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 76 | `microservice-data-ownership` | `zh-cn` | `X-1163` | `src/content/note/zh-cn/microservice-data-ownership.md` | `content/blog/legacy/note/zh-cn/microservice-data-ownership.md` | `generated-mirror` | D 分布式与微服务 | `active` | `in-sync` | 适配器转换一致 | `keep` |
| 77 | `microservice-data-ownership` | `en` | `X-1047` | `src/content/note/en/microservice-data-ownership.md` | `content/blog/legacy/note/en/microservice-data-ownership.md` | `generated-mirror` | D 分布式与微服务 | `active` | `drifted` | 元数据(draft:True->False) | `keep` |
| 78 | `microservice-data-ownership` | `ja` | `X-1105` | `src/content/note/ja/microservice-data-ownership.md` | `content/blog/legacy/note/ja/microservice-data-ownership.md` | `generated-mirror` | D 分布式与微服务 | `active` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 79 | `multi-service-readiness` | `zh-cn` | `X-1164` | `src/content/note/zh-cn/multi-service-readiness.md` | `content/blog/legacy/note/zh-cn/multi-service-readiness.md` | `generated-mirror` | D 分布式与微服务 | `active` | `in-sync` | 适配器转换一致 | `keep` |
| 80 | `multi-service-readiness` | `en` | `X-1048` | `src/content/note/en/multi-service-readiness.md` | `content/blog/legacy/note/en/multi-service-readiness.md` | `generated-mirror` | D 分布式与微服务 | `active` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 81 | `multi-service-readiness` | `ja` | `X-1106` | `src/content/note/ja/multi-service-readiness.md` | `content/blog/legacy/note/ja/multi-service-readiness.md` | `generated-mirror` | D 分布式与微服务 | `active` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 82 | `mysql-performance-troubleshooting` | `zh-cn` | `X-1165` | `src/content/note/zh-cn/mysql-performance-troubleshooting.md` | `content/blog/legacy/note/zh-cn/mysql-performance-troubleshooting.md` | `generated-mirror` | C 存储与缓存 | `active` | `in-sync` | 适配器转换一致 | `keep` |
| 83 | `mysql-performance-troubleshooting` | `en` | `X-1049` | `src/content/note/en/mysql-performance-troubleshooting.md` | `content/blog/legacy/note/en/mysql-performance-troubleshooting.md` | `generated-mirror` | C 存储与缓存 | `active` | `drifted` | 正文修订+元数据(draft:True->False,related) | `keep` |
| 84 | `mysql-performance-troubleshooting` | `ja` | `X-1107` | `src/content/note/ja/mysql-performance-troubleshooting.md` | `content/blog/legacy/note/ja/mysql-performance-troubleshooting.md` | `generated-mirror` | C 存储与缓存 | `active` | `drifted` | 正文修订+元数据(draft:True->False,related) | `keep` |
| 85 | `mysql-storage-and-deadlock` | `zh-cn` | `X-1166` | `src/content/note/zh-cn/mysql-storage-and-deadlock.md` | `content/blog/legacy/note/zh-cn/mysql-storage-and-deadlock.md` | `generated-mirror` | C 存储与缓存 | `active` | `in-sync` | 适配器转换一致 | `keep` |
| 86 | `mysql-storage-and-deadlock` | `en` | `X-1050` | `src/content/note/en/mysql-storage-and-deadlock.md` | `content/blog/legacy/note/en/mysql-storage-and-deadlock.md` | `generated-mirror` | C 存储与缓存 | `active` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 87 | `mysql-storage-and-deadlock` | `ja` | `X-1108` | `src/content/note/ja/mysql-storage-and-deadlock.md` | `content/blog/legacy/note/ja/mysql-storage-and-deadlock.md` | `generated-mirror` | C 存储与缓存 | `active` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 88 | `omp-config-and-rules-guide` | `zh-cn` | `X-1167` | `src/content/note/zh-cn/omp-config-and-rules-guide.md` | `content/blog/legacy/note/zh-cn/omp-config-and-rules-guide.md` | `generated-mirror` | A 知识库与 AI 工程 | `active` | `in-sync` | 适配器转换一致 | `keep` |
| 89 | `omp-config-and-rules-guide` | `en` | `X-1051` | `src/content/note/en/omp-config-and-rules-guide.md` | `content/blog/legacy/note/en/omp-config-and-rules-guide.md` | `generated-mirror` | A 知识库与 AI 工程 | `active` | `drifted` | 正文修订+元数据(draft:True->False,sources) | `keep` |
| 90 | `omp-config-and-rules-guide` | `ja` | `X-1109` | `src/content/note/ja/omp-config-and-rules-guide.md` | `content/blog/legacy/note/ja/omp-config-and-rules-guide.md` | `generated-mirror` | A 知识库与 AI 工程 | `active` | `drifted` | 正文修订+元数据(draft:True->False,sources) | `keep` |
| 91 | `omp-headroom-persistence` | `zh-cn` | `X-1168` | `src/content/note/zh-cn/omp-headroom-persistence.md` | `content/blog/legacy/note/zh-cn/omp-headroom-persistence.md` | `generated-mirror` | A 知识库与 AI 工程 | `provisional` | `in-sync` | 适配器转换一致 | `keep` |
| 92 | `omp-headroom-persistence` | `en` | `X-1052` | `src/content/note/en/omp-headroom-persistence.md` | `content/blog/legacy/note/en/omp-headroom-persistence.md` | `generated-mirror` | A 知识库与 AI 工程 | `provisional` | `drifted` | 正文修订+元数据(draft:True->False,sources,related) | `keep` |
| 93 | `omp-headroom-persistence` | `ja` | `X-1110` | `src/content/note/ja/omp-headroom-persistence.md` | `content/blog/legacy/note/ja/omp-headroom-persistence.md` | `generated-mirror` | A 知识库与 AI 工程 | `provisional` | `drifted` | 正文修订+元数据(draft:True->False,sources,related) | `keep` |
| 94 | `omp-headroom-provider-proxy` | `zh-cn` | `X-1169` | `src/content/note/zh-cn/omp-headroom-provider-proxy.md` | `content/blog/legacy/note/zh-cn/omp-headroom-provider-proxy.md` | `generated-mirror` | A 知识库与 AI 工程 | `provisional` | `in-sync` | 适配器转换一致 | `keep` |
| 95 | `omp-headroom-provider-proxy` | `en` | `X-1053` | `src/content/note/en/omp-headroom-provider-proxy.md` | `content/blog/legacy/note/en/omp-headroom-provider-proxy.md` | `generated-mirror` | A 知识库与 AI 工程 | `provisional` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 96 | `omp-headroom-provider-proxy` | `ja` | `X-1111` | `src/content/note/ja/omp-headroom-provider-proxy.md` | `content/blog/legacy/note/ja/omp-headroom-provider-proxy.md` | `generated-mirror` | A 知识库与 AI 工程 | `provisional` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 97 | `omp-hook-extension-guide` | `zh-cn` | `X-1170` | `src/content/note/zh-cn/omp-hook-extension-guide.md` | `content/blog/legacy/note/zh-cn/omp-hook-extension-guide.md` | `generated-mirror` | A 知识库与 AI 工程 | `active` | `in-sync` | 适配器转换一致 | `keep` |
| 98 | `omp-hook-extension-guide` | `en` | `X-1054` | `src/content/note/en/omp-hook-extension-guide.md` | `content/blog/legacy/note/en/omp-hook-extension-guide.md` | `generated-mirror` | A 知识库与 AI 工程 | `active` | `drifted` | 正文修订+元数据(draft:True->False,sources,related) | `keep` |
| 99 | `omp-hook-extension-guide` | `ja` | `X-1112` | `src/content/note/ja/omp-hook-extension-guide.md` | `content/blog/legacy/note/ja/omp-hook-extension-guide.md` | `generated-mirror` | A 知识库与 AI 工程 | `active` | `drifted` | 正文修订+元数据(draft:True->False,sources,related) | `keep` |
| 100 | `plugin-lifecycle-management` | `zh-cn` | `X-1171` | `src/content/note/zh-cn/plugin-lifecycle-management.md` | `content/blog/legacy/note/zh-cn/plugin-lifecycle-management.md` | `generated-mirror` | E 基础设施与运维 | `active` | `in-sync` | 适配器转换一致 | `keep` |
| 101 | `plugin-lifecycle-management` | `en` | `X-1055` | `src/content/note/en/plugin-lifecycle-management.md` | `content/blog/legacy/note/en/plugin-lifecycle-management.md` | `generated-mirror` | E 基础设施与运维 | `active` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 102 | `plugin-lifecycle-management` | `ja` | `X-1113` | `src/content/note/ja/plugin-lifecycle-management.md` | `content/blog/legacy/note/ja/plugin-lifecycle-management.md` | `generated-mirror` | E 基础设施与运维 | `active` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 103 | `redis-business-patterns` | `zh-cn` | `X-1172` | `src/content/note/zh-cn/redis-business-patterns.md` | `content/blog/legacy/note/zh-cn/redis-business-patterns.md` | `generated-mirror` | C 存储与缓存 | `active` | `in-sync` | 适配器转换一致 | `keep` |
| 104 | `redis-business-patterns` | `en` | `X-1056` | `src/content/note/en/redis-business-patterns.md` | `content/blog/legacy/note/en/redis-business-patterns.md` | `generated-mirror` | C 存储与缓存 | `active` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 105 | `redis-business-patterns` | `ja` | `X-1114` | `src/content/note/ja/redis-business-patterns.md` | `content/blog/legacy/note/ja/redis-business-patterns.md` | `generated-mirror` | C 存储与缓存 | `active` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 106 | `redis-heima-practice` | `zh-cn` | `X-1173` | `src/content/note/zh-cn/redis-heima-practice.md` | `content/blog/legacy/note/zh-cn/redis-heima-practice.md` | `generated-mirror` | C 存储与缓存 | `active` | `in-sync` | 适配器转换一致 | `keep` |
| 107 | `redis-heima-practice` | `en` | `X-1057` | `src/content/note/en/redis-heima-practice.md` | `content/blog/legacy/note/en/redis-heima-practice.md` | `generated-mirror` | C 存储与缓存 | `active` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 108 | `redis-heima-practice` | `ja` | `X-1115` | `src/content/note/ja/redis-heima-practice.md` | `content/blog/legacy/note/ja/redis-heima-practice.md` | `generated-mirror` | C 存储与缓存 | `active` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 109 | `redis-jackson-java-time` | `zh-cn` | `X-1174` | `src/content/note/zh-cn/redis-jackson-java-time.md` | `content/blog/legacy/note/zh-cn/redis-jackson-java-time.md` | `generated-mirror` | B Java 与并发 | `active` | `in-sync` | 适配器转换一致 | `keep` |
| 110 | `redis-jackson-java-time` | `en` | `X-1058` | `src/content/note/en/redis-jackson-java-time.md` | `content/blog/legacy/note/en/redis-jackson-java-time.md` | `generated-mirror` | B Java 与并发 | `active` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 111 | `redis-jackson-java-time` | `ja` | `X-1116` | `src/content/note/ja/redis-jackson-java-time.md` | `content/blog/legacy/note/ja/redis-jackson-java-time.md` | `generated-mirror` | B Java 与并发 | `active` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 112 | `redis-persistence-principle` | `zh-cn` | `X-1175` | `src/content/note/zh-cn/redis-persistence-principle.md` | `content/blog/legacy/note/zh-cn/redis-persistence-principle.md` | `generated-mirror` | C 存储与缓存 | `active` | `in-sync` | 适配器转换一致 | `keep` |
| 113 | `redis-persistence-principle` | `en` | `X-1059` | `src/content/note/en/redis-persistence-principle.md` | `content/blog/legacy/note/en/redis-persistence-principle.md` | `generated-mirror` | C 存储与缓存 | `active` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 114 | `redis-persistence-principle` | `ja` | `X-1117` | `src/content/note/ja/redis-persistence-principle.md` | `content/blog/legacy/note/ja/redis-persistence-principle.md` | `generated-mirror` | C 存储与缓存 | `active` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 115 | `resicache` | `zh-cn` | `X-1181` | `src/content/note/zh-cn/resicache.md` | `content/blog/legacy/note/zh-cn/resicache.md` | `generated-mirror` | F 工程与架构 | `provisional` | `in-sync` | 适配器转换一致 | `keep` |
| 116 | `resicache` | `en` | `X-1065` | `src/content/note/en/resicache.md` | `content/blog/legacy/note/en/resicache.md` | `generated-mirror` | F 工程与架构 | `provisional` | `drifted` | 正文修订+元数据(status,sources) | `keep` |
| 117 | `resicache` | `ja` | `X-1123` | `src/content/note/ja/resicache.md` | `content/blog/legacy/note/ja/resicache.md` | `generated-mirror` | F 工程与架构 | `provisional` | `drifted` | 正文修订+元数据(status,sources) | `keep` |
| 118 | `resicache-early-expiration-cas` | `zh-cn` | `X-1176` | `src/content/note/zh-cn/resicache-early-expiration-cas.md` | `content/blog/legacy/note/zh-cn/resicache-early-expiration-cas.md` | `generated-mirror` | F 工程与架构 | `provisional` | `in-sync` | 适配器转换一致 | `keep` |
| 119 | `resicache-early-expiration-cas` | `en` | `X-1060` | `src/content/note/en/resicache-early-expiration-cas.md` | `content/blog/legacy/note/en/resicache-early-expiration-cas.md` | `generated-mirror` | F 工程与架构 | `provisional` | `drifted` | 正文修订 | `keep` |
| 120 | `resicache-early-expiration-cas` | `ja` | `X-1118` | `src/content/note/ja/resicache-early-expiration-cas.md` | `content/blog/legacy/note/ja/resicache-early-expiration-cas.md` | `generated-mirror` | F 工程与架构 | `provisional` | `drifted` | 正文修订 | `keep` |
| 121 | `resicache-handler-chain-and-observer` | `zh-cn` | `X-1177` | `src/content/note/zh-cn/resicache-handler-chain-and-observer.md` | `content/blog/legacy/note/zh-cn/resicache-handler-chain-and-observer.md` | `generated-mirror` | F 工程与架构 | `provisional` | `in-sync` | 适配器转换一致 | `keep` |
| 122 | `resicache-handler-chain-and-observer` | `en` | `X-1061` | `src/content/note/en/resicache-handler-chain-and-observer.md` | `content/blog/legacy/note/en/resicache-handler-chain-and-observer.md` | `generated-mirror` | F 工程与架构 | `provisional` | `drifted` | 正文修订 | `keep` |
| 123 | `resicache-handler-chain-and-observer` | `ja` | `X-1119` | `src/content/note/ja/resicache-handler-chain-and-observer.md` | `content/blog/legacy/note/ja/resicache-handler-chain-and-observer.md` | `generated-mirror` | F 工程与架构 | `provisional` | `drifted` | 正文修订 | `keep` |
| 124 | `resicache-observer-nested-execution` | `zh-cn` | `X-1178` | `src/content/note/zh-cn/resicache-observer-nested-execution.md` | `content/blog/legacy/note/zh-cn/resicache-observer-nested-execution.md` | `generated-mirror` | D 分布式与微服务 | `active` | `in-sync` | 适配器转换一致 | `keep` |
| 125 | `resicache-observer-nested-execution` | `en` | `X-1062` | `src/content/note/en/resicache-observer-nested-execution.md` | `content/blog/legacy/note/en/resicache-observer-nested-execution.md` | `generated-mirror` | D 分布式与微服务 | `active` | `drifted` | 正文修订+元数据(draft:True->False,related) | `keep` |
| 126 | `resicache-observer-nested-execution` | `ja` | `X-1120` | `src/content/note/ja/resicache-observer-nested-execution.md` | `content/blog/legacy/note/ja/resicache-observer-nested-execution.md` | `generated-mirror` | D 分布式与微服务 | `active` | `drifted` | 正文修订+元数据(draft:True->False,related) | `keep` |
| 127 | `resicache-serialization-migration` | `zh-cn` | `X-1179` | `src/content/note/zh-cn/resicache-serialization-migration.md` | `content/blog/legacy/note/zh-cn/resicache-serialization-migration.md` | `generated-mirror` | F 工程与架构 | `provisional` | `in-sync` | 适配器转换一致 | `keep` |
| 128 | `resicache-serialization-migration` | `en` | `X-1063` | `src/content/note/en/resicache-serialization-migration.md` | `content/blog/legacy/note/en/resicache-serialization-migration.md` | `generated-mirror` | F 工程与架构 | `provisional` | `drifted` | 正文修订 | `keep` |
| 129 | `resicache-serialization-migration` | `ja` | `X-1121` | `src/content/note/ja/resicache-serialization-migration.md` | `content/blog/legacy/note/ja/resicache-serialization-migration.md` | `generated-mirror` | F 工程与架构 | `provisional` | `drifted` | 正文修订 | `keep` |
| 130 | `resicache-single-flight` | `zh-cn` | `X-1180` | `src/content/note/zh-cn/resicache-single-flight.md` | `content/blog/legacy/note/zh-cn/resicache-single-flight.md` | `generated-mirror` | F 工程与架构 | `provisional` | `in-sync` | 适配器转换一致 | `keep` |
| 131 | `resicache-single-flight` | `en` | `X-1064` | `src/content/note/en/resicache-single-flight.md` | `content/blog/legacy/note/en/resicache-single-flight.md` | `generated-mirror` | F 工程与架构 | `provisional` | `drifted` | 正文修订 | `keep` |
| 132 | `resicache-single-flight` | `ja` | `X-1122` | `src/content/note/ja/resicache-single-flight.md` | `content/blog/legacy/note/ja/resicache-single-flight.md` | `generated-mirror` | F 工程与架构 | `provisional` | `drifted` | 正文修订 | `keep` |
| 133 | `spark-bigdata-ecosystem` | `zh-cn` | `X-1182` | `src/content/note/zh-cn/spark-bigdata-ecosystem.md` | `content/blog/legacy/note/zh-cn/spark-bigdata-ecosystem.md` | `generated-mirror` | C 存储与缓存 | `active` | `in-sync` | 适配器转换一致 | `keep` |
| 134 | `spark-bigdata-ecosystem` | `en` | `X-1066` | `src/content/note/en/spark-bigdata-ecosystem.md` | `content/blog/legacy/note/en/spark-bigdata-ecosystem.md` | `generated-mirror` | C 存储与缓存 | `active` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 135 | `spark-bigdata-ecosystem` | `ja` | `X-1124` | `src/content/note/ja/spark-bigdata-ecosystem.md` | `content/blog/legacy/note/ja/spark-bigdata-ecosystem.md` | `generated-mirror` | C 存储与缓存 | `active` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 136 | `spring-cloud-and-boot` | `zh-cn` | `X-1183` | `src/content/note/zh-cn/spring-cloud-and-boot.md` | `content/blog/legacy/note/zh-cn/spring-cloud-and-boot.md` | `generated-mirror` | D 分布式与微服务 | `active` | `in-sync` | 适配器转换一致 | `keep` |
| 137 | `spring-cloud-and-boot` | `en` | `X-1067` | `src/content/note/en/spring-cloud-and-boot.md` | `content/blog/legacy/note/en/spring-cloud-and-boot.md` | `generated-mirror` | D 分布式与微服务 | `active` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 138 | `spring-cloud-and-boot` | `ja` | `X-1125` | `src/content/note/ja/spring-cloud-and-boot.md` | `content/blog/legacy/note/ja/spring-cloud-and-boot.md` | `generated-mirror` | D 分布式与微服务 | `active` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 139 | `testcontainers-docker-api` | `zh-cn` | `X-1184` | `src/content/note/zh-cn/testcontainers-docker-api.md` | `content/blog/legacy/note/zh-cn/testcontainers-docker-api.md` | `generated-mirror` | E 基础设施与运维 | `active` | `in-sync` | 适配器转换一致 | `keep` |
| 140 | `testcontainers-docker-api` | `en` | `X-1068` | `src/content/note/en/testcontainers-docker-api.md` | `content/blog/legacy/note/en/testcontainers-docker-api.md` | `generated-mirror` | E 基础设施与运维 | `active` | `drifted` | 元数据(draft:True->False) | `keep` |
| 141 | `testcontainers-docker-api` | `ja` | `X-1126` | `src/content/note/ja/testcontainers-docker-api.md` | `content/blog/legacy/note/ja/testcontainers-docker-api.md` | `generated-mirror` | E 基础设施与运维 | `active` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 142 | `uisa-architecture-design` | `zh-cn` | `X-1185` | `src/content/note/zh-cn/uisa-architecture-design.md` | `content/blog/legacy/note/zh-cn/uisa-architecture-design.md` | `generated-mirror` | F 工程与架构 | `provisional` | `in-sync` | 适配器转换一致 | `keep` |
| 143 | `uisa-architecture-design` | `en` | `X-1069` | `src/content/note/en/uisa-architecture-design.md` | `content/blog/legacy/note/en/uisa-architecture-design.md` | `generated-mirror` | F 工程与架构 | `provisional` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 144 | `uisa-architecture-design` | `ja` | `X-1127` | `src/content/note/ja/uisa-architecture-design.md` | `content/blog/legacy/note/ja/uisa-architecture-design.md` | `generated-mirror` | F 工程与架构 | `provisional` | `drifted` | 正文修订+元数据(draft:True->False) | `keep` |
| 145 | `ulticode` | `zh-cn` | `X-1195` | `src/content/note/zh-cn/ulticode.md` | `content/blog/legacy/note/zh-cn/ulticode.md` | `generated-mirror` | F 工程与架构 | `provisional` | `in-sync` | 适配器转换一致 | `keep` |
| 146 | `ulticode` | `en` | `X-1079` | `src/content/note/en/ulticode.md` | `content/blog/legacy/note/en/ulticode.md` | `generated-mirror` | F 工程与架构 | `provisional` | `drifted` | 正文修订+元数据(sources,related) | `keep` |
| 147 | `ulticode` | `ja` | `X-1137` | `src/content/note/ja/ulticode.md` | `content/blog/legacy/note/ja/ulticode.md` | `generated-mirror` | F 工程与架构 | `provisional` | `drifted` | 正文修订+元数据(sources,related) | `keep` |
| 148 | `ulticode-async-execution-contract` | `zh-cn` | `X-1186` | `src/content/note/zh-cn/ulticode-async-execution-contract.md` | `content/blog/legacy/note/zh-cn/ulticode-async-execution-contract.md` | `generated-mirror` | F 工程与架构 | `provisional` | `in-sync` | 适配器转换一致 | `keep` |
| 149 | `ulticode-async-execution-contract` | `en` | `X-1070` | `src/content/note/en/ulticode-async-execution-contract.md` | `content/blog/legacy/note/en/ulticode-async-execution-contract.md` | `generated-mirror` | F 工程与架构 | `provisional` | `in-sync` | 适配器转换一致 | `keep` |
| 150 | `ulticode-async-execution-contract` | `ja` | `X-1128` | `src/content/note/ja/ulticode-async-execution-contract.md` | `content/blog/legacy/note/ja/ulticode-async-execution-contract.md` | `generated-mirror` | F 工程与架构 | `provisional` | `drifted` | 正文修订 | `keep` |
| 151 | `ulticode-ci-supply-chain` | `zh-cn` | `X-1187` | `src/content/note/zh-cn/ulticode-ci-supply-chain.md` | `content/blog/legacy/note/zh-cn/ulticode-ci-supply-chain.md` | `generated-mirror` | F 工程与架构 | `provisional` | `in-sync` | 适配器转换一致 | `keep` |
| 152 | `ulticode-ci-supply-chain` | `en` | `X-1071` | `src/content/note/en/ulticode-ci-supply-chain.md` | `content/blog/legacy/note/en/ulticode-ci-supply-chain.md` | `generated-mirror` | F 工程与架构 | `provisional` | `in-sync` | 适配器转换一致 | `keep` |
| 153 | `ulticode-ci-supply-chain` | `ja` | `X-1129` | `src/content/note/ja/ulticode-ci-supply-chain.md` | `content/blog/legacy/note/ja/ulticode-ci-supply-chain.md` | `generated-mirror` | F 工程与架构 | `provisional` | `drifted` | 正文修订 | `keep` |
| 154 | `ulticode-core-bounded-testbed` | `zh-cn` | `X-1188` | `src/content/note/zh-cn/ulticode-core-bounded-testbed.md` | `content/blog/legacy/note/zh-cn/ulticode-core-bounded-testbed.md` | `generated-mirror` | F 工程与架构 | `provisional` | `in-sync` | 适配器转换一致 | `keep` |
| 155 | `ulticode-core-bounded-testbed` | `en` | `X-1072` | `src/content/note/en/ulticode-core-bounded-testbed.md` | `content/blog/legacy/note/en/ulticode-core-bounded-testbed.md` | `generated-mirror` | F 工程与架构 | `provisional` | `drifted` | 正文修订 | `keep` |
| 156 | `ulticode-core-bounded-testbed` | `ja` | `X-1130` | `src/content/note/ja/ulticode-core-bounded-testbed.md` | `content/blog/legacy/note/ja/ulticode-core-bounded-testbed.md` | `generated-mirror` | F 工程与架构 | `provisional` | `drifted` | 正文修订 | `keep` |
| 157 | `ulticode-docker-sandbox` | `zh-cn` | `X-1189` | `src/content/note/zh-cn/ulticode-docker-sandbox.md` | `content/blog/legacy/note/zh-cn/ulticode-docker-sandbox.md` | `generated-mirror` | F 工程与架构 | `provisional` | `in-sync` | 适配器转换一致 | `keep` |
| 158 | `ulticode-docker-sandbox` | `en` | `X-1073` | `src/content/note/en/ulticode-docker-sandbox.md` | `content/blog/legacy/note/en/ulticode-docker-sandbox.md` | `generated-mirror` | F 工程与架构 | `provisional` | `in-sync` | 适配器转换一致 | `keep` |
| 159 | `ulticode-docker-sandbox` | `ja` | `X-1131` | `src/content/note/ja/ulticode-docker-sandbox.md` | `content/blog/legacy/note/ja/ulticode-docker-sandbox.md` | `generated-mirror` | F 工程与架构 | `provisional` | `drifted` | 正文修订 | `keep` |
| 160 | `ulticode-fenced-singleton-lease` | `zh-cn` | `X-1190` | `src/content/note/zh-cn/ulticode-fenced-singleton-lease.md` | `content/blog/legacy/note/zh-cn/ulticode-fenced-singleton-lease.md` | `generated-mirror` | F 工程与架构 | `provisional` | `drifted` | 正文修订 | `merge` |
| 161 | `ulticode-fenced-singleton-lease` | `en` | `X-1074` | `src/content/note/en/ulticode-fenced-singleton-lease.md` | `content/blog/legacy/note/en/ulticode-fenced-singleton-lease.md` | `generated-mirror` | F 工程与架构 | `provisional` | `in-sync` | 适配器转换一致 | `keep` |
| 162 | `ulticode-fenced-singleton-lease` | `ja` | `X-1132` | `src/content/note/ja/ulticode-fenced-singleton-lease.md` | `content/blog/legacy/note/ja/ulticode-fenced-singleton-lease.md` | `generated-mirror` | F 工程与架构 | `provisional` | `drifted` | 正文修订 | `keep` |
| 163 | `ulticode-generation-attempt-fence` | `zh-cn` | `X-1191` | `src/content/note/zh-cn/ulticode-generation-attempt-fence.md` | `content/blog/legacy/note/zh-cn/ulticode-generation-attempt-fence.md` | `generated-mirror` | F 工程与架构 | `provisional` | `in-sync` | 适配器转换一致 | `keep` |
| 164 | `ulticode-generation-attempt-fence` | `en` | `X-1075` | `src/content/note/en/ulticode-generation-attempt-fence.md` | `content/blog/legacy/note/en/ulticode-generation-attempt-fence.md` | `generated-mirror` | F 工程与架构 | `provisional` | `in-sync` | 适配器转换一致 | `keep` |
| 165 | `ulticode-generation-attempt-fence` | `ja` | `X-1133` | `src/content/note/ja/ulticode-generation-attempt-fence.md` | `content/blog/legacy/note/ja/ulticode-generation-attempt-fence.md` | `generated-mirror` | F 工程与架构 | `provisional` | `drifted` | 正文修订 | `keep` |
| 166 | `ulticode-outbox-redis-streams` | `zh-cn` | `X-1192` | `src/content/note/zh-cn/ulticode-outbox-redis-streams.md` | `content/blog/legacy/note/zh-cn/ulticode-outbox-redis-streams.md` | `generated-mirror` | F 工程与架构 | `provisional` | `in-sync` | 适配器转换一致 | `keep` |
| 167 | `ulticode-outbox-redis-streams` | `en` | `X-1076` | `src/content/note/en/ulticode-outbox-redis-streams.md` | `content/blog/legacy/note/en/ulticode-outbox-redis-streams.md` | `generated-mirror` | F 工程与架构 | `provisional` | `in-sync` | 适配器转换一致 | `keep` |
| 168 | `ulticode-outbox-redis-streams` | `ja` | `X-1134` | `src/content/note/ja/ulticode-outbox-redis-streams.md` | `content/blog/legacy/note/ja/ulticode-outbox-redis-streams.md` | `generated-mirror` | F 工程与架构 | `provisional` | `drifted` | 正文修订 | `keep` |
| 169 | `ulticode-owner-and-facts` | `zh-cn` | `X-1193` | `src/content/note/zh-cn/ulticode-owner-and-facts.md` | `content/blog/legacy/note/zh-cn/ulticode-owner-and-facts.md` | `generated-mirror` | F 工程与架构 | `provisional` | `in-sync` | 适配器转换一致 | `keep` |
| 170 | `ulticode-owner-and-facts` | `en` | `X-1077` | `src/content/note/en/ulticode-owner-and-facts.md` | `content/blog/legacy/note/en/ulticode-owner-and-facts.md` | `generated-mirror` | F 工程与架构 | `provisional` | `drifted` | 正文修订 | `keep` |
| 171 | `ulticode-owner-and-facts` | `ja` | `X-1135` | `src/content/note/ja/ulticode-owner-and-facts.md` | `content/blog/legacy/note/ja/ulticode-owner-and-facts.md` | `generated-mirror` | F 工程与架构 | `provisional` | `drifted` | 正文修订 | `keep` |
| 172 | `ulticode-owner-local-audit-inbox` | `zh-cn` | `X-1194` | `src/content/note/zh-cn/ulticode-owner-local-audit-inbox.md` | `content/blog/legacy/note/zh-cn/ulticode-owner-local-audit-inbox.md` | `generated-mirror` | F 工程与架构 | `provisional` | `in-sync` | 适配器转换一致 | `keep` |
| 173 | `ulticode-owner-local-audit-inbox` | `en` | `X-1078` | `src/content/note/en/ulticode-owner-local-audit-inbox.md` | `content/blog/legacy/note/en/ulticode-owner-local-audit-inbox.md` | `generated-mirror` | F 工程与架构 | `provisional` | `drifted` | 正文修订 | `keep` |
| 174 | `ulticode-owner-local-audit-inbox` | `ja` | `X-1136` | `src/content/note/ja/ulticode-owner-local-audit-inbox.md` | `content/blog/legacy/note/ja/ulticode-owner-local-audit-inbox.md` | `generated-mirror` | F 工程与架构 | `provisional` | `drifted` | 正文修订 | `keep` |

### 4.2 非 Note 镜像映射表（information / jotting / preface，共 27 行）

| # | 板块 | slug | 语言 | archiveId | 原路径 | 镜像路径 | KB 层 | 六域 | 文档类型 | 生命周期 | mirror 状态 | 差异说明 | 裁决 |
|---:|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `jotting` | `kb-ingest-todo` | `zh-cn` | `X-1021` | `src/content/jotting/zh-cn/kb-ingest-todo.md` | `content/blog/legacy/jotting/zh-cn/kb-ingest-todo.md` | `inbox` | A 知识库与 AI 工程 | `index` | `provisional` | `in-sync` | 适配器转换一致 | `keep` |
| 2 | `jotting` | `kb-ingest-todo` | `en` | `X-1019` | `src/content/jotting/en/kb-ingest-todo.md` | `content/blog/legacy/jotting/en/kb-ingest-todo.md` | `generated-mirror` | A 知识库与 AI 工程 | `index` | `provisional` | `drifted` | 正文修订 | `merge` |
| 3 | `jotting` | `kb-ingest-todo` | `ja` | `X-1020` | `src/content/jotting/ja/kb-ingest-todo.md` | `content/blog/legacy/jotting/ja/kb-ingest-todo.md` | `generated-mirror` | A 知识库与 AI 工程 | `index` | `provisional` | `drifted` | 正文修订 | `merge` |
| 4 | `information` | `chronicle` | `zh-cn` | `X-1013` | `src/content/information/zh-cn/chronicle.yaml` | `content/blog/legacy/information/zh-cn/chronicle.md` | `protected-identity` | M 站点与内容运营 | `reference` | `active` | `in-sync` | 适配器转换一致 | `protect` |
| 5 | `information` | `chronicle` | `en` | `X-1001` | `src/content/information/en/chronicle.yaml` | `content/blog/legacy/information/en/chronicle.md` | `generated-mirror` | M 站点与内容运营 | `reference` | `active` | `drifted` | 正文修订 | `protect` |
| 6 | `information` | `chronicle` | `ja` | `X-1007` | `src/content/information/ja/chronicle.yaml` | `content/blog/legacy/information/ja/chronicle.md` | `generated-mirror` | M 站点与内容运营 | `reference` | `active` | `drifted` | 正文修订 | `protect` |
| 7 | `information` | `introduction` | `zh-cn` | `X-1014` | （无；2026-11-25 从 `src/content` 删除） | `content/blog/legacy/information/zh-cn/introduction.md` | `protected-identity` | M 站点与内容运营 | `README` | `active` | `extra` | 仅镜像/About存在；src/content 无此文件(2026-11-25 脱敏重建) | `protect` |
| 8 | `information` | `introduction` | `en` | `X-1002` | （无；2026-11-25 从 `src/content` 删除） | `content/blog/legacy/information/en/introduction.md` | `protected-identity` | M 站点与内容运营 | `README` | `active` | `extra` | 仅镜像/About存在；src/content 无此文件(2026-11-25 脱敏重建) | `protect` |
| 9 | `information` | `introduction` | `ja` | `X-1008` | （无；2026-11-25 从 `src/content` 删除） | `content/blog/legacy/information/ja/introduction.md` | `protected-identity` | M 站点与内容运营 | `README` | `active` | `extra` | 仅镜像/About存在；src/content 无此文件(2026-11-25 脱敏重建) | `protect` |
| 10 | `information` | `kb-index` | `zh-cn` | `X-1015` | `src/content/information/zh-cn/kb-index.md` | `content/blog/legacy/information/zh-cn/kb-index.md` | `navigation` | A 知识库与 AI 工程 | `index` | `active` | `drifted` | 正文修订 | `merge` |
| 11 | `information` | `kb-index` | `en` | `X-1003` | `src/content/information/en/kb-index.md` | `content/blog/legacy/information/en/kb-index.md` | `generated-mirror` | A 知识库与 AI 工程 | `index` | `active` | `drifted` | 正文修订 | `merge` |
| 12 | `information` | `kb-index` | `ja` | `X-1009` | `src/content/information/ja/kb-index.md` | `content/blog/legacy/information/ja/kb-index.md` | `generated-mirror` | A 知识库与 AI 工程 | `index` | `active` | `drifted` | 正文修订 | `merge` |
| 13 | `information` | `kb-log` | `zh-cn` | `X-1016` | `src/content/information/zh-cn/kb-log.md` | `content/blog/legacy/information/zh-cn/kb-log.md` | `navigation` | A 知识库与 AI 工程 | `log` | `active` | `in-sync` | 适配器转换一致 | `keep` |
| 14 | `information` | `kb-log` | `en` | `X-1004` | `src/content/information/en/kb-log.md` | `content/blog/legacy/information/en/kb-log.md` | `generated-mirror` | A 知识库与 AI 工程 | `log` | `active` | `drifted` | 正文修订 | `merge` |
| 15 | `information` | `kb-log` | `ja` | `X-1010` | `src/content/information/ja/kb-log.md` | `content/blog/legacy/information/ja/kb-log.md` | `generated-mirror` | A 知识库与 AI 工程 | `log` | `active` | `drifted` | 正文修订 | `merge` |
| 16 | `information` | `linkroll` | `zh-cn` | `X-1017` | `src/content/information/zh-cn/linkroll.mdx` | `content/blog/legacy/information/zh-cn/linkroll.md` | `protected-identity` | M 站点与内容运营 | `reference` | `active` | `in-sync` | 适配器转换一致 | `protect` |
| 17 | `information` | `linkroll` | `en` | `X-1005` | `src/content/information/en/linkroll.mdx` | `content/blog/legacy/information/en/linkroll.md` | `generated-mirror` | M 站点与内容运营 | `reference` | `active` | `in-sync` | 适配器转换一致 | `protect` |
| 18 | `information` | `linkroll` | `ja` | `X-1011` | `src/content/information/ja/linkroll.mdx` | `content/blog/legacy/information/ja/linkroll.md` | `generated-mirror` | M 站点与内容运营 | `reference` | `active` | `in-sync` | 适配器转换一致 | `protect` |
| 19 | `information` | `policy` | `zh-cn` | `X-1018` | `src/content/information/zh-cn/policy.md` | `content/blog/legacy/information/zh-cn/policy.md` | `protected-identity` | M 站点与内容运营 | `reference` | `active` | `in-sync` | 适配器转换一致 | `protect` |
| 20 | `information` | `policy` | `en` | `X-1006` | `src/content/information/en/policy.md` | `content/blog/legacy/information/en/policy.md` | `generated-mirror` | M 站点与内容运营 | `reference` | `active` | `in-sync` | 适配器转换一致 | `protect` |
| 21 | `information` | `policy` | `ja` | `X-1012` | `src/content/information/ja/policy.md` | `content/blog/legacy/information/ja/policy.md` | `generated-mirror` | M 站点与内容运营 | `reference` | `active` | `drifted` | 正文修订 | `protect` |
| 22 | `preface` | `2026-01-01-00-00-00` | `zh-cn` | `X-1200` | `src/content/preface/zh-cn/2026-01-01-00-00-00.md` | `content/blog/legacy/preface/zh-cn/2026-01-01-00-00-00.md` | `generated-mirror` | M 站点与内容运营 | `reference` | `historical` | `in-sync` | 适配器转换一致 | `keep` |
| 23 | `preface` | `2026-01-01-00-00-00` | `en` | `X-1196` | `src/content/preface/en/2026-01-01-00-00-00.md` | `content/blog/legacy/preface/en/2026-01-01-00-00-00.md` | `generated-mirror` | M 站点与内容运营 | `reference` | `historical` | `in-sync` | 适配器转换一致 | `keep` |
| 24 | `preface` | `2026-01-01-00-00-00` | `ja` | `X-1198` | `src/content/preface/ja/2026-01-01-00-00-00.md` | `content/blog/legacy/preface/ja/2026-01-01-00-00-00.md` | `generated-mirror` | M 站点与内容运营 | `reference` | `historical` | `in-sync` | 适配器转换一致 | `keep` |
| 25 | `preface` | `2026-06-19-18-00-00` | `zh-cn` | `X-1201` | `src/content/preface/zh-cn/2026-06-19-18-00-00.md` | `content/blog/legacy/preface/zh-cn/2026-06-19-18-00-00.md` | `generated-mirror` | M 站点与内容运营 | `reference` | `historical` | `in-sync` | 适配器转换一致 | `keep` |
| 26 | `preface` | `2026-06-19-18-00-00` | `en` | `X-1197` | `src/content/preface/en/2026-06-19-18-00-00.md` | `content/blog/legacy/preface/en/2026-06-19-18-00-00.md` | `generated-mirror` | M 站点与内容运营 | `reference` | `historical` | `in-sync` | 适配器转换一致 | `keep` |
| 27 | `preface` | `2026-06-19-18-00-00` | `ja` | `X-1199` | `src/content/preface/ja/2026-06-19-18-00-00.md` | `content/blog/legacy/preface/ja/2026-06-19-18-00-00.md` | `generated-mirror` | M 站点与内容运营 | `reference` | `historical` | `in-sync` | 适配器转换一致 | `keep` |

---

## 5. 抽样正文比对（22 份高风险镜像页 vs `src/content/` 核验）

| # | 镜像路径 | 对照对象 | 比对方式 | 实测关键发现 |
|---:|---|---|---|---|
| 1 | `content/blog/legacy/information/zh-cn/introduction.md` (`X-1014`) | `src/content/information/zh-cn/introduction.md`（已删） | 全文实读 | `revision: "scrubbed-2026-11-25"`，新增 `profile`（供 About 集合加载），移除联系方式；`src/content/` 无对应文件（`extra`） |
| 2 | `content/blog/legacy/information/en/introduction.md` (`X-1002`) | `src/content/information/en/introduction.md`（已删） | 全文实读 | 同上，英文技术档案 + GitHub PR 贡献（`extra`） |
| 3 | `content/blog/legacy/information/ja/introduction.md` (`X-1008`) | `src/content/information/ja/introduction.md`（已删） | 全文实读 | 同上，日文技术档案（`extra`） |
| 4 | `content/blog/legacy/information/zh-cn/kb-index.md` (`X-1015`) | `src/content/information/zh-cn/kb-index.md` | 全文实读 + diff | 镜像已修正 `879...→15721` 笔误为 `8787→15721`、末尾 `11 个`→`12 个 provisional`，并将 Fuwari 链接指向 `migration/fuwari/07cee2b...`；`src/content/` 仍保留旧文本（`drifted`） |
| 5 | `content/blog/legacy/information/en/kb-index.md` (`X-1003`) | `src/content/information/en/kb-index.md` | 全文/前 120 行对照 | `src/content` 仅 32 行精简导览（只列 2 篇已译文）；镜像扩展为 241 行完整 6 域目录 + 12 项毕业观察板 + 53 条 raw（`drifted`） |
| 6 | `content/blog/legacy/information/ja/kb-index.md` (`X-1009`) | `src/content/information/ja/kb-index.md` | 前 120 行对照 | 与英文同，镜像已扩写为 241 行完整日文 6 域目录，与 `src/content` 精简版严重偏离（`drifted`） |
| 7 | `content/blog/legacy/information/zh-cn/kb-log.md` (`X-1016`) | `src/content/information/zh-cn/kb-log.md` | 前 100 行 + 全文 diff | 剥离适配器 `/blog/legacy/` 链接重写后，正文与 `src/content` 一致（`in-sync`） |
| 8 | `content/blog/legacy/information/en/kb-log.md` (`X-1004`) | `src/content/information/en/kb-log.md` | 前 100 行对照 | `src/content` 仅 35 行（至 2026-08-12）；镜像扩译至 199 行（补齐 08-13 至 09-09 全量操作日志）（`drifted`） |
| 9 | `content/blog/legacy/information/ja/kb-log.md` (`X-1010`) | `src/content/information/ja/kb-log.md` | 前 100 行对照 | `src/content` 仅 35 行（至 2026-08-12）；镜像扩译至 199 行（`drifted`） |
| 10 | `content/blog/legacy/jotting/en/kb-ingest-todo.md` (`X-1019`) | `src/content/jotting/en/kb-ingest-todo.md` | 全文对照 | 镜像更新了 2026-08-21 聚合摄入与 ResiCache/UltiCode 收敛状态，修正 `terminal` 译法（`drifted`） |
| 11 | `content/blog/legacy/jotting/zh-cn/kb-ingest-todo.md` (`X-1021`) | `src/content/jotting/zh-cn/kb-ingest-todo.md` | 全文 diff | 剥离 `/kb`→`/blog/legacy/information/zh-cn/kb-index/` 等链接映射后，正文完全一致（`in-sync`） |
| 12 | `content/blog/legacy/note/en/resicache.md` (`X-1065`) | `src/content/note/en/resicache.md` | 前 100 行对照 | **重大演进差异**：`src/content` 为 v0.0.2（68 行，`status: active`，2 个 sources）；镜像已重译为 `main@2954fff`（359 行，`status: provisional`，3 个 sources）（`drifted`） |
| 13 | `content/blog/legacy/note/ja/resicache.md` (`X-1123`) | `src/content/note/ja/resicache.md` | 前 100 行对照 | 同上，镜像 359 行（`provisional`，3 sources）vs `src/content` 68 行（`active`，2 sources）（`drifted`） |
| 14 | `content/blog/legacy/note/en/ulticode.md` (`X-1079`) | `src/content/note/en/ulticode.md` | 前 100 行对照 | **重大演进差异**：`src/content` 基于旧提交 `3f14ac89`（70 行，1 source，5 related）；镜像已重译为 `f801a1076`（358 行，3 sources，14 related）（`drifted`） |
| 15 | `content/blog/legacy/note/ja/ulticode.md` (`X-1137`) | `src/content/note/ja/ulticode.md` | 前 100 行对照 | 同上，镜像 358 行 vs `src/content` 70 行（`drifted`） |
| 16 | `content/blog/legacy/note/en/omp-headroom-persistence.md` (`X-1052`) | `src/content/note/en/omp-headroom-persistence.md` | 全文对照 | `src/content` 为 `draft: true`、无毕业条件、3 sources；镜像已启用 `draft: false`、补齐 3 条毕业条件、5 sources、7 related（`drifted`） |
| 17 | `content/blog/legacy/note/en/headroom-cc-switch-coexistence.md` (`X-1029`) | `src/content/note/en/headroom-cc-switch-coexistence.md` | 全文对照 | `src/content` 为 `draft: true`、无毕业条件；镜像已设为 `draft: false` 并补齐 3 条英文毕业条件（`drifted`） |
| 18 | `content/blog/legacy/note/en/hindsight-local-deployment.md` (`X-1032`) | `src/content/note/en/hindsight-local-deployment.md` | diff 对照 | 镜像修复 Mermaid 图中 CPU Embedding 误标 `and reranking` 的错误，重写 Scope 声明，改为 `draft: false`（`drifted`） |
| 19 | `content/blog/legacy/note/zh-cn/kb-session-ingest-contract.md` (`X-1160`) | `src/content/note/zh-cn/kb-session-ingest-contract.md` | diff 对照 | 镜像修复了脱敏正方表的 Markdown 分隔线与主机正则竖线 `\|` 转义；`src/content` 仍为坏表（`drifted`） |
| 20 | `content/blog/legacy/note/zh-cn/hindsight-omp-codex-integration.md` (`X-1150`) | `src/content/note/zh-cn/hindsight-omp-codex-integration.md` | diff 对照 | 镜像将一处无语言围栏 ` ``` ` 补全为 ` ```text `（`drifted`） |
| 21 | `content/blog/legacy/note/zh-cn/ulticode-fenced-singleton-lease.md` (`X-1190`) | `src/content/note/zh-cn/ulticode-fenced-singleton-lease.md` | 逐字符 diff | 镜像修复了 `OwnerReconcilerTest` 截断的 GitHub blob URL（补全至 `OwnerReconcilerTest.java`）；`src/content` 仍为断链（`drifted`） |
| 22 | `content/blog/legacy/information/ja/policy.md` (`X-1012`) | `src/content/information/ja/policy.md` | 逐行 diff | 镜像将日文不自然的「権利を保留します」改为规范法律用语「権利を留保します」（`drifted`） |

---

## 6. 不可变来源与归档衍生层分组登记（`migration/` 与 `public/archives/`）

### 6.1 为什么无需逐份分类？
1. **`migration/source/**`（307 份）** 是历史 git 提交 `f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64` 的**逐字节只读取证快照**（由 `scripts/import-legacy.mjs` 生成，受 `migration/README.md` 与 `AGENTS.md` 不可变约束保护）。对其做单份改写或迁移裁决不仅无意义，还会破坏溯源证据链。
2. **`migration/fuwari/**`（150 份）** 是上游旧博客 `DavidHLP/Fuwari`（`07cee2baf9cee227807dcd68004c5f2493e5ac52`）的**脱敏公共归档**，受 `manifest.json` 与 `redaction-report.json` 哈希校验，供 `ingest-*` raw 来源提供持久可达引用，不参与当前博客页面构建。
3. **`public/archives/RHINE-LAB-X-*.txt`（201 份）** 是由构建脚本 [scripts/export-records.mjs](../../scripts/export-records.mjs) 从 `content/blog/legacy/**` **全自动生成的 TXT 下载产物**（`predev` / `prebuild` 每次都会覆盖并清理孤儿文件），只需登记其 `archiveId` 一一对应关系。

### 6.2 `migration/` 与 `public/archives/` 分组规则表（共 658 份）

| 分组目录 | 文件数 | 组内构成明细 | KB 层 | 六域 | 生命周期 | 裁决 | 与当前仓库对应关系 |
|---|---:|---|---|---|---|---|---|
| `migration/source/src/content/note/` | 174 | `en` 58 + `ja` 58 + `zh-cn` 58（`.md`） | `archival-source` | G 归档废弃 | `immutable` | `register-only` | 对应 `src/content/note/`（100% 字节一致）及 `content/blog/legacy/note/` 导出前身 |
| `migration/source/src/content/raw/` | 54 | `zh-cn/*.md` 53 + `.manifest.sha256` 1 | `archival-source` | G 归档废弃 | `immutable` | `register-only` | 对应 `src/content/raw/` 不可变证据快照 |
| `migration/source/src/content/information/` | 15 | 三语 × 5（`chronicle.yaml`, `kb-index.md`, `kb-log.md`, `linkroll.mdx`, `policy.md`；不含已删 `introduction.md`） | `archival-source` | G 归档废弃 | `immutable` | `register-only` | 对应 `src/content/information/`（100% 字节一致） |
| `migration/source/src/content/preface/` | 6 | 三语 × 2（`2026-01-01-00-00-00.md`, `2026-06-19-18-00-00.md`） | `archival-source` | G 归档废弃 | `immutable` | `register-only` | 对应 `src/content/preface/`（100% 字节一致） |
| `migration/source/src/content/jotting/` | 3 | 三语 × 1（`kb-ingest-todo.md`） | `archival-source` | G 归档废弃 | `immutable` | `register-only` | 对应 `src/content/jotting/`（100% 字节一致） |
| `migration/source/docs/` | 22 | 根 docs 12 + `adr/` 6 + `CODEMAPS/` 4 | `archival-source` | G 归档废弃 | `immutable` | `register-only` | `f49953fb` 时刻的旧 `docs/` 快照（无后续 `ABOUT*`/`I18N*`/`BUSINESS*`/`agents/`） |
| `migration/source/(root)` | 11 | `AGENTS.md`, `CLAUDE.md`, `CONTEXT.md`, `KB.md`, `CONTRIBUTING.md`, `README*.md`(3), `CHANGELOG.md`, `arthas.md`, `LICENSE` | `archival-source` | G 归档废弃 | `immutable` | `register-only` | 揭示 `CONTEXT.md`→`GLOSSARY.md` 改名、旧 `CLAUDE.md` 并入 `AGENTS.md` 的历史原点 |
| `migration/source/.claude/` | 9 | `rules/skill-autoload.md` 1 + `skills/*.md` 8 | `archival-source` | G 归档废弃 | `immutable` | `register-only` | 与现行 `.claude/` 相同 |
| `migration/source/public/` | 11 | `assets/` 1 + `audio/` 1 + `fonts/` 7 + `licenses/` 2 | `archival-source` | G 归档废弃 | `immutable` | `register-only` | 许可与来源文本历史快照 |
| `migration/source/.github/` & `.reports/` | 2 | `.github/pull_request_template.md` 1 + `.reports/codemap-diff.txt` 1 | `archival-source` | G 归档废弃 | `immutable` | `register-only` | 迁移前 PR 模板与 codemap 差异报告快照 |
| **小计 (`migration/source/`)** | **307** | **295 份 md/mdx/yaml + 12 份 txt/pdf/LICENSE/sha256** | — | — | — | — | 受 `migration/manifest.json` 登记保护 |
| `migration/fuwari/.../src/content/posts/` | 61 | Fuwari 脱敏博文（JUC/Redis/MySQL/HBase/Spark/Spring/Docker/前端等） | `archival-source` | G 归档废弃 | `immutable` | `register-only` | 被 `src/content/raw/zh-cn/ingest-*.md` 聚合引用（`kb-index.md` 已改链至此） |
| `migration/fuwari/.../src/content/assets/` | 85 | 博文配图资源（排除 8 张内网截图） | `archival-source` | G 归档废弃 | `immutable` | `register-only` | 对应上述 61 篇 Fuwari 博文内嵌图片 |
| `migration/fuwari/.../(meta)` | 4 | `LICENSE`, `README.md`, `manifest.json`, `redaction-report.json` | `archival-source` | G 归档废弃 | `immutable` | `register-only` | 脱敏审计、哈希清单与 MIT 许可 |
| **小计 (`migration/fuwari/`)** | **150** | — | — | — | — | — | 见 `migration/fuwari/.../README.md` |
| `public/archives/RHINE-LAB-X-1001..1201.txt` | 201 | `RHINE-LAB-X-1001.txt` .. `RHINE-LAB-X-1201.txt`（共 201 份） | `generated-mirror` | M 站点与内容运营 | `active` | `register-only` | 与 `content/blog/legacy/**` 201 份文档的 `archiveId`（`X-1001`–`X-1201`）严格 **1:1 双射**，由 `npm run export:archives` 自动再生 |

### 6.3 其他配置与迁移文件逐文件表（`.github/`、`.serena/`、`migration/` 根、`content/` 根，共 20 份）

| 文件 | KB 层 | 六域 | 文档类型 | 生命周期 | 裁决 | 审计依据与说明 |
|---|---|---|---|---|---|---|
| `.github/workflows/astro.yml` | config | M 站点与内容运营 | config | active | keep | CI 主构建门禁：`npm ci` → `build:cloudflare` → `check:content` → `check:viewport` → `kb:lint` → `test:kb` → `check-about-browser.mjs` |
| `.github/workflows/deploy.yml` | config | M 站点与内容运营 | config | active | keep | GitHub Pages 部署流：`npm ci` → `build` → `check:content` → `check:viewport` → `kb:lint` → `test:kb` → deploy |
| `.github/ISSUE_TEMPLATE/bug_report.yaml` | config | M 站点与内容运营 | config | deprecated | merge | 含 `pnpx astro info` 与 `cloudflare` 分支选项，需改为 `npm`/当前分支 |
| `.github/ISSUE_TEMPLATE/config.yml` | config | M 站点与内容运营 | config | deprecated | merge | 外链仍指向 `thought-lite.ttio.workers.dev` 与 `tuyuritio/astro-theme-thought-lite/discussions` |
| `.github/ISSUE_TEMPLATE/documentation.yaml` | config | M 站点与内容运营 | config | provisional | merge | 示例路径仍为 `src/content/note/en/configuration.md` |
| `.github/ISSUE_TEMPLATE/feature_request.yaml` | config | M 站点与内容运营 | config | active | keep | 通用功能请求表单，无明显过期字段 |
| `.github/pull_request_template.md` | config | M 站点与内容运营 | config | deprecated | merge | 指向 `tuyuritio/astro-theme-thought-lite/blob/main/CONTRIBUTING.md` |
| `.github/release-please-config.json` | config | M 站点与内容运营 | config | deprecated | deprecate | ThoughtLite 上游 release-please 配置，当前仓库非 npm 包发布 |
| `.github/.release-please-manifest.json` | config | M 站点与内容运营 | config | deprecated | deprecate | 停留在 `0.36.3` 的上游版本号清单 |
| `.github/assets/preview-dark.webp` | project-maintenance | M 站点与内容运营 | evidence | historical | archive | 旧主题预览截图资产 |
| `.github/assets/preview-light.webp` | project-maintenance | M 站点与内容运营 | evidence | historical | archive | 旧主题预览截图资产 |
| `.serena/project.yml` | config | E 基础设施与运维 | config | provisional | merge | `language_servers: [svelte]` 与当前无 Svelte 技术栈不匹配（应为 `typescript`） |
| `.serena/project.local.yml` | config | E 基础设施与运维 | config | active | keep | 本地 Serena 覆盖模板 |
| `.serena/.gitignore` | config | E 基础设施与运维 | config | active | keep | 忽略 `/cache` 与 `/project.local.yml` |
| `migration/README.md` | project-maintenance | M 站点与内容运营 | README | active | keep | 明确定义模板迁移边界、`content/blog/legacy/` 可编辑面与不可变证据边界 |
| `migration/manifest.json` | archival-source | G 归档废弃 | index | immutable | register-only | 记录 `f49953fb` 迁移时 307 份文档、198 条目、旧路由映射与缺失资源审计 |
| `migration/publication-overrides.json` | config | M 站点与内容运营 | config | active | keep | 记录 2026-10-30 启用的 74+ 篇英日译文显式覆盖（`draft`/`status`/`sources`/`related`） |
| `content/README.md` | project-maintenance | M 站点与内容运营 | README | active | keep | 说明 `content/blog/*.md` 编辑规范与 `npm run export:archives` 流程 |
| `content/site.json` | config | M 站点与内容运营 | config | active | keep | 站点主配置（标题、五列分类、`about` glob 入口） |
| `content/locales.json` | config | M 站点与内容运营 | config | active | keep | 分类/科室/访问级别的三语用语表 |

---

## 7. 六项专项检测结果

### 7.1 `docs/README.md` 索引与实际文件一致性
- **实际存在**：33 份（见 3.1 表）。
- **已登记**：仅 9 份（`README.md`, `SCRIPTS.md`, `ENV.md`, `RUNBOOK.md`, `UPDATE_SUMMARY.md`, `CODEMAPS/{architecture,frontend,content,dependencies}.md`）。
- **漏登记（24 份）**：
  - 现行核心文档（9 份）：`ABOUT.md`, `ABOUT-ACCEPTANCE.md`, `CLOUDFLARE-DEPLOYMENT.md`, `I18N.md`, `I18N-SEMANTIC-AUDIT.md`, `PWA.md`, `kb-convergence-design.md`, `BUSINESS-AUDIT.md`, `BUSINESS-IMPLEMENTATION.md`
  - 历史视觉/迁移文档（6 份）：`rhine-migration.md`, `computation-design.md`, `layout-rollback.md`, `mono-color-design.md`, `sailing-print.md`, `sailing-print-no-text.md`
  - 子目录（9 份）：`adr/0001`–`0006`（6 份）、`agents/domain.md`, `agents/issue-tracker.md`, `agents/triage-labels.md`（3 份）
- **幽灵/断链引用**：
  - `docs/UPDATE_SUMMARY.md:13` 引用 `CODEMAPS/README.md`（不存在）。
  - `README.md:36` 引用 `docs/ABOUT-CONTENT-AUDIT.md`（不存在）。
  - `PR15-ATTRIBUTION.md:10` 引用 `scripts/check-pr15-port.mjs` 与 `scripts/check-pr15-rendering.mjs`（当前 `scripts/` 中不存在）。

### 7.2 过期或与代码冲突的文档清单
- **`docs/SCRIPTS.md`**：引用 `pnpm new`、`biome`、`pnpm lint`、`pnpm count`、`pnpm prepare`、`site-validation.yaml`；实际 `package.json` 使用 `npm`，脚本为 `build`、`build:cloudflare`、`check:content`、`check:viewport`、`export:archives`、`kb:lint`、`kb:ingest`、`test:kb`，格式化工具为 `prettier`（无 Biome）。
- **`docs/ENV.md`**：引用 `PUBLIC_TIMEZONE`、`site.config.ts`、`astro.config.ts` 的 `experimental.fonts`/Swup/Svelte、`tsconfig.json` `$config/$layouts/...` 别名；实际 `astro.config.ts` 无 Svelte/MDX/Swup/experimental.fonts，`tsconfig.json` 无 `$` 别名（主配置为 `content/site.json`）。
- **`docs/RUNBOOK.md`**：引用 `pnpm build/check/lint/outdated/update`、`feed.xml`（当前为 `/rss.xml`）、`src/content/{collection}`、`Svelte`。
- **`docs/CODEMAPS/{architecture,content,dependencies,frontend}.md`**：全部停留在 Astro 5 + Svelte 5 + Tailwind 4 + `src/pages/[...locale]/` + `src/graph/`，与当前 Astro 7.3.6 + Three.js（`src/scene.ts`, `src/main.ts`）+ `content/blog/legacy/` 完全冲突。
- **`docs/adr/0001`–`0006` & `GLOSSARY.md`**：记录 `src/utils/content*.ts`、`src/graph/*`、`i18nit`、`ContentCard`、`Heatmap.astro` 等已不存在于代码库的抽象。
- **`.claude/skills/*.md`（除 `knowledge-base.md` 外 7 份）**：全部围绕 ThoughtLite 编写，与当前 `content/site.json`、`src/content.config.ts`、`src/layouts/Terminal.astro`、`src/layouts/About.astro` 不兼容。
- **`README.zh-cn.md` & `README.ja.md` & `CONTRIBUTING.md`**：停留在 `pnpm` 与 ThoughtLite 说明。
- **`pnpm-workspace.yaml` & `.serena/project.yml` & `.github/ISSUE_TEMPLATE/{bug_report.yaml,config.yml}` & `.github/pull_request_template.md`**：均残留 `pnpm`/`svelte`/`thought-lite` 配置或 URL。

### 7.3 同一主题在多处重复维护
1. **站点开发与架构说明（4 处重复且互相冲突）**：`AGENTS.md`（前半 RhineLabUI-Astro vs 后半 ThoughtLite）↔ `.claude/rules/skill-autoload.md` + `.claude/skills/*` ↔ `docs/CODEMAPS/*` ↔ `README.md` vs `README.zh-cn.md` / `README.ja.md`。
2. **知识库维护宪法与操作规程（3 处重复）**：`KB.md` ↔ `.claude/skills/knowledge-base.md` ↔ `AGENTS.md`（第 34–42 行）↔ `docs/kb-convergence-design.md`（关于 `kb-index.md` 与 `provisional` 规则）。
3. **About 页面与个人档案说明（3 处散落）**：`docs/ABOUT.md` ↔ `docs/ABOUT-ACCEPTANCE.md` ↔ `README.md`（第 34–36 行）↔ `content/README.md`。
4. **部署与离线缓存边界（3 处重叠）**：`docs/CLOUDFLARE-DEPLOYMENT.md` ↔ `docs/PWA.md` ↔ `docs/RUNBOOK.md`（其中 `RUNBOOK.md` 已过期）。
5. **Agent 领域文档协议（2 处重叠）**：`AGENTS.md`（第 66–78 行）↔ `docs/agents/{domain,issue-tracker,triage-labels}.md`。

### 7.4 应迁入 Wiki（raw → note）的维护文档候选
| 候选文件 | 现状问题 | 建议处理 | 目标 slug |
|---|---|---|---|
| `arthas.md`（根目录，244 行） | 脱离 `raw` 证据链与 `kb-index.md` 孤悬于根目录；含泛化示例与主观比较表，且已存在同类主题页 `java-online-performance-debug` | 若保留经验内容，先作为 `user-provided-local-markdown` 快照或仅摘录已验证命令，经 `ingest` 归并补充至已有页面或独立为概念页 | 并入 `java-online-performance-debug`（或独立 `java-arthas-diagnostics`） |
| `docs/kb-convergence-design.md` | 实质是 KB 元设计（6 域 IA v2 + 深度分层 + 毕业门禁），当前被 `kb-index.md` 直接外部引用，同时归于 `docs/` 工程维护层 | 可继续作为 `schema` 配套设计留在 `docs/`，或提取其稳定模式要点在 `llm-wiki-pattern` 中综合引用，避免在两处同步改规则 | 保留 `docs/` 并链接，或要点融入 `llm-wiki-pattern` |

*(注：`docs/ABOUT.md`、`docs/CLOUDFLARE-DEPLOYMENT.md`、`docs/PWA.md`、`docs/I18N.md`、`docs/BUSINESS-AUDIT.md` 属于站点工程与内容运营事务，按 `KB.md` 不应混入个人技术知识库 Wiki。)*

### 7.5 生成镜像与正典漂移汇总
- **总计 201 份**：`in-sync` **75 份** | `drifted` **123 份** | `extra` **3 份** | `missing` **0 份**。
- **漂移根因三层叠加**：
  1. **架构切换后的定位反转**：`migration/README.md:5` 与 `scripts/kb-lint.ts:12` 已把 `content/blog/legacy/` 作为实际维护层与 lint 目标，而 `src/content/` 冻结于 `f49953fb`，但 `KB.md` 仍写 `src/content/`。
  2. **2026-10-30/31 英日译文全量启用与重译**（`migration/publication-overrides.json` + `docs/I18N.md` + `docs/I18N-SEMANTIC-AUDIT.md`）：52 篇 `en` note、58 篇 `ja` note、3 篇 `en` info、4 篇 `ja` info、2 篇 `en/ja` jotting 直接在 `content/blog/legacy/` 完成正文重译、补毕业条件、启用 `draft: false` 和更新 `sources`/`related`。
  3. **2026-11-25 简历脱敏重建与 `zh-cn` 微调**：`information/*/introduction.md` 从 `src/content/` 删除并在镜像层重建（3 `extra`）；`zh-cn` 的 `kb-index.md`、`kb-session-ingest-contract.md`、`hindsight-omp-codex-integration.md`、`ulticode-fenced-singleton-lease.md` 在镜像层修复了笔误/链接/表格，未回流 `src/content/`。

### 7.6 `AGENTS.md` / `KB.md` / `.claude/skills/*` 规则冲突清单

| 冲突项 | 规则 A | 规则 B（或代码现实） | 严重度 |
|---|---|---|---|
| **Wiki 与索引目录归属** | `KB.md:20-27`、`AGENTS.md:38-42`、`.claude/skills/knowledge-base.md:10-25`：正典在 `src/content/note/` 与 `src/content/information/{{locale}}/kb-index.md` | `scripts/kb-lint.ts:12-15`、`src/content.config.ts:11`、`migration/README.md:5`：校验、构建与编辑均针对 `content/blog/legacy/` | **P0** |
| **包管理器与检查命令** | `AGENTS.md:49`、`KB.md:81`、`README.zh-cn.md`、`docs/SCRIPTS.md`：使用 `pnpm`（`pnpm kb:lint`, `pnpm check`） | `AGENTS.md:11`、`package.json`、`.github/workflows/*.yml`：使用 `npm`（`npm run build`, `npm run kb:lint`, `npm run check:content`） | **P0** |
| **前端架构与配置入口** | `AGENTS.md:20-65`、`.claude/rules/skill-autoload.md`、7 个 `.claude/skills/*.md`：Astro + Svelte、`site.config.ts`、`src/pages/[...locale]/` | `AGENTS.md:5`、`content/site.json`、`astro.config.ts`、`src/pages/`：无 Svelte、配置在 `content/site.json`、路由为 `/blog/[...slug]` 与 `/about/` | **P0** |
| **多语言 wiki 翻译策略** | `KB.md:30` & `.claude/skills/knowledge-base.md:25`：不为了表面同步复制 `en`/`ja` wiki，需明确翻译任务 | `docs/I18N.md:5-19`、`src/content.config.ts`、`scripts/check-content.mjs`：强制全站 67 组（含全部 58 篇 note）三语完整发布与校验 | **P1** |
| **自我引用（`AGENTS.md` 内部矛盾）** | `AGENTS.md:5`：`content/blog/` 为可编辑文章，`AGENTS.md:42`：`content/blog/legacy/information/{{locale}}/introduction.md` 为保护面 | `AGENTS.md:39-41, 56-64`：同一文件紧接着写 `src/content/note/`、`site.config.ts`、`src/pages/[...locale]/` | **P0** |
| **保护面 `introduction.md` 路径** | `KB.md:10`：保护面在 `src/content/information/{{locale}}/introduction.md` | 该文件已从 `src/content/` 删除，当前仅存于 `content/blog/legacy/information/{{locale}}/introduction.md` | **P1** |

---

## 8. 按优先级排序的整改计划（仅建议，不执行）

| 优先级 | 整改项 | 影响文件（估算数） | 精确动作 | 验证方式 | 风险与回滚 |
|---|---|---|---|---|---|
| **P0-1** | **裁决并统一 KB 单一正典路径（消除双轨裂脑）** | `KB.md`, `AGENTS.md`, `.claude/skills/knowledge-base.md`, `docs/kb-convergence-design.md`, `migration/README.md`（约 **5 份**；若回流 `zh-cn` 4 份修补则另含 **4 份**） | 明确二选一并写入 `KB.md`：① 承认 `content/blog/legacy/` 为现行可编辑 Wiki/Index/Log 正典层，`src/content/{{note,jotting,information,preface}}` 正式降级为历史冻结快照（`archival-source`）；② 或将镜像 4 份 `zh-cn` 修复 + 118 份 `en/ja` 译文回流 `src/content/` 并改由导入脚本增量同步。同时更新 `KB.md` 中的 `introduction.md` 路径与多语言三语全发布约束。 | `npm run kb:lint && npm run check:content && npm run build` | 低风险；若误动 `src/content/raw/` 会触发 `kb:lint` 校验失败，可用 `git checkout` 回滚 |
| **P0-2** | **清理 `AGENTS.md` 与 `.claude/` 技能幽灵规则** | `AGENTS.md`, `.claude/rules/skill-autoload.md`, 8 份 `.claude/skills/*.md`（**10 份**） | 删除 `AGENTS.md` 第 14–65 行的旧 `CLAUDE.md` 粘贴内容，重写为 RhineLabUI-Astro 准确目录与 `npm` 命令；将 `skill-autoload.md` 改为仅强制加载 `knowledge-base.md`；将 7 份 ThoughtLite 技能归档至 `docs/archive/` 或标注 `DEPRECATED` 并按 `content/site.json` + `src/content.config.ts` + `docs/I18N.md` 重写或精简为 2-3 份现行技能。 | `grep -rn "site.config.ts" AGENTS.md .claude/` 为 0 命中；人工审阅无 `pnpm`/`Svelte`/`[...locale]` 残留 | 中风险（影响后续 Agent 会话）；建议独立 PR 复核后合并 |
| **P1-1** | **重建 `docs/README.md` 并处置 ThoughtLite 过期工程文档** | `docs/README.md`, `docs/SCRIPTS.md`, `docs/ENV.md`, `docs/RUNBOOK.md`, `docs/UPDATE_SUMMARY.md`, `docs/CODEMAPS/*`(4), `docs/adr/*`(6), `docs/rhine-migration.md`, 5 份视觉设计稿（**21 份**） | ① 重写 `docs/README.md` 覆盖全部 33 份文档并区分「现行活跃」与「历史归档」；② 将 6 份 ThoughtLite ADR、4 份 CODEMAPS、5 份视觉设计稿、`UPDATE_SUMMARY.md`、`rhine-migration.md` 移入 `docs/archive/` 或顶部加注 `Superseded by RhineLabUI-Astro`；③ 用当前 `package.json`、`content/site.json`、`.github/workflows/` 重写 `SCRIPTS.md`、`ENV.md`、`RUNBOOK.md`。 | 检查 `docs/README.md` 链接 100% 可解析；核对 `SCRIPTS.md` 命令与 `package.json` 一致 | 低风险；移动文件需同步更新跨文档相对链接 |
| **P1-2** | **同步多语言 README 与修复 `.github/` 模板及断链** | `README.md`, `README.zh-cn.md`, `README.ja.md`, `CONTRIBUTING.md`, `PR15-ATTRIBUTION.md`, `.github/ISSUE_TEMPLATE/{{bug_report.yaml,config.yml,documentation.yaml}}`, `.github/pull_request_template.md`, `.github/release-please-*`（**11 份**） | ① 按 `README.md` 同步重写 `README.zh-cn.md` 与 `README.ja.md`；② 修复 `README.md:36` 指向不存在 `docs/ABOUT-CONTENT-AUDIT.md` 的断链（改为 `docs/ABOUT-ACCEPTANCE.md`）；③ 更新 `CONTRIBUTING.md`、`.github/ISSUE_TEMPLATE/*` 与 `.github/pull_request_template.md` 去除 `tuyuritio/astro-theme-thought-lite` 和 `pnpm`/`cloudflare` 引用；④ 删除或归档 `.github/release-please-*`；⑤ 在 `PR15-ATTRIBUTION.md` 注明回归脚本已随迁移清理。 | 静态链接扫描确认零断链与零上游 `thought-lite` 误引 | 低风险 |
| **P2-1** | **处置孤立内容、遗留词汇表与工具链配置** | `arthas.md`, `GLOSSARY.md`, `pnpm-workspace.yaml`, `.serena/project.yml`, `docs/agents/domain.md`, `docs/ABOUT-ACCEPTANCE.md`（**6 份**） | ① 评估 `arthas.md`：经脱敏和证据化后作为 `raw` 摄入并合并至 `java-online-performance-debug`（或迁入 wiki），随后移除根目录裸文件；② 归档或重写 `GLOSSARY.md`；③ 删除或标注废弃 `pnpm-workspace.yaml`；④ 将 `.serena/project.yml` 的 `svelte` 改为 `typescript`；⑤ 在 `docs/ABOUT-ACCEPTANCE.md` 补充 `c4e49d1` 移除打印按钮的变更注记。 | `npm run check:content && npm run kb:lint && npm run build` | 低风险；删除根目录 `arthas.md` 前需确认用户意向 |

> **整改工作量汇总**：共 **5 个优先级任务组**，预估直接修改/处置文件 **约 53 份**（P0 15 份 + P1 32 份 + P2 6 份；不含 `content/blog/legacy/` 镜像自身，因 P0-1 确立单源策略即可批量明确 123 份漂移归属；`migration/` 457 份与 `public/archives/` 201 份保持只读登记不动）。
