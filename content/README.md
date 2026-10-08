# 编辑博客内容

博客内容位于 `content/blog/*.md`。完整 Frontmatter 示例与字段含义见 [根目录 README](../README.md)。

- 文件名决定 `/blog/<slug>/` 地址，`archiveId` 保留标签与收藏身份；均应稳定。
- `abstract` 是摘要，Markdown 正文是文章；`findings` 为原研究记录页签内容。
- `draft: true` 排除发布。每个配置分类至少保留一篇已发布文章。
- `site.json` 配置站点标题、描述、域名和五列分类；分类名称可变，列数保持五列。
- 修改后运行 `npm run export:archives`、`npm run check:content`、`npm run build`。开发服务器自动更新文章正文，TXT 下载由导出命令刷新。
- `archives.json` 仅保留原视频复核用历史夹具。修改它不会改变 Astro 博客。

内容是仓库维护者编写的 Markdown，支持 Astro 默认 Markdown 语法。导出保留 Markdown 文本和研究记录，不将用户输入当作 HTML。
