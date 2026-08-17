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

## [2026-08-13] ingest | 五主题公开证据增量沉淀

从候选账本中选择五个可独立复用主题，并重新绑定到公开、固定版本或固定提交证据：JJWT 0.13.0 签名/验签 API、Testcontainers 1.20.6 Docker API 版本回退、Dubbo 3.3.6 + Nacos 运行时注册、ResiCache observer 嵌套执行，以及微服务领域与数据所有权。新增 5 个脱敏 `raw` 快照和 5 个中文正典 concept 页面，更新本目录与本日志；未创建 en/ja 副本，因为本批没有独立翻译任务。

本批保留版本边界和未验证项：Dubbo/Nacos 真实集成 smoke test、Testcontainers 运行矩阵、JJWT 编译运行断言和 observer 任意深度完整嵌套均未冒充已执行结果。`nacos.check`、`retry.period` 的 registry URL 参数写法已按固定源码校正；未将私有会话、内部地址、凭证或项目未发布实现写入公开内容。

## [2026-08-13] correction | 五主题证据复审与不可变 raw 校正

复审发现 JJWT `PrivateKey`/`verifyWith` 类型边界、Testcontainers `TestEnvironment` 路径与 `999.999` 版本矩阵、Dubbo `register-consumer-url` 配置键以及微服务来源固定 URL 需要收窄。按 raw 不可变规则保留初始五份快照，新增四份 correction raw，并将相关 note 的 `sources` 同时指向初始与 correction；初始 raw 哈希恢复并登记在 `src/content/raw/.manifest.sha256`。复审未发现凭证、私有路径或会话标识进入公开内容。

## [2026-08-13] maintenance | 收窄翻译 wiki 发布范围

按 `KB.md` 的正典边界，将未经过独立翻译任务确认的 14 个历史主题的 28 个 en/ja wiki 副本标记为 `draft: true`，并将 en/ja `kb-index.md` 收敛为导航入口与已明确翻译的页面；同时补齐 zh-cn 正典页面的交叉链接，并移除已发布翻译页对 draft 页面元数据的引用。未修改 raw、保护面或既有日志条目。

## [2026-08-13] ingest | Headroom 与 cc-switch / Claude Code 共存

从 `omp-headroom-provider-proxy` 固定提交及同日脱敏运行时观测中摄入 Headroom 与 cc-switch 共存结论：Claude Code `/v1/messages` 先经 Headroom 8787，再由 cc-switch 15721 做协议转换和凭据注入；OMP `/v1/responses` 保持独立的请求级上游路径。记录 `HEADROOM_CC_SWITCH_RECONCILE=1` 的回写方向、单一整理不变量、`ProtectHome=tmpfs` 下 `BindPaths=%h/.claude` 的安全取舍，以及 `/admin/upstream` 和 `/v1/messages → 127.0.0.1:15721` 的运行时证据。raw 与 wiki 均已脱敏，不包含凭证、会话标识、请求正文或本机绝对路径。

## [2026-08-13] ingest | OMP Headroom Bridge 与原生 Codex 路由

从 `omp-headroom-provider-proxy` 固定提交和当前工作树的脱敏交付证据中摄入一个 entity 页面与一份 raw 快照。记录 `systemd --user` 管理的 loopback Headroom 8787、OMP 的两个显式 provider route、Codex CLI/Desktop 共享用户级 Responses provider、Claude Code/cc-switch 共存边界、`bin/codex-routes` 的 marker/lock/hash/mode/atomic restore 约束，以及 static/lifecycle/fresh-client 验证和 rollback 顺序。未写入凭证、用户配置正文、`models.db`、请求正文、本机绝对路径或未提交代码的伪造固定 URL；明确注明当前工作树尚未形成新的公开 commit。

## [2026-08-17] ingest | Hindsight 本地部署与 OMP / Codex 记忆集成

从 Vectorize Hindsight v0.9.1 固定源码与本地 loopback 实测中摄入全本地化记忆系统部署与 OMP / Codex 统一接入规范。记录 AMD ROCm GPU 下加载 `gemma4:12b` (Q4_K_M GGUF)、CPU Local 运行 `BAAI/bge-m3`、FastMCP stdio 桥接状态机、Git 根目录自适应解析（避免子目录漂移）、Rootless 容器 UID 1000 权限最小化配置，以及 OMP `scoping: per-project` 与 Codex 镜像对齐。新增 1 份脱敏 raw 快照和 1 份中文正典 concept 页面，更新 `kb-index.md` 与本日志。raw 与 wiki 均已脱敏，不包含真实会话标识、请求正文、私有凭证或宿主机绝对路径。
