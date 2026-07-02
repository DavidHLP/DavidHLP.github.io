/**
 * Preface aggregation seam.
 *
 * The homepage's "preface" panel and the preface archive page both
 * walk the same preface collection, fetch the entries for one locale,
 * and sort by `data.timestamp` descending. Before this module, the
 * sort lived inline in two files (`index.astro` and `preface.astro`);
 * a third "most recent preface" surface would have re-spread the
 * duplication.
 *
 * Preface is intentionally not in `LISTABLE_SECTIONS` (per
 * `CONTEXT.md`): it is a single-document publication, never paginated,
 * and the listing-card shape (`ContentCard`) does not apply. The
 * preface iteration is its own seam so the listable surface stays
 * tight.
 *
 * `listPrefaces` returns the full preface pool for one locale,
 * sorted newest-first; `latestPreface` is the one-entry convenience
 * consumed by the homepage's "preface" panel.
 *
 * The function clones the fetch result before sorting so the seam is
 * pure over its input: the array returned by `getPublishedByLocale`
 * is left untouched. (JavaScript's `Array.prototype.sort` mutates
 * in place; the seam owns the immutability contract per the project
 * immutability rule.)
 *
 * Deletion test: removing this file forces the homepage and the
 * preface archive to re-derive the same sort + take-0 decision
 * inline. The re-spread is the signal this seam is earning its
 * keep.
 */
import type { CollectionEntry } from "astro:content";
import { getPublishedByLocale } from "./content-fetch";

/**
 * Fetch every published preface entry for the given locale, sorted
 * by `data.timestamp` descending.
 *
 * The fetch goes through `getPublishedByLocale` so the locale-filter
 * and monolocale shortcut live in one place; the function adds the
 * sort. The function never mutates the input entries, never falls
 * back to a different locale, and never filters drafts (the
 * `getPublishedByLocale` seam already does that).
 *
 * @param locale - The locale to fetch for.
 * @returns Preface entries sorted by `data.timestamp` descending.
 */
export async function listPrefaces(locale: string): Promise<CollectionEntry<"preface">[]> {
	const entries = await getPublishedByLocale("preface", locale);
	// Clone before sort so the input array stays in its original
	// order (the project immutability rule: never mutate input).
	// `Array.prototype.sort` is in-place, so a direct `.sort` would
	// reorder the array returned by `getPublishedByLocale`, breaking
	// the seam's contract.
	return entries.slice().sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
}

/**
 * Fetch + sort + pick the most recent preface for the given locale.
 * Returns `undefined` when no preface exists.
 *
 * Convenience wrapper for the homepage's preface panel. The full
 * list lives in `listPrefaces` for any future multi-entry surface.
 */
export async function latestPreface(locale: string): Promise<CollectionEntry<"preface"> | undefined> {
	return (await listPrefaces(locale))[0];
}
