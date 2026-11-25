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

我主要用 Java 和 Spring 做后端开发，关注 Redis 缓存一致性、分布式任务和序列化的信任边界。遇到并发或异步问题，我会先理清每一步由谁负责，以及超时或失败后还能依赖什么状态。

以缓存回源为例，我会分别验证等待者超时、加载异常和加载成功后写缓存失败这几条路径。笔记里也会写清测试覆盖了哪些场景，方便以后沿着代码复查结论。

## 开源项目

- [**ResiCache**](https://github.com/DavidHLP/ResiCache) 为使用 Redis 的 Spring Cache 应用提供缓存防护。它合并同一个键的并发回源、错开过期时间以分散负载，并支持热点键提前刷新。
- [**UltiCode**](https://github.com/DavidHLP/UltiCode) 是覆盖题库练习和比赛判题的在线评测平台。判题投递用数据库 outbox 保留待发送任务，以便失败后重试；独立判题进程从 Redis Streams 领取任务，在 Docker 沙箱中执行提交的代码。
- 我给代码知识图谱 MCP 服务 **codebase-memory-mcp** 提交过 [Oh My Pi 客户端接入](https://github.com/DeusData/codebase-memory-mcp/pull/1229)、[Linux 安装别名兼容](https://github.com/DeusData/codebase-memory-mcp/pull/2203)和 [Swift 声明与调用关系解析](https://github.com/DeusData/codebase-memory-mcp/pull/2436)方面的改动。

## 这个站点

我在这里记录 Java 并发、Redis 缓存与存储、分布式任务投递与故障恢复。最近也在探索如何把 MCP 工具用在代码走查里，例如先用代码图定位符号和调用关系，再查索引覆盖范围并回到源码核对。

界面主题源自 [RhineLabUI](https://github.com/LBEILC/RhineLabUI)，本站采用移植到 Astro 和 TypeScript 的 [RhineLabUI-Astro](https://github.com/DavidHLP/RhineLabUI-Astro)。

- 知识库：<https://davidhlp.github.io/kb/>
- 站点源码：<https://github.com/DavidHLP/DavidHLP.github.io>
