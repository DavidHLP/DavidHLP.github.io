---
title: "Shipping Hook Status into OMP's Top Border: A Full March from Misdiagnosis to Source Patch"
timestamp: 2026-07-25 00:00:00+08:00
series: OMP Plugin & Extension Development
tags: [OMP, Agent, Hooks, TUI, DevOps, Plugin, Extension]
description: "It started as a simple request — surface the GitHub write gate (GH-gate) status on OMP's statusline. The real answer scattered across four layers: a rendering channel that already worked but was overlooked, a hardcoded segment whitelist, a correctly identified 'false requirement,' and a five-file patch ultimately bound for upstream. This post records the full march — replacing user screenshots with tmux pseudo-terminal evidence, recognizing a config dead end, why the session_name piggyback was rejected, how border overflow budgets evict the new segment first, and how truncation rescues it."
toc: true
---
