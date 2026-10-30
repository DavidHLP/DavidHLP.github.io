# ThoughtLite Astro 博客主题

本项目是基于 Astro 的多语言博客主题（ThoughtLite），支持中/英/日三语，包含文记、随笔、说明三大内容板块。

## 自动加载技能

**每次任务启动时，必须读取以下技能文件以获取项目领域知识：**

```bash
cat .claude/skills/knowledge-base.md
cat .claude/skills/site-config-mastery.md
cat .claude/skills/content-authoring.md
cat .claude/skills/i18n-integration.md
cat .claude/skills/component-patterns.md
cat .claude/skills/multi-lang-content.md
cat .claude/skills/astro-theme-dev.md
```

这些技能文件包含站点配置、内容创作、国际化、组件使用、多语言管理、主题开发等核心知识，是理解和操作本项目的基础。

## 知识库维护宪法

项目按 Karpathy LLM-Wiki 模式维护个人 AI 知识库，详细不变量和操作触发词见 `KB.md`。维护知识库前必须先读取 `KB.md` 与 `.claude/skills/knowledge-base.md`。

- `src/content/raw/{locale}/` 是不可变原始来源，LLM 只读。
- `src/content/note/{locale}/` 是有证据的 wiki 知识页。
- `src/content/jotting/{locale}/` 是待摄入收件箱，不等于稳定知识。
- `src/content/information/{locale}/kb-index.md` 与 `kb-log.md` 分别负责内容索引和 append-only 操作日志。
- 知识库以 `zh-cn` 为正典语言；首页和 `information/{locale}/introduction.md` 简历属于保护面。

## 技术栈

- **框架**: Astro + Svelte
- **样式**: CSS 变量 + 全局 CSS
- **内容**: Markdown / MDX / YAML
- **包管理**: pnpm
- **部署**: GitHub Pages

## 关键目录

| 目录 | 用途 |
|------|------|
| `src/content/note/` | 文记板块 |
| `src/content/jotting/` | 随笔板块 |
| `src/content/information/` | 说明板块 |
| `src/content/preface/` | 序文 |
| `src/i18n/` | 国际化翻译 |
| `src/components/` | UI 组件 |
| `src/pages/[...locale]/` | 动态语言路由 |
| `site.config.ts` | 站点业务配置 |
| `astro.config.ts` | Astro 框架配置 |
