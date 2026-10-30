---
title: "UltiCode の検証とサプライチェーンゲート：static contract から検証可能なリリースへ"
timestamp: 2026-09-09 00:00:00+08:00
series: "アーキテクチャとエンジニアリング実践"
kind: concept
status: provisional
sources: ["ulticode-engineering-highlights-f801a1076"]
related: ["ulticode"]
tags: [UltiCode, CI, StaticCheck, IntegrationTest, Trivy, SBOM, Cosign, Provenance, LLM]
description: "zero-infra の static contract、段階的検証、Trivy、SBOM、provenance、Cosign を追跡可能な delivery gate として組み立てる UltiCode の方法。"
toc: true
---

> **証拠の状態**：この記事は UltiCode の現在の workflow、テスト文書、スクリプトが宣言する検証レイヤーを説明する。設定が存在することは、この実行または毎回の CI で成功したことを意味しない。本番の安全性、性能、リリース資格情報には実行記録が必要である。

多くのプロジェクトでは「テスト」を一つのコマンドとして扱い、リリースの安全性をイメージ作成後の手作業に委ねる。UltiCode の工学的な特徴の一つは、検証をコストと現実性で分層し、サプライチェーン要件の一部をリリースゲートへ直接組み込んでいる点にある。

## Static は全体を起動せずに契約を確認する

リポジトリは [scripts/dev/test.sh](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/scripts/dev/test.sh) に複数の入口を持つ。

```text
static       -> zero-infra contract checks
unit         -> unit tests, exclude IT/IntegrationTest
quick/full   -> progressively heavier local checks
integration  -> Testcontainers, DB/Redis, sandbox and owner migration
```

CI の static contract 入口は次である。

```bash
bash scripts/test/zero-infra-validation-contract.sh --static-only
```

文書には、この経路が Docker、データベース、サービス、Testcontainers、Maven、`pnpm install` を起動しないと明記されている。スクリプト、パス、設定、owner 移行、安全制約を素早く検査するのに適しており、DB、Redis、sandbox、サービス間の挙動を本当に必要とする部分は、より重い段階に任せる。

これは integration の代替ではなく、コストの分層である。static check は安価だが runtime の挙動を証明せず、integration test は現実に近いが本番トラフィックを証明しない。

## Backend workflow は境界をさらに展開する

[_backend.yml](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/.github/workflows/_backend.yml) は compile、unit/full/integration、coverage、owner migration、Redis ACL/TLS、lease、graceful drain、Streams、topology、sandbox などの契約ゲートも組み合わせる。重要なのは、アーキテクチャ制約を `architecture.md` の文章に留めず、失敗可能な検査にすることである。

## イメージ公開は最後のコピーではない

現在の [docker-publish.yml](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/.github/workflows/docker-publish.yml) はサービスマトリクスから GHCR イメージを構築し、次を含む。

- registry 参照の差異を減らすための小文字のイメージ名。
- Buildx の SBOM と provenance。
- HIGH/CRITICAL の OS・library 脆弱性を阻止する Trivy の exit code。
- digest によるイメージ検証。
- Cosign 署名。
- SPDX と SLSA provenance の attestation、署名、検証。
- 不変のリリースマニフェスト。

これにより、少なくとも何を構築したか、digest は何か、誰が署名したか、証明が通ったかを追跡できる。安全性の終点ではないが、「イメージを pull できる」だけより監査可能な証拠が一つ増える。

## LLM/Agent システムでさらに重要な理由

LLM システムは変化が速く、tool、model、prompt が頻繁に置き換わる。安価な static contract がなければ小さな変更のたびに完全な環境の起動を待つ必要がある。重い検証とリリース証明がなければ、モデルサービスの依存変更が気付かないまま本番へ入る。

UltiCode の分層は再利用できる。まず zero-infra で schema、権限、状態遷移、設定境界を確認し、次に integration で実際の provider、queue、sandbox を検証し、最後にリリース時点で digest、SBOM、署名証明を結び付ける。

## 過剰に解釈してはいけないこと

workflow に Trivy、Cosign、provenance の設定があることは、リポジトリがそれらのゲートを用意したことしか示さない。現在の本番イメージに脆弱性がないこと、署名資格情報が利用可能なこと、すべての job が通ったこと、システムが HA に達したことまでは証明しない。実際の結論には具体的な run、イメージ digest、デプロイ環境が必要である。

## 最小検証経路

[testing.md](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/docs/development/testing.md) と [zero-infra-validation-contract.sh](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/scripts/test/zero-infra-validation-contract.sh) を読み、続けて [_backend.yml](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/.github/workflows/_backend.yml) と [docker-publish.yml](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/.github/workflows/docker-publish.yml) を確認する。

