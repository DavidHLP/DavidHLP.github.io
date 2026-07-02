/**
 * Localised label helpers.
 *
 * Two tiny pure functions that previously lived inline in `pages/[...locale]/index.astro`:
 *
 * - `tOr` resolves a translation key but quietly falls back to a config-side
 *   string when the i18n dictionary has no entry. Used for the site
 *   prologue / prologue author, which the user may want to override either
 *   per-locale (i18n yaml) or globally (site.config.ts).
 * - `sectionLabel` formats the `[ 02 / ACTIVITY ]` style index that opens
 *   each homepage section. The localised suffix is taken from the i18n
 *   dictionary when present, otherwise the last dot-segment of the key is
 *   uppercased — the same fallback the homepage used inline.
 *
 * Both are pure: given the same `t`, key and value they always return the
 * same string, so they sit comfortably at a single function-call seam and
 * can be exercised without a DOM.
 */
export type Translator = (key: string, params?: Record<string, string | number>) => string;

/**
 * Look up `key` via `t`. If the dictionary is missing the key (i18n returns
 * the key itself), return `fallback` instead. Returns `undefined` when both
 * are absent so the caller can decide whether to render anything.
 */
export function tOr(t: Translator, key: string, fallback?: string): string | undefined {
	const translated = t(key);
	if (translated !== key) return translated;
	return fallback;
}

/**
 * Build a `[ 02 / ACTIVITY ]` style section index label.
 *
 * - `n` is the 1-based section number (zero-padded to two digits).
 * - `key` is the i18n key whose last dot-segment becomes the English
 *   fallback. `home.section.activity` -> `ACTIVITY`.
 * - When the dictionary has an entry, the localised word is used in place
 *   of the uppercased key tail.
 */
export function sectionLabel(t: Translator, n: number, key: string): string {
	const label = t(key);
	const fallback = key.split(".").pop()?.toUpperCase() ?? key;
	const suffix = label === key ? fallback : label;
	return `[ ${String(n).padStart(2, "0")} / ${suffix} ]`;
}
