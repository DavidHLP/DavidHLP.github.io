---
name: multi-lang-content
description: ThoughtLite 主题多语言内容创作与管理指南，涵盖翻译工作流、文件组织、常见问题
version: 1.0.0
source: local-docs-analysis
---

# 多语言内容管理

## 内容目录结构

### 多语言模式（默认）

```
src/content/
├── note/
│   ├── en/              # 英文内容
│   │   ├── article.md
│   │   └── with-images/
│   │       ├── index.md
│   │       └── photo.png
│   ├── ja/              # 日文内容
│   └── zh-cn/           # 中文内容
├── jotting/
│   ├── en/
│   ├── ja/
│   └── zh-cn/
├── information/
│   ├── en/
│   │   ├── chronicle.yaml
│   │   ├── introduction.md
│   │   ├── linkroll.mdx
│   │   └── policy.md
│   ├── ja/
│   └── zh-cn/
└── preface/
    ├── en/
    ├── ja/
    └── zh-cn/
```

## 翻译工作流

### 新增文章翻译

1. 在源语言目录创建文章（如 `src/content/note/zh-cn/new-article.md`）
2. 复制到其他语言目录
3. 翻译 frontmatter 中的 `title`、`description`
4. 翻译正文内容
5. 保持相同的文件名和目录结构

### frontmatter 翻译规范

```yaml
# zh-cn
---
title: 站点配置指南
tags: [Guide, Astro]
description: Astro 主题站点的基础配置说明
---

# en
---
title: Site Configuration Guide
tags: [Guide, Astro]
description: Basic configuration guide for the Astro theme
---

# ja
---
title: サイト設定ガイド
tags: [Guide, Astro]
description: Astroテーマの基本設定ガイド
---
```

### 翻译注意事项

- ✅ 保持 `tags` 中的技术标签一致（如 `Guide`、`Astro`、`Content`）
- ✅ `timestamp` 在所有语言版本中保持一致
- ✅ 文件名在所有语言版本中保持一致
- ✅ 图片资源共享（放在同名目录下）
- ⚠️ YAML 中含冒号的 title 需要用引号包裹
- ⚠️ 避免在 title 中使用 YAML 特殊字符

## 单语言模式

当只需一种语言时：

```ts
// site.config.ts
i18n: {
    locales: ["zh-cn"],
    defaultLocale: "zh-cn"
}
```

目录结构简化为：

```
src/content/
├── note/
│   ├── article.md
│   └── with-images/
│       ├── index.md
│       └── photo.png
├── jotting/
├── information/
└── preface/
```

## 常见问题

| 问题 | 解决方案 |
|------|----------|
| YAML 解析错误 | 检查 title 是否含未转义的冒号或引号 |
| 文章不显示 | 确认文件在正确的语言目录下 |
| 图片不显示 | 检查相对路径是否正确，确认图片在同目录下 |
| 翻译不同步 | 使用 `git diff` 检查各语言版本的差异 |
| 语言切换无反应 | 检查 `site.config.ts` 的 `locales` 配置 |
