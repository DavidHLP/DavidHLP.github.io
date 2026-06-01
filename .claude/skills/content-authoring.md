---
name: content-authoring
description: ThoughtLite 主题内容创作工作流，涵盖文记、随笔、说明三大板块的创作规范和最佳实践
version: 1.0.0
source: local-docs-analysis
---

# 内容创作工作流

## 三大内容板块

| 板块 | 目录 | 定位 | 内容特征 |
|------|------|------|----------|
| 文记 (Note) | `src/content/note/` | 核心长文 | 深度、结构完整、论述深入 |
| 随笔 (Jotting) | `src/content/jotting/` | 轻量记录 | 短小、即时、零散思绪 |
| 说明 (Information) | `src/content/information/` | 站点说明 | 序文、自述、连结、政策 |

## Frontmatter 规范

### 文记 (Note)

```yaml
---
title: 文章标题
timestamp: 2025-04-04 00:00:00+00:00
series: Astro          # 系列名（可选）
tags: [Tag1, Tag2]
description: 文章描述
toc: true              # 启用目录（可选）
sensitive: false       # 敏感内容标记（可选）
---
```

### 随笔 (Jotting)

```yaml
---
title: 随笔标题
timestamp: 2025-04-04 00:00:00+00:00
tags: [Tag]
description: 简短描述
---
```

## 内容目录结构

### 多语言模式（默认）

```
src/content/
├── note/
│   ├── en/
│   │   ├── article.md
│   │   └── image-post/
│   │       ├── index.md
│   │       └── photo.png
│   ├── ja/
│   └── zh-cn/
├── jotting/
│   ├── en/
│   ├── ja/
│   └── zh-cn/
└── information/
    ├── en/
    ├── ja/
    └── zh-cn/
```

### 单语言模式

```
src/content/
├── note/
│   ├── article.md
│   └── image-post/
│       ├── index.md
│       └── photo.png
├── jotting/
└── information/
```

## 图片插入三种方式

### 1. 相对路径（推荐）

```
image-post/
├── index.md
└── photo.png
```

```md
![图片描述](photo.png)
```

✅ Astro 自动优化处理，利于内容组织管理。

### 2. 绝对路径（不推荐）

```md
![图片描述](/photo.png)
```

❌ 放在 `/public` 下，Astro 不做优化。

### 3. 外部图床

```md
![图片描述](https://image.host/photo.png)
```

⚠️ 依赖外部服务可用性。

## 说明板块四大组件

### 序文 (Preface)

- 目录：`src/content/preface/{locale}/`
- 用途：首页展示，传递站点情感与最新动态
- 建议：使用时间戳或序号命名文件（如 `2025-04-13-04-26-40.md`）
- 仅显示最新一篇，点击日期可查看历史

### 自述 (Introduction)

- 目录：`src/content/information/{locale}/introduction.md`
- 用途：展示站点特色、价值主张、个人简历

### 连结 (Linkroll)

- 目录：`src/content/information/{locale}/linkroll.mdx`
- 用途：友情链接与推荐站点
- 使用 `Linkroll` MDX 组件

### 政策 (Policy)

- 目录：`src/content/information/{locale}/policy.md`
- 用途：隐私政策、服务条款、免责声明

## 敏感内容标记

在 frontmatter 中添加 `sensitive: true`：

```yaml
---
title: 敏感内容示例
sensitive: true
---
```

访问时将显示内容警告，用户需确认后才能查看。

## 创作检查清单

- [ ] 选择了正确的板块（文记/随笔/说明）
- [ ] Frontmatter 包含必填字段（title, timestamp, tags, description）
- [ ] 图片使用相对路径方式引用
- [ ] 多语言模式下文件放在正确的语言目录
- [ ] 长文启用 `toc: true` 生成目录
- [ ] 敏感内容标记 `sensitive: true`
