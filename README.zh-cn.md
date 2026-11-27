# DavidHLPL 博客

[English](README.md) · [简体中文](README.zh-cn.md) · [日本語](README.ja.md)

[davidhlp.github.io](https://davidhlp.github.io) 上的个人博客与工程知识库，基于 [RhineLabUI-Astro 上游模板](https://github.com/DavidHLP/RhineLabUI-Astro)构建。

仓库保留博客原始文档、许可证与 Git 历史。站长已批准发布既有的 74 份英文/日文译文，具体变更记录在 [publication overrides](migration/publication-overrides.json) 中；来源快照与原始草稿元数据保持不变。现有 67 个文章组均已发布三种语言版本，模板示例文章仍不纳入。详见[迁移说明与清单](migration/README.md)。

语言路由、目录、下载与校验见[全内容语言切换](docs/I18N.md)。

## 开发

需要 Node.js 22.12 或更高版本；依赖安装、构建与检查均在 `remote-dev` 上执行：

```sh
npm ci
npm run dev
npm run build
npm run check:content
npm run check:viewport
```

`content/site.json` 配置站点身份与五个档案栏目。可编辑文章位于 `content/blog/legacy/`。原始 `src/content/` 文档与 `migration/source/` 快照保持只读。构建产物包含 RSS、搜索、离线阅读与 TXT 下载。GitHub Pages 工作流在验证通过后从 `main` 部署 `dist/`。

## 项目结构

| 路径 | 职责 |
|---|---|
| `content/blog/legacy/` | 可编辑并发布的文章（note、jotting、information、preface） |
| `src/content/` | 冻结的迁移快照，只读 |
| `src/content/raw/` | 不可变原始证据，只读 |
| `src/pages/` | 路由（`/blog/[...slug]`、`/about`、`/kb`、`/rss.xml`） |
| `content/site.json` | 站点标题、五列分类与 About 入口 |
| `docs/` | 仓库维护文档，不发布为文章 |

## 上游模板

```sh
git remote add upstream git@github.com:DavidHLP/RhineLabUI-Astro.git
git fetch upstream
```

模板历史已包含在本仓库中，后续上游变更在任务分支上合并，并与博客专属配置一起审查。GitHub 仓库本身保留，不删除重建。

原始博客的 GPL 许可证、内容政策与第三方素材署名继续适用。上游模板的 MIT 声明收录于 `public/licenses/`。

## About 与个人档案

访问 `/about/`、`/en/about/` 或 `/ja/about/`。编辑现有的 `content/blog/legacy/information/{zh-cn,en,ja}/introduction.md`：身份信息位于其 `profile` frontmatter，履历保留在同一正文中，不再维护第二份副本。参见 [About 配置](docs/ABOUT.md) 与 [验收清单](docs/ABOUT-ACCEPTANCE.md)。
