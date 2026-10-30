import { getPosts } from "../lib/blog";

export async function GET() {
  const posts = await getPosts();
  return new Response(JSON.stringify(Object.fromEntries(
    posts.map(post => [post.data.archiveId, post.body ?? post.data.abstract]),
  )), { headers: { "Content-Type": "application/json; charset=utf-8" } });
}
