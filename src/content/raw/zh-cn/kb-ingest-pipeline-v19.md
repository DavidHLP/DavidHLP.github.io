---
title: "KB 会话摄入管道契约（redaction v19）"
capturedAt: 2026-08-13 00:00:00+00:00
sourceType: repository
sourceUrl: "https://github.com/DavidHLP/DavidHLP.github.io/tree/c0ae74e72982910e13c46de0b92cf8fb9a8d1751"
immutable: true
tags: [Knowledge Base, Ingestion, Redaction, Hashing, Manifest, Raw Evidence]
description: "固定提交 c0ae74e 中 KB 会话摄入管道的最小契约快照：身份/内容哈希、失败不复用、脱敏 v19、内部控制面过滤、partial checkpoint 与 raw manifest 不可变校验，附聚焦 parser 测试通过记录。"
---

# KB 会话摄入管道契约（redaction v19）

## 固定点

- 提交：`c0ae74e72982910e13c46de0b92cf8fb9a8d1751`（公开仓库 `DavidHLP/DavidHLP.github.io`）。
- 证据文件（均在该提交）：`KB.md`、`.claude/skills/knowledge-base.md`、`scripts/kb-ingest-sessions.ts`、`scripts/kb-ingest-sessions.test.ts`、`scripts/kb-lint.ts`。

## 来源列表（稳定 URL，均钉在固定提交）

- https://github.com/DavidHLP/DavidHLP.github.io/blob/c0ae74e72982910e13c46de0b92cf8fb9a8d1751/KB.md
- https://github.com/DavidHLP/DavidHLP.github.io/blob/c0ae74e72982910e13c46de0b92cf8fb9a8d1751/.claude/skills/knowledge-base.md
- https://github.com/DavidHLP/DavidHLP.github.io/blob/c0ae74e72982910e13c46de0b92cf8fb9a8d1751/scripts/kb-ingest-sessions.ts
- https://github.com/DavidHLP/DavidHLP.github.io/blob/c0ae74e72982910e13c46de0b92cf8fb9a8d1751/scripts/kb-ingest-sessions.test.ts
- https://github.com/DavidHLP/DavidHLP.github.io/blob/c0ae74e72982910e13c46de0b92cf8fb9a8d1751/scripts/kb-lint.ts

## 最小事实（行为级摘要，可按提交复核）

### 1. 身份哈希与内容哈希

- `sha256`：`node:crypto` 的 SHA-256 hex。
- `hashIdentifier(v) = sha256(v.normalize("NFKC"))`：项目身份（`project_key`）与会话身份（`session_hash`）在入账前做 NFKC 规范化再哈希。
- `normalizeText` = NFKC + `toLocaleLowerCase` + 空白折叠 + trim；`normalizedFingerprint = sha256(normalizeText)`，作为候选去重指纹。
- 来源键：`source_key = sha256(tool \0 hashIdentifier(project) \0 hashIdentifier(session) \0 contentHash)`；身份键（跨 run 复用判定）为 `tool \0 hashIdentifier(project) \0 hashIdentifier(session)`（不含内容哈希）。
- `contentHash` 按来源类型：OMP / Codex / prompt-history = 读取时文件字节的 SHA-256；OpenCode SQLite = `sha256(JSON.stringify({session, rawHashes}))`，`rawHashes` 为每行 message/part 行 JSON 的 SHA-256 数组；Hindsight = `sha256(JSON.stringify(value))`。
- 测试断言：相同 tool/项目/会话/内容 ⇒ 相同 sourceKey；追加内容后 contentHash 与 sourceKey 改变；换 tool ⇒ key 改变；`source_changed_during_read` 来源不产出候选。
- prompt-history 的 `sessionIdentity` 固定为文件路径：追加内容后 identity 不变、contentHash 变化。

### 2. 失败记录不复用

- 未变更复用分支的硬性条件：`prior.parse_status !== "failed"` 且 `prior.content_hash === 当前 contentHash` 且 `redaction_status` 以 `:v19` 结尾且 prior 账本完整（candidates 数 = candidate_count，且 count>0 或 rejected 非空）。
- 即：解析失败过的来源即使内容哈希未变也会被重新解析、重新抽取候选，不会沿用失败结果。
- 测试 "reprocesses a previously failed source even when its content hash is unchanged"：把 prior manifest 改为 `parse_status: failed` 并清空候选账本后重跑，断言该来源被重新处理且候选被重新产出。
- 来源层 `error` 存在时以 `malformed_or_unavailable_source` 记入 rejected；读取前后文件 size/mtime 不一致（`source_changed_during_read`）的来源不产出候选并计入失败。

### 3. Redaction v19

- 常量 `REDACTION_VERSION = "v19"`；manifest 的 `redaction_status` 形如 `redacted:v19` / `none:v19`，v19 后缀是复用 prior 账本的强制门槛。
- `redactText` 按固定顺序替换并记录命中的 label（`applied`），输出截断到 `MAX_CANDIDATE = 8000` 字符；每来源可见文本上限 `MAX_TEXT = 120_000`。替换类别（字段级）：
  - PEM `PRIVATE KEY` 块 → `<REDACTED_TOKEN>`
  - `scheme://user:pass@` DSN 口令 → `<REDACTED_PASSWORD>`
  - `git@host:path` → `<PRIVATE_REPOSITORY>`
  - `*api*key* = 值` → `api_key=<REDACTED_API_KEY>`
  - `sk-…`（≥16 位）与 `AKIA…`（16 位） → `<REDACTED_API_KEY>`
  - `Bearer`/`Basic` 后 ≥12 位凭据 → `<REDACTED_TOKEN>`
  - `gh[pousr]_…` / `xox[baprs]-…`（≥16 位） → `<REDACTED_TOKEN>`
  - `token`/`authorization`/`cookie`/`secret(?:key)? = 值` → `token=<REDACTED_TOKEN>`
  - `password`/`passwd… = 值` → `password=<REDACTED_PASSWORD>`
  - 邮箱（含本地形如 `user@host`） → `<PRIVATE_EMAIL>`
  - 私网/回环地址（10/127/192.168/172.16–31、`::1`、`fc`/`fd`、`fe8`–`feb`、`localhost`、`*.internal|local|lan|corp`） → `<PRIVATE_HOST>`
  - UNC `\\…`、Windows 盘符 `C:\…`、`/home/…` 与 `/Users/…`、`~/…`、`file:…`、其余绝对路径 → `<PRIVATE_PATH>`
- 测试 "redacts credentials, identity, hosts, paths, and private repositories"：断言 7 类占位符均出现，同时断言一批具体秘密值（用户名、私有主机、回环/IPv6 地址、Windows/UNC/`~`/绝对路径、DSN 与 Redis 口令、JSON 内 password/cookie/api_key、带引号转义后缀）在结果中不出现；非敏感字段（如 `tokens_saved=42 token_count=10`）保留。

### 4. 内部控制面过滤

- `visible()` 只保留 `role ∈ {user, assistant}`、非内部控制面文本、redact 后非空的 text；system / toolCall / toolResult / reasoning 等角色与部件不进入候选。
- `isInternalConversationText`（判定前缀取文本前 768 字符）按类丢弃：记录标记（`[user]/[assistant]` 前缀、`**agent|user|assistant**:`、`¶user|think|ai|call:`、`_thinking:_`、`Complete the assignment… thoroughly:`、`Archived transcript scopes:`、`# Session update`、`[irc]`）；内部旁白（`[in progress — more steps follow]`）；工具信封（`call:TOOL:NAME{`、`→ tool(`、`→ tool(args) ⇒`）；运行时信封（`Parent IRC message`、`Current interruptible wait|operation`、`[budget notice]`、`[async-result]`、`(No response)`）；watchdog 旁白（`Silent…`、`Still context gathering`、`The agent is (mid-turn|scoping|reading|reviewing|gathering)`、`Nothing to critique`、`No action needed`、`Waiting for…`、`I'll wait`）；转写分析文本；嵌套信封与转写工件。
- OMP 控制面文件：`__advisor.jsonl` 的 `recordType` 改为 `advisor`、candidates 清空、`skipReason="internal_control_plane"`、`parse_status=skipped`；advisor 文件删除后不再出现在 manifest（测试覆盖两个方向）。
- Codex `history.jsonl`：candidates 清空、`skipReason="prompt_index_covered_by_session_store"`。
- 解析器可见性边界：OpenCode 只读打开 SQLite（`readOnly: true` + 事务）且只取 `type === "text"` 的 part；Codex 只消费 `response_item` 的 `input_text`/`output_text` 各一次，排除 developer/event/reasoning 痕迹。
- 复用 prior 候选时会重新过 `hasInternalCandidateText` 过滤；被滤掉的候选以 `rejection_id = sha256(source_key \0 "internal_transcript_filtered")` 记入 rejected（测试：把落盘候选改成含 `_thinking:_` 的陈旧内部转写后重跑 ⇒ 该来源保持 unchanged、候选被清空、rejected 增加，落盘 candidates 不再含该标记）。

### 5. Partial checkpoint

- 输出目录默认 `.agent/kb-ingest/`（CLI `--output-dir` 可覆盖）。部分账本三件套：`manifest.partial.jsonl`、`candidates.partial.jsonl`、`rejected.partial.jsonl`。
- `persistPartial` 每处理 100 个来源及全部处理完时执行：原子写入三个 partial 账本（临时文件 + rename，目录 `0700`、文件 `0600`），并写 `.agent/checkpoints/current-task.md`（含 resume cursor = 最后处理的 `source_key`、批次计数、失败数、下一步动作）。
- 下次运行把 partial 账本并入 prior 状态：partial 中出现的 `source_key` 覆盖正式账本中的同名条目（candidates/rejected 同理），从而断点续跑。
- `--write` 成功收尾后删除三个 partial 文件；干跑（无 `--write`）为 `dry_run=true`，不创建输出目录、不写任何账本。
- 测试 "dry-runs without ledger mutation, then preserves unchanged state on write rerun"：干跑不创建输出目录；首次 write 后来源为 processed 状态且目录/文件权限为 `0700`/`0600`；伪造内容哈希已更新且 `redaction_status: none:v5` 的 partial manifest 后重跑可从 partial 恢复该来源；内容未变再跑为 unchanged 状态；落盘 manifest 不含真实用户名与 session id（身份已哈希）。

### 6. raw manifest 不可变校验（kb-lint.ts）

- 固定路径 `src/content/raw/.manifest.sha256`，每行 `<64 位 hex> <空格> <相对路径>`；缺失时报 `missing raw manifest`，格式非法行报 `invalid raw manifest entry`。
- 每个 raw markdown 文件必须登记且与现算 SHA-256 一致：未登记 ⇒ `raw file missing from manifest`；不一致 ⇒ `raw checksum mismatch`；manifest 指向不存在的文件 ⇒ `manifest points to missing raw file`。
- `git diff --name-status HEAD -- src/content/raw`（排除 manifest 自身）：`M/D/R/C` 状态 ⇒ `raw snapshot changed or deleted`；git 不可用时静默跳过。
- 其余检查：note 页必须有 `kind`/`status`/`sources`；`sources` 必须解析到存在的 raw slug；index 必须登记全部 raw slug 与 active/provisional 页；log 必须含可解析条目 `^## \[\d{4}-\d{2}-\d{2}\] .+`；任一错误则汇总输出并 `exit 1`。
- `KB.md` 与 skill 一致规定：`src/content/raw/{locale}/` 是不可变证据层，LLM 只读、只能新增不能编辑/格式化/翻译/删除；`pnpm kb:lint` 拒绝已登记 raw 快照的修改或删除。

## 可重复验证（聚焦 parser 测试）

- 命令：`pnpm exec vitest run scripts/kb-ingest-sessions.test.ts`（在固定提交 c0ae74e 检出上执行）。
- 结果：通过，无失败。
- 测试全部使用合成 fixture，不涉及真实会话数据；各用例断言见上文各节引用的测试名，可在固定提交的测试文件中逐条复核。

## 边界与未证明内容

- 未复核（非目标）：真实候选账本内容与运行统计；本快照不记录任何实跑统计数字、本机路径或环境版本。
- **占位符语义（重要）**：`<PRIVATE_PATH>` 等占位符出现 = 脱敏替换成功（测试断言其存在），不是泄漏；泄漏判断必须扫描实际字段值（测试断言具体秘密值不出现），不能以占位符缺席/出现作为泄漏判据。
- **历史候选中的旧 bug 叙述不是当前 finding**：先前候选条目内容（如 `failed_solutions` 字段里记录的"无效方案/死胡同"等失败过程描述）是知识内容字段，属于候选数据而非本管道缺陷；不得把旧叙述解读为当前回归证据。
- 脱敏为尽力而为的规则替换，非审计证明：未覆盖的私有内容形态可能漏过（未证明）；测试只覆盖构造用例集，不构成对任意输入的保证。
- 本文件只描述契约与固定提交可复核事实，不包含真实用户名、绝对路径、凭证或统计。
