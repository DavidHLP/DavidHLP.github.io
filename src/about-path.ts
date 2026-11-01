import type { UiLanguage } from "./ui-language.ts";

export function aboutPath(language: UiLanguage) {
  return language === "zh-CN" ? "/about/" : `/${language}/about/`;
}
