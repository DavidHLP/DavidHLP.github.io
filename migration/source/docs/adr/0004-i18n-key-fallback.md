# ADR 0004 — i18n `t()` returns `string | undefined`; fallback policy lives on the seam

- **Status**: Accepted
- **Date**: 2026-07-02

## Context

The original `i18nit(locale, namespace)` returned a `t(key)` function
that, on a missing key, returned the key string itself. Callers had to
recognise the key as a sentinel — `t("home.prologue")` returning
`"home.prologue"` meant "no entry found". The codebase had already
invented `tOr(t, key, fallback?)` in `utils/labels.ts` solely to paper
over the leak: every `tOr` call site compared the return to the key
and picked a fallback if they matched.

The seam was not owning its own fallback policy. The fallback lived at
every call site, with N different shapes (some pages hard-coded a
string, some read from `site.config.ts`).

## Decision

`i18nit` accepts an `options` object: `i18nit(locale, namespace?, options?)`.
The only option today is `fallbackLocale`, defaulting to
`config.i18n.defaultLocale`. `t(key)` returns `string | undefined`:

- `string` — the entry exists in the active locale.
- `undefined` — the entry is missing in the active locale **and** in
  the configured fallback locale.

Callers narrow with `t(...) ?? defaultValue` at the call site, or use
the section-label helper in `utils/labels.ts` which is now the only
user-facing form helper.

`utils/labels.ts` keeps `sectionLabel` (a pure formatting helper that
already had nothing to do with the leak) but loses `tOr` entirely.

## Consequences

- The seam is the single source of fallback policy. Adding a third
  locale fallback chain is one change in `i18nit`, not N changes in
  pages.
- A missing key is no longer a string sentinel. `t(...)` calls
  flow through TypeScript's `string | undefined` narrowing, so the
  compiler catches every site that forgot to handle a miss.
- Pluralization (already supported via `Intl.PluralRules`) is
  preserved; the change is purely about the missing-key case.
- The `tOr` band-aid is gone. The `tOr` function and its tests
  become unnecessary.
