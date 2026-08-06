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

> **2026-08-01 の進化メモ：** この記事の以前の版では provider ごとに複数の Headroom ポートを割り当てていた。現在の実装は loopback の一つの入口 `127.0.0.1:8787` に収束している。リクエストヘッダーと provider override が実際の上流を選び、`headroom-proxy.service` は一つの統合プロキシプロセスだけを管理する。

### 3.1 なぜ圧縮プロキシ層が必要なのか？

OMP はロールに基づいてリクエストを異なる provider/model にルーティングする。理想的には、すべてのプロバイダがプロンプトキャッシュ、コンテキスト圧縮、ツール結果キャッシュを備えているべきだ。しかし現実には、すべての上流がこれらをネイティブにサポートしているわけではない。Headroom はこの隙間を埋めるローカルリバースプロキシとして、通過するトラフィックの圧縮、キャッシュ、プロトコル正規化を行う。

**プロキシカバレッジ原則：ガバナンスが必要なプロバイダだけをプロキシ経由にし、それ以外は直接接続する。** 現在は Zhipu、Kimi、MiniMax、Codex の対象トラフィックが同じ 8787 入口に入る。それ以外の provider は、明示的にこの入口またはルーティングヘッダーを使った場合だけ統合プロキシに入る。特に、マークされていない Anthropic `/v1/messages` リクエストはサービス設定の Kimi デフォルト先を使うため、「他の provider はすべて直接接続」とは安全に言えない。

#### 価値の全体像：主戦力は RTK

実行時計測による「節約トークン数」の分解：
- **RTK CLI フィルタリング**：節約の **約 86.7%** を貢献（ツール出力ノイズの剥離）；
- **プレフィックスキャッシュ安定化**：`--mode cache` で **約 100% のヒット率** を維持；
- **能動的圧縮**：節約の **1% 未満**（非 Read 本文の圧縮のみ）。

Headroom の役割は「キャッシュ安定化＋プロトコル正規化」に近く、真の節約を担っているのは RTK である。

### 3.2 全体アーキテクチャ：単一入口とリクエスト単位の上流

OMP と Kimi CLI は管理対象のトラフィックを `127.0.0.1:8787` に送る。プロキシはもうポート番号から provider を推測しない。`x-headroom-base-url`、`x-headroom-original-path` などのリクエスト情報を読み、動的ヘッダーのない Anthropic リクエストだけが `ANTHROPIC_TARGET_API_URL` をデフォルト先として使う。

```mermaid
flowchart LR
  A["OMP / Kimi CLI"] --> H["127.0.0.1:8787<br/>headroom-proxy.service"]
  H --> Z["Zhipu<br/>x-headroom-base-url"]
  H --> K["Kimi<br/>Anthropic デフォルト先"]
  H --> M["MiniMax<br/>x-headroom-base-url"]
  H --> C["Codex<br/>Responses WebSocket"]
  Z --> ZU["open.bigmodel.cn"]
  K --> KU["api.kimi.com/coding"]
  M --> MU["api.minimaxi.com/v1"]
  C --> CU["chatgpt.com/backend-api/codex"]
```

現在の provider ルートは四つのケースに分けられる。

| Provider | クライアント側のルーティング | Headroom の上流 |
| --- | --- | --- |
| Zhipu | `models.db` の `baseUrl` + `x-headroom-*` ヘッダー | `https://open.bigmodel.cn/api/coding/paas/v4/chat/completions` |
| Kimi | `models.db` / Kimi CLI 設定。ヘッダーなしの Anthropic リクエストはデフォルト先を使用 | `https://api.kimi.com/coding/v1/messages` |
| MiniMax | `~/.omp/agent/models.yml` で組み込み provider を上書きし、`x-headroom-*` ヘッダーを付与 | `https://api.minimaxi.com/v1/chat/completions` |
| Codex | `models.db` が 8787 を指し、Headroom が ChatGPT subscription を検出 | `wss://chatgpt.com/backend-api/codex/responses` |

OMP 以外の Anthropic クライアントで本来の Anthropic ルーティングを維持する場合は、別の Headroom インスタンス/ポートを使うか、`x-headroom-base-url=https://api.anthropic.com` を明示すること。Kimi のデフォルトは安全網ではなく、静かなリダイレクトである。

このアーキテクチャを理解する鍵は、各アーティファクトが何を担い、何を担わないかを明確にすることだ：

| 層 | アーティファクト（ファイル/オブジェクト） | 担うもの | 担わないもの |
| --- | --- | --- | --- |
| **1. ロール→モデル束縛** | `config.yml`（`modelRoles`、`task.agentModelOverrides`、`retry.fallbackChains`） | 各 OMP ロールが使う provider/model；モデル障害時のフォールバックグラフ | ネットワークルーティング |
| **2. モデル→入口束縛** | `models.db` テーブル `model_cache`（`provider_id`、`models[].api`、`models[].baseUrl`） | provider が `http://127.0.0.1:8787/v1` を指すか、プロトコルとモデルメタデータ | 動的な上流選択 |
| **3. リクエスト単位のルーティング** | `x-headroom-base-url`、`x-headroom-original-path`、`models.yml` override | 一つの入口を実際の上流へ対応付け、元の path を保持 | ロール割り当てと認証情報の生成 |
| **4. 統合プロキシプロセス** | `headroom-proxy.service` | 8787 の待受、圧縮、キャッシュ、プロトコル正規化、転送、再起動ポリシー | どの OMP role がリクエストを選んだか |

さらに二つの直交する関心事がある：
- **クレデンシャルストア**（`agent.db` テーブル `auth_credentials`）：Headroom は OMP が送る認証ヘッダを転送するだけで、自ら認証を注入することはない。
- **CLI 設定**（`~/.kimi-code/config.toml` など）：独立 CLI の provider、OAuth、ヘッダー意味論を提供する。OMP がすべての CLI 設定を読むとは限らない。

### 3.3 単一ポート導入フロー

単一ポート移行の要点は、provider ごとに別の unit を作ることではない。モデルルーティング、リクエストヘッダー、統合サービスを一つの閉じた流れにすることである。

```mermaid
flowchart TD
  Q1{"provider は<br/>127.0.0.1:8787/v1 に解決される？"}
  Q1 -- いいえ --> T1["models.db または<br/>models.yml override を確認"]
  Q1 -- はい --> Q2{"リクエストに動的な<br/>上流ヘッダーがある？"}
  Q2 -- いいえ --> D1["Anthropic デフォルト先を確認し<br/>意図しない Kimi ルーティングを防ぐ"]
  Q2 -- はい --> P1["x-headroom-base-url と<br/>x-headroom-original-path を確認"]
  D1 --> P2["統合 systemd unit を維持し<br/>provider ポートへ再分割しない"]
  P1 --> P2
  P2 --> P3["daemon-reload + restart<br/>8787 だけが待受することを確認"]
  P3 --> P4["Zhipu / Kimi / MiniMax / Codex の<br/>実 selector スモークテストを実行"]
  P4 --> P5["proxy.log の実際の上流 URL を読み<br/>トポロジーとロールバック証拠を記録"]
```

#### 統合 systemd ユニット

現在のサービスの重要な設定は次のとおりである。Codex の Responses WebSocket ルートを上書きしないよう、`OPENAI_TARGET_API_URL` は設定しない。

```ini
[Unit]
Description=Headroom Unified Context Optimization Proxy
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
Environment=HOME=%h
Environment=HEADROOM_HOST=127.0.0.1
Environment=ANTHROPIC_TARGET_API_URL=https://api.kimi.com/coding
Environment=ALL_PROXY=
Environment=LITELLM_PROXY=
Environment=all_proxy=
Environment=SOCKS_PROXY=
Environment=socks_proxy=
ExecStart=/home/davidhlp/.local/bin/headroom proxy --port 8787
RestartSec=8
StandardOutput=append:%h/.headroom/logs/headroom-proxy.log
StandardError=append:%h/.headroom/logs/headroom-proxy.log

[Install]
WantedBy=default.target
```

`RestartSec=8` は TCP `TIME_WAIT` ソケットが解放される時間を確保し、再起動が速すぎて偽のポート競合や crash loop が起きるのを防ぐ。

#### MiniMax 組み込み provider の override

MiniMax は OMP の組み込み provider である。不在または不安定な動的 `model_cache` 行を唯一の設定元とみなしてはいけない。現在は `models.yml` で上書きしている。

```yaml
# Managed local override: route the built-in MiniMax provider through Headroom.
providers:
  minimax-code-cn:
    baseUrl: http://127.0.0.1:8787/v1
    headers:
      x-headroom-base-url: https://api.minimaxi.com/v1
      x-headroom-original-path: /chat/completions
```

`x-headroom-base-url` は実際の上流を選び、`x-headroom-original-path` は `/chat/completions` を保持して `/v1` の二重連結を防ぐ。

#### Kimi デフォルト先の境界

Kimi CLI の Anthropic リクエストは `x-headroom-base-url=https://api.kimi.com/coding` で Kimi を明示的に選べる。しかし一部の OMP リクエストは動的ヘッダーなしで 8787 に到達するため、サービスには次の設定がある。

```ini
Environment=ANTHROPIC_TARGET_API_URL=https://api.kimi.com/coding
```

動的ルーティングヘッダーを持たない Anthropic `/v1/messages` リクエストはすべて、Anthropic 公式エンドポイントではなく Kimi に送られる。通常の Claude 通信も 8787 を使うなら、別入口、明示的なヘッダー、またはクライアント識別に基づく条件ルーティングが必要である。

#### Codex の特殊ルート

Codex subscription は Responses WebSocket を使用する。

```text
/v1/responses
→ wss://chatgpt.com/backend-api/codex/responses
```

`OPENAI_TARGET_API_URL` は設定してはいけない。ログには `wss://chatgpt.com/backend-api/codex/responses` と `response.completed` が必要であり、通常の `/v1/chat/completions` の成功だけでは不十分である。

#### 旧サービスの削除

単一ポート移行後は、旧 provider unit、drop-in、enable 状態を削除する。

```bash
systemctl --user disable --now \
  headroom-proxy-zhipu.service \
  headroom-proxy-kimi.service \
  headroom-proxy-minimax.service \
  headroom-proxy-codex.service \
  headroom-proxy-webui.service || true

rm -rf ~/.config/systemd/user/headroom-proxy-zhipu.service.d
rm -rf ~/.config/systemd/user/headroom-proxy-kimi.service.d
rm -rf ~/.config/systemd/user/headroom-proxy-minimax.service.d
rm -rf ~/.config/systemd/user/headroom-proxy-codex.service.d
rm -rf ~/.config/systemd/user/headroom-proxy-webui.service.d

systemctl --user daemon-reload
systemctl --user enable --now headroom-proxy.service
```

#### `models.db` とプロセス内キャッシュ

`models.db` の `model_cache` 行を変更する場合は `authoritative=1` を維持し、OMP を再起動する。そうしないと静的レジストリまたはプロセス内キャッシュが古い `baseUrl` を使い続ける可能性がある。MiniMax の安定した上書きは `models.yml` に置き、重複したキャッシュ行を手動挿入しない。

### 3.4 三階層のルーティング検証

トラフィックが本当にプロキシを経由しているかは、ヘルスエンドポイントや HTTP 200 だけで判断してはいけない。三階層の証拠を積み上げる。

| 階層 | 検証手段 | 証明できること | 証明できないこと |
| --- | --- | --- | --- |
| **L1 設定** | `models.db` / `models.yml` の `baseUrl` が 8787 を指すか確認 | オーケストレータが統合入口へ送れること | 実行時の選択とヘッダーが実際に使われるか |
| **L2 プロトコル** | 各プロトコルの最小リクエストを 8787 に直接送る | プロキシ到達性、プロトコル処理、認証パススルー | オーケストレータがここへルーティングするか |
| **L3 オーケストレータ原生** | 実 selector を実行し、`proxy.log` の上流 URL、`ss`、`PERF` を確認 | オーケストレータが正しい上流へ原生トラフィックを送ったこと | — |

**L3 検証コマンド：**

```bash
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

#### サービス制御

```bash
# 統合サービスの状態
systemctl --user status headroom-proxy.service

# 再起動 / 停止
systemctl --user restart headroom-proxy.service
systemctl --user stop headroom-proxy.service

# リアルタイムログ追跡
journalctl --user -u headroom-proxy.service -f
```

#### CLI プローブ

```bash
# ヘルスチェック
headroom doctor --port 8787

# パフォーマンス・キャッシュ指標
headroom perf

# トークン節約統計
headroom savings

# 一つの入口だけが待受していることを確認
ss -tlnp | grep -E '127\.0\.0\.1:(8787|8788|8790|8791|8800)'
```

#### プローブ注意事項

- `/livez` はプロキシプロセスのリアルタイム状態を反映する。
- `/readyz` はデフォルトの Anthropic URL を探査して unhealthy を返す場合があるが、**統合プロキシの転送失敗を意味しない**。
- `headroom doctor` の Claude、Codex、shell-env、budget warning は、実 selector と上流 URL の証拠の代わりにならない。
- 最終的な基準は `proxy.log` に `open.bigmodel.cn`、`api.kimi.com`、`api.minimaxi.com`、または `chatgpt.com` が現れることである。
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

- [ ] 各プロキシポートの `/livez` が正常ステータスを返す
- [ ] `models.db` の `baseUrl` が loopback アドレスを指す
- [ ] L3 検証：`proxy.log` に `PERF model=` 行が現れ、`ss` で接続先が `127.0.0.1:<PORT>` を確認
- [ ] `headroom doctor` と `headroom perf` の出力が正常

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
| **WSL2 ミラードネットのポート幽霊占有** | ポートは空きに見えるがバインドで `EADDRINUSE` | `127.0.0.1:8787` を Python で生バインドテストし、`ss` で旧 unit が入口を占有していないことを確認 |
| **Headroom のリクエスト単位 path ルーティングエラー** | `/paas/v4`、`/coding/v1`、`/chat/completions` が二重連結され 404 | `x-headroom-base-url` と `x-headroom-original-path` を保持し、Codex では `OPENAI_TARGET_API_URL` を設定しない |
| **`RestartSec=3` クラッシュループ** | unit が 50 回以上の再起動ループに入る | `RestartSec=8` で TCP TIME_WAIT のクリア時間を確保 |
| **`authoritative=0` サイレントロールバック** | 一定時間後に `baseUrl` がデフォルトへ戻る | `models.db` 修正時に `authoritative=1` を強制 |
| **OMP `model_cache` のメモリキャッシュ** | DB 変更後に設定が反映されない | `models.db` 修正後に OMP を再起動し、MiniMax の安定した override は `models.yml` に置く |
| **統合入口の Kimi デフォルト先** | ヘッダーなしの非 OMP Anthropic リクエストが Kimi に静かに送られる | 本来の Anthropic 通信は別ポートを使うか、`x-headroom-base-url=https://api.anthropic.com` を明示 |
| **廃止 provider unit の未削除** | 8787 だけに見えても旧プロセスがルーティングや旧ログ出力を続ける | 旧 unit を `disable --now`、drop-in を削除し、`daemon-reload` 後に `headroom-proxy.service` だけを有効化 |
| **サブエージェントのモデルオーバーライドが無視される** | サブエージェントが設定済みモデルではなく親セッションのモデルを使用 | 検証は L3 まで到達させる（`proxy.log` + `ss`） |
| **context-mode と Headroom の二重圧縮** | モデル出力が過度に簡略化されコンテキストが欠落 | 一層ずつ無効化して切り分け：Headroom 停止または `context-mode` プラグイン無効化 |

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
