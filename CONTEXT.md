# Ubiquitous Language — ThoughtLite blog

Single source of truth for the terms this project uses. Every architectural
review, ADR, code comment, and PR summary should use the words below in
the sense below. If a term is missing, add it here before introducing it
in code.

The architecture vocabulary (module, interface, seam, adapter, depth,
leverage, locality) is defined separately in the agent skill's
`LANGUAGE.md` and is not duplicated here.

## Content sections (publications)

A **section** is one of the four top-level content collections the site
publishes. Two are listable (paginated cards in the index view), two are
single-document (rendered inline). The TypeScript alias `Section` covers
only the listable pair.

| Section      | Code id        | Listable | Frontmatter namespace             |
| ------------ | -------------- | -------- | --------------------------------- |
| 文记 (Note)  | `note`         | yes      | `src/content/note/{locale}/*.md`   |
| 随笔 (Jotting) | `jotting`    | yes      | `src/content/jotting/{locale}/*.md`|
| 序文 (Preface) | `preface`    | no       | `src/content/preface/{locale}/*.md`|
| 说明 (Information) | `information` | no | `src/content/information/{locale}/*.{md,mdx,yaml}` |

The **information** collection holds four named documents per locale:
`introduction`, `policy`, `linkroll` (MDX), `chronicle` (YAML).

The full collection union is the type alias `ContentCollection`; the
listable subset is the type alias `ListableCollection`. Both live in
`src/utils/config.ts` alongside the public `Section` alias.

## Locale

A **locale** is a hyphenated BCP-47-ish code the site supports. The
project ships with `en`, `zh-cn`, `ja`. The configured `defaultLocale` is
rendered at the URL root; the other locales appear as a path segment.

The flag `monolocale = (config.i18n.locales.length === 1)` flips two
pieces of routing behaviour: entry ids lose their locale prefix, and
`getRelativeLocaleUrl` is bypassed in some adapters.

A **fallback locale** is the locale the i18n seam consults when a key is
missing in the active locale. The fallback chain is one step only: if
the fallback locale is also missing, `t(...)` returns `undefined`. The
default fallback is `config.i18n.defaultLocale` and is set on the seam
itself; per-page fallbacks are not supported.

## Card

A **ContentCard** is the lean shape consumed by the listing page
(`ContentList.svelte`), the Atom feed, and the homepage's `<LatestCard />`.
The `section` field on the card records the publication the card came
from; the listing pages and feed already know their section from the
collection they fetched, so the field is unused by them — but the
homepage's "latest" pick needs it to know whether the most-recent entry
is a Note or a Jotting. The shape and its `toCard` / `feedLink` adapters
live in `src/utils/content-card.ts`; adding a card field is one edit
there instead of three.

## Facet

A **facet** is an aggregate dimension over a section: the set of
distinct `series` strings and the set of distinct `tags` strings, sorted
alphabetically. Surfaced as filter buttons in the listing sidebar.

## Latest

The **latest** card on the homepage is the most recent published entry
across the configured `config.latest` sections. The aggregation
("fetch notes + jottings, shape into a card pool, pick the most recent
by `data.timestamp`") lives in `src/utils/latest.ts` as `latestByTimestamp`.
The card markup lives in `src/components/LatestCard.astro`. The page
wires the two together: shape the pool via `toCard`, call
`latestByTimestamp`, render with `<LatestCard />`.

## Seam vocabulary (this project)

| Module file                    | Responsibility                                                |
| ------------------------------ | ------------------------------------------------------------- |
| `src/utils/config.ts`          | site-config type, `Section` / `ContentCollection` / `ListableCollection` aliases, pass-through validator |
| `src/utils/content-routing.ts` | `getStaticPaths` builders for locale and content detail routes |
| `src/utils/content-fetch.ts`   | locale-aware entry fetch, locale-prefix strip, URL synthesis  |
| `src/utils/content-card.ts`    | `ContentCard` shape and `toCard` / `feedLink` adapters        |
| `src/utils/content-facets.ts`  | facet aggregation + word-count aggregation                    |
| `src/utils/og-paths.ts`        | OG image `getStaticPaths` + display-date helper               |
| `src/utils/latest.ts`          | homepage-specific `latestByTimestamp` aggregation            |
| `src/utils/labels.ts`          | pure label formatting (section index, sentinel fallback)     |
| `src/utils/id-hash.ts`         | short, stable content-id hash                                  |
| `src/utils/time.ts`            | `Temporal`-based date/time formatting                         |
| `src/utils/reading.ts`         | remark plugin: word count for `frontmatter.words`             |
| `src/utils/mermaid.ts`         | remark plugin: transform `mermaid` code blocks into `<div>`   |
| `src/utils/heatmap-bins.ts`     | heatmap bin strategy: one pipeline, three adapters (day / week / month); `getStrategy(unit)`, `toHeatmapEntries(notes, jottings, locale)` |
| `src/i18n/index.ts`            | `i18nit(locale, ns, options?)` returns a `t(key)` translator; `i18nData(locale, ns, options?)` returns a merged dictionary honouring `options.fallbackLocale` |
| `src/graph/render.ts`          | shared satori → sharp → PNG pipeline (`renderOg`)             |
| `src/graph/default.ts`         | site-wide OG VDOM template (also exported as `template` for tests) |
| `src/graph/content.ts`         | per-entry OG VDOM template (also exported as `template` for tests) |
| `src/components/LatestCard.astro` | homepage "latest release" card; consumes a `ContentCard` + locale |

## Top-level invariants

- **Default locale is URL-omitted.** Both `astro.config.ts` (`prefixDefaultLocale: false`) and every `getStaticPaths` builder agree on this. The same default locale appears at the URL root across all four content sections.
- **Entry ids carry the locale.** In multi-locale mode, an entry id is `{locale}/{slug}`; the slice is consumed by `stripLocale` and `contentUrl`. The `monolocale` shortcut removes the slice and the strip step.
- **Seam-policy lives at the seam.** i18n fallback policy is set on `i18nit(...)` via the `fallbackLocale` option and on `i18nData(...)` via the same option (deep-merged under the active dictionary), not at every call site. `t(...)` returns `string | undefined`; visible UI strings narrow with the `ts(t, key)` helper from `src/utils/labels.ts` (sentinel fallback to the key) and config-side fallbacks compose explicitly with `t(key) ?? configValue` at the call site.
- **The listing-card shape has a single home.** `ContentCard` (with its `section` field set by `toCard`) is the shape consumed by `ContentList.svelte`, the Atom feed, and `<LatestCard />`. Adding a card field is one edit in `src/utils/content-card.ts`.
