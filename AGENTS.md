# DavidHLPL blog using RhineLabUI-Astro

- This repository is the personal blog. `DavidHLP/RhineLabUI-Astro` is the generic upstream template; never move personal blog content or site configuration into that template.
- Preserve the existing Git repository, history, domain and GitHub Pages deployment. Merge upstream template changes on task branches.
- Blog configuration lives in `content/site.json`; editable template-compatible articles live in `content/blog/`. Preserve archive IDs, URLs, draft flags, languages and original metadata.
- `src/content/` and `migration/source/` preserve the original documents. Existing raw evidence is immutable and must not be edited, deleted or published as blog articles. Repository maintenance documents are archival, not blog posts. Follow `KB.md` for knowledge maintenance.
- Preserve the original personal introduction, linkroll, chronology, policy, notes and append-only knowledge log. Template migration does not authorize rewriting their substance.
- Keep five nonempty archive columns and preserve the native Three.js models, materials, light, camera, opening, free-plane drag, inertia, loop and per-column selection memory. Do not use frontend or animation design skills.
- Keep model extraction height and plane coordinates unchanged; portrait reading uses the model above independent body text. Distinguish browser emulation from real iPhone validation.
- Preserve model/font/audio licenses and attribution. Never commit individually licensed Novecento fonts.
- Run installation, builds, checks and services on `remote-dev`. Required checks: `npm run build`, `npm run check:content`, `npm run check:viewport`; run `npm run build:cloudflare` for packaging changes.
- Keep the GitHub Pages workflow functional. Finish authorized development through a task branch, validation, PR, CI/review and merge, without mixing unrelated changes.
