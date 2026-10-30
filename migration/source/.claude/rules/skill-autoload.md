# 技能自动加载规则

**每次任务启动时，必须读取以下技能文件以获取项目领域知识。**

这些文件位于 `.claude/skills/` 目录下，包含本项目（ThoughtLite Astro 博客主题）的核心操作指南。

## 必须加载的技能

| 技能文件 | 角度 | 何时最需要 |
|----------|------|-----------|
| `.claude/skills/site-config-mastery.md` | 配置管理 | 修改站点设置、环境变量、图标 |
| `.claude/skills/content-authoring.md` | 内容创作 | 创建/编辑文记、随笔、说明 |
| `.claude/skills/i18n-integration.md` | 国际化 | 添加新语言、翻译文件、字体配置 |
| `.claude/skills/component-patterns.md` | 组件使用 | 使用 Linkroll、Sensitive、TOC 组件 |
| `.claude/skills/multi-lang-content.md` | 多语言内容 | 翻译文章、管理多语言文件 |
| `.claude/skills/astro-theme-dev.md` | 主题开发 | 修改页面、布局、样式、路由 |

## 加载方式

在开始任何任务前，使用 Read 工具读取上述技能文件。至少读取与当前任务直接相关的技能文件，优先级：

1. **始终加载**: `astro-theme-dev.md`（项目架构全局视图）
2. **内容相关任务**: `content-authoring.md` + `multi-lang-content.md`
3. **配置相关任务**: `site-config-mastery.md` + `i18n-integration.md`
4. **组件相关任务**: `component-patterns.md`
