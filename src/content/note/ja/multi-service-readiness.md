---
title: "マルチサービス起動レディネス：running、ready と依存/失敗/再起動の伝播"
timestamp: 2026-08-13 00:00:00+08:00
series: "システム運用とインフラストラクチャ"
kind: concept
status: active
draft: true
sources: ["multi-service-readiness-contract", "multi-service-readiness-contract-correction", "multi-service-readiness-safety-correction"]
related: ["mysql-performance-troubleshooting", "database-schema-drift", "testcontainers-docker-api", "dubbo-nacos-runtime", "microservice-data-ownership"]
tags: [Docker Compose, systemd, depends_on, healthcheck, Readiness, Orchestration]
description: "一つの決定表でマルチサービスオーケストレーションにおけるプロセス起動、業務レディネス、順序付け、依存確立、失敗と再起動の伝播という六つの概念を区別し、Compose の healthcheck/depends_on と systemd の After/Wants/Requires の最小組み合わせと検証経路を示す。"
toc: true
---

このページは一つの質問に答える：Compose や systemd で依存関係を宣言したとき、実際には何が保証されるのか。核心結論：オーケストレーターは宣言された condition（`service_started` / `service_healthy` / `service_completed_successfully`）に基づく起動ゲートしか適用せず、業務レディネスを自動で保証しない。順序付け、依存、失敗と再起動の伝播は直交する四つの意味論であり、分けて判断しなければならない。

## コアメカニズム

### 1. 六つの概念を区別する決定表

| 概念 | 意味 | 判定/トリガー | 重要な境界 |
| --- | --- | --- | --- |
| running（プロセス起動） | オーケストレーターはコンテナが「running」であることだけを待つ | コンテナ状態が running；ポートバインディングはこの層に属する | アプリの ready を待たない。ポートがリスンされていても ready の証拠にならない |
| ready（業務レディネス） | ユーザーが明示的に定義しなければならない | `healthcheck` が通るか、ワンショットタスクが完了する（`service_completed_successfully`、v2.20.0+） | プローブはユーザーコマンド。オーケストレーターはアプリ内状態を検証しない |
| ordering（順序付け） | 前後関係だけを決め、依存は作らない | Compose の短い構文 `depends_on: [db]`（`service_started` と同等）；systemd の `After=`/`Before=` | 短い構文は起動順序しか保証しない。`After=` は `Requires=`/`Wants=` と直交 |
| requirement（依存確立） | 「依存が満たされなければ起動しない」と宣言 | 長い構文 `condition: service_healthy`；systemd の `Requires=`/`Wants=` | `Wants=` は弱い形式で、失敗しても全体トランザクションに影響しない |
| failure propagation（失敗の伝播） | 依存が不健康なら依存側は起動しない | `up --wait` が失敗終了；`--abort-on-container-failure` で全停止；systemd の `Requires=`+`After=` | `--abort-on-container-failure` は `-d` と非互換、`--wait` とは排他 |
| restart propagation（再起動の伝播） | 明示操作で起きた再起動だけが伝播する | `depends_on.restart: true`；systemd の `Requires=` による明示 stop/restart | コンテナ実行時の自動再起動は伝播しない。systemd の予期しない失敗には `BindsTo=` が必要 |

### 2. 重要な意味論の切り分け

- **running ≠ ready**：Compose は起動時にコンテナの ready を待たず、running だけを待つ（docker/docs の固定ソース原文）。レディネスはユーザーが明示定義しなければならない：`condition: service_healthy`（`healthcheck` で健康を定義）または `service_completed_successfully`（ワンショットタスクの完了）。
- **順序 ≠ 依存（systemd）**：`After=`/`Before=` は順序依存だけを設定し、`Requires=`/`Wants=` とは直交する（v261.2 マニュアル原文 "independent and orthogonal"）。公式の一般的な書き方は同一ユニットを `After=` と `Wants=` の両方に入れる。service ユニットは「設定されたすべての起動コマンドが呼び出された（成否に関わらず、`ExecStartPost=` を含む）」時点で完了とみなされる——起動済みはサービス可能を意味しない。
- **healthcheck はユーザー定義のレディネスプローブ**：spec 原文は、コンテナが healthy かを判定する check を宣言するもので、Dockerfile の `HEALTHCHECK` と同じ働きだと述べる。プローブが何を測るかは完全にユーザーコマンドが決め、オーケストレーターは業務レベルの推論をしない。`test` は `NONE`/`CMD`/`CMD-SHELL` をサポートし、`disable: true` で無効化できる。
- **ポート占有 ≠ レディネス**：`ports` は公開マッピングを定義するだけ（HOST 未指定時は全インターフェース `0.0.0.0` にバインド）で、コンテナ内のアプリ状態には関わらない。ポートがリスンされているのは「プロセス起動」層の信号であり、ready の証拠にはならない。

### 3. 失敗の伝播と再起動の伝播

- **Compose の失敗**：spec は `service_healthy` を付けた依存が先に healthy になってから依存側を起動することを保証する。`up --wait`（暗黙の detached モード）は依存が不健康なとき失敗終了する（raw 実測：exit code 1、出力 "dependency failed start: container … is unhealthy"、app は作成のみで未起動）。`--abort-on-container-failure` はいずれかのコンテナが失敗終了したら全部を停止し、`-d` と非互換で `--wait` とは排他。
- **Compose の再起動**：`depends_on.restart: true` は「明示的な Compose 操作」（`docker compose restart` / update など）で起きた再起動だけを伝播する。コンテナ実行時レイヤーの自動再起動（`restart: always`/`on-failure`/`unless-stopped`）は `depends_on` では伝播しない。
- **systemd**：`Requires=` + `After=` の場合、依存のアクティベーション失敗で本ユニットの起動が妨げられる。`Wants=` は弱い形式で、失敗してもトランザクション全体の有効性に影響しない。`Requires=` は依存が明示 stop/restart されたときだけ連動し、予期しない失敗では伝播しない。「依存が予期せず停止したら連動停止」をカバーするには `BindsTo=` を使う。

## 最小組み合わせの例

### Compose：healthcheck + `depends_on.condition: service_healthy`

```yaml
services:
  app:
    image: alpine:3.19
    command: ["sh", "-c", "echo APP_STARTED; sleep 60"]
    depends_on:
      db:
        condition: service_healthy
        restart: true
  db:
    image: redis:7.2-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      retries: 5
      start_period: 10s
      timeout: 5s
```

選定の要点（訂正 raw の最小実験より）：固定公式イメージ、ビルド不要、資格情報不要、ポートなし。`app` は healthcheck を定義しないので、`up --wait` に対しては running で満足し、`db` の `redis-cli ping` が通った後で `app` が起動する。`healthcheck` のプローブコマンドが ready の定義を決める。別のコマンドに変えれば別のレディネス基準になる。

### systemd：`After=` と `Wants=`/`Requires=` の組み合わせ境界

```ini
[Unit]
After=db.service
Wants=db.service
```

- `After=` は順序だけを決める：db が先に起動するが、db の起動失敗は本ユニットに影響しない。
- `Wants=` を `Requires=` に変える：db のアクティベーション失敗（かつ `After=` が存在する場合）で本ユニットは起動しない。db が明示 stop/restart されると本ユニットも連動 stop/restart される。
- 境界の確認：`After=` だけなら `Requires=`/`Wants=` は空。`Requires=` だけで `After=` がなければ起動は妨げられない。予期しない失敗の伝播には `BindsTo=` が必要。

## 最小検証

まず上の匿名 fixture を専用の一時ディレクトリの `compose.yaml` に保存する。既存の開発・本番 Compose プロジェクトのディレクトリに以下のコマンドをコピーしないこと。`restart` はサービスを中断し、`--abort-on-container-failure` はその隔離 project の全コンテナを停止し、`down` はそのコンテナとネットワークを停止・削除する。

```bash
fixture="$(pwd)/compose.yaml"           # 当前目录必须只包含此匿名 fixture
project="readiness-contract-$$"         # 当前 shell 内唯一；后续命令保持一致
printf 'Copy these values to the scenario terminal: fixture=%q project=%q\n' "$fixture" "$project"

docker compose -f "$fixture" -p "$project" config -q
docker compose -f "$fixture" -p "$project" up -d --wait --wait-timeout 30
docker compose -f "$fixture" -p "$project" ps
docker inspect --format '{{json .State.Health}}' \
  "$(docker compose -f "$fixture" -p "$project" ps -q db)"
# 警告：restart は db を中断する。depends_on.restart: true のとき app も再起動する。
docker compose -f "$fixture" -p "$project" restart db
# 警告：down はこの隔離 project のコンテナとネットワークを停止・削除する。--volumes は付けないこと。
docker compose -f "$fixture" -p "$project" down
```

シナリオコマンドは同じ `fixture`/`project` を使い、メインフローと別に実行する。別ターミナルでは、最初のブロックが表示した実際の値を次の二行に入れる。Compose に現在のディレクトリから project を自動推測させてはならない：

```bash
fixture="<FIXTURE_PATH>"                # 最初のブロックが表示した fixture 値に置き換える
project="<PROJECT_NAME>"               # 最初のブロックが表示した project 値に置き換える

# イベントストリームは Ctrl-C までブロックする。別ターミナルで同じ -f/-p で up を実行する。
docker compose -f "$fixture" -p "$project" events
# 失敗ゲート：隔離 fixture 内でのみ、db の healthcheck.test を恒常 exit 1 に変更する。
docker compose -f "$fixture" -p "$project" up -d --wait --wait-timeout 8
# フォアグラウンドの失敗伝播は、いずれかのコンテナが失敗するとこの隔離 project の全コンテナを停止する。
# これは -d と非互換で、--wait とは排他。非ゼロで終了するサービスを含む別の隔離 fixture が必要。
docker compose -f "$fixture" -p "$project" up --abort-on-container-failure
```

```bash
systemctl show <unit> -p After -p Before -p Requires -p Wants   # After= 与 Requires= 是正交字段
systemd-analyze verify <unit>.service          # 单元文件校验
```

決定表に照らして検証結果を解釈する：`ps` の healthy 列はプローブが通ったことだけを証明し、業務レディネスは証明しない。`events` の `health_status` シーケンスで依存順を確認する。`systemctl show` で `After=` だけがあり `Requires=`/`Wants=` が空なら、順序だけがあって依存はない。

## オーケストレーターが代替できない部分

- **migration はオーケストレーターの責務にない**：spec で唯一の「ワンショットタスク」順序プリミティブは `condition: service_completed_successfully`（Compose v2.20.0+ と注記）で、順序付けだけを担う。移行ロジック自体はユーザーが service/コマンドとして定義しなければならない。schema 変更、データバックフィルなどの業務レディネスはオーケストレーターの責務にない。
- **業務レディネスは healthcheck の意味論にない**：キャッシュウォームアップ、整合性、業務アサーションなどのアプリ内状態をオーケストレーターは検証しない。プローブはユーザー定義の任意コマンドにすぎない。
- したがって「移行完了後に app を起動する」のような要件は、ユーザーが移行をワンショット service にし、app に `service_completed_successfully` の依存を宣言するのが正しい書き方であり、オーケストレーターの自動推論に頼るべきではない。

## 適用条件

1. 「自分のオーケストレーション宣言は何を保証するのか」を判断するときは、決定表に沿って項目ごとに照合する。特に順序と依存、失敗と再起動の伝播は混同されがちなので区別する。
2. 「healthy になってから起動」が必要なら長い構文 `condition: service_healthy` を使う。前後関係だけなら短い構文で十分（`service_started` と同等）。
3. systemd で「依存が失敗したら起動しない」が必要なら `Requires=`+`After=` を使う。予期しない失敗も連動させたい場合にだけ `BindsTo=` を導入する。

## 非適用とリスク

- 本ページはまず `multi-service-readiness-contract` に保存された compose-spec/systemd の固定点に基づく。続いて `multi-service-readiness-contract-correction` が docker/docs と Compose CLI の固定ソースとワンショット Redis/Alpine 実験を独立に補い、`multi-service-readiness-safety-correction` が `-f`/`-p` のプロジェクト隔離と `down` の削除範囲を補う。`service_completed_successfully` は Compose v2.20.0+ が必要。`restart` フィールドの v2.17.0 以前の意味論は未カバー。
- ポート占有とレディネスの分離は仕様からの導出であり、「ポートはバインド済みだがアプリは未準備」の専用実験は行っていない。`--wait` の失敗、healthy 後の起動、明示 restart の伝播は訂正 raw の最小 fixture で観測した。
- 未カバー：swarm mode での `depends_on` の挙動差、systemd の `Requisite=`/`PartOf=`/`Conflicts=` の完全な意味論。

## 証拠と不確実性

- **情報源の事実**：`multi-service-readiness-contract` は最初の Compose/systemd 仕様契約と匿名 PostgreSQL 例を保存する。`multi-service-readiness-contract-correction` は後の固定ソースとワンショット Redis/Alpine 実験を独立に保存し、`service_healthy` 起動ゲート、`--wait` 失敗終了、明示 restart の伝播を観測した。`multi-service-readiness-safety-correction` は Compose v5.4.0 の project flags と `down` の削除境界を固定する。
- **仕様からの導出**：ポート占有 ≠ レディネス。オーケストレーターはプロセス/ポートから業務状態を自動推論できない。
- **未検証項目**：「ポートはバインド済みだがアプリは未準備」の専用実機挙動は観測していない。systemd 側の `Requires=`/`BindsTo=` の伝播も実ホストで実行しておらず、v261.2 マニュアルの意味論を引用するだけに留まる。

## 関連ページ

- [MySQL 性能トラブルシューティング](/ja/note/mysql-performance-troubleshooting)
- [データベース Schema ドリフト](/ja/note/database-schema-drift)
