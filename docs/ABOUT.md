# About / 个人档案

地址：`/about/`、`/en/about/`、`/ja/about/`。这是独立的 Astro 文档：不加载 Three.js、固定舞台或开场，禁用 JavaScript 仍可阅读和切换语言。导航语言跟随正文；直接打开一个语言地址始终显示该语言，不被旧偏好重定向。打印使用浏览器打印或保存 PDF。

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
  # resume: /downloads/resume.pdf
---

一段介绍即可，不必填写所有模块。
```

只有 `title` 和 `lang` 必填。可删除整个 `profile`，或省略角色、介绍、地点、头像、联系、PDF。头像和简历须是 `public/` 下真实文件；不存在时不生成入口，不请求不存在的图片。链接接受 HTTP(S)、mailto、tel 或站内路径。无 PDF 时仍可打印。

## 长简历

“打印 / 保存 PDF”使用 1440×900 像素比例的横向页面，固定为桌面双栏与暖灰亮色，不受当前屏幕宽度或暗色偏好影响。保留全部履历，隐藏网页导航、操作按钮和目录；标题与后文、段落、列表项及表格行尽量保持在同一页，超出整页的长块允许继续分页。打印对话框选择“另存为 PDF”，使用 CSS 页面尺寸、100% 缩放并关闭浏览器页眉页脚；不要另选 A4 覆盖页面尺寸。

正文用 `##` 写经历、项目、技能、教育、开源等章节，`###` 写具体项目或单位。章节目录从实际二级标题生成；没有章节时不生成空目录。删除不需要的模块及标题即可。建议保留职责、关键技术、成果三层信息，不使用能力百分比。

```md
## 项目
### 项目名称
<p class="resume-meta">2025–2026 · 个人职责</p>

项目背景与范围。

<p class="resume-stack">技术栈：TypeScript / Astro</p>

- **关键工作**：具体行动，以及有来源支持的结果。
```

主题复用 `rhine-settings.colorTheme`，其他设置保留。首页与静态阅读导航都有入口；从静态模式进入时，返回首页继续静态模式。关于页正文不参与 UI 词条替换。

## 复用现有内容

`content/site.json` 的 `about` 是 Astro glob 配置，默认 `{ "base": "./content/about", "pattern": "*.md" }`。可指向现有的三语 Markdown，例如 `{ "base": "./content/blog/legacy/information", "pattern": "*/introduction.md" }`，在同一文件 frontmatter 添加 `profile` 即可。额外文章元数据不会影响 About；博客原介绍文章也显示同一 profile。每种语言必须且只能匹配一份文件，构建会校验；不要同时维护另一份履历。

上游同步使用 Git merge：通用组件、样式和字段来自模板，个人正文和 `site.json` 留在博客。如果已有迁移 catch-all，请将三个真实 About 地址从旧重定向生成列表中移除，保留旧介绍文章及其迁移入口。静态路由自动进入站点地图；页面包含 canonical、hreflang 和语言信息。

验收清单见 [ABOUT-ACCEPTANCE.md](ABOUT-ACCEPTANCE.md)。`check:viewport` 仅验证档案布局计算，不能代替实际 About 截图、打印和浏览器操作。
