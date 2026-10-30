# DavidHLPL Blog

Personal blog and engineering knowledge base at [davidhlp.github.io](https://davidhlp.github.io), built with the [RhineLabUI-Astro upstream template](https://github.com/DavidHLP/RhineLabUI-Astro).

The blog repository, original documents, licenses and Git history are preserved. The owner approved publishing the 74 existing English/Japanese translations; the explicit changes are recorded in [publication overrides](migration/publication-overrides.json), while source snapshots and original draft metadata remain unchanged. All 67 article groups now have three published language versions. Template sample posts remain excluded. See [migration notes and inventory](migration/README.md).

See [full-content language switching](docs/I18N.md) for language routing, catalogs, downloads and validation.

## Development

Use Node.js 22.12 or newer and run dependencies, builds and checks on `remote-dev`:

```sh
npm ci
npm run dev
npm run build
npm run check:content
npm run check:viewport
```

`content/site.json` configures the blog identity and five archive columns. Editable articles live in `content/blog/legacy/`. Original `src/content/` documents and `migration/source/` snapshots remain unchanged. The build includes RSS, search, offline reading and TXT downloads. The GitHub Pages workflow deploys `dist/` from `main` after validation.

## Upstream template

```sh
git remote add upstream git@github.com:DavidHLP/RhineLabUI-Astro.git
git fetch upstream
```

The template's history is included in this repository so future upstream changes can be merged on a task branch and reviewed alongside blog-specific configuration. The GitHub repository itself is retained rather than deleted and recreated.

The original blog GPL license, content policies and third-party asset attribution remain applicable. The upstream template's MIT notice is included under `public/licenses/`.
