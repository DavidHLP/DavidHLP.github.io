# About / 个人档案

地址：`/about/`、`/en/about/`、`/ja/about/`。这是独立的 Astro 文档：不加载 Three.js、固定舞台或开场，禁用 JavaScript 仍可阅读和切换语言。导航语言跟随正文；直接打开一个语言地址始终显示该语言，不被旧偏好重定向。页面不再提供打印或 PDF 导出按钮。

## 修改个人资料

默认编辑 `content/about/zh-cn.md`、`en.md`、`ja.md`。这三份中性示例均为虚构信息。

```yaml
---
title: 你的姓名
lang: zh-CN
profile:
  role: 你的角色
  summary: 一句话介绍
  location: 城市（可选）
  contacts:
    - label: 给我发邮件
      href: mailto:you@example.com
    - label: GitHub
      href: https://github.com/your-name
    - label: 其他联系方式（可不设置链接）
  # avatar: /images/portrait.jpg
---

一段介绍即可，不必填写所有模块。
```

只有 `title` 和 `lang` 必填。可删除整个 `profile`，或省略角色、介绍、地点、头像、联系。头像须是 `public/` 下真实文件；不存在时不生成入口，不请求不存在的图片。链接接受 HTTP(S)、mailto、tel 或站内路径。

## 多份求职方向

默认内容和地址保持不变，可在默认文档frontmatter设置 `resumeLabel: Java` 作为方向标签。额外版本放在 `content/about/variants/<variant>/<language>.md`，例如：

```yaml
---
variant: research
title: 研究方向
lang: zh-CN
role: 研究工程师
summary: 当前方向的一句话介绍。
---

## 项目经历
只填写这一方向的完整正文。
```

每个方向必须恰好有 `zh-CN`、`en`、`ja` 三份文档；缺失或重复会使构建失败。方向ID只允许小写字母开头的字母、数字与连字符。示例地址为 `/about/research/`、`/en/about/research/`、`/ja/about/research/`。

方向文档只覆盖正文、职业和介绍，姓名、联系与头像继承默认文档，避免维护多套个人资料。没有方向文档时不生成切换区域。方向与语言链接可直接访问，静态模式会保留；canonical、hreflang、站点地图及离线页面均指向各自方向。正文和公开资料仅放在博客；模板的研究方向示例为虚构信息。

## 已移除的导出功能

About 页底部原有的“打印 / 保存 PDF”按钮与 LaTeX 简历下载已彻底移除：`scripts/export-resumes.mjs`、`scripts/resume/`、`RHINE_RESUME_PDF` 环境变量以及构建中的 PDF 生成步骤都已删除。浏览器自带的打印功能仍可用于保存页面，但不属于站点功能。

## 复用现有内容

`content/site.json` 的 `about` 是 Astro glob 配置，默认 `{ "base": "./content/about", "pattern": "*.md" }`。可指向现有的三语 Markdown，例如 `{ "base": "./content/blog/legacy/information", "pattern": "*/introduction.md" }`，在同一文件 frontmatter 添加 `profile` 即可。额外文章元数据不会影响 About；博客原介绍文章也显示同一 profile。每种语言必须且只能匹配一份文件，构建会校验；不要同时维护另一份履历。

上游同步使用 Git merge：通用组件、样式和字段来自模板，个人正文和 `site.json` 留在博客。如果已有迁移 catch-all，请将三个真实 About 地址从旧重定向生成列表中移除，保留旧介绍文章及其迁移入口。静态路由自动进入站点地图；页面包含 canonical、hreflang 和语言信息。

验收清单见 [ABOUT-ACCEPTANCE.md](ABOUT-ACCEPTANCE.md)。`check:viewport` 仅验证档案布局计算，不能代替实际 About 截图与浏览器操作。

网页默认直接显示文字介绍与公开资料，保留方向、语言、目录导航和无 JavaScript 阅读。

CI 的 `scripts/check-about-browser.mjs` 检查三种语言的 375/768/1440px 亮暗主题、无 JavaScript 阅读与页面元素可见性，并保存截图及 JSON 报告；人工逐页视觉审查仍须另行记录。
