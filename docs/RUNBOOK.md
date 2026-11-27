# Runbook

运维顺序与回滚说明。命令以 `package.json` 为准；Cloudflare 打包见 [CLOUDFLARE-DEPLOYMENT.md](CLOUDFLARE-DEPLOYMENT.md)，PWA 与离线更新见 [PWA.md](PWA.md)。

## 自动部署

- 推送到 `main` 触发 `.github/workflows/deploy.yml`。
- 工作流在 `ubuntu-latest`、Node.js 22 上运行 `npm ci`，随后执行 `npm run build`、`check:content`、`check:viewport`、`kb:lint`、`test:kb`。
- 通过后上传 `dist/` 并发布到 GitHub Pages；并发组为 `pages`，新推送会取消进行中的旧部署。
- 监控：仓库 Actions 页的 “Deploy blog to GitHub Pages”，以及 Environments → `github-pages`。
- 手动重跑：Actions → “Deploy blog to GitHub Pages” → Run workflow → 选择 `main`。

## 本地验证

```sh
npm ci
npm run build
npm run check:content
npm run check:viewport
npm run kb:lint
npm run test:kb
```

`npm run build` 已包含 `astro check`、静态构建与 PWA 产物。需要验证 Cloudflare 打包时运行 `npm run build:cloudflare`。

## 回滚

优先使用可追溯的反向提交，不改写历史：

```sh
git log --oneline
git revert <bad-commit>
git push origin main
```

常规回滚不要使用 `git reset --hard` 或 `git push --force`；只有仓库所有者明确要求重写历史时才考虑强制推送。GitHub Pages 部署本身可通过重新运行上一良好提交的部署工作流恢复。

## 故障排查

- 构建失败：先看 Actions 日志中失败步骤，再在本地复现对应 `npm run` 命令。
- 部署未更新：检查 Actions 是否成功、Settings → Pages 的 Source 是否为 “GitHub Actions”。
- Feed：中文 `/rss.xml`，英文 `/en/rss.xml`，日文 `/ja/rss.xml`；兼容地址 `/feed`、`/en/feed`、`/ja/feed`。
- 离线更新：入口为 `/update.html`。
- 依赖或内容集合报错：核对 `package.json`、`src/content.config.ts` 与 `content/site.json`，不要按旧文档修改。
- 页面 404：静态构建应为每个路由生成 `index.html`；检查 `astro.config.ts` 的 `trailingSlash` 与 `src/pages/` 路由。

## 维护节奏

- 依赖更新后重跑本地验证与 CI。
- 内容改动遵循 `KB.md` 与 `.claude/skills/knowledge-base.md`。
- 文档改动同步 `docs/README.md` 与 [DOCUMENT-CLASSIFICATION.md](DOCUMENT-CLASSIFICATION.md)。
