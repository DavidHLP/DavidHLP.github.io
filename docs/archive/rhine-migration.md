# RhineLabUI 博客适配

2026-09-11：按站点所有者要求，用 RhineLabUI 替换原博客展示设计，保留文章内容与原有文章链接。

## 来源

- 上游：https://github.com/LBEILC/RhineLabUI
- 固定版本：`8799b03179a9a0ebd2611843e644a5a0530b24bf`
- 界面源码：`src/rhine/`；模型、音频和 MiSans 字体来自上游 `public/`。
- MIT 许可：`public/licenses/RhineLabUI-MIT.txt`。字体许可与来源说明保存在 `public/fonts/`，音频说明保存在 `public/audio/`。
- `patches/` 保留上游 rolling-number 0.4.1 的投影视图文字尺寸修复，通过 pnpm 锁文件复现。

## 内容与路由

`RhineArchive.astro` 在构建时使用现有 `listBySections` 读取当前语言的已发布文记和随笔；不发布草稿、下划线文件或 raw 原始来源。只序列化标题、日期、标签、摘要和原文地址；敏感文章的摘要不进入界面。

首页、`/note`、`/jotting` 及语言版本直接运行上游 Three.js 界面。档案详情展示文章元数据并链接原有全文页面。正文继续使用 Astro Markdown/MDX 管道，保留图片、代码、数学公式和目录。阅读页、关于页、政策页与错误页使用统一的档案风格页头和排版。

三维导航改为实际存在的栏目，支持不同栏目文章数量不一致和超过 32 行的数据；刻度只显示当前位置附近 11 项，完整文章可通过检索或 HTML 目录访问。收藏使用文章 URL，避免新增文章后编号变化导致收藏错位。

没有文章、JavaScript 不可用或 WebGL 加载失败时提供静态文章目录。三维页面使用整页导航，不使用 Swup，防止 WebGL 场景和事件监听器跨页面累积。未启用上游 PWA 和 Wallpaper Engine 宿主功能。音频默认关闭，可在设置中启用。

## 备份与恢复

本地完整快照：`backups/davidhlp-before-rhine-20260911.tar.gz`（已排除 Git、依赖、构建产物和本地代理缓存）。该目录不提交、不部署。

恢复时先解压到独立目录核对；不要直接覆盖后续新增内容。文章与附件已通过 `tar -dzf backups/davidhlp-before-rhine-20260911.tar.gz ./src/content ./public` 在迁移初期验证一致；后续新增上游资源不影响原文件。

开发：`pnpm dev`。检查：`pnpm check`、`pnpm test:run`、`pnpm build`。部署仍使用 GitHub Pages 工作流。

## 本次验证

- 备份 SHA-256：`4b1f3292698717a39255f3bf297822a034467d49925850d58571e635605341a3`。
- 原 `src/content/` 和 `public/` 文件与备份比对一致；未修改文章或附件。
- Astro 检查：0 errors、0 warnings，保留上游与原代码的 4 个弃用提示。
- 单元测试：143 passed，1 skipped。
- 静态构建：97 页；smoke 检查覆盖三种语言、148 个目录链接和必需模型/许可证。
- 浏览器实测：三维首页、不等长栏目切换、末尾文章检索、摘要到全文、桌面与 390px 竖屏阅读；未发现浏览器运行错误。
- 尚未在实体手机验证 GPU 性能，未提交 Git 或部署线上。
