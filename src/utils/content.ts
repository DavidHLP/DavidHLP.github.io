/**
 * Barrel re-export for the locale-aware content seam.
 *
 * The actual implementations live in focused modules:
 *
 * - `content-routing.ts` — `getStaticPaths` builders + `buildEntryParams` seam
 * - `content-fetch.ts`   — entry fetch, locale strip, URL synthesis
 * - `content-card.ts`    — `ContentCard` shape and `toCard` / `feedLink`
 * - `content-facets.ts`  — facet and word-count aggregations
 * - `og-paths.ts`        — OG image `getStaticPaths` + display date
 * - `latest.ts`          — pure `latestByTimestamp` over a pre-built card pool
 * - `sections.ts`        — listable section aggregation: `listBySections` (async,
 *                          accepts an optional per-entry shape adapter) and
 *                          `latestCard` (one-card convenience)
 * - `preface.ts`         — preface aggregation: `listPrefaces` (sort by
 *                          timestamp desc) and `latestPreface` (one-entry
 *                          convenience for the homepage)
 *
 * This file exists so existing call sites (`import { ... } from "$utils/content"`)
 * keep working unchanged. New code should import from the focused module
 * so the seam-narrowing benefit is visible at the call site.
 */
export type { Section, ContentCollection, ListableCollection } from "$utils/config";
export { monolocale } from "$config";
export { localeStaticPaths, contentStaticPaths, buildEntryParams, type EntryParams } from "./content-routing";
export { getPublishedByLocale, stripLocale, contentUrl, infoKey, getInfoEntry } from "./content-fetch";
export type { ContentCard } from "./content-card";
export { toCard, feedLink } from "./content-card";
export { collectFacets, totalWordCount } from "./content-facets";
export { contentGraphStaticPaths, toDisplayDate } from "./og-paths";
export { latestByTimestamp } from "./latest";
export { LISTABLE_SECTIONS, listBySections, latestCard, resolveSections } from "./sections";
export type { SectionSelector, ListableShape } from "./sections";
export { listPrefaces, latestPreface } from "./preface";
