import type { UiLanguage } from "./ui-language.ts";

export function aboutPath(language: UiLanguage, variant?: string) {
  const base = language === "zh-CN" ? "/about/" : `/${language}/about/`;
  return variant ? `${base}${encodeURIComponent(variant)}/` : base;
}
