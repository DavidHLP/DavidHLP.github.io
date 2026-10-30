---
title: "UltiCode Docker Sandbox: Resource Isolation and Infrastructure Error Classification"
timestamp: 2026-09-09 00:00:00+08:00
series: "Architecture and Engineering Practice"
kind: concept
status: provisional
sources: ["ulticode-engineering-highlights-f801a1076"]
related: ["ulticode"]
tags: [UltiCode, OnlineJudge, Docker, Seccomp, Sandbox, ResourceLimit, ErrorHandling, LLM]
description: "What UltiCode's D-form execution path says about Docker resource and security parameters, fail-closed seccomp handling, and the distinction between user and infrastructure errors."
toc: true
---

> **Evidence status**: This article is based on UltiCode's current Docker executor, error classifier, and sandbox tests at a fixed commit. It shows explicit isolation and classification boundaries; it is not a complete container-escape audit or production security proof.

The challenge in running user code is not merely starting a process. The code must not easily affect host resources, and the platform must know whether “the user code failed” or “Docker/the host failed.” If both failures become the same Runtime Error, the system cannot give the right user feedback or decide whether infrastructure should be retried.

## The D-form execution path

The D-form path of [SandboxExecutorImpl](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/submission/sandbox/executor/SandboxExecutorImpl.java):

1. resolves the language profile and effective resource limits;
2. creates a temporary job workspace;
3. writes read-only `input.json` and workspace contents;
4. starts Docker through the lifecycle runner;
5. parses the result envelope;
6. attempts to clean the job directory in `finally`.

## Security and resource parameters are explicit

The current Docker command includes:

```text
--network none
--cap-drop ALL
--read-only
--user 1000:1000
--security-opt no-new-privileges
--security-opt seccomp=<resolved profile>
--memory <effective limit>
--cpus <effective limit>
--pids-limit <effective limit>
--ulimit nofile=128:128
--tmpfs /tmp:rw,exec,size=64m
<workspace>:/workspace:ro
--rm
```

Together, these parameters create layered boundaries around networking, Linux capabilities, the filesystem, user identity, process count, file descriptors, and CPU/memory. A seccomp profile resolution failure does not silently remove the filter; the error is preserved so Docker returns an explicit configuration failure.

This is fail-closed behavior: when configuration is incomplete, execution is rejected instead of treating “it runs for now” as evidence that isolation is still valid.

## Classification matters more than one `FAILED`

[SandboxOutcomeClassifier](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/submission/sandbox/SandboxOutcomeClassifier.java) distinguishes:

| Symptom | Classification |
|---|---|
| The process itself fails to start | launch failure |
| exit code 137 | out of memory |
| exit code 125 | OCI/daemon error |
| `Cannot fork`, pids, `RLIMIT_NPROC` | fork limit |
| The compiler rejects the code | compile error |
| Other non-zero exits | runtime error |

Thus, a Docker daemon that did not create a container, an invalid seccomp path, or insufficient host pids is not disguised as an ordinary user-program runtime error. The classification should also remain consistent with monitoring, retries, and user messaging; otherwise the classifier is only a pretty enum.

## The security boundary still needs an honest description

These parameters are meaningful protection layers, but source reading cannot prove “escape is completely prevented.” Real security conclusions require dedicated tests and audits against the target Docker version, kernel, image, Rootless/remote daemon, and permission configuration. This article confirms the presence of fail-closed parameters and infrastructure-error classification in the implementation.

## Applying the model to LLM/Agent systems

Model-generated code, plugins, and tool scripts should be treated as untrusted execution input. In addition to container isolation, they need explicit limits for files, network, processes, time, and output size. Provider/permission rejections must also be separated from model-generation errors, so the Agent can tell whether to change the input, request authorization, or retry infrastructure.

## Minimal verification path

Read [SandboxExecutorImpl.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/submission/sandbox/executor/SandboxExecutorImpl.java) and [SandboxOutcomeClassifier.java](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/main/java/com/ulticode/modules/submission/sandbox/SandboxOutcomeClassifier.java), then inspect [SandboxExecutorImplForkDetectionTest](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/test/java/com/ulticode/modules/submission/sandbox/executor/SandboxExecutorImplForkDetectionTest.java) and [SandboxExecutorImplSeccompResolutionTest](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/judge-runtime/src/test/java/com/ulticode/modules/submission/sandbox/executor/SandboxExecutorImplSeccompResolutionTest.java).

