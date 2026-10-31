---
{
  "archiveId": "X-1137",
  "title": "UltiCode：オンラインジャッジと Agent 工学の検証可能な境界",
  "en": "ENGINEERING NOTES",
  "category": "项目实践",
  "department": "工程笔记",
  "date": "2026-09-08",
  "lead": "DavidHLPL",
  "clearance": "PUBLIC",
  "abstract": "owner 境界、事実スナップショット、配送回復、結果 fence、Docker 隔離、非同期契約、供給網ゲートをソースから整理し、証拠の限界を明示する。",
  "findings": [
    "元の文書: src/content/note/ja/ulticode.md",
    "出典リビジョン: f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "証拠の状態: 暫定"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/note/ja/ulticode.md",
  "pubDate": "2026-09-08T16:00:00.000Z",
  "tags": [
    "UltiCode",
    "OnlineJudge",
    "DDD",
    "Port",
    "Projection",
    "Outbox",
    "RedisStreams",
    "Docker",
    "Seccomp",
    "CI",
    "LLM",
    "ja",
    "note"
  ],
  "draft": false,
  "lang": "ja",
  "legacy": {
    "path": "src/content/note/ja/ulticode.md",
    "revision": "f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "metadata": {
      "title": "UltiCode：オンラインジャッジプラットフォームのモジュール型アーキテクチャとドメイン境界",
      "timestamp": "2026-08-21 00:00:00+08:00",
      "series": "アーキテクチャとエンジニアリング実践",
      "kind": "entity",
      "status": "provisional",
      "sources": [
        "ulticode-project-context"
      ],
      "related": [
        "microservice-data-ownership",
        "dubbo-nacos-runtime",
        "jjwt-013-security-api",
        "multi-service-readiness",
        "database-schema-drift"
      ],
      "tags": [
        "UltiCode",
        "OnlineJudge",
        "DDD",
        "Port",
        "Projection",
        "Dubbo",
        "Nacos",
        "Sandbox"
      ],
      "description": "固定コミットの README/CONTEXT を証拠として、UltiCode の owner 分割、port/projection による深いモジュール構造、ジャッジトランザクション不変条件、移行期の互換 seam を整理し、アーキテクチャ収束中の不確実性を明示する。",
      "toc": true
    }
  },
  "kind": "entity",
  "status": "provisional",
  "sources": [
    "ulticode-engineering-highlights-f801a1076",
    "ulticode-project-context",
    "ulticode-reliability-core-f801a1076"
  ],
  "related": [
    "microservice-data-ownership",
    "dubbo-nacos-runtime",
    "jjwt-013-security-api",
    "multi-service-readiness",
    "database-schema-drift",
    "ulticode-owner-and-facts",
    "ulticode-owner-local-audit-inbox",
    "ulticode-outbox-redis-streams",
    "ulticode-generation-attempt-fence",
    "ulticode-fenced-singleton-lease",
    "ulticode-docker-sandbox",
    "ulticode-async-execution-contract",
    "ulticode-core-bounded-testbed",
    "ulticode-ci-supply-chain"
  ]
}
---

> **証拠の状態**：主な出典は UltiCode の `main` の固定コミット [`f801a1076`](https://github.com/DavidHLP/UltiCode/tree/f801a1076b2fa9aa06ce3d63821f0778b477042c) で、初期 README/CONTEXT のスナップショットを補助に使う。「実装済み」はソース、設定、テストがあることで、本番配置済みという意味ではない。
>
> **範囲**：リポジトリ文書は本番環境、トラフィック、認証情報がないと明記している。スループット、HA、ゼロ損失、完全なサンドボックス脱出防止は主張しない。非同期 receipt の複数インスタンス・再起動をまたぐ永続的な冪等性も既知の未完成事項である。

UltiCode は Console と Management の入口を持つオンラインジャッジである。Auth、Admin、App、Submission、Notification はデータ責任を分担する。Judge Worker は提出を消費し Docker サンドボックスを実行して結果を書き、Search Worker は派生検索インデックスだけを維持する。

注目点は、サービス間の事実、配送失敗、再判定の競合、期限切れリース、コンテナ基盤の障害、リリース経路を、検査可能な状態として扱うことにある。

UltiCode 自体は LLM 製品ではないが、不信入力、非同期実行、冪等性、隔離、証拠の扱いは、生成コード、ツール呼び出し、長時間 Agent タスクにも応用できる。

## シリーズ：オンラインジャッジを九つの検証可能な問いに分ける

この entity ページは全体図を示す。九つの `concept` は単独でも、「事実 → 配送 → 実行 → リリース」の順でも読める。

- [データ Owner と事実スナップショット](/blog/legacy/note/ja/ulticode-owner-and-facts/)：事実の所有者と不変の提出スナップショット。
- [Owner-local Outbox と Consumer Inbox](/blog/legacy/note/ja/ulticode-owner-local-audit-inbox/)：監査意図、メッセージの引き受け、消費側の冪等性。
- [Outbox と Redis Streams](/blog/legacy/note/ja/ulticode-outbox-redis-streams/)：永続意図、再試行、重複排除、PEL、回収。
- [generation と attemptId](/blog/legacy/note/ja/ulticode-generation-attempt-fence/)：再判定、リース、古い Worker 結果の競合。
- [DB リースを超える Fence Token](/blog/legacy/note/ja/ulticode-fenced-singleton-lease/)：期限切れ単例タスクの引き継ぎと stale completion。
- [Docker サンドボックス](/blog/legacy/note/ja/ulticode-docker-sandbox/)：安全パラメーター、seccomp、ユーザー・基盤エラーの区別。
- [非同期実行契約](/blog/legacy/note/ja/ulticode-async-execution-contract/)：idempotency、fingerprint、有界 receipt、プレビューとタスクの共通状態。
- [Core の実験場](/blog/legacy/note/ja/ulticode-core-bounded-testbed/)：デフォルト構成を変えず、allowlist、timeout、close-once で一部 owner context を検証。
- [検証とサプライチェーンのゲート](/blog/legacy/note/ja/ulticode-ci-supply-chain/)：静的契約、統合テスト、イメージ検査、署名。

## 八つの設計上の特徴

| 特徴 | 問題 | 仕組み |
|---|---|---|
| owner 境界 | 読み書きの所有権が口約束になる | Data owner、implementation-free contract、port/projection |
| 監査の回復性 | 業務は commit しても他 owner の監査が残らない | owner-local outbox、Stream、consumer inbox、冪等キー |
| 配送の回復性 | 提出成功時にキューが使えない | DB outbox、`FOR UPDATE SKIP LOCKED`、Streams、再試行・dead-letter |
| 結果の fence | 再判定や古い worker が新結果を上書き | `generation` + `attemptId` + 条件更新 |
| 単例タスクの fence | 引き継ぎ後に古い worker が完了を書く | DB lease、単調増加 `fence_token`、条件更新 |
| 実行隔離 | 基盤障害を通常のユーザーエラーと誤認 | Docker 資源・安全設定、seccomp、分類 |
| モジュールの寿命 | 複数 context の timeout、遅い応答、二重 close | opt-in、allowlist、bounded timeout、close-once handoff |
| リリースの証拠 | ビルド成功では依存やイメージの安全性は分からない | zero-infra static contract、Trivy、SBOM、Cosign、provenance |

## 1. Owner 境界：書き込みの所有者を契約にする

文書は五つの Data Owner と二つの Worker を定める。

| 役割 | 所有する事実・書き込み | 担当しないこと |
|---|---|---|
| Auth | ログイン、登録、OAuth、認証情報、refresh 状態、RBAC、JWKS | 他 owner の業務テーブル |
| Admin | 管理 BFF、監査、設定、監視、バックアップ、read model | App・Submission のドメイン書き込み |
| App | プロフィール、Problem、Contest、Solution、Forum、交流、実績、購読 | Submission の結果 |
| Submission | 提出、判定状態、generation、lease fence、結果、judge outbox | Problem、TestCase、Contest テーブル |
| Notification | 通知、設定、配信 ledger、メール、Inbox、再試行 | 通知状態を各 owner に分散させること |
| Judge Worker | Judge Stream、Problem facts、サンドボックス、verdict | 業務テーブルへの直接書き込み、業務 HTTP 入口 |
| Search Worker | `SearchDocumentChanged`、MeiliSearch 派生索引 | 業務テーブル書き込み、業務 HTTP 入口 |

境界を越える際は、Entity、Mapper、業務 Service の共有ではなく provider-owned contract または consumer-owned port を使う。`services/api/*` は実装を持たない契約、`services/platform/*` は制約付き共有層である。`judge-runtime` は再利用依存で、独立プロセスを必ず意味するわけではない。

### 不変の事実スナップショットで依存を短くする

Submission の書き込み中に App/Auth を問い合わせると、遠隔呼び出し、権限境界、要求タイミングが書き込み経路へ混入する。

intake は [`SubmissionFactsSnapshot`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/api/submission-api/src/main/java/com/ulticode/submission/api/dto/SubmissionFactsSnapshot.java) を受け取る。App の [`RemoteSubmissionWritePort`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/app/app-web/src/main/java/com/ulticode/modules/submission/port/adapter/RemoteSubmissionWritePort.java) が先に捕捉する項目は：

- `userId` と `userExists`。
- 問題 ID、タイトル、slug、時間・メモリ制限、starter code。
- `capturedAtEpochMillis` と `schemaVersion`。

Submission は `facts.admits(requestedUserId, requestedProblemId)` で schema、ユーザーの存在と ID、問題 ID を検査する。出所、捕捉時刻、解釈する版を暗黙の前提からデータへ移す。

有効期限、owner 間の取り消し、業務規則は別途定義が必要で、完全な認可・一貫性の証明ではない。それでも主要トランザクション内の場当たり的な遠隔問い合わせよりテスト・監査しやすい。

## 2. Outbox + Redis Streams：配送失敗を状態にする

judge outbox 有効時は提出と判定意図を同じ DB トランザクションに保存する。

```text
submit @Transactional
    ├── submissions: Pending
    └── judge_outbox: PENDING
             │
             ├── claim: FOR UPDATE SKIP LOCKED
             ├── atomic SET + XADD
             └── judge-workers
                    └── lease fence -> verdict
```

[`JudgeOutboxMapper`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/modules/submission/outbox/mapper/JudgeOutboxMapper.java) は `PENDING` と次回再試行時刻で取得し、`FOR UPDATE SKIP LOCKED` で競合を避ける。既定バッチは 50、周期は 2 秒で、本番性能の約束ではない。

[`JudgeOutboxDispatcher`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/modules/queue/outbox/dispatcher/JudgeOutboxDispatcher.java) は次を区別する。

- queue provider 不在、enqueue 例外：再試行可能なまま残す。
- `problemId`、`userId`、`language`、`code` を欠く payload：送信済みとせず `DEAD`。
- 指数バックオフ：現在の上限は 60 秒。
- real dispatch：cutover watermark と shadow フラグで移行用タスクと実タスクを分ける。

Streams adapter は Lua で重複排除キー設定と `XADD` を原子的に行う。キーには `submissionId:generation` を含め、SETNX 成功後 XADD 前のクラッシュによる配送不能な穴を防ぐ。

DB と外部 Redis 操作には境界が残るため exactly-once とは呼ばない。永続意図、再試行可能な配送、メッセージ重複排除、古い・重複した実行を止める結果 fence の組み合わせである。

### PEL 回収で未確認メッセージを見えるようにする

consumer group は作成前の項目も見えるよう `0-0` から開始する。NACK は Pending Entries List（PEL）を残す。[`UnackedStreamEntriesReaper`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/queue/outbox/reaper/UnackedStreamEntriesReaper.java) は既定で 10 秒ごとに idle 項目を走査し、sweep ごとに最大一件を回収する。PEL サイズ、キュー遅延、最古項目の年齢、DLQ を観測する。

visibility timeout は `1_800_000L`（30 分）。30 分内完了や HA の証明ではない。回収後も generation/attempt fence を通り、再取得しただけでは書き込み権限を得ない。

## 3. `generation` + `attemptId`：DB の入口で古い結果を無効にする

再判定、リース失効、worker 再起動、メッセージ再配送があるため、提出 ID が同じでも有効な実行は一つとは限らない。

- `generation`：論理提出または再判定の epoch。
- `attemptId`：worker の実行リース token。

```text
acquire lease:  id + status=Pending + generation
renew lease:    id + current_attempt_id
write verdict:  id + generation + current_attempt_id
rejudge/reaper: expected generation -> generation + 1
```

[`SubmissionMapper`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/modules/submission/mapper/SubmissionMapper.java) の lease、更新、verdict SQL は条件更新を使う。影響行数 0 はリース喪失、古い generation、引き継ぎを意味し、上書きを続けない。実行器は `judge.stale_result.dropped` を記録し、安全に破棄した旧結果を ACK する。

[`SubmissionRejudgeService`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/submission/admin/SubmissionRejudgeService.java) と [`JudgingLeaseReaper`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/modules/submission/reaper/JudgingLeaseReaper.java) は generation CAS で epoch を進め、新しい判定意図を作る。遅着した旧メッセージは新条件を満たせない。

上流の完全な一回実行を要求せず、最終書き込み資格を検査可能な条件に集約する。ただし Submission owner の DB に限る fence で、システム間認可、メッセージ永続性、業務監査の代用ではない。

## 4. Docker D-form：資源を隔離し基盤障害を分類する

[`SandboxExecutorImpl`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/submission/sandbox/executor/SandboxExecutorImpl.java) は一時 job workspace と読み取り専用 `input.json` を作り、lifecycle runner から Docker を起動し、`finally` で可能な限り後始末する。

```text
--network none
--cap-drop ALL
--read-only
--user 1000:1000
--security-opt no-new-privileges
--security-opt seccomp=<resolved profile>
--memory <effective limit>
--cpus <effective limit>
--pids-limit <effective limit>
--ulimit nofile=128:128
--tmpfs /tmp:rw,exec,size=64m
<workspace>:/workspace:ro
--rm
```

seccomp profile の解決失敗ではフィルターを黙って外さず、明確な Docker 設定エラーにする。見かけ上の実行成功のために隔離を暗黙に弱めない。

[`SandboxOutcomeClassifier`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/submission/sandbox/SandboxOutcomeClassifier.java) は次を分ける。

- プロセス起動自体の失敗：launch failure。
- exit 137：OOM。
- exit 125：OCI 設定または Docker daemon エラー。
- `Cannot fork`、pids、`RLIMIT_NPROC`：fork limit。
- コンパイラーのエラー：compile error。
- その他の非ゼロ終了：通常の runtime error。

コンテナ未作成、seccomp パス誤り、fork 資源不足をユーザーコードの Runtime Error と偽らない。診断・再試行を説明可能にするが、完全な脱出防止は専用監査と実環境検証が必要である。

## 5. 同期プレビューと非同期実行で contract を共有する

即時プレビューと長時間タスクで要求・状態・エラーを別々に定めると、同じコードでも入口ごとに挙動が変わる。

[`AsyncSandboxExecutor`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/submission/runtime/async/AsyncSandboxExecutor.java) は `submit/poll/cancel` を定義する。`ExecutionRequest` は job、test case、visibility、空でない idempotency key を必須とする。既定 key は `job.runId:testCase.id`、要求には SHA-256 fingerprint も付く。同じ key で異なる payload は誤った結果の再利用ではなく競合として検出できる。

Judge の [`CodeExecutionProvider`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge/src/main/java/com/ulticode/judge/provider/CodeExecutionProvider.java) は入口で制約する。

- 同期 `execute` は `PUBLIC_PREVIEW` のみ。
- 業務例外を型付き `RpcResult` にし、任意文字列の解析を不要にする。
- 非同期提出は一つの test case と有界のメモリ metadata。
- 上限 1024 件、TTL 15 分。完了・取消・timeout 後に回収。
- Docker が既定、Judge0 は任意 adapter。

生成コード、ツール引数、長時間 Agent の結果にも、明確な状態機械、冪等キー、容量上限が必要である。モデル・ツール呼び出し関数を無制限な全体タスク管理へ膨らませない。

非同期 receipt はまだプロセス内の有界 metadata であり、複数 replica・再起動をまたぐ永続冪等性は未完成。外部 Judge0 も既定では検証されていない。

## 6. 品質ゲート：静的契約と重い検証を分ける

[`scripts/dev/test.sh`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/scripts/dev/test.sh) と文書はコストと現実性で段階を分ける。

```text
static       -> zero-infra contract checks
unit         -> unit tests, exclude IT/IntegrationTest
quick/full   -> progressively heavier local checks
integration  -> Testcontainers, DB/Redis, sandbox and owner migration
```

CI の zero-infra 入口：

```bash
bash scripts/test/zero-infra-validation-contract.sh --static-only
```

静的経路は Docker、DB、サービス、Testcontainers、Maven、pnpm install を起動しない。スクリプト契約、パス、設定、安全境界を小さな変更ごとに確認する。DB、Redis、サンドボックス、owner 横断の挙動は unit/integration に残す。静的ゲートは統合証拠の代用ではなく、統合テストも本番トラフィックの証拠ではない。

[`docker-publish.yml`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/.github/workflows/docker-publish.yml) はサービス行列から GHCR イメージを作り、SBOM と provenance を有効にする。Trivy は HIGH/CRITICAL の OS/library 脆弱性を終了コードで阻止し、Cosign は digest を署名し署名・attestation を検証する。GHCR 名は先に小文字に統一する。

これらは自動化された安全・配送ゲートであり、CI がシステム全体の安全性を証明したとは言えない。実行記録と外部認証情報で実際の完走を確認する。

## 7. LLM/Agent への四つの示唆

UltiCode の対象は prompt ではなく提出コードだが、四つの直接的な類比がある。

### 7.1 不信入力を能力境界に通す

生成コード、ツール引数、パッチ、外部ページにも能力・資源・データ範囲の境界を設ける。`owner + port + adapter` は事実の所有者と実行権限を、system prompt の願望でなく型・インターフェースの制約にする。

### 7.2 非同期タスクには永続意図・冪等性・fence が必要

timeout、再試行、重複配送、取消がある。Outbox は意図、idempotency key は重複要求、generation/attempt fence は古い worker の書き戻しを扱う。メッセージが重複しないことと、結果が古くないことは異なる。

### 7.3 事実スナップショットは暗黙の文脈より再現しやすい

`SubmissionFactsSnapshot` は要求時の事実、捕捉時刻、schema を渡す。Agent も可視資源、権限、モデル版、入力要約、実行方針を版付きスナップショットにでき、同じ ID が時刻で別の対象を指す曖昧さを減らせる。

### 7.4 失敗の分類が自己回復を決める

OOM、OCI、fork 制限、コンパイル失敗を一律に扱うと監視・再試行の判断を失う。LLM も provider 制限、権限拒否、入力不正、出力解析不能、業務失敗を区別する。`FAILED` 一語より観測可能な状態が役立つ。

## 8. 実装・検証・主張できない事項

| ラベル | 正確な表現 |
|---|---|
| `Repository Implemented` | 固定コミットに owner/worker 文書、事実契約、DB outbox、Streams 重複排除・PEL 回収、generation/attempt CAS、Docker 安全設定、分類、CI ゲートがある。 |
| `Repository Evidence` | 対応するソース、設定、境界テストがある。テスト名は追跡可能な証拠で、今回の実行成功ではない。 |
| `Locally Validated` | ブログの KB lint とビルドを検証する予定であり、UltiCode の Maven、Docker、Redis、Testcontainers 検証とはしない。 |
| `BLOCKED_EXTERNAL` | 本番配置・流量、外部 Judge0、実際の複数 replica・再起動 receipt、認証情報、イメージ実行環境、公開認証は対象外。 |
| `OUT_OF_SCOPE` | 高スループット、本番 HA、ゼロ損失、完全な脱出防止、任意 Core profile の本番品質は主張しない。 |

状態は `provisional` のまま。強い結論には static/unit/integration の再現可能な記録、Docker/Redis/MySQL の実結果、再起動・複数 replica の receipt 検証、別個のサンドボックス監査が必要である。

## 最小限の読解順

配置図から推測せず、次の順にソースへ戻る。

1. [構成概要](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/docs/architecture/overview.md) → [owner とモジュール境界](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/docs/architecture/modules.md)。
2. [事実スナップショット](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/api/submission-api/src/main/java/com/ulticode/submission/api/dto/SubmissionFactsSnapshot.java) → [Submission 書き込み](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/modules/submission/port/DefaultSubmissionWritePort.java)。
3. [outbox dispatcher](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/main/java/com/ulticode/modules/queue/outbox/dispatcher/JudgeOutboxDispatcher.java) → [Streams adapter](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/queue/port/adapter/RedissonStreamsJudgeQueueAdapter.java) → [attempt executor](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/queue/processor/DefaultJudgeAttemptExecutor.java)。
4. [Docker 実行器](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/submission/sandbox/executor/SandboxExecutorImpl.java) → [エラー分類](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/submission/sandbox/SandboxOutcomeClassifier.java)。
5. [検証状態](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/docs/project/current-status.md) → [テスト階層](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/docs/development/testing.md)。

### 対応する境界テストの入口

次の名前は追加確認のためであり、今回は UltiCode の代わりに実行していない。

- [`SubmissionFactsSnapshotTest`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/test/java/com/ulticode/submission/port/SubmissionFactsSnapshotTest.java)、[`DefaultSubmissionWritePortIT`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/test/java/com/ulticode/modules/submission/port/DefaultSubmissionWritePortIT.java)、[`SubmissionOutboxDispatcherIT`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/submission/src/test/java/com/ulticode/modules/queue/outbox/dispatcher/SubmissionOutboxDispatcherIT.java)。
- [`SandboxForkE2EIT`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/test/java/com/ulticode/modules/submission/sandbox/SandboxForkE2EIT.java)、[`SandboxExecutorImplForkDetectionTest`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/test/java/com/ulticode/modules/submission/sandbox/executor/SandboxExecutorImplForkDetectionTest.java)、[`SandboxOutcomeClassifierTest`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/test/java/com/ulticode/modules/submission/sandbox/SandboxOutcomeClassifierTest.java)。
- [`DockerAsyncSandboxAdapterTest`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/test/java/com/ulticode/modules/submission/runtime/async/DockerAsyncSandboxAdapterTest.java)、[`Judge0AsyncSandboxAdapterTest`](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/test/java/com/ulticode/modules/submission/runtime/async/Judge0AsyncSandboxAdapterTest.java)。

## 出典と関連文書

- [ulticode-engineering-highlights-f801a1076](https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/ulticode-engineering-highlights-f801a1076.md)
- [ulticode-project-context](https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/ulticode-project-context.md)
- [ulticode-reliability-core-f801a1076](https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/raw/zh-cn/ulticode-reliability-core-f801a1076.md)
- [マイクロサービスデータ所有権：領域 owner を先に決めてから、DB 分割と移行を考える](/blog/legacy/note/ja/microservice-data-ownership/)
- [Dubbo + Nacos：登録名と group/version を先に確認してから、本物の smoke test を実行する](/blog/legacy/note/ja/dubbo-nacos-runtime/)
- [JJWT 0.13.0：署名アルゴリズムを明示固定し、key 型で検証する](/blog/legacy/note/ja/jjwt-013-security-api/)
- [マルチサービス起動レディネス：running、ready と依存/失敗/再起動の伝播](/blog/legacy/note/ja/multi-service-readiness/)
- [データベース Schema ドリフト：history、schema、query の三ビューで特定する](/blog/legacy/note/ja/database-schema-drift/)
- [UltiCode の Data Owner と fact snapshot：サービス間 submit の境界を保つ](/blog/legacy/note/ja/ulticode-owner-and-facts/)
- [Owner 間 audit を cross-database write にしない：UltiCode の Local Outbox と Consumer Inbox](/blog/legacy/note/ja/ulticode-owner-local-audit-inbox/)
- [UltiCode Outbox と Redis Streams：判定タスクの配送を復旧可能な状態にする](/blog/legacy/note/ja/ulticode-outbox-redis-streams/)
- [UltiCode の generation と attemptId：条件付き更新で古い判定結果を遮断する](/blog/legacy/note/ja/ulticode-generation-attempt-fence/)
- [database lease だけでは足りない：UltiCode の fence token で期限切れ singleton task を止める](/blog/legacy/note/ja/ulticode-fenced-singleton-lease/)
- [UltiCode Docker sandbox：リソース隔離とインフラエラーの分類](/blog/legacy/note/ja/ulticode-docker-sandbox/)
- [UltiCode 非同期実行コントラクト：冪等性、フィンガープリント、上限付き receipt](/blog/legacy/note/ja/ulticode-async-execution-contract/)
- [modular monolith を実験場として扱う：UltiCode Core の allowlist、timeout、close-once lifecycle](/blog/legacy/note/ja/ulticode-core-bounded-testbed/)
- [UltiCode の検証とサプライチェーンゲート：static contract から検証可能なリリースへ](/blog/legacy/note/ja/ulticode-ci-supply-chain/)
