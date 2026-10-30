# ADR 0001 — Monolocale shortcut: skip the locale prefix when only one locale is configured

- **Status**: Accepted
- **Date**: 2026-07-02
- **Deciders**: project owner (imposed by `astro.config.ts` & `site.config.ts`)

## Context

Astro's content collections give every entry an id that includes its
folder path. With our convention `src/content/{section}/{locale}/{slug}.md`
the id becomes `{locale}/{slug}`. Every page route, every URL builder,
and the feed link all have to strip and re-attach the locale prefix.

A user who only ever publishes one locale (e.g. `zh-cn` only) would
otherwise pay for a prefix that adds no information: `/zh-cn/about`
should be `/about`.

## Decision

When `config.i18n.locales.length === 1`, the seam exports a single
boolean `monolocale = true`. Every helper that touches an entry id
short-circuits when `monolocale`:

- `contentStaticPaths` returns `params.id = entry.id` (no slice).
- `getPublishedByLocale` accepts the locale arg but ignores it.
- `stripLocale` returns the id unchanged.
- `infoKey` returns the slug without a locale prefix.
- `contentUrl` does not call `getRelativeLocaleUrl`.

The flag is computed once in `src/utils/content.ts` and re-exported from
`$utils/content` so every downstream module reads the same value.

## Consequences

- Adding a second locale flips the flag automatically. The seam either
  takes the new shape silently (because the slice now exists) or, more
  likely, breaks loudly — entry ids and URL builders assume the slice
  exists. Migration requires a content re-org: rename every
  `src/content/{section}/{slug}.md` to `src/content/{section}/{locale}/{slug}.md`.
  This is acceptable because adding a locale is a deliberate, infrequent
  decision.
- Tests for the routing helpers must cover both modes; the monolocale
  branch is the simpler case and runs first in the test suite.
- The shortcut is exposed (not buried) so the `astro.config.ts`
  `prefixDefaultLocale: false` and the `monolocale` flag agree at the
  call site, not just by coincidence.
