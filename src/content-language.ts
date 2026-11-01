import { aboutPath } from "./about-path.ts";
import { postPath } from "./blog-path.ts";
import type { UiLanguage } from "./ui-language.ts";

type Article = { id: string; slug?: string; lang?: string; translationKey?: string };
export type ContentLabels = Partial<Record<UiLanguage, Record<string, string>>>;

export function translationKey(article: Article) {
  return article.translationKey ?? article.slug?.replace(/(^|\/)(zh-cn|en|ja)\//i, "$1") ?? article.id;
}

export function localizedArticles<T extends Article>(articles: readonly T[], language: UiLanguage): T[] {
  const groups = new Map<string, T[]>();
  for (const article of articles) {
    const key = translationKey(article);
    groups.set(key, [...(groups.get(key) ?? []), article]);
  }
  return [...groups.values()].sort((a, b) => {
    const canonical = (group: T[]) => group.find(item => (item.lang ?? "zh-CN") === "zh-CN") ?? group[0];
    return Number(canonical(a).id.slice(2)) - Number(canonical(b).id.slice(2));
  }).map(group => group.find(item => (item.lang ?? "zh-CN") === language) ?? group.find(item => (item.lang ?? "zh-CN") === "zh-CN") ?? group[0]);
}

export function contentLabel(text: string, language: UiLanguage, labels: ContentLabels): string {
  return labels[language]?.[text] ?? text;
}

export function languageUrl(articles: readonly Article[], href: string, language: UiLanguage) {
  const url = new URL(href, "https://local.invalid");
  if (/^\/(en\/|ja\/)?about\/?$/.test(url.pathname)) {
    url.pathname = aboutPath(language);
    url.hash = "";
  }
  const current = articles.find(article => article.slug && postPath(article.slug) === url.pathname);
  if (current) {
    const translated = articles.find(article => translationKey(article) === translationKey(current) && (article.lang ?? "zh-CN") === language);
    if (translated?.slug) url.pathname = postPath(translated.slug);
    if (translated?.slug !== current.slug) url.hash = "";
  }
  url.searchParams.set("lang", language);
  return url.pathname + url.search + url.hash;
}

export function validateTranslations(articles: readonly Article[]) {
  const groups = new Map<string, Set<string>>();
  for (const article of articles) {
    const key = translationKey(article), language = article.lang ?? "zh-CN";
    if (!["zh-CN", "en", "ja"].includes(language)) throw new Error(`Unsupported article language: ${language}`);
    const languages = groups.get(key) ?? new Set<string>();
    if (languages.has(language)) throw new Error(`Duplicate ${language} translation: ${key}`);
    languages.add(language);
    groups.set(key, languages);
  }
  for (const [key, languages] of groups)
    if (languages.size !== 3) throw new Error(`Missing article translations: ${key}`);
}

export function restoredArchiveNavigation<T extends Article & { category: string }>(articles: readonly T[], columns: readonly string[], encoded: string | null) {
  if (!encoded) return;
  try {
    const state = JSON.parse(encoded);
    if (!state || typeof state.selected !== "string" || !Array.isArray(state.columns) || state.columns.length !== columns.length || !state.columns.every((key: unknown) => typeof key === "string")) return;
    const indexFor = (key: string) => articles.findIndex(article => translationKey(article) === key);
    const selected = indexFor(state.selected);
    const memory: number[] = state.columns.map(indexFor);
    if (selected < 0 || memory.some((index, lane) => index < 0 || articles[index].category !== columns[lane])) return;
    memory[columns.indexOf(articles[selected].category)] = selected;
    return { selected, columns: memory };
  } catch { return; }
}
