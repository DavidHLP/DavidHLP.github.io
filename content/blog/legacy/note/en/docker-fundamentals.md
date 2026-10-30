---
{
  "archiveId": "X-1055",
  "title": "Docker Fundamentals: Image Layers, Container Operations, and Compose Networking",
  "en": "ENGINEERING NOTES",
  "category": "工程研究",
  "department": "工程笔记",
  "date": "2026-08-20",
  "lead": "DavidHLPL",
  "clearance": "DRAFT",
  "abstract": "Distills Docker image layers, common commands, volumes, networking, and Compose suitability and boundaries.",
  "findings": [
    "Original document: src/content/note/en/docker-fundamentals.md",
    "Source revision: f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "Evidence status: active"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/src/content/note/en/docker-fundamentals.md",
  "pubDate": "2026-08-20T16:00:00.000Z",
  "tags": [
    "Docker",
    "Container",
    "Compose",
    "Image",
    "Volume",
    "Network",
    "en",
    "note"
  ],
  "draft": true,
  "lang": "en",
  "legacy": {
    "path": "src/content/note/en/docker-fundamentals.md",
    "revision": "f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "metadata": {
      "title": "Docker Fundamentals: Image Layers, Container Operations, and Compose Networking",
      "timestamp": "2026-08-21 00:00:00+08:00",
      "series": "Systems, Operations & Infrastructure",
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
      "description": "Distills Docker image layers, common commands, volumes, networking, and Compose suitability and boundaries.",
      "toc": true
    }
  }
}
---


`Docker` appears in the 7 notes across the two repositories as operational checklists: Dockerfile, layers, volumes, networking, and Compose. This page compresses the checklist into a minimal usable model, clarifies when to use `volume` vs `bind`, `bridge` vs `host`, and the value of Compose, without dumping images verbatim.

## Core Mechanism

### 1. Image layers are the unit of caching and reuse

| Concept     | Role                                 | Boundary                                    |
| ----------- | ------------------------------------ | ------------------------------------------- |
| Base Image  | Shared read-only layer               | Do not write mutable data into image layers |
| Layer       | One layer per Dockerfile instruction | Too many small layers add metadata overhead |
| Build cache | Hits can skip rebuilds               | `COPY` order affects hit rate               |

The source notes `Layer和BaseImage概念.md` (Layer and Base Image) shows layers via `docker history`, while `Dockerfile基础.md` (Dockerfile Basics) explains the layer effects of `FROM/RUN/COPY`. In practice, put immutable dependencies first and mutable source code last to maximize cache hits.

### 2. Container operations and data lifecycle

- `docker run/stop/start/rm/rmi` manage container and image lifecycles; the source `Docker常见命令.md` (Docker Common Commands) lists `save/load/push/pull`.
- Volumes: a `volume` is managed by Docker, easily shared across containers and backed up; a `bind mount` directly maps a host path, suitable for dev hot-reload but coupled to the host.
- Choice: use `volume` when you need portable, persistent data; use `bind` when you need to edit host files directly; do not bind database files to a temporary directory.

### 3. Networking and Compose orchestration

- `容器网络连接.md` (Container Networking) distinguishes `bridge` (default isolation), `host` (shares host networking), `none`, and custom networks; custom networks support container-name DNS.
- `DockerCompose.md` declares `service/network/volume` in `docker-compose.yml`; `up/down/ps/logs/build/pull` covers single-host multi-container. Compose fits dev/test and small production, not a replacement for K8s scheduling and health checks.

## Applicability

- Single host or small cluster that needs declarative orchestration without K8s.
- Images can be layer-cached; runtime data needs `volume` persistence.
- Containers need DNS-reachable custom networks.

## Not Applicable and Risks

- Multi-host scheduling, rolling updates, and health gates are better served by orchestrators beyond Compose (e.g., K8s); `multi-service-readiness` clarifies `readiness` vs runtime distinction.
- `docker commit` baking a running container into an image loses Dockerfile traceability; prefer rebuilding.
- Bind mounts expose host paths; evaluate permissions and SELinux/AppArmor in production.

## Minimum Verification

1. After `docker build`, run `docker history` to confirm layer count and cache hits.
2. Mount with `volume` and `bind` respectively, restart containers, and verify data persistence.
3. Validate `docker-compose config`, then `up -d` and confirm `ps` and `logs` are reachable.

## Evidence and Uncertainty

- **Source facts**: `ingest-docker-fundamentals` captures 7 source notes on commands, volumes, and networking verbatim.
- **Synthesis**: This page compresses the checklist into a layer—data—network model and gives `volume`/`bind` selection criteria.
- **Unconfirmed**: Image size, build time, and network performance were not measured; the `version` field in Compose is now optional, and version differences in sources were not exhaustively verified.

## Related Pages

- [containerd-tls-troubleshooting](/blog/legacy/note/zh-cn/containerd-tls-troubleshooting/)
- [multi-service-readiness](/blog/legacy/note/zh-cn/multi-service-readiness/)
- [intranet-penetration-ssh-guide](/blog/legacy/note/zh-cn/intranet-penetration-ssh-guide/)


## Sources and related documents

- [Docker 基础与容器化：镜像分层、数据卷、网络与 Compose 快照](/blog/legacy/raw/zh-cn/ingest-docker-fundamentals/)
- [containerd TLS: Choosing a Trusted Chain or Temporary Verification Bypass](/blog/legacy/note/zh-cn/containerd-tls-troubleshooting/)
- [Multi-Service Startup Readiness: running, ready, and Dependency/Failure/Restart Propagation](/blog/legacy/note/zh-cn/multi-service-readiness/)
- [SSH Intranet Access: Connection Direction, Exposure, and Recovery](/blog/legacy/note/zh-cn/intranet-penetration-ssh-guide/)
