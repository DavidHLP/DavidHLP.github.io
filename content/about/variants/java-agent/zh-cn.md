---
{
  "variant": "java-agent",
  "title": "Java + Agent",
  "lang": "zh-CN",
  "role": "Java 后端 / Agent 应用开发",
  "summary": "2026 届本科，以 Java 后端为主，结合 Python / LangGraph 将 Agent 接入既有业务，重点处理身份隔离、来源约束与确认后保存。"
}
---

## <span class="resume-section-number">[ SEC 00 ]</span> 核心优势

- **Java 业务 + Agent**：沿用 Java 身份与数据授权，用 Python/FastAPI、LangGraph 实现受控工具调用、带来源分析和多轮会话。
- **可恢复操作**：以 owner 校验、草稿版本、显式确认及同一幂等键读回处理取消、过期确认和写入结果不明，区分实现与正式验收。
- **边界验证**：以双普通账号 HTTP 对照、真实模型对抗和引用核对验证隔离，覆盖身份替换、跨账号请求与资料注入场景。

## <span class="resume-section-number">[ SEC 01 ]</span> 实习经历

### 博彦科技

<p class="resume-meta">2026.01 - 2026.06</p>

<p class="resume-meta">后端开发实习生｜阿里云专有云 · 安骑士主机安全项目</p>

- **资源接入与业务交付**：参与阿里云专有云安骑士主机安全后端研发；对接平台侧、ECS、BMS、BMCP，独立实现集群侧 GPU 信息接入与聚合，支撑统计、条件筛选和关联查询。
- **AI 资产识别**：参与功能建设，独立搭建 OpenClaw/Ollama 测试容器；结合容器状态、GPU 关系和漏洞数据，实现资产状态判断、关联与风险展示。
- **查询优化与线上修复**：分析 SQL 执行计划，调整索引、查询条件及覆盖字段，降低列表/统计查询耗时；使用 Arthas `watch` / `trace` / `stack` 定位调用链、耗时、异常及关键参数，独立完成修复与回归。
- **镜像信任链排障**：定位 containerd 拉取 Harbor 私有镜像的 TLS 校验问题，排查 CA、`certs.d`、`hosts.toml`、`imagePullSecrets` 与节点缓存，形成诊断脚本和排查清单。

## <span class="resume-section-number">[ SEC 02 ]</span> 项目经历

### 在线编程评测系统 UltiCode [项目官网](https://ulticode.davidhlp.dpdns.org/) · [GitHub](https://github.com/DavidHLP/UltiCode)

<p class="resume-stack">Java 17 / Spring Boot 4 / Spring Security / MySQL / Redis Streams / Dubbo / Flyway / Docker</p>

个人开源在线评测平台，Java 服务持有身份、题目、提交与业务记录，独立 Judge Worker 执行判题；Agent 通过既有 HTTP 契约接入业务。

- **可靠任务投递**：在同一事务写入提交与 Outbox，后台向 Redis Streams 投递并退避重试；Lua 合并去重标记与入队，结合超时回收及死信处理故障窗口。
- **执行结果竞争控制**：以 `generation` + `attemptId`、租约与心跳标识有效执行；SQL CAS 拒绝过期判题覆盖新结果，Docker 限制不可信代码的权限与资源。
- **身份与验收**：刷新令牌哈希存储、单次消费与事务内轮换；将真实 MySQL 迁移、浏览器/Judge 的登录、AC/WA、重判与排名验收接入 CI。

### UltiCode Agent 业务集成（实验功能） [源码](https://github.com/DavidHLP/UltiCode/tree/main/services/agent)

<p class="resume-stack">Python / FastAPI / httpx / LangGraph / SQLite / SSE / MCP / Java Auth & App API</p>

围绕本人普通练习提交提供受控分析、多轮会话与可选学习计划。桌面工作区支持资料选择、源码授权和引用预览；Java 保留身份及业务数据主权。

- **可信身份与工具边界**：请求身份来自 Java `/auth/me`，每次请求使用隔离 Cookie 客户端；只开放白名单只读工具，校验参数并投影返回字段，模型不能指定或改写用户归属。
- **有界模型/工具循环**：使用 LangGraph 编排模型、工具和结果，设置轮次与总时长上限；区分工具失败、超限与取消，工具结果作为数据处理，不接受其中的越权指令。
- **会话与检查点**：按 owner、conversation/turn、thread/run 和草稿版本管理 SQLite 状态；恢复时重新检查归属，取消栅栏阻止旧运行继续保存结果，区分对话历史与学习计划线程。
- **显式确认与结果核对**：编辑草稿后使旧确认失效；保存需单独确认并绑定当前版本及摘要。Java 写入结果不明时保留未决状态，以同一幂等键读回核对，不换新键盲目重试。
- **资料与 MCP 投影**：保留来源范围、版本与位置；源码按既有授权仅在请求期使用，不写入对话、事件或检查点。可选 stdio MCP 仅暴露本人提交列表，沿用认证客户端及严格字段投影。

<p class="resume-meta">已核对双账号 HTTP/模型隔离与带来源分析的阶段验收记录；学习计划写入和故障恢复不宣称正式验收完成。实时分析与持久化分别显式启用，未宣称生产部署或真实用户试点。</p>

## <span class="resume-section-number">[ SEC 03 ]</span> 专业技能

### Java 后端与可靠性

- 熟悉 Java、Spring Boot、Spring Security、MyBatis-Plus；具有 API 设计、认证鉴权、MySQL 查询优化与事务边界实践。
- 具有 Redis 缓存防护、分布式锁、Streams、Outbox 与 Docker 隔离实践，理解重试、重复消费及最终一致性。
- 能结合 Arthas、SQL 执行计划、Linux 和容器日志定位问题，使用并发测试、Testcontainers 与 CI 验证故障场景。

### Agent 应用与业务集成

- 具有 Python、FastAPI、httpx 与 LangGraph 项目实践，能够围绕既有 Java API 组织工具调用、超时、取消与流式事件。
- 实践服务端可信身份、白名单工具、字段投影、资料授权及上下文边界；区分模型建议、用户确认与实际业务写入。
- 实践 SQLite 会话/检查点、归属与版本校验、幂等保存和未知结果核对；区分受控测试、真实服务验证与生产交付。

## <span class="resume-section-number">[ SEC 04 ]</span> 教育背景 & 荣誉

### 教育背景

**洛阳师范学院**

数据科学与大数据技术 · 本科

<p class="resume-meta">GPA: 3.6 / 4.0 (2021.09 - 2026.07)</p>

### 荣誉奖项

- 2025 蓝桥杯 Java 软件设计 B 组 · **国家级三等奖**

- 2024 泰迪杯数据分析技能赛 · **国家级三等奖**

- 2023 全国高校计算机能力挑战赛 · **国家级三等奖**

## <span class="resume-section-number">[ SEC 05 ]</span> 开源贡献与技术沉淀

### 开源贡献

**[codebase-memory-mcp](https://github.com/DeusData/codebase-memory-mcp)**：三项贡献已合并，涵盖 [Oh My Pi 接入](https://github.com/DeusData/codebase-memory-mcp/pull/1229)、[Linux 安装兼容](https://github.com/DeusData/codebase-memory-mcp/pull/2203)与 [Swift 重载及调用关系解析](https://github.com/DeusData/codebase-memory-mcp/pull/2436)。 发现并定位 Swift 变量遮蔽导致的错误调用关系，促成[维护者修复](https://github.com/DeusData/codebase-memory-mcp/pull/2947)。

**[b-end-design-system-skill](https://github.com/Ludi-Herry/b-end-design-system-skill)**：完善多客户端安装文档与覆盖保护，修复 Cursor 资源接入及审计误报（[Codex](https://github.com/Ludi-Herry/b-end-design-system-skill/pull/7) · [Claude Code](https://github.com/Ludi-Herry/b-end-design-system-skill/pull/8) · [Cursor](https://github.com/Ludi-Herry/b-end-design-system-skill/pull/9) · [Windsurf](https://github.com/Ludi-Herry/b-end-design-system-skill/pull/10) · [Antigravity](https://github.com/Ludi-Herry/b-end-design-system-skill/pull/11) · [Audit](https://github.com/Ludi-Herry/b-end-design-system-skill/pull/12)）。

**[vue-dnd-kit](https://github.com/ZiZIGY/vue-dnd-kit)**：修正 Dashboard 安装命令大小写（[PR #22](https://github.com/ZiZIGY/vue-dnd-kit/pull/22)）。

### 代表性技术知识页

- [Java 线上性能排障：从症状到证据的最小决策树](https://davidhlp.github.io/blog/legacy/note/zh-cn/java-online-performance-debug/)：串联进程、线程栈、GC 与 Arthas 观测，整理止损、存证、定位及恢复流程。
- [UltiCode Outbox 与 Redis Streams：把判题投递做成可恢复状态](https://davidhlp.github.io/blog/legacy/note/zh-cn/ulticode-outbox-redis-streams/)：梳理事务 Outbox、原子投递、重试、死信与待确认消息回收。
