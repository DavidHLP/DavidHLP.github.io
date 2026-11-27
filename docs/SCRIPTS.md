# Script Reference

本文件是 `package.json` 中 npm 脚本的映射说明，不复制实现细节；命令以 `package.json` 与 `package-lock.json` 为唯一事实源。

## 命令清单

| 命令 | 作用 |
|---|---|
| `npm install` | 安装依赖，并触发 `postinstall` |
| `npm run postinstall` | 安装后给 `@kitlangton/rolling-number` 打补丁 |
| `npm run predev` | 开发前打补丁并导出档案记录 |
| `npm run dev` | 启动开发服务器（`127.0.0.1:4321`），启动前执行 `predev` |
| `npm run prebuild` | 构建前打补丁、导出档案记录并准备网页字体 |
| `npm run build` | 类型检查、静态构建并生成 PWA 产物，构建前执行 `prebuild` |
| `npm run preview` | 预览 `dist/`（`127.0.0.1:4321`） |
| `npm run check` | 运行 `astro check` 类型检查 |
| `npm run check:content` | 运行内容校验与 Fuwari 归档校验 |
| `npm run check:viewport` | 检查视口相关约束 |
| `npm run export:archives` | 重新生成 `public/archives/*.txt` |
| `npm run build:cloudflare` | 构建后打包 Cloudflare 静态包 |
| `npm run format` | 用 Prettier 格式化 `src`、`scripts`、`content` 与配置文件 |
| `npm run kb:lint` | 校验知识库证据与索引不变量 |
| `npm run kb:ingest` | 增量摄入本地编码会话记录（默认 dry run） |
| `npm run test:kb` | 运行知识库摄入测试（Vitest） |

## 生命周期钩子

- `postinstall`：运行 `scripts/patch-rolling-number.mjs`，给 `@kitlangton/rolling-number` 打补丁。
- `predev`：再次打补丁，并运行 `scripts/export-records.mjs` 导出档案记录。
- `prebuild`：打补丁、导出档案记录，并运行 `scripts/prepare-webfonts.mjs` 准备网页字体。

`npm run dev`、`npm run build` 与 `npm run build:cloudflare` 会自动触发对应钩子，无需单独调用。

## 使用说明

- 开发：`npm ci` 后运行 `npm run dev`。
- 提交前：`npm run check:content`、`npm run check:viewport`、`npm run kb:lint`、`npm run test:kb`。
- 发布构建：`npm run build`；需要 Cloudflare 静态包时运行 `npm run build:cloudflare`。
- 格式化：`npm run format`（Prettier）。
- 知识库摄入：默认只读 dry run；只有显式 `--write` 才写入已忽略的 `.agent/` 检查点。

## CI

`.github/workflows/astro.yml`（Astro blog）：

- 触发：推送到 `main` 与 Pull Request。
- 步骤：`npm ci` → `npm run build:cloudflare` → `check:content` → `check:viewport` → `kb:lint` → `test:kb` → 安装 Playwright → `scripts/check-about-browser.mjs` → 上传 About 浏览器证据。

`.github/workflows/deploy.yml`（Deploy blog to GitHub Pages）：

- 触发：推送到 `main` 或手动 `workflow_dispatch`。
- 步骤：`npm ci` → `npm run build` → `check:content` → `check:viewport` → `kb:lint` → `test:kb` → 上传 `dist/` → 发布到 GitHub Pages。
- 运行时：Node.js 22，npm 缓存。

两个工作流都以 `npm` 和 `package-lock.json` 为准。
