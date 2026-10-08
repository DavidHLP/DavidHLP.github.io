# Rhine Lab · Astro 博客模板

基于 [LBEILC/RhineLabUI](https://github.com/LBEILC/RhineLabUI) 的网页视觉与交互，迁移为 Astro 静态博客。保留原生 Three.js 档案阵列、开场、玻璃材质、解密、360° 查看器、检索、收藏、声音与响应式布局。本文档对应网页模板；壁纸独立工程不在维护范围。

## 开始使用

要求 Node.js 22.12 或更新的受支持版本。先修改 `content/site.json` 的 `site` 为自己的 HTTPS 站点地址，再安装运行：

```sh
npm install
npm run dev
```

```sh
npm run build
npm run preview
```

Astro 生成 `dist/`，可部署至任意静态主机。首页仍是原有三维档案入口；文章位于 `/blog/<文件名>/`，RSS 位于 `/rss.xml`，站点地图位于 `/sitemap-index.xml`。禁用 JavaScript 时可直接阅读静态文章与目录。

## 写文章

在 `content/blog/` 添加 Markdown 文件。现有 40 篇档案已迁移为示例文章，原编号和分类顺序保持不变；示例统一使用 2026-09-10 作为模板发布日期，并不表示原文的实际发布日期。

```yaml
---
archiveId: X-041
title: 我的第一篇文章
en: FIRST RESEARCH NOTE
category: 机构档案
department: 写作工作室
date: "2026"
lead: 作者名称
clearance: PUBLIC
abstract: 用于检索、SEO 和订阅的简短摘要。
findings:
  - 可放补充说明，显示在研究记录页签。
source: https://example.com
pubDate: 2026-10-07
tags:
  - 笔记
draft: false
---

这里开始写正文，支持标题、链接、图片、代码块和表格。
```

文件名决定网址，`archiveId` 决定收藏和档案标签身份。发布后尽量保持二者稳定。编号唯一，格式为 `X-` 加至少三位数字；无需连续。草稿不进入目录、路由、RSS 或离线包。

保留五列构图：在 `content/site.json` 修改 `columns` 和 `categories`（必须是同一组五个分类），每列至少一篇已发布文章。每列数量可以不同，导航刻度自动调整。日期 `date` 是原界面的编目文字，`pubDate` 是博客发布日期，可另设 `updatedDate`。

正文进入原来的“概述”页签，`findings` 进入“研究记录”。进入详情会更新文章地址，浏览器后退／前进和直接打开文章地址保留选档语义。TXT 导出共用 Markdown 内容；开发中修改文章后执行 `npm run export:archives` 更新下载文件，正式构建自动完成。

## 配置与结构

| 路径 | 用途 |
| --- | --- |
| `astro.config.ts` | Astro 静态构建、站点地图、版本化模型资源 |
| `content/site.json` | 站点元数据与五列分类 |
| `content/blog/*.md` | 博客内容的唯一编辑入口 |
| `src/content.config.ts` | Astro 内容集合与字段校验 |
| `src/pages/` | 首页、文章路由、RSS、404 |
| `src/layouts/Terminal.astro` | 页面元数据、静态正文、原生客户端入口 |
| `src/main.ts` | 原有终端交互与文章地址同步 |
| `src/scene.ts`、`src/model-viewer.ts` | 保留的 Three.js 场景 |

## 验证与部署

```sh
npm run check
npm run check:content
npm run check:viewport
npm run build
```

PWA 离线包包含首页、全部已发布文章、RSS、模型、字体和 TXT。新版本仍由用户选择更新，保留收藏与偏好。静态主机应对页面、RSS、Service Worker 使用重新验证策略；模型和字体保留已有缓存规则。

`npm run build:cloudflare` 生成 Pages 静态发行包。模板可直接部署 `dist/`，或使用 `release/cloudflare/` 中的发行目录；没有 Novecento 授权包时沿用原固定字形图形。已有授权包保留校验，不要将授权包提交到 Git。构建配置见 [部署说明](docs/CLOUDFLARE-DEPLOYMENT.md)。

## 视觉与来源

继续采用原生实现，不引入前端组件框架或更换视觉主题。三维资产、MiSans、音频及来源署名沿用原项目，详见 [LICENSE](LICENSE)、[字体来源](public/fonts/)、[音频来源](public/audio/README.md) 和 [网页优化贡献署名](PR15-ATTRIBUTION.md)。运行模型、字体和音频保持原样；旧实验、参考素材和美术源工程可从 Git 历史查看。
