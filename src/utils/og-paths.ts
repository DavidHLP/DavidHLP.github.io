/**
 * `getStaticPaths` and display-date helper for the Open Graph image
 * endpoint.
 *
 * `contentGraphStaticPaths` mirrors `contentStaticPaths` from
 * `content-routing.ts` but adds the props the OG endpoint needs:
 * the localised type label, title, date, series, and tags. Localising
 * the type label is done here so the locale routing and the OG
 * rendering share the same source of truth.
 *
 * `toDisplayDate` formats a Date as `YYYY/MM/DD` in UTC for OG image
 * metadata. It lives here (not in `content-fetch.ts`) because the OG
 * endpoint is the only consumer.
 *
 * Deletion test: removing this file forces the OG endpoint to inline
 * the locale split + i18n lookup + date format. The re-spread is the
 * signal this seam is earning its keep.
 */
import { getCollection } from "astro:content";
import config, { monolocale } from "$config";
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
 * the route.
 */
export async function contentGraphStaticPaths<C extends ContentCollection>(collection: C, typeLabelKey: string) {
	const entries = await getCollection(collection, entry => !entry.data.draft);
	return entries.map(entry => {
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
