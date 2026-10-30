import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import site from "../../content/site.json";
import { getPosts, postPath } from "../lib/blog";

export async function GET(context: APIContext) {
  return rss({
    title: site.title,
    description: site.description,
    site: context.site!,
    items: (await getPosts()).sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()).map(post => ({
      title: post.data.title, description: post.data.abstract,
      pubDate: post.data.pubDate, link: postPath(post.id),
      categories: post.data.tags,
    })),
    customData: "<language>zh-cn</language>",
  });
}
