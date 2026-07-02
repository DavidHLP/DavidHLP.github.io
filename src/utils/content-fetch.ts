/**
 * Locale-aware content entry fetch and URL synthesis.
 *
 * Every page that links to a Note or Jotting needs the locale-prefixed
 * URL. Every listing page needs entries filtered by locale. Before this
 * module existed, the same four operations were re-derived in every
 * page; the seam now owns them.
 *
 * `contentUrl` synthesises the relative URL (used by page links);
 * `feedLink` synthesises the absolute URL (used by the Atom feed).
 * Both go through `stripLocale` so callers pass the full
 * `CollectionEntry.id` without thinking about the prefix.
 *
 * Deletion test: deleting this file forces every page to re-derive
 * the locale-strip + URL-build logic. The re-spread is the signal
 * this seam is earning its keep.
 */
import { getCollection, getEntry } from "astro:content";
import { getRelativeLocaleUrl } from "astro:i18n";
import { monolocale } from "$config";
import type { Section } from "$utils/config";
import type { ContentCollection } from "$utils/config";

/** Filter a content collection to entries for the given locale, excluding drafts. */
export async function getPublishedByLocale<C extends ContentCollection>(collection: C, locale: string) {
	return getCollection(collection, entry => {
		if (entry.data.draft) return false;
		if (monolocale) return true;
		const [entryLocale] = entry.id.split("/");
		return entryLocale === locale;
	}) as Promise<Awaited<ReturnType<typeof getCollection<C>>>[number][]>;
}

/** Strip the locale prefix from a content entry id, leaving only the slug. */
export function stripLocale(id: string): string {
	if (monolocale) return id;
	return id.split("/").slice(1).join("/");
}

/** Build the locale-prefixed public URL for a note/jotting entry. */
export function contentUrl(locale: string, section: Section, id: string): string {
	return getRelativeLocaleUrl(locale, `/${section}/${stripLocale(id)}`);
}

/** Build the storage key for an information entry, e.g. `zh-cn/policy`. */
export function infoKey(locale: string, slug: string): string {
	return monolocale ? slug : `${locale}/${slug}`;
}

/** Fetch an information entry for the given locale and slug. */
export function getInfoEntry(locale: string, slug: string) {
	return getEntry("information", infoKey(locale, slug));
}
