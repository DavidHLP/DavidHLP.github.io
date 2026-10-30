---
name: knowledge-base
description: Karpathy LLM-Wiki 三层知识库的 ingest、query、lint 维护规程
version: 1.0.0
source: project-schema
---

# Knowledge Base Maintenance

这是 DavidHLPL 的个人 AI 知识库维护技能。任何维护 `src/content/raw/`、`src/content/note/`、`src/content/jotting/`、`kb-index.md` 或 `kb-log.md` 的任务，必须先读取根目录 `KB.md`。

## 快速判断

- 用户说 `ingest <来源>`：执行 raw → wiki → index → log 的摄入闭环。
- 用户说 `query <问题>`：先读正典 `src/content/information/zh-cn/kb-index.md`，再沿链接读取 wiki 和 raw，回答后判断是否归档 synthesis。
- 用户说 `lint`：检查证据、索引、交叉链接、孤儿页、矛盾、过期声明和 raw 不变量。
- 普通站点开发不自动改动知识库；首页和简历属于保护面。

## 写入边界

1. `src/content/raw/{locale}/` 是不可变证据层。LLM 只能新增来源，不能编辑、格式化、翻译或删除已有 raw。
2. `src/content/note/{locale}/` 是派生 wiki 层。LLM 可以创建、合并、重写和废弃页面，但每个稳定结论都必须通过 `sources` 回指 raw。
3. `src/content/jotting/{locale}/` 是捕获收件箱。收件箱内容不等于事实，摄入完成后应更新为 wiki 页面或明确关闭。
4. `src/content/information/{locale}/kb-index.md` 面向内容；`kb-log.md` 面向时间。两者不能互相替代。
5. 知识库以 `zh-cn` 为正典。`en`、`ja` 页面是明确翻译任务的输出，不可在没有正典变更时独立演进。

## Ingest 清单

- [ ] 来源已保存到 raw，带稳定 slug、`capturedAt`、`sourceType` 和 `sourceUrl`。
- [ ] 事实、推断、观点和不确定性已分开。
- [ ] Wiki 页面 frontmatter 声明 `kind`、`status`、`sources` 和必要的 `related`。
- [ ] 相关概念和实体页已补双向链接。
- [ ] `kb-index.md` 登记新增或变更页面及一句话摘要。
- [ ] `kb-log.md` 追加 `## [YYYY-MM-DD] ingest | ...`，不重写历史记录。

## Query 清单

回答必须说明证据层级：raw 原文、wiki 已归纳结论，还是基于现有资料的推断。对需要综合多个页面的问题，优先写新的 `kind: synthesis` 页面，而不是把结论留在聊天记录里。

## Lint 清单

- raw 是否被修改，且 `src/content/raw/.manifest.sha256` 是否与快照一致。
- `sources` 是否都能解析到现有 raw slug；`related`、Markdown 链接是否存在。
- active/provisional 页面是否进入 index。
- log 是否 append-only 且日期前缀可被 `grep '^## \\['` 解析。
- 是否出现孤儿页、重复页、冲突未标记或已过时声明。

优先运行 `pnpm kb:lint`；它会自动检查来源 slug、索引/日志同步和 raw 校验清单。

除非用户明确要求，不要把旧博客文章直接恢复为公开列表。先把它们作为候选来源讨论，再用 ingest 重新编译为可追溯 wiki。
