# ADR 0006 — `defineContentGraphEndpoint` factory for per-content OG endpoints

- **Status**: Accepted
- **Date**: 2026-07-02
- **Deciders**: project owner (imposed by `src/utils/og-endpoint.ts`)

## Context

The two per-content Open Graph image endpoints
(`[...locale]/note/[...id]/graph.png.ts` and
`[...locale]/jotting/[...id]/graph.png.ts`) used to repeat the same
shape: `import graph`, `getStaticPaths = contentGraphStaticPaths(...)`,
`GET = async ({ params, props }) => { ... }`. The only varying pieces
were the collection id, the i18n type-label key, and the renderer
(both endpoints happened to use `$graph/content`; the site-wide
endpoint uses `$graph/default` and is shaped differently).

Adding a third listable section meant copy-paste-modifying one of
those two files. The OG endpoint shape was a per-file decision, not
a project-level seam.

## Decision

`src/utils/og-endpoint.ts` exports `defineContentGraphEndpoint(collection, typeLabelKey, renderer)`.
The factory owns:

- The `getStaticPaths` delegation to `contentGraphStaticPaths` (the
  shared seam in `src/utils/content-routing.ts`).
- The `GET` handler shape: read the locale from `params`, read the
  localised type label from `props`, build the renderer's input object
  from `config` + `props`, and return a `Response` with the right
  `Content-Type`.

Each per-content page is now a one-liner:

```ts
export const { getStaticPaths, GET } = defineContentGraphEndpoint("note", "navigation.note", graph);
```

The factory is generic over the renderer's prop shape (`P extends Record<string, unknown>`),
so the call site gets full type-safety from the renderer it passes.

## Consequences

- Adding a new listable section ("essay", etc.) is one import — the
  OG endpoint shape is owned by the factory, not re-derived per file.
- The two per-content endpoint files drop from ~25 lines each to ~10
  lines each (mostly the comment).
- The factory's `GET` handler is the single place that defines
  "how does a content-entry OG image become a PNG response". Changing
  the response shape (adding caching headers, a different content
  type, etc.) is one edit.
- The factory wraps the renderer with a typed contract; the previous
  shape was `props: any` at the call site. Type safety flows through
  the new factory.
- The site-wide OG endpoint (`/graph.png`) is left untouched — it
  uses a different renderer (`$graph/default`) and a different props
  shape, so it doesn't share the factory. Unifying the two would
  force the factory to grow an "is site-wide" discriminator that
  adds complexity for one caller; the cost outweighs the leverage.
