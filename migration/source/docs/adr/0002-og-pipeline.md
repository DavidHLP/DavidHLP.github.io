# ADR 0002 — Shared Open Graph pipeline behind two VDOM templates

- **Status**: Accepted
- **Date**: 2026-07-02

## Context

The site emits two kinds of Open Graph images: a site-wide default card
and a per-entry card (Note / Jotting detail pages). Both go through
`@resvg/resvg`-style rasterisation via satori → sharp. Both need a
locale-keyed font. The original implementation duplicated the pipeline
in `graph/default.ts` and `graph/content.ts`: same `satori` call, same
sharp resize, same PNG output, same 1200×630 canvas.

## Decision

The pipeline lives once in `src/graph/render.ts` and exposes one entry
point, `renderOg<P>(template, props)`. The two VDOM templates are pure
data: a function that turns a typed `props` object into a satori VNode
tree. The favicon is base64-encoded once at module load (`ICON_DATA_URL`)
and reused by every template.

The font registry lives in `src/graph/load-font.ts`. It exposes
`loadFont(locale, source?)`; the registry is a `Record<Locale, FontSource>`
in `site.config.ts` (the `ogFonts` key).

## Consequences

- Adding a new OG card shape = one new template file. The pipeline does
  not move.
- Two adapters at the seam: the production HTTP/font loader and the
  in-memory loader used by unit tests (Phase 6 of the architecture
  review).
- Templates are pure: trivially snapshot-testable, trivially
  re-renderable. The seam for "what does the card look like" is the
  template, not the pipeline.
- The ICON_DATA_URL is a process-global constant; if the favicon
  ever becomes theme-aware this is the only line that has to change.
