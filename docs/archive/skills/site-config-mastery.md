---
name: site-config-mastery
description: ThoughtLite Astro 主题站点配置完全指南，涵盖 site.config.ts、astro.config.ts、.env 三大配置体系
version: 1.0.0
source: local-docs-analysis
---

# 站点配置精通

## 配置体系概览

ThoughtLite 主题采用三层配置架构：

| 配置文件 | 职责 | 修改频率 |
|----------|------|----------|
| `.env` | 运行时环境变量 | 低 |
| `site.config.ts` | 站点业务配置 | 中 |
| `astro.config.ts` | Astro 框架配置 | 低 |

## `.env` 配置

```sh
cp .env.example .env
```

| 变量 | 必需 | 描述 |
|------|------|------|
| `PUBLIC_TIMEZONE` | ✅ | 默认显示时区，参考 [tz database](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones#List) |

## `site.config.ts` 核心字段

### 站点基础信息

```ts
export default siteConfig({
    title: "站点标题",
    prologue: "首页标语，支持\\n换行",
    author: "作者名",
    // 或对象形式：
    // author: { name: "作者名", email: "a@b.com", link: "https://..." }
    description: "站点描述",
});
```

### 版权配置

```ts
copyright: {
    type: "by-nc-sa",  // CC 许可类型
    year: "2024-2025"  // 年份或年份范围
}
```

### 订阅源配置

```ts
feed: {
    section: "*",       // "*" 表示所有板块，或 ["note", "jotting"]
    limit: 10           // 内容数量限制
}
```

### 最新内容显示

```ts
latest: {
    note: true,    // 是否显示最新文记
    jotting: true  // 是否显示最新随笔
}
```

## `astro.config.ts` 关键配置

### Markdown 插件

```ts
markdown: {
    remarkPlugins: [...],   // Markdown 处理插件
    rehypePlugins: [...]    // HTML 处理插件
}
```

### i18n 配置

```ts
i18n: {
    locales: ["en", "zh-cn", "ja"],
    defaultLocale: "zh-cn"
}
```

## 图标生成

使用 [RealFaviconGenerator](https://realfavicongenerator.net/) 生成，提取以下文件到 `/public`：

- `favicon-96x96.png`
- `favicon.ico`
- `favicon.svg`

## 首页 Logo

引用位置：`src/pages/[...locale]/index.astro`

```astro
import Logo from "$icons/site-logo.svg";
<Logo width={100} />
```

替换方式：
1. 替换 `src/icons/site-logo.svg`（建议使用 `stroke="currentColor"` 适配主题切换）
2. 改为图片导入
3. 直接删除该部分

## 常见配置陷阱

- ⚠️ **不要删除 `i18n` 配置字段**，即使只用单语言
- ⚠️ `prologue` 中的换行使用 `\\n` 而非实际换行
- ⚠️ `feed.section` 使用 `"*"` 时注意内容量是否过大
