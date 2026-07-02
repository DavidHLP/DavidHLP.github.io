/**
 * Homepage-specific "latest" aggregation.
 *
 * The homepage renders the most recent published entry across the
 * configured `latest` sections. Before this module existed, the
 * "fetch notes + jottings, merge into a single pool, sort by
 * timestamp descending, take the first" decision was inlined inside
 * `src/pages/[...locale]/index.astro` — duplicated in spirit, hidden
 * behind 200 lines of Astro markup, with no test surface.
 *
 * `latestByTimestamp` absorbs the aggregation. The function takes the
 * already-shaped `ContentCard[]` pool and returns the most recent
 * card (or `undefined` for an empty pool). The page becomes a single
 * line: `const latest = latestByTimestamp(cards)`.
 *
 * Deletion test: removing this file forces the homepage to inline
 * the sort + take-0 decision again. The re-spread is the signal
 * this seam is earning its keep.
 */
import type { ContentCard } from "./content-card";

/**
 * Return the most recent card in `cards` by `data.timestamp`, or
 * `undefined` for an empty pool. Pure over its input: no mutation,
 * no I/O. The card returned preserves the `section` field set by
 * `toCard`, so the caller can branch on the publication (note vs.
 * jotting) when rendering the latest entry.
 */
export function latestByTimestamp(cards: ContentCard[]): ContentCard | undefined {
	if (cards.length === 0) return undefined;
	let latest = cards[0];
	for (let i = 1; i < cards.length; i++) {
		const candidate = cards[i];
		if (candidate.data.timestamp.getTime() > latest.data.timestamp.getTime()) {
			latest = candidate;
		}
	}
	return latest;
}
