import i18nit from "$i18n";
import { ts } from "$utils/labels";

let locale = typeof document === "undefined" || !document.documentElement ? "zh-cn" : document.documentElement.lang || "zh-cn";
let translate = i18nit(locale);

/** Keep the cached Rhine translator aligned with client-side locale switches. */
export function setLocale(nextLocale: string) {
	if (nextLocale === locale) return;
	locale = nextLocale;
	translate = i18nit(locale);
}

/** Resolve copy for the locale rendered on the archive page. */
export function rt(key: string, params?: Record<string, string | number>): string {
	const documentLocale = typeof document === "undefined" ? locale : document.documentElement.lang || "zh-cn";
	if (documentLocale !== locale) setLocale(documentLocale);
	return ts(translate, `rhine.${key}`, params);
}
