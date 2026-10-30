import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import site from "../../../content/site.json";
import labels from "../../../content/locales.json";
import { getPosts, postPath } from "../../lib/blog";
import { contentLabel } from "../../content-language";
import { normalizeUiLanguage } from "../../ui-language";

export function getStaticPaths() {
  return ["en", "ja"].map(lang => ({ params: { lang } }));
}

export async function GET(context: APIContext) {
  const language = normalizeUiLanguage(context.params.lang);
  return rss({
    title: site.title, description: contentLabel(site.description, language, labels), site: context.site!,
    items: (await getPosts()).filter(post => post.data.lang === language)
      .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
      .map(post => ({ title: post.data.title, description: post.data.abstract, pubDate: post.data.pubDate, link: `${postPath(post.id)}?lang=${language}`, categories: post.data.tags.map(tag => contentLabel(tag, language, labels)) })),
    customData: `<language>${language}</language>`,
  });
}
