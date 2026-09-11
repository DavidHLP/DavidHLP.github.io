# DavidHLPL · ThoughtLite 知识库

[English](README.md) · [简体中文](README.zh-cn.md) · [日本語](README.ja.md)

DavidHLPL 是一个基于 Astro 构建的多语言个人博客与有证据支撑的 AI 知识库。本项目沿用 [ThoughtLite](https://github.com/tuyuritio/astro-theme-thought-lite) 的内容工作流，并在本仓库维护自己的内容、翻译和知识库规则。

已发布的文记与随笔会生成带语言前缀的页面和 Feed。本项目是静态站点，不需要数据库、API Key 或后端服务。

## 特性

- **有证据支撑的知识库** — 稳定的 `note` 页面、轻量的 `jotting` 随笔和不可变的 `raw` 原始来源遵循项目的内容维护流程。
- **Astro 内容管道** — 支持 Markdown/MDX、代码高亮、数学公式、Mermaid、表格、图片、脚注、阅读时间和自动标题。
- **多语言路由** — 支持英文、简体中文和日文，知识库以 `zh-cn` 为正典语言。
- **主题与响应式体验** — 亮色/暗色主题、自适应布局、触摸友好的导航，以及减少动态效果偏好。
- **静态发布能力** — 自动生成 Atom Feed、站点地图和 Open Graph 元数据，输出的 `dist/` 可部署到 GitHub Pages 或其他静态托管平台。
- **内容保护规则** — 原始来源和知识库日志与公开集合分离，并遵循仓库中记录的不变量。

## 快速开始

### 环境要求

- Node.js 22.12 或更高版本。
- `package.json` 声明的 pnpm 10.30.0。

### 安装并启动

```sh
git clone https://github.com/DavidHLP/DavidHLP.github.io.git
cd DavidHLP.github.io
pnpm install --frozen-lockfile
pnpm dev
```

打开 Astro 输出的地址，通常是 [`http://localhost:4321`](http://localhost:4321)。如果本地环境无法正确解析 `localhost`，可以使用：

```sh
pnpm dev --host 127.0.0.1
```

### 构建与预览

```sh
pnpm build
pnpm preview
```

生产站点输出到 `dist/`。请通过 HTTP 服务访问它，不要直接双击 `dist/index.html`。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `pnpm install --frozen-lockfile` | 按锁文件安装依赖 |
| `pnpm new` | 通过项目辅助脚本创建新的内容文件 |
| `pnpm dev` | 启动 Astro 开发服务器，默认端口为 4321 |
| `pnpm check` | 执行 Astro 和 TypeScript 检查 |
| `pnpm test:run` | 一次性运行 Vitest 测试套件 |
| `pnpm build` | 构建静态生产站点 |
| `pnpm preview` | 本地预览构建结果 |
| `pnpm format` | 使用 Biome 格式化支持的源文件 |
| `pnpm lint` | 执行 Biome 代码检查 |
| `pnpm kb:lint` | 检查知识库证据和索引不变量 |
| `node scripts/editorial-smoke.mjs` | 构建后检查生成路由、landmark、布局和必要资源 |

## 项目结构

| 路径 | 职责 |
| --- | --- |
| `src/content/note/{locale}/` | 有证据支撑的稳定知识页 |
| `src/content/jotting/{locale}/` | 轻量随笔和知识库待摄入收件箱 |
| `src/content/information/{locale}/` | 自述、政策、连结、编年、知识库索引和日志 |
| `src/content/preface/{locale}/` | 站点序文内容 |
| `src/content/raw/{locale}/` | 知识库不可变原始来源，不属于公开集合 |
| `src/i18n/` | `en`、`zh-cn` 和 `ja` 的界面翻译资源 |
| `src/components/` | 可复用的 Astro 和 Svelte UI 组件 |
| `src/pages/[...locale]/` | 首页、内容、Feed 和说明页的多语言路由 |
| `src/layouts/` | 共用页面和文档布局 |
| `site.config.ts` | 站点身份、语言、内容、分页和 Feed 配置 |
| `astro.config.ts` | Astro 集成、Markdown/MDX 处理、路由、站点地图和构建行为 |

## 内容与知识库

已发布内容按语言和集合组织：

- `note`：结构化的技术与工程知识。
- `jotting`：轻量观察和等待编译为稳定知识页的材料。
- `information`：自述、政策、连结、编年以及知识库索引/日志。
- `preface`：站点序文。
- `raw`：不可变证据层，不作为公开内容列出。

知识库以 `zh-cn` 为正典语言；只有在需要多语言输出时才维护英文和日文译文。新增已发布内容后，页面和 Feed 会在下一次构建时自动更新。

## 配置

主要配置入口如下：

- [`site.config.ts`](site.config.ts) — 站点身份、作者、描述、语言、分页、Feed 和最新内容设置。
- [`astro.config.ts`](astro.config.ts) — Astro 集成、Markdown/MDX 处理、多语言路由、别名、站点地图和构建行为。
- [`src/i18n/`](src/i18n/) — 界面翻译和标签。

## 部署与验证

仓库已配置 GitHub Pages 部署。推送到 `main` 后，部署工作流会先复用验证工作流；验证通过后才安装锁定的 pnpm 依赖、构建 `dist/`、添加 `.nojekyll`，再通过 GitHub Pages 发布。

验证工作流会执行 Biome 检查、类型检查、单元测试、静态构建、编辑内容 smoke 检查、已提交 SVG 检查，以及桌面和移动宽度下关于页的浏览器/打印 smoke 检查。

本地验证可以运行：

```sh
pnpm check
pnpm test:run
pnpm build
node scripts/editorial-smoke.mjs
```

## 上游与许可证

本仓库基于 [ThoughtLite](https://github.com/tuyuritio/astro-theme-thought-lite) 的 Astro 内容主题基础构建，可参阅[上游 README](https://raw.githubusercontent.com/tuyuritio/astro-theme-thought-lite/refs/heads/main/README.md)。本项目继续使用 [GPLv3](LICENSE)。

[RhineLabUI](https://github.com/LBEILC/RhineLabUI) 作为未来档案功能的外部参考保留，可参阅其[上游 README](https://raw.githubusercontent.com/LBEILC/RhineLabUI/refs/heads/main/README.md)。本仓库当前不包含 RhineLabUI 的界面、资源或许可证文件。

## 参考

- [DavidHLPL](https://github.com/DavidHLP)
- [DavidHLP.github.io](https://github.com/DavidHLP/DavidHLP.github.io)
- [ThoughtLite](https://github.com/tuyuritio/astro-theme-thought-lite)
- [RhineLabUI](https://github.com/LBEILC/RhineLabUI)
