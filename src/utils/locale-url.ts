import { getRelativeLocaleUrl } from "astro:i18n";

/** Remove a trailing slash while preserving the site root. */
export function withoutTrailingSlash(path: string): string {
	return path === "/" ? path : path.replace(/\/$/, "");
}

/** Build a locale URL in the site's canonical no-trailing-slash form. */
export function localeUrl(locale: string, path?: string): string {
	return withoutTrailingSlash(getRelativeLocaleUrl(locale, path));
}
