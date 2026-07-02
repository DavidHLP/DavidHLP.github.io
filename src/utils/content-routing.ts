/**
 * `getStaticPaths` builders for locale and content-detail routes.
 *
 * Every page in `pages/[...locale]/` and every per-entry endpoint
 * (`graph.png.ts`) needs the same two shapes: a locale × default
 * path, and a content × locale × id path. Centralising the builders
 * here keeps the default-locale-to-undefined mapping in one place.
 *
 * Deletion test: removing this file re-spreads the path-build logic
 * across every page. The re-spread is the signal this seam is
 * earning its keep.
 */
import type { CollectionEntry } from "astro:content";
import { getCollection } from "astro:content";
import config, { monolocale } from "$config";
import type { ContentCollection } from "$utils/config";

/**
 * Build `getStaticPaths` params for routes that take a `locale` segment.
 *
 * The default locale is mapped to `undefined` so the URL omits the
 * prefix, matching Astro's `prefixDefaultLocale: false` behaviour in
 * `astro.config.ts`.
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
