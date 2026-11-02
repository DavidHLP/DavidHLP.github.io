import { getCollection } from "astro:content";
import type { UiLanguage } from "../ui-language";
import { validateAboutVariants } from "../about-variants";

export async function getAbout(language: UiLanguage) {
  const entries = await getCollection("about");
  for (const lang of ["zh-CN", "en", "ja"]) {
    if (entries.filter(entry => entry.data.lang === lang).length !== 1)
      throw new Error(`About requires exactly one ${lang} document`);
  }
  return entries.find(entry => entry.data.lang === language)!;
}

export async function getAboutVariants(language: UiLanguage) {
  const entries = await getCollection("aboutVariants");
  validateAboutVariants(entries);
  return entries.filter(entry => entry.data.lang === language)
    .sort((a, b) => a.data.variant.localeCompare(b.data.variant));
}
