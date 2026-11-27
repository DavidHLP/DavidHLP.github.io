# 技能自动加载规则

**每次任务启动时，必须读取以下现行技能文件与分类登记。**

## 必须加载

| 文件 | 角度 | 何时最需要 |
|------|------|-----------|
| `.claude/skills/knowledge-base.md` | 知识库维护 | 维护 `content/blog/legacy/`、`src/content/raw/`、索引与日志 |
| `docs/DOCUMENT-CLASSIFICATION.md` | 文档分类 | 判断任何文档的层、域、状态与处置 |
| `KB.md` | 知识库宪法 | ingest / query / lint 前 |

## 已归档技能（不再自动加载）

以下文件描述已删除的旧站点结构，已移至 `docs/archive/skills/`，仅作历史参考：

`site-config-mastery.md`、`content-authoring.md`、`i18n-integration.md`、`component-patterns.md`、`multi-lang-content.md`、`astro-theme-dev.md`、`markdown-writing-rules.md`。

当前事实源：`content/site.json`、`src/content.config.ts`、`astro.config.ts`、`package.json`、`docs/DOCUMENT-CLASSIFICATION.md`。
