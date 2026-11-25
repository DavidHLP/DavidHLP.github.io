---
{
  "archiveId": "X-1002",
  "title": "DavidHLP",
  "en": "PROFILE",
  "category": "站点随笔",
  "department": "站点信息",
  "date": "2026-10-05",
  "lead": "DavidHLP",
  "clearance": "PUBLIC",
  "abstract": "Profile: technical focus, open-source projects and what this site writes about.",
  "findings": [
    "This page covers only the public technical identity and projects; no contact details."
  ],
  "source": "https://github.com/DavidHLP",
  "pubDate": "2026-10-05T05:34:00.000Z",
  "tags": [
    "en",
    "information"
  ],
  "draft": false,
  "lang": "en",
  "legacy": {
    "path": "src/content/information/en/introduction.md",
    "revision": "scrubbed-2026-11-25",
    "metadata": {}
  },
  "resumeLabel": "Profile",
  "profile": {
    "role": "Java backend developer",
    "summary": "Works on cache consistency, distributed tasks and maintainable engineering; maintains ResiCache and UltiCode.",
    "avatar": "/images/github-avatar.jpg",
    "contacts": [
      {
        "label": "GitHub · DavidHLP",
        "href": "https://github.com/DavidHLP"
      },
      {
        "label": "Knowledge base",
        "href": "https://davidhlp.github.io/kb/"
      },
      {
        "label": "Site source",
        "href": "https://github.com/DavidHLP/DavidHLP.github.io"
      }
    ]
  }
}
---

## About

Java backend developer focused on cache consistency, distributed tasks and maintainable engineering. Most of the work is the same class of problem: how to coalesce concurrent reloads, how to recover a task after a failed delivery, how to keep serialization boundaries from widening access. Writing those decisions down so they can be reviewed is what most of this site is built on.

## Open source

- **ResiCache** — cache protection for Spring Cache applications on Redis: coalesces concurrent reloads for the same key, spreads the load of mass expiry, and refreshes hot keys ahead of time.
- **UltiCode** — an open-source online judge covering practice problems and contests: a separate judging process pulls submissions from Redis Streams and runs code in a Docker sandbox.
- **codebase-memory-mcp** (upstream contributions) — a code knowledge-graph MCP server: [Oh My Pi client surface](https://github.com/DeusData/codebase-memory-mcp/pull/1229), [Linux install alias handling](https://github.com/DeusData/codebase-memory-mcp/pull/2203), and [Swift declaration and call-edge parsing](https://github.com/DeusData/codebase-memory-mcp/pull/2436).

## This site

Writing covers Java concurrency, Redis caching and storage, distributed task delivery and failure recovery, and MCP with AI engineering tooling.

The interface theme derives from [RhineLabUI](https://github.com/LBEILC/RhineLabUI), ported to Astro and TypeScript in [RhineLabUI-Astro](https://github.com/DavidHLP/RhineLabUI-Astro).

- Knowledge base: <https://davidhlp.github.io/kb/>
- Site source: <https://github.com/DavidHLP/DavidHLP.github.io>
