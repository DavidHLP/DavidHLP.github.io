---
{
  "archiveId": "X-1014",
  "title": "DavidHLP",
  "en": "PROFILE",
  "category": "站点随笔",
  "department": "站点信息",
  "date": "2026-10-05",
  "lead": "DavidHLP",
  "clearance": "PUBLIC",
  "abstract": "个人介绍：技术方向、开源项目与本站写作。",
  "findings": [
    "本页只包含公开的技术身份与项目，不含联系方式。"
  ],
  "source": "https://github.com/DavidHLP",
  "pubDate": "2026-10-05T05:34:00.000Z",
  "tags": [
    "zh-cn",
    "information"
  ],
  "draft": false,
  "lang": "zh-CN",
  "legacy": {
    "path": "src/content/information/zh-cn/introduction.md",
    "revision": "scrubbed-2026-11-25",
    "metadata": {}
  },
  "resumeLabel": "个人介绍",
  "profile": {
    "role": "Java 后端开发",
    "summary": "关注缓存一致性、分布式任务与可维护的工程实现，维护 ResiCache 与 UltiCode。",
    "avatar": "/images/github-avatar.jpg",
    "contacts": [
      {
        "label": "GitHub · DavidHLP",
        "href": "https://github.com/DavidHLP"
      },
      {
        "label": "知识库",
        "href": "https://davidhlp.github.io/kb/"
      },
      {
        "label": "站点源码",
        "href": "https://github.com/DavidHLP/DavidHLP.github.io"
      }
    ]
  }
}
---

## 关于我

Java 后端开发，关注缓存一致性、分布式任务与可维护的工程实现。日常工作里反复处理的是同一类问题：并发回源怎么合并、任务投递失败后怎么补齐、序列化边界怎么保证不越权。把这些想清楚并写成可复查的笔记，是本站的主要内容来源。

## 开源项目

- **ResiCache** — 为使用 Redis 的 Spring Cache 应用提供缓存防护：合并同 Key 的并发回源、错开集中到期带来的压力、支持热点 Key 提前刷新。
- **UltiCode** — 从题库练习到比赛判题的开源在线评测平台：独立判题进程从 Redis Streams 领取提交，在 Docker 沙箱中执行。
- **codebase-memory-mcp**（上游贡献）— 代码知识图谱 MCP 服务：[Oh My Pi 客户端接入](https://github.com/DeusData/codebase-memory-mcp/pull/1229)、[Linux 安装别名兼容](https://github.com/DeusData/codebase-memory-mcp/pull/2203)、[Swift 声明与调用关系解析](https://github.com/DeusData/codebase-memory-mcp/pull/2436)。

## 这个站点

写作集中在 Java 并发、Redis 缓存与存储、分布式任务投递与故障恢复，以及 MCP 与 AI 工程工具。

界面主题派生自 [RhineLabUI](https://github.com/LBEILC/RhineLabUI)，在 [RhineLabUI-Astro](https://github.com/DavidHLP/RhineLabUI-Astro) 中移植为 Astro + TypeScript。

- 知识库：<https://davidhlp.github.io/kb/>
- 站点源码：<https://github.com/DavidHLP/DavidHLP.github.io>
