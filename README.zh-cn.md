# DavidHLPL · Archive OS

[English](README.md) · [简体中文](README.zh-cn.md) · [日本語](README.ja.md)

DavidHLPL 是一个多语言个人博客与有证据支撑的 AI 知识库。站点保留 [ThoughtLite](https://github.com/tuyuritio/astro-theme-thought-lite) 的内容工作流，并将 [RhineLabUI](https://github.com/LBEILC/RhineLabUI) 的可交互三维档案终端适配到 Astro 站点中。

站点保留现有 Markdown/MDX 内容和文章地址，同时把已发布的文记与随笔呈现为可检索的档案体验。

> 本项目是静态 Astro 站点，不需要数据库、API Key 或后端服务。完整档案界面需要支持 WebGL 2 的现代浏览器；当 JavaScript 或 WebGL 不可用时，仍提供 HTML 文章目录。

## 特性

- **可交互的档案操作系统** — Three.js 开场、档案浏览、分类与关键词检索、文章详情、收藏、文本导出，以及带解密和拆解交互的 360° 模型查看器。
- **内容驱动的档案** — 构建时从当前语言已发布的 `note` 和 `jotting` 内容生成档案记录；草稿、下划线文件和 raw 原始来源不会进入公开档案。
- **Astro 内容管道** — 支持 Markdown/MDX、代码高亮、数学公式、Mermaid、表格、图片、脚注、阅读时间和自动标题。
- **多语言路由** — 支持英文、简体中文和日文，知识库以 `zh-cn` 为正典语言。
- **主题与响应式体验** — 亮色/暗色主题、自适应布局、触摸友好的导航，以及减少动态效果偏好。
- **静态发布能力** — 自动生成 Atom Feed、站点地图和 Open Graph 元数据，输出的 `dist/` 可部署到 GitHub Pages 或其他静态托管平台。
- **可降级访问** — 空档案、禁用 JavaScript 或 WebGL 加载失败时，仍可使用构建生成的 HTML 文章目录。

嵌入的 Rhine 界面已针对本博客适配。上游项目的独立 PWA 和 Wallpaper Engine 宿主功能未在本项目中启用。

## 快速开始

### 环境要求

- Node.js 22.12 或更高版本。
- pnpm 10.30.0，版本由 `package.json` 声明。
- 如需完整三维档案体验，需要支持 WebGL 2 的现代浏览器。

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

正常开发和生产构建不需要后端服务、数据库或 API Key。

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
| `node scripts/editorial-smoke.mjs` | 构建后检查路由、档案记录、资源和许可证 |

## 项目结构

| 路径 | 职责 |
| --- | --- |
| `src/components/RhineArchive.astro` | 将 Astro 内容集合接入档案界面，并提供 HTML 降级目录 |
| `src/rhine/` | 适配后的 Three.js 档案 UI、开场、模型查看器、音频、动效和渲染设置 |
| `src/content/note/{locale}/` | 有证据支撑的稳定知识页 |
| `src/content/jotting/{locale}/` | 轻量随笔和知识库待摄入收件箱 |
| `src/content/information/{locale}/` | 自述、政策、连结、编年、知识库索引和日志 |
| `src/content/preface/{locale}/` | 站点序文内容 |
| `src/content/raw/{locale}/` | 知识库的不可变原始来源，不属于公开档案集合 |
| `src/i18n/` | `en`、`zh-cn` 和 `ja` 的界面翻译资源 |
| `src/pages/[...locale]/` | 首页、档案、内容、Feed 和说明页的多语言路由 |
| `public/assets/` | 运行时模型和其他档案资源 |
| `public/audio/` | 档案音频、来源说明和生成元数据 |
| `public/fonts/` | MiSans 网页字体及其声明/许可证 |
| `public/licenses/` | 集成界面使用的第三方许可证文本 |
| `docs/rhine-migration.md` | 迁移范围、内容映射、降级行为和验证记录 |

## 内容与知识库

已发布内容按语言和集合组织：

- `note`：结构化的技术与工程知识。
- `jotting`：轻量观察和等待编译为稳定知识页的材料。
- `information`：自述、政策、连结、编年以及知识库索引/日志。
- `preface`：站点序文。
- `raw`：不可变证据层，不作为公开内容列出。

知识库以 `zh-cn` 为正典语言；只有在需要多语言输出时才维护英文和日文译文。新增已发布内容后，档案列表和 Feed 会在下一次构建时自动更新。

## 配置

主要配置入口如下：

- [`site.config.ts`](site.config.ts) — 站点身份、作者、描述、语言、分页、Feed 和最新内容设置。
- [`astro.config.ts`](astro.config.ts) — Astro 集成、Markdown/MDX 处理、多语言路由、别名、站点地图和构建行为。
- [`src/i18n/`](src/i18n/) — 界面翻译和标签。

## 部署与验证

仓库已配置 GitHub Pages 部署。推送到 `main` 后，部署工作流会先复用验证工作流；验证通过后才安装锁定的 pnpm 依赖、构建 `dist/`、添加 `.nojekyll`，再通过 GitHub Pages 发布。

验证工作流会执行 Biome 检查、类型检查、单元测试、静态构建、档案/资源 smoke 检查、SVG 检查，以及桌面和移动宽度下的关于页浏览器检查。

本地验证可以运行：

```sh
pnpm check
pnpm test:run
pnpm build
node scripts/editorial-smoke.mjs
```

## 上游与许可证

本仓库由两个上游层和本站自己的内容/集成代码组成：

- [ThoughtLite](https://github.com/tuyuritio/astro-theme-thought-lite) 提供原始 Astro 内容主题基础，可参阅[上游 README](https://raw.githubusercontent.com/tuyuritio/astro-theme-thought-lite/refs/heads/main/README.md)。本项目继续使用 [GPLv3](LICENSE)。
- [RhineLabUI](https://github.com/LBEILC/RhineLabUI) 提供适配后的 Three.js 档案界面。集成源码位于 `src/rhine/`，固定于经过审阅的提交 `8799b03179a9a0ebd2611843e644a5a0530b24bf`。可参阅[上游 README](https://raw.githubusercontent.com/LBEILC/RhineLabUI/refs/heads/main/README.md)和本地 [MIT 许可证声明](public/licenses/RhineLabUI-MIT.txt)。

RhineLabUI 的 MIT 声明只适用于其覆盖的适配界面代码，不会自动将本仓库的所有文件和资源重新授权为 MIT。MiSans、Rolling Number、音频文件、其他依赖，以及相关作品的名称、标志、模型和源素材仍适用各自的权利和声明。详见：

- [`public/fonts/NOTICE.txt`](public/fonts/NOTICE.txt) 与 [`public/fonts/MiSans-license.pdf`](public/fonts/MiSans-license.pdf)
- [`public/audio/README.md`](public/audio/README.md)
- [`public/licenses/rolling-number.txt`](public/licenses/rolling-number.txt)
- [`public/licenses/RhineLabUI-MIT.txt`](public/licenses/RhineLabUI-MIT.txt)
- [`docs/rhine-migration.md`](docs/rhine-migration.md)

原始 RhineLabUI 是非官方的界面复刻项目，与相关游戏、角色、标志或源视频的权利人不存在隶属关系。相关第三方作品的权利仍归各自权利人所有。

## 参考

- [DavidHLPL](https://github.com/DavidHLP)
- [DavidHLP.github.io](https://github.com/DavidHLP/DavidHLP.github.io)
- [ThoughtLite](https://github.com/tuyuritio/astro-theme-thought-lite)
- [RhineLabUI](https://github.com/LBEILC/RhineLabUI)
