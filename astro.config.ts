import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import site from "./content/site.json";

const models = ["archive-cassette", "archive-assembly"].map(name => {
  const source = readFileSync(`public/assets/${name}.glb`);
  const hash = createHash("sha256").update(source).digest("hex").slice(0, 16);
  return { key: `assets/${name}.glb`, fileName: `assets/${name}.${hash}.glb`, source };
});
export default defineConfig({
  site: site.site,
  output: "static",
  trailingSlash: "always",
  build: { assets: "assets" },
  integrations: [sitemap()],
  vite: {
    define: {
      __RHINE_MODELS__: JSON.stringify(Object.fromEntries(models.map(model => [model.key, model.fileName]))),
      __RHINE_NOVECENTO__: JSON.stringify(["Normal", "DemiBold", "Bold"].every(weight =>
        existsSync(`public/fonts/novecento/webFonts/NovecentoSansWide${weight}/font.woff2`))),
    },
    plugins: [{
      name: "versioned-model-assets",
      apply: "build",
      buildStart() {
        for (const model of models) this.emitFile({ type: "asset", fileName: model.fileName, source: model.source });
      },
    }],
  },
});
