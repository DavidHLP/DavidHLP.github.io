---
title: "跨越复杂网络：从 Cloudflare Tunnel、Tailscale 到 FRP 的 SSH 内网穿透实践与踩坑闭环"
capturedAt: 2026-08-07 00:00:00+00:00
sourceType: legacy-blog
sourceUrl: "https://github.com/DavidHLP/DavidHLP.github.io/blob/6f3d114a6ef9eb08b730f5f4740afe5b7d22d426/src/content/note/zh-cn/intranet-penetration-ssh-guide.md"
immutable: true
tags: [内网穿透, Cloudflare, Tailscale, FRP, SSH, Termius, systemd, 运维实践]
description: "深度剖析内网 Linux 服务器远程访问演进路径，对比 Cloudflare Tunnel、Tailscale 与 FRP 的适用场景，解析移动端 Termius 沙盒限制、控制面网络阻断与端口误用，并提供基于 systemd 和 linger 机制的生产级持久化部署方案。"
---

## 一、问题背景与核心诉求

在居家办公、移动运维或多端协作场景中，工程师经常需要从外部网络（如手机端 Termius、笔记本电脑）远程访问部署在家庭或实验室内网的 Linux 服务器。由于运营商多层 NAT 隔离、动态 IP 漂移以及公网 IPv4 资源的匮乏，直接建立连接往往不可行。

在寻求“高稳定、固定接入点、零成本”的内网穿透方案时，工程师通常会经历以下三阶段的技术选型演进：

```mermaid
flowchart LR
    A["探索 1: Cloudflare Tunnel"] -->|遭遇移动端沙盒限制 & 绑卡门槛| B["探索 2: Tailscale 异地组网"]
    B -->|遭遇国内控制面网络阻断| C["落地 3: FRP 端口映射"]
    C --> D["生产级保活: systemd + Linger"]
```

三类主流方案的核心差异对比：

| 方案维度 | Cloudflare Tunnel | Tailscale / WireGuard | FRP / SakuraFrp |
| :--- | :--- | :--- | :--- |
| **接入协议** | WebSocket / TLS 隧道 | UDP 虚拟点对点网段 | 原生 TCP / UDP 映射 |
| **客户端要求** | 需运行 `cloudflared` | 需安装 Tailscale 客户端 | 标准 SSH 客户端直连 |
| **移动端适配性** | 受限（Termius 无法运行 ProxyCommand）| 良好（需要系统 VPN 权限） | **极佳**（仅需填 IP/域名 + 映射端口） |
| **服务门槛** | 需海外信用卡激活 Zero Trust | 控制面易受阻断 | 零信用卡门槛，支持国内/香港节点 |
| **接入点稳定性**| 绑定自定义 CNAME 域名 | 固定 100.x 内网 IP / 域名 | 固定公网域名 + 指定映射端口 |

---

## 二、方案探索一：Cloudflare Tunnel 的实践与局限

### 1. 桌面端工作原理与配置

Cloudflare Tunnel（前身为 Argo Tunnel）通过在本地服务器运行 `cloudflared` 守护进程，向 Cloudflare 边缘节点建立出站双向 WebSocket/TLS 连接。外部流量访问 Cloudflare 边缘时，流量顺着隧道加密回传至本地服务。

在桌面端（macOS/Linux/Windows），可以通过配置客户端 `~/.ssh/config` 利用 `ProxyCommand` 将 SSH 流量封装进 `cloudflared`：

```sshconfig
Host ssh.yourdomain.com
    ProxyCommand cloudflared access ssh --hostname %h
    StrictHostKeyChecking accept-new
```

这种模式下，桌面端标准 SSH 命令行（如 `ssh <your-username>@ssh.yourdomain.com`）能够透明地通过隧道完成握手。

### 2. 移动端与网络痛点

在实际落地时，该方案面临两大核心卡点：
1. **移动端 Termius 沙盒限制**：移动端操作系统（iOS/Android）对应用的进程派生（fork/exec）有严格限制，Termius 无法在后台调用第三方二进制 `cloudflared` 执行 `ProxyCommand`。
2. **Zero Trust 绑卡门槛**：Cloudflare 默认要求为 Public Hostname 开通 Zero Trust/Access 策略，开通该服务强制需要绑定海外信用卡/PayPal。

---

## 三、方案探索二：Tailscale 异地组网的痛点

Tailscale 基于 WireGuard 协议构建点对点虚拟局域网，能为设备分配固定的 `100.x.x.x` 内网 IP。然而在国内网络环境下，`sudo tailscale up` 启动时往往会卡住挂起。

### 核心卡点：控制平面阻断

查看系统日志 `journalctl -u tailscaled -n 30` 经常会发现以下超时报错：

```text
logtail: dial "log.tailscale.com:443" failed: dial tcp ... i/o timeout
health(warnable=login-state): error: fetch control key: Get "https://controlplane.tailscale.com/key?v=138": context canceled
```

Tailscale 的控制平面（`controlplane.tailscale.com`）与 DERP 中继服务器在国内网络环境中容易受到干扰或阻断。另外，简单的 HTTP 代理环境变量（`HTTP_PROXY`）无法代理 Tailscale 所需的底层 UDP/WireGuard 流量，导致握手持续超时。

---

## 四、方案落地：基于 FRP 的通用端口映射

为实现手机端 Termius 零额外依赖直连，且避开绑卡门槛与网络阻断，基于 TCP 协议映射的 FRP（Fast Reverse Proxy）成为最优解。

### 1. 架构与现代 `frpc.toml` 配置

在 FRP 架构中，公网服务器 `frps` 监听公网端口，内网服务器 `frpc` 维持长连接并将流量映射至本地 `127.0.0.1:22`。

FRP v0.60+ 引入了现代 TOML 规范配置。创建 `~/frpc.toml` 配置文件（已脱敏）：

```toml
user = "<YOUR_USER_ID>"
auth.token = "<YOUR_AUTH_TOKEN>"

serverAddr = "frp.example.com"
serverPort = 8088

transport.tls.enable = false
transport.tls.disableCustomTLSFirstByte = false

[[proxies]]
name = "SSH"
type = "tcp"
localIP = "127.0.0.1"
localPort = 22
remotePort = <REMOTE_PORT>
```

### 2. 踩坑闭环一：命令行 `-f` 参数语法冲突

某些定制版 FRP 客户端提供 `-f <token>:<id>` 单行一键启动语法，但标准的开源 `frpc` 二进制（如 v0.61.0）使用 `cobra` 命令行解析器，直接传入 `-f` 会触发未知参数报错：

```text
Error: unknown shorthand flag: 'f' in -f
Usage:
  frpc [flags]
  frpc [command]
```

**解法**：统一使用 `-c` / `--config` 显式指定规范的 `frpc.toml` 或 `frpc.ini` 配置文件：

```bash
/path/to/frpc verify -c ~/frpc.toml
/path/to/frpc -c ~/frpc.toml
```

### 3. 踩坑闭环二：端口遗漏导致连接拒绝

在测试连接时，终端容易出现以下错误：

```text
$ ssh <your-username>@frp.example.com
The authenticity of host 'frp.example.com (198.18.0.x)' can't be established.
...
Permission denied (publickey,gssapi-keyex,gssapi-with-mic).
```

**根因分析**：
当运行 `ssh <your-username>@frp.example.com` 而不带 `-p` 参数时，SSH 客户端默认连接中转服务器本身的 **22 端口**，而非隧道配置中指定的映射端口（如 `<REMOTE_PORT>`）。中转服务器拒绝了非授权用户的公网登录。

**解法**：必须显式指定公网映射端口 `-p <REMOTE_PORT>`：

```bash
ssh -p <REMOTE_PORT> <your-username>@frp.example.com
```

---

## 五、生产级高可用部署：systemd 与 linger 机制

如果在终端中手动运行 `frpc`，当终端会话断开或用户注销时，进程会被系统发送 `SIGHUP` / `SIGKILL` 信号杀死。必须将其部署为系统服务。

### 1. 配置 systemd 用户服务

创建 `~/.config/systemd/user/frpc.service`：

```ini
[Unit]
Description=FRP Client Security Service
After=network.target network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=/path/to/frpc -c /home/<your-username>/frpc.toml
Restart=always
RestartSec=5s

[Install]
WantedBy=default.target
```

加载并启动用户服务：

```bash
systemctl --user daemon-reload
systemctl --user enable --now frpc.service
```

验证服务运行状态：

```bash
systemctl --user status frpc.service
```

成功启动日志输出示例：
```text
● frpc.service - FRP Client Security Service
     Active: active (running) since Sat 2026-08-01 19:25:40 CST
     Main PID: 146770 (frpc)
...
[I] [client/service.go:287] login to server success, get run id [...]
[I] [client/control.go:168] [s-xxx.SSH] start proxy success
```

### 2. 关键防御：开启 `loginctl enable-linger`

Linux systemd 默认会在非 root 用户退出所有 SSH 会话时，清除该用户的 `user@UID.service` 实例及其下属的所有用户服务。

为了确保服务器重启或用户注销后 `frpc` 依然在后台持续守护，必须执行：

```bash
loginctl enable-linger $USER
```

可以通过以下命令确认开启状态：

```bash
loginctl show-user $USER | grep Linger
# 输出 Linger=yes 即表示成功
```

---

## 六、总结与客户端连接对账表

通过结合 **FRP 端口映射** 与 **systemd + Linger 保活**，我们构建了一套不依赖海外信用卡、不限制客户端环境的高可用 SSH 内网穿透架构。

### 客户端连接参数参照表

| 客户端类型 | 填写字段 | 对应数值 / 配置 |
| :--- | :--- | :--- |
| **手机 Termius** | Host / Address | `frp.example.com`（或节点公网域名） |
| | Port | **`<REMOTE_PORT>`**（分配的公网映射端口） |
| | Username | `<your-username>`（Linux 系统用户名） |
| | Password | Linux 系统登录密码 / 私钥 |
| **桌面命令行** | SSH 命令 | `ssh -p <REMOTE_PORT> <your-username>@frp.example.com` |
| **桌面 `~/.ssh/config`**| 配置段 | `Host my-server`<br>`  HostName frp.example.com`<br>`  Port <REMOTE_PORT>`<br>`  User <your-username>` |
