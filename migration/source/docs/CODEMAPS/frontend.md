<!-- Generated: 2026-07-02 | Files scanned: 50+ | Token estimate: ~600 -->

# Frontend Architecture

## Page Tree

```
/[...locale]/
├── index.astro           # Homepage with heatmap + latest content
├── about.astro           # About page
├── policy.astro          # Privacy policy
├── preface.astro         # Preface/intro content
├── feed.xml.ts           # RSS feed
├── feed.xsl.ts           # RSS feed stylesheet
├── note/
│   ├── index.astro       # Note listing (paginated)
│   └── [...id]/
│       ├── index.astro   # Single note page
│       └── graph.png.ts  # OG image for note
└── jotting/
    ├── index.astro       # Jotting listing (paginated)
    └── [...id]/
        ├── index.astro   # Single jotting page
        └── graph.png.ts  # OG image for jotting

/404.astro                # 404 error page
/500.astro                # 500 error page
/robots.txt.ts            # Robots.txt generator
/graph.png.ts             # Default OG image
```

## Layout Chain

```
App.astro             # Root HTML shell (fonts, meta, theme)
└── Base.astro        # Page wrapper (header, footer, scripts)
    ├── Header.astro  # Site header
    │   ├── Navigator.svelte     # Mobile nav menu
    │   ├── LanguagePicker.svelte # Locale switcher
    │   ├── Menu.astro           # Desktop menu
    │   └── ThemeSwitcher.astro  # Dark/light toggle
    └── Footer.astro  # Site footer
```

`Base.astro` mounts `src/scripts/` as a single side-effecting import; the
scripts directory owns every client-side enhancer (PhotoSwipe, Mermaid,
time localisation, theme observer). Each enhancer is a single named
export so future code can opt-in to one without loading the others.

## Components

| Component | Type | Role |
|---|---|---|
| `Heatmap.astro` | Astro | Contribution heatmap (day / week / month) |
| `Linkroll.astro` | Astro | Link collection card grid |
| `Position.astro` | Astro | Breadcrumb / position display |
| `TOC.astro` | Astro | Table of contents (note detail) |
| `ContentHeader.astro` | Astro | Article header (title + meta bar) |
| `ContentListingHeader.astro` | Astro | Listing-page `[ ARCHIVE.INDEX // NN ]` header |
| `TechBorder.astro` | Astro | Decorative four-corner crosshair panel dressing |
| `ContentList.svelte` | Svelte | Unified Note / Jotting listing card with filter + pagination |
| `Pagination.svelte` | Svelte | Pagination controls |
| `Icon.svelte` | Svelte | Iconify icon wrapper |
| `Sensitive.svelte` | Svelte | Content warning overlay (uses `window.zoom` / `window.initializeMermaid`) |

## Client-side Scripts

```
src/scripts/
├── index.ts              # Orchestrator: mounts every enhancer on load + on swup transitions
├── time-localize.ts      # Sets <time>.title to the visitor's locale + timezone
├── photoswipe-init.ts    # Wraps .markdown img and (re)builds the PhotoSwipe lightbox
├── mermaid-init.ts       # Re-renders .mermaid diagrams, normalises SVGs, wires zoom preview
└── theme-observer.ts     # MutationObserver on <html data-theme>; re-runs theme-aware enhancers
```

The window-attached shims `window.zoom` and `window.initializeMermaid`
(declared in `index.d.ts`) are preserved for back-compat with
`Sensitive.svelte`; new code should import the named exports from
`$scripts` directly.

## State Management

- **Theme**: `localStorage.getItem("theme")` → `document.documentElement.dataset.theme`
- **Locale**: URL-based routing (`/[...locale]/`)
- **Page Transitions**: swup (client-side navigation)
- **No client-side store**: Static site, no global state management needed

## Styling

- **Global**: `src/styles/global.css`, `src/styles/markdown.css`
- **Components**: Tailwind CSS utility classes
- **Fonts**: CSS variables (`--font-noto-serif`, `--font-maple-mono-nf-cn`, etc.)
- **Path aliases** (tsconfig): `$config`, `$public/*`, `$assets/*`, `$icons/*`,
  `$graph/*`, `$utils/*`, `$components/*`, `$i18n`, `$layouts/*`, `$scripts/*`,
  `$styles/*`
