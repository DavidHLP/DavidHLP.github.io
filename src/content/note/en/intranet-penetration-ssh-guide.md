---
title: "SSH Intranet Access: Connection Direction, Exposure, and Recovery"
timestamp: 2026-08-01 00:00:00+08:00
series: "System Operations & Infrastructure"
kind: concept
status: active
sources: ["legacy-intranet-penetration-ssh-guide"]
related: ["containerd-tls-troubleshooting", "mysql-performance-troubleshooting"]
tags: [Intranet Penetration, Cloudflare, Tailscale, FRP, SSH, Termius, systemd, DevOps]
description: "A five-axis comparison of Cloudflare Tunnel, Tailscale, and FRP—connection direction, exposure, control plane, data plane, and recovery—with evidence-backed boundaries for mobile clients, ports, and systemd/linger."
toc: true
---

This page answers a remote-access decision: when an internal Linux server has no directly reachable public address, how should SSH tooling be chosen by client capability, control-plane reachability, and public exposure? The useful result is not another tutorial; it is a map of each option's connection direction and failure domain, followed by the conditions that keep an FRP client alive after logout.

## Core mechanism

### 1. Five comparison axes

| Axis | Cloudflare Tunnel | Tailscale / WireGuard | FRP |
| --- | --- | --- | --- |
| Connection direction | Internal `cloudflared` opens an outbound WebSocket/TLS connection to Cloudflare Edge; the outside client reaches Edge first | Devices join a virtual network; the data plane uses UDP/WireGuard and may rely on DERP | Public `frps` listens on a port; internal `frpc` keeps a long-lived connection and forwards to local `127.0.0.1:22` |
| Exposure | A custom CNAME/Hostname is the entry point | Devices receive a `100.x.x.x` virtual address; clients must join the network | Public address/domain plus `remotePort` is the entry point; a standard SSH client connects to the mapped port |
| Control plane | Cloudflare Zero Trust/Access and Edge service | `controlplane.tailscale.com`, login state, and DERP reachability | `frpc` authentication and its long-lived connection to `frps`; the source configuration includes `auth.token` |
| Data plane | SSH is proxied through `cloudflared access ssh` | WireGuard/UDP virtual link | TCP mapping to the internal SSH port |
| Recovery | Depends on a desktop client that can run `cloudflared` and on service-account conditions | Restore the control plane first; an HTTP proxy is not the same as a working UDP data plane | A systemd user service restarts the client; linger keeps the user-service instance after logout |

### 2. Boundaries of the three options

| Option | Fits | Explicit limitation |
| --- | --- | --- |
| Cloudflare Tunnel | Desktop macOS/Linux/Windows where standard SSH can run `ProxyCommand`, and a custom domain is acceptable | Mobile Termius cannot spawn `cloudflared` inside its sandbox; the raw record includes a Zero Trust/Access payment gate, which must be rechecked against current policy. |
| Tailscale | Clients can install Tailscale and obtain system VPN permission, with control plane/DERP reachable | `sudo tailscale up` may hang when the control plane is blocked; a simple `HTTP_PROXY` cannot proxy the required UDP/WireGuard traffic. |
| FRP | A mobile Termius client should need only a domain and port, and a public relay node is available | The public entry point is `serverAddr + remotePort`; standard open-source `frpc` and a customized client's startup flags must not be mixed. |

### 3. Minimal configuration and two common semantic errors

The source's desktop Cloudflare entry is:

```sshconfig
Host ssh.yourdomain.com
    ProxyCommand cloudflared access ssh --hostname %h
    StrictHostKeyChecking accept-new
```

The raw example for FRP v0.60+ uses TOML. Keep only the data-plane facts here:

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

- Some customized clients accept `-f <token>:<id>`, but the raw record says the standard open-source `frpc` binary (for example v0.61.0) reports `-f` as an unknown shorthand flag. Use `/path/to/frpc -c ~/frpc.toml` and run `verify -c` first.
- `ssh user@frp.example.com` targets the relay's port 22 by default, not the mapped port. Use `ssh -p <REMOTE_PORT> user@frp.example.com`; otherwise “the tunnel is broken” and “the relay received an unauthorized login” look identical.

### 4. systemd and linger are separate recovery conditions

When `frpc` runs in a terminal, disconnecting or logging out can send `SIGHUP`/`SIGKILL`. The source recommends a user service:

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

`Restart=always` restarts the service after it exits; `enable-linger` keeps the `user@UID.service` instance after the user leaves SSH sessions. Neither substitutes for the other.

## Applicable conditions

1. When a mobile client supports only standard SSH fields, FRP's `Host/Address + remotePort + Username` is the most direct shape in the source.
2. When a desktop can run a third-party binary and Cloudflare control-plane conditions are met, Tunnel can hide forwarding behind `ProxyCommand`.
3. Tailscale fits a network where its control plane and DERP are reachable and the client can obtain VPN permission; setting an HTTP proxy alone does not prove that WireGuard data traffic works.
4. FRP fits a fixed public domain and explicit mapped port; `frps`, `frpc`, the remote port, and the token must describe the same deployment.
5. For long-lived operation, place the unit at `~/.config/systemd/user/frpc.service` and verify both user-service status and linger.

## Not applicable and risks

- The Cloudflare mobile limitation is a client sandbox boundary, not an SSH-key or remote-port problem: Termius cannot execute the `cloudflared` in `ProxyCommand`.
- The Cloudflare Zero Trust payment requirement is a time-scoped observation in the raw source and may change; do not treat it as a permanent product contract.
- A `log.tailscale.com` or `controlplane.tailscale.com` timeout proves a control-plane problem only; it does not by itself prove that the internal host or SSH daemon is broken.
- The public FRP `remotePort` is an exposure surface. This page establishes port mapping and token configuration only; it does not infer access control, auditing, or the relay operator's security policy.
- Do not guess binary versions from `-f` syntax, and do not omit SSH `-p`; flag conflicts and port mistakes create misleading authentication errors.
- The `/path/to/frpc` binary, configuration permissions, and network service availability remain deployment-specific; linger does not guarantee FRP control-plane reachability.

## Minimal verification

Collect the smallest evidence for each failure domain:

```bash
# Tailscale control plane
journalctl -u tailscaled -n 30

# FRP configuration and process
/path/to/frpc verify -c ~/frpc.toml
/path/to/frpc -c ~/frpc.toml

# Data-plane port
ssh -p <REMOTE_PORT> <your-username>@frp.example.com
```

After enabling persistence, observe:

```bash
systemctl --user status frpc.service
loginctl show-user $USER | grep Linger
```

- A desktop Cloudflare path should allow `ssh <your-username>@ssh.yourdomain.com` to use the configured `ProxyCommand`; mobile Termius lacks that execution prerequisite.
- Successful FRP config validation does not prove that the public port is reachable; the SSH command must still use the assigned `remotePort`.
- `Active: active (running)` and `Linger=yes` prove user-service operation and logout persistence respectively, not SSH authentication or control-plane health.

## Evidence and uncertainty

- **Source facts**: `legacy-intranet-penetration-ssh-guide` records Cloudflare's outbound WebSocket/TLS and desktop `ProxyCommand`, the Termius sandbox limitation, the recorded Zero Trust payment gate, Tailscale control-plane/DERP timeouts, FRP v0.60+ TOML and v0.61.0 flag differences, `remotePort` semantics, and systemd/linger commands.
- **Synthesis in this page**: those facts are reorganized around connection direction, exposure, control plane, data plane, and recovery; `Restart=always` and linger are deliberately assigned different responsibilities.
- **Unconfirmed**: current reachability of Cloudflare/Tailscale control planes, provider policy, actual FRP ACL/audit behavior, exact binary versions, firewall rules, and SSH authentication policy are not established by the raw source alone.

## Related pages

- [containerd TLS trust chain](/note/containerd-tls-troubleshooting)
- [MySQL performance problem model](/note/mysql-performance-troubleshooting)
