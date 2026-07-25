---
title: "Knowledge Graph First, grep Second: Correcting Tool Choice with a Decision-Point Soft-Nudge Hook"
timestamp: 2026-07-22 00:00:00+08:00
series: OMP Plugin & Extension Development
tags: [OMP, Agent, Codebase, Hooks, DevOps, KnowledgeGraph]
description: "A data-driven diagnosis for AI coding agents — a fresh, complete, code-knowledge-graph that is strictly better than grep for structural lookups was reached in only 4 of 30 sessions, while grep was called 158 times. The index wasn't the problem; nothing cued the agent at the decision instant. This article walks through a non-blocking PreToolUse hook that injects a one-line nudge at the grep decision point, covering the usage audit, ranked root cause, the soft-vs-hard channel choice, path-based detection and whitelist design, and a probe-to-runtime verification ladder."
toc: true
---
