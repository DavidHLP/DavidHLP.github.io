---
title: "Multi-Service Startup Readiness: running, ready, and Dependency/Failure/Restart Propagation"
timestamp: 2026-08-13 00:00:00+08:00
series: "System Operations & Infrastructure"
kind: concept
status: active
draft: true
sources: ["multi-service-readiness-contract", "multi-service-readiness-contract-correction", "multi-service-readiness-safety-correction"]
related: ["mysql-performance-troubleshooting", "database-schema-drift", "testcontainers-docker-api", "dubbo-nacos-runtime", "microservice-data-ownership"]
tags: [Docker Compose, systemd, depends_on, healthcheck, Readiness, Orchestration]
description: "Uses a decision table to distinguish six concepts in multi-service orchestration — process startup, business readiness, ordering, dependency establishment, and failure/restart propagation — and gives the minimal combinations and verification paths for Compose healthcheck/depends_on and systemd After/Wants/Requires."
toc: true
---

This page answers one question: after declaring dependencies in Compose or systemd, what guarantee do I actually get? Core conclusion: the orchestrator only applies a startup gate based on the declared condition (`service_started` / `service_healthy` / `service_completed_successfully`) and does not automatically guarantee business readiness; ordering, dependency, failure, and restart propagation are four orthogonal semantics that must be judged separately.

## Core mechanism

### 1. A decision table to distinguish six concepts

| Concept                                | Semantics                                                     | Determination / trigger                                                                                       | Key boundary                                                                                  |
| -------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| running (process startup)              | The orchestrator only waits for the container to be "running" | Container state is running; port binding belongs to this layer                                                | Does not wait for the app to be ready; a listening port is not readiness evidence             |
| ready (business readiness)             | Must be explicitly defined by the user                        | `healthcheck` passes, or a one-shot task completes (`service_completed_successfully`, v2.20.0+)               | The probe is a user command; the orchestrator does not verify in-app state                    |
| ordering                               | Only decides sequence, does not establish a dependency        | Compose short syntax `depends_on: [db]` (equivalent to `service_started`); systemd `After=`/`Before=`         | Short syntax only guarantees startup order; `After=` is orthogonal to `Requires=`/`Wants=`    |
| requirement (dependency establishment) | Declares "start only when the dependency is satisfied"        | Long syntax `condition: service_healthy`; systemd `Requires=`/`Wants=`                                        | `Wants=` is a weak form; failure does not affect the overall transaction                      |
| failure propagation                    | A dependent does not start when a dependency is unhealthy     | `up --wait` exits with failure; `--abort-on-container-failure` stops everything; systemd `Requires=`+`After=` | `--abort-on-container-failure` is incompatible with `-d` and mutually exclusive with `--wait` |
| restart propagation                    | Only restarts triggered by explicit operations propagate      | `depends_on.restart: true`; explicit stop/restart with systemd `Requires=`                                    | Runtime automatic restarts do not propagate; unexpected systemd failure needs `BindsTo=`      |

### 2. Key semantic distinctions

- **running ≠ ready**: Compose does not wait for a container to be ready on startup, only running (docker/docs pinned-source text). Readiness must be explicitly defined by the user: `condition: service_healthy` (health defined by `healthcheck`) or `service_completed_successfully` (a one-shot task finished).
- **ordering ≠ dependency (systemd)**: `After=`/`Before=` only configure ordering dependencies and are orthogonal to `Requires=`/`Wants=` (v261.2 manual text: "independent and orthogonal"); the official common pattern is to put the same unit into both `After=` and `Wants=`. A service unit is considered complete when "all configured start commands have been invoked (regardless of success or failure, including `ExecStartPost=`)" — started does not mean serviceable.
- **healthcheck is a user-defined readiness probe**: the spec text says it declares a check that determines whether the container is healthy, working the same way as the Dockerfile `HEALTHCHECK`; what the probe tests is entirely decided by the user command, and the orchestrator does no business-level inference. `test` supports `NONE`/`CMD`/`CMD-SHELL`, and can be disabled with `disable: true`.
- **port binding ≠ readiness**: `ports` only defines the published mapping (binds all interfaces `0.0.0.0` when no HOST is written) and does not touch the in-container app state. A listening port is a signal at the "process startup" layer and is not readiness evidence.

### 3. Failure propagation and restart propagation

- **Compose failure**: the spec guarantees that a dependency marked `service_healthy` is healthy before the dependent starts; `up --wait` (implicit detached mode) exits with failure when a dependency is unhealthy (raw run: exit code 1, output "dependency failed start: container … is unhealthy", app only created, not started); `--abort-on-container-failure` stops everything when any container fails, is incompatible with `-d`, and is mutually exclusive with `--wait`.
- **Compose restart**: `depends_on.restart: true` only propagates restarts triggered by "explicit Compose operations" (such as `docker compose restart` / update); automatic restarts at the container runtime level (`restart: always`/`on-failure`/`unless-stopped`) do not propagate through `depends_on`.
- **systemd**: with `Requires=` + `After=`, a dependency activation failure prevents this unit from starting; `Wants=` is a weak form, and failure does not affect the overall validity of the transaction. `Requires=` only carries along when the dependency is explicitly stopped/restarted; unexpected failure does not propagate; to cover "dependency stops unexpectedly and this one stops too", use `BindsTo=`.

## Minimal combination examples

### Compose: healthcheck + `depends_on.condition: service_healthy`

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

Selection points (from the correction raw's minimal experiment): pinned official images, no build, no credentials, no ports; `app` defines no healthcheck, so running satisfies `up --wait`, and `app` starts only after `db`'s `redis-cli ping` passes. The `healthcheck` probe command defines what ready means; a different command means a different readiness standard.

### systemd: the combination boundary of `After=` and `Wants=`/`Requires=`

```ini
[Unit]
After=db.service
Wants=db.service
```

- `After=` only orders: db starts first, but a db startup failure does not affect this unit.
- Replace `Wants=` with `Requires=`: when db activation fails (and `After=` exists) this unit does not start; when db is explicitly stopped/restarted, this unit is stopped/restarted along with it.
- Boundary check: with only `After=`, `Requires=`/`Wants=` are empty; with only `Requires=` and no `After=`, startup is not blocked; unexpected-failure propagation requires `BindsTo=`.

## Minimal verification

First save the anonymous fixture above into a `compose.yaml` in a dedicated temporary directory. Do not copy the following commands into an existing development or production Compose project directory; `restart` interrupts services, `--abort-on-container-failure` stops all containers of that isolated project, and `down` stops and removes its containers and networks.

```bash
fixture="$(pwd)/compose.yaml"           # 当前目录必须只包含此匿名 fixture
project="readiness-contract-$$"         # 当前 shell 内唯一；后续命令保持一致
printf 'Copy these values to the scenario terminal: fixture=%q project=%q\n' "$fixture" "$project"

docker compose -f "$fixture" -p "$project" config -q
docker compose -f "$fixture" -p "$project" up -d --wait --wait-timeout 30
docker compose -f "$fixture" -p "$project" ps
docker inspect --format '{{json .State.Health}}' \
  "$(docker compose -f "$fixture" -p "$project" ps -q db)"
# Warning: restart interrupts db; with depends_on.restart: true the app also restarts.
docker compose -f "$fixture" -p "$project" restart db
# Warning: down stops and removes this isolated project's containers and networks; do not add --volumes.
docker compose -f "$fixture" -p "$project" down
```

Scenario commands must use the same `fixture`/`project` and run separately from the main flow. In another terminal, first fill the actual values printed by the first block into the two lines below; do not let Compose infer the project from the current directory:

```bash
fixture="<FIXTURE_PATH>"                # Replace with the fixture value printed by the first block
project="<PROJECT_NAME>"               # Replace with the project value printed by the first block

# The event stream blocks until Ctrl-C; in another terminal run up with the same -f/-p.
docker compose -f "$fixture" -p "$project" events
# Failure gate: only in the isolated fixture, change db healthcheck.test to always exit 1.
docker compose -f "$fixture" -p "$project" up -d --wait --wait-timeout 8
# Foreground failure propagation stops all containers of this isolated project after any container fails;
# it is incompatible with -d and mutually exclusive with --wait, and needs another isolated fixture
# containing a service that exits non-zero.
docker compose -f "$fixture" -p "$project" up --abort-on-container-failure
```

```bash
systemctl show <unit> -p After -p Before -p Requires -p Wants   # After= 与 Requires= 是正交字段
systemd-analyze verify <unit>.service          # 单元文件校验
```

Interpret the results against the decision table: `ps`'s healthy column only proves the probe passed, not business readiness; the `health_status` sequence in `events` confirms dependency order; if `systemctl show` has only `After=` while `Requires=`/`Wants=` are empty, there is only ordering, no dependency.

## What the orchestrator cannot replace

- **migration is not within the orchestrator's responsibility**: the spec's only "one-shot task" ordering primitive is `condition: service_completed_successfully` (marked Compose v2.20.0+), which only handles ordering; the migration logic itself must be defined by the user as a service/command. schema changes, data backfills, and other business readiness are not within the orchestrator's responsibility.
- **business readiness is not within healthcheck semantics**: in-app state such as cache warm-up, consistency, and business assertions is not verified by the orchestrator; the probe is just an arbitrary user-defined command.
- Therefore, for requirements like "start the app only after migration completes", the correct approach is for the user to make the migration a one-shot service and declare a `service_completed_successfully` dependency on the app, rather than relying on the orchestrator to infer it automatically.

## Applicable conditions

1. When judging "what does my orchestration declaration actually guarantee", compare item by item with the decision table; especially distinguish ordering from dependency, and failure from restart propagation — they are often conflated.
2. Use long syntax `condition: service_healthy` when you need "start only after healthy"; short syntax is enough when only sequence matters (equivalent to `service_started`).
3. Use `Requires=`+`After=` in systemd when you need "do not start if the dependency fails"; introduce `BindsTo=` only when unexpected failures must also carry along.

## Not applicable and risks

- This page is primarily based on the compose-spec/systemd fixed points saved in `multi-service-readiness-contract`; `multi-service-readiness-contract-correction` independently adds the docker/docs and Compose CLI pinned sources and the one-shot Redis/Alpine experiments, and `multi-service-readiness-safety-correction` adds the `-f`/`-p` project isolation and `down` removal scope. `service_completed_successfully` requires Compose v2.20.0+; semantics of the `restart` field before v2.17.0 are not covered.
- The separation of port binding and readiness is a spec-derived inference; no dedicated experiment for "port bound but app not ready" was run; `--wait` failure, healthy-then-start, and explicit restart propagation were observed in the correction raw's minimal fixture.
- Not covered: behavioral differences of `depends_on` in swarm mode, and the full semantics of systemd `Requisite=`/`PartOf=`/`Conflicts=`.

## Evidence and uncertainty

- **Source facts**: `multi-service-readiness-contract` saves the original Compose/systemd spec contracts and the anonymous PostgreSQL example; `multi-service-readiness-contract-correction` independently saves the later pinned sources and one-shot Redis/Alpine experiments, observing the `service_healthy` startup gate, `--wait` failure exit, and explicit restart propagation; `multi-service-readiness-safety-correction` pins Compose v5.4.0's project flags and `down` removal boundaries.
- **Spec-derived inference**: port binding ≠ readiness; the orchestrator cannot infer business state from processes/ports automatically.
- **Unverified items**: no dedicated real-machine behavior for "port bound but app not ready" was observed; the systemd-side `Requires=`/`BindsTo=` propagation was not run on a real host either, only the v261.2 manual semantics are referenced.

## Related pages

- [MySQL performance troubleshooting](/en/note/mysql-performance-troubleshooting)
- [Database schema drift](/en/note/database-schema-drift)
