# DavidHLPL · ThoughtLite Knowledge Base

[English](README.md) · [简体中文](README.zh-cn.md) · [日本語](README.ja.md)

DavidHLPL is a multilingual personal blog and evidence-backed AI knowledge base built on Astro. It follows the content workflow of [ThoughtLite](https://github.com/tuyuritio/astro-theme-thought-lite) and adapts the interactive 3D archive terminal from [RhineLabUI](https://github.com/LBEILC/RhineLabUI) while keeping the site's own content, translations, and knowledge-base rules in this repository.

Published notes and jottings are rendered as locale-aware pages, feeds, and searchable archive records. The site is static and does not require a database, API key, or backend service.

> The full archive interface uses WebGL 2, while a generated HTML article directory remains available when JavaScript or WebGL cannot run.

## Features

- **Interactive archive OS** — Three.js boot sequence, archive browsing, category and keyword search, article details, favorites, text export, and a 360° model viewer with decryption and assembly interactions.
- **Evidence-backed knowledge base** — Stable `note` pages, lightweight `jotting` entries, and immutable `raw` source material follow the project's editorial workflow.
- **Content-driven archive** — Archive records are generated at build time from the current locale's published `note` and `jotting` entries; drafts, underscored files, and raw sources are not published into the archive.
- **Astro content pipeline** — Markdown and MDX support with syntax highlighting, math, Mermaid, tables, images, footnotes, reading time, and automatic headings.
- **Multilingual routing** — English, Simplified Chinese, and Japanese routes with `zh-cn` as the canonical knowledge-base language.
- **Theme and responsive support** — Light/dark themes, responsive layouts, touch-friendly navigation, and reduced-motion preferences.
- **Static publishing** — Atom feeds, sitemap generation, Open Graph metadata, and a static `dist/` output suitable for GitHub Pages or another static host.
- **Graceful fallback** — Empty archives, disabled JavaScript, or failed WebGL loading still expose a generated HTML article directory.
- **Content protection rules** — Raw sources and knowledge-base logs remain separate from published collections and are handled by the repository's documented invariants.

The embedded Rhine interface is adapted for this blog. The upstream project's standalone PWA and Wallpaper Engine host features are not enabled here.

## Quick start

### Requirements

- Node.js 22.12 or newer.
- pnpm 10.30.0, as declared by `package.json`.
- A modern browser with WebGL 2 for the full archive experience.

### Install and run

```sh
git clone https://github.com/DavidHLP/DavidHLP.github.io.git
cd DavidHLP.github.io
pnpm install --frozen-lockfile
pnpm dev
```

Open the address printed by Astro, normally [`http://localhost:4321`](http://localhost:4321). If the local environment does not resolve `localhost` correctly, use:

```sh
pnpm dev --host 127.0.0.1
```

### Build and preview

```sh
pnpm build
pnpm preview
```

The production site is written to `dist/`. Serve it through an HTTP server; do not open `dist/index.html` directly.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm install --frozen-lockfile` | Install the locked dependency set |
| `pnpm new` | Create a new content file through the project helper |
| `pnpm dev` | Start the Astro development server on port 4321 by default |
| `pnpm check` | Run Astro and TypeScript checks |
| `pnpm test:run` | Run the Vitest test suite once |
| `pnpm build` | Build the static production site |
| `pnpm preview` | Preview the built site locally |
| `pnpm format` | Format supported source files with Biome |
| `pnpm lint` | Run Biome lint checks |
| `pnpm kb:lint` | Validate the knowledge-base evidence and index invariants |
| `node scripts/editorial-smoke.mjs` | Validate generated routes, archive records, assets, and licenses after a build |

## Project structure

| Path | Responsibility |
| --- | --- |
| `src/components/RhineArchive.astro` | Connect Astro content collections to the archive interface and provide the HTML fallback directory |
| `src/rhine/` | Adapted Three.js archive UI, boot sequence, model viewer, audio, motion, and rendering controls |
| `src/content/note/{locale}/` | Stable, evidence-backed knowledge pages |
| `src/content/jotting/{locale}/` | Lightweight notes and the knowledge-base intake queue |
| `src/content/information/{locale}/` | Introduction, policy, links, chronology, knowledge-base index, and log |
| `src/content/preface/{locale}/` | Preface content used by the site |
| `src/content/raw/{locale}/` | Immutable source material for knowledge-base pages; not a public collection |
| `src/i18n/` | Translation resources for `en`, `zh-cn`, and `ja` |
| `src/components/` | Reusable Astro and Svelte UI components |
| `src/pages/[...locale]/` | Locale-aware routes for the home page, archive, content, feeds, and information pages |
| `src/layouts/` | Shared page and document layouts |
| `public/assets/` | Runtime models and other archive assets |
| `public/audio/` | Archive audio, source notes, and generation metadata |
| `public/fonts/` | MiSans webfonts and their notices/licenses |
| `public/licenses/` | Third-party license texts used by the integrated UI |
| `docs/rhine-migration.md` | Migration scope, content mapping, fallback behavior, and verification notes |
| `site.config.ts` | Site identity, locale, content, pagination, and feed configuration |
| `astro.config.ts` | Astro integrations, Markdown/MDX processing, routing, sitemap, and build behavior |

## Content and knowledge base

Published content is organized by locale and collection:

- `note` contains carefully structured technical and engineering knowledge.
- `jotting` contains lightweight observations and material waiting to be compiled into stable knowledge pages.
- `information` contains the introduction, policy, links, chronology, and knowledge-base indexes/logs.
- `preface` contains site prefaces.
- `raw` preserves source material as an immutable evidence layer and is not listed as public content.

The knowledge base uses `zh-cn` as its canonical language. English and Japanese pages are maintained as translations when a multilingual output is required. New published entries are picked up by the archive, generated routes, and feeds on the next build.

## Configuration

The main configuration entry points are:

- [`site.config.ts`](site.config.ts) — site identity, author, description, locales, pagination, feed, and latest-content settings.
- [`astro.config.ts`](astro.config.ts) — Astro integrations, Markdown/MDX processing, locale routing, aliases, sitemap, and build behavior.
- [`src/i18n/`](src/i18n/) — interface translations and labels.

## Deployment and validation

The repository is configured for GitHub Pages. Pushes to `main` start the deployment workflow, which first reuses the validation workflow; only after validation succeeds does it install the locked pnpm dependencies, build `dist/`, add `.nojekyll`, and publish the result through GitHub Pages.

The validation workflow runs Biome checks, type checks, unit tests, the static build, archive/resource smoke checks, committed SVG checks, and browser/print smoke checks for the about page at desktop and mobile widths.

For a local validation pass:

```sh
pnpm check
pnpm test:run
pnpm build
node scripts/editorial-smoke.mjs
```

## Upstream and licensing

This repository combines two upstream layers with the site's own content and integration code:

- [ThoughtLite](https://github.com/tuyuritio/astro-theme-thought-lite) provides the original Astro content-theme foundation. See the [upstream README](https://raw.githubusercontent.com/tuyuritio/astro-theme-thought-lite/refs/heads/main/README.md). The project license remains [GPLv3](LICENSE).
- [RhineLabUI](https://github.com/LBEILC/RhineLabUI) provides the adapted Three.js archive interface. The integrated source is kept at `src/rhine/` and pinned to the reviewed commit `8799b03179a9a0ebd2611843e644a5a0530b24bf`. See the [upstream README](https://raw.githubusercontent.com/LBEILC/RhineLabUI/refs/heads/main/README.md) and the local [MIT license notice](public/licenses/RhineLabUI-MIT.txt).

The RhineLabUI MIT notice applies only to the covered adapted interface code; it does not relicense every file or asset in this repository. MiSans, Rolling Number, audio files, other dependencies, and the names, logos, models, and source material associated with the referenced work retain their own rights and notices. See [`public/fonts/NOTICE.txt`](public/fonts/NOTICE.txt), [`public/audio/README.md`](public/audio/README.md), [`public/licenses/rolling-number.txt`](public/licenses/rolling-number.txt), and [`docs/rhine-migration.md`](docs/rhine-migration.md).

The original RhineLabUI project is an unofficial interface recreation and is not affiliated with the owners of the referenced game, characters, logos, or source video. The rights to those third-party works remain with their respective owners.

## References

- [DavidHLPL](https://github.com/DavidHLP)
- [DavidHLP.github.io](https://github.com/DavidHLP/DavidHLP.github.io)
- [ThoughtLite](https://github.com/tuyuritio/astro-theme-thought-lite)
- [RhineLabUI](https://github.com/LBEILC/RhineLabUI)
