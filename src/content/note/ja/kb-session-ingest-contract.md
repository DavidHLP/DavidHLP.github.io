---
title: "KB セッション摂取パイプライン契約：インクリメンタル再利用、redaction v19、不変 raw"
timestamp: 2026-08-13 00:00:00+08:00
series: "個人 AI ナレッジベース"
kind: concept
status: active
draft: true
sources: ["kb-ingest-pipeline-v19"]
related: ["llm-wiki-pattern"]
tags: [Knowledge Base, Ingestion, Redaction, Hashing, Manifest, Raw Evidence]
description: "固定コミット c0ae74e における KB セッション摂取パイプラインの最小契約を固定する。ID/コンテンツハッシュ駆動のインクリメンタル再利用、失敗記録の再利用不可、redaction v19、内部コントロールプレーンフィルタ、partial checkpoint からの再開、raw manifest の不変検証を定め、プレースホルダの意味論と脱感境界を明確にする。"
toc: true
---

このナレッジベース自身のセッション摂取パイプラインは、ツールセッション（OMP、Codex、OpenCode、Hindsight、prompt-history）を wiki に入れられる候補証拠に変換する。中核的な保証を一言で言えば、**内容が変わっていないソースはインクリメンタル再利用し、内容が変わったか失敗したソースは再処理し、v19 脱感と内部コントロールプレーン・フィルタを通ったテキストだけをディスクに書き、raw 証拠層は manifest ハッシュでロックする。** このページは固定コミットの契約スナップショットであり、検証可能な挙動だけを記述し、実際の台帳内容や実行統計は記録しない。

## 適用バージョンとシナリオ

- 固定点：公開リポジトリ `DavidHLP/DavidHLP.github.io` のコミット `c0ae74e72982910e13c46de0b92cf8fb9a8d1751`。
- 証拠ファイル（すべてそのコミット）：`KB.md`、`.claude/skills/knowledge-base.md`、`scripts/kb-ingest-sessions.ts`、`scripts/kb-ingest-sessions.test.ts`、`scripts/kb-lint.ts`。
- 適用シナリオ：「今回の実行が prior 台帳を再利用するか、そのソースを再処理するか」を判断したいとき、セッションテキストを脱感して安全にディスクへ落としたいとき、摂取/検証失敗の原因を調査したいとき。パイプラインをアップグレード・変更したら、そのコミットに戻って契約を再確認する。

## コアメカニズム：アイデンティティハッシュとコンテンツハッシュの分離

インクリメンタル再利用は、独立した二つのハッシュの分離に基づいて判定される：

- **アイデンティティキー**：`tool \0 hashIdentifier(project) \0 hashIdentifier(session)`。コンテンツハッシュを含まず、run をまたいで「同じソース」を判定するために使う。`hashIdentifier(v) = sha256(v.normalize("NFKC"))`。プロジェクトとセッションのアイデンティティは入帳前に NFKC 正規化してからハッシュする。
- **コンテンツハッシュ**：`contentHash` はソース型ごとに計算する。OMP / Codex / prompt-history は読み取り時のファイルバイトの SHA-256。OpenCode SQLite は `sha256(JSON.stringify({session, rawHashes}))`（`rawHashes` は各行の message/part 行 JSON の SHA-256 の配列）。Hindsight は `sha256(JSON.stringify(value))`。
- **ソースキー**：`source_key = sha256(tool \0 hashIdentifier(project) \0 hashIdentifier(session) \0 contentHash)`。台帳エントリと partial 上書きの位置キー。
- 候補の重複排除フィンガープリント：`normalizedFingerprint = sha256(normalizeText)`。`normalizeText` = NFKC + `toLocaleLowerCase` + 空白折りたたみ + trim。
- テストアンカー：同じ tool/プロジェクト/セッション/内容 ⇒ 同じ sourceKey。内容追加 ⇒ contentHash と sourceKey が変わる。tool 変更 ⇒ key が変わる。`source_changed_during_read` のソースは候補を産まない。prompt-history の `sessionIdentity` はファイルパスに固定され、内容追加後も identity は不変で contentHash だけが変わる。

意味：アイデンティティキーは「誰」を答え、コンテンツハッシュは「変わったか」を答え、`source_key` こそが台帳エントリだ。セッションアイデンティティハッシュをコンテンツフィンガープリントと誤解してはならない。

## 失敗記録は再利用しない

prior 候補を再利用する硬条件（すべて満たしたときだけ未変更分岐に入る）：

1. `prior.parse_status !== "failed"`；
2. `prior.content_hash ===` 現在の `contentHash`；
3. `redaction_status` が `:v19` で終わる；
4. prior 台帳が完全（candidates 数 = candidate_count、かつ count>0 か rejected が非空）。

したがって、パース失敗したソースはコンテンツハッシュが変わっていなくても、再パース・再候補抽出される。テストアンカー："reprocesses a previously failed source even when its content hash is unchanged"（prior manifest を `parse_status: failed` に変更して候補台帳を空にし再実行し、ソースが再処理され候補が再び産出されることをアサート）。ソース層に `error` がある場合、`malformed_or_unavailable_source` として rejected に記録する。読み取り前後でファイルの size/mtime が一致しないソースは候補を産まず失敗に数える。

## Redaction v19

- 定数 `REDACTION_VERSION = "v19"`。manifest の `redaction_status` は `redacted:v19` / `none:v19` の形で、`v19` サフィックスは prior 台帳の再利用の必須ゲートだ。旧バージョンの脱感結果は再利用可能状態として扱われない。
- `redactText` は固定順で置換し、ヒットした label（`applied`）を記録する。出力は `MAX_CANDIDATE = 8000` 文字に切り詰め、ソースごとの可視テキスト上限は `MAX_TEXT = 120_000`。

フィールドレベル置換カテゴリ：

| カテゴリ | 形態 |
| --- | --- |
| PEM 秘密鍵 | `PRIVATE KEY` ブロック → `<REDACTED_TOKEN>` |
| DSN パスワード | `scheme://user:pass@` → `<REDACTED_PASSWORD>` |
| 非公開リポジトリ | `git@host:path` → `<PRIVATE_REPOSITORY>` |
| API key | `*api*key* = 値` → `api_key=<REDACTED_API_KEY>`；`sk-…`（≥16 桁）、`AKIA…`（16 桁）→ `<REDACTED_API_KEY>` |
| トークン | `Bearer`/`Basic` 後にある ≥12 桁の資格情報 → `<REDACTED_TOKEN>`；`gh[pousr]_…` / `xox[baprs]-…`（≥16 桁）→ `<REDACTED_TOKEN>` |
| 汎用の機微フィールド | `token`/`authorization`/`cookie`/`secret(?:key)? = 値` → `token=<REDACTED_TOKEN>`；`password`/`passwd… = 値` → `password=<REDACTED_PASSWORD>` |
| アイデンティティ | メール（`user@host` のようなローカル形式を含む）→ `<PRIVATE_EMAIL>` |
| ホスト | 私網/ループバックアドレス（10/127/192.168/172.16–31、`::1`、`fc`/`fd`、`fe8`–`feb`、`localhost`、`*.internal|local|lan|corp`）→ `<PRIVATE_HOST>` |
| パス | UNC `\\…`、Windows ドライブ `C:\…`、`/home/…`、`/Users/…`、`~/…`、`file:…`、その他絶対パス → `<PRIVATE_PATH>` |

テストアンカー："redacts credentials, identity, hosts, paths, and private repositories"：7 種類のプレースホルダがすべて出現することをアサートし、同時に具体的な秘密値の一組（ユーザー名、非公開ホスト、ループバック/IPv6 アドレス、Windows/UNC/`~`/絶対パス、DSN と Redis パスワード、JSON 内の password/cookie/api_key、引用符エスケープ付きサフィックス）が結果に出現しないことをアサートする。非機微フィールド（`tokens_saved=42 token_count=10` など）は保持される。

## 内部コントロールプレーン・フィルタ

- `visible()` は `role ∈ {user, assistant}`、内部コントロールプレーンでないテキスト、redact 後に非空のテキストだけを保持する。system / toolCall / toolResult / reasoning などのロールと部品は候補に入らない。
- `isInternalConversationText`（判定プレフィックスはテキスト先頭 768 文字を取る）は類別で捨てる：記録マーカ（`[user]/[assistant]` プレフィックス、`**agent|user|assistant**:`、`¶user|think|ai|call:`、`_thinking:_`、`Complete the assignment… thoroughly:`、`Archived transcript scopes:`、`# Session update`、`[irc]`）；内部ナレーション；ツールエンベロープ（`call:TOOL:NAME{`、`→ tool(`、`→ tool(args) ⇒`）；ランタイムエンベロープ（`Parent IRC message`、`Current interruptible wait|operation`、`[budget notice]`、`[async-result]`、`(No response)`）；watchdog ナレーション（`Silent…`、`Still context gathering`、`The agent is (mid-turn|scoping|reading|reviewing|gathering)`、`Nothing to critique`、`No action needed`、`Waiting for…`、`I'll wait`）；転写分析テキスト；入れ子エンベロープと転写アーティファクト。
- ソース層の境界：OMP `__advisor.jsonl` の `recordType` を `advisor` に変え、candidates を空にし、`skipReason="internal_control_plane"`、`parse_status=skipped` とする。advisor ファイル削除後は manifest に現れない（テストは両方向をカバー）。Codex `history.jsonl` は candidates を空にし `skipReason="prompt_index_covered_by_session_store"`。OpenCode は SQLite を読み取り専用（`readOnly: true` + トランザクション）で開き、`type === "text"` の part だけを取る。Codex は `response_item` の `input_text`/`output_text` をそれぞれ一度だけ消費し、developer/event/reasoning の痕跡を除外する。
- prior 候補を再利用するときは `hasInternalCandidateText` フィルタを再実行する。フィルタで除かれた候補は `rejection_id = sha256(source_key \0 "internal_transcript_filtered")` で rejected に記録する。テストアンカー：落ちている候補を `_thinking:_` を含む古い内部転写に変更して再実行 ⇒ そのソースは unchanged のまま、候補は空になり、rejected が増え、落ちている candidates にはもうそのマーカが含まれない。

## Partial checkpoint からの再開

- 出力ディレクトリは既定 `.agent/kb-ingest/`（CLI `--output-dir` で上書き可）。partial 台帳の三つ組：`manifest.partial.jsonl`、`candidates.partial.jsonl`、`rejected.partial.jsonl`。
- `persistPartial` はソース 100 個ごと、および全処理完了時に実行する。三つの partial 台帳を原子的に書き（一時ファイル + rename、ディレクトリ `0700`、ファイル `0600`）、`.agent/checkpoints/current-task.md` を書く（resume cursor = 最後に処理した `source_key`、バッチ数、失敗数、次のアクションを含む）。
- 次回実行時、partial を prior 状態に併合する。partial に出現する `source_key` は正式台帳の同名エントリを上書きし（candidates/rejected も同様）、ブレークポイントから再開できる。
- `--write` の成功完了後、三つの partial ファイルは削除される。ドライラン（`--write` なし）は `dry_run=true` で、出力ディレクトリを作らず、台帳を書かない。
- テストアンカー："dry-runs without ledger mutation, then preserves unchanged state on write rerun"：ドライランは出力ディレクトリを作らない。初回 write 後、ソースは processed 状態でディレクトリ/ファイル権限が `0700`/`0600`。contentHash を更新し `redaction_status: none:v5` にした partial manifest を偽装して再実行すると、partial からそのソースを復元できる。内容未変更の再実行は unchanged 状態になる。落ちている manifest に実在のユーザー名と session id は含まれない（アイデンティティはハッシュ済み）。

## raw manifest の不変検証

- 固定パス `src/content/raw/.manifest.sha256`、各行 `<64 桁 hex> <スペース> <相対パス>`。
- エラーカテゴリ：欠落 ⇒ `missing raw manifest`；不正形式 ⇒ `invalid raw manifest entry`；raw ファイル未登録 ⇒ `raw file missing from manifest`；チェックサム不一致 ⇒ `raw checksum mismatch`；manifest が存在しないファイルを指す ⇒ `manifest points to missing raw file`。
- `git diff --name-status HEAD -- src/content/raw`（manifest 自身を除く）：`M/D/R/C` 状態 ⇒ `raw snapshot changed or deleted`。git が使えないときは静かにスキップ。
- その他の検査：note ページは `kind`/`status`/`sources` を持たなければならない。`sources` は存在する raw slug に解決しなければならない。index は全 raw slug と active/provisional ページを登録しなければならない。log は `^## \[\d{4}-\d{2}-\d{2}\] .+` に合う解釈可能なエントリを含まなければならない。いずれかのエラーは集約出力され `exit 1` になる。
- `KB.md` / knowledge-base skill と一致：`src/content/raw/{locale}/` は不変証拠層で、LLM は読み取り専用、追加のみで編集/フォーマット/翻訳/削除はできない。lint は登録済み raw スナップショットの変更や削除を拒否する。

## プレースホルダの意味論と脱感の境界

- **プレースホルダ出現 = 置換成功であり、漏洩ではない。** `<PRIVATE_PATH>` などのプレースホルダは、機微内容がヒットした証拠であるため、テストで「必ず出現する」とアサートされる。
- **漏洩判断は実際のフィールド値を走査する必要がある**（テストは具体的な秘密値が出現しないことをアサートする）。プレースホルダの不在/出現を漏洩判定に使ってはならない。
- **regex はベストエフォートの規則置換であり、セキュリティの証明ではない。** カバーされていない非公開内容の形態は漏れる可能性がある（未証明）。テストは構築済みの用例集合だけをカバーし、任意入力に対する保証ではない。機微データは raw に入る前に、より上位のレビューを持つべきだ。

## 最小検証と故障判断

固定コミット `c0ae74e` の checkout 上で実行する：

```text
pnpm exec vitest run scripts/kb-ingest-sessions.test.ts
pnpm kb:lint
```

故障判断の順序：

1. **まず集中 parser テストを実行する**：失敗時はテスト名で契約節（アイデンティティ/コンテンツハッシュ、失敗再利用、redaction、コントロールプレーンフィルタ、partial checkpoint、dry-run 意味論）を特定する。テストアサーションが挙動契約であり、テストはすべて合成 fixture を使い実セッションデータを含まない。
2. **次に `pnpm kb:lint` を実行し**、エラーカテゴリ別に段階処理する：
   - まず raw 検証系エラー（`missing raw manifest` / `raw checksum mismatch` / `raw file missing from manifest` / `manifest points to missing raw file` / `raw snapshot changed or deleted`）を直す。raw は不変証拠層なので、**raw の変更で警告を消してはならない**。スナップショットと manifest を照合するか、新規ソースを登録する。
   - 次に note ページのメタデータ（`kind`/`status`/`sources` 欠落、`sources` が raw slug に解決しない）を直す。frontmatter を補うかリンクを修正する。
   - 最後に index/log の同期（raw slug や active/provisional ページの未登録、log エントリ形式が解釈不能）を直す。
3. いずれのエラーも集約出力され `exit 1` になる。「証拠連鎖 → メタデータ → インデックス/ログ」の順で直し、警告を消すために事実ソースを削除しない。

## ロールバックとクリーンアップ

- ドライランは副作用がない：出力ディレクトリを作らず、台帳を書かない。安心して試せる。
- 摂取中断：partial 三つ組と checkpoint ファイルは保持され、次回実行が自動的に prior へ併合して再開する。`--write` の成功完了後、partial は自動削除される。
- 完全に頭から再実行したいとき：出力ディレクトリ（既定 `.agent/kb-ingest/`）と checkpoint を空にして再実行するだけでよい。raw 証拠層は影響を受けない（出力はパイプライン自身の産物であり、raw は不変入力である）。
- wiki ページは書き換え・併合・廃止が可能だが、raw は決して書き戻さない。旧契約スナップショットへ戻る = 対応する固定コミットを checkout し、当時の `KB.md` に従うこと。

## 失敗の境界

- 脱感のカバレッジは未証明：カバーされていない非公開内容の形態が漏れる可能性があり、regex 規則集合は監査証明ではない。
- このページは実際の候補台帳の内容や実行統計を記録せず、再検証もしない（スナップショット対象外）。
- **履歴候補内の旧バグ叙述は現在の finding ではない**：以前の候補エントリの内容（`failed_solutions` フィールドに記録された失敗過程の記述など）は知識内容フィールドであり、パイプライン欠陥ではなく候補データだ。旧叙述を現在の回帰証拠として解釈してはならない。
- このページは契約と固定コミットで検証可能な事実だけを記述し、実在のユーザー名、絶対パス、資格情報、統計は含まない。

## 証拠と不確実性

- **情報源の事実**：`kb-ingest-pipeline-v19`（固定コミット `c0ae74e`）はハッシュ方式、失敗再利用条件、redaction v19 カテゴリ、コントロールプレーン・フィルタ規則、partial checkpoint、raw manifest 検証、対応テスト名を記録する。すべての結論はその raw の安定 URL に沿って項目ごとに再検証できる。
- **未確認項目**：任意入力に対する脱感のカバレッジ、実際の台帳内容と実行統計、コミット後のパイプライン変更（このページは `c0ae74e` にだけ固定され、アップグレード後は再確認すべき）。

## 関連ページ

- [LLM-Wiki パターン](/ja/note/llm-wiki-pattern)：このナレッジベースの三層アーキテクチャと ingest/query/lint 操作の総述。このページはその「ingest」操作の実装レベル契約である。
