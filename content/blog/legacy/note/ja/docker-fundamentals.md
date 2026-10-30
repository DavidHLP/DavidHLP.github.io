---
{
  "archiveId": "X-1113",
  "title": "Docker 基礎：イメージレイヤー、コンテナ操作と Compose ネットワーク",
  "en": "ENGINEERING NOTES",
  "category": "工程研究",
  "department": "工程笔记",
  "date": "2026-08-20",
  "lead": "DavidHLPL",
  "clearance": "DRAFT",
  "abstract": "Docker のイメージレイヤー、常用コマンド、ボリューム、ネットワークと Compose の適用条件と境界を整理。",
  "findings": [
    "Original document: src/content/note/ja/docker-fundamentals.md",
    "Source revision: f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "Evidence status: active"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/note/ja/docker-fundamentals.md",
  "pubDate": "2026-08-20T16:00:00.000Z",
  "tags": [
    "Docker",
    "Container",
    "Compose",
    "Image",
    "Volume",
    "Network",
    "ja",
    "note"
  ],
  "draft": true,
  "lang": "ja",
  "legacy": {
    "path": "src/content/note/ja/docker-fundamentals.md",
    "revision": "f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "metadata": {
      "title": "Docker 基礎：イメージレイヤー、コンテナ操作と Compose ネットワーク",
      "timestamp": "2026-08-21 00:00:00+08:00",
      "series": "システム運用とインフラ",
      "kind": "concept",
      "status": "active",
      "draft": true,
      "sources": [
        "ingest-docker-fundamentals"
      ],
      "related": [
        "containerd-tls-troubleshooting",
        "multi-service-readiness",
        "intranet-penetration-ssh-guide"
      ],
      "tags": [
        "Docker",
        "Container",
        "Compose",
        "Image",
        "Volume",
        "Network"
      ],
      "description": "Docker のイメージレイヤー、常用コマンド、ボリューム、ネットワークと Compose の適用条件と境界を整理。",
      "toc": true
    }
  }
}
---


`Docker` は 2 つのリポジトリの 7 つのノートで操作チェックリストとして登場します：Dockerfile、レイヤー、ボリューム、ネットワーク、Compose。本ページはチェックリストを最小の実用モデルに圧縮し、`volume` と `bind`、`bridge` と `host`、そして Compose の価値を明確化し、イメージの丸写しはしません。

## 核心メカニズム

### 1. イメージレイヤーはキャッシュと再利用の単位

| 概念             | 役割                                  | 境界                                         |
| ---------------- | ------------------------------------- | -------------------------------------------- |
| Base Image       | 共有される読み取り専用レイヤー        | 可変データをイメージレイヤーに書き込まない   |
| Layer            | Dockerfile の 1 命令につき 1 レイヤー | 小さなレイヤーが多すぎるとメタデータが増える |
| ビルドキャッシュ | ヒットすれば再ビルドをスキップ        | `COPY` の順序がヒット率に影響                |

出典ノート `Layer和BaseImage概念.md` は `docker history` でレイヤーを示し、`Dockerfile基础.md` は `FROM/RUN/COPY` のレイヤー効果を説明します。実務では不変の依存関係を前に、可変のソースコードを後に置くとキャッシュが効きます。

### 2. コンテナ操作とデータライフサイクル

- `docker run/stop/start/rm/rmi` はコンテナとイメージのライフサイクルを管理します；出典 `Docker常见命令.md` は `save/load/push/pull` を列挙します。
- ボリューム：`volume` は Docker が管理し、コンテナ間で共有しやすくバックアップも容易；`bind mount` はホストパスを直接マッピングし、開発のホットリロードに適しますがホストに強く結合します。
- 選択：永続的で移植性が必要なら `volume`、ホストファイルを直接編集したいなら `bind`；データベースファイルを一時ディレクトリに bind しないでください。

### 3. ネットワークと Compose オーケストレーション

- `容器网络连接.md` は `bridge`（デフォルトの分離）、`host`（ホストネットワークを共有）、`none`、カスタムネットワークを区別します；カスタムネットワークはコンテナ名 DNS をサポートします。
- `DockerCompose.md` は `docker-compose.yml` で `service/network/volume` を宣言し、`up/down/ps/logs/build/pull` で単一ホストの複数コンテナをカバーします。Compose は開発/テストと小規模本番に適し、K8s のスケジューリングやヘルスチェックの代替ではありません。

## 適用条件

- 単一ホストまたは小クラスタで K8s に依存せず宣言的なオーケストレーションが必要。
- イメージはレイヤーキャッシュ可能で、ランタイムデータは `volume` で永続化が必要。
- コンテナ間で DNS 到達可能なカスタムネットワークが必要。

## 不適用とリスク

- マルチホストスケジューリング、ローリング更新、ヘルスゲートは Compose を超えるオーケストレーター（例：K8s）を検討すべきです；`multi-service-readiness` で `readiness` とランタイムの違いを明確にしています。
- `docker commit` で実行中コンテナをイメージ化すると Dockerfile の追跡性が失われます；再ビルドを優先してください。
- bind マウントはホストパスを露出します；本番では権限と SELinux/AppArmor を評価してください。

## 最小検証

1. `docker build` 後に `docker history` でレイヤー数とキャッシュヒットを確認。
2. `volume` と `bind` でそれぞれマウントし、再起動してデータ永続化を検証。
3. `docker-compose config` を検証し、`up -d` 後に `ps` と `logs` で到達性を確認。

## 証拠と不確実性

- **出典事実**：`ingest-docker-fundamentals` はコマンド、ボリューム、ネットワークに関する 7 つの出典ノートを verbatim で収録。
- **本ページの統合**：チェックリストをレイヤー—データ—ネットワークのモデルに圧縮し、`volume`/`bind` の選択基準を示しました。
- **未確認**：イメージサイズ、ビルド時間、ネットワーク性能は未測定；Compose の `version` フィールドは現行で任意であり、出典のバージョン差は網羅的に検証していません。

## 関連ページ

- [containerd-tls-troubleshooting](/blog/legacy/note/zh-cn/containerd-tls-troubleshooting/)
- [multi-service-readiness](/blog/legacy/note/zh-cn/multi-service-readiness/)
- [intranet-penetration-ssh-guide](/blog/legacy/note/zh-cn/intranet-penetration-ssh-guide/)


## Sources and related documents

- [Docker 基础与容器化：镜像分层、数据卷、网络与 Compose 快照](/blog/legacy/raw/zh-cn/ingest-docker-fundamentals/)
- [containerd TLS：信頼チェーンと一時的な検証スキップの判断](/blog/legacy/note/zh-cn/containerd-tls-troubleshooting/)
- [マルチサービス起動レディネス：running、ready と依存/失敗/再起動の伝播](/blog/legacy/note/zh-cn/multi-service-readiness/)
- [SSH 内網アクセス：接続方向・公開面・障害復旧](/blog/legacy/note/zh-cn/intranet-penetration-ssh-guide/)
