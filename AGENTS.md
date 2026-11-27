# DavidHLPL blog using RhineLabUI-Astro

- This repository is the personal blog. `DavidHLP/RhineLabUI-Astro` is the generic upstream template; never move personal blog content or site configuration into that template.
- Preserve the existing Git repository, history, domain and GitHub Pages deployment. Merge upstream template changes on task branches.
- Blog configuration lives in `content/site.json`; editable template-compatible articles live in `content/blog/`. Preserve archive IDs, URLs, draft flags, languages and original metadata.
- `src/content/` and `migration/source/` preserve the original documents. Existing raw evidence is immutable and must not be edited, deleted or published as blog articles. Repository maintenance documents are archival, not blog posts. Follow `KB.md` for knowledge maintenance.
- Preserve the original personal introduction, linkroll, chronology, policy, notes and append-only knowledge log. Template migration does not authorize rewriting their substance.
- Keep five nonempty archive columns and preserve the native Three.js models, materials, light, camera, opening, free-plane drag, inertia, loop and per-column selection memory. Do not use frontend or animation design skills.
- Keep model extraction height and plane coordinates unchanged; portrait reading uses the model above independent body text. Distinguish browser emulation from real iPhone validation.
- Preserve model/font/audio licenses and attribution. Never commit individually licensed Novecento fonts.
- Run installation, builds, checks and services on `remote-dev`. Required checks: `npm run build`, `npm run check:content`, `npm run check:viewport`; run `npm run build:cloudflare` for packaging changes.
- Keep the GitHub Pages workflow functional. Finish authorized development through a task branch, validation, PR, CI/review and merge, without mixing unrelated changes.

## 站点项目说明

本项目是基于 Astro 的多语言博客与个人 AI 知识库，支持中/英/日三语。首页、About 与知识库共用 `content/blog/legacy/` 的发布内容；`src/content/` 是冻结迁移快照。

### 自动加载技能

**维护知识库或内容前，必须读取：**

```bash
cat KB.md
cat .claude/skills/knowledge-base.md
```

`site-config-mastery.md`、`content-authoring.md`、`i18n-integration.md`、`component-patterns.md`、`multi-lang-content.md`、`astro-theme-dev.md`、`markdown-writing-rules.md` 属于 ThoughtLite 时代文档，已移至 `docs/archive/skills/`；当前事实源是 `content/site.json`、`src/content.config.ts`、`docs/DOCUMENT-CLASSIFICATION.md`。

### 知识库维护宪法

项目按 Karpathy LLM-Wiki 模式维护个人 AI 知识库，详细不变量和操作触发词见 `KB.md`。维护知识库前必须先读取 `KB.md` 与 `.claude/skills/knowledge-base.md`。

- `src/content/raw/zh-cn/` 是不可变原始来源，LLM 只读。
- `content/blog/legacy/note/{locale}/` 是有证据的 wiki 知识页（线上正典）。
- `content/blog/legacy/jotting/{locale}/` 是待摄入收件箱，不等于稳定知识。
- `content/blog/legacy/information/{locale}/kb-index.md` 与 `kb-log.md` 分别负责内容索引和 append-only 操作日志。
- `src/content/{note,information,jotting,preface}/` 冻结于 `f49953fb`，只读。
- 知识库以 `zh-cn` 为正典语言；首页和 `content/blog/legacy/information/{locale}/introduction.md` 的个人介绍页属于保护面。

### 技术栈

- **框架**: Astro + Three.js
- **样式**: 全局 CSS + CSS 变量
- **内容**: Markdown（`content/blog/legacy/`）+ JSON 配置
- **包管理**: npm（`package-lock.json`）
- **部署**: GitHub Pages（Cloudflare 打包可选）

### 关键目录

| 目录 | 用途 |
|------|------|
| `content/blog/legacy/note/` | 知识库 Wiki 正典 |
| `content/blog/legacy/jotting/` | 待摄入收件箱 |
| `content/blog/legacy/information/` | 索引、日志、About 与政策 |
| `content/blog/legacy/preface/` | 序文 |
| `src/content/raw/zh-cn/` | 不可变 raw 证据 |
| `src/content/` | 冻结迁移快照（只读） |
| `src/pages/` | 路由（`/blog/[...slug]`、`/about`、`/kb`） |
| `content/site.json` | 站点标题、五列分类与 About 入口 |
| `docs/DOCUMENT-CLASSIFICATION.md` | 全仓文档分类登记 |

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles map to the same label strings. See `docs/agents/triage-labels.md`.

### Domain docs

Current vocabulary lives in `content/locales.json` and `docs/DOCUMENT-CLASSIFICATION.md`. `docs/archive/GLOSSARY.md` and `docs/archive/adr/` are historical ThoughtLite artifacts. See `docs/agents/domain.md`.
