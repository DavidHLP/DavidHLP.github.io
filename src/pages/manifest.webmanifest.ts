import site from "../../content/site.json";
import type { APIContext } from "astro";
import labels from "../../content/locales.json";
import { contentLabel } from "../content-language";
import { normalizeUiLanguage } from "../ui-language";

export function GET(context: APIContext) {
  const language = normalizeUiLanguage(context.params.lang);
  return new Response(JSON.stringify({
    id: "/",
    name: site.title,
    short_name: site.title,
    description: contentLabel(site.description, language, labels),
    lang: language,
    start_url: `/?source=pwa&lang=${language}`,
    scope: "/",
    display: "standalone",
    background_color: "#e8e5e1",
    theme_color: "#e8e5e1",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }), { headers: { "Content-Type": "application/manifest+json" } });
}
