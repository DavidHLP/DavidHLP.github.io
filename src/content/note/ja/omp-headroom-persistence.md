---
title: "OMP 更新後も Headroom のルートを維持する：named profile と model_cache reconciler"
timestamp: 2026-08-06 00:00:00+08:00
series: "OMP 規則と設定体系"
tags: [OMP, Agent, Headroom, DevOps, LLM, Operations, Routing, Proxy, Codex, OpenCode]
description: "OMP の更新で runtime model cache が書き換えられる場合に、named profile、外部ルート宣言、冪等な SQLite reconciler で Headroom のルートを保持する実録。実際の Codex WebSocket と OpenCode HTTP リクエストで検証した。"
toc: true
---

# OMP 更新後も Headroom のルートを維持する：named profile と model_cache reconciler

今回の要点は、プロキシ URL をもう一度書き換えることではない。設定を **ユーザーの宣言、派生した runtime state、外部インフラ** の三層に分けることだった。これにより、OMP が更新時に自分の cache を再構築しても、Headroom は一つの loopback 入口を保ち、ルート復元を一回限りの手動 SQLite 編集に依存しなくて済む。

最終的な構成は次のとおりである。

```text
OMP named profile
    │
    ├─ config.yml / models.yml        ユーザー設定と override 層
    ├─ agent.db                       profile 固有の認証・セッション状態
    └─ models.db                      再生成可能な runtime model_cache
                  ▲
                  │ omp-headroom-reconcile
                  │
$HOME/.config/omp/headroom-routes.json 外部ルート宣言
                  │
                  ▼
127.0.0.1:8787                        Headroom loopback proxy
```

## 1. 誤解しやすい前提を修正する

`models.yml`、`models.db`、`config.yml` は同じ種類の設定ではない。

- `config.yml` は `modelRoles`、retry、tools など OMP のユーザー動作を保存する。
- `models.yml` は静的な provider/model override 層である。
- `models.db` は discovery と merge の結果である runtime `model_cache` を保存し、provider row が authoritative として記録される場合がある。

今回使用した OMP では、すでに存在する authoritative な `model_cache` row が `models.yml` の provider override によって確実に置き換わるわけではなかった。したがって、`models.yml` に新しい `baseUrl` を書いても、現在選択されている provider が必ずその URL を使うとは限らない。

永続化の設計は「`models.yml` を編集する」または「`models.db` を手で patch する」ではなく、次のようにする。

1. named profile で OMP の設定、認証、session を分離する。
2. OMP のインストール領域外に Headroom のルート意図を JSON で保存する。
3. `models.db` を派生状態として扱う。
4. OMP 更新後に宣言から runtime route を reconcile する。

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

明示的に profile を選択する。

```bash
OMP_PROFILE=headroom omp
```

または固定入口を使う。

```bash
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

## 4. 宣言された runtime row だけを reconcile する

reconciler の入口は次のとおりである。

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

## 5. update wrapper に復元処理を組み込む

通常のコマンド：

```bash
omp update
```

は OMP 自体を更新するが、外部 Headroom 宣言を `models.db` に復元する保証はない。そのため固定入口を用意する。

```bash
omp-headroom update
```

処理の流れは次のとおりである。

```text
OMP_PROFILE=headroom omp update
→ profile の agent directory を検証
→ omp-headroom-reconcile を実行
→ 最終的な provider/cache 状態を表示
```

通常の wrapper は薄く保てる。

```bash
#!/usr/bin/env bash
set -euo pipefail

export OMP_PROFILE=headroom
exec "$HOME/.local/bin/omp" "$@"
```

update wrapper は `update` という特別な操作だけを更新用スクリプトへ渡し、それ以外の引数は固定 profile の OMP へそのまま転送する。token、API key、完全な provider catalog を wrapper に複製してはいけない。

## 6. Headroom の systemd service を OMP から分離する

user service は次に置く。

```text
~/.config/systemd/user/headroom-proxy.service
```

listen するのは次だけである。

```text
127.0.0.1:8787
```

service file は OMP のインストール領域に置かず、provider credential も含めない。責務を次のように分ける。

- OMP は provider と protocol を選択する。
- `models.db` は再生成可能な runtime result を保存する。
- 外部宣言は永続的な route intent を保存する。
- Headroom は protocol forwarding、compression、cache を担当する。
- systemd は Headroom process の lifecycle を担当する。

この分離により、OMP update が systemd unit を上書きすることも、Headroom の再起動が OMP の credential database を変更することもない。

## 7. 検証で得られた証拠

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

### 7.3 Codex の実 WebSocket request

固定 profile を通して最小 request を送ると、次の結果になった。

```text
PERSISTED-OK
```

Headroom のログにも次が記録された。

```text
route=chatgpt_subscription
connecting to wss://chatgpt.com/backend-api/codex/responses
last_upstream_type=response.completed
```

つまり request は loopback proxy に到達しただけでなく、Codex subscription の WebSocket upstream まで到達している。

### 7.4 OpenCode Go の実 HTTP request

同じ profile から最小 request を送ると、次の結果になった。

```text
PERSISTED-OK
```

最終 upstream は次のとおりである。

```text
path=https://opencode.ai/zen/go/v1/chat/completions
status=200
```

### 7.5 proxy 通過と compression savings を混同しない

短い request は Headroom を通過していても、圧縮できる内容が少なく savings が発生しない場合がある。検証では次の層を分けて確認する。

1. OMP の loopback `baseUrl`。
2. Headroom の inbound/outbound log。
3. 最終 upstream URL または WebSocket。
4. `/stats` の compression 統計。

`127.0.0.1:8787` や HTTP 200 だけでは upstream route の正しさを証明できない。savings が 0 であることだけでも、Headroom を bypass したとは言えない。

## 8. セキュリティ、backup、rollback の境界

- `agent.db`、OAuth token、API key、session file は local profile にだけ置く。
- 外部ルート宣言の mode は `600` にする。
- 使用可能な credential を systemd unit に書かない。
- reconciler が書き込む前に backup を作る。
- transaction を使い、失敗時に中途半端な header を残さない。
- 必須 row がなければ推測して補完せず、停止して報告する。
- rollback は reconciler の backup と前回の宣言を戻して行い、`models.db` 全体を直接削除しない。
- すでに起動している OMP process は古い in-memory 設定を保持する場合があるため、新しい session は `omp-headroom` を使う。

## 9. 今後のメンテナンス手順

```bash
# 1. 外部ルート宣言を編集
$EDITOR ~/.config/omp/headroom-routes.json

# 2. 書き込まずに確認
omp-headroom-reconcile --agent-dir "$HOME/.omp/profiles/headroom/agent" --check

# 3. OMP を更新し、ルートを自動復元
omp-headroom update

# 4. runtime cache を再確認
omp-headroom-reconcile --agent-dir "$HOME/.omp/profiles/headroom/agent" --check

# 5. 固定 profile から最小 request を送信
omp-headroom -p --no-session --no-tools --no-extensions --no-rules \
  --model openai-codex/gpt-5.6-luna \
  'Reply with exactly PERSISTED-OK.'

# 6. Headroom log と最終 upstream を同時に確認
```

核心となる原則は一つである。**OMP update が上書きできない場所に route intent を置き、`models.db` は検証、backup、再構築が可能な派生状態として扱う。**