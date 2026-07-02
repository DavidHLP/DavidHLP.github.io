/**
 * Locale-aware content collection routing.
 *
 * This module is the single seam between i18n configuration and Astro content
 * collections. Every page in `[...locale]/` was previously hand-rolling the
 * same `getStaticPaths` pattern, the same `getCollection` locale filter, the
 * same `id.split("/").slice(1).join("/")` ID strip, the same card adapter,
 * the same facet extraction, and the same word-count aggregation. Centralising
 * the operations here turns N sites of duplicated logic into one testable
 * interface.
 *
 * Deletion test: removing this module re-spreads the routing and listing
 * logic across every page. That re-spread is the signal that this seam is
 * earning its keep.
 */
import type { CollectionEntry } from "astro:content";
import { getCollection, getEntry, render } from "astro:content";
import { getRelativeLocaleUrl } from "astro:i18n";
import config, { monolocale } from "$config";
import type { Section } from "$utils/config";
import i18nit from "$i18n";

// Re-export Section so consumers can `import { contentUrl, type Section } from "$utils/content"`.
export type { Section } from "$utils/config";

// Re-export so consumers can drop the `$config` import when they only need this.
export { monolocale };

/** Site-managed content collections. */
export type ContentCollection = "note" | "jotting" | "preface" | "information";

/** Collections that carry the listing-card shape. */
export type ListableCollection = "note" | "jotting";

/**
 * Build `getStaticPaths` params for routes that take a `locale` segment.
 *
 * The default locale is mapped to `undefined` so the URL omits the prefix,
 * matching Astro's `prefixDefaultLocale: false` behaviour in `astro.config.ts`.
 */
export const localeStaticPaths = () =>
	config.i18n.locales.map(locale => ({
		params: { locale: config.i18n.defaultLocale === locale ? undefined : locale }
	}));

/**
 * Build `getStaticPaths` for a content collection's detail routes.
 *
 * Splits each entry id (`{locale}/{slug}` in multi-locale mode, plain
 * `{slug}` in monolocale mode) into `params.locale` and `params.id`,
 * mapping the default locale to `undefined` to mirror `localeStaticPaths`.
 * Drafts are excluded.
 */
export async function contentStaticPaths<C extends ContentCollection>(collection: C) {
	const entries = await getCollection(collection, entry => !entry.data.draft);
	return entries.map(entry => {
		// Monolocale shortcut: id has no locale prefix to strip.
		if (monolocale) {
			return {
				params: { locale: undefined, id: entry.id },
				props: { [collection]: entry } as { [K in C]: CollectionEntry<C> }
			};
		}
		const [language, ...rest] = entry.id.split("/");
		const locale = config.i18n.defaultLocale === language ? undefined : language;
		const id = rest.join("/");
		return {
			params: { locale, id },
			props: { [collection]: entry } as { [K in C]: CollectionEntry<C> }
		};
	});
}

/** Filter a content collection to entries for the given locale, excluding drafts. */
export async function getPublishedByLocale<C extends ContentCollection>(collection: C, locale: string) {
	return getCollection(collection, entry => {
		if (entry.data.draft) return false;
		if (monolocale) return true;
		const [entryLocale] = entry.id.split("/");
		return entryLocale === locale;
	}) as Promise<CollectionEntry<C>[]>;
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

/** Format a Date as `YYYY/MM/DD` in UTC for OG image metadata. */
export function toDisplayDate(time: Date): string {
	return time.toISOString().slice(0, 10).replace(/-/g, "/");
}

/**
 * Build `getStaticPaths` for a content collection's OG image endpoint.
 * Returns the standard `{params, props}` shape used by `graph.png.ts` files.
 *
 * `typeLabelKey` is the i18n key (e.g. `navigation.note`) used for the type
 * label rendered on the OG card. The function localises it for the route.
 */
export async function contentGraphStaticPaths<C extends ContentCollection>(collection: C, typeLabelKey: string) {
	const entries = await getCollection(collection, entry => !entry.data.draft);
	return entries.map(entry => {
		// Mirror the locale mapping used by contentStaticPaths.
		if (monolocale) {
			return {
				params: { locale: undefined, id: entry.id },
				props: {
					type: i18nit(config.i18n.defaultLocale)(typeLabelKey),
					title: entry.data.title,
					time: toDisplayDate(entry.data.timestamp),
					series: (entry.data as { series?: string }).series,
					tags: entry.data.tags
				}
			};
		}
		const [language, ...rest] = entry.id.split("/");
		const locale = config.i18n.defaultLocale === language ? undefined : language;
		const id = rest.join("/");
		return {
			params: { locale, id },
			props: {
				type: i18nit(locale || config.i18n.defaultLocale)(typeLabelKey),
				title: entry.data.title,
				time: toDisplayDate(entry.data.timestamp),
				series: (entry.data as { series?: string }).series,
				tags: entry.data.tags
			}
		};
	});
}

// ---------------------------------------------------------------------------
// Listing-card seam
//
// Note and Jotting listing pages (and the Atom feed) all need the same
// lean card shape that `ContentList.svelte` consumes. Centralising the
// adapter means the type and its constructor live together; adding a field
// is a single edit instead of three.
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Word-count seam
//
// The reading-time remark plugin writes `remarkPluginFrontmatter.words` onto
// every rendered entry. Footer (and any future statistics surface) sums the
// same array. Centralising the render-then-reduce keeps the dependency on
// `astro:content` server-side and exposes a single `number` to callers.
// ---------------------------------------------------------------------------

/** Sum the `words` frontmatter over a collection of listable entries. */
export async function totalWordCount<C extends ListableCollection>(entries: CollectionEntry<C>[]): Promise<number> {
	const counts = await Promise.all(entries.map(async entry => ((await render(entry)).remarkPluginFrontmatter.words as number) ?? 0));
	return counts.reduce((sum, words) => sum + words, 0);
}
