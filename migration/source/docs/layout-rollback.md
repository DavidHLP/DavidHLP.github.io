# 原始布局与最新配色

2026-09-08 按用户要求恢复 `a7719df` 的博客布局：序言、个人档案、序文、活动日志、原图标导航、列表侧栏、文章与简历版式。

保留纸白 `#FAFAF7`、炭黑 `#30343A`、信号红 `#C83232`，以及对应深色主题、代码和图表配色。首页原插图位置使用 `public/images/sailing-print-no-text.png`；插图无文字，不再使用新作品集首页。

`src/styles/editorial.css` 不再加载；其他设计文档和生成素材仅作为历史记录。内容、简历原文和知识库修改未回滚。保留导航水合、键盘焦点、语义与打印方面的修正。

验证：`pnpm check`、`pnpm build`、`node scripts/editorial-smoke.mjs`。
