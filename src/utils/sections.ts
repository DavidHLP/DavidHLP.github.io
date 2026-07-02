/**
 * Section aggregation seam.
 *
 * The homepage's "latest" panel and the Atom feed both walk the same
 * list of listable sections, fetch the entries for one locale, and
 * shape them into the lean `ContentCard` form. Before this module,
 * the if-ladder lived inline in two files (`index.astro` and
 * `feed.xml.ts`); adding a new "most recent" surface would have
 * re-spread the duplication a third time.
 *
 * `LISTABLE_SECTIONS` is the canonical, order-stable source of truth
 * for which sections the site considers "listable" (the union
 * described by `Section` in `config.ts`). The two callers agree on
 * the order because they read it from the same constant.
 *
 * `SectionSelector` is the `"*" | Section[]` shape that `site.config.ts`
 * uses for both `latest` and `feed.section`. The selector is the only
 * public knob callers pass in; the seam owns the rest.
 *
 * Deletion test: removing this file re-spreads the if-ladder into the
 * homepage and the feed (plus any future "recent X" consumer). The
 * re-spread is the signal this seam is earning its keep.
 */
import type { Section } from "$utils/config";
import { toCard, type ContentCard } from "./content-card";
import { getPublishedByLocale } from "./content-fetch";
import { latestByTimestamp } from "./latest";

/** Canonical, order-stable list of listable sections. Read by callers that need to iterate every listable section. */
export const LISTABLE_SECTIONS: readonly Section[] = ["note", "jotting"];

/** Selector for "all listable" (`"*"`) or an explicit subset. Mirrors `site.config.ts`'s `latest` / `feed.section` shape. */
export type SectionSelector = "*" | readonly Section[];

/** Resolve a `SectionSelector` to the concrete section list it represents. `"*"` expands to `LISTABLE_SECTIONS`. */
export function resolveSections(selector: SectionSelector): readonly Section[] {
	return selector === "*" ? LISTABLE_SECTIONS : selector;
}

/**
 * Fetch every entry for the requested sections in one locale, shape
 * each into a `ContentCard`, and return the merged list sorted by
 * timestamp descending.
 *
 * Fetches run in parallel (`Promise.all`); the order of `cards` is
 * then normalised by the sort. The function never mutates the input
 * entries, never falls back to a different locale, and never filters
 * drafts (the `getPublishedByLocale` seam already does that).
 *
 * @param selector - `"*"` for all listable sections, or an explicit subset.
 * @param locale - The locale to fetch for; the locale-filter and monolocale shortcut both live in `getPublishedByLocale`.
 * @returns ContentCard[] sorted by `data.timestamp` descending.
 */
export async function listBySections(selector: SectionSelector, locale: string): Promise<ContentCard[]> {
	const sections = resolveSections(selector);
	// Per-section fetches run in parallel; the per-entry projection to
	// `ContentCard` runs inside the same async pass so the post-sort sees
	// a flat, already-typed array.
	const cardArrays = await Promise.all(
		sections.map(async section => {
			const entries = await getPublishedByLocale(section, locale);
			return entries.map(entry => toCard(entry, section, locale));
		})
	);
	return cardArrays.flat().sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
}

/**
 * Fetch + shape + pick the most recent card across the requested
 * sections for one locale. Returns `undefined` when no entry exists.
 *
 * Convenience wrapper for surfaces that want exactly one card (the
 * homepage's `<LatestCard />`). For multi-item surfaces, use
 * `listBySections` and slice/iterate directly.
 */
export async function latestCard(selector: SectionSelector, locale: string): Promise<ContentCard | undefined> {
	return latestByTimestamp(await listBySections(selector, locale));
}
