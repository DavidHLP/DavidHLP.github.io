# ADR 0003 — Locale-aware URL synthesis: a single `contentUrl` seam

- **Status**: Accepted
- **Date**: 2026-07-02

## Context

Every page that links to a Note or Jotting needs the locale-prefixed
URL for that entry. Before the refactor, the expression
`getRelativeLocaleUrl(locale, \`/${section}/${stripLocale(id)}\`)` was
hand-rolled in `index.astro`, the listing pages, the feed, and the
OG image endpoints. The atom feed additionally synthesised an absolute
URL with the site origin.

## Decision

`src/utils/content-fetch.ts` owns the synthesis. Two entry points:

- `contentUrl(locale, section, id): string` — relative URL, the
  Astro-aware form. Used by every page link.
- `feedLink(entry, section, locale, site): string` — absolute URL,
  site-origin aware. Used by the Atom feed.

Both go through `stripLocale(id)` so callers can pass the full
`CollectionEntry.id` without thinking about whether the locale prefix
is present. The monolocale shortcut collapses `stripLocale` to the
identity function.

## Consequences

- URL shape is a single-source policy. Changing the URL structure
  (e.g. introducing a date prefix) is one edit.
- The Atom feed is the only consumer of the absolute form. Splitting
  the two entry points keeps the relative-URL form cheap and pure.
- `contentUrl` does not consult `site.config.ts` for the URL prefix;
  Astro's `getRelativeLocaleUrl` is the single source of truth for
  prefix semantics, including the default-locale-omitted behaviour.
