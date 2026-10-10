# 静态部署

先将 `content/site.json` 的 `site` 设置为自己的完整 HTTPS 域名。

Cloudflare Pages 连接本模板仓库：Node.js 22.12 或更新版本，构建命令 `npm run build:cloudflare`，输出目录 `release/cloudflare/site`。Pages 的 `CF_PAGES=1` 环境会选择该固定目录，并生成页面、Service Worker、字体及版本化模型的缓存头。

手动构建时，同一命令输出到 `release/cloudflare/<版本>/`；`latest.json` 记录发行目录。也可将 `npm run build` 的 `dist/` 部署至任意静态主机，Vercel 配置见根目录 `vercel.json`。

Cloudflare 包装发布完整 `dist/` 文件集合，作者放入 `public/` 的图片、附件和自定义页面均随包发布；离线预缓存是单独的资源集合，范围见 [PWA 说明](PWA.md)。`public/` 中的文件全部公开，不受文章 draft 控制。包装保留许可字体校验、单文件 25 MiB 与 20000 文件限制，拒绝符号链接，并生成既有缓存头。GitHub CI 使用 `build:cloudflare` 验证包装，随后执行内容和视口检查。

页面、RSS、站点地图、更新入口和 Service Worker 应重新验证；不要将所有未知路径重写到首页，文章和 404 都由 Astro 生成。

Novecento Webfont 属于独立许可资源，不进入 Git。没有许可包时使用既有固定字形；自行安装授权包后，构建按 `scripts/webfont-sources.json` 校验。普通模板构建不从原作者站点恢复字体；历史原官方托管环境保留其已有校验和恢复约束。
