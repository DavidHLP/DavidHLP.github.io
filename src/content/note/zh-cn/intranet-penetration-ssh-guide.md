---
title: "SSH 内网访问方案：连接方向、暴露面与故障恢复"
timestamp: 2026-08-01 00:00:00+08:00
series: "系统运维与基础设施"
kind: concept
status: active
sources: ["legacy-intranet-penetration-ssh-guide"]
related: ["containerd-tls-troubleshooting", "mysql-performance-troubleshooting"]
tags: [Intranet Penetration, Cloudflare, Tailscale, FRP, SSH, Termius, systemd, DevOps]
description: "以连接方向、暴露面、控制平面、数据平面和故障恢复比较 Cloudflare Tunnel、Tailscale 与 FRP，并提炼移动端限制、端口语义和 systemd/linger 的可验证边界。"
toc: true
---

本页回答一个远程访问决策：内网 Linux 没有可直连公网地址时，怎样按客户端能力、控制面可达性和公网暴露面选择 SSH 方案。重点不是堆叠教程，而是区分 Cloudflare Tunnel、Tailscale、FRP 的连接方向与故障域，再确定如何让 FRP 客户端在注销后恢复。

## 核心机制

### 1. 五个比较轴

| 轴 | Cloudflare Tunnel | Tailscale / WireGuard | FRP |
| --- | --- | --- | --- |
| 连接方向 | 内网 `cloudflared` 向 Cloudflare Edge 建立出站 WebSocket/TLS；外部先到 Edge | 设备加入虚拟网，数据面使用 UDP/WireGuard，必要时依赖 DERP | 公网 `frps` 监听端口，内网 `frpc` 保持长连接，把流量转到本地 `127.0.0.1:22` |
| 暴露面 | 自定义 CNAME/Hostname 作为接入点 | 设备获得 `100.x.x.x` 虚拟地址；客户端需加入网络 | 公网域名/地址与 `remotePort` 作为接入点，标准 SSH 直接连映射端口 |
| 控制平面 | Cloudflare Zero Trust/Access 与 Edge 服务 | `controlplane.tailscale.com`、登录状态和 DERP 可达性 | `frpc` 到 `frps` 的认证与长连接；配置中使用 `auth.token` |
| 数据平面 | SSH 通过 `cloudflared access ssh` 代理进隧道 | WireGuard/UDP 虚拟链路 | TCP 映射到内网 SSH 端口 |
| 故障恢复 | 依赖桌面端能运行 `cloudflared` 和服务账户条件 | 先恢复控制面，HTTP 代理不等于 UDP 数据面可用 | 用 systemd 用户服务自动重启，用 linger 保持用户服务实例 |

### 2. 三种方案的边界

| 方案 | 适合 | 明确限制 |
| --- | --- | --- |
| Cloudflare Tunnel | 桌面 macOS/Linux/Windows，标准 SSH 可执行 `ProxyCommand`，愿意使用自定义域名 | 移动 Termius 不能在沙盒内派生 `cloudflared`；raw 记录 Zero Trust/Access 开通的绑卡门槛，具体政策需现场确认。 |
| Tailscale | 客户端可以安装 Tailscale 并获得系统 VPN 权限，且控制面/DERP 可达 | `sudo tailscale up` 可能因控制面阻断挂起；简单 `HTTP_PROXY` 不能代理所需的 UDP/WireGuard 流量。 |
| FRP | 手机 Termius 只需填写域名和端口，公网中转节点可用，接受显式端口映射 | 公网接入点就是 `serverAddr + remotePort`；标准开源 `frpc` 与定制客户端的启动参数不能混用。 |

### 3. 最小配置和两个高频语义错误

桌面端 Cloudflare 的原始 SSH 入口是：

```sshconfig
Host ssh.yourdomain.com
    ProxyCommand cloudflared access ssh --hostname %h
    StrictHostKeyChecking accept-new
```

FRP v0.60+ 的来源示例使用 TOML；关键数据面只保留本地和远端端口：

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

- 某些定制客户端支持 `-f <token>:<id>`，但 raw 记录标准开源 `frpc`（例如 v0.61.0）会把 `-f` 判为未知 shorthand flag；统一用 `/path/to/frpc -c ~/frpc.toml`，并先用 `verify -c`。
- `ssh user@frp.example.com` 默认打中转服务器的 22 端口，不是映射端口；必须使用 `ssh -p <REMOTE_PORT> user@frp.example.com`。端口漏写会把“隧道不可用”和“登录了中转机”混为一谈。

### 4. systemd 与 linger 是两个不同的恢复条件

手工运行 `frpc` 时，终端断开或用户注销会使进程收到 `SIGHUP`/`SIGKILL`。来源推荐用户服务：

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

`Restart=always` 负责服务退出后的重启；`enable-linger` 负责用户退出 SSH 会话后仍保留 `user@UID.service` 实例。两者不能互相替代。

## 适用条件

1. 移动端只支持标准 SSH 字段时，FRP 的 `Host/Address + remotePort + Username` 是来源中最直接的接入形状。
2. 桌面端能运行第三方二进制且 Cloudflare 控制面条件满足时，Tunnel 可用 `ProxyCommand` 隐藏转发细节。
3. Tailscale 适合控制面和 DERP 可达、客户端可取得 VPN 权限的网络；仅设置 HTTP 代理不能证明 WireGuard 数据面已恢复。
4. FRP 适合需要固定公网域名和显式映射端口的场景；`frps`、`frpc`、远端端口及 token 必须属于同一配置事实。
5. 需要长期驻留时，把服务文件放在 `~/.config/systemd/user/frpc.service`，并同时验证用户服务状态与 linger。

## 不适用与风险

- Cloudflare Tunnel 的移动端限制是客户端沙盒能力边界，不是 SSH 密钥或远端端口配置问题；Termius 不能执行 `ProxyCommand` 中的 `cloudflared`。
- Cloudflare Zero Trust 的支付/开通要求来自 raw 的当时记录，可能随服务政策变化；不要把它当作永久产品契约。
- Tailscale 日志中的 `log.tailscale.com` 或 `controlplane.tailscale.com` 超时只能证明控制面异常，不能单独证明内网主机或 SSH 服务故障。
- FRP 的公网 `remotePort` 是暴露面；本页只证实端口映射和 token 配置，不替环境推断访问控制、审计或节点运营方的安全策略。
- 不要用 `-f` 兼容语法猜测二进制版本，也不要省略 SSH 的 `-p`；参数冲突和端口误用会产生误导性的认证错误。
- 用户服务的 `/path/to/frpc`、配置文件权限、网络服务可用性仍需由部署环境确认；linger 不是对 FRP 控制面可达性的保证。

## 最小验证

按故障域取最小证据：

```bash
# Tailscale 控制面
journalctl -u tailscaled -n 30

# FRP 配置和进程
/path/to/frpc verify -c ~/frpc.toml
/path/to/frpc -c ~/frpc.toml

# 数据面端口
ssh -p <REMOTE_PORT> <your-username>@frp.example.com
```

持久化部署后，观察：

```bash
systemctl --user status frpc.service
loginctl show-user $USER | grep Linger
```

- Cloudflare 桌面链路应能让 `ssh <your-username>@ssh.yourdomain.com` 经过 `ProxyCommand`；移动 Termius 不具备同一执行前提。
- FRP 配置校验成功不等于公网端口可达；`ssh -p` 仍需使用分配的 `remotePort`。
- `Active: active (running)` 与 `Linger=yes` 分别证明用户服务运行和用户退出后的保活条件，不证明 SSH 认证或控制面本身健康。

## 证据与不确定性

- **来源事实**：`legacy-intranet-penetration-ssh-guide` 记录 Cloudflare 的出站 WebSocket/TLS 与桌面 `ProxyCommand`、Termius 沙盒限制、Zero Trust 绑卡记录、Tailscale 控制面/DERP 超时、FRP v0.60+ TOML/v0.61.0 参数差异、`remotePort` 语义和 systemd/linger 命令。
- **本页综合**：用连接方向、暴露面、控制平面、数据平面、恢复条件五个轴重排同一批事实，并把 `Restart=always` 与 linger 的职责拆开。
- **未确认项**：当前网络是否能到 Cloudflare/Tailscale 控制面、服务商政策、FRP 节点实际 ACL/审计、二进制确切版本、Firewall 和 SSH 认证策略，均不由 raw 单独推出。

## 相关页面

- [containerd TLS 信任链](/note/containerd-tls-troubleshooting)
- [MySQL 性能问题模型](/note/mysql-performance-troubleshooting)
