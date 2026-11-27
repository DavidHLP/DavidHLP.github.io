# Documentation

本目录保存仓库维护文档，不发布为博客文章。文档的全仓分类口径、现状裁决与待办见 [DOCUMENT-CLASSIFICATION.md](DOCUMENT-CLASSIFICATION.md)；逐文件审计证据见 [classification/](classification/)。

## 分类速览

| 分类 | 文档 |
|---|---|
| 知识库规范 | [DOCUMENT-CLASSIFICATION.md](DOCUMENT-CLASSIFICATION.md)、[kb-convergence-design.md](kb-convergence-design.md) |
| 站点运营 | [ABOUT.md](ABOUT.md)、[ABOUT-ACCEPTANCE.md](ABOUT-ACCEPTANCE.md)、[CLOUDFLARE-DEPLOYMENT.md](CLOUDFLARE-DEPLOYMENT.md)、[I18N.md](I18N.md)、[PWA.md](PWA.md) |
| 工程参考 | [SCRIPTS.md](SCRIPTS.md)、[RUNBOOK.md](RUNBOOK.md) |
| Agent 协议 | [agents/domain.md](agents/domain.md)、[agents/issue-tracker.md](agents/issue-tracker.md)、[agents/triage-labels.md](agents/triage-labels.md) |
| 历史归档 | [archive/](archive/)：代码地图、ADR、旧技能、迁移与视觉设计稿 |
| 审计附录 | [classification/wiki-audit.md](classification/wiki-audit.md)、[classification/maintenance-audit.md](classification/maintenance-audit.md) |

## 现行文档

### 知识库

- [DOCUMENT-CLASSIFICATION.md](DOCUMENT-CLASSIFICATION.md) — 全仓文档的分层、六域、生命周期与处置登记。
- [kb-convergence-design.md](kb-convergence-design.md) — 六域 IA v2、L1–L4 深度分层与 provisional 毕业门。
- [classification/wiki-audit.md](classification/wiki-audit.md) — Wiki slug × 3 语言、raw 来源的逐篇分类审计。
- [classification/maintenance-audit.md](classification/maintenance-audit.md) — `docs/`、根目录、Agent 层、镜像、迁移与归档的逐文件审计。

### 站点与内容运营

- [ABOUT.md](ABOUT.md) — About / 个人档案页的字段与数据来源。
- [ABOUT-ACCEPTANCE.md](ABOUT-ACCEPTANCE.md) — About 页验收清单与未测边界。
- [CLOUDFLARE-DEPLOYMENT.md](CLOUDFLARE-DEPLOYMENT.md) — Cloudflare 静态打包部署。
- [I18N.md](I18N.md) — 全内容语言切换与三语完整性规则。
- [PWA.md](PWA.md) — 安装、离线与更新流程。
- [SCRIPTS.md](SCRIPTS.md) — npm 脚本映射与 CI 说明。
- [RUNBOOK.md](RUNBOOK.md) — 部署、验证、回滚与故障排查。

### Agent 协议

- [agents/domain.md](agents/domain.md) — 领域文档协议与术语来源。
- [agents/issue-tracker.md](agents/issue-tracker.md) — GitHub Issues 工作流。
- [agents/triage-labels.md](agents/triage-labels.md) — 五类 triage 标签映射。

## 历史归档（保留证据，不再更新）

- 归档目录：[archive/](archive/)，内容与当前代码和站点配置无关。
- 代码地图：[archive/CODEMAPS/architecture.md](archive/CODEMAPS/architecture.md)、[content.md](archive/CODEMAPS/content.md)、[frontend.md](archive/CODEMAPS/frontend.md)、[dependencies.md](archive/CODEMAPS/dependencies.md)
- 架构决策：[archive/adr/0001](archive/adr/0001-monolocale-shortcut.md)–[0006](archive/adr/0006-og-endpoint-factory.md)
- 旧 Agent 技能：[archive/skills/](archive/skills/)（已移出 `.claude/skills/`，仅作历史参考）
- 迁移与视觉实验：[archive/rhine-migration.md](archive/rhine-migration.md)、[archive/computation-design.md](archive/computation-design.md)、[archive/layout-rollback.md](archive/layout-rollback.md)、[archive/mono-color-design.md](archive/mono-color-design.md)、[archive/sailing-print.md](archive/sailing-print.md)、[archive/sailing-print-no-text.md](archive/sailing-print-no-text.md)
- 文档更新日志：[archive/UPDATE_SUMMARY.md](archive/UPDATE_SUMMARY.md)
- 旧术语表：[archive/GLOSSARY.md](archive/GLOSSARY.md)
- 业务审查：[BUSINESS-AUDIT.md](BUSINESS-AUDIT.md)、[BUSINESS-IMPLEMENTATION.md](BUSINESS-IMPLEMENTATION.md)
- 国际化审计：[I18N-SEMANTIC-AUDIT.md](I18N-SEMANTIC-AUDIT.md)
- 根目录历史稿：[arthas.md](../arthas.md) — 本地历史稿，未经验证，不作为知识库 `sources`；正典见 [java-online-performance-debug.md](../content/blog/legacy/note/zh-cn/java-online-performance-debug.md)。

## 维护规则

1. 新文档必须登记到本文件与 [DOCUMENT-CLASSIFICATION.md](DOCUMENT-CLASSIFICATION.md)。
2. 现行参考文档（`SCRIPTS`、`RUNBOOK`）更新时以 `package.json`、`content/site.json`、`astro.config.ts`、`.github/workflows/` 为唯一事实源。
3. 历史文档只追加“已归档”说明，不重写历史结论。
4. 知识库文章位于 `content/blog/legacy/`；`src/content/` 是冻结迁移快照，`src/content/raw/` 是不可变证据。
5. 修改后运行 `npm run kb:lint`、`npm run check:content`、`npm run build`。
