---
title: "Treat a Modular Monolith as a Testbed: UltiCode Core's Allowlist, Timeouts, and Close-Once Lifecycle"
timestamp: 2026-09-09 00:00:00+08:00
series: "Architecture and Engineering Practice"
kind: concept
status: provisional
sources: ["ulticode-reliability-core-f801a1076"]
related: ["ulticode", "ulticode-owner-and-facts", "ulticode-generation-attempt-fence"]
tags: [UltiCode, ModularMonolith, Lifecycle, ClassLoader, Allowlist, FailClosed, Testing, LLM]
description: "How UltiCode Core's owner-context manager uses opt-in, an allowlist, bounded startup, and close-once handoff to keep a modular monolith a reversible topology testbed."
toc: true
---

> **Evidence status**: This article is based on UltiCode's Core registry, owner-context manager, classloader, smoke/lifecycle tests, and architecture documents at a fixed commit. The current implementation limits Core to an opt-in, allowlist-driven experimental profile; this article does not describe it as a production modular monolith covering every business path.

When multiple modules are placed in one JVM, the first problem is often not deployment count but verification: can owner wiring, port contracts, startup order, and stop behavior be checked without starting the entire distributed topology?

But creating one ApplicationContext per module does not automatically produce a safe modular monolith. A child context can hang during startup; the parent may mark it failed while a background thread creates resources later; timeout and normal paths may both call close(). If every module starts by default, the experiment itself can change the default topology and failure radius.

The useful part of UltiCode's Core mechanism is that it does not turn this profile into another default runtime mode. It narrows it into a bounded testbed: disabled by default, explicitly allowlisted, bounded at startup, represented by explicit states, and governed by close-once resource handoff.

## What a naive multi-context design is missing

The most direct implementation would iterate over modules, submit one startup task, wait with a timeout, and close the context on failure:

```java
for (Module module : modules) {
    executor.submit(() -> start(module));
}

if (!future.get(timeout, MILLISECONDS)) {
    context.close();
}
```

This pseudocode hides several races:

- when timeout occurs, the background task may not yet have decided whether it created a context;
- the timeout thread and startup thread may both believe they own cleanup;
- after the parent returns, a late context may still become READY;
- stopping a thread does not mean the Spring context, classloader, or executor is closed;
- package-name isolation alone cannot prevent reuse of a class from the parent classpath.

The Core problem is therefore not “start several Spring Boots.” It is ownership of every resource created by one startup attempt: who creates it, who closes it, and when its result has become stale.

## First boundary: do not start by default; let the registry provide the allowlist

[CoreModuleRegistry](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/core/src/main/java/com/ulticode/core/CoreModuleRegistry.java) currently marks Auth and Admin as enabled, while App, Submission, Notification, and Search remain disabled. CoreOwnerContextManager is also controlled by the core.owner-contexts.enabled opt-in setting, whose default is false.

These two switches are not duplicates:

```text
Core profile enabled?       -> is the experimental path allowed?
Registry allowlist enabled? -> which owners are eligible to start?
```

A module enters the startup queue only when both conditions hold. This addresses a practical risk: adding a new owner definition in the future must not change the default deployment topology merely because the module was discovered.

It also explains why the design does not “try to start every module by default and hide failures.” Hiding failures turns missing dependencies, port conflicts, or bad scanning into a half-working state. An allowlist makes the range an explicit safety upper bound.

## Second boundary: express lifecycle as a state machine

CoreOwnerContextManager uses explicit states for an owner context:

```text
DISABLED
   │ opt-in + allowlist
   ▼
STARTING ───────────────┐
   │                    │ timeout / exception
   ▼                    ▼
 READY                 FAILED
   │ stop                │ stop/cleanup
   └───────────────► STOPPED
```

The value of these states is rejecting the vague rule “a non-null context is ready.” A context that was created with missing dependencies cannot be treated as available by a business entry point; an owner that timed out cannot become READY because a background task returned late.

Core smoke tests turn default-disabled behavior, a 503 when readiness is not available, and fail-closed behavior when required Judge dependencies are missing into observable behavior. The 503 is not a business feature; it prevents “not ready” from being disguised as an empty response or partial success.

## Third boundary: a timeout must hand off close ownership, not only throw

Starting a context creates resources that must be reclaimed: the Spring context, threads, classloader, and possibly open connections. After a timeout, the most dangerous outcome is two executors cleaning up at once—or nobody cleaning up.

UltiCode uses an atomic handoff state such as TIMEOUT_CLAIMED to assign close responsibility for one startup attempt to exactly one of three possible executors:

```text
startup attempt
       │
       ├── startAll caller completes first -> caller closes/owns result
       ├── timeout path wins              -> timeout path closes
       └── late callable creates context  -> late callable closes
```

Each startup attempt should close resources zero or one time: zero when no context was created, exactly once after creation. Normal completion, a late return after timeout, interruption, and stop during startup must follow the same ownership-handoff rule instead of adding an ad hoc close() in every exception branch.

This is narrower but more reliable than “close everything in finally.” finally guarantees cleanup when one call stack exits; it cannot decide whether another concurrent call stack has already taken ownership of the same resource.

## A ClassLoader is not a security boundary

[CoreOwnerClassLoaders](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/core/src/main/java/com/ulticode/core/CoreOwnerClassLoaders.java) uses parent-first loading. It can assist resource loading and modular organization, but parent-first means a same-named class may be reused from the parent classpath. It is not security isolation and cannot by itself prove dependency-version isolation.

The real boundaries remain explicit:

- the Registry allowlist decides which owners may start;
- child contexts use an explicit component-scan range;
- the Core profile disables unnecessary Web, Flyway, Dubbo, and other auto-start surfaces;
- data sources, Redis, and adapters use owner-specific configuration;
- readiness fails closed when dependencies are not ready.

This is why the architecture document keeps Core's current status OPEN and records parent-first classpath and overlapping-scan problems in exec-jar scenarios. A convenient classloader scheme must not be presented as complete module isolation.

## Why not split directly into independent processes

Independent processes provide stronger dependency, thread, and failure isolation, and are usually easier to reason about from resource-limit and release perspectives. But their verification cost is higher: a complete network topology, registry, database, and configuration must start before cross-owner wiring can be tested.

Core is best positioned as a low-cost complement. With the default distributed profile unchanged, a small set of owners may start in one JVM to check context lifecycles and controlled topology combinations. This is not a contest over which deployment model is “more advanced”; it separates a verification profile from a production profile.

If Core begins to carry every business HTTP/WS journey, scan every owner automatically, share arbitrary data sources, or become the default startup path, it is no longer the same problem. Independent processes, container boundaries, and real module-dependency isolation should then be reconsidered.

## What this design actually solves

- **Default topology does not drift**: Core opt-in plus the Registry allowlist prevents new modules from entering the runtime path automatically.
- **Startup failure is visible**: the state machine and fail-closed readiness do not treat half-started state as success.
- **Concurrent cleanup is provable**: close responsibility for one startup attempt has one explicit owner.
- **Experiment cost is bounded**: some owner wiring can be tested in one process without changing the distributed default.
- **Tests target real races**: timeout-after-done, interruption, stop during startup, and thread leaks have corresponding boundary-test entry points.

It does not solve parent-classpath dependency conflicts, true security isolation, every business journey, cross-process network failures, production capacity under traffic, or automatic conversion of every owner into an embeddable module. Core is a lifecycle and topology testbed, not proof that microservices become modular automatically.

## Cost, fit, and failure boundaries

This bounded testbed is useful when a team needs to verify the assembly of a few modules quickly without starting the full distributed environment. The prerequisites are explicit opt-in, a finite allowlist, a timeout for every child context, and acceptance that parent-first classloading is not a security boundary.

The costs include a state machine, thread pool, resource handoff, race tests, and a configuration matrix. When there are many modules, severe dependency-version conflicts, or tests that must cover real network/isolation behavior, putting everything in one JVM may increase rather than reduce understanding.

Three failure patterns are especially easy to miss:

1. Testing only “startup succeeds” without testing late return after timeout, allowing a context leak or an invalid READY state.
2. Using an allowlist without limiting scanning, data sources, or external clients, which merely moves cross-owner dependencies into one process.
3. Treating a Core smoke test as production validation and ignoring the documented OPEN status and uncovered HTTP/WS journeys.

## Applying the model to LLM/Agent systems

An Agent runtime may also run multiple providers, tool plugins, or task contexts at once. The portable lesson is not “give every plugin a classloader.” It is three rules: experimental capabilities are disabled by default; an allowlist decides which tools may load; every start, cancellation, and timeout has one owner for resource closure.

Cancellation races matter especially here. A tool call may time out while its background provider returns later. As with Core's late callable, the late result must belong to an invalidated attempt, and only one path may reclaim the context, connection, and temporary files.

## Minimal verification path

Read [CoreModuleRegistry](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/core/src/main/java/com/ulticode/core/CoreModuleRegistry.java) and [CoreOwnerContextManager](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/core/src/main/java/com/ulticode/core/CoreOwnerContextManager.java) first to confirm opt-in, allowlist, state, and timeout. Then inspect [CoreOwnerClassLoaders](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/core/src/main/java/com/ulticode/core/CoreOwnerClassLoaders.java) to ensure parent-first loading is not mistaken for security isolation, and finally read [CoreApplicationSmokeTest](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/core/src/test/java/com/ulticode/core/CoreApplicationSmokeTest.java) and [CoreOwnerContextManagerLifecycleTest](https://github.com/DavidHLP/UltiCode/blob/f801a1076b2fa9aa06ce3d63821f0778b477042c/services/core/src/test/java/com/ulticode/core/CoreOwnerContextManagerLifecycleTest.java).

This Core analysis used source, architecture documents, and test entry points for static review. It did not rerun the Core Maven tests, and it does not turn the existence of smoke/lifecycle test files into proof of production execution. What can be confirmed is the design boundary and test intent, not successful startup of every module.

