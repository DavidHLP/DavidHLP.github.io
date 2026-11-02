---
{
  "variant": "java-vue",
  "title": "Java + Vue",
  "lang": "zh-CN",
  "role": "Java + Vue 全栈开发工程师",
  "summary": "以 Java 后端为主，具备 Vue 3 / TypeScript / Nuxt 4 页面与 API 联调实践，关注业务闭环、权限边界和异常处理。"
}
---

## <span class="resume-section-number">[ SEC 01 ]</span> 实习经历

### 博彦科技

<p class="resume-meta">2026.01 - 2026.06</p>

<p class="resume-meta">后端开发实习生｜阿里云专有云 · 安骑士主机安全项目</p>

- **业务背景**：参与安骑士主机安全产品服务端研发，负责集群资源数据接入、AI 资产识别、资源查询优化与线上问题排查。
- **GPU 资源接入**：对接平台侧、ECS、BMS、BMCP 等团队，独立完成集群侧 GPU 信息接入与聚合，支撑资源统计、条件筛选与关联查询。
- **AI 资产识别**：参与功能建设，独立搭建 OpenClaw、Ollama 测试容器环境；结合容器状态、GPU 关系与漏洞数据，实现资产状态判断、GPU 关联及风险展示逻辑。
- **复杂查询优化**：针对资源查询接口延迟，分析 SQL 执行计划，调整索引、查询条件与覆盖字段，降低资源列表及统计接口的查询耗时。
- **线上问题定位**：使用 Arthas `watch` / `trace` / `stack` 分析调用链、耗时、异常堆栈与关键参数，独立完成缺陷定位、修复及回归验证。
- **容器镜像排障**：定位 containerd 拉取 Harbor 私有镜像时的 TLS 证书校验与信任链问题，排查 CA、`certs.d`、`hosts.toml`、`imagePullSecrets` 与节点缓存，沉淀诊断脚本和排查清单。

## <span class="resume-section-number">[ SEC 02 ]</span> 项目经历

### 在线编程评测系统 UltiCode [GitHub](https://github.com/DavidHLP/UltiCode)

<p class="resume-stack">Java 17 / Spring Boot 3 / Spring Security / MySQL / Redis Streams / Vue 3 / TypeScript / Docker</p>

个人开源在线评测平台，连接用户侧题目、代码提交、判题结果与管理端题目、比赛操作；后端采用业务 Owner 服务与独立 Judge Worker。

- **前后端业务闭环**：对接题目查看、代码编辑、提交及判题结果页面；浏览器与真实 Judge 验收覆盖登录、AC/WA、管理端编辑读回、重判和比赛排名。
- **认证与请求重放**：Cookie 会话与 CSRF 配合后端刷新轮换；认证刷新后重放请求时附带新的 CSRF Token，保留原始载荷、账号绑定与单次重试限制。
- **后端可靠性**：事务 Outbox 与 Redis Streams 处理可靠投递，Lua 合并去重标记和入队；`generation` + `attemptId`、租约与 SQL CAS 防止旧判题覆盖新结果。
- **运行与验证**：Docker 约束不可信代码的网络、权限及资源；真实 MySQL 新装/升级迁移和浏览器业务验收接入 CI，发布制品按签名与来源校验。

### BossAnalyze 招聘数据分析 [GitHub](https://github.com/DavidHLP/BossAnalyze)

<p class="resume-stack">Java 17 / Spring Boot 3 / Spark / Scala / Vue 3 / TypeScript / Nuxt 4 / shadcn-vue / MySQL</p>

围绕既有 Java/Spark API 重建管理与招聘分析页面，保留接口契约、授权规则及已有业务数据，重点处理真实接口联调、状态展示和异常分支。

- **分析页面与组件**：实现城市/职位筛选、样本摘要、SVG 散点图、前端分页、只读职位详情和独立薪资排名；复用四类既有 Spark 读取接口。
- **认证与权限**：分析路由要求登录，匿名访问登录后回到原路由；普通账号可进入分析页，未获授权的管理路由仍返回 403，不通过前端入口扩大服务端权限。
- **数据与交互状态**：区分空数据、未知薪资和数值零，处理加载、失败与重试；外部来源链接拒绝可执行协议或含凭据的 URL。
- **契约问题修复**：共享解析器兼容缓存产生的整数毫秒时间戳与有效日期字符串；创建/编辑简介与既有 `varchar(255)` 一致，超长输入拒绝提交而非静默截断。
- **回归与响应式**：通过前端测试、Nuxt 类型检查和构建；验证筛选参数、分页、详情与窄屏布局。真实接口验证覆盖空库场景，非空图表与分页另用浏览器夹具验证。

## <span class="resume-section-number">[ SEC 03 ]</span> 专业技能

### Java 后端

- 熟悉 Java、Spring Boot、Spring Security、MyBatis-Plus、MySQL；具有 API 设计、认证鉴权、SQL 执行计划与索引优化实践。
- 具有 Redis 缓存防护、分布式锁、Streams、Outbox、Dubbo 与 Docker 实践，理解事务边界、重试及最终一致性。
- 能结合 Arthas、Linux、容器日志与 SQL 观测排查问题，并通过回归与真实服务检查验证修复。

### Vue 前端与联调

- 具有 Vue 3、TypeScript、Nuxt 4、shadcn-vue 项目实践，能够拆分页面组件、组织表单与列表状态，处理响应式布局。
- 实践 Cookie/CSRF、登录跳转、权限反馈和 API 数据解析；按后端契约处理空值、零值、时间戳、长度限制与错误重试。
- 使用前端回归测试、类型检查、构建及浏览器交互验证业务闭环，区分真实持久化数据与仅用于界面验证的夹具。

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

**codebase-memory-mcp**：[PR #1229](https://github.com/DeusData/codebase-memory-mcp/pull/1229) **已合并**。新增 Oh My Pi（OMP）客户端接入，支持配置目录识别、MCP 注册、Skill 安装及安装/卸载流程，补充配置隔离与用户内容保留测试。

[PR #2203](https://github.com/DeusData/codebase-memory-mcp/pull/2203) **已合并**。修复 Linux 系统路径别名导致安装暂存失败的问题，仅允许 root 所有的受信任系统别名，保留对任意用户符号链接的拒绝规则，并补充成功与拒绝路径验证。

### 代表性技术知识页

- [Java 线上性能排障：从症状到证据的最小决策树](https://davidhlp.github.io/blog/legacy/note/zh-cn/java-online-performance-debug/)：串联进程、线程栈、GC 与 Arthas 观测，整理止损、存证、定位及恢复流程。
- [containerd TLS：证书信任链与临时跳过验证的决策](https://davidhlp.github.io/blog/legacy/note/zh-cn/containerd-tls-troubleshooting/)：区分运行时 CA、节点信任、Registry 认证与镜像缓存，整理分层诊断路径。

