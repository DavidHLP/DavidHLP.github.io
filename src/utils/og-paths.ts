/**
 * `getStaticPaths` and display-date helper for the Open Graph image
 * endpoint.
 *
 * `contentGraphStaticPaths` mirrors `contentStaticPaths` from
 * `content-routing.ts` but adds the props the OG endpoint needs:
 * the localised type label, title, date, series, and tags. The
 * locale split itself is delegated to `buildEntryParams` from
 * `content-routing.ts` so the two builders share one source of
 * truth for the (locale, id) shape (per ADR 0001 + ADR 0003); the
 * OG builder only owns the props projection.
 *
 * `toDisplayDate` formats a Date as `YYYY/MM/DD` in UTC for OG image
 * metadata. It lives here (not in `content-fetch.ts`) because the OG
 * endpoint is the only consumer.
 *
 * Deletion test: removing this file forces the OG endpoint to inline
 * the locale split + i18n lookup + date format. The re-spread is
 * the signal this seam is earning its keep.
 */
import { getCollection } from "astro:content";
import config from "$config";
import { buildEntryParams } from "./content-routing";
import i18nit from "$i18n";
import type { ContentCollection } from "$utils/config";

/** Format a Date as `YYYY/MM/DD` in UTC for OG image metadata. */
export function toDisplayDate(time: Date): string {
	return time.toISOString().slice(0, 10).replace(/-/g, "/");
}

/**
 * Build `getStaticPaths` for a content collection's OG image endpoint.
 * Returns the standard `{params, props}` shape used by `graph.png.ts` files.
 *
 * `typeLabelKey` is the i18n key (e.g. `navigation.note`) used for the
 * type label rendered on the OG card. The function localises it for
 * the route using `i18nit` (the active locale is the entry's locale,
 * falling back to the configured default for the default-locale-omitted
 * case where the URL has no locale prefix).
 *
 * The locale split + default-locale mapping is delegated to
 * `buildEntryParams` (the shared seam in `content-routing.ts`);
 * this function only owns the OG-specific props projection.
 */
export async function contentGraphStaticPaths<C extends ContentCollection>(collection: C, typeLabelKey: string) {
	const entries = await getCollection(collection, entry => !entry.data.draft);
	return entries.map(entry => {
		const params = buildEntryParams(entry);
		const locale = params.locale || config.i18n.defaultLocale;
		return {
			params,
			props: {
				type: i18nit(locale)(typeLabelKey),
				title: entry.data.title,
				time: toDisplayDate(entry.data.timestamp),
				series: (entry.data as { series?: string }).series,
				tags: entry.data.tags
			}
		};
	});
}
