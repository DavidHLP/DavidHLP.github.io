---
{
  "archiveId": "X-1018",
  "title": "原始布局与最新配色",
  "en": "DOCUMENTATION",
  "category": "特别项目",
  "department": "项目文档",
  "date": "2026-10-05",
  "lead": "DavidHLPL",
  "clearance": "PUBLIC",
  "abstract": "原始布局与最新配色 · docs/layout-rollback.md",
  "findings": [
    "Original document: docs/layout-rollback.md",
    "Source revision: f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/docs/layout-rollback.md",
  "pubDate": "2026-10-05T05:34:00.000Z",
  "tags": [
    "docs",
    "documentation"
  ],
  "draft": false,
  "lang": "zh-CN",
  "legacy": {
    "path": "docs/layout-rollback.md",
    "revision": "f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "metadata": {}
  }
}
---

# 原始布局与最新配色

2026-09-08 按用户要求恢复 `a7719df` 的博客布局：序言、个人档案、序文、活动日志、原图标导航、列表侧栏、文章与简历版式。

保留纸白 `#FAFAF7`、炭黑 `#30343A`、信号红 `#C83232`，以及对应深色主题、代码和图表配色。首页原插图位置使用 `public/images/sailing-print-no-text.png`；插图无文字，不再使用新作品集首页。

`src/styles/editorial.css` 不再加载；其他设计文档和生成素材仅作为历史记录。内容、简历原文和知识库修改未回滚。保留导航水合、键盘焦点、语义与打印方面的修正。

验证：`pnpm check`、`pnpm build`、`node scripts/editorial-smoke.mjs`。
