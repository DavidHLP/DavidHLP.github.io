import i18nit from "$i18n";
import { ts } from "$utils/labels";

const locale = typeof document === "undefined" || !document.documentElement ? "zh-cn" : document.documentElement.lang || "zh-cn";
const translate = i18nit(locale);

/** Resolve copy for the locale rendered on the archive page. */
export function rt(key: string, params?: Record<string, string | number>): string {
	return ts(translate, `rhine.${key}`, params);
}
