/**
 * Locale-aware content collection routing.
 *
 * This module is the single seam between i18n configuration and Astro content
 * collections. Every page in `[...locale]/` was previously hand-rolling the
 * same `getStaticPaths` pattern, the same `getCollection` locale filter, the
 * same `id.split("/").slice(1).join("/")` ID strip, and the same hash
 * extraction. Centralising the four operations here turns twelve sites of
 * duplicated logic into one testable interface.
 *
 * Deletion test: removing this module re-spreads the routing logic across
 * every page. That re-spread is the signal that this seam is earning its keep.
 */
import type { CollectionEntry } from "astro:content";
import { getCollection, getEntry } from "astro:content";
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
