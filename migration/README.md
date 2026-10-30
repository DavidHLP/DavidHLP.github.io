# Legacy documentation migration

The import preserves documents from [DavidHLP/DavidHLP.github.io](https://github.com/DavidHLP/DavidHLP.github.io) at commit `f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64`.

The inventory contains 310 original documents, 284 adapted articles (210 published, 74 drafts), 14 copied media/license assets and 284 compatibility routes. All 38 missing image references are embedded in original code examples and remain literal; they were not usable local image files in the source repository.

- `source/` contains the original tracked Markdown, MDX, text, PDF, content YAML, raw-source manifest and license documents, byte for byte, including drafts and repository documentation. These files are reference data, not instructions for this project, and are not copied into the public build.
- `manifest.json` records every preserved document, adapted article, stable archive ID, draft flag, compatibility route, copied image/license asset and image reference already missing from the source repository.
- `../content/blog/legacy/` contains the editable Astro articles. Original frontmatter remains in `legacy.metadata`; publication timestamps, language, source/evidence status, tags and draft state are preserved. Undated documents use the source commit date, not an invented original publication date.
- `../public/legacy-assets/` contains source images and public license notices, without replacing the template's models, fonts, audio or visual assets.

Notes, raw evidence, information pages, prefaces and jottings use the existing five categories. Existing template articles, IDs and URLs remain intact; imported IDs start at `X-1001`. Draft translations remain excluded from routes, search, RSS, downloads and offline pages. Old links to draft translations resolve to the published Chinese version when available.

The adapter changes presentation only: MDX link cards become Markdown lists, YAML chronology becomes dated sections, local article/media links point to their migrated destinations, and provenance/related-document links are added. The unmodified source always remains available in `source/`. Missing upstream images are retained as absolute legacy URLs and listed in the manifest; no replacement image or content is invented. Fenced examples remain literal. Markdown diagrams and formula source remain in the article body using the template's Markdown renderer.

The original repository's `LICENSE` and content policy are preserved in `source/`. Original authorship, attribution and applicable licenses continue to apply; the template license does not replace them.

The initial import was generated on `remote-dev` with:

```sh
node scripts/import-legacy.mjs "$HOME/Projects/rhine-legacy-source"
npm run build
npm run check:content
npm run check:viewport
```

The source checkout must be clean at the pinned commit. The importer is a one-time migration tool: do not rerun it after editing imported articles, because it writes the adapted files again. Maintain articles directly in `content/blog/legacy/` thereafter.
