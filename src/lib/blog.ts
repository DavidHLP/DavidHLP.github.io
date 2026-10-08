import { getCollection } from "astro:content";
import site from "../../content/site.json";

export async function getPosts() {
  const posts = (await getCollection("blog", ({ data }) => !data.draft))
    .sort((a, b) => Number(a.data.archiveId.slice(2)) - Number(b.data.archiveId.slice(2)));
  const ids = posts.map(post => post.data.archiveId);
  if (new Set(ids).size !== ids.length) throw new Error("文章档案编号不能重复");
  for (const column of site.columns)
    if (!posts.some(post => post.data.category === column)) throw new Error(`分类“${column}”至少需要一篇已发布文章`);
  return posts;
}
export { postPath } from "../blog-path";
