---
title: "KB 会话摄入管道契约：增量复用、redaction v19 与不可变 raw"
timestamp: 2026-08-13 00:00:00+08:00
series: "个人 AI 知识库"
kind: concept
status: active
sources: ["kb-ingest-pipeline-v19"]
related: ["llm-wiki-pattern"]
tags: [Knowledge Base, Ingestion, Redaction, Hashing, Manifest, Raw Evidence]
description: "固定提交 c0ae74e 中 KB 会话摄入管道的最小契约：身份/内容哈希驱动增量复用、失败记录不复用、redaction v19、内部控制面过滤、partial checkpoint 断点续跑与 raw manifest 不可变校验，并澄清占位符语义与脱敏边界。"
toc: true
---

本知识库自身的会话摄入管道把工具会话（OMP、Codex、OpenCode、Hindsight、prompt-history）转成可入 wiki 的候选证据。核心保证一句话：**内容没变的来源增量复用，内容变了或失败过的来源重新处理，只有通过 v19 脱敏与内部控制面过滤的文本才能落盘，raw 证据层由 manifest 哈希锁死。** 本页是固定提交的契约快照，只描述可复核行为，不记录任何真实账本内容或运行统计。

## 适用版本与场景

- 固定点：公开仓库 `DavidHLP/DavidHLP.github.io` 提交 `c0ae74e72982910e13c46de0b92cf8fb9a8d1751`。
- 证据文件（均在该提交）：`KB.md`、`.claude/skills/knowledge-base.md`、`scripts/kb-ingest-sessions.ts`、`scripts/kb-ingest-sessions.test.ts`、`scripts/kb-lint.ts`。
- 适用场景：需要判断"某次运行该复用 prior 账本还是重处理该来源"、需要把会话文本脱敏后安全落盘、或需要排查摄入/校验失败原因时。升级或改动管道后，应回到该提交重新核对契约。

## 核心机制：身份哈希与内容哈希分离

增量复用的判定基于两个独立哈希的分离：

- **身份键**：`tool \0 hashIdentifier(project) \0 hashIdentifier(session)`，不含内容哈希，用于跨 run 判定"同一个来源"。`hashIdentifier(v) = sha256(v.normalize("NFKC"))`，项目与会话身份入账前先 NFKC 规范化再哈希。
- **内容哈希**：`contentHash` 按来源类型计算——OMP / Codex / prompt-history 为读取时文件字节的 SHA-256；OpenCode SQLite 为 `sha256(JSON.stringify({session, rawHashes}))`（`rawHashes` 是每行 message/part 行 JSON 的 SHA-256 数组）；Hindsight 为 `sha256(JSON.stringify(value))`。
- **来源键**：`source_key = sha256(tool \0 hashIdentifier(project) \0 hashIdentifier(session) \0 contentHash)`，是账本条目与 partial 覆盖的定位键。
- 候选去重指纹：`normalizedFingerprint = sha256(normalizeText)`，`normalizeText` = NFKC + `toLocaleLowerCase` + 空白折叠 + trim。
- 测试锚点：相同 tool/项目/会话/内容 ⇒ 相同 sourceKey；追加内容 ⇒ contentHash 与 sourceKey 改变；换 tool ⇒ key 改变；`source_changed_during_read` 的来源不产出候选。prompt-history 的 `sessionIdentity` 固定为文件路径，追加内容后 identity 不变而 contentHash 变化。

含义：身份键回答"是谁"，内容哈希回答"变没变"，source_key 才是账本条目；不要把会话身份哈希当成内容指纹。

## 失败记录不复用

复用 prior 候选的硬性条件（全部满足才走未变更分支）：

1. `prior.parse_status !== "failed"`；
2. `prior.content_hash === 当前 contentHash`；
3. `redaction_status` 以 `:v19` 结尾；
4. prior 账本完整（candidates 数 = candidate_count，且 count>0 或 rejected 非空）。

因此解析失败过的来源即使内容哈希未变，也会被重新解析、重新抽取候选。测试锚点："reprocesses a previously failed source even when its content hash is unchanged"（把 prior manifest 改为 `parse_status: failed` 并清空候选账本后重跑，断言来源被重新处理且候选重新产出）。来源层 `error` 存在时以 `malformed_or_unavailable_source` 记入 rejected；读取前后文件 size/mtime 不一致的来源不产出候选并计入失败。

## Redaction v19

- 常量 `REDACTION_VERSION = "v19"`；manifest 的 `redaction_status` 形如 `redacted:v19` / `none:v19`，`v19` 后缀是复用 prior 账本的强制门槛——旧版本脱敏结果不会被当作可复用状态。
- `redactText` 按固定顺序替换并记录命中的 label（`applied`），输出截断到 `MAX_CANDIDATE = 8000` 字符，每来源可见文本上限 `MAX_TEXT = 120_000`。

字段级替换类别：

| 类别         | 形态                                                                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ----- | --- | ------------------------- |
| PEM 私钥     | `PRIVATE KEY` 块 → `<REDACTED_TOKEN>`                                                                                                         |
| DSN 口令     | `scheme://user:pass@` → `<REDACTED_PASSWORD>`                                                                                                 |
| 私有仓库     | `git@host:path` → `<PRIVATE_REPOSITORY>`                                                                                                      |
| API key      | `*api*key* = 值` → `api_key=<REDACTED_API_KEY>`；`sk-…`（≥16 位）、`AKIA…`（16 位）→ `<REDACTED_API_KEY>`                                     |
| 令牌         | `Bearer`/`Basic` 后 ≥12 位凭据 → `<REDACTED_TOKEN>`；`gh[pousr]_…` / `xox[baprs]-…`（≥16 位）→ `<REDACTED_TOKEN>`                             |
| 通用敏感字段 | `token`/`authorization`/`cookie`/`secret(?:key)? = 值` → `token=<REDACTED_TOKEN>`；`password`/`passwd… = 值` → `password=<REDACTED_PASSWORD>` |
| 身份         | 邮箱（含本地形如 `user@host`）→ `<PRIVATE_EMAIL>`                                                                                             |
| 主机         | 私网/回环地址（10/127/192.168/172.16–31、`::1`、`fc`/`fd`、`fe8`–`feb`、`localhost`、`\*.internal                                             | local | lan | corp`）→ `<PRIVATE_HOST>` |
| 路径         | UNC `\\…`、Windows 盘符 `C:\…`、`/home/…`、`/Users/…`、`~/…`、`file:…`、其余绝对路径 → `<PRIVATE_PATH>`                                       |

测试锚点："redacts credentials, identity, hosts, paths, and private repositories"：断言 7 类占位符均出现，同时断言一批具体秘密值（用户名、私有主机、回环/IPv6 地址、Windows/UNC/`~`/绝对路径、DSN 与 Redis 口令、JSON 内 password/cookie/api_key、带引号转义后缀）在结果中不出现；非敏感字段（如 `tokens_saved=42 token_count=10`）保留。

## 内部控制面过滤

- `visible()` 只保留 `role ∈ {user, assistant}`、非内部控制面文本、redact 后非空的 text；system / toolCall / toolResult / reasoning 等角色与部件不进入候选。
- `isInternalConversationText`（判定前缀取文本前 768 字符）按类丢弃：记录标记（`[user]/[assistant]` 前缀、`**agent|user|assistant**:`、`¶user|think|ai|call:`、`_thinking:_`、`Complete the assignment… thoroughly:`、`Archived transcript scopes:`、`# Session update`、`[irc]`）；内部旁白；工具信封（`call:TOOL:NAME{`、`→ tool(`、`→ tool(args) ⇒`）；运行时信封（`Parent IRC message`、`Current interruptible wait|operation`、`[budget notice]`、`[async-result]`、`(No response)`）；watchdog 旁白（`Silent…`、`Still context gathering`、`The agent is (mid-turn|scoping|reading|reviewing|gathering)`、`Nothing to critique`、`No action needed`、`Waiting for…`、`I'll wait`）；转写分析文本；嵌套信封与转写工件。
- 来源层边界：OMP `__advisor.jsonl` 的 `recordType` 改为 `advisor`、candidates 清空、`skipReason="internal_control_plane"`、`parse_status=skipped`，advisor 文件删除后不再出现在 manifest（测试覆盖两个方向）；Codex `history.jsonl` candidates 清空、`skipReason="prompt_index_covered_by_session_store"`；OpenCode 只读打开 SQLite（`readOnly: true` + 事务）且只取 `type === "text"` 的 part；Codex 只消费 `response_item` 的 `input_text`/`output_text` 各一次，排除 developer/event/reasoning 痕迹。
- 复用 prior 候选时会重新过 `hasInternalCandidateText` 过滤；被滤掉的候选以 `rejection_id = sha256(source_key \0 "internal_transcript_filtered")` 记入 rejected。测试锚点：把落盘候选改成含 `_thinking:_` 的陈旧内部转写后重跑 ⇒ 该来源保持 unchanged、候选被清空、rejected 增加、落盘 candidates 不再含该标记。

## Partial checkpoint 断点续跑

- 输出目录默认 `.agent/kb-ingest/`（CLI `--output-dir` 可覆盖）；部分账本三件套：`manifest.partial.jsonl`、`candidates.partial.jsonl`、`rejected.partial.jsonl`。
- `persistPartial` 每处理 100 个来源及全部处理完时执行：原子写入三个 partial 账本（临时文件 + rename，目录 `0700`、文件 `0600`），并写 `.agent/checkpoints/current-task.md`（含 resume cursor = 最后处理的 `source_key`、批次计数、失败数、下一步动作）。
- 下次运行把 partial 并入 prior 状态：partial 中出现的 `source_key` 覆盖正式账本中的同名条目（candidates/rejected 同理），从而断点续跑。
- `--write` 成功收尾后删除三个 partial 文件；干跑（无 `--write`）为 `dry_run=true`，不创建输出目录、不写任何账本。
- 测试锚点："dry-runs without ledger mutation, then preserves unchanged state on write rerun"：干跑不创建输出目录；首次 write 后来源为 processed 状态且目录/文件权限为 `0700`/`0600`；伪造 contentHash 已更新且 `redaction_status: none:v5` 的 partial manifest 后重跑可从 partial 恢复该来源；内容未变再跑为 unchanged 状态；落盘 manifest 不含真实用户名与 session id（身份已哈希）。

## raw manifest 不可变校验

- 固定路径 `src/content/raw/.manifest.sha256`，每行 `<64 位 hex> <空格> <相对路径>`。
- 错误类别：缺失 ⇒ `missing raw manifest`；格式非法 ⇒ `invalid raw manifest entry`；raw 文件未登记 ⇒ `raw file missing from manifest`；校验和不一致 ⇒ `raw checksum mismatch`；manifest 指向不存在的文件 ⇒ `manifest points to missing raw file`。
- `git diff --name-status HEAD -- src/content/raw`（排除 manifest 自身）：`M/D/R/C` 状态 ⇒ `raw snapshot changed or deleted`；git 不可用时静默跳过。
- 其余检查：note 页必须有 `kind`/`status`/`sources`；`sources` 必须解析到存在的 raw slug；index 必须登记全部 raw slug 与 active/provisional 页；log 必须含可解析条目 `^## \[\d{4}-\d{2}-\d{2}\] .+`。任一错误则汇总输出并 `exit 1`。
- 与 `KB.md` / knowledge-base skill 一致：`src/content/raw/{locale}/` 是不可变证据层，LLM 只读、只能新增不能编辑/格式化/翻译/删除；lint 拒绝已登记 raw 快照的修改或删除。

## 占位符语义与脱敏边界

- **占位符出现 = 替换成功，不是泄漏。** `<PRIVATE_PATH>` 等占位符被测试断言为"必须出现"，因为它们是敏感内容被命中的证据。
- **泄漏判断必须扫描实际字段值**（测试断言具体秘密值不出现），不能以占位符缺席/出现作为泄漏判据。
- **regex 是尽力而为的规则替换，不是安全证明。** 未覆盖的私有内容形态可能漏过（未证明）；测试只覆盖构造用例集，不构成对任意输入的保证。敏感数据入 raw 前仍应有更高层审查。

## 最小验证与故障判断

在固定提交 `c0ae74e` 检出上执行：

```text
pnpm exec vitest run scripts/kb-ingest-sessions.test.ts
pnpm kb:lint
```

故障判断顺序：

1. **先跑聚焦 parser 测试**：失败时按测试名定位契约节（身份/内容哈希、失败复用、redaction、控制面过滤、partial checkpoint、dry-run 语义），测试断言即行为契约；测试全部使用合成 fixture，不涉及真实会话数据。
2. **再跑 `pnpm kb:lint`**，按错误类别分级处理：
    - 先修 raw 校验类错误（`missing raw manifest` / `raw checksum mismatch` / `raw file missing from manifest` / `manifest points to missing raw file` / `raw snapshot changed or deleted`）：raw 是不可变证据层，**不能靠修改 raw 消除告警**，需核对快照与 manifest 或登记新来源。
    - 再修 note 页元数据（缺 `kind`/`status`/`sources`、`sources` 解析不到 raw slug）：补 frontmatter 或修正链接。
    - 最后修 index/log 同步（raw slug 或 active/provisional 页未登记、log 条目格式不可解析）。
3. 任一错误都会汇总输出并 `exit 1`；按"证据链 → 元数据 → 索引/日志"顺序修复，不要为了消除告警删除事实来源。

## 回滚与清理

- 干跑无副作用：不创建输出目录、不写任何账本，可放心试运行。
- 摄入中断：partial 三件套与 checkpoint 文件保留，下次运行自动并入 prior 断点续跑；`--write` 成功收尾后 partial 自动删除。
- 需要完全从头重跑：清空输出目录（默认 `.agent/kb-ingest/`）与 checkpoint 后重跑即可，raw 证据层不受影响（输出是管道自身产物，raw 是不可变输入）。
- wiki 页可以重写、合并或废弃；raw 永远不回写。回退到旧契约快照 = 检出对应固定提交并按当时 `KB.md` 执行。

## 失败边界

- 脱敏覆盖性未证明：未覆盖的私有内容形态可能漏过，regex 规则集不是审计证明。
- 本页不记录、也不复核真实候选账本内容与运行统计（非快照目标）。
- **历史候选中的旧 bug 叙述不是当前 finding**：先前候选条目内容（如 `failed_solutions` 字段里记录的失败过程描述）是知识内容字段，属于候选数据而非本管道缺陷，不得把旧叙述解读为当前回归证据。
- 本页只描述契约与固定提交可复核事实，不含真实用户名、绝对路径、凭证或统计。

## 证据与不确定性

- **来源事实**：`kb-ingest-pipeline-v19`（固定提交 `c0ae74e`）记录哈希方案、失败复用条件、redaction v19 类别、控制面过滤规则、partial checkpoint、raw manifest 校验及对应测试名；全部结论可沿该 raw 的稳定 URL 逐条复核。
- **未确认项**：脱敏对任意输入的覆盖率、真实账本内容与运行统计、提交之后的管道变更（本页只钉在 `c0ae74e`，升级后应重新核对）。

## 相关页面

- [LLM-Wiki 模式](/note/llm-wiki-pattern)：本知识库三层架构与 ingest/query/lint 操作的总述，本页是其"摄入"操作的实现级契约。
