/**
 * Facet and word-count aggregations over listable entries.
 *
 * `collectFacets` builds the sorted, deduplicated series + tag sets
 * that the listing sidebar filters on. `totalWordCount` sums the
 * `frontmatter.words` field that the `remark-reading` plugin writes.
 *
 * Both helpers take already-fetched entries, never mutate them, and
 * never touch the filesystem: they are pure over their input.
 *
 * Deletion test: deleting this file forces the listing pages and the
 * footer to re-derive the same aggregations inline. The re-spread is
 * the signal this seam is earning its keep.
 */
import type { CollectionEntry } from "astro:content";
import { render } from "astro:content";
import type { ListableCollection } from "./content-types";

/** Aggregate sorted series + tag facets over a collection of listable entries. */
export function collectFacets<C extends ListableCollection>(
	entries: CollectionEntry<C>[],
	includeSeries: boolean = false
): { series: string[]; tags: string[] } {
	const tags = Array.from(new Set(entries.flatMap(entry => entry.data.tags).filter((tag): tag is string => Boolean(tag)))).sort();
	const series = includeSeries
		? Array.from(new Set(entries.map(entry => (entry.data as { series?: string }).series).filter((s): s is string => Boolean(s)))).sort()
		: [];
	return { series, tags };
}

/** Sum the `words` frontmatter over a collection of listable entries. */
export async function totalWordCount<C extends ListableCollection>(entries: CollectionEntry<C>[]): Promise<number> {
	const counts = await Promise.all(entries.map(async entry => ((await render(entry)).remarkPluginFrontmatter.words as number) ?? 0));
	return counts.reduce((sum, words) => sum + words, 0);
}
