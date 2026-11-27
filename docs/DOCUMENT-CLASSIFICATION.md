# 全仓文档分类登记表

> 状态：`active` | 基准：`c4e49d1` + 2026-11-27 工作树 | 正典语言：`zh-cn`
> 审计证据：[wiki-audit.md](classification/wiki-audit.md)（知识库层）与 [maintenance-audit.md](classification/maintenance-audit.md)（维护/归档/镜像层）
> 约束：不修改 `src/content/raw/`；不移动归档 ID、URL、draft 开关与保护面正文

本文件是仓库全部文档的分类权威登记。逐文件证据与正文级判断保存在两份审计附录中；本文件负责裁决、口径和整改边界。

## 一、单一正典裁决（P0）

此前 `KB.md` 指向 `src/content/note/`，而构建、`kb:lint` 与 `migration/README.md` 指向 `content/blog/legacy/`，形成双轨。裁决如下：

| 层 | 位置 | 权限 | 说明 |
|---|---|---|---|
| 现行 Wiki / 索引 / 日志 / 收件箱 / 序文 | `content/blog/legacy/{note,information,jotting,preface}/{locale}/` | **可编辑正典** | Astro loader、`kb:lint`、发布路由与三语校验的实际目标 |
| 不可变证据 | `src/content/raw/zh-cn/`（+ `.manifest.sha256`） | 只读 | 由 `sha256` 与 Git 变更门保护；只能新增来源或 correction |
| 冻结迁移快照 | `src/content/{note,information,jotting,preface}/{locale}/` | 只读 | 固定于 `f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64`，不再作为 wiki 编辑入口 |
| 不可变归档 | `migration/source/`、`migration/fuwari/` | 只读 | 逐字节取证快照与脱敏上游归档 |
| 生成产物 | `public/archives/*.txt`、`content/blog/legacy/**` 的 TXT 导出 | 自动再生 | 由 `npm run export:archives` 覆盖，手动编辑会被冲掉 |
| 保护面 | `content/blog/legacy/information/{locale}/introduction.md`、`linkroll.md`、`chronicle.md`、`policy.md`、首页 | 不进分类整改 | 个人身份层；除非用户明确要求，不改写正文 |

因此，`KB.md` 与 `.claude/skills/knowledge-base.md` 中的 `src/content/note/` 路径已过时，应按本裁决修正。`src/content/note/` 仍是有价值的迁移证据，但不是线上正典。

## 二、分类坐标

### 2.1 KB 层

| 值 | 含义 |
|---|---|
| `schema` | 宪法、规程、分类口径 |
| `raw-evidence` | 不可变来源快照 |
| `wiki` | `concept` / `entity` / `synthesis` 知识页 |
| `inbox` | 待摄入收件箱 |
| `navigation` | 索引、日志、序文 |
| `protected-identity` | 个人介绍、友链、时间线、政策、首页 |
| `project-maintenance` | 工程维护文档 |
| `agent-contract` | Agent 指令与技能 |
| `archival-source` | 迁移快照与上游归档 |
| `generated-mirror` | 由正典/导出脚本生成的镜像 |
| `config` | 站点与工具配置 |

### 2.2 六域 + 归档 + 站点

| 域 | 含义 | 对应站点五列 |
|---|---|---|
| A | 知识库与 AI 工程 | AI 工具 |
| B | Java 与并发 | 后端工程 |
| C | 存储与缓存 | 后端工程 / 系统运维 |
| D | 分布式与微服务 | 后端工程 |
| E | 基础设施与运维 | 系统运维 |
| F | 工程与架构 | 项目实践 / AI 工具 |
| G | 已归档与已废弃 | 任意（仅归档区） |
| M | 站点与内容运营 | 站点随笔 |

站点五列是展示层，六域是知识索引层；两者不是一一映射，跨域页面保留一个主域和一个显式交叉入口。

### 2.3 生命周期

- `active`：固定版本/提交 + 可重复验证步骤 + 双向关系闭环。
- `provisional`：来源可信，但缺固定版本、可重复实验或多来源收敛；必须列 3 条毕业检查。
- `deprecated`：被新证据替代或归档；只在 G 区登记。
- `historical` / `immutable`：维护文档与迁移快照的档案状态。

## 三、覆盖台账

| 文档集 | 文件数 | 层 | 处置 |
|---|---:|---|---|
| `content/blog/legacy/note` | 210（70 slug × 3） | wiki 正典 | 逐篇分类，见 §4 |
| `content/blog/legacy/{information,jotting,preface}` | 27 | navigation / inbox / protected | 索引、日志、收件箱、保护面 |
| `src/content/note` | 174 | 冻结快照 | 只读，不再编辑 |
| `src/content/raw/zh-cn` | 54（53 md + manifest） | raw-evidence | 只读，见附录 A |
| `src/content/{information,jotting,preface}` | 24 | 冻结快照 | 只读 |
| `docs/` | 33 | project-maintenance / schema / agent-contract | 逐文件登记，见附录 B |
| 根目录文档 | 11 | project-maintenance / agent-contract / config | 逐文件登记，见附录 B |
| `.claude/` | 9 | agent-contract | 见附录 B |
| `migration/source` | 307 | archival-source | 分组登记，不可变 |
| `migration/fuwari` | 150 | archival-source | 分组登记，不可变 |
| `migration/{README.md,manifest.json,publication-overrides.json}` | 3 | project-maintenance / config | 保持 |
| `public/archives/*.txt` | 237 | generated-mirror | 与 archiveId 1:1，自动再生 |
| `.github/`、`.serena/`、`content/` 根配置 | 20 | config | 见附录 B |

## 四、Wiki 逐篇分类（70 slug）

`现域/kind/status` 为 2026-11-27 线上值。`目标` 列是本轮裁决；未标注者保持现状。

| slug | 现域 | kind | status | 目标 | 裁决 |
|---|---|---|---|---|---|
| containerd-tls-troubleshooting | E | concept | provisional |E | 保留；补固定 containerd 1.x/2.x 复现 |
| database-schema-drift | D | concept | active |D | 保留；补 MySQL 性能/存储/Spark 回链 |
| database-written-test-review | C | concept | provisional |C / **concept** | 已收为复盘方法入口并拆出 4 个子页（SQL JOIN/日期方言/MySQL 同表 DML/可恢复批抽数） |
| sql-join-null-semantics | C | concept | provisional |C | 原生 Wiki 页（`X-1300`..`X-1302`），自 `database-written-test-review` 拆出 |
| sql-date-dialect-boundaries | C | concept | provisional |C | 原生 Wiki 页（`X-1303`..`X-1305`），自 `database-written-test-review` 拆出 |
| mysql-same-table-dml | C | concept | provisional |C | 原生 Wiki 页（`X-1306`..`X-1308`），自 `database-written-test-review` 拆出 |
| recoverable-batch-extraction | C | concept | provisional |C | 原生 Wiki 页（`X-1309`..`X-1311`），自 `database-written-test-review` 拆出 |
| docker-fundamentals | E | concept | provisional |E | 保留；镜像/数据/网络待拆，补固定版本 |
| dubbo-nacos-runtime | D | concept | active |D | 保留 |
| frontend-mybatis-essays | G | synthesis | deprecated |G | 归档；旧 synthesis 仅作历史标签 |
| hbase-foundation-and-ops | C | concept | provisional |C | 保留；数据模型/Region/RowKey 待拆 |
| headroom-cc-switch-coexistence | F | concept | provisional |**A** / **concept** | 收窄为单一整理责任概念 |
| headroom-compress-retrieve-contract | F | concept | active |**A** | 归入 AI 工程 |
| headroom-single-port-evolution | F | synthesis | provisional |**A** | 归入 AI 工程；缓存/回滚细节移交持久化与共存页 |
| hindsight-local-deployment-and-agent-integration | G | concept | deprecated |G | 已由三页替代，保留历史入口 |
| hindsight-local-deployment | A | concept | provisional |A | 保留 |
| hindsight-omp-codex-integration | A | concept | provisional |A / **concept** | 正文是桥接方法，收为 concept |
| hindsight-troubleshooting | A | concept | provisional |A | 保留 |
| intranet-penetration-ssh-guide | E | concept | active |E | 保留 |
| java-atomic-boolean | B | concept | active |B | 保留 |
| java-auto-closeable | B | concept | active |B | 保留 |
| java-concurrency-deepdive | B | concept | provisional |B | 已拆出 CAS/锁与协作/引用类型 3 个子页，父页收窄 |
| java-cas-and-aba | B | concept | provisional |B | 原生 Wiki 页（`X-1318`..`X-1320`），自 `java-concurrency-deepdive` 拆出 |
| java-locks-and-thread-coordination | B | concept | provisional |B | 原生 Wiki 页（`X-1321`..`X-1323`），自 `java-concurrency-deepdive` 拆出 |
| java-reference-types | B | concept | provisional |B | 原生 Wiki 页（`X-1324`..`X-1326`），自 `java-concurrency-deepdive` 拆出 |
| java-internship-interview-blog-polished | F | synthesis | provisional |F | 保留 |
| java-null-value | B | concept | active |B | 保留 |
| java-online-performance-debug | E | concept | active |**E** | 主域 E；B 保留交叉入口 |
| jjwt-013-security-api | B | concept | active |B | 保留 |
| kb-session-ingest-contract | A | concept | active |A | 保留 |
| llm-wiki-pattern | A | concept | active |A | 保留 |
| mcp-codebase-memory-workflow | A | concept | active |A | 已拆出 `mcp-modern-legacy-compatibility`，父页收窄 |
| mcp-modern-legacy-compatibility | A | concept | provisional |A | 原生 Wiki 页（`X-1315`..`X-1317`），自 `mcp-codebase-memory-workflow` 拆出 |
| microservice-data-ownership | D | concept | active |D | 保留 |
| multi-service-readiness | D | concept | active |D | 保留 |
| mysql-performance-troubleshooting | C | concept | active |C | 保留 |
| mysql-storage-and-deadlock | C | concept | provisional |C | 保留 |
| omp-config-and-rules-guide | F | concept | active |**A** | 归入 AI 工程；compaction/TTSR 待拆 |
| omp-headroom-persistence | F | synthesis | provisional |**A** | 归入 AI 工程 |
| omp-headroom-provider-proxy | F | entity | provisional |**A** | 归入 AI 工程 |
| omp-hook-extension-guide | F | concept | active |**A** | 归入 AI 工程 |
| plugin-lifecycle-management | E | concept | provisional |**F** | 归入工程与架构 |
| redis-business-patterns | C | concept | provisional |C | 保留；缓存/锁/消息语义待拆 |
| redis-heima-practice | C | concept | deprecated | G | 已降 deprecated；多级缓存/批处理并入业务页，持久化由持久化页承接 |
| redis-jackson-java-time | B | concept | active |B | 保留 |
| redis-persistence-principle | C | concept | provisional |C | 保留 |
| resicache-early-expiration-cas | F | concept | provisional |F | 保留 |
| resicache-handler-chain-and-observer | F | concept | provisional |F | 保留；fragment/token 与 observer 页合并 |
| resicache-observer-nested-execution | D | concept | active |**F** | 主域 F；D 保留交叉入口 |
| resicache-serialization-migration | F | concept | provisional |F | 已拆出 `resicache-serialization-trust`，父页收窄 |
| resicache-serialization-trust | F | concept | provisional |F | 原生 Wiki 页（`X-1312`..`X-1314`），自 `resicache-serialization-migration` 拆出 |
| resicache-single-flight | F | concept | provisional |F | 保留 |
| resicache | F | entity | provisional |F | 保留总览，正文缩为项目定位与证据地图 |
| spark-bigdata-ecosystem | C | concept | provisional |C | 保留 |
| spring-cloud-and-boot | D | concept | provisional |D | 已拆出自动装配/事务/发现网关 3 个子页，父页收窄 |
| spring-boot-auto-configuration | D | concept | provisional |D | 原生 Wiki 页（`X-1327`..`X-1329`），自 `spring-cloud-and-boot` 拆出 |
| spring-transaction-boundaries | D | concept | provisional |D | 原生 Wiki 页（`X-1330`..`X-1332`），自 `spring-cloud-and-boot` 拆出 |
| spring-cloud-discovery-and-gateway | D | concept | provisional |D | 原生 Wiki 页（`X-1333`..`X-1335`），自 `spring-cloud-and-boot` 拆出 |
| testcontainers-docker-api | E | concept | active |E | 保留 |
| uisa-architecture-design | F | synthesis | provisional |F | 保留 |
| ulticode-async-execution-contract | F | concept | provisional |F | 保留 |
| ulticode-ci-supply-chain | F | concept | provisional |F | 保留；供应链门禁待拆 |
| ulticode-core-bounded-testbed | F | concept | provisional |F | 保留 |
| ulticode-docker-sandbox | F | concept | provisional |F | 保留 |
| ulticode-fenced-singleton-lease | F | concept | provisional |F | 保留 |
| ulticode-generation-attempt-fence | F | concept | provisional |F | 保留 |
| ulticode-outbox-redis-streams | F | concept | provisional |F | 保留 |
| ulticode-owner-and-facts | F | concept | provisional |F | 保留 |
| ulticode-owner-local-audit-inbox | F | concept | provisional |F | 保留 |
| ulticode | F | entity | provisional |F | 保留总览，正文缩为项目入口 |

状态复核建议：13 篇 `active` 缺固定版本或可重复实验，建议下一批降为 `provisional`：
`containerd-tls-troubleshooting`、`docker-fundamentals`、`hbase-foundation-and-ops`、`hindsight-local-deployment`、`hindsight-omp-codex-integration`、`hindsight-troubleshooting`、`java-concurrency-deepdive`、`mysql-storage-and-deadlock`、`plugin-lifecycle-management`、`redis-business-patterns`、`redis-persistence-principle`、`spark-bigdata-ecosystem`、`spring-cloud-and-boot`。
`redis-heima-practice` 建议由 `active` 降为 `deprecated` 并移入 G。本轮仅登记，不批量改状态，避免一次改动 49 份三语文件。

## 五、维护文档分类（docs/、根目录、Agent 层）

完整逐文件表见 [maintenance-audit.md §3](classification/maintenance-audit.md)。处置分组：

### 5.1 现行有效（keep）

- 站点运营：`docs/ABOUT.md`、`docs/ABOUT-ACCEPTANCE.md`、`docs/CLOUDFLARE-DEPLOYMENT.md`、`docs/I18N.md`、`docs/PWA.md`、`migration/README.md`、`content/README.md`
- 工程：`docs/agents/issue-tracker.md`、`docs/agents/triage-labels.md`
- 知识库：`KB.md`、`.claude/skills/knowledge-base.md`、`docs/kb-convergence-design.md`
- 入口：`README.md`、`PR15-ATTRIBUTION.md`、`CHANGELOG.md`（历史）

### 5.2 需更新或合并（fix）

| 文件 | 问题 | 动作 |
|---|---|---|
| `docs/README.md` | 仅登记 9/33，索引失效 | 本轮重写 |
| `AGENTS.md` | 混入 ThoughtLite 旧规则（pnpm/Svelte/site.config.ts） | 本轮删除重复段 |
| `README.zh-cn.md`、`README.ja.md` | 仍为 ThoughtLite 说明 | 按 `README.md` 同步 |
| `CONTRIBUTING.md` | pnpm/Biome/上游 fork 指引 | 按 npm + 本仓库重写 |
| `docs/SCRIPTS.md`、`docs/RUNBOOK.md` | 命令与技术栈过期 | 本轮按 `package.json`、workflows 重写；`docs/ENV.md` 已删除 |
| `.claude/rules/skill-autoload.md`、7 份 `.claude/skills/*`（除 knowledge-base） | ThoughtLite 幽灵规则 | 保留 knowledge-base；7 份技能移至 `docs/archive/skills/` |
| `.github/ISSUE_TEMPLATE/*`、`pull_request_template.md` | 外链 ThoughtLite、pnpm、cloudflare 分支 | 改为本仓库 |
| `.serena/project.yml` | `svelte` LSP | 改为 `typescript` |

### 5.3 归档（archive / deprecate，保留可追溯）

`docs/BUSINESS-AUDIT.md`、`docs/BUSINESS-IMPLEMENTATION.md`、`docs/I18N-SEMANTIC-AUDIT.md`、`docs/archive/UPDATE_SUMMARY.md`、`docs/archive/rhine-migration.md`、`docs/archive/computation-design.md`、`docs/archive/layout-rollback.md`、`docs/archive/mono-color-design.md`、`docs/archive/sailing-print.md`、`docs/archive/sailing-print-no-text.md`、`docs/archive/adr/0001`–`0006`、`docs/archive/CODEMAPS/*`、`docs/archive/GLOSSARY.md`、`docs/archive/skills/*`、`CHANGELOG.md`（历史）。

已删除、仅保留 Git 历史：`docs/ENV.md`、`pnpm-workspace.yaml`、`.github/release-please-config.json`、`.github/.release-please-manifest.json`。

### 5.4 待摄入 Wiki 与历史本地稿

- `arthas.md`：处置状态为 `keep-historical-local-draft`。保留根目录历史稿，顶部标注来源横幅；不新增 raw，不作为 `sources`，不并入 wiki 正文。
- `docs/kb-convergence-design.md`：保持 schema 配套文档；其稳定模式已由 `llm-wiki-pattern` 引用，不复制正文。

## 六、生成镜像与归档层

- `content/blog/legacy/**` 是发布正典，不再是 `src/content/` 的机械镜像。审计测得 201 份中 75 份一致、123 份漂移、3 份仅镜像存在（三语 `introduction.md`）。漂移是后续迁移的合法演进，不回写冻结快照。
- `public/archives/RHINE-LAB-X-1001..1201.txt` 与 201 份发布文档 `archiveId` 严格 1:1，由 `npm run export:archives` 再生。
- `migration/source`（307）、`migration/fuwari`（150）为不可变证据，只登记不分类整改。
- 三语 Wiki 正文存在 10 处强漂移、1 处部分漂移；已确认的关键事实（Hindsight Bank 逻辑分区、OMP 17.2.15、ResiCache/UltiCode 新来源）在发布层已修正。冻结快照中的旧译文不作为事实源。

## 七、本轮已执行与待办

分类基础设施与最终裁决均已执行：

1. 建立本登记表与两份审计附录。
2. 重写 `docs/README.md` 为分类索引。
3. 修正 `KB.md`、`AGENTS.md`、`.claude/skills/knowledge-base.md` 的正典路径与过期技术栈。
4. 修复 `README.md`、`docs/archive/UPDATE_SUMMARY.md` 断链。
5. 线上三语索引：执行 10 项主域迁移；将 3 篇 kind 收正。
6. 状态裁决：13 篇 `active → provisional`（`containerd-tls-troubleshooting`、`docker-fundamentals`、`hbase-foundation-and-ops`、`hindsight-local-deployment`、`hindsight-omp-codex-integration`、`hindsight-troubleshooting`、`java-concurrency-deepdive`、`mysql-storage-and-deadlock`、`plugin-lifecycle-management`、`redis-business-patterns`、`redis-persistence-principle`、`spark-bigdata-ecosystem`、`spring-cloud-and-boot`），`redis-heima-practice → deprecated` 并移入 G；叠加 T0-T5 新增 12 篇原生 `provisional` Wiki 页（`X-1300`..`X-1335`），当前共 70 slug（20 active / 47 provisional / 3 deprecated）。
7. 三语毕业观察板同步为 47 个唯一 provisional；13 篇降级页与 12 篇新建拆分页各配 3 条可证伪毕业检查。
8. 关系图：新增 23 条反链、剪除 22 条噪音边（含 A14 附带剪边）；三语正文交接、`related` 与发布覆盖已同步。
9. 原生路径与五组拆分（T0-T5）：`scripts/check-content.mjs` 已支持无 `legacy` 的 `content/blog/legacy/note/<locale>/` 原生页；B01/B02/B03/B06/B07 五组父页已收窄并保留全部既有标题/编号/锚点/URL，B04/B05/B09/B10 保持单页。
10. 内容合并：`redis-heima-practice` 的多级缓存与批处理选段并入 `redis-business-patterns`，课程页首屏标为历史。
11. 维护文档：按 `docs/classification/decisions-maintenance.md` 归档、删除与重写，并已修正 `docs/kb-convergence-design.md` 冻结快照旧路径。
12. 追加 `kb-log.md` 维护记录。

裁决依据：[wiki 裁决](classification/decisions-wiki.md)、[维护文档裁决](classification/decisions-maintenance.md)、[执行规格](classification/rewrite-execution-spec.md)。

保留边界（未执行或明确不拆）：

- B04 Docker、B05 HBase、B09 OMP 配置、B10 UltiCode 供应链：裁决为保持单页，无拆分补丁。
- 新建 12 篇拆分页保持 `status: provisional` 与各自“未验证”边界，待后续固定版本复现后升级。

## 八、验证

```bash
npm run kb:lint
npm run build
npm run check:content
npm run check:viewport
```
