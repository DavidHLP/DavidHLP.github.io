# 维护文档终审裁决

> 裁决日期：2026-11-27 | 基线：`c4e49d1` + 当前工作树 | 范围：`docs/`、根目录文档、`.claude/`、`.github/`、`.serena/`
> 依据：[DOCUMENT-CLASSIFICATION.md](../DOCUMENT-CLASSIFICATION.md)、[maintenance-audit.md](maintenance-audit.md)、逐文件实读与代码现状核验
> 约束：本文件只记录裁决。本轮未修改、移动或删除任何既有文件；未执行 Git 操作。

## 0. 口径与前置事实

- “引用数”指当前工作树中仍会解析到该文件的活引用数，排除本文件、`docs/classification/` 的两份审计附录以及 `migration/source/` 的不可变快照。分类登记表本身另行同步。
- `docs/README.md`、`AGENTS.md`、`KB.md`、`.claude/rules/skill-autoload.md`、`docs/UPDATE_SUMMARY.md`、`README.md` 在当前工作树中已被修正。本裁决以修正后的内容为准，不把审计附录中的过时表述当作现状。
- 已经核实的两处“断链”在当前工作树中已不存在：`README.md` 不再引用 `docs/ABOUT-CONTENT-AUDIT.md`；`docs/UPDATE_SUMMARY.md:13` 已指向存在的 `CODEMAPS/architecture.md`。
- 代码事实源：`package.json:6-24`（npm 脚本）、`content/site.json`（站点与列）、`src/content.config.ts:10-33`（唯一 `blog` 集合，`base: "./content/blog"`）、`astro.config.ts:12-44`（`static`、sitemap、版本化模型，无 Svelte/MDX/Swup/Tailwind）。
- 已核实不存在：`src/utils/`、`src/graph/`、`src/rhine/`、`scripts/check-pr15-*.mjs`、`scripts/editorial-smoke.mjs`、`scripts/new.ts`、`site.config.ts`、Biome/Husky/lint-staged 依赖。
- `docs/archive/` 目前不存在；`ARCHIVE` 动作包含新建该目录并把文件移入，不改写正文结论。

## 1. 总表

| # | 文件 | 结论 | 目标位置/动作 | 活引用数 | 置信度 |
|---:|---|---|---|---:|---|
| A1 | `docs/SCRIPTS.md` | REWRITE | 原地，按 `package.json` + workflows 重写 | 2 | 高 |
| A2 | `docs/ENV.md` | DELETE | 删除；从索引移除 | 1 | 高 |
| A3 | `docs/RUNBOOK.md` | REWRITE | 原地，按 workflows + 部署文档重写 | 1 | 高 |
| A4 | `docs/CODEMAPS/architecture.md` | ARCHIVE | `docs/archive/CODEMAPS/architecture.md` | 2 | 高 |
| A5 | `docs/CODEMAPS/content.md` | ARCHIVE | `docs/archive/CODEMAPS/content.md` | 1 | 高 |
| A6 | `docs/CODEMAPS/dependencies.md` | ARCHIVE | `docs/archive/CODEMAPS/dependencies.md` | 1 | 高 |
| A7 | `docs/CODEMAPS/frontend.md` | ARCHIVE | `docs/archive/CODEMAPS/frontend.md` | 1 | 高 |
| A8 | `docs/adr/0001-monolocale-shortcut.md` | ARCHIVE | `docs/archive/adr/` | 3 | 高 |
| A9 | `docs/adr/0002-og-pipeline.md` | ARCHIVE | `docs/archive/adr/` | 1 | 高 |
| A10 | `docs/adr/0003-locale-aware-url-synthesis.md` | ARCHIVE | `docs/archive/adr/` | 1 | 高 |
| A11 | `docs/adr/0004-i18n-key-fallback.md` | ARCHIVE | `docs/archive/adr/` | 1 | 高 |
| A12 | `docs/adr/0005-universal-listable-shape.md` | ARCHIVE | `docs/archive/adr/` | 1 | 高 |
| A13 | `docs/adr/0006-og-endpoint-factory.md` | ARCHIVE | `docs/archive/adr/` | 2 | 高 |
| A14 | `docs/UPDATE_SUMMARY.md` | ARCHIVE | `docs/archive/UPDATE_SUMMARY.md` | 1 | 高 |
| A15 | `docs/rhine-migration.md` | ARCHIVE | `docs/archive/rhine-migration.md` | 3 | 高 |
| A16 | `docs/computation-design.md` | ARCHIVE | `docs/archive/computation-design.md` | 1 | 高 |
| A17 | `docs/layout-rollback.md` | ARCHIVE | `docs/archive/layout-rollback.md` | 1 | 高 |
| A18 | `docs/mono-color-design.md` | ARCHIVE | `docs/archive/mono-color-design.md` | 1 | 高 |
| A19 | `docs/sailing-print.md` | ARCHIVE | `docs/archive/sailing-print.md` | 1 | 高 |
| A20 | `docs/sailing-print-no-text.md` | ARCHIVE | `docs/archive/sailing-print-no-text.md` | 1 | 高 |
| A21 | `GLOSSARY.md` | ARCHIVE | `docs/archive/GLOSSARY.md` | 2 | 高 |
| A22 | `pnpm-workspace.yaml` | DELETE | 删除 | 0 | 高 |
| A23 | `.serena/project.yml` | REWRITE | 原地，`svelte` → `typescript` | 0 | 高 |
| B1 | `.claude/skills/site-config-mastery.md` | ARCHIVE | `docs/archive/skills/` | 2 | 高 |
| B2 | `.claude/skills/content-authoring.md` | ARCHIVE | `docs/archive/skills/` | 2 | 高 |
| B3 | `.claude/skills/i18n-integration.md` | ARCHIVE | `docs/archive/skills/` | 2 | 高 |
| B4 | `.claude/skills/component-patterns.md` | ARCHIVE | `docs/archive/skills/` | 2 | 高 |
| B5 | `.claude/skills/multi-lang-content.md` | ARCHIVE | `docs/archive/skills/` | 2 | 高 |
| B6 | `.claude/skills/astro-theme-dev.md` | ARCHIVE | `docs/archive/skills/` | 2 | 高 |
| B7 | `.claude/skills/markdown-writing-rules.md` | ARCHIVE | `docs/archive/skills/` | 0 | 高 |
| B8 | `.claude/rules/skill-autoload.md` | KEEP | 保留；补 1 行归档清单 | 1 | 高 |
| C1 | `README.zh-cn.md` | REWRITE | 原地，按 `README.md` 同步 | 2 | 高 |
| C2 | `README.ja.md` | REWRITE | 原地，按 `README.md` 同步 | 2 | 高 |
| C3 | `CONTRIBUTING.md` | REWRITE | 原地，按 npm + 本仓库流程重写 | 1 | 高 |
| C4 | `.github/ISSUE_TEMPLATE/bug_report.yaml` | REWRITE | 原地 | 0 | 高 |
| C5 | `.github/ISSUE_TEMPLATE/config.yml` | REWRITE | 原地 | 0 | 高 |
| C6 | `.github/ISSUE_TEMPLATE/documentation.yaml` | REWRITE | 原地 | 0 | 高 |
| C7 | `.github/ISSUE_TEMPLATE/feature_request.yaml` | KEEP | 保留 | 0 | 高 |
| C8 | `.github/pull_request_template.md` | REWRITE | 原地 | 0 | 高 |
| C9 | `.github/release-please-config.json` | DELETE | 删除 | 0 | 高 |
| C10 | `.github/.release-please-manifest.json` | DELETE | 删除 | 0 | 高 |
| D1 | `arthas.md` | KEEP | 根目录历史稿；加来源横幅，不摄入 | 1 | 中高 |
| E1 | `PR15-ATTRIBUTION.md` | REWRITE | 原地更正脚本引用 | 0 | 高 |
| E2 | `docs/ABOUT-ACCEPTANCE.md` | REWRITE | 原地追加 `c4e49d1` 注记 | 1 | 高 |
| E3 | `docs/agents/domain.md` | REWRITE | 原地，改指当前事实源 | 1 | 高 |

**计数：ARCHIVE 25（A 18 + B 7），REWRITE 13（A 3 + C 7 + E 3），KEEP 3（B 1 + C 1 + D 1），DELETE 4（A 2 + C 2），DEFER 0。**

## 2. A. 过期工程文档逐项裁决

### A1. `docs/SCRIPTS.md` — REWRITE

- 证据：`docs/SCRIPTS.md:1` 标注 `AUTO-GENERATED`，但仓库无生成器；`:8-17` 全部是 `pnpm new/lint/count/prepare` 与 Biome；`:113-121` 引用不存在的 `site-validation.yaml` 与 pnpm 10.30.0。现状是 `package.json:6-24` 的 npm 脚本，CI 为 `astro.yml:15-26`、`deploy.yml:20-25`。
- 裁决：REWRITE。不是历史证据，是仍被索引为“现行参考”的工程手册。
- 精确动作：以 `package.json:6-24` 为唯一命令清单，逐项说明 `postinstall`、`predev`、`prebuild`、`dev`、`check:content`、`check:viewport`、`export:archives`、`check`、`build`、`build:cloudflare`、`format`、`preview`、`kb:lint`、`kb:ingest`、`test:kb`；用 `.github/workflows/{astro,deploy}.yml` 写 CI 段；删除 `AUTO-GENERATED` 标记或补真实生成器。
- 同步链接：`CONTRIBUTING.md:47`（重写时改指当前命令）；`docs/README.md:11` 去掉 `*` 过期提示。
- 验证：`diff <(jq -r '.scripts|keys[]' package.json) <(grep -oP '^\| `\K[^`]+' docs/SCRIPTS.md)` 应覆盖全部脚本；`npm run build`。
- 风险：重写后仍可能与 `package.json` 漂移。缓解：正文只写映射说明，不复制实现细节。

### A2. `docs/ENV.md` — DELETE

- 证据：`docs/ENV.md:12` 只列 `PUBLIC_TIMEZONE`；`:44-71` 描述不存在的 `site.config.ts`、Svelte/MDX/Swup 与 `experimental.fonts`；`:77-89` 的 `$config/$layouts/...` 别名在 `tsconfig.json` 中不存在。代码仅 `src/asset-url.ts:5` 使用 `import.meta.env.PROD`，无需配置。`.env.example:2` 的 `PUBLIC_TIMEZONE` 亦无消费者。
- 裁决：DELETE。重写一个“没有任何环境变量”的页面没有信息价值。
- 精确动作：删除 `docs/ENV.md`；从 `docs/README.md:11` 与分类登记移除。建议同一变更删除或清空 `.env.example`（超出本轮清单，列为同步项）。
- 同步链接：`docs/README.md`；`docs/DOCUMENT-CLASSIFICATION.md` §5.2；`docs/classification/maintenance-audit.md` §3.1。
- 验证：`git grep -n "docs/ENV.md"` 仅剩分类/审计记录；`npm run build`。
- 风险：低。若未来引入环境变量，应新建一份从 `.env.example` 生成的简短文档，而不是保留空壳。

### A3. `docs/RUNBOOK.md` — REWRITE

- 证据：`docs/RUNBOOK.md:12` 写 pnpm 10.30.0；`:68` 写 `/feed.xml`（当前为 `/rss.xml`、`/en/rss.xml`、`/ja/rss.xml`）；`:74-80`、`:174` 写 pnpm/Svelte/`src/content/{collection}`。当前部署由 `deploy.yml:20-41` 与 `astro.yml:15-26` 完成。
- 裁决：REWRITE。运维手册仍有价值，但不能保留错误命令。
- 精确动作：保留四段：自动部署（`main` push → `deploy.yml`）、本地验证（`npm ci` + `npm run build/check:content/check:viewport/kb:lint/test:kb`）、回滚（`git revert`，禁止默认 `--force`）、故障排查（Actions 日志、Pages 设置、`/rss.xml`、离线更新入口 `/update.html`）。Cloudflare 包装引用 `docs/CLOUDFLARE-DEPLOYMENT.md`，PWA 引用 `docs/PWA.md`，不复制。
- 同步链接：`docs/README.md:11`。
- 验证：逐条命令与 `package.json` 对齐；`npm run build`。
- 风险：与 `README.md` 开发段、`CLOUDFLARE-DEPLOYMENT.md` 重叠。缓解：RUNBOOK 只保留操作顺序与回滚，细节外链。

### A4-A7. `docs/CODEMAPS/{architecture,content,dependencies,frontend}.md` — ARCHIVE

- 证据：`architecture.md:8-14` 写 Astro 5 + Svelte 5 + Tailwind 4 + pnpm；`content.md:10-29` 只描述 `src/content/{note,jotting,preface,information}`；`dependencies.md:7-39` 列 `svelte`、`tailwindcss`、`@swup/astro`、`@biomejs/biome`、`satori`、`sharp`；`frontend.md:8-30` 描述 `[...locale]/`、`App.astro`、`Base.astro`、`ContentCard`。`package.json:10-29` 与 `src/pages/`（`blog/[...slug].astro`、`about.astro`、`index.astro`、`rss.xml.ts` 等）完全不符。四份均标注 2026-06-01/07-02 生成，仓库已无生成器。
- 裁决：ARCHIVE。它们是旧架构的唯一快照，删除会丢失历史证据；但不应继续被当作现行参考。
- 精确动作：整体移动到 `docs/archive/CODEMAPS/`（保留相对结构，`UPDATE_SUMMARY.md` 移入同层后其 `CODEMAPS/architecture.md` 相对链接仍解析）。
- 同步链接：`docs/README.md:11,48`；`docs/UPDATE_SUMMARY.md:13`（同组移动后相对链接不变）；`docs/DOCUMENT-CLASSIFICATION.md` §5.3；`docs/classification/maintenance-audit.md` §3.1/§7.2。
- 验证：`git grep -n "CODEMAPS/"` 的活链接全部指向 `docs/archive/CODEMAPS/`；本地链接检查。
- 风险：低。注意不要把 `docs/archive/CODEMAPS/` 误当现行架构说明。

### A8-A13. `docs/adr/0001`–`0006` — ARCHIVE

- 证据：六份 ADR 全部围绕已删除代码：`0001:26-29` 的 `src/utils/content.ts`、`0002:18,33` 的 `src/graph/*`、`0003:20-24` 的 `src/utils/content-fetch.ts`、`0004:15-25` 的 `i18nit`、`0005:22-30` 的 `ContentCard`/`Heatmap.astro`、`0006:24-30` 的 `defineContentGraphEndpoint`。`src/utils/` 与 `src/graph/` 均不存在。
- 裁决：ARCHIVE。ADR 记录的是决策理由，属于历史证据；当前代码已不适用，不能 KEEP 为现行决策。
- 精确动作：移动到 `docs/archive/adr/`，保留文件名与编号；在目录内新增一行 `README.md` 说明“2026-07-02 ThoughtLite 阶段决策，已被 RhineLabUI-Astro 取代”？不新增文件，改为在各 ADR 顶部加 `> 状态：已归档；适用代码已移除。` 一行。若坚持“不改正文”，则仅在归档索引中说明。
- 同步链接：`AGENTS.md:74`（改为 `docs/archive/adr/` 或删除路径）、`docs/agents/domain.md:9-10`（重写）、`docs/README.md:47`。
- 验证：`git grep -n "docs/adr/"` 无活引用；YAML/Markdown 链接检查。
- 风险：低。若未来重建 OG/i18n 架构，这些 ADR 只能作历史参考，不能直接复用结论。

### A14. `docs/UPDATE_SUMMARY.md` — ARCHIVE

- 证据：`docs/UPDATE_SUMMARY.md:3` 生成于 2026-06-01；`:43-54` 声称“No stale documentation detected”，而其记录的 `SCRIPTS/ENV/RUNBOOK/CODEMAPS` 已全部过期。它是旧文档创建活动的日志，不是现行参考。
- 裁决：ARCHIVE。
- 精确动作：移动到 `docs/archive/UPDATE_SUMMARY.md`；与 CODEMAPS 同组移动，保持 `CODEMAPS/architecture.md` 相对链接。
- 同步链接：`docs/README.md:45`；`docs/DOCUMENT-CLASSIFICATION.md` §5.3。
- 验证：链接检查；`git grep -n "UPDATE_SUMMARY.md"`。
- 风险：低。

### A15. `docs/rhine-migration.md` — ARCHIVE

- 证据：`docs/rhine-migration.md:9-11` 描述 `src/rhine/` 与 `patches/` 的旧嵌入阶段，`:29` 写 `pnpm`；`src/rhine/` 现已不存在，当前为 RhineLabUI-Astro 模板（`migration/README.md:3`）。`:33` 的备份 SHA-256 是该阶段唯一可追溯记录。
- 裁决：ARCHIVE。它是旧迁移阶段的唯一历史证据，不能 DELETE。
- 精确动作：移动到 `docs/archive/rhine-migration.md`；在 `README.zh-cn.md:131`、`README.ja.md:131` 重写时移除或改指归档路径；`docs/README.md:46` 更新。
- 同步链接：`README.zh-cn.md`、`README.ja.md`、`docs/README.md`。
- 验证：`git grep -n "rhine-migration"` 只指向归档；`npm run build`。
- 风险：低。不要把它与 `migration/README.md` 混为同一份迁移说明。

### A16-A20. 视觉设计稿 — ARCHIVE

- 证据：
  - `computation-design.md:5` 自述“以下计算图生成记录保留为历史方案，不再用于首页”；`:25` 写 `pnpm check`。
  - `layout-rollback.md:5` 引用 `public/images/sailing-print-no-text.png`；`:7` 明说“其他设计文档和生成素材仅作为历史记录”；`:9` 写 `pnpm`。
  - `mono-color-design.md:5,9,11` 为 ThoughtLite `src/styles/editorial.css` 阶段。
  - `sailing-print.md:19` 的最终 Prompt 是 `undefined`。
  - `sailing-print-no-text.md:12` 的编辑 Prompt 也是 `undefined`。
- 裁决：五份全部 ARCHIVE。它们是旧视觉迭代的历史记录，已被 RhineLabUI 3D 舞台取代；其中两份含 `undefined`，没有可复现价值，但仍属历史证据。
- 精确动作：整体移动到 `docs/archive/`（保留文件名）；`layout-rollback.md` 对 `sailing-print-no-text.md` 的相对链接在同组移动后仍成立。
- 同步链接：`docs/README.md:46`；`docs/DOCUMENT-CLASSIFICATION.md` §5.3。
- 验证：链接检查；`git grep -n "sailing-print\|computation-design\|layout-rollback\|mono-color-design"`。
- 风险：低。不要把 `undefined` Prompt 当作可复用配方。

### A21. `GLOSSARY.md` — ARCHIVE

- 证据：`GLOSSARY.md:21-31` 定义 `src/content/note/{locale}`、`src/utils/config.ts`；`:81-99` 的 seam 表全是 `src/utils/*`、`src/i18n/index.ts`、`src/graph/render.ts`、`ContentList.svelte`、`Heatmap.astro`。`src/utils/`、`src/graph/` 不存在；`AGENTS.md:74` 已称其为历史 ThoughtLite 产物。
- 裁决：ARCHIVE。语言词表本身是旧架构的唯一术语快照，保留但不作为现行词汇源。
- 精确动作：移动到 `docs/archive/GLOSSARY.md`；当前词汇源改为 `content/locales.json` 与 `docs/DOCUMENT-CLASSIFICATION.md`（与 `AGENTS.md:74` 一致）。
- 同步链接：`AGENTS.md:74`；`docs/agents/domain.md:7-10`（重写）；`docs/README.md`。
- 验证：`git grep -n "GLOSSARY.md"` 无活引用；`npm run build`。
- 风险：低。

### A22. `pnpm-workspace.yaml` — DELETE

- 证据：`pnpm-workspace.yaml:1-7` 只含 `onlyBuiltDependencies` 与 `patchedDependencies`（rolling-number 0.4.1）。项目使用 npm：`package-lock.json` 存在，补丁由 `scripts/patch-rolling-number.mjs:1-10` 在 `postinstall`/`predev`/`prebuild` 执行；`package.json:6-8` 无 pnpm 字段。无活引用。
- 裁决：DELETE。它是与当前包管理器冲突的死配置，保留会误导贡献者。
- 精确动作：删除文件；同步移除 `docs/README.md` 与分类登记中的记录。保留 `patches/@kitlangton__rolling-number@0.4.1.patch`（若有其他工具引用）或一并清理，需先 `git grep "patches/"` 确认。
- 同步链接：`docs/DOCUMENT-CLASSIFICATION.md` §5.3；`docs/classification/maintenance-audit.md` §3.2。
- 验证：`git grep -n "pnpm-workspace"`；`npm ci && npm run build`。
- 风险：低。若有开发者仍用 pnpm，会失去补丁声明；以仓库文档与 lockfile 为准，明确 npm。

### A23. `.serena/project.yml` — REWRITE

- 证据：`.serena/project.yml:38-39` 为 `language_servers: [svelte]`；当前无 Svelte 依赖（`package.json` 无 `svelte`，`src/components/` 仅 `.astro`）。其余字段（`read_only: false`、`ls_workspace_folders: ["."]`）合理。
- 裁决：REWRITE（最小改动）。
- 精确动作：把 `- svelte` 改为 `- typescript`；不改其他字段。
- 同步链接：无活引用。
- 验证：`python -c "import yaml;yaml.safe_load(open('.serena/project.yml'))"`；在 Serena 中重新激活项目，确认 TS LSP 启动。
- 风险：低。索引语言变化会重建符号缓存，不影响构建。

## 3. B. Agent 技能逐项裁决

### B1-B7. `.claude/skills/*`（除 `knowledge-base.md`）— ARCHIVE

- 证据：
  - `site-config-mastery.md:3` 自述 ThoughtLite；`:11-25` 围绕 `site.config.ts`、`PUBLIC_TIMEZONE`。
  - `content-authoring.md:3,9-12` 的 `src/content/note|jotting|information` 与 `timestamp/series/toc` frontmatter。
  - `i18n-integration.md:3,17-22` 的 `src/i18n/{lang}/index.yaml` 与 `experimental.fonts`。
  - `component-patterns.md:3,9-19` 的 `Note.svelte`、`Sensitive.svelte`、`Heatmap.astro`、`TOC.astro`。
  - `multi-lang-content.md:3,9-30` 的旧 `src/content/` 三语结构。
  - `astro-theme-dev.md:3,8-45` 的 `src/pages/[...locale]/`、`App.astro`、`Base.astro`、`src/graph/`。
  - `markdown-writing-rules.md:3,14-25,29-47` 的旧 frontmatter；`:73-103` 的 Ruby/Spoiler/Emoji/扩展表格等语法未在 `src/content.config.ts` 或当前渲染配置中确认。
  - 当前事实源已集中在 `AGENTS.md:5-11,66-78`、`content/site.json`、`src/content.config.ts`、`docs/I18N.md`、`content/README.md`。把 7 份技能改写成现行版会产生 7 份重复且易漂移的文档。
- 裁决：七份全部 ARCHIVE。关键是让它们离开 `.claude/skills/` 发现目录，避免其他 Agent 会话继续加载过期技术栈。
- 精确动作：移动到 `docs/archive/skills/`；`knowledge-base.md` 保持原位。若工具要求技能文件留在 `.claude/skills/` 才能被引用，则改为在每份文件顶部加 `> DEPRECATED — 已归档，勿加载`，但这不如移出目录彻底。
- 同步链接：`AGENTS.md:27`（改为“已移至 `docs/archive/skills/`”）；`.claude/rules/skill-autoload.md:15-17`（补 `markdown-writing-rules.md` 并注明归档位置）；`docs/DOCUMENT-CLASSIFICATION.md` §5.2/§5.3；`docs/classification/maintenance-audit.md` §3.3。
- 验证：`ls .claude/skills/` 只剩 `knowledge-base.md`；`git grep -n "site-config-mastery\|content-authoring\|i18n-integration\|component-patterns\|multi-lang-content\|astro-theme-dev\|markdown-writing-rules"` 只出现在归档与分类记录中。
- 风险：中。其他会话若缓存了旧技能路径，会读不到文件；需同步更新所有指令文件。反过来，继续保留会让 Agent 生成基于 `site.config.ts`/Svelte 的错误代码，风险更高。

### B8. `.claude/rules/skill-autoload.md` — KEEP

- 证据：当前内容 `:7-11` 已指向 `.claude/skills/knowledge-base.md`、`docs/DOCUMENT-CLASSIFICATION.md`、`KB.md`；`:13-17` 已声明 6 份 ThoughtLite 技能归档；`:19` 已列当前事实源。主体正确。
- 裁决：KEEP。仅做一行同步，不重写。
- 精确动作：把 `markdown-writing-rules.md` 加入 `:17` 的归档清单；若技能移入 `docs/archive/skills/`，注明路径。
- 同步链接：`AGENTS.md:27`。
- 验证：人工对照 `.claude/skills/` 实际剩余文件；无自动校验。
- 风险：低。

## 4. C. 对外文档逐项裁决

### C1-C2. `README.zh-cn.md`、`README.ja.md` — REWRITE

- 证据：两份 `:1` 标题仍为 “ThoughtLite 知识库”；`:30,38-69` 全为 pnpm 与 Biome；`:78` 写 `src/rhine/`；`:86` 写 `src/pages/[...locale]/`；`:93,112` 写 `site.config.ts`；`:118-120` 写 pnpm/Biome 验证。当前 `README.md` 已正确描述 npm、`content/site.json`、`content/blog/legacy/`、`src/content.config.ts` 与 `/about/`。
- 裁决：两份均 REWRITE。它们是用户入口，错误命令会直接误导安装。
- 精确动作：以 `README.md` 为结构基准，保留各语言自然表达，不逐字硬译；命令表改为 `npm ci`、`npm run dev`、`npm run build`、`npm run check:content`、`npm run check:viewport`、`npm run kb:lint`、`npm run test:kb`、`npm run build:cloudflare`；项目结构改为 `content/blog/legacy/`、`src/content/raw/`（只读）、`src/pages/{blog,about,index}`、`content/site.json`；删除 `src/rhine/` 与 `site.config.ts`。
- 同步链接：`README.md:3` 的语言切换；`docs/rhine-migration.md` 引用改为归档路径或删除；`docs/UPDATE_SUMMARY.md`（已归档）。
- 验证：三份 README 的命令/路径集合一致；`npm run build`；人工核对三语语义。
- 风险：中。翻译质量与事实一致性需人工复核，不能只做字符串替换。

### C3. `CONTRIBUTING.md` — REWRITE

- 证据：`:18,31,36` pnpm；`:44-50` 不存在的 `pnpm new`；`:59-67` Biome/Husky；`:75-81,178-180` Biome；`:184` 引导 Fork `tuyuritio/astro-theme-thought-lite`。当前为 npm + Prettier + Vitest（`package.json:10-44`），无 Husky/Biome。
- 裁决：REWRITE。
- 精确动作：以 `README.md` 开发段、`package.json:6-24`、`.github/workflows/*.yml`、`docs/agents/issue-tracker.md` 为源；保留英文主语言、Conventional Commits、Issue 模板与 AI 声明规则；把 Fork 指向本仓库；验证命令改为 `npm run check:content`、`npm run check:viewport`、`npm run build`、`npm run kb:lint`、`npm run test:kb`；格式化改为 `npm run format`（Prettier）。
- 同步链接：`.github/pull_request_template.md:4`；`docs/UPDATE_SUMMARY.md`（已归档）。
- 验证：`git grep -n "pnpm\|Biome\|thought-lite/fork" CONTRIBUTING.md` 为 0；`npm run build`。
- 风险：中。贡献流程错误会误导外部 PR；需与 `issue-tracker.md` 的 `gh` 流程保持一致。

### C4. `.github/ISSUE_TEMPLATE/bug_report.yaml` — REWRITE

- 证据：`:23-30` 分支下拉含不存在的 `cloudflare`；`:60` 要求 `pnpx astro info`；当前只有 `main` 部署。
- 裁决：REWRITE。
- 精确动作：删除 `cloudflare` 选项；`pnpx` → `npx astro info`（或 `npm exec astro info`）；环境信息补 Node 22.12+ 与浏览器；保留复现步骤与贡献意愿。
- 同步链接：无。
- 验证：YAML 解析；GitHub 表单预览。
- 风险：低。

### C5. `.github/ISSUE_TEMPLATE/config.yml` — REWRITE

- 证据：`:3-8` 外链 `thought-lite.ttio.workers.dev` 与 `tuyuritio/astro-theme-thought-lite/discussions`。
- 裁决：REWRITE。
- 精确动作：改为本仓库 `https://github.com/DavidHLP/DavidHLP.github.io` 的 Issues/文档入口；若 Discussions 未启用，删除该条并保留 `blank_issues_enabled: false`。
- 同步链接：无。
- 验证：YAML 解析；确认目标 URL 可访问（需网络）。
- 风险：低。若 Discussions 实际未启用，错误链接会 404；执行时先确认仓库设置。

### C6. `.github/ISSUE_TEMPLATE/documentation.yaml` — REWRITE

- 证据：`:44` 示例路径为 `src/content/note/en/configuration.md`，当前不存在。
- 裁决：REWRITE（单行修正即可）。
- 精确动作：示例改为 `content/blog/legacy/note/zh-cn/*.md` 或 `docs/DOCUMENT-CLASSIFICATION.md`；其余表单保留。
- 同步链接：无。
- 验证：YAML 解析。
- 风险：低。

### C7. `.github/ISSUE_TEMPLATE/feature_request.yaml` — KEEP

- 证据：全文无 pnpm/Biome/Svelte/旧路径；分类与字段通用。
- 裁决：KEEP。
- 精确动作：无。
- 同步链接：无。
- 验证：YAML 解析。
- 风险：无。

### C8. `.github/pull_request_template.md` — REWRITE

- 证据：`:4` 指向 `tuyuritio/astro-theme-thought-lite/blob/main/CONTRIBUTING.md`。
- 裁决：REWRITE。
- 精确动作：改为本仓库 `CONTRIBUTING.md`；可选加入“已运行 `npm run build/check:content/check:viewport`”清单；保留 Description/Testing/Docs 三段。
- 同步链接：`CONTRIBUTING.md`。
- 验证：链接存在；GitHub PR 预览。
- 风险：低。

### C9-C10. `.github/release-please-config.json`、`.github/.release-please-manifest.json` — DELETE

- 证据：`release-please-config.json:1-29` 是上游 release-please 配置；manifest `:2` 停在 `0.36.3`；仓库无 release-please workflow，`package.json:5` 为 `private: true`，不是 npm 发布包；`CHANGELOG.md` 是上游历史。
- 裁决：两份 DELETE。Git 历史保留即可。
- 精确动作：删除两份文件；从 `docs/DOCUMENT-CLASSIFICATION.md` §5.3 移除。
- 同步链接：无活链接。
- 验证：`git grep -n "release-please"` 只剩 `CHANGELOG.md` 的上游文本。
- 风险：低。若未来要做自动发布，应重新引入并配置本仓库，而不是恢复上游清单。

## 5. D. 孤立内容 `arthas.md`

### D1. `arthas.md` — KEEP（三选一中的第 3 项：保持根目录历史文件）

**重叠度核验**

- `arthas.md:20-116` 的 watch/trace/stack/tt/monitor/sysprop/memory/thread 命令，与 raw 来源 `src/content/raw/zh-cn/legacy-java-online-performance-debug.md:211-300` 的命令速查表高度重叠；raw 还额外包含 `dashboard/jad/sc/mc/retransform/classloader` 与排查流程图（`:240-300`）。
- wiki 页 `content/blog/legacy/note/zh-cn/java-online-performance-debug.md` 已把 Arthas 定位为“连接运行中 JVM、观察线程和方法”的受限观测手段（`:111-116`），并在 `:143-145` 明确“Arthas 命令兼容性”属于未确认项。`arthas.md` 没有提供该页尚未覆盖的已验证事实。

**未验证/主观内容**

- `arthas.md:143-173` 的 VisualVM/JProfiler 对比表是主观归纳，raw 与 wiki 均无对应来源；raw 中不存在 `VisualVM`/`JProfiler`（已用 grep 确认）。
- `arthas.md:180` 的“watch/trace 会增加 5%~15% 开销”没有版本、场景或测量方法；raw 中无此数字。
- `arthas.md:14` 的“兼容 JDK 6+”未标注 Arthas 版本；与当前主流 JDK 21/25 的适用性未验证。
- `arthas.md:37,57,77,93,115` 等示例统一使用 `com.example.*`，是通用示例而非可复现实验。
- 全文无 `source`、`capturedAt`、版本或固定提交，不满足 `KB.md` 对 `sources` 的要求。

**三选一结论**

1. “作为 raw 快照摄入，并入 `java-online-performance-debug`”：不选。raw 已在 `legacy-java-online-performance-debug` 中覆盖 Arthas；再摄入一份重复快照只会增加 manifest 与去重负担，且其独有内容未经验证，不能并入正典。
2. “新建独立 wiki 页 `java-arthas-diagnostics`”：不选。会与现有页面重复，且必须以未经验证的本地稿为来源，违反“非平凡结论必须有 `sources`”。
3. “保持根目录历史文件”：选此项。它保留用户提供的原始稿，不污染 raw 证据链，也不制造新的 wiki 页。

**精确动作**

- 保留 `arthas.md` 在根目录；在文件顶部加 3 行来源横幅：本地历史稿、未经验证、正典见 `content/blog/legacy/note/zh-cn/java-online-performance-debug.md`、不作为 `sources`。
- 在 `docs/README.md` 的“历史归档”增加一条指向根目录文件的说明；在 `docs/DOCUMENT-CLASSIFICATION.md` 与审计附录中把其状态从 `reclassify-to-wiki` 改为 `keep-historical-local-draft`。
- 不新增 raw，不改 `kb-index.md`，不改 wiki 页正文。
- `docs/UPDATE_SUMMARY.md:52` 的“arthas.md Current”随之失效；该文件本身已裁决归档，无需单独修。

**验证**：`git grep -n "arthas.md"` 只出现在历史登记与本文件；`npm run kb:lint` 不受影响（未新增 raw）。

**风险**：中。根目录保留会继续让读者误以为它是正式文章。顶部横幅与索引说明是必要缓解；若未来用户明确要求晋升，必须先做来源化、版本固定与对比内容的证据审查。

## 6. E. 其他逐项裁决

### E1. `PR15-ATTRIBUTION.md` — REWRITE

- 证据：`PR15-ATTRIBUTION.md:10` 引用 `scripts/check-pr15-port.mjs` 与 `scripts/check-pr15-rendering.mjs`，两者均不存在（`ls scripts/` 无匹配）。但优化确实已落地：`src/archive-draw-coverage.ts:5`、`src/archive-visibility.ts:58` 保留相关逻辑；提交 `10d7deb`（`perf: extract B web rendering optimizations from PR15`）是 HEAD 的祖先。
- 裁决：REWRITE（定点更正，不重写基准数据）。
- 精确动作：把 `:10` 末句改为“回归脚本在提取完成后已移除；提取内容保留在提交 `10d7deb`，当前实现见 `src/archive-draw-coverage.ts` 与 `src/archive-visibility.ts`。”保留作者署名、基准数字、设备与“不能证明全时/跨设备等价”的限制。
- 同步链接：无活引用；`docs/DOCUMENT-CLASSIFICATION.md` §5.1 的“入口”描述可保持。
- 验证：`git merge-base --is-ancestor 10d7deb HEAD` 返回成功；`git grep -n "check-pr15"` 为 0。
- 风险：低。不要把“脚本已移除”写成“优化未验证”；基准数据仍是历史证据。

### E2. `docs/ABOUT-ACCEPTANCE.md` — REWRITE

- 证据：`docs/ABOUT-ACCEPTANCE.md:5,16,27,31` 仍把打印/PDF 作为验收项与已完成证据；`c4e49d1` 已移除打印与简历导出：`git show --stat c4e49d1` 删除 `scripts/export-resumes.mjs`、`scripts/resume/*`，并修改 `docs/ABOUT.md`、`About.astro`、`about.css`。`docs/ABOUT.md:51-55` 现已声明导出功能彻底移除。
- 裁决：REWRITE（追加注记，不改写 2026-11-01 历史记录）。
- 精确动作：在“2026-11-01 验收记录”之后追加“2026-11-27 变更注记”：`c4e49d1` 移除打印/PDF/LaTeX 简历导出；上文的打印、PDF 3 页与相关按钮检查仅代表当时版本，现不再适用；当前验收以 `check-about-browser.mjs` 与无导出入口为准。
- 同步链接：`README.md:42` 指向本文件，路径不变。
- 验证：`git show --stat c4e49d1`；人工确认历史记录未被改写；`npm run check:content`。
- 风险：低。不得删除历史验收结论，否则丢失审计链。

### E3. `docs/agents/domain.md` — REWRITE

- 证据：`:7-10` 要求先读 `GLOSSARY.md` 与 `docs/adr/`，并把它们当作当前领域文档；但两者均为 ThoughtLite 时代产物（见 A8-A13、A21），`AGENTS.md:74` 已明确其为历史物。当前词汇源是 `content/locales.json` 与 `docs/DOCUMENT-CLASSIFICATION.md`。
- 裁决：REWRITE。
- 精确动作：把“Before exploring”改为：先读 `content/locales.json`（分类/科室/访问级别三语用语）与 `docs/DOCUMENT-CLASSIFICATION.md`（层/域/状态）；`GLOSSARY.md` 与 `docs/adr/` 仅作 `docs/archive/` 下的历史参考，不再作为现行决策依据；保留“文件不存在则静默继续”的通用行为。
- 同步链接：`AGENTS.md:74`（可保持，或补归档路径）；`docs/README.md:38`。
- 验证：`git grep -n "GLOSSARY.md\|docs/adr/" docs/agents/domain.md` 只指向归档路径；人工跑一次 `/domain-modeling` 类流程确认无断链。
- 风险：中。下游工程技能依赖此文件选择领域上下文；改错会让技能读到错误词汇。改动应保持简短，并把“历史”与“现行”分开。

## 7. 按 P0/P1/P2 排序的执行清单

### P0 — 先修，直接防止错误行为

1. **归档 7 份过期技能并同步指令**
   - 动作：`mkdir -p docs/archive/skills`；移动 B1-B7；更新 `AGENTS.md:27`、`.claude/rules/skill-autoload.md:13-17`。
   - 目标：`.claude/skills/` 仅剩 `knowledge-base.md`。
   - 验证：`ls .claude/skills/`；`git grep` 无 `.claude/skills/<old>` 活引用。
   - 风险：其他会话缓存旧路径；同步更新可消除。

2. **重写对外入口**
   - 动作：C1、C2、C3 按 `README.md` + `package.json` + workflows 重写；C4、C5、C6、C8 修正模板。
   - 目标：三份 README 与贡献指南不再出现 pnpm/Biome/Svelte/`site.config.ts`/`src/rhine`/上游 Fork。
   - 验证：`git grep -n "pnpm\|Biome\|site.config.ts\|src/rhine\|\[...locale\]" README*.md CONTRIBUTING.md .github/` 为 0（历史归档除外）；`npm run build`。
   - 风险：三语事实漂移；需人工复核译文。

3. **重写 `docs/agents/domain.md`**
   - 动作：E3。
   - 验证：文件内无对 `GLOSSARY.md`/`docs/adr/` 的现行指向。
   - 风险：下游技能上下文改变；保持“历史/现行”分层即可。

### P1 — 文档真实性与链接完整性

4. **归档历史文档组**
   - 动作：A4-A21 移入 `docs/archive/` 对应子目录；保留组内相对结构；更新 `docs/README.md`、`AGENTS.md:74`、`README.zh-cn.md`/`README.ja.md` 的归档链接。
   - 验证：本地链接检查；`git grep -n "docs/CODEMAPS/\|docs/adr/\|GLOSSARY.md"` 无活引用；`npm run build`。
   - 风险：跨文档链接断裂；按组移动可保留大部分相对链接。

5. **重写当前工程参考并删除空壳**
   - 动作：A1（SCRIPTS）、A3（RUNBOOK）按 `package.json`/workflows 重写；A2（ENV）删除。
   - 验证：命令与 `package.json:6-24` 一一对应；`git grep -n "docs/ENV.md"` 无活引用。
   - 风险：与 README/Cloudflare 文档重复；控制篇幅并外链。

6. **修复归因与验收记录**
   - 动作：E1（PR15 脚本引用）、E2（ABOUT-ACCEPTANCE 追加 `c4e49d1` 注记）。
   - 验证：`git merge-base --is-ancestor 10d7deb HEAD`；`git show --stat c4e49d1`；链接检查。
   - 风险：低。

7. **登记 `arthas.md` 的历史状态**
   - 动作：D1 顶部横幅 + `docs/README.md`/分类登记说明；不新增 raw，不改 wiki。
   - 验证：`npm run kb:lint`；`git grep -n "arthas.md"` 仅历史记录。
   - 风险：中；横幅是必要缓解。

### P2 — 配置与收尾

8. **删除 pnpm 死配置**
   - 动作：A22 删除 `pnpm-workspace.yaml`；确认 `patches/` 是否仍被引用后再决定是否保留补丁文件。
   - 验证：`git grep -n "pnpm-workspace"`；`npm ci && npm run build`。
   - 风险：低。

9. **修正 Serena LSP**
   - 动作：A23 `svelte` → `typescript`。
   - 验证：YAML 解析；Serena 重新激活。
   - 风险：低。

10. **删除 release-please 遗留**
    - 动作：C9、C10 删除。
    - 验证：`git grep -n "release-please"`。
    - 风险：低。

11. **保留 `feature_request.yaml`**
    - 动作：无。
    - 验证：YAML 解析。
    - 风险：无。

### 统一收尾验证

```bash
npm run check:content
npm run check:viewport
npm run build
npm run kb:lint
npm run test:kb
```

补充检查：

- 本地 Markdown 链接扫描：对 `docs/README.md`、`AGENTS.md`、`README*.md`、`docs/agents/*.md` 中所有相对链接验证目标存在。
- 过期词扫描：`git grep -n -E "pnpm|Biome|site\.config\.ts|src/rhine|\[\.\.\.locale\]|thought-lite" -- ':!docs/archive' ':!migration' ':!docs/classification' ':!CHANGELOG.md'` 应为 0（`public/archives` 与冻结快照除外）。

## 8. 未执行事项与边界

- 本文件是唯一新增文件；未移动、改写或删除任何既有文件。
- `migration/source/`、`migration/fuwari/`、`src/content/`、`src/content/raw/` 保持只读；即使其中出现旧文档名，也不修改。
- `docs/archive/` 的实际创建、文件移动与链接修复属于后续执行；本文件只给出目标路径。
- `docs/DOCUMENT-CLASSIFICATION.md` 与 `docs/classification/maintenance-audit.md` 在本裁决执行后需要同步更新，但它们不是本文件的执行前置条件。
