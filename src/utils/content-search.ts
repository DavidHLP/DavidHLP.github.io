import type { ContentCard } from "./content-card";

export type SearchableCard = ContentCard & { searchText?: string };

const normalize = (text: string) => text.normalize("NFKC").toLowerCase();

/** Literal AND search; title and facet hits rank ahead of body-only matches. */
export function searchCards<T extends SearchableCard>(items: T[], query: string): T[] {
	const terms = [...new Set(normalize(query).trim().split(/\s+/).filter(Boolean))];
	if (!terms.length) return items;
	return items
		.map(item => {
			const title = normalize(item.data.title);
			const facets = normalize([item.data.series, ...(item.data.tags ?? [])].join(" "));
			const body = normalize(item.searchText ?? "");
			const scores = terms.map(term => (title.includes(term) ? 4 : facets.includes(term) ? 2 : body.includes(term) ? 1 : 0));
			return { item, score: scores.every(Boolean) ? scores.reduce<number>((a, b) => a + b, 0) : 0 };
		})
		.filter(result => result.score > 0)
		.sort((a, b) => b.score - a.score)
		.map(result => result.item);
}
