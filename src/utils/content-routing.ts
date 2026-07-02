/**
 * `getStaticPaths` builders for locale and content-detail routes.
 *
 * Every page in `pages/[...locale]/` and every per-entry endpoint
 * (`graph.png.ts`) needs the same two shapes: a locale × default
 * path, and a content × locale × id path. Centralising the builders
 * here keeps the default-locale-to-undefined mapping in one place.
 *
 * `buildEntryParams` is the shared seam at the bottom of this module:
 * a pure function that maps a content entry's id (e.g. `zh-cn/my-post`)
 * to the canonical `(locale, id)` pair used by every per-entry route.
 * The two `getStaticPaths` builders below and `contentGraphStaticPaths`
 * in `og-paths.ts` all route through it, so a change to the
 * locale-split rule (e.g. adding a date prefix) lands in one place
 * rather than re-spreading across N files.
 *
 * Deletion test: removing this file re-spreads the path-build logic
 * across every page. The re-spread is the signal this seam is
 * earning its keep.
 */
import type { CollectionEntry } from "astro:content";
import { getCollection } from "astro:content";
import config, { monolocale } from "$config";
import type { ContentCollection } from "$utils/config";

/** Canonical `(locale, id)` params pair for a content entry. */
export interface EntryParams {
	/** Locale segment, or `undefined` for the default locale (URL prefix is omitted per `prefixDefaultLocale: false`). */
	locale: string | undefined;
	/** The slug, with the locale prefix stripped. */
	id: string;
}

/**
 * Map a content entry's id to the canonical `(locale, id)` params
 * pair consumed by every per-entry `getStaticPaths` builder.
 *
 * In multi-locale mode the id is `{locale}/{slug}`; the locale
 * segment is split off and the default locale is mapped to
 * `undefined` so Astro's `prefixDefaultLocale: false` setting
 * matches at the call site. In monolocale mode the id is the slug
 * verbatim and `locale` is always `undefined`.
 *
 * Pure over its input: never touches the filesystem, never mutates
 * the entry. The split is unit-testable in isolation (see
 * `content-routing.test.ts`).
 */
export function buildEntryParams<C extends ContentCollection>(entry: CollectionEntry<C>): EntryParams {
	if (monolocale) {
		return { locale: undefined, id: entry.id };
	}
	const [language, ...rest] = entry.id.split("/");
	const locale = config.i18n.defaultLocale === language ? undefined : language;
	return { locale, id: rest.join("/") };
}

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
 * Drafts are excluded. The locale split itself is delegated to
 * `buildEntryParams`; this function only owns the props shape (the
 * collection-keyed entry for `Astro.props.{collection}`).
 */
export async function contentStaticPaths<C extends ContentCollection>(collection: C) {
	const entries = await getCollection(collection, entry => !entry.data.draft);
	return entries.map(entry => {
		const params = buildEntryParams(entry);
		return {
			params,
			props: { [collection]: entry } as { [K in C]: CollectionEntry<C> }
		};
	});
}
