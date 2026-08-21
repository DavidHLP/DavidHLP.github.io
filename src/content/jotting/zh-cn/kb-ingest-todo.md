---
title: "知识库摄入收件箱"
timestamp: 2026-08-07 00:00:00+00:00
tags: [Knowledge Base, Ingest, TODO]
description: "尚未经过证据审查的来源和问题，只能作为摄入候选，不能当作稳定知识。"
---

# 知识库摄入收件箱

这里记录待整理的候选来源和问题。收件箱不是知识页：条目完成 `ingest` 后，要么进入 `src/content/raw/zh-cn/` 并产生对应 wiki 页面，要么明确关闭并说明原因。

## 已完成摄入

以下历史文章已经完成 raw → wiki → index → log 闭环：

- Java 基础与后端调优：AtomicBoolean、AutoCloseable、NullValue、Java 线上性能排查、Java 后端实习面试复盘。
- 系统运维与基础设施：containerd TLS、SSH 内网穿透、MySQL 性能排查。
- OMP 与 Agent 工程：配置与规则、Hook 扩展、Headroom 单端口演进、Headroom 持久化恢复。
- 架构与工程实践：终端插件生命周期、UISA 高可靠信息同步架构。

### 2026-08-21 全量聚合摄入

- [x] `Personal-markdown-notes`（bbb2126，46 篇）与 `Fuwari`（07cee2b，61 篇）全部原文已按 10 主题聚合为 `ingest-*` 不可变 raw 与 10 个 `note` wiki 页，覆盖 Docker、HBase、Redis（业务/持久化/黑马）、Java 并发、Spring Cloud、Spark/大数据、MySQL、前指随笔。3 份完全重复与 1 份空文件已在 raw 中标注去重；图片相对路径已转义为链接以通过构建。
- [x] Hindsight 记忆及其衍生结论仍需用可访问快照复核；本批未将其作为稳定概念写入（见 [Hindsight 实践](/note/hindsight-local-deployment-and-agent-integration)）。

详情见 [知识库目录](/kb)。

## 待摄入来源

- [x] 个人项目 `ResiCache`（固定提交 `75ed279a`）与 `UltiCode`（固定提交 `3f14ac89`）的 README/CONTEXT 已完成 raw → entity 页闭环（见 [ResiCache](/note/resicache) 与 [UltiCode](/note/ulticode)）；运行证据（压测、沙箱隔离强度、生产部署）仍待补充。
- [ ] 为 OMP / Headroom 新版本配置收集官方文档或可复现实验，替换历史页面中的 provisional 结论。

## 2026-08-12 会话候选分流

- [x] Headroom 0.34 `/v1/compress` 与 `/v1/retrieve` 的字段、模式和真实端点验证已补充上游源码证据，并提升为正式知识页。
- [ ] Hindsight 记忆及其衍生结论仍需用可访问的服务快照、上游源码或可重复实验逐条复核；当前只保留在受忽略的脱敏账本中。
- [ ] 未匹配的 OMP、OpenCode、Codex 候选先按主题聚类；工作流提示、Agent 内部消息和工具轨迹不作为公开知识，不能批量复制进文章。

## 待回答问题

- [ ] 哪些排障步骤是个人经验，哪些可以被官方文档或可重复实验支持？
- [ ] 哪些页面应该合并为共享概念，哪些应该保留为不同实体的局部实现？
- [ ] 当新来源与旧 wiki 冲突时，应该废弃哪条声明，还是保留条件化结论？

## 完成标准

- 有 raw 来源 slug、来源 URL 或明确的内部证据。
- wiki 页面声明 `kind`、`status`、`sources`。
- `kb-index.md` 与 `kb-log.md` 已同步。
- 原始来源没有被改写来迎合新结论。
