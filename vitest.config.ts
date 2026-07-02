import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import yaml from "@rollup/plugin-yaml";

/**
 * Vitest config for the unit-test seam.
 *
 * Scope: pure modules under `src/utils/` and `src/i18n/`. Astro pages
 * (`src/pages/**`), Svelte components, and the `astro:content` virtual
 * module are exercised by `pnpm build` and `astro check`, not by vitest —
 * they require a real build pipeline.
 *
 * The aliases mirror `tsconfig.json` so imports of `$config`, `$utils`,
 * `$i18n` resolve the same way under vitest as they do at build time.
 * The `@rollup/plugin-yaml` plugin matches the build-time YAML loader
 * used in `astro.config.ts` so `i18n` tests can import translation files.
 */
export default defineConfig({
	// @ts-expect-error — `@rollup/plugin-yaml` is rollup-only; astro.config.ts uses the same escape hatch.
	plugins: [yaml()],
	resolve: {
		alias: {
			$config: fileURLToPath(new URL("./site.config.ts", import.meta.url)),
			$public: fileURLToPath(new URL("./public", import.meta.url)),
			$assets: fileURLToPath(new URL("./src/assets", import.meta.url)),
			$icons: fileURLToPath(new URL("./src/icons", import.meta.url)),
			$graph: fileURLToPath(new URL("./src/graph", import.meta.url)),
			$utils: fileURLToPath(new URL("./src/utils", import.meta.url)),
			$components: fileURLToPath(new URL("./src/components", import.meta.url)),
			$i18n: fileURLToPath(new URL("./src/i18n", import.meta.url)),
			$layouts: fileURLToPath(new URL("./src/layouts", import.meta.url)),
			$scripts: fileURLToPath(new URL("./src/scripts", import.meta.url)),
			$styles: fileURLToPath(new URL("./src/styles", import.meta.url))
		}
	},
	test: {
		include: ["src/**/*.test.ts"],
		exclude: ["node_modules", "dist", ".astro"],
		environment: "node",
		coverage: {
			provider: "v8",
			include: ["src/utils/**/*.ts", "src/i18n/**/*.ts"],
			reporter: ["text", "html"]
		}
	}
});
