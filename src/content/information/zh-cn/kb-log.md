# 知识库操作日志

这是按时间追加的知识库维护记录。历史条目不重写；纠正通过新条目表达。

## [2026-08-07] init | 建立个人 AI 知识库

按 Karpathy 的 LLM-Wiki 模式重构站点，建立 `raw`（不可变来源）、`note`（wiki 知识页）和 Schema（`KB.md`、`knowledge-base` skill）三层。保留首页与个人简历，移除旧博客内容的公开 wiki 语义，并保留三语站点壳层。

## [2026-08-07] ingest | @karpathy-llm-wiki

将 Karpathy 的原始 gist 快照写入 `src/content/raw/zh-cn/karpathy-llm-wiki.md`，建立首个 concept 页面 `llm-wiki-pattern`，同步更新 `kb-index.md` 和本日志。

## [2026-08-07] lint | 初始化检查

确认 raw 只有一个来源，首个 wiki 页面引用该来源，目录已登记页面和收件箱；旧文章尚未重新摄入，暂不视为稳定知识。

## [2026-08-07] ingest | 历史文章知识化迁移

从 Git 提交 `6f3d114a6ef9eb08b730f5f4740afe5b7d22d426` 读取 14 个历史文章主题，建立 `legacy-*` 中文 raw 证据快照，并将内容整理为三语 `note` 页面：Java 基础与后端调优、系统运维与基础设施、OMP 与 Agent 工程、架构与工程实践。原来位于 `jotting` 的三个 Java 页面已提升为稳定知识页；版本敏感的 Headroom、UISA 和面试复盘保留为 `provisional` 综合页。

## [2026-08-07] lint | 历史文章迁移后待验证

已同步更新正典目录、三语目录和摄入收件箱；下一步验证 raw manifest、sources、related、三语元数据、构建产物和死链。

## [2026-08-07] lint | 历史文章迁移验证通过

`pnpm kb:lint` 通过：15 个 raw 来源、45 个三语 wiki 页面，sources、raw manifest、正典目录和日志均闭环。`pnpm check` 无错误，`pnpm build` 成功生成 71 个页面，`pnpm test:run` 通过 129 个测试（1 个跳过）。构建产物内部链接扫描 880 条，仅发现 404/500 模板指向自身错误页的既有链接。

## [2026-08-07] rewrite | 将迁移内容编译为真实知识页

上一轮只完成了历史文章的 raw → note 迁移。本次重新读取 14 个 raw 来源，将 note 正文重写为定义、核心机制、适用条件、边界风险、最小验证、证据与不确定性、相关页面七类结构；删除博客流水账、面试问答和大段配置倾倒。Java 面试、Headroom 路由/持久化、UISA 保留为多来源 `provisional` synthesis，其余页面按可复用概念维护。

## [2026-08-12] ingest | Headroom 0.34.0 API contract

从 Headroom `v0.34.0` 固定版本源码和真实 loopback contract test 提取 `/v1/compress` 与 `/v1/retrieve` 的字段级契约，建立三语知识页。记录缺少 `model` 的 400、顶层 `tokens_saved`、`original_content`、CCR marker 条件和 `frozen_message_count` 的 cache-prefix 语义；本地会话账本中的凭证、路径、主机和会话标识均未进入 raw 或公开页面。

## [2026-08-13] ingest | 会话工程知识第二批沉淀

从上一轮脱敏会话候选中筛选六个可独立复用的主题，并以固定公开源码、规范、仓库提交或一次性最小实验重新取证：会话摄入与 redaction v19、MCP/codebase-memory 图工作流、Redis/Jackson `LocalDateTime`、Flyway/MySQL schema drift、多服务 readiness、OMP 17.2.15 Hook/Compaction。新增五个中文正典 concept 页，更新三份 OMP 页面；`zh-cn` 按 `KB.md` 保持正典，未在没有明确翻译任务时复制 en/ja wiki。

同日发现两份新 raw 在复审期间被扩展证据覆盖。按不可变规则恢复最初快照，并将后续更精确证据分别保存为 `omp-17-2-15-runtime-contract-correction` 与 `multi-service-readiness-contract-correction`；wiki 同时引用原快照和 correction，未改写或删除已捕获证据。

安全复审随后发现 readiness 验证命令未限定 Compose project。新增 `multi-service-readiness-safety-correction`，固定 v5.4.0 的 `-f`/`-p` 与 `down` 边界；正典页改为专用 fixture、唯一 project name，并明确 restart、abort 与 down 的影响。
