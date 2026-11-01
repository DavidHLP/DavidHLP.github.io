import { profileText } from "../profile-text.mjs";
import { getPosts } from "../lib/blog";

export async function GET() {
  const posts = await getPosts();
  return new Response(JSON.stringify(Object.fromEntries(
    posts.map(post => [post.data.archiveId, [profileText(post.data.profile), post.body ?? post.data.abstract].filter(Boolean).join("\n\n")]),
  )), { headers: { "Content-Type": "application/json; charset=utf-8" } });
}
