---
title: "SSH 内網アクセス：接続方向・公開面・障害復旧"
timestamp: 2026-08-01 00:00:00+08:00
series: "システム運用とインフラストラクチャ"
kind: concept
status: active
draft: true
sources: ["legacy-intranet-penetration-ssh-guide"]
related: ["containerd-tls-troubleshooting", "mysql-performance-troubleshooting"]
tags: [Intranet Penetration, Cloudflare, Tailscale, FRP, SSH, Termius, systemd, DevOps]
description: "Cloudflare Tunnel、Tailscale、FRP を接続方向・公開面・コントロールプレーン・データプレーン・復旧の 5 軸で比較し、モバイルクライアント、ポート、systemd/linger の根拠付き境界を整理する。"
toc: true
---

本ページは、内網の Linux サーバーに直接到達できるパブリックアドレスがないとき、クライアント能力、コントロールプレーンの到達性、公開面で SSH 方式を選ぶための判断を示す。チュートリアルを増やすのではなく、Cloudflare Tunnel、Tailscale、FRP の接続方向と障害ドメインを分け、ログアウト後も FRP クライアントを復旧させる条件を明確にする。

## コアメカニズム

### 1. 5 つの比較軸

| 軸                   | Cloudflare Tunnel                                                                                             | Tailscale / WireGuard                                                                                   | FRP                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 接続方向             | 内網の `cloudflared` が Cloudflare Edge へアウトバウンド WebSocket/TLS 接続を開き、外部はまず Edge に到達する | デバイスが仮想ネットワークに参加し、データプレーンは UDP/WireGuard を使い、必要に応じて DERP に依存する | パブリック `frps` がポートを listen し、内網の `frpc` が長時間接続を維持して `127.0.0.1:22` へ転送する              |
| 公開面               | 独自 CNAME/Hostname が入口になる                                                                              | デバイスに `100.x.x.x` の仮想アドレスを割り当て、クライアントはネットワークに参加する                   | パブリックアドレス/ドメインと `remotePort` が入口になり、通常の SSH クライアントがマッピングポートへ接続する        |
| コントロールプレーン | Cloudflare Zero Trust/Access と Edge サービス                                                                 | `controlplane.tailscale.com`、ログイン状態、DERP の到達性                                               | `frpc` の認証と `frps` への長時間接続。設定例には `auth.token` がある                                               |
| データプレーン       | `cloudflared access ssh` を通って SSH をプロキシする                                                          | WireGuard/UDP の仮想リンク                                                                              | 内部 SSH ポートへの TCP マッピング                                                                                  |
| 復旧                 | `cloudflared` を実行できるデスクトップとサービスアカウント条件に依存                                          | まずコントロールプレーンを復旧する。HTTP プロキシは UDP データプレーンの代わりにならない                | systemd のユーザーサービスがクライアントを再起動し、linger がログアウト後もユーザーサービスのインスタンスを保持する |

### 2. 3 方式の適用境界

| 方式              | 適する条件                                                                                      | 明確な制限                                                                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cloudflare Tunnel | macOS/Linux/Windows のデスクトップで標準 SSH が `ProxyCommand` を実行でき、独自ドメインを使える | モバイル Termius はサンドボックス内で `cloudflared` を spawn できない。raw にある Zero Trust/Access の決済条件は現在のポリシーで再確認する。         |
| Tailscale         | Tailscale を導入でき、システム VPN 権限を取得でき、コントロールプレーン/DERP に到達できる       | コントロールプレーン遮断時は `sudo tailscale up` がハングすることがある。単純な `HTTP_PROXY` は必要な UDP/WireGuard トラフィックをプロキシできない。 |
| FRP               | モバイル Termius にドメインとポートだけを入力し、パブリック中継ノードを利用できる               | パブリック入口は `serverAddr + remotePort`。標準のオープンソース `frpc` とカスタムクライアントの起動フラグを混用しない。                             |

### 3. 最小設定と 2 つの意味上の落とし穴

raw にあるデスクトップ Cloudflare の入口は次のとおり。

```sshconfig
Host ssh.yourdomain.com
    ProxyCommand cloudflared access ssh --hostname %h
    StrictHostKeyChecking accept-new
```

FRP v0.60+ の raw 例は TOML を使う。ここではデータプレーンに必要な事実だけを残す。

```toml
serverAddr = "frp.example.com"
serverPort = 8088
auth.token = "<YOUR_AUTH_TOKEN>"

[[proxies]]
type = "tcp"
localIP = "127.0.0.1"
localPort = 22
remotePort = <REMOTE_PORT>
```

- 一部のカスタムクライアントは `-f <token>:<id>` を受け付けるが、raw では標準オープンソース `frpc`（例 v0.61.0）が `-f` を未知の shorthand flag として扱う。`/path/to/frpc -c ~/frpc.toml` を使い、先に `verify -c` を実行する。
- `ssh user@frp.example.com` は通常、マッピングポートではなく中継サーバーの 22 番へ接続する。`ssh -p <REMOTE_PORT> user@frp.example.com` を使わないと、トンネル障害と中継機への未許可ログインが同じように見える。

### 4. systemd と linger は別々の復旧条件

端末で `frpc` を手動実行すると、切断やログアウト時に `SIGHUP`/`SIGKILL` が送られる可能性がある。raw はユーザーサービスを推奨する。

```ini
[Service]
Type=simple
ExecStart=/path/to/frpc -c /home/<your-username>/frpc.toml
Restart=always
RestartSec=5s
```

```bash
systemctl --user daemon-reload
systemctl --user enable --now frpc.service
systemctl --user status frpc.service
loginctl enable-linger $USER
loginctl show-user $USER | grep Linger
```

`Restart=always` は終了後の再起動を担い、`enable-linger` は SSH セッションを離れた後も `user@UID.service` インスタンスを保持する。どちらも相手の代わりにはならない。

## 適用条件

1. モバイルクライアントが標準 SSH の項目しか提供しない場合、FRP の `Host/Address + remotePort + Username` が raw にある最も直接的な形である。
2. デスクトップが外部バイナリを実行でき、Cloudflare のコントロールプレーン条件が満たされるなら、Tunnel は `ProxyCommand` に転送の詳細を隠せる。
3. Tailscale はコントロールプレーンと DERP が到達可能で、クライアントが VPN 権限を得られるネットワークに適する。HTTP プロキシ設定だけでは WireGuard データ通信を証明しない。
4. FRP は固定のパブリックドメインと明示的なマッピングポートに適する。`frps`、`frpc`、リモートポート、token が同じデプロイメントを表す必要がある。
5. 長期常駐では `~/.config/systemd/user/frpc.service` に unit を置き、ユーザーサービス状態と linger の両方を確認する。

## 適用外とリスク

- Cloudflare のモバイル制限はクライアントのサンドボックス境界であり、SSH 鍵やリモートポートの問題ではない。Termius は `ProxyCommand` 中の `cloudflared` を実行できない。
- Cloudflare Zero Trust の決済要件は raw にある時点の記録であり、変わる可能性がある。恒久的な製品契約とは見なさない。
- `log.tailscale.com` や `controlplane.tailscale.com` のタイムアウトはコントロールプレーンの問題だけを示し、内網ホストや SSH デーモンの故障を単独では証明しない。
- パブリック FRP の `remotePort` は公開面である。本ページが確認するのはポートマッピングと token 設定だけで、アクセス制御、監査、中継事業者のセキュリティ方針は推定しない。
- `-f` の構文からバイナリのバージョンを推測せず、SSH の `-p` も省略しない。フラグ競合やポート誤りは認証エラーを誤って見せる。
- `/path/to/frpc`、設定ファイル権限、ネットワークサービスの可用性はデプロイ環境固有である。linger は FRP コントロールプレーン到達性を保証しない。

## 最小検証

障害ドメインごとに最小の証拠を集める。

```bash
# Tailscale コントロールプレーン
journalctl -u tailscaled -n 30

# FRP 設定とプロセス
/path/to/frpc verify -c ~/frpc.toml
/path/to/frpc -c ~/frpc.toml

# データプレーンのポート
ssh -p <REMOTE_PORT> <your-username>@frp.example.com
```

永続化を有効にした後は次を観測する。

```bash
systemctl --user status frpc.service
loginctl show-user $USER | grep Linger
```

- デスクトップの Cloudflare 経路では `ssh <your-username>@ssh.yourdomain.com` が設定済みの `ProxyCommand` を使えるはずだが、モバイル Termius にはその実行条件がない。
- FRP 設定の検証成功はパブリックポートの到達性を証明しない。SSH コマンドでは割り当てられた `remotePort` を使う必要がある。
- `Active: active (running)` と `Linger=yes` はそれぞれユーザーサービスの稼働とログアウト後の保持を示すだけで、SSH 認証やコントロールプレーンの健全性は示さない。

## 証拠と不確実性

- **出典事実**：`legacy-intranet-penetration-ssh-guide` は Cloudflare のアウトバウンド WebSocket/TLS とデスクトップ `ProxyCommand`、Termius のサンドボックス制限、記録された Zero Trust 決済条件、Tailscale のコントロールプレーン/DERP タイムアウト、FRP v0.60+ TOML と v0.61.0 のフラグ差、`remotePort` の意味、systemd/linger コマンドを記録している。
- **本ページの統合**：これらを接続方向、公開面、コントロールプレーン、データプレーン、復旧の 5 軸で並べ、`Restart=always` と linger に別々の責務を割り当てた。
- **未確認**：現在の Cloudflare/Tailscale コントロールプレーン到達性、事業者ポリシー、実際の FRP ACL/監査動作、正確なバイナリバージョン、ファイアウォール、SSH 認証方針は raw だけでは確定しない。

## 関連ページ

- [containerd TLS 信頼チェーン](/note/containerd-tls-troubleshooting)
- [MySQL パフォーマンス問題モデル](/note/mysql-performance-troubleshooting)
