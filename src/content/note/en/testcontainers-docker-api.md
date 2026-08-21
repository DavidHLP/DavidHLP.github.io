---
title: "Testcontainers 1.20.6: Rule Out the Docker API Version First, Then Judge the daemon Unavailable"
timestamp: 2026-08-13 00:00:00+08:00
series: "Java Testing & Infrastructure"
kind: concept
status: active
draft: true
sources: ["testcontainers-docker-api-negotiation", "testcontainers-docker-api-negotiation-correction"]
related: ["containerd-tls-troubleshooting", "multi-service-readiness"]
tags: ["Testcontainers", "Docker", "docker-java", "API-Version", "Moby", "Diagnostics"]
description: "Explains how Testcontainers 1.20.6 falls back to 1.32 for an unknown Docker API version, why DOCKER_API_VERSION should not borrow Docker CLI experience, and how to distinguish version incompatibility from a missing Docker environment starting from the earliest 400 error."
toc: true
---

**Conclusion first**: Testcontainers Java `1.20.6` falls back to `1.32` for an unknown Docker API version instead of first dynamically negotiating to the daemon's newest version. When you hit `Could not find a valid Docker environment`, first check the earliest `/v1.32/info` request and the HTTP 400; do not rule out API version incompatibility just because the daemon is running.

## Version boundaries

| Component           | Pinned scope                |
| ------------------- | --------------------------- |
| Testcontainers Java | `1.20.6`, commit `cc1c13af` |
| docker-java         | BOM `3.4.1`                 |
| Reference daemon    | Moby `v27.5.1`              |

This page is only responsible for this pinned set of sources. Testcontainers 2.x's API version implementation cannot be directly extrapolated back to 1.20.6.

## 1. The default request version in 1.20.6

In `DockerClientProviderStrategy.getClientForConfig`, after docker-java parses the configuration, if the API version is `UNKNOWN_VERSION`, Testcontainers directly sets:

```java
withApiVersion(RemoteApiVersion.VERSION_1_32)
```

`UNKNOWN_VERSION` includes unset, empty, and unparseable values. So the default path is:

```text
Config parsing
  -> UNKNOWN_VERSION
  -> Pinned to 1.32
  -> First strategy probe request /v1.32/info
```

This is not "asking the daemon for the newest version and choosing it". The `ApiVersion` returned by the daemon's `/version` is a capability report, possibly `1.47`; it does not mean the client request has switched to `1.47`.

## 2. Do not borrow Docker CLI experience for the config key

In the docker-java `3.4.1` pinned source, `api.version` is the config key being read, with system properties taking precedence:

```bash
mvn test -Dapi.version=1.32
```

The current source audit finds no use site of `DOCKER_API_VERSION`. It may be a config convention of the Docker CLI or other clients, but you cannot assert from that alone that it affects Testcontainers 1.20.6.

To avoid confusion during troubleshooting, first fix a single source:

1. use `-Dapi.version=1.32` as the baseline;
2. observe the actual request path and Testcontainers logs;
3. then change the environment variable alone and confirm whether it really changes the request;
4. do not mix in Docker context, socket, and API version variables at the same time.

## 3. The daemon's min/default version check

Taking Moby `v27.5.1` as an example, the VersionMiddleware rejects:

- requests below the minimum API version, returning `client version X is too old`;
- requests above the daemon's default API version, returning `client version X is too new`.

The default boundaries of this pinned version are minimum `1.24`, default/maximum `1.47`; the minimum can also be overridden by `DOCKER_MIN_API_VERSION`. Other daemon versions must be read again from their source or `/version` response; they cannot be hardcoded for every environment.

## 4. Why it finally becomes "cannot find a Docker environment"

Testcontainers' provider strategy first executes `infoCmd().exec()`. If `/v1.32/info` fails due to version compatibility, the current strategy is recorded as failed; only when all strategies fail does the outer layer throw:

```text
Could not find a valid Docker environment. Please see logs and check configuration
```

The diagnostic order should be:

1. find the earliest HTTP request and status code in the logs;
2. determine whether the path is `/v1.32/...` or an explicit version;
3. if it is 400, read the too old/too new server body;
4. then check socket, TLS, permissions, and context;
5. only last, switch the provider strategy.

## Minimal verification matrix

Run the same minimal Testcontainers test in an isolated project, changing exactly one input at a time:

| Input                         | Expected                                                      |
| ----------------------------- | ------------------------------------------------------------- |
| Do not set `api.version`      | Request version is `1.32`                                     |
| `-Dapi.version=banana`        | unknown, silently falls back to `1.32`                        |
| `-Dapi.version=1.1`           | triggers too old on a newer daemon                            |
| `-Dapi.version=999.999`       | docker-java can parse it; triggers too new on Moby v27.5.1    |
| Set only `DOCKER_API_VERSION` | per the pinned source audit, should not replace `api.version` |

The matrix referenced on this page is a reproduction plan, not results already executed in this batch; to write it as an environment conclusion, you must keep the actual daemon version and logs.

## Common misconceptions

- **"The daemon is running, so Testcontainers must work."** The API transport can still be rejected by the daemon first.
- **"Testcontainers automatically uses the daemon's newest API."** In 1.20.6 the default unknown fallback is `1.32`.
- **"Setting `DOCKER_API_VERSION` controls docker-java."** The current pinned docker-java source does not use that environment variable.
- **"Switch the socket when you see a valid Docker environment exception."** Check the earliest API 400 first to avoid masking the root cause.
- **"1.24/1.47 are eternal boundaries."** They belong only to the pinned Moby `v27.5.1`.

## Evidence boundary

The initial source snapshot, version corrections, and unverified items are in the repo at `src/content/raw/zh-cn/testcontainers-docker-api-negotiation.md` and `testcontainers-docker-api-negotiation-correction.md`. This is not a general guarantee for all Testcontainers or Docker versions.
