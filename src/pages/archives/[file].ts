import { getPosts } from "../../lib/blog";
import { archiveText } from "../../../scripts/archive-content.mjs";

export async function getStaticPaths() {
  return (await getPosts()).map(post => ({
    params: { file: `RHINE-LAB-${post.data.archiveId}.txt` },
    props: { record: { ...post.data, id: post.data.archiveId, body: post.body } },
  }));
}
export function GET({ props }: { props: { record: Parameters<typeof archiveText>[0] } }) {
  return new Response(archiveText(props.record), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
