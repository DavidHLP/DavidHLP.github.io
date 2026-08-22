---
title: "Testcontainers 1.20.6：Docker API バージョンを先に切り分けてから、daemon の利用不可を判断する"
timestamp: 2026-08-13 00:00:00+08:00
series: "Java セキュリティ・並行処理とテスト"
kind: concept
status: active
draft: true
sources: ["testcontainers-docker-api-negotiation", "testcontainers-docker-api-negotiation-correction"]
related: ["containerd-tls-troubleshooting", "multi-service-readiness"]
tags: ["Testcontainers", "Docker", "docker-java", "API-Version", "Moby", "Diagnostics"]
description: "Testcontainers 1.20.6 が未知の Docker API バージョンを 1.32 にフォールバックする仕組み、DOCKER_API_VERSION に Docker CLI の経験を当てはめるべきでない理由、そして最も早い 400 エラーからバージョン非互換と Docker 環境の欠落を区別する方法を説明する。"
toc: true
---

**結論優先**：Testcontainers Java `1.20.6` は未知の Docker API バージョンを `1.32` にフォールバックし、先に daemon の最新バージョンへ動的ネゴシエーションはしない。`Could not find a valid Docker environment` に出会ったら、まず最も早い `/v1.32/info` リクエストと HTTP 400 を確認する。daemon が稼働しているからといって API バージョン非互換を除外してはならない。

## バージョン境界

| コンポーネント      | 固定範囲                    |
| ------------------- | --------------------------- |
| Testcontainers Java | `1.20.6`、commit `cc1c13af` |
| docker-java         | BOM `3.4.1`                 |
| 対照 daemon         | Moby `v27.5.1`              |

本ページはこの固定ソース群だけに責任を持つ。Testcontainers 2.x の API バージョン実装を 1.20.6 へ直接遡って適用することはできない。

## 1. 1.20.6 の既定リクエストバージョン

`DockerClientProviderStrategy.getClientForConfig` では、docker-java の設定解析後、API バージョンが `UNKNOWN_VERSION` なら Testcontainers が直接こう設定する：

```java
withApiVersion(RemoteApiVersion.VERSION_1_32)
```

`UNKNOWN_VERSION` には未設定、空値、解析不能な値を含む。したがって既定経路は：

```text
設定解析
  -> UNKNOWN_VERSION
  -> 1.32 に固定
  -> 最初の strategy 探査リクエスト /v1.32/info
```

これは「daemon に最新バージョンを尋ねて選択する」ことではない。daemon の `/version` が返す `ApiVersion` は能力報告であり、`1.47` の場合もある。クライアントのリクエストが `1.47` に切り替わったことを意味しない。

## 2. 設定キーに Docker CLI の経験を当てはめない

docker-java `3.4.1` の固定ソースでは、読み取られる設定キーは `api.version` で、システムプロパティが優先される：

```bash
mvn test -Dapi.version=1.32
```

現在のソース監査では `DOCKER_API_VERSION` の使用箇所は見つかっていない。それは Docker CLI や他のクライアントの設定慣習かもしれないが、そのことから Testcontainers 1.20.6 に影響すると断定してはならない。

排他の混乱を避けるため、まず一つの情報源に固定する：

1. `-Dapi.version=1.32` をベースラインにする；
2. 実際のリクエスト経路と Testcontainers ログを観測する；
3. そのうえで環境変数だけを変えて、本当にリクエストが変わるか確認する；
4. Docker context、socket、API バージョン変数を同時に混ぜない。

## 3. daemon の min/default バージョン検査

Moby `v27.5.1` を例にすると、VersionMiddleware は以下を拒否する：

- 最小 API バージョン未満のリクエスト。`client version X is too old` を返す；
- daemon の既定 API バージョンより高いリクエスト。`client version X is too new` を返す。

この固定バージョンの既定境界は最小 `1.24`、既定/最大 `1.47`。最小値は `DOCKER_MIN_API_VERSION` でも上書きできる。他の daemon バージョンではそのソースや `/version` レスポンスを読み直さなければならず、全環境にハードコードしてはならない。

## 4. なぜ最終的に「Docker 環境が見つからない」になるのか

Testcontainers の provider strategy はまず `infoCmd().exec()` を実行する。`/v1.32/info` がバージョン互換性で失敗すると、現在の戦略は失敗として記録される。すべての戦略が失敗して初めて、外側が例外を投げる：

```text
Could not find a valid Docker environment. Please see logs and check configuration
```

診断の順序はこうすべき：

1. ログで最も早い HTTP リクエストとステータスコードを探す；
2. 経路が `/v1.32/...` か明示バージョンかを判断する；
3. 400 なら too old/too new のサーバー本文を読む；
4. そのうえで socket、TLS、権限、context を確認する；
5. 最後に provider strategy を変える。

## 最小検証マトリクス

隔離プロジェクトで同じ最小 Testcontainers テストを実行し、入力は一度に一つだけ変える：

| 入力                          | 期待                                                        |
| ----------------------------- | ----------------------------------------------------------- |
| `api.version` を設定しない    | リクエストバージョンは `1.32`                               |
| `-Dapi.version=banana`        | unknown、静かに `1.32` へフォールバック                     |
| `-Dapi.version=1.1`           | 新しい daemon で too old を発生                             |
| `-Dapi.version=999.999`       | docker-java は解析可能；Moby v27.5.1 で too new を発生      |
| `DOCKER_API_VERSION` だけ設定 | 固定ソース監査によれば `api.version` を置き換えるべきでない |

本ページが引用するマトリクスは再現案であり、このバッチで実行済みの結果ではない。それを環境の結論として書くには、実際の daemon バージョンとログを保持しなければならない。

## よくある誤解

- **「daemon が稼働しているので Testcontainers は必ず使える。」** API transport が先に daemon に拒否されることがある。
- **「Testcontainers は自動的に daemon の最新 API を使う。」** 1.20.6 の既定の unknown fallback は `1.32` だ。
- **「`DOCKER_API_VERSION` を設定すれば docker-java を制御できる。」** 現在の固定 docker-java ソースはその環境変数を使っていない。
- **「valid Docker environment 例外を見たら socket を変える。」** 先に最も早い API 400 を調べ、根本原因を隠さない。
- **「1.24/1.47 は永遠の境界だ。」** それらは Moby `v27.5.1` の固定バージョンにだけ属する。

## 証拠の境界

初期ソーススナップショット、バージョン訂正、未検証項目はリポジトリ `src/content/raw/zh-cn/testcontainers-docker-api-negotiation.md` と `testcontainers-docker-api-negotiation-correction.md` にある。これはすべての Testcontainers や Docker バージョンへの汎用保証ではない。
