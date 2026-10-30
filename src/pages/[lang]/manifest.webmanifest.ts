export { GET } from "../manifest.webmanifest";

export function getStaticPaths() {
  return ["en", "ja"].map(lang => ({ params: { lang } }));
}
