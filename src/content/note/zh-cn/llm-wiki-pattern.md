---
title: "LLM-Wiki 模式：用 LLM 增量维护一个持久的个人知识库"
timestamp: 2026-08-07 00:00:00+00:00
series: "个人 AI 知识库"
kind: concept
status: active
sources: ["karpathy-llm-wiki"]
related: ["headroom-single-port-evolution", "omp-config-and-rules-guide", "omp-headroom-persistence", "omp-hook-extension-guide"]
tags: [LLM, Knowledge Base, Wiki, RAG, Agent]
description: "本页是 DavidHLPL 个人 AI 知识库的自我说明书，解释 raw、wiki、schema 三层和 ingest、query、lint 三个操作。"
toc: true
top: 1
---

> 本页描述的就是本知识库自身的运作方式。原始依据见 [`karpathy-llm-wiki`](https://gist.githubusercontent.com/karpathy/442a6bf555914893e9891c11519de94f/raw/ac46de1ad27f92b28ac95459c782c07f6b8c964a/llm-wiki.md)，维护契约见 [KB.md](https://github.com/DavidHLP/DavidHLP.github.io/blob/main/KB.md) 与 [knowledge-base skill](https://github.com/DavidHLP/DavidHLP.github.io/blob/main/.claude/skills/knowledge-base.md)。

## 定义

LLM-Wiki 模式不是把文件丢进 RAG 后在每次提问时重新拼接答案，而是让 LLM 读取原始来源，把事实、概念、实体、比较和不确定性编译成一组持久、互相链接的 Markdown 页面。

关键区别只有一句话：**wiki 是一个会复利的产物。**

交叉引用会持续存在，冲突会被明确标注，综合页会随着新来源一起更新。一次查询的高价值结论也可以归档回 wiki，而不是随聊天记录消失。

## 为什么需要它：RAG 的积累缺口

| 维度 | 传统 RAG / 文件上传 | LLM-Wiki |
| --- | --- | --- |
| 知识形态 | 原始文档，查询时检索 | 持久的、预编译的互联 wiki |
| 综合成本 | 每次查询重新拼凑 | 摄入时综合，之后持续保鲜 |
| 矛盾处理 | 每次重新发现 | 页面中显式记录冲突 |
| 复利性 | 多数情况下从零开始 | 每次 ingest 都扩大网络 |

RAG 的问题不是检索必然不准，而是缺少积累：需要综合多个来源的问题，每次都要重新找出并拼好片段。LLM-Wiki 把这部分记账工作提前做掉。

## 三层架构

| 层 | 本项目位置 | 角色 | 可变性 |
| --- | --- | --- | --- |
| Raw sources | `src/content/raw/{locale}/` | 剪藏、论文、文档和数据等证据 | 只读 |
| Wiki | `src/content/note/{locale}/` | `concept`、`entity`、`synthesis` 派生页 | LLM 增量维护 |
| Schema | `KB.md`、`.claude/skills/knowledge-base.md` | 告诉 LLM 如何组织和维护知识 | 慢速演进 |

分层的意义是：wiki 可以大胆重写，但永远不会覆盖原始证据。每个非平凡结论都应沿着 `sources` 回到 raw。

## 三个操作

### Ingest（摄入）

来源先进入 raw；确认关键事实后，LLM 创建或更新 wiki 页面，维护相关页的交叉引用，更新 `kb-index.md`，最后在 `kb-log.md` 追加记录。一个来源可以触及多页，但 raw 永远不回写。

### Query（查询）

先读目录，再读相关 wiki 和它们的 raw 证据。回答时区分来源事实、已有综合和当前推断，并提供页面或来源引用。可复用的比较、决策和分析应归档为 `synthesis` 页面。

### Lint（健康检查）

检查矛盾、过期声明、孤儿页、断链、缺少来源的结论、未登记的页面和应当拆分的概念。lint 的结果应转化为下一批 ingest 或 query，而不是只修饰页面外观。

## 两个导航文件

- [`kb-index.md`](/kb)：面向内容的目录，按 `concept`、`entity`、`synthesis` 和 raw 来源组织；回答问题时先读它。
- [`kb-log.md`](/kb#log)：面向时间的 append-only 操作日志。每条记录都以 `## [YYYY-MM-DD] 类型 | 标题` 开头，可用 `grep '^## \['` 快速定位。

- 下一批工作记录在[摄入收件箱](/jotting/kb-ingest-todo)中。

## 当前边界与后续方向

本知识库以 `zh-cn` 作为正典语言。`en` 和 `ja` 保留站点入口及这张概念说明页的翻译，不把翻译版本当成独立事实源。

旧博客中的运维、Java 和架构文章已从公开 wiki 列表中移除。它们是否值得作为新来源重新摄入，要经过来源确认、去重和证据审查；不能因为“曾经写过”就直接恢复为稳定结论。

未来页面优先形成三类网络：

1. **实体页**：个人项目、工具、框架和运行环境。
2. **概念页**：可迁移的方法、原理和排障模型。
3. **综合页**：跨来源的比较、演进和个人决策。
