/**
 * Section aggregation seam.
 *
 * The homepage's "latest" panel, the Atom feed, and the footer all walk
 * the same list of listable sections, fetch the entries for one locale,
 * and project each entry into a surface-specific shape. Before this
 * module, the per-section fetch + parallel iteration lived inline in
 * two files (`index.astro` and `feed.xml.ts`); adding a new "most
 * recent" surface would have re-spread the duplication a third time.
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
 * `listBySections` is the seam's centrepiece. It takes an optional
 * per-entry `shape` projection; the default projects to `ContentCard`
 * (the universal listable shape consumed by the listing pages, the
 * Atom feed, the homepage latest card, and the heatmap). Custom
 * shapes let the Atom feed project each entry to `{ ...entry, link }`
 * and the footer project to the raw entry for `totalWordCount` —
 * both share the same fetch + sort pipeline as the homepage.
 *
 * The sort key is always the original entry's `data.timestamp`,
 * never the shaped item's: that way the shape adapter is free to
 * project however it wants and the post-sort is always the "newest
 * first" the i18n seam promises.
 *
 * Deletion test: removing this file re-spreads the if-ladder into
 * the homepage, the feed, the footer, and any future "recent X"
 * consumer. The re-spread is the signal this seam is earning its
 * keep.
 */
import type { CollectionEntry } from "astro:content";
import type { ListableCollection, Section } from "$utils/config";
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

/** Per-entry projection at the listable-iteration seam. Receives the raw entry, its section, and the active locale. */
export type ListableShape<T> = (entry: CollectionEntry<ListableCollection>, section: ListableCollection, locale: string) => T;

/**
 * Default per-entry projection: the lean `ContentCard`. Typed as
 * `ListableShape<ContentCard>` so the parameter default can be
 * widened to `ListableShape<T>` at the call site without changing
 * runtime behaviour for the default `T`.
 */
const cardShape: ListableShape<ContentCard> = (entry, section, locale) => toCard(entry, section, locale);

/**
 * Fetch every entry for the requested sections in one locale, project
 * each entry through `shape`, and return the merged list sorted by
 * `data.timestamp` descending.
 *
 * Fetches run in parallel (`Promise.all`); the per-entry projection
 * runs after the sort so the order is always the "newest first" the
 * i18n seam promises, regardless of what the shape adapter does.
 * The function never mutates the input entries, never falls back to
 * a different locale, and never filters drafts (the
 * `getPublishedByLocale` seam already does that).
 *
 * @param selector - `"*"` for all listable sections, or an explicit subset.
 * @param locale - The locale to fetch for; the locale-filter and monolocale shortcut both live in `getPublishedByLocale`.
 * @param shape - Optional per-entry projection. Defaults to the `ContentCard` shape so existing call sites keep working unchanged.
 * @returns Projected array sorted by `entry.data.timestamp` descending.
 */
export async function listBySections<T = ContentCard>(
	selector: SectionSelector,
	locale: string,
	shape: ListableShape<T> = cardShape as ListableShape<T>
): Promise<T[]> {
	const sections = resolveSections(selector);
	// Per-section fetches run in parallel. The (entry, section) tuple
	// stream keeps the section identity next to the entry, so the
	// post-sort projection knows the right type-label (note vs.
	// jotting) without a second `getPublishedByLocale` pass.
	const sectionEntries = await Promise.all(
		sections.map(async section => ({
			section,
			entries: (await getPublishedByLocale(section, locale)) as CollectionEntry<ListableCollection>[]
		}))
	);
	// Sort the merged tuple stream by the original entry's timestamp.
	// Sorting before the projection keeps the shape adapter free to
	// project however it wants; the order is always "newest first"
	// across sections.
	const tuples = sectionEntries.flatMap(({ section, entries }) => entries.map(entry => ({ entry, section })));
	tuples.sort((a, b) => b.entry.data.timestamp.getTime() - a.entry.data.timestamp.getTime());
	return tuples.map(({ entry, section }) => shape(entry, section, locale));
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
