<!-- Generated: 2026-06-01 | Files scanned: 45 | Token estimate: ~500 -->

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

## Component Hierarchy

```
Layouts
├── App.astro             # Root HTML shell (fonts, meta, theme)
│   └── Base.astro        # Page wrapper (header, footer, scripts)
│       ├── Header.astro  # Site header
│       │   ├── Navigator.svelte    # Mobile nav menu
│       │   ├── LanguagePicker.svelte # Locale switcher
│       │   ├── Menu.astro          # Desktop menu
│       │   └── ThemeSwitcher.astro # Dark/light toggle
│       └── Footer.astro # Site footer

Components
├── Heatmap.astro         # Contribution heatmap
├── Linkroll.astro        # Link collection
├── Position.astro        # Position display
├── TOC.astro             # Table of contents
├── Icon.svelte           # Icon wrapper (Iconify)
├── Jotting.svelte        # Jotting card
├── Note.svelte           # Note card
├── Pagination.svelte     # Pagination controls
└── Sensitive.svelte      # Content warning overlay
```

## State Management

- **Theme**: `localStorage.getItem("theme")` → `document.documentElement.dataset.theme`
- **Locale**: URL-based routing (`/[...locale]/`)
- **Page Transitions**: swup (client-side navigation)
- **No client-side store**: Static site, no global state management needed

## Styling

- **Global**: `src/styles/global.css`, `src/styles/markdown.css`
- **Components**: Tailwind CSS utility classes
- **Fonts**: CSS variables (`--font-noto-serif`, `--font-maple-mono-nf-cn`, etc.)
