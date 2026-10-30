export { GET } from "./rss.xml";

export function getStaticPaths() {
  return ["feed", "en/feed", "ja/feed"].map(feed => ({ params: { feed } }));
}
