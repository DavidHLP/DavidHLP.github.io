# ADR 0005 — `ContentCard[]` is the universal listable shape

- **Status**: Accepted
- **Date**: 2026-07-02
- **Deciders**: project owner (imposed by `src/utils/content-card.ts` + the listing / feed / heatmap / homepage consumers)

## Context

The listable content publications (Note, Jotting — and any future listable)
feed four surfaces: the per-section listing pages, the Atom feed, the
homepage's `<LatestCard />`, and the homepage's `<Heatmap />`. Three of the
four consumed the `ContentCard` shape via the `toCard` adapter; the fourth
(the heatmap) defined its own `HeatmapEntry` type and its own
`toHeatmapEntries` adapter that ran in parallel. The pre-deepening heatmap
took two parallel raw-entry inputs (`{ notes, jottings }`) and re-shaped
them on the consumer side, duplicating the `toCard` work.

A second duplication lived at the homepage: the page fetched `notes` and
`jottings` separately for the heatmap and re-fetched them via `latestCard`
for the latest card. The two fetches produced the same data twice.

## Decision

`ContentCard` (defined in `src/utils/content-card.ts` via the `toCard`
adapter) is the universal listable shape. The four surfaces all consume
`ContentCard[]` and never re-shape raw entries inline:

- The listing pages (`[...locale]/note/index.astro`, `[...locale]/jotting/index.astro`): `toCard` over the fetched entries.
- The Atom feed (`[...locale]/feed.xml.ts`): `feedLink` (an absolute-URL adapter on the same shape).
- The homepage latest card: `latestByTimestamp(listBySections(...))`.
- The homepage heatmap: same `ContentCard[]` pool as the latest card.

The `HeatmapEntry` type and `toHeatmapEntries` adapter are deleted.
`Heatmap.astro`'s Props interface is now `{ locale, cards: ContentCard[] }`
instead of `{ locale, notes, jottings }`. The `HeatmapBinStrategy`
interface gains a `showEntryTitles: boolean` discriminator so the
popup-rendering template (list vs. count) lives at the strategy seam
rather than leaking `unit === "month"` into the component.

The homepage fetches the listable card pool once via `listBySections`
and reuses it for both the latest pick and the heatmap. `latestCard`
(one-card convenience) is retained as a public seam for any future
single-card surface; the homepage no longer needs it because it
already has the pool.

## Consequences

- Adding a field to `ContentCard` automatically enriches every listable
  surface. The pre-deepening version required editing `ContentCard` and
  `HeatmapEntry` in lockstep.
- The homepage's data flow is "fetch once, shape once, pick latest, hand
  the rest to the heatmap" — change happens in one place.
- `Heatmap.astro` no longer branches on `unit` for the popup template.
  A fourth `HeatmapUnit` only needs to set `showEntryTitles` on its
  strategy.
- The "what is a listable surface" knowledge is concentrated in
  `ContentCard` and the `Section` alias. A new listable collection
  ("essay", etc.) becomes: add a Zod schema, register the collection,
  extend `Section`, list the new section in `LISTABLE_SECTIONS`. The
  four surfaces all adopt it for free.
