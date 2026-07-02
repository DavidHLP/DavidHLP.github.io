/**
 * Barrel re-export for the locale-aware content seam.
 *
 * The actual implementations live in five focused modules:
 *
 * - `content-routing.ts` — `getStaticPaths` builders
 * - `content-fetch.ts`   — entry fetch, locale strip, URL synthesis
 * - `content-card.ts`    — `ContentCard` shape and `toCard` / `feedLink`
 * - `content-facets.ts`  — facet and word-count aggregations
 * - `og-paths.ts`        — OG image `getStaticPaths` + display date
 *
 * This file exists so existing call sites (`import { ... } from "$utils/content"`)
 * keep working unchanged. New code should import from the focused module
 * so the seam-narrowing benefit is visible at the call site.
 */
export type { Section, ContentCollection, ListableCollection } from "./content-types";
export { monolocale } from "$config";
export { localeStaticPaths, contentStaticPaths } from "./content-routing";
export { getPublishedByLocale, stripLocale, contentUrl, infoKey, getInfoEntry } from "./content-fetch";
export type { ContentCard } from "./content-card";
export { toCard, feedLink } from "./content-card";
export { collectFacets, totalWordCount } from "./content-facets";
export { contentGraphStaticPaths, toDisplayDate } from "./og-paths";
