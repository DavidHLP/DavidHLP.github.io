---
title: "Beyond Complex Networks: Practice and Troubleshooting of SSH Intranet Penetration from Cloudflare Tunnel to FRP"
timestamp: 2026-08-01 00:00:00+08:00
series: "System Administration & Remote Control"
tags: [Intranet Penetration, Cloudflare, Tailscale, FRP, SSH, Termius, systemd, DevOps]
description: "In-depth analysis of remote access evolution for internal Linux servers, comparing Cloudflare Tunnel, Tailscale, and FRP, resolving Termius mobile sandbox restrictions, control plane blocking, and port misconfigurations, with a production-grade systemd + linger daemon deployment."
sensitive: false
toc: true
top: 0
draft: false
---

## 1. Problem Background and Core Requirements

In scenarios involving remote work, mobile maintenance, or multi-device collaboration, engineers frequently need to access Linux servers deployed behind home or laboratory internal networks from external networks (such as Termius on mobile devices or laptops). Due to multi-layer ISP NAT isolation, dynamic IP shifts, and the scarcity of public IPv4 addresses, establishing direct connections is often impossible.

When seeking a "highly stable, fixed endpoint, zero-cost" intranet penetration solution, engineers typically evolve through technology selections:

```mermaid
flowchart LR
    A["Exploration 1: Cloudflare Tunnel"] -->|Mobile Sandbox & Payment Barriers| B["Exploration 2: Tailscale Mesh Network"]
    B -->|Control Plane Regional Blocking| C["Production: FRP Port Mapping"]
    C --> D["Daemonization: systemd + Linger"]
```

Core comparison among the three mainstream solutions:

| Dimension | Cloudflare Tunnel | Tailscale / WireGuard | FRP / SakuraFrp |
| :--- | :--- | :--- | :--- |
| **Protocol** | WebSocket / TLS Tunnel | UDP Virtual Peer-to-Peer | Native TCP / UDP Mapping |
| **Client Requirement** | Requires `cloudflared` | Requires Tailscale client | Standard SSH client direct connection |
| **Mobile Suitability** | Restricted (Termius cannot run ProxyCommand) | Good (Requires VPN permissions) | **Excellent** (Only requires IP/Domain + Mapped Port) |
| **Service Threshold** | Requires overseas credit card for Zero Trust | Control plane subject to regional blocking | Zero credit card threshold, supports domestic/HK nodes |
| **Fixed Endpoint** | Bound custom CNAME domain | Fixed 100.x internal IP / domain | Fixed public domain + assigned mapped port |

---

## 2. Exploration 1: Cloudflare Tunnel Practice and Limitations

### 2.1 Desktop Working Principle and Configuration

Cloudflare Tunnel (formerly Argo Tunnel) establishes outbound bidirectional WebSocket/TLS connections from the local server to Cloudflare edge nodes via the `cloudflared` daemon. External traffic accessing Cloudflare edges is encrypted and relayed back to local services.

On desktop platforms (macOS/Linux/Windows), SSH traffic can be encapsulated into `cloudflared` using `ProxyCommand` in `~/.ssh/config`:

```sshconfig
Host ssh.yourdomain.com
    ProxyCommand cloudflared access ssh --hostname %h
    StrictHostKeyChecking accept-new
```

Under this model, standard SSH CLI commands (e.g., `ssh <your-username>@ssh.yourdomain.com`) transparently complete handshakes through the tunnel.

### 2.2 Mobile Termius and Network Bottlenecks

In actual deployment, this solution faces two major bottlenecks:
1. **Mobile Termius Sandbox Limitation**: Mobile operating systems (iOS/Android) strictly restrict process spawning (`fork`/`exec`), preventing Termius from invoking `cloudflared` for `ProxyCommand`.
2. **Zero Trust Payment Barrier**: Cloudflare requires enabling Zero Trust/Access policies for Public Hostnames, which strictly demands an overseas credit card or PayPal account.

---

## 3. Exploration 2: Tailscale Mesh Network Pain Points

Tailscale constructs a peer-to-peer virtual LAN based on the WireGuard protocol and assigns a fixed `100.x.x.x` internal IP. However, in certain network environments, `sudo tailscale up` frequently hangs during initialization.

### Core Bottleneck: Control Plane Blocking

Inspecting system logs via `journalctl -u tailscaled -n 30` often reveals timeout errors:

```text
logtail: dial "log.tailscale.com:443" failed: dial tcp ... i/o timeout
health(warnable=login-state): error: fetch control key: Get "https://controlplane.tailscale.com/key?v=138": context canceled
```

Tailscale's control plane (`controlplane.tailscale.com`) and DERP relay servers are prone to regional blocking. Furthermore, basic HTTP proxy environment variables (`HTTP_PROXY`) cannot relay the underlying UDP/WireGuard traffic required by Tailscale, leading to continuous handshake timeouts.

---

## 4. Production Solution: Generic FRP Port Mapping

To achieve zero-dependency direct connections on mobile Termius and avoid payment barriers and network blocking, FRP (Fast Reverse Proxy) based on TCP mapping is the optimal choice.

### 4.1 Architecture and Modern `frpc.toml` Configuration

In FRP architecture, `frps` (server) running on a public node listens to public ports; `frpc` (client) running on the internal server maintains a persistent connection and forwards traffic arriving at the public mapped port to local `127.0.0.1:22`.

FRP v0.60+ introduced modern TOML configurations. Create `~/frpc.toml` (sensitive credentials desensitized):

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

### 4.2 Troubleshooting 1: CLI `-f` Flag Syntax Conflict

Some customized FRP clients offer a single-line `-f <token>:<id>` start syntax. However, standard open-source `frpc` binaries (such as v0.61.0) use the `cobra` CLI parser, where passing `-f` triggers unknown flag errors:

```text
Error: unknown shorthand flag: 'f' in -f
Usage:
  frpc [flags]
  frpc [command]
```

**Resolution**: Consistently use `-c` / `--config` to explicitly specify the standard `frpc.toml` or `frpc.ini` configuration file:

```bash
/path/to/frpc verify -c ~/frpc.toml
/path/to/frpc -c ~/frpc.toml
```

### 4.3 Troubleshooting 2: Connection Refusal due to Omitted Port

During connection testing, the following terminal error frequently occurs:

```text
$ ssh <your-username>@frp.example.com
The authenticity of host 'frp.example.com (198.18.0.x)' can't be established.
...
Permission denied (publickey,gssapi-keyex,gssapi-with-mic).
```

**Root Cause**:
Running `ssh <your-username>@frp.example.com` without `-p` causes the SSH client to default to port **22** of the relay server itself, rather than your assigned mapped port (`<REMOTE_PORT>`). The relay server rejects unauthorized public logins.

**Resolution**: Explicitly specify the public mapped port `-p <REMOTE_PORT>`:

```bash
ssh -p <REMOTE_PORT> <your-username>@frp.example.com
```

---

## 5. Production-Grade High Availability: systemd and Linger Mechanism

If `frpc` is executed manually in a terminal session, the process will be killed by `SIGHUP` / `SIGKILL` when the SSH session closes or the user logs out. Deploying it as a system service is required.

### 5.1 Configuring systemd User Service

Create `~/.config/systemd/user/frpc.service`:

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

Reload and enable the user service:

```bash
systemctl --user daemon-reload
systemctl --user enable --now frpc.service
```

Verify service status:

```bash
systemctl --user status frpc.service
```

Successful startup log output:
```text
● frpc.service - FRP Client Security Service
     Active: active (running) since Sat 2026-08-01 19:25:40 CST
     Main PID: 146770 (frpc)
...
[I] [client/service.go:287] login to server success, get run id [...]
[I] [client/control.go:168] [s-xxx.SSH] start proxy success
```

### 5.2 Essential Defense: Enabling `loginctl enable-linger`

Linux systemd by default terminates a non-root user's `user@UID.service` instance and all subordinate user services when all SSH sessions for that user log out.

To ensure `frpc` remains active in the background across reboots and logouts, execute:

```bash
loginctl enable-linger $USER
```

Confirm the status with:

```bash
loginctl show-user $USER | grep Linger
# Output Linger=yes indicates success
```

---

## 6. Summary and Client Connection Reference Table

By combining **FRP port mapping** with **systemd + Linger daemonization**, we established a resilient SSH intranet penetration architecture independent of overseas payment methods or client environments.

### Client Connection Reference Table

| Client Type | Field Name | Value / Configuration |
| :--- | :--- | :--- |
| **Mobile Termius** | Host / Address | `frp.example.com` (or node domain) |
| | Port | **`<REMOTE_PORT>`** (Assigned public mapped port) |
| | Username | `<your-username>` (Linux system username) |
| | Password | Linux system password / Private key |
| **Desktop CLI** | SSH Command | `ssh -p <REMOTE_PORT> <your-username>@frp.example.com` |
| **Desktop `~/.ssh/config`**| Config Block | `Host my-server`<br>`  HostName frp.example.com`<br>`  Port <REMOTE_PORT>`<br>`  User <your-username>` |
