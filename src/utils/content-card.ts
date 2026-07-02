/**
 * The listing-card shape and its adapters.
 *
 * Note and Jotting listing pages (and the Atom feed) all need the
 * same lean card shape that `ContentList.svelte` consumes. The card
 * type and its constructor live together; adding a field is a single
 * edit instead of three.
 *
 * `feedLink` is the absolute-URL adapter for the Atom feed; it lives
 * here because the URL is the link-shaped value the card carries.
 *
 * Deletion test: removing this file forces every listing page and
 * the feed to re-shape entries inline. The re-spread is the signal
 * this seam is earning its keep.
 */
import type { CollectionEntry } from "astro:content";
import { contentUrl } from "$utils/content-fetch";
import type { ListableCollection } from "./content-types";

/** Lean card shape consumed by `ContentList.svelte` and the Atom feed. */
export interface ContentCard {
	id: string;
	url: string;
	data: {
		title: string;
		timestamp: Date;
		series?: string;
		tags?: string[];
		sensitive?: boolean;
		top: number;
	};
}

/** Adapt a Note/Jotting entry to the listing-card shape. */
export function toCard<C extends ListableCollection>(entry: CollectionEntry<C>, section: C, locale: string): ContentCard {
	return {
		id: entry.id,
		url: contentUrl(locale, section, entry.id),
		data: {
			title: entry.data.title,
			timestamp: entry.data.timestamp,
			series: (entry.data as { series?: string }).series,
			tags: entry.data.tags,
			sensitive: entry.data.sensitive,
			top: entry.data.top
		}
	};
}

/** Build the absolute feed link for a Note/Jotting entry against the given site origin. */
export function feedLink<C extends ListableCollection>(entry: CollectionEntry<C>, section: C, locale: string, site: URL): string {
	return new URL(contentUrl(locale, section, entry.id), site).toString();
}
