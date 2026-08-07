---
title: "歴史的な Headroom ルート復旧：named profile と model_cache reconciler"
timestamp: 2026-08-06 00:00:00+08:00
series: "OMP 規則と設定体系"
tags: [OMP, Agent, Headroom, DevOps, LLM, Operations, Routing, Proxy, Codex, OpenCode]
description: "OMP の更新で runtime model cache が書き換えられる場合の旧移行・復旧方式を記録する。named profile、外部ルート宣言、冪等な SQLite reconciler は移行証拠のみであり、現在の日常起動は公式の headroom wrap omp だけを使う。"
toc: true
---

# 歴史的な Headroom ルート復旧：named profile と model_cache reconciler

日常の起動で推奨する唯一の経路は、常駐サービスではなく公式 wrapper である。[公式 Headroom README](https://github.com/headroomlabs-ai/headroom/blob/main/README.md)を参照する。

```bash
# 公式 CLI は一度だけインストールする（Python 3.13+）
uv tool install --python 3.13 "headroom-ai[all]"

# OMP の通常起動に使う唯一の推奨入口
headroom wrap omp

# wrapped セッションの実行中に別ターミナルで検証する
headroom doctor
headroom perf
headroom dashboard
```

`headroom wrap omp` は OMP を起動し、そのセッションに必要なローカルプロキシを管理する。通常は旧式の `~/.config/systemd/user/headroom-proxy.service` を作成・保守したり、provider ごとの systemd unit を有効化したり、`headroom proxy --port 8787` を手動実行したり、reconciler を起動手順にしたりしてはいけない。これらは廃止済みの手動・移行経路であり、推奨ライフサイクルではない。wrap は route state を `models.yml` に永続化するため、プロセス終了だけでは復元されない。セッション後は明示的に `headroom unwrap omp` を実行する（デフォルトは wrapper 管理の route state を削除してローカルプロキシを停止）。プロキシを意図的に残す場合だけ `--no-stop-proxy` を使う。

以下の永続化モデルは、route intent と派生状態の過去の背景を説明するためのものである。

```text
OMP named profile
    │
    ├─ config.yml / models.yml        ユーザー設定と override 層
    ├─ agent.db                       profile 固有の認証・セッション状態
    └─ models.db                      再生成可能な runtime model_cache
                  ▲
                  │ 旧移行時だけの reconciler
                  │
$HOME/.config/omp/headroom-routes.json 外部ルート宣言
                  │
                  ▼
Headroom ローカルプロキシ              headroom wrap omp がライフサイクルを管理
```

wrapped セッションが active プロキシのライフサイクルを所有するが、プロセス終了時に route state を自動消去するわけではない。宣言ファイルと `models.db` はルート／設定の成果物であり、毎回 SQLite を手動編集したりユーザーサービスを常駐させたりする指示ではない。終了時は明示的に `headroom unwrap omp` を実行すること。

## 1. 誤解しやすい前提を修正する

`models.yml`、`models.db`、`config.yml` は同じ種類の設定ではない。

- `config.yml` は `modelRoles`、retry、tools など OMP のユーザー動作を保存する。
- `models.yml` は静的な provider/model override 層である。
- `models.db` は discovery と merge の結果である runtime `model_cache` を保存し、provider row が authoritative として記録される場合がある。

今回使用した OMP では、すでに存在する authoritative な `model_cache` row が `models.yml` の provider override によって確実に置き換わるわけではなかった。したがって、`models.yml` に新しい `baseUrl` を書いても、現在選択されている provider が必ずその URL を使うとは限らない。

永続化の設計は「`models.yml` を編集する」または「`models.db` を手で patch する」ことを日常起動にするのではなく、次のようにする。

1. named profile で OMP の設定、認証、session を分離する。
2. 必要に応じて OMP のインストール領域外に Headroom のルート意図を JSON で保存する。
3. `models.db` を派生状態として扱う。
4. reconciler は旧移行時だけの復旧ツールと明記し、通常の `headroom wrap omp` 起動経路にはしない。

## 2. named profile で状態を分離する

profile は専用の agent directory を持つ。

```text
~/.omp/profiles/headroom/agent/
├── config.yml
├── models.yml
├── agent.db
├── models.db
├── history.db
├── mcp.json
├── agents/
├── hooks/
├── skills/
└── managed-skills/
```

以下のコマンドは移行時の旧 profile 分離診断専用であり、現在の起動入口ではない。現在の session は `headroom wrap omp` から開始する。

```bash
# 旧移行/profile 診断のみ。通常の起動には使わない。
OMP_PROFILE=headroom omp
```

下の固定 `omp-headroom` 入口も同じく歴史的なものであり、`headroom wrap omp` の代わりにしてはいけない。

```bash
# 旧移行/profile 診断のみ。通常の起動には使わない。
omp-headroom
```

これにより、default profile の更新、credential の変更、session history が Headroom 用 profile と混ざらない。`agent.db` には OAuth/API credential が含まれる可能性があるため、Git に commit したり、記事やログへコピーしたりしてはいけない。

## 3. ルート意図を OMP の外部に保存する

宣言ファイルは OMP のインストール領域外に置く。

```text
~/.config/omp/headroom-routes.json
```

ここには provider、protocol、loopback address、Headroom が必要とする routing header だけを記述し、credential は保存しない。検証済みの形は次のとおりである。

```json
{
  "schemaVersion": 1,
  "providers": [
    {
      "providerId": "openai-codex",
      "matchApis": ["openai-codex-responses"],
      "baseUrl": "http://127.0.0.1:8787/v1",
      "setHeaders": {},
      "removeHeaders": [
        "x-headroom-base-url",
        "x-headroom-original-path"
      ],
      "minimumMatches": 1
    },
    {
      "providerId": "opencode-go:models-v1:23ukgspsm4tal",
      "matchApis": ["openai-completions"],
      "baseUrl": "http://127.0.0.1:8787/v1",
      "setHeaders": {
        "x-headroom-base-url": "https://opencode.ai/zen/go/v1",
        "x-headroom-original-path": "/chat/completions"
      },
      "removeHeaders": [],
      "minimumMatches": 1
    },
    {
      "providerId": "opencode-go:models-v1:23ukgspsm4tal",
      "matchApis": ["openai-responses"],
      "baseUrl": "http://127.0.0.1:8787/v1",
      "setHeaders": {
        "x-headroom-base-url": "https://opencode.ai/zen/go/v1",
        "x-headroom-original-path": "/responses"
      },
      "removeHeaders": [],
      "minimumMatches": 1
    },
    {
      "providerId": "opencode-go:models-v1:23ukgspsm4tal",
      "matchApis": ["anthropic-messages"],
      "baseUrl": "http://127.0.0.1:8787",
      "setHeaders": {
        "x-headroom-base-url": "https://opencode.ai/zen/go"
      },
      "removeHeaders": ["x-headroom-original-path"],
      "minimumMatches": 1
    }
  ]
}
```

これは OMP catalog ではなく宣言層である。provider/protocol ごとにどの local entry point を使い、どの upstream 情報を request に載せるかを明確にする。

## 4. 旧 reconciler：移行時だけ、非推奨

以下の reconciler は旧永続化設計の歴史的な証拠として残している。日常の起動には使わず、現在の OMP session では `headroom wrap omp` を使う。

```text
~/.local/bin/omp-headroom-reconcile
```


処理順序は次のとおりである。

```text
BEGIN IMMEDIATE
→ 外部ルート宣言を読む
→ 現在の models.db を backup
→ provider_id + api で model_cache を match
→ 必須 row がなければ fail-loud
→ 宣言された baseUrl/header だけを更新
→ catalog metadata、fingerprint、version を保持
→ authoritative=1 を設定
→ COMMIT
```

境界を曖昧にしてはいけない。

- model を削除しない。
- `model_cache` 全体を再構築しない。
- OMP が生成していない provider/model row を勝手に INSERT しない。
- 現在の cache version を上書きしない。
- ルート宣言を二つ目の static catalog にしない。
- 繰り返し実行した場合は `changed=false` になるべきである。

今回の検証では、reconciler が既存の cache version を保持し、該当 row の `authoritative=1` も維持することを確認した。検証していない固定値をデータベースへ強制的に書き戻すより安全な方法である。

## 5. 旧 update wrapper：移行時だけ、非推奨

この節のコマンドは、旧 update 後復元フローを説明するものにすぎない。`omp-headroom update` を OMP の通常起動に使ったり、reconciler を起動時に実行したりしてはいけない。現在の session では公式 wrapper を使う。

```bash
uv tool install --python 3.13 "headroom-ai[all]"
headroom wrap omp
```

wrapped session の実行中に、別ターミナルで検証する。

```bash
headroom doctor
headroom perf
headroom dashboard
```

過去の通常コマンドは次のとおりだった。

```bash
omp update
```

これは外部 Headroom 宣言を `models.db` に復元する保証がなく、旧固定入口は次のものだった。

```bash
omp-headroom update
```

旧フロー：

```text
OMP_PROFILE=headroom omp update
→ profile の agent directory を検証
→ omp-headroom-reconcile を実行
→ 最終的な provider/cache 状態を表示
```

この wrapper は移行の説明のためだけに残す。token、API key、完全な provider catalog を wrapper に複製してはいけない。


## 6. 旧 systemd service：推奨ライフサイクルには含めない

旧 user service `~/.config/systemd/user/headroom-proxy.service` と provider ごとの variant は廃止済みである。`headroom wrap omp` には不要であり、通常は作成・有効化・再起動・保守してはいけない。

推奨ライフサイクルでは `headroom wrap omp` が現在の session のローカルプロキシを管理する。OMP は provider と protocol を選択し、route declaration は任意の設定意図、`models.db` は派生 runtime state として扱う。日常の起動に常駐 systemd process は必要ない。

## 7. 検証で得られた証拠（旧 reconciler の証拠）



### 7.1 profile と cache

profile の設定と credential database の存在を確認した後、reconciler の check は次を報告した。

```text
declared API routes matched
authoritative=1
changed=false
```

### 7.2 OMP update による書き換えのシミュレーション

一時 database で upstream URL を direct に戻し、Headroom header を削除し、`authoritative` を `0` に変更した。その後 reconciler を実行すると次の結果になった。

```text
reconcile_rc=0
backup_created=true
declared routes restored
authoritative=1
cache_version=preserved
```

これは、復元が現在の database だけに対する一回限りの patch ではなく、update 後に再実行できる処理であることを示す。

### 7.3 歴史的な Codex WebSocket request（明示的な custom route）

以下の証拠は旧移行構成のものであり、通常の `headroom wrap omp` の結果ではない。固定 profile と、明示的に設定した Codex custom provider route で取得した。

```text
PERSISTED-OK
```

Headroom のログにも次が記録された。

```text
route=chatgpt_subscription
connecting to wss://chatgpt.com/backend-api/codex/responses
last_upstream_type=response.completed
```

この歴史的な request は loopback proxy と Codex subscription WebSocket upstream に到達した。現在の `openai-codex` role はデフォルトで直接接続であり、明示的な custom provider 設定で Headroom 経由にした場合だけこの検証を再実行する。

### 7.4 歴史的な OpenCode Go HTTP request（明示的な custom route）

この旧移行証拠では、同じ profile に明示的な OpenCode Go custom provider route を設定した。

```text
PERSISTED-OK
```

最終 upstream は次のとおりである。

```text
path=https://opencode.ai/zen/go/v1/chat/completions
status=200
```

現在の `opencode-go` role はデフォルトで直接接続である。通常の `headroom wrap omp` が自動的に Headroom route に変えるわけではない。明示的な custom provider 設定を追加した場合だけ `proxy.log` で検証する。

### 7.5 proxy 通過と compression savings を混同しない

短い request は Headroom を通過していても、圧縮できる内容が少なく savings が発生しない場合がある。検証では次の層を分けて確認する。

1. OMP の loopback `baseUrl`。
2. Headroom の inbound/outbound log。
3. 最終 upstream URL または WebSocket。
4. `/stats` の compression 統計。

`127.0.0.1:8787` や HTTP 200 だけでは upstream route の正しさを証明できない。savings が 0 であることだけでも、Headroom を bypass したとは言えない。
## 8. セキュリティ、backup、rollback の境界（旧移行コンテキスト）

- `agent.db`、OAuth token、API key、session file は local profile にだけ置く。
- 外部ルート宣言の mode は `600` にする。
- 使用可能な credential を systemd unit に書かない。
- reconciler が書き込む前に backup を作る。
- transaction を使い、失敗時に中途半端な header を残さない。
- 必須 row がなければ推測して補完せず、停止して報告する。
- rollback は reconciler の backup と前回の宣言を戻して行い、`models.db` 全体を直接削除しない。
- すでに起動している OMP process は古い in-memory 設定を保持する場合があるため、新しい session は `headroom wrap omp` を使う。
通常の起動には公式 wrapper だけを使う。

```bash
uv tool install --python 3.13 "headroom-ai[all]"
headroom wrap omp
```

wrapped session の実行中に、別ターミナルで確認する。

```bash
headroom doctor
headroom perf
headroom dashboard
```

route を検証するときは、active wrapper が管理する組み込み `anthropic` route、または明示的に設定した custom-provider route を使う selector に限って、実際の OMP selector を実行し、`~/.headroom/logs/proxy.log` または最終 upstream URL/WebSocket を確認する。通常の wrap は `openai-codex`、`opencode-go`、Zhipu、Kimi、MiniMax、Codex を自動的に proxy 経由にしない。前二者はデフォルトで直接接続、後四者は歴史的/条件付き route である。直接接続の role は別途その直接 upstream を確認する。loopback URL や HTTP 200 だけでは意図した provider への到達を証明できない。終了時は明示的に `headroom unwrap omp` を実行すること（デフォルトはローカルプロキシを停止、`--no-stop-proxy` は意図的に残す場合だけ使用）。


核心となる原則は一つである。**OMP update が上書きできない場所に route intent を置き、`models.db` は派生状態として扱い、`headroom wrap omp` にローカルプロキシのライフサイクルを管理させる。**
