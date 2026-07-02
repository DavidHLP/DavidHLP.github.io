/**
 * Localised label helpers.
 *
 * `sectionLabel` builds the `[ 02 / ACTIVITY ]` style index that opens
 * each homepage section. The localised suffix is taken from the i18n
 * dictionary when present, otherwise the last dot-segment of the key is
 * uppercased — the same fallback the homepage used inline.
 *
 * `ts` is the "t with sentinel" wrapper: it calls the i18n seam and
 * falls back to the key itself when the seam returns `undefined`. The
 * i18n seam returns `string | undefined` per ADR 0004, but visible UI
 * strings want the original sentinel behaviour — "show the key when
 * the translation is missing" — so the call site can either compose
 * with `t(key) ?? key` inline or use `ts(key)` for the same effect.
 *
 * The `tOr` band-aid used to live here too. It was removed once the
 * i18n seam started returning `string | undefined` directly (ADR 0004);
 * callers now compose with `ts(t, key)` (sentinel fallback to the key)
 * or with `t(key) ?? configValue` when the fallback is a config-side
 * value, as in `src/pages/[...locale]/index.astro` for the prologue.
 */
export type Translator = (key: string, params?: Record<string, string | number>) => string | undefined;

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
	const suffix = label === undefined || label === key ? fallback : label;
	return `[ ${String(n).padStart(2, "0")} / ${suffix} ]`;
}

/**
 * Look up `key` via the i18n seam and fall back to the key itself on a
 * miss. Returns the key verbatim when the seam returns `undefined`,
 * preserving the original sentinel behaviour for visible UI strings.
 */
export function ts(t: Translator, key: string, params?: Record<string, string | number>): string {
	return t(key, params) ?? key;
}
