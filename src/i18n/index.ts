// Import translation files for different locales
import en from "./en/index.yaml";
import enScript from "./en/script.yaml";
import enLinkroll from "./en/linkroll.yaml";
import zhCN from "./zh-cn/index.yaml";
import zhCNScript from "./zh-cn/script.yaml";
import zhLinkroll from "./zh-cn/linkroll.yaml";
import ja from "./ja/index.yaml";
import jaScript from "./ja/script.yaml";
import jaLinkroll from "./ja/linkroll.yaml";
import config from "$config";

// Translation object mapping locale codes to their respective translation data
const translations = {
	en: {
		index: en,
		script: enScript,
		linkroll: enLinkroll
	},
	"zh-cn": {
		index: zhCN,
		script: zhCNScript,
		linkroll: zhLinkroll
	},
	ja: {
		index: ja,
		script: jaScript,
		linkroll: jaLinkroll
	}
};

// Define Language type based on available translations
export type Language = keyof typeof translations;

// Define Namespace type based on keys in the translation objects
export type TranslationNamespace = keyof (typeof translations)[Language];

/**
 * Options for the i18n seam.
 *
 * `fallbackLocale` is consulted when the active locale has no entry for
 * the key. The fallback chain is one step only: if the fallback locale
 * is also missing, `t(...)` returns `undefined`. The default fallback
 * is the configured site default locale (ADR 0004).
 */
export interface I18nOptions {
	/** Locale consulted when the active locale has no entry. */
	fallbackLocale?: Language;
}

/**
 * Deep-merge `override` onto `base` with `override` winning on leaf values.
 *
 * Both branches must be plain objects for the merge to recurse; arrays
 * and primitives are replaced wholesale. Used by `i18nData` to compose
 * the fallback dictionary under the active one, matching the
 * `t(...)` fallback semantics from ADR 0004 at the structured-data
 * layer.
 */
function deepMerge<T extends Record<string, unknown>>(base: T, override: T): T {
	const result: Record<string, unknown> = { ...base };
	for (const key of Object.keys(override)) {
		const baseValue = base[key];
		const overrideValue = override[key];
		if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
			result[key] = deepMerge(baseValue, overrideValue);
		} else {
			result[key] = overrideValue;
		}
	}
	return result as T;
}

/** Narrowing guard for the deep-merge recursion. */
function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Validate if the provided language is supported
 * @param language - The target language/locale code (e.g. "en", "zh-cn", "ja")
 * @throws Error if the language is not supported
 */
export function validateLanguage(language: string): asserts language is Language {
	if (!(language in translations)) throw new Error(`Unsupported language: ${language}. Available: ${Object.keys(translations).join(", ")}`);
}

/**
 * Get the merged translation dictionary for a specific language and namespace.
 *
 * The returned dictionary is the active locale with the fallback locale
 * merged underneath: a key missing in the active locale resolves to the
 * fallback's value for the same key. Arrays are replaced wholesale
 * (not concatenated). The fallback defaults to `config.i18n.defaultLocale`
 * and is disabled by passing `{ fallbackLocale: <active locale> }` or
 * `{ fallbackLocale: undefined }` (the seam short-circuits when the
 * active and fallback dictionaries are the same object).
 *
 * Use this when you need access to structured data (arrays, nested objects)
 * rather than localized strings, e.g. the homepage profile card. For
 * single-string lookups, prefer `i18nit(...)(key)` which honours the
 * same fallback policy and handles pluralization.
 *
 * @param language - The target language/locale code (e.g. "en", "zh-cn", "ja")
 * @param namespace - Optional namespace (defaults to "index")
 * @param options - Optional fallback-locale configuration
 * @returns The merged translation dictionary as a nested object
 */
export function i18nData(language: string, namespace: TranslationNamespace = "index", options: I18nOptions = {}): Record<string, any> {
	validateLanguage(language);
	const activeLanguage: Language = language;
	const fallbackLocale = (options.fallbackLocale ?? config.i18n.defaultLocale) as Language;
	const activeDictionary = translations[activeLanguage][namespace ?? "index"] as Record<string, any>;

	if (fallbackLocale === activeLanguage) return activeDictionary;

	const fallbackDictionary = translations[fallbackLocale][namespace ?? "index"] as Record<string, any>;
	return deepMerge(fallbackDictionary, activeDictionary);
}

/**
 * Walk a dot-separated key path through a translation object and return
 * the resolved value (string or plural object) or `undefined` if any
 * segment is missing.
 */
function lookup(dictionary: Record<string, any>, key: string): any {
	const keys = key.split(".");
	let value: any = dictionary;
	for (const segment of keys) {
		if (value === undefined || value === null) return undefined;
		value = value[segment];
	}
	return value;
}

/**
 * Resolve a plural form for the given count, or return undefined if no
 * plural object is configured for the locale.
 */
function resolvePlural(value: any, count: number, pluralRules: Intl.PluralRules): any {
	if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
	const rule = pluralRules.select(count);
	return value[rule] ?? value.other;
}

/**
 * Create an internationalization function for a specific language.
 *
 * `t(key)` returns `string | undefined`:
 *   - The entry exists in the active locale: the string.
 *   - The entry is missing in the active locale but present in the
 *     fallback locale: the fallback string.
 *   - Both locales are missing: `undefined`. Callers narrow with `??`.
 *
 * The fallback locale defaults to the configured site default locale
 * (ADR 0004) so the seam owns the policy. Pages that want a config-side
 * fallback (e.g. `config.prologue`) compose it explicitly:
 * `t("home.prologue") ?? config.prologue`.
 *
 * @param language - The target language/locale code (e.g. "en", "zh-cn", "ja")
 * @param namespace - Optional namespace prefix (defaults to "index")
 * @param options - Optional fallback-locale configuration
 * @returns Translation function that resolves a key to `string | undefined`
 */
export default function i18nit(
	language: string,
	namespace?: TranslationNamespace,
	options: I18nOptions = {}
): (key: string, params?: Record<string, string | number>) => string | undefined {
	validateLanguage(language);
	const activeLanguage: Language = language;

	const fallbackLocale = (options.fallbackLocale ?? config.i18n.defaultLocale) as Language;
	const activeDictionary = translations[activeLanguage][namespace ?? "index"];
	const fallbackDictionary = fallbackLocale !== activeLanguage ? translations[fallbackLocale][namespace ?? "index"] : activeDictionary;
	const pluralRules = new Intl.PluralRules(activeLanguage);

	/**
	 * Resolve a key to a string in the active locale, falling back to
	 * the configured fallback locale when the active locale is missing.
	 * Returns `undefined` if both locales are missing — callers narrow
	 * with `?? defaultValue`.
	 *
	 * @param key - Dot-separated key path (e.g. "notification.reply.title")
	 * @param params - Optional parameters for string interpolation (replaces {paramName} placeholders)
	 * @returns The localized string, or `undefined` if no entry exists
	 */
	function t(key: string, params?: Record<string, string | number>): string | undefined {
		let value: any = lookup(activeDictionary, key);

		// Fallback to the configured fallback locale on a miss.
		if (value === undefined && fallbackDictionary !== activeDictionary) {
			value = lookup(fallbackDictionary, key);
		}

		if (value === undefined) return undefined;

		// Handle pluralization if the value is a plural object and a count is given.
		if (typeof value === "object" && params?.count !== undefined && typeof params.count === "number") {
			value = resolvePlural(value, params.count, pluralRules);
			if (typeof value !== "string") return undefined;
		} else if (typeof value !== "string") {
			return undefined;
		}

		if (params) return value.replace(/\{(\w+)\}/g, (_, param) => String(params[param] ?? `{${param}}`));
		return value;
	}

	return t;
}
