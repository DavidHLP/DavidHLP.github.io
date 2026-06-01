---
name: astro-theme-dev
description: ThoughtLite Astro 主题开发指南，涵盖项目架构、页面路由、布局系统、样式体系
version: 1.0.0
source: local-docs-analysis
---

# Astro 主题开发指南

## 项目架构

```
src/
├── components/        # UI 组件（.astro + .svelte）
├── content/           # 内容文件（Markdown/MDX/YAML）
│   ├── note/          # 文记板块
│   ├── jotting/       # 随笔板块
│   ├── information/   # 说明板块（序文/自述/连结/政策）
│   └── preface/       # 序文板块
├── content.config.ts  # 内容集合配置
├── fonts/             # 字体配置
├── graph/             # OG 图片生成
│   ├── index.ts
│   ├── default.ts
│   └── content.ts
├── i18n/              # 国际化翻译文件
│   ├── index.ts       # 翻译注册入口
│   ├── en/
│   ├── ja/
│   └── zh-cn/
├── icons/             # SVG 图标
├── layouts/           # 布局组件
│   ├── App.astro      # 根布局（字体、全局设置）
│   ├── Base.astro     # 基础布局
│   ├── Footer.astro
│   └── header/
│       ├── Header.astro
│       ├── Menu.astro
│       ├── ThemeSwitcher.astro
│       ├── LanguagePicker.svelte
│       └── Navigator.svelte
├── pages/             # 页面路由
│   ├── 404.astro
│   ├── 500.astro
│   ├── graph.png.ts
│   ├── robots.txt.ts
│   └── [...locale]/   # 动态语言路由
│       ├── index.astro
│       ├── about.astro
│       ├── policy.astro
│       ├── preface.astro
│       ├── feed.xml.ts
│       ├── feed.xsl.ts
│       ├── note/
│       │   ├── index.astro
│       │   └── [...id]/
│       │       ├── index.astro
│       │       └── graph.png.ts
│       └── jotting/
│           ├── index.astro
│           └── [...id]/
│               ├── index.astro
│               └── graph.png.ts
├── styles/            # 全局样式
│   ├── global.css
│   └── markdown.css
└── utils/             # 工具函数
    ├── config.ts
    ├── reading.ts
    ├── time.ts
    └── mermaid.ts
```

## 路由系统

### 动态语言路由

使用 `[...locale]` 捕获语言前缀：

```
/zh-cn/note/article-id
/en/note/article-id
/ja/note/article-id
```

### 内容集合路由

文记详情页：`src/pages/[...locale]/note/[...id]/index.astro`

```
/zh-cn/note/my-article → src/content/note/zh-cn/my-article.md
```

## 布局继承

```
App.astro          # 根布局：字体、全局 meta
└── Base.astro     # 基础布局：header、footer、结构
    └── 页面       # 具体页面内容
```

## 样式体系

### CSS 变量

在 `src/styles/global.css` 中定义主题变量：

```css
:root {
    /* 亮色主题变量 */
}
[data-theme="dark"] {
    /* 暗色主题变量 */
}
```

### 字体系统

```css
:lang(zh-cn) {
    --font-serif: var(--font-noto-serif-sc);
}
:lang(ja) {
    --font-serif: var(--font-noto-serif-jp);
}
:lang(en) {
    --font-serif: var(--font-noto-serif);
}
```

## OG 图片生成

动态生成 Open Graph 图片：

- `src/graph/default.ts` - 默认 OG 图片
- `src/graph/content.ts` - 内容页 OG 图片
- `src/pages/graph.png.ts` - 全局 OG 端点
- `src/pages/[...locale]/note/[...id]/graph.png.ts` - 文记 OG 端点

## 开发命令

```bash
pnpm dev          # 开发服务器
pnpm build        # 生产构建
pnpm preview      # 预览构建结果
```

## 关键设计决策

| 决策 | 选择 | 原因 |
|------|------|------|
| UI 框架 | Astro + Svelte | Astro 零 JS 默认，Svelte 处理交互 |
| 内容格式 | Markdown + MDX | Markdown 简单，MDX 支持组件 |
| 样式方案 | CSS 变量 + 全局 CSS | 主题切换、字体系统 |
| 路由策略 | 动态 `[...locale]` | 支持多语言和单语言模式 |
| 图片处理 | 相对路径优先 | Astro 自动优化 |
