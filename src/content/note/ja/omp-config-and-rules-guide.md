---
title: "OMP 設定・ルール体系マスターガイド：グローバル設定、Headroom プロキシ、Agent ルールシステム"
timestamp: 2026-08-01 00:00:00+08:00
series: "OMP 規則と設定体系"
tags: [OMP, Agent, Headroom, DevOps, LLM, Operations, RTK, Rules, Configuration, Architecture]
description: "AI Agent オーケストレーションにおける OMP の設定・ルール体系の包括的ガイド。10のモデルロールとフォールバックチェーンを持つグローバル設定、カスタムプロバイダ導入と三階層ルーティング検証を備えた Headroom 圧縮プロキシ層、そしてマルチソース検出・三つの注入モード・paths/globs サイレント失敗の罠を含む Agent ルールシステムを網羅。"
toc: true
---

# OMP 設定・ルール体系マスターガイド：グローバル設定、Headroom プロキシ、Agent ルールシステム

OMP（Oh My Pi）は高度にカスタマイズ可能な AI Agent オーケストレーションフレームワークである。本番環境で安定稼働させるには、三つの次元を同時に掌握する必要がある：**グローバル設定**はモデルルーティングとフォールバック戦略を決定し、**プロキシ層**はトラフィック治理とコスト最適化を決定し、**ルールシステム**は Agent がどのような場面でどのような制約を守るかを決定する。

本記事は三本の OMP 特集記事を統合したもので、グローバル設定からプロキシ層、ルールシステムまで、OMP 設定体系の完全なナラティブを構築する。

---

## 一、OMP 設定体系の概要と設計哲学

OMP の設定体系は三つの中核関心事を中心に展開する：

1. **モデルルーティングとフォールバック**：`~/.omp/agent/config.yml` により、10のモデルロール、フォールバックアンカープール、全ロールフォールバックチェーンを定義し、能力とコストの精緻なバランスを実現する。
2. **トラフィックガバナンス**：Headroom 圧縮プロキシ層により、カスタムモデルプロバイダを OMP に統一的に統合し、通過するすべてのトラフィックに透過的な圧縮、キャッシュ、プロトコル正規化を適用する。
3. **制約注入**：ルールシステムのマルチソース検出、統一正規化、三つの注入モードにより、チームの規約をコードレベルの制約として落とし込む。

三者の関係：グローバル設定は「どのモデルを使うか」を決め、Headroom は「トラフィックをどう流すか」を決め、ルールシステムは「Agent をどう行動させるか」を決める。この三層を理解すれば、OMP のインストールから運用までの完全なライフサイクルを掌握できる。

---

## 二、グローバル設定の解析：モデルロール、フォールバックチェーン、実行制御

### 2.1 現在のグローバル設定スナップショット

以下は `~/.omp/agent/config.yml` で現在有効な完全な設定スナップショットである：

```yaml
setupVersion: 1
modelRoles: 
  plan: zhipu-coding-plan/glm-5.2:max
  advisor: zhipu-coding-plan/glm-5.2
  slow: google-antigravity/claude-sonnet-4-6:high
  task: zhipu-coding-plan/glm-4.7:high
  designer: google-antigravity/gemini-3.6-flash-high
  smol: minimax-code-cn/MiniMax-M3:low
  tiny: zhipu-coding-plan/glm-4.7:low
  commit: google-antigravity/gemini-3.1-flash-lite
  vision: google-antigravity/gemini-3.6-flash-high
  default: google-antigravity/gemini-3.6-flash:medium

_fallback_anchors: 
  strong: 
    - minimax-code-cn/MiniMax-M3:high
    - kimi-code/k3:high
    - google-antigravity/claude-sonnet-4-6:high
  light: 
    - zhipu-coding-plan/glm-4.7:low
    - minimax-code-cn/MiniMax-M2.7:low
    - google-antigravity/gemini-3.1-flash-lite

retry: 
  enabled: true
  maxRetries: 5
  baseDelayMs: 2000
  fallbackRevertPolicy: cooldown-expiry
  fallbackChains: 
    slow: 
      - kimi-code/k3:high
      - minimax-code-cn/MiniMax-M3:high
      - google-antigravity/claude-sonnet-4-6:high
    plan: 
      - minimax-code-cn/MiniMax-M3:high
      - kimi-code/k3:high
      - google-antigravity/claude-sonnet-4-6:high
    advisor: 
      - minimax-code-cn/MiniMax-M3:high
      - kimi-code/k3:high
      - google-antigravity/claude-sonnet-4-6:high
    default: 
      - kimi-code/kimi-for-coding:high
      - zhipu-coding-plan/glm-4.7:high
      - google-antigravity/gemini-3.6-flash-high
    task: 
      - zhipu-coding-plan/glm-4.7:high
      - kimi-code/kimi-for-coding:high
      - google-antigravity/gemini-3.6-flash-high
    designer: 
      - google-antigravity/gemini-3.6-flash-high
      - kimi-code/k3:high
      - minimax-code-cn/MiniMax-M3:high
    vision: 
      - kimi-code/k3:high
      - minimax-code-cn/MiniMax-M3:high
      - google-antigravity/gemini-3.6-flash-high
    smol: 
      - zhipu-coding-plan/glm-4.7:low
      - google-antigravity/gemini-3.1-flash-lite
    tiny: 
      - kimi-code/kimi-for-coding:low
      - google-antigravity/gemini-3.1-flash-lite
    commit: 
      - zhipu-coding-plan/glm-4.7:low
      - kimi-code/kimi-for-coding:low
  usageAwareFallback: true
  usageReservePolicy: auto
  usageReservePct: 10

advisor: 
  enabled: true
  subagents: true
symbolPreset: ascii
theme: 
  dark: dark-volcanic
  light: light
disabledExtensions: []
memory: 
  backend: hindsight
hindsight: 
  apiUrl: http://localhost:42888
autolearn: 
  enabled: true
  autoContinue: true
defaultThinkingLevel: auto
dev: 
  autoqaConsent: granted
prewalk: 
  enabled: true
display: 
  showTokenUsage: true
compaction: 
  idleEnabled: true
  idleThresholdTokens: 200000
task: 
  prewalk: true
  eager: preferred
goal: 
  continuationModes: 
    - interactive
branchSummary: 
  enabled: true
snapcompact: 
  systemPrompt: none
  toolResults: true
ttsr: 
  interruptMode: prose-only
checkpoint: 
  enabled: false
computer: 
  enabled: false
statusLine: 
  showHookStatus: false
```

### 2.2 モデルトポロジーとフォールバックアンカー

OMP は `modelRoles` を通じてワークロードを各専門モデルへ割り当て、`_fallback_anchors` により強モデルと軽量モデルのバックアッププールを構成する。

```mermaid
flowchart TD
    subgraph Topology["モデルトポロジー (10ロール)"]
        Plan["plan / advisor<br/>(GLM-5.2)"]
        Slow["slow<br/>(Claude Sonnet 4.6)"]
        Task["task / default / designer / vision<br/>(GLM-4.7 / Gemini 3.6 Flash)"]
        Light["smol / tiny / commit<br/>(MiniMax-M3 / Gemini Flash Lite)"]
    end

    subgraph Anchors["フォールバックアンカー (_fallback_anchors)"]
        StrongAnchors["strong アンカープール<br/>• MiniMax-M3:high<br/>• Kimi-k3:high<br/>• Claude-Sonnet-4-6:high"]
        LightAnchors["light アンカープール<br/>• GLM-4.7:low<br/>• MiniMax-M2.7:low<br/>• Gemini-3.1-Flash-Lite"]
    end

    Plan --> StrongAnchors
    Slow --> StrongAnchors
    Task --> StrongAnchors
    Light --> LightAnchors
```

#### 10大モデルロールの役割

- **構成設計・アドバイス (`plan` / `advisor`)**：`zhipu-coding-plan/glm-5.2` により、全局的なアーキテクチャ設計と助言を担当。
- **深層推理 (`slow`)**：`google-antigravity/claude-sonnet-4-6:high` により、難解なバグ診断と重要なアーキテクチャリファクタリングを担当。
- **標準 Worker 群 (`task` / `default` / `designer` / `vision`)**：`GLM-4.7:high` と `Gemini 3.6 Flash` により、高スループットのコード作成、UI設計、マルチモーダル処理を提供。
- **高速低コストキュー (`smol` / `tiny` / `commit`)**：`MiniMax-M3:low` と `Gemini 3.1 Flash Lite` により、ミリ秒級の Git コミット生成と高速ファイルスキャンを実現。

#### アンカー分離メカニズム (`_fallback_anchors`)

`_fallback_anchors` は利用可能なモデルプールを `strong` と `light` の二つの階層に抽象化する：
- **`strong` 強アンカープール**：`MiniMax-M3:high`、`Kimi-k3:high`、`Claude-Sonnet-4-6:high` を含む。推理重視のロールを強力にバックアップ。
- **`light` 軽アンカープール**：`GLM-4.7:low`、`MiniMax-M2.7:low`、`Gemini-3.1-Flash-Lite` を含む。軽量タスクの低コストバックアップ。

### 2.3 全9ロールフォールバックチェーン (`fallbackChains`) と利用制限感知

API レート制限（RPM/TPM）や一時障害が発生した際、**全9つの核心ロール** に対する自動フォールバックが機能する：

1. **重厚推理・計画グループ (`slow`, `plan`, `advisor`)**：迂回ルート `Kimi-k3:high` → `MiniMax-M3:high` → `Claude-Sonnet-4-6:high`。
2. **標準 Worker・UI画像グループ (`default`, `task`, `designer`, `vision`)**：`Kimi-for-coding` / `GLM-4.7:high` / `Gemini 3.6 Flash High` を優先フォールバック。
3. **高速スキャングループ (`smol`, `tiny`, `commit`)**：軽量モデルから `GLM-4.7:low` / `Gemini 3.1 Flash Lite` / `Kimi-for-coding:low` へ退守。

#### クールダウン復帰と予約保護ポリシー

- **`fallbackRevertPolicy: cooldown-expiry`**：クールダウン終了後、自動的にプライマリモデルへ復帰。
- **`usageAwareFallback: true` & `usageReservePct: 10`**：利用上限を事前に感知し、10% のバッファ枠を維持して切り替えを実行。

### 2.4 詳細な実行制御フラグ

#### 思考と探査フラグ

- **`defaultThinkingLevel: auto`**：タスク難易度に応じて CoT（思考チェーン）の深さを自動調整。
- **`task.prewalk: true` & `prewalk.enabled: true`**：コード変更前に依存関係ファイルや影響範囲を強制探査。
- **`task.eager: preferred`**：サブタスク検知時に並列実行を優先。

#### 対話と割り込みモード

- **`goal.continuationModes: [interactive]`**：対話継続モードを有効化し、無応答による切断を防止。
- **`ttsr.interruptMode: prose-only`**：Turn-To-Speak 割り込みを自然言語のみに制限。
- **`branchSummary.enabled: true`**：Git ブランチの変更概要の自動生成を有効化。
- **`snapcompact.toolResults: true`**：200k トークンアイドル圧縮時にツール過去出力をスナップショット削除。

#### 開発者・実験的オプション

- **`dev.autoqaConsent: granted`**：開発環境における自動 QA テストの実行を許可。
- **`checkpoint.enabled: false` & `computer.enabled: false`**：実験的な Checkpoint スナップショットと Computer Use デスクトップ操作を明示的に無効化し、安定性を確保。

### 2.5 長期記憶とハードガードレール

1. **Hindsight 長期記憶 (`backend: hindsight`)**：ローカルの Hindsight デーモン（`http://localhost:42888`）に接続し、セッションを超えてプロジェクトの決定事項、教訓、ユーザー設定を永続化。
2. **Autolearn 自動スキル定着 (`autolearn.enabled: true`)**：再利用可能な教訓/スキルを自動抽出し、`~/.omp/agent/managed-skills/` に定着。
3. **Pre-tool-call ハードガードレール (GitHub Write Gate)**：`~/.omp/agent/hooks/pre/github-write-gate.ts` により、`git push`、`gh pr` などの書き込み操作をコマンド実行前に物理遮断。ユーザーの明示的な確認または `OMPGATE_OFF=1` が必要。

---

## 三、Headroom 圧縮プロキシ：単一ポートの動的ルーティング

グローバル設定は「どのモデルを使うか」を決め、Headroom は「トラフィックをどう流すか」を解決する。

日常の OMP ライフサイクルは[公式 Headroom README](https://github.com/headroomlabs-ai/headroom/blob/main/README.md) に従い、常駐 systemd サービスではなく公式 wrapper を使う。

```bash
# 公式 CLI は一度だけインストール（Python 3.13+）
uv tool install --python 3.13 "headroom-ai[all]"

# OMP の唯一の推奨起動入口
headroom wrap omp

# wrapped セッション実行中、別ターミナルで確認
headroom doctor
headroom perf
headroom dashboard
```

`headroom wrap omp` は OMP を起動し、そのセッションに必要なローカルプロキシのライフサイクルを管理する。通常は旧 `~/.config/systemd/user/headroom-proxy.service` を作成・維持せず、provider ごとの systemd unit を有効化せず、`headroom proxy --port 8787` も手動実行しない。これらは旧来の手動/移行経路であり、推奨する日常の起動方法ではない。

> **2026-08-01 の進化メモ：** 以前の版では provider ごとに複数の Headroom ポートと常駐 service unit を割り当てていた。この旧トポロジーは obsolete であり推奨しない。公式 wrap-only 経路が自動的に扱うのは OMP 組み込みの `anthropic` provider だけで、設定された Anthropic 上流を維持する。現在の `openai-codex` と `opencode-go` は直接接続のままであり、Zhipu、Kimi、MiniMax、Codex の loopback ルートは過去/条件付き custom provider の証拠である。

### 3.1 なぜ圧縮プロキシ層が必要なのか？

OMP はロールに基づいてリクエストを異なる provider/model にルーティングする。理想的には、すべてのプロバイダがプロンプトキャッシュ、コンテキスト圧縮、ツール結果キャッシュを備えているべきだ。しかし現実には、すべての上流がこれらをネイティブにサポートしているわけではない。Headroom はこの隙間を埋めるローカルリバースプロキシとして、通過するトラフィックの圧縮、キャッシュ、プロトコル正規化を行う。

**プロキシカバレッジ原則：ガバナンスが必要なプロバイダだけをプロキシ経由にし、それ以外は直接接続する。** 現在の wrap-only 経路では、組み込み `anthropic` provider は設定された Anthropic 上流を使い、現在の `openai-codex`/`opencode-go` role は直接接続のままである。Zhipu、Kimi、MiniMax、Codex が 127.0.0.1:8787 に入るのは、明示的な custom provider 設定とルーティング header/環境変数がある場合だけであり、デフォルトではなく移行証拠である。

#### 価値の全体像：主戦力は RTK

実行時計測による「節約トークン数」の分解：
- **RTK CLI フィルタリング**：節約の **約 86.7%** を貢献（ツール出力ノイズの剥離）；
- **プレフィックスキャッシュ安定化**：`--mode cache` で **約 100% のヒット率** を維持；
- **能動的圧縮**：節約の **1% 未満**（非 Read 本文の圧縮のみ）。

Headroom の役割は「キャッシュ安定化＋プロトコル正規化」に近く、真の節約を担っているのは RTK である。

### 3.2 全体アーキテクチャ：単一入口とリクエスト単位の上流

プロキシが `x-headroom-base-url`、`x-headroom-original-path` などのリクエスト情報を読むのは、明示的に設定した custom ルートの場合だけである。組み込み `anthropic` provider は設定された Anthropic 上流を維持し、`headroom wrap omp` は `ANTHROPIC_TARGET_API_URL` を設定しない。ヘッダーのない Anthropic リクエストが暗黙に Kimi へ送られることもない。

```mermaid
flowchart LR
  A["OMP roles"] --> AN["組み込み anthropic<br/>wrap 自動<br/>Anthropic 上流"]
  A --> D["現在の openai-codex / opencode-go<br/>models.db 直接接続"]
  A --> H["条件付き custom 入口<br/>127.0.0.1:8787<br/>過去の移行"]
  H --> Z["Zhipu<br/>明示的 custom 設定"]
  H --> K["Kimi<br/>明示的 header/env/config"]
  H --> M["MiniMax<br/>過去の models.yml override"]
  H --> C["Codex<br/>明示的 Responses WebSocket"]
  Z --> ZU["open.bigmodel.cn"]
  K --> KU["api.kimi.com/coding"]
  M --> MU["api.minimaxi.com/v1"]
  C --> CU["chatgpt.com/backend-api/codex"]
```

provider ルートは、四つの自動ケースではなく三つのカテゴリに分けて考える。

| Provider | クライアント側のルーティング | Headroom の上流 |
| --- | --- | --- |
| 組み込み `anthropic` | wrapper が自動管理するルート。暗黙の Kimi target はない | 設定された Anthropic 上流 |
| `openai-codex` / `opencode-go` | 現在の `models.db` 直接接続エントリ。loopback へ自動変更しない | 各 provider の設定された直接上流 |
| Zhipu | 過去/条件付き custom ルート。`x-headroom-*` の明示設定が必要 | `https://open.bigmodel.cn/api/coding/paas/v4/chat/completions` |
| Kimi | 過去/条件付き custom ルート。header、環境変数、provider 設定が必要 | `https://api.kimi.com/coding/v1/messages` |
| MiniMax | 過去の `models.yml` override/custom ルート。wrap には不要 | `https://api.minimaxi.com/v1/chat/completions` |
| Codex | 過去/条件付き custom ルート。Responses WebSocket の明示設定が必要 | `wss://chatgpt.com/backend-api/codex/responses` |

OMP 以外の Anthropic クライアントで本来のルーティングを維持する場合は、設定済みの直接エンドポイントを使うか、custom ルートで `x-headroom-base-url=https://api.anthropic.com` を明示すること。wrapper を常駐手動サービスで置き換えてはいけない。Kimi target は明示的な custom ルーティングの選択であり、安全網ではない。

このアーキテクチャを理解する鍵は、各アーティファクトが何を担い、何を担わないかを明確にすることだ：

| 層 | アーティファクト（ファイル/オブジェクト） | 担うもの | 担わないもの |
| --- | --- | --- | --- |
| **1. ロール→モデル束縛** | `config.yml`（`modelRoles`、`task.agentModelOverrides`、`retry.fallbackChains`） | 各 OMP ロールが使う provider/model；モデル障害時のフォールバックグラフ | ネットワークルーティング |
| **2. モデル→入口束縛** | 現在の `models.db`/`model_cache` 状態 | 設定済みの直接エントリまたは明示設定した custom エントリ | 非 Anthropic 行を自動的に変更すること、停止後も loopback を向け続けること |
| **3. リクエスト単位のルーティング** | `x-headroom-base-url`、`x-headroom-original-path`、過去の `models.yml` override | 明示設定した custom 入口を実際の上流へ対応付け、元の path を保持 | ロール割り当てと資格情報の生成 |
| **4. Wrap 管理プロキシのライフサイクル** | `headroom wrap omp` | 現在のセッションのローカルプロキシを起動・管理する | どの OMP role がリクエストを選んだか |

さらに二つの直交する関心事がある：
- **クレデンシャルストア**（`agent.db` テーブル `auth_credentials`）：Headroom は OMP が送る認証ヘッダを転送するだけで、自ら認証を注入することはない。
- **CLI 設定**（`~/.kimi-code/config.toml` など）：独立 CLI の provider、OAuth、ヘッダー意味論を提供する。OMP がすべての CLI 設定を読むとは限らない。

### 3.3 単一ポート導入フロー

単一ポート移行の要点は provider ごとに別の unit を作ることではない。モデルルーティング、リクエストヘッダー、`headroom wrap omp` が起動するプロキシを一つの閉じた流れにすることである。

```mermaid
flowchart TD
  Q1{"組み込み anthropic provider か明示的な custom ルートか？"}
  Q1 -- いいえ --> T1["設定済みの直接上流を維持<br/>loopback へ自動変更しない"]
  Q1 -- はい --> Q2{"リクエストに動的な<br/>上流ヘッダーがある？"}
  Q2 -- いいえ --> D1["設定済みの Anthropic 上流を使う<br/>暗黙の Kimi デフォルトはない"]
  Q2 -- はい --> P1["x-headroom-base-url と<br/>x-headroom-original-path を確認"]
  D1 --> P2["wrap がライフサイクルを管理<br/>provider ポートへ再分割しない"]
  P1 --> P2
  P2 --> P3["wrapped セッションを実行し<br/>ローカル入口が動作することを確認"]
  P3 --> P4["明示的な custom provider ルートだけ<br/>selector smoke を実行"]
  P4 --> P5["proxy.log の実際の上流 URL を読み<br/>ルーティング証拠を記録"]
```

#### 公式 wrap 起動

通常の OMP セッションは次のコードブロックで起動する。

```bash
uv tool install --python 3.13 "headroom-ai[all]"
headroom wrap omp
```

wrapped セッション実行中、別ターミナルで確認する。

```bash
headroom doctor
headroom perf
headroom dashboard
```

wrapper がセッション単位のローカルプロキシを管理するため、常駐 service や手動起動した直接プロキシで代替しない。

#### 手動 systemd サービス：移行専用で非推奨

旧版では統合 `headroom-proxy.service` を systemd で常駐させ、`headroom proxy --port 8787` を直接起動していた。この構成は obsolete であり、通常の OMP ライフサイクルでは作成・有効化・再起動・保守しない。現在は `headroom wrap omp` がそのセッションのローカルプロキシを管理する。


#### MiniMax 組み込み provider の override（旧移行証拠）

以前の移行では `models.yml` で組み込み provider を上書きしていた。以下のコードブロックは歴史的な証拠としてだけ残す。現在の `headroom wrap omp` には不要である。プロセス終了だけでは `models.yml` は復元されないため、wrapped セッション後は明示的に `headroom unwrap omp` を実行する（デフォルトはローカルプロキシを停止）。プロキシを意図的に残す場合だけ `--no-stop-proxy` を使い、この override を日常の起動手順に追加してはいけない：

```yaml
# 旧移行の証拠のみ。現在の wrap ライフサイクルには不要。
providers:
  minimax-code-cn:
    baseUrl: http://127.0.0.1:8787/v1
    headers:
      x-headroom-base-url: https://api.minimaxi.com/v1
      x-headroom-original-path: /chat/completions
```

この旧 override は `x-headroom-base-url` で実際の上流を選び、`x-headroom-original-path` で `/chat/completions` を保持する仕組みを示すだけであり、現在の日常起動要件ではない。

#### Kimi デフォルト先の境界

Kimi CLI の Anthropic リクエストは `x-headroom-base-url=https://api.kimi.com/coding` で Kimi を明示的に選択できる。以下の環境変数は旧 custom ルーティング設定だけに属する。

```text
# 旧式の明示 override。headroom wrap omp は設定しない。
ANTHROPIC_TARGET_API_URL=https://api.kimi.com/coding
```

通常の `headroom wrap omp` は設定された Anthropic 上流を維持する。この変数、または同等の custom header/provider ルートを明示設定した場合だけ、ヘッダーのないリクエストが Kimi に送られる。通常の Claude 通信も 8787 を使うなら、別入口、明示的な header、またはクライアント識別による条件ルーティングが必要である。

#### Codex の特殊ルート

Codex subscription は過去/条件付き custom ルートで Responses WebSocket を使用する。

```text
/v1/responses
→ wss://chatgpt.com/backend-api/codex/responses
```

現在の `openai-codex` role は、明示的に別設定しない限り直接接続である。custom ルートでは `OPENAI_TARGET_API_URL` を設定せず、ログに Responses WebSocket と `response.completed` が出ることを確認する。通常の `/v1/chat/completions` の成功だけでは不十分である。

#### 旧サービスと手動キャッシュ編集：移行専用で非推奨

旧 provider unit、drop-in、常駐 `headroom-proxy.service`、および直接実行する `headroom proxy --port 8787` は obsolete である。ここでは移行の背景だけを残す。通常の OMP セッションでは作成・有効化・再起動・保守せず、`headroom wrap omp` を唯一の推奨ライフサイクル入口とする。

`models.db` と `models.yml` はランタイム/override の成果物であり、日常の起動契約ではない。`models.db` を手動編集したり reconciler を起動時に実行したりせず、wrapped セッション停止後に OMP を loopback へ向けたままにもしない。新しいセッションは `headroom wrap omp` で起動する。

#### `models.db` とプロセス内キャッシュ

プロセスキャッシュは派生状態である。履歴上の移行で `authoritative=1` や provider override を確認する必要がある場合は、移行証拠として記録するだけにする。データベース編集や常駐サービスを通常運用にしない。wrapper がセッション単位のローカルプロキシとクライアント接続を構築する。

### 3.4 三階層のルーティング検証

トラフィックが本当にプロキシを経由しているかは、ヘルスエンドポイントや HTTP 200 だけで判断してはいけない。三階層の証拠を積み上げる。

| 階層 | 検証手段 | 証明できること | 証明できないこと |
| --- | --- | --- | --- |
| **L1 設定** | 組み込み `anthropic` の自動ルート、現在の直接 `models.db` エントリ、明示した custom エントリを確認 | 自動・直接・条件付きルートの区別 | 過去の loopback ルートが現在も有効なこと |
| **L2 プロトコル** | 設定済みのルートだけに対し、active wrapped session から最小リクエストを送る | プロキシ到達性、プロトコル処理、認証パススルー | すべての provider が loopback を通ること |
| **L3 オーケストレータ原生** | 明示した custom ルートだけ selector を実行し、`proxy.log` の最終上流 URL/`PERF` を確認。直接 role は直接上流を別途確認 | 選択されたルートが意図した上流へ到達したこと | — |

**L3 検証コマンド（条件付き custom provider の証拠だけ。wrapped セッション実行中の別ターミナルから実行）：**

以下の native `omp --no-session ...` は単独の `omp` 起動入口ではない。先に `headroom wrap omp` でセッションを起動し、全 selector に明示的な custom provider 設定がある場合だけループを実行する。現在の `openai-codex` と `opencode-go` role はデフォルトで直接接続である。

```bash
# 過去/条件付き custom provider smoke。デフォルトの wrap 構成ではない。
for selector in \
  zhipu-coding-plan/glm-4.7 \
  kimi-code/k3 \
  minimax-code-cn/MiniMax-M3 \
  openai-codex/gpt-5.6-luna; do
  env -u ALL_PROXY -u all_proxy -u HTTP_PROXY -u HTTPS_PROXY \
    omp --no-session --no-tools --no-skills --no-rules --no-extensions \
      --mode=json --model "$selector" -p 'Reply with exactly PONG'
done
```

次に `~/.headroom/logs/proxy.log` を確認する。

| Provider | 決定的な上流証拠 | 期待結果 |
| --- | --- | --- |
| Zhipu | `path=https://open.bigmodel.cn/api/coding/paas/v4/chat/completions` | `status=200` |
| Kimi | `path=https://api.kimi.com/coding/v1/messages` | `status=200` |
| MiniMax | `path=https://api.minimaxi.com/v1/chat/completions` | `status=200` |
| Codex | `wss://chatgpt.com/backend-api/codex/responses` | `response.completed` |

### 3.5 RTK と Headroom の組み合わせアーキテクチャ

RTK と Headroom は二つの独立したコンポーネントである。RTK は Agent 側近くで CLI/ツール出力のノイズをフィルタリングし、Headroom はネットワーク層でプレフィックスキャッシュとコンテキスト圧縮を維持する。単一ポートは Headroom のネットワーク入口を変えるだけで、責務の境界は変えない。

```mermaid
flowchart LR
  subgraph Edge["オーケストレータ側（エージェントに近い）"]
    T["ツール呼び出し<br/>shell / read / grep ..."]
    R["RTK<br/>ツール出力のノイズを剥離"]
  end
  subgraph Proxy["Headroom プロキシ層（127.0.0.1:8787）"]
    H["cache 凍結<br/>CCR 遅延注入<br/>content-router 圧縮"]
  end
  subgraph Up["リクエストが選ぶ上流"]
    U["Zhipu / Kimi / MiniMax / Codex"]
  end
  T --> R
  R -->|"フィルタ済み内容"| H
  H --> U
```

#### 介入箇所の区別

- **インライン HTTP リダイレクト**（`curl` のインターセプトなど）：オーケストレータの `context-mode` プラグインが処理。
- **大きなコマンド出力のリダイレクト**（ログ切り詰めなど）：RTK が処理。

### 3.6 日常運用とプローブツール

#### Wrap ライフサイクル

wrapper が現在の OMP セッションのローカルプロキシライフサイクルを管理する。service-control コマンドを使わず、停止したセッションの loopback ルートを残さない。

```bash
# 通常の起動
uv tool install --python 3.13 "headroom-ai[all]"
headroom wrap omp
```

wrapped セッション実行中、別ターミナルで確認する。

```bash
headroom doctor
headroom perf
headroom dashboard
```
終了時は明示的に `headroom unwrap omp` を実行すること。デフォルトでは wrapper 管理の route state を削除してローカルプロキシを停止する。プロキシを意図的に残す場合だけ `headroom unwrap omp --no-stop-proxy` を使い、そうしなければ loopback state が残る可能性がある。

```bash
headroom unwrap omp
```

#### プローブ注意事項

- `/livez` と dashboard は active wrapped session のプロキシ状態を反映する。
- `headroom doctor` の Claude、Codex、shell-env、budget warning は実 selector と上流 URL の証拠の代わりにならない。
- 最終的な基準は `~/.headroom/logs/proxy.log` または最終上流 URL/WebSocket であり、loopback HTTP 200 だけでは意図した provider への到達を証明できない。

---

## 四、ルールシステム：マルチソース検出、三つの注入モード、paths/globs の罠

グローバル設定は「どのモデルを使うか」を決め、Headroom は「トラフィックをどう流すか」を決め、ルールシステムは「Agent をどう行動させるか」を決める。

### 4.1 背景：設定としてのルール

Agent オーケストレーションフレームワークには「コンテキストに応じた制約層」が必要だ。同一の Agent でも、Java バックエンドを修正する際とフロントエンドを開発する際では異なる規約を適用しなければならない。ルールはこのコンテキスト束縛された制約の担い手である。

ルールシステムが解決すべき三つの課題：

- **どこから来るか**：複数のハーネス（omp、Claude Code、Cursor、pi 等）がそれぞれのルールディレクトリを持つ——どう統一するか；
- **どう正規化するか**：異なる frontmatter フィールド——どう一つの構造に標準化するか；
- **いつ注入するか**：パス一致、編集ストリーム、毎ターン注入のいずれか。

OMP のアプローチ：各ソースに検出モジュールを置き、すべての検出ルールを単一の `buildRuleFromMarkdown()` に集約、強制的に一つの正規形状に归一し、frontmatter に基づいて三つの注入モードのいずれかにルーティングする。

### 4.2 全体アーキテクチャ：マルチソース検出から統一注入へ

```mermaid
flowchart LR
  subgraph Sources["ルールソース（各検出モジュール）"]
    B[".omp/rules/*.md<br/>.omp/rules/*.mdc<br/>(builtin.ts)"]
    R[".omp/RULES.md<br/>常駐 always-apply<br/>(builtin.ts)"]
    C[".claude/rules/*.md<br/>(claude.ts + builtin.ts)"]
    CU[".cursor/rules/*.mdc<br/>(cursor.ts)"]
    A[".agent/rules/*.md<br/>(agents.ts)"]
    AG["AGENTS.md<br/>(agents-md.ts)"]
    O["opencode / codex /<br/>gemini / cline 等<br/>(各モジュール)"]
  end
  subgraph Build["buildRuleFromMarkdown()<br/>src/discovery/helpers.ts"]
    P["parseFrontmatter<br/>→ 正規化 RuleFrontmatter"]
  end
  subgraph Reg["能力レジストリ"]
    R1["Rule[]<br/>name, content, globs,<br/>alwaysApply, condition,<br/>astCondition, scope"]
  end
  subgraph Inject["実行時"]
    CTX["パススコープ<br/>globs マッチ → 注入"]
    TTSR["ストリームスコープ<br/>condition + scope → TTSR 割り込み"]
    STICKY["常駐<br/>alwaysApply → 毎ターン再注入"]
  end
  B --> Build
  R --> Build
  C --> Build
  CU --> Build
  A --> Build
  AG --> Build
  O --> Build
  Build --> Reg
  Reg --> CTX
  Reg --> TTSR
  Reg --> STICKY
```

#### 3つのルール注入モード

読み込まれた各ルールは、frontmatter に基づいて三つのランタイムモードのいずれかに正確にルーティングされる：

| モード | トリガー条件 | 実際の動作 |
| --- | --- | --- |
| **パススコープ（path-scoped）** | `globs: [...]` が編集中/読込中のファイルに一致 | 候補パスが一致した場合のみルール本文をコンテキストに注入 |
| **ストリームスコープ（TTSR）** | `condition:` / `astCondition:` + `scope:`（例：`tool:edit(*.ts)`） | パターンが編集/書込/読込内容に一致したときに**ストリーム割り込み**として発動 |
| **常駐（sticky / always-apply）** | `alwaysApply: true`、または最上位の `RULES.md` ファイル | 現在のターンの付近で毎ターン再注入——長い会話でも失われない |

三つのキーのいずれも持たないルールは、**オンデマンド取得（agent-requested）** モードに退化する：`description:` でインデックスされ、自動注入されない。

### 4.3 検出チェーン：どのパスがスキャンされるか

#### 原生 OMP パス（builtin.ts の `loadRules`）

| パス（cwd から上位遍历） | スコープ | 動作 |
| --- | --- | --- |
| `.omp/rules/*.md` および `*.mdc` | プロジェクト | 標準ルールファイル——frontmatter が注入モードを決定 |
| `~/.omp/agent/rules/*.md` および `*.mdc` | ユーザー | 同上——本機の全プロジェクトに有効 |
| `.omp/RULES.md`（最近のもの、上位遍历でリポジトリルートまで） | プロジェクト | **常駐 always-apply**——frontmatter を無視して強制有効 |
| `~/.omp/agent/RULES.md` | ユーザー | **常駐 always-apply**——グローバルベースライン |

上位遍历は `os.homedir()` で停止する。最初に見つかった `.omp/` ディレクトリが有効；なければ OMP は git ルートにフォールバック。

#### 跨ハーネスパス

| モジュール | スキャンパス | 形式説明 |
| --- | --- | --- |
| `agents-md.ts` | `AGENTS.md`（最近、上位遍历）+ ネストされたサブツリー | ドメイン指導。パススコープルールではない |
| `claude.ts` | `~/.claude/` + `<cwd>/.claude/` | `rules/`、`commands/`、`tools/`、`skills/` 等をスキャン |
| `cursor.ts` | `.cursor/rules/*.mdc` + 旧版 `.cursorrules` | MDC frontmatter：`description`、`globs`、`alwaysApply` |
| `agents.ts` | `.agent/rules/`、`.agents/rules/`（上位遍历 + ユーザーホーム） | 汎用 agent エコシステムディレクトリ規約 |
| `codex.ts`、`gemini.ts`、`opencode.ts`、`cline.ts` 等 | 各ハーネス独自のディレクトリ | 各自登録、最終的に同じ正規ルール形状に归一 |

#### スキャン**されない**パス

| パス | 理由 |
| --- | --- |
| `.pi/rules/` | pi 専用規約。OMP には `pi.ts` 検出モジュールがない——**これがシンボリックリンクブリッジが存在する理由** |
| `mcp.json` の `rules:` キー | 何もしない。`mcp-schema.json` がトップレベルで `additionalProperties: false` を宣言——未知のキーは静かに破棄 |
| `config.yml` の `rules:` ブロック | この設定キーは存在しない。OMP には `memory.*`、`advisor.*`、`modelRoles.*`、`retry.*` がある——`rules.*` だけはない |

### 4.4 正規 frontmatter：RuleFrontmatter

`src/capability/rule.ts`（`RuleFrontmatter`）と `src/discovery/helpers.ts`（`buildRuleFromMarkdown`）に基づいて確認。

```yaml
---
# 正規 OMP frontmatter（任意のサブセット、すべてオプション）
description: "オンデマンド検索用の一行説明。globs/condition がない場合は必須。"
globs:
  - "backend-spring/src/**/*.java"
  - "docker/sandbox/harness/java/src/**/*.java"
alwaysApply: false        # true → 常駐、毎ターン再注入
condition:                # TTSR 割り込みをトリガーする正規表現
  - "^import\\s+java\\.util\\.Date$"
astCondition:             # ast-grep パターン；編集/書込ストリームのみ
  - "new $T($$$ARGS)"
scope:                    # TTSR ストリームスコープトークン
  - "tool:edit(*.java)"
  - "tool:write(*.java)"
interruptMode: prose-only # never | prose-only | tool-only | always
---

# ルール本文 —— Markdown

- 具体的で実行可能な制約を MUST / SHOULD / NEVER で表述。
- 読順：親ファイルはいつ入るか（WHEN）を記述、子ファイルはどうするか（HOW）を記述。
```

#### frontmatter キーの权威一覧

| キー | OMP が読むか | 説明 |
| --- | --- | --- |
| `description` | ✅ | スコープ一致がない場合にオンデマンド検索で使用 |
| `globs` | ✅ | **OMP が唯一認識するパススコープキー** |
| `alwaysApply` | ✅ | `true` → 常駐 always-apply |
| `condition` / `ttsr_trigger` / `ttsrTrigger` | ✅ | 三つのエイリアスすべて受け付け |
| `astCondition` | ✅ | ast-grep パターン；編集/書込ストリームのみ |
| `scope` | ✅ | ストリームトークン（`text`、`thinking`、`tool:edit(*.ts)` 等） |
| `interruptMode` | ✅ | ルール単位の `ttsr.interruptMode` オーバーライド |
| **`paths`** | ❌ **読まない** | 下の罠を参照——pi-rules / Claude Code 形式 |
| **`kind`** | ❌ 無視 | pi-rules マーカー（`kind: rules`）、OMP はこのキーで区別しない |
| **`summary`** | ❌ 無視 | pi-rules 要約、`[key: string]: unknown` に落入 |
| **`triggers`** | ❌ 無視 | pi-rules トリガー、同上 |

### 4.5 paths と globs の相互運用罠（ソース検証済み）

**これは pi-rules や Claude Code から OMP へルールセットを移行する際、最も一般的なサイレント失敗モードである。**

#### 機構

`buildRuleFromMarkdown()` は `frontmatter.globs` のみを読み込む：

```ts
let globs: string[] | undefined;
if (Array.isArray(frontmatter.globs)) {
  globs = frontmatter.globs.filter((item): item is string => typeof item === "string");
} else if (typeof frontmatter.globs === "string") {
  globs = [frontmatter.globs];
}
```

どの検出モジュールも frontmatter を後処理して `paths:` を `globs:` に変換することはない。

#### 症状

`paths:` で書かれたルールは OMP に読み込まれるが、`globs` は `undefined` に解決される。ルールは**オンデマンド取得**モードに退化し、**パス一致時に自動注入されることはない**。しかも**警告もログもエラーもない**。`*.java` ファイルを編集してもルールがトリガーされない。

#### 二つの修正方法（リポジトリごとにいずれか一つ）

**(a) OMP 正規形式でルールを書く**——`paths:` を `globs:` に置き換える：

```yaml
---
globs:
  - "backend-spring/src/**/*.java"
description: "Java 17 バックエンドソースルール。"
---
```

**(b) frontmatter 二重キー**——両方のキーを保持し、各ハーネスが認識する方を読む：

```yaml
---
kind: rules                 # pi-rules マーカー（OMP は無視、pi は要求）
paths:                      # pi-rules / Claude Code パススコープ
  - "backend-spring/src/**/*.java"
globs:                      # OMP 正規パススコープ
  - "backend-spring/src/**/*.java"
summary: Java backend rules. # pi-rules 要約（OMP は無視）
description: "Java backend rules. # OMP 検索キー（pi は無視）"
---
```

> **共有ディレクトリ（`.claude/rules/`、`.pi/rules/`）は方式 (b) を推奨**。4 キーの冗長性は機械的で、あらゆるハーネス切替に耐える。

### 4.6 ルール導入決定ツリーとブリッジ

```mermaid
flowchart TD
  Q1{"ルールはプロジェクト固有か<br/>それともマシン全体か?"}
  Q1 -- "マシン全体" --> U1["~/.omp/agent/rules/&lt;name&gt;.md<br/>または ~/.omp/agent/RULES.md（常駐）"]
  Q1 -- "プロジェクト" --> Q2{"どのハーネスが読み込むか?"}
  Q2 -- "OMP のみ" --> O1[".omp/rules/&lt;name&gt;.md<br/>正規 OMP frontmatter を使用"]
  Q2 -- "OMP + pi + Claude" --> D1["二重キー frontmatter<br/>（上記方式 b）<br/>.claude/rules/ に配置<br/>+ シンボリックリンク .omp/rules → ../.claude/rules"]
  Q2 -- "pi のみ" --> P1[".pi/rules/&lt;name&gt;.md<br/>pi-rules 形式（paths 必須）"]
  Q2 --> Q3{"ルールはいつトリガーすべきか?"}
  Q3 -- "一致するパスの編集時" --> G1["globs: を設定（二重キーなら paths: も同時設定）"]
  Q3 -- "編集/書込ストリームにパターンが出現時" --> T1["condition / astCondition + scope を設定"]
  Q3 -- "毎ターン" --> A1["alwaysApply: true<br/>または RULES.md に改名してスコープルートに配置"]
  Q3 -- "オンデマンドのみ" --> D2["description: のみ設定"]
  G1 --> V1["omp ttsr scan -v &lt;path&gt;"]
  T1 --> V1
  A1 --> V1
  D2 --> V1
```

#### pi-rules → OMP ブリッジ（リポジトリごとに一度だけ）

リポジトリの正規ルールツリーが `.pi/rules/` の場合、**ディレクトリシンボリックリンク**でブリッジする：

```bash
# リポジトリルートで
mkdir -p .omp
ln -s ../.pi/rules .omp/rules
```

> **注意**：ブリッジは OMP のスキャナにファイルを「見える」ようにするだけで、`paths:` を `globs:` に変換するわけではない。上記の二重キー修正と組み合わせる必要がある。

### 4.7 ルール作成の三定律

1. **広さを先に、深さを後に。** 親ファイルは*いつ*子ファイルに入るかを記述——*どうするか*ではない。
2. **繰り返さない。** 子ファイルにある事実は、親ファイルで再述しない。繰り返しはドリフトし、ドリフトは信頼を崩壊させる。
3. **説明は意思決定。** 各 `description` は答えなければならない：*Agent はいつここに入るべきか？*「何があるか」ではなく、*いつ関連するか*。

#### 具体的な措辞ルール

- `MUST` / `SHOULD` / `NEVER`（RFC 2119）を使用。
- 1つの箇条書きに1つの制約。
- 正規のパス/パターンの具体的な名前を使用。
- 負の制約（`NEVER`、`MUST NOT`）には**理由**を添える。

---

## 五、エンドツーエンド検証チェックリスト

三つの記事の検証内容を統合し、統一検証マニュアルを形成する。

### グローバル設定の検証

- [ ] `config.yml` が YAML パーサーで正しく解析される
- [ ] `modelRoles` の各ロールに対応するモデル定義がある
- [ ] `fallbackChains` に無効化/利用不可モデルへの参照が含まれない
- [ ] `usageReservePct` が適切に設定されている（推奨：10%）

### Headroom プロキシの検証

- [ ] [公式 Headroom README](https://github.com/headroomlabs-ai/headroom/blob/main/README.md) を読み、`uv tool install --python 3.13 "headroom-ai[all]"` で CLI をインストール
- [ ] OMP は `headroom wrap omp` だけで起動し、wrapper が active セッションのローカルプロキシを管理する
- [ ] wrapped セッション実行中、`headroom doctor`、`headroom perf`、`headroom dashboard` が完了する
- [ ] L1/L2/L3 の証拠で、組み込み `anthropic` の自動ルート、現在の直接 role、明示した custom ルートを区別する
- [ ] loopback HTTP 200、停止済みセッション、手動編集した `models.db`、reconciler の出力だけを現在のルーティング証拠にしない


### ルールシステムの検証

- [ ] `cd <repo> && omp ttsr list` が期待されるルール数を表示（TTSR ルールのみ）
- [ ] `omp ttsr scan -v <候補パス>` でパススコープルールが掛かっていることを確認
- [ ] `omp ttsr test --rule <ルールファイル> --source tool --path <パス> <断片>` が正例でトリガー、負例で静か
- [ ] 共有ディレクトリ：二重キー frontmatter を grep で確認——`paths:` が存在する場合、`grep -L "globs:" <repo>/.omp/rules/*.md` は空を返す
- [ ] シンボリックリンクブリッジ：`readlink .omp/rules` が解決する；`find -L .omp/rules -type f | wc -l` がソースと一致
- [ ] 最上位 `RULES.md`（あれば）が Markdown として解析可能；スコープごとに常駐ルール一つ
- [ ] `mcp.json` に `rules:` キーがない（静かに破棄されるので依存しない）

---

## 六、既知の罠と教訓まとめ

三つの記事の踩坑記録を統合し、統一経験マニュアルを形成する。

### グローバル設定の罠

| 罠 | 症状 | 緩和策 |
| --- | --- | --- |
| **`fallbackChains` に無効モデルが残る** | 主モデルは正常だが、フォールバック時に無効モデルに_hit | 主ロール変更後、`fallbackChains` のモデル参照を grep で確認 |
| **`config.yml` 変更が即座に反映されない** | 現セッションの動作が変わらない | OMP はセッションごとに設定を読み込む。次セッションで自動反映、再起動不要 |

### Headroom プロキシの罠

| 罠 | 症状 | 緩和策 |
| --- | --- | --- |
| **WSL2 ミラードネットのポート幽霊占有** | 手動で選んだポートは空きに見えるがバインドで `EADDRINUSE` | `headroom wrap omp` で起動し、wrapper/proxy ログと `ss` は補助証拠として確認 |
| **Headroom のリクエスト単位 path ルーティングエラー** | `/paas/v4`、`/coding/v1`、`/chat/completions` が二重連結され 404 | 明示した custom ルートだけで `x-headroom-base-url` と `x-headroom-original-path` を保持し、Codex では `OPENAI_TARGET_API_URL` を設定しない |
| **旧 `RestartSec` クラッシュループ** | obsolete な systemd unit が再起動ループに入る | 旧 unit を調整・復活せず、`headroom wrap omp` を使う |
| **手動 `authoritative=0` ロールバック** | 手動変更した `baseUrl` が戻る、または無視される | `models.db` は派生状態として扱い、日常起動で patch せず新しい wrapped session を開始 |
| **OMP 派生キャッシュ** | 手動 DB 変更が現プロセスに反映されない | DB 編集に依存せず、新しい `headroom wrap omp` セッションで実際の上流を確認 |
| **旧 Kimi デフォルト先** | 旧 env/header override を設定した場合だけ、ヘッダーなし Anthropic リクエストが Kimi に静かに送られる | 通常の wrap は Anthropic 上流を維持。旧 override を削除するか、明示的な Kimi header/provider ルートを使う |
| **旧 provider unit の残留** | 旧プロセスがルーティングを奪う、または旧ログを書き続ける | 旧移行残留として扱い、`headroom-proxy.service` を有効化せず、通常起動は `headroom wrap omp` のみ |
| **サブエージェントのモデルオーバーライドが無視される** | サブエージェントが設定済みモデルではなく親セッションのモデルを使用 | wrapped session で L3（`proxy.log` + 最終上流 URL）まで検証 |
| **context-mode と Headroom の二重圧縮** | モデル出力が過度に簡略化されコンテキストが欠落 | 一層ずつ無効化して切り分け：wrapped session を終了または `context-mode` プラグインを無効化 |

### ルールシステムの罠

| 罠 | 症状 | 緩和策 |
| --- | --- | --- |
| **`paths:` と `globs:` の不整合** | ルールが読み込まれるがパス一致時にトリガーされない；エラーログなし | `globs:`（OMP）または二重キー frontmatter（共有ディレクトリ）を使用 |
| **`mcp.json` の `rules:` キー** | 静かに破棄；ルールが現れない | `mcp-schema.json` が未知のトップレベルキーを禁止。ルールファイルを使用 |
| **`.pi/rules/` が OMP に読み込まれない** | pi 専用規約；OMP に `pi.ts` 検出モジュールなし | シンボリックリンクブリッジ：`.omp/rules → ../.pi/rules` |
| **最上位 `RULES.md` が深層サブツリーで無視される** | 常駐ルールがネストされたサブツリーで効かない | `RULES.md` はリポジトリルートに配置、サブディレクトリ不可 |
| **`alwaysApply: true` がコンテキストを満たす** | 毎ルール毎ターン再注入でコンテキスト膨張 | `alwaysApply` は真のグローバル制約にreserved。95% の場合は `globs:` か TTSR を優先 |
| **シンボリックリンク `.omp/rules/` の陳旧化** | ソースツリーの新規ファイルが現れない | ディレクトリシンボリックリンクを使用（ファイルごとに作らない）。追加後に `omp ttsr list` で検証 |
| **`AGENTS.md` と `rules/*.md` の重複** | 同一制約が両側に書かれ、必ずドリフト | `AGENTS.md` は*境界とフロー*；`rules/*.md` は*パススコープ制約* |
| **1ファイルに複数ハーネスの frontmatter が混在** | どのハーネスがどのキーを認識するか不明 | キーごとにコメントラベルを付与、またはハーネス別にファイル分割 |

---

「グローバル設定の層を明確にし、三階層のルーティング検証を厳格にし、ルール正規化を統一し、ツールの組み合わせを維持する」ことで、本番環境において高効率で安定し、監査可能な OMP Agent ガバナンスアーキテクチャを構築できる。
