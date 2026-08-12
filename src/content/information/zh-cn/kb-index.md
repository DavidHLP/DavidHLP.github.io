# 知识库目录

本页是知识库的内容入口，不是传统博客归档。回答问题时先读这里，再沿页面的 `sources` 和交叉链接下钻。

正典维护语言：`zh-cn`。知识库遵循 [LLM-Wiki 模式](/note/llm-wiki-pattern)，维护契约见仓库根目录的 [KB.md](https://github.com/DavidHLP/DavidHLP.github.io/blob/main/KB.md) 与 [knowledge-base skill](https://github.com/DavidHLP/DavidHLP.github.io/blob/main/.claude/skills/knowledge-base.md)。

## 概念页（concept）

### 知识库自身

- [LLM-Wiki 模式：用 LLM 增量维护一个持久的个人知识库](/note/llm-wiki-pattern) — 解释 raw、wiki、schema 三层，以及 ingest、query、lint 三个操作。来源：`karpathy-llm-wiki`。

### Java 基础与后端调优

- [AtomicBoolean：原子布尔状态与 CAS 边界](/note/java-atomic-boolean) — 解释可见性、原子性与 CAS 如何构成最小状态转换，并明确何时应改用更强同步工具。
- [AutoCloseable：资源所有权与关闭异常语义](/note/java-auto-closeable) — 归纳 try-with-resources 的所有权、关闭顺序和异常传播边界。
- [NullValue：缓存 null 的占位对象与序列化边界](/note/java-null-value) — 说明空对象、单例和序列化恢复如何共同避免缓存穿透。
- [Java 线上性能排障：从症状到证据的最小决策树](/note/java-online-performance-debug) — 将 CPU/线程/GC 排障压缩为可验证的止损、定位和恢复路径。

### 系统运维与基础设施

- [containerd TLS：证书信任链与临时跳过验证的决策](/note/containerd-tls-troubleshooting) — 区分 CA 信任、运行时配置、Kubernetes 凭证和缓存造成的失败。
- [SSH 内网访问方案：连接方向、暴露面与故障恢复](/note/intranet-penetration-ssh-guide) — 按数据流、控制面和故障恢复比较 Tunnel、Tailscale、FRP。
- [MySQL 性能排查：现象→指标→定位层→安全缓解](/note/mysql-performance-troubleshooting) — 用连接、锁、索引、事务、IO 和 Buffer Pool 建立问题模型。

### OMP 与 Agent 工程

- [OMP 配置分层：模型角色、Agent 覆盖与降级链](/note/omp-config-and-rules-guide) — 解释配置责任边界、优先级和从声明到运行时验证的顺序。
- [OMP Hook 扩展概念：决策点提示、硬阻断与状态桥接](/note/omp-hook-extension-guide) — 区分软提示、硬护栏和状态栏事件桥接，不把 nudge 当安全边界。
- [Headroom 0.34 压缩与检索契约：字段、模式与真实端点验证](/note/headroom-compress-retrieve-contract) — 固定 `/v1/compress`、`/v1/retrieve` 的真实字段、CCR 模式和 contract test 边界。

### 架构与工程实践

- [百万级终端插件生命周期管理：状态、心跳与受控发布](/note/plugin-lifecycle-management) — 以状态、合并心跳、幂等调度、灰度和熔断组织终端控制面。

## 实体页（entity）

暂无。待摄入个人项目、工具、框架和运行环境，并确认来源归属后建立。

## 综合页（synthesis）

- [Java 后端面试复盘：项目真实性、工程机制与生产证据](/note/java-internship-interview-blog-polished) — **provisional** 综合项目表达、缓存机制和生产排障证据，不是面试题清单。
- [Headroom 单端口路由综合：入口、动态上游与验证边界](/note/headroom-single-port-evolution) — **provisional** 综合 8787 入口、动态上游和历史路由假设。
- [Headroom 路由持久化综合：Named Profile、model_cache 与恢复](/note/omp-headroom-persistence) — **provisional** 归纳状态隔离、reconciler 和恢复验证，不代表所有版本都适用。
- [Enhanced UISA：异构节点信息同步的 owner、边界与恢复模型](/note/uisa-architecture-design) — **provisional** 综合 owner、可靠性、幂等、异构能力和失败恢复的设计权衡。

## 原始来源（raw）

| slug | 类型 | 来源 | 摘要 |
| --- | --- | --- | --- |
| `karpathy-llm-wiki` | gist | [原始 URL](https://gist.githubusercontent.com/karpathy/442a6bf555914893e9891c11519de94f/raw/ac46de1ad27f92b28ac95459c782c07f6b8c964a/llm-wiki.md) | 用 LLM 增量构建个人知识库的模式说明。 |
| `legacy-java-atomic-boolean` | git-history | [历史文件](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/jotting/zh-cn/java-atomic-boolean.md) | AtomicBoolean、volatile、CAS 和并发状态管理原文。 |
| `legacy-java-auto-closeable` | git-history | [历史文件](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/jotting/zh-cn/java-auto-closeable.md) | AutoCloseable 与 try-with-resources 原文。 |
| `legacy-java-null-value` | git-history | [历史文件](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/jotting/zh-cn/java-null-value.md) | Spring Cache NullValue 与缓存 null 原文。 |
| `legacy-java-internship-interview-blog-polished` | git-history | [历史文件](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/java-internship-interview-blog-polished.md) | Java 后端实习面试复盘原文。 |
| `legacy-java-online-performance-debug` | git-history | [历史文件](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/java-online-performance-debug.md) | Java 线上 CPU、Arthas 和恢复决策原文。 |
| `legacy-containerd-tls-troubleshooting` | git-history | [历史文件](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/containerd-tls-troubleshooting.md) | containerd 私有仓库 TLS 排障原文。 |
| `legacy-intranet-penetration-ssh-guide` | git-history | [历史文件](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/intranet-penetration-ssh-guide.md) | Cloudflare Tunnel、Tailscale、FRP 与 SSH 原文。 |
| `legacy-mysql-performance-troubleshooting` | git-history | [历史文件](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/mysql-performance-troubleshooting.md) | MySQL 性能 SOP 与排障原文。 |
| `legacy-headroom-single-port-evolution` | git-history | [历史文件](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/headroom-single-port-evolution.md) | Headroom 单端口架构演进原文。 |
| `legacy-omp-config-and-rules-guide` | git-history | [历史文件](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/omp-config-and-rules-guide.md) | OMP 配置、规则和模型路由原文。 |
| `legacy-omp-headroom-persistence` | git-history | [历史文件](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/omp-headroom-persistence.md) | Headroom 持久化和路由恢复原文。 |
| `legacy-omp-hook-extension-guide` | git-history | [历史文件](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/omp-hook-extension-guide.md) | OMP Hook、图谱提示和状态栏扩展原文。 |
| `legacy-plugin-lifecycle-management` | git-history | [历史文件](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/plugin_lifecycle_management_blog.md) | 大规模终端插件生命周期管理原文。 |
| `legacy-uisa-architecture-design` | git-history | [历史文件](https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/uisa-architecture-design.md) | UISA 混合云与异构节点架构原文。 |
| `headroom-0-34-compress-retrieve-contract` | upstream-source-and-contract-test | [固定版本源码](https://github.com/headroomlabs-ai/headroom/tree/v0.34.0) | Headroom 0.34.0 压缩与检索 API 契约、模式和真实端点验证。 |

raw 文件位于 `src/content/raw/zh-cn/`，只供 LLM 阅读，不生成公开路由。来源快照写入后不可修改。

## 捕获收件箱

- [知识库摄入收件箱](/jotting/kb-ingest-todo) — 记录下一批个人项目来源和待回答问题；本批历史文章已完成摄入。

## 维护规则

- 每个 active/provisional wiki 页面必须在这里登记，并提供一句话摘要。
- 每个稳定结论必须能够通过 `sources` 回溯到 raw。
- 新增来源或页面后，同步追加 [操作日志](/kb#log)。
- lint 发现孤儿页、重复页、断链或冲突时，先修证据链，再修文案。
