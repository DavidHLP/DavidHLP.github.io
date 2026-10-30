<!-- Generated: 2026-06-01 | Files scanned: 45 | Token estimate: ~600 -->

# Architecture Overview

## Project Type
Single Astro blog application with Svelte components, deployed to GitHub Pages.

## Tech Stack
- **Framework**: Astro 5.x (SSG)
- **UI Components**: Svelte 5.x
- **Styling**: Tailwind CSS 4.x
- **Build**: Vite
- **Package Manager**: pnpm
- **Deployment**: GitHub Pages via GitHub Actions

## Core Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Astro SSG Build                        │
├─────────────────────────────────────────────────────────────┤
│  Content Collections (Markdown/YAML)                        │
│  ├── note/     (blog articles)                              │
│  ├── jotting/  (micro-blog)                                 │
│  ├── preface/  (intro content)                              │
│  └── information/ (static pages)                            │
├─────────────────────────────────────────────────────────────┤
│  i18n Layer (en, zh-cn, ja)                                 │
│  ├── YAML translation files                                 │
│  └── Locale-based routing ([...locale]/)                    │
├─────────────────────────────────────────────────────────────┤
│  Rendering Pipeline                                         │
│  ├── Remark plugins (GFM, math, mermaid, CJK, etc.)         │
│  ├── Rehype plugins (anchors, katex, figures, etc.)          │
│  └── Shiki code highlighting                                │
├─────────────────────────────────────────────────────────────┤
│  UI Layer                                                   │
│  ├── Astro layouts (App, Base, Header, Footer)              │
│  ├── Svelte interactive components                          │
│  └── Tailwind CSS styling                                   │
└─────────────────────────────────────────────────────────────┘
```

## Key Directories

```
src/
├── components/      # Svelte + Astro UI components
├── content/         # Content collections (note, jotting, preface, information)
├── fonts/           # Font configuration
├── graph/           # OG image generation
├── i18n/            # Translation YAML files (en, zh-cn, ja)
├── icons/           # Icon assets
├── layouts/         # Page layouts (App, Base, Header, Footer)
├── pages/           # Route pages ([...locale]/)
├── styles/          # Global CSS (Tailwind, markdown)
└── utils/           # Utilities (config, time, mermaid, reading)
```

## Data Flow

```
Content (Markdown/YAML)
    ↓
Astro Content Collections (schema validation)
    ↓
Remark/Rehype Pipeline (MDX, math, mermaid, CJK)
    ↓
Layout Chain (App → Base → Header/Footer)
    ↓
Static HTML Output
```

## External Dependencies

- **Fonts**: Google Fonts (Noto Serif, JetBrains Mono, Playwrite MX)
- **Icons**: Iconify (lucide, fa6-brands, simple-icons)
- **Math**: KaTeX
- **Diagrams**: Mermaid
- **Code**: Shiki (syntax highlighting)
- **Images**: medium-zoom, satori (OG images)
- **Transitions**: swup (page transitions)
