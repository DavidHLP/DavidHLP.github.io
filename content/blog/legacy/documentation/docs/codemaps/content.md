---
{
  "archiveId": "X-1012",
  "title": "Content Architecture",
  "en": "DOCUMENTATION",
  "category": "特别项目",
  "department": "项目文档",
  "date": "2026-10-05",
  "lead": "DavidHLPL",
  "clearance": "PUBLIC",
  "abstract": "Content Architecture · docs/CODEMAPS/content.md",
  "findings": [
    "Original document: docs/CODEMAPS/content.md",
    "Source revision: f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/docs/CODEMAPS/content.md",
  "pubDate": "2026-10-05T05:34:00.000Z",
  "tags": [
    "docs",
    "documentation"
  ],
  "draft": false,
  "lang": "zh-CN",
  "legacy": {
    "path": "docs/CODEMAPS/content.md",
    "revision": "f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "metadata": {}
  }
}
---

<!-- Generated: 2026-06-01 | Files scanned: 45 | Token estimate: ~400 -->

# Content Architecture

## Content Collections

Defined in `src/content.config.ts`:

### note (Blog Articles)
- **Path**: `src/content/note/{locale}/*.md`
- **Schema**: title, timestamp, series?, tags?, description?, sensitive?, toc?, top?, draft?
- **Pagination**: 15 per page
- **Features**: TOC, series grouping, top pinning, draft mode

### jotting (Micro-blog)
- **Path**: `src/content/jotting/{locale}/*.md`
- **Schema**: title, timestamp, tags?, description?, sensitive?, top?, draft?
- **Pagination**: 24 per page
- **Features**: Simpler than note, no TOC/series

### preface (Intro Content)
- **Path**: `src/content/preface/{locale}/*.md`
- **Schema**: timestamp
- **Usage**: Site introduction, announcements

### information (Static Pages)
- **Path**: `src/content/information/{locale}/*.{md,yaml}`
- **Schema**: None (unstructured)
- **Usage**: About, policy, chronicle (YAML)

## i18n Structure

```
src/i18n/
├── index.ts              # i18n function factory
├── en/
│   ├── index.yaml        # UI translations
│   ├── script.yaml       # Script labels
│   └── linkroll.yaml     # Link categories
├── zh-cn/
│   └── (same structure)
└── ja/
    └── (same structure)
```

**Locales**: en, zh-cn, ja (default: zh-cn)

## Content Flow

```
Markdown/YAML files
    ↓
Astro Content Collections (glob loader)
    ↓
Schema validation (zod)
    ↓
Layout rendering (locale-aware)
    ↓
Static HTML pages
```

## Markdown Features

- **GFM**: Tables, strikethrough, task lists
- **Math**: KaTeX rendering
- **Diagrams**: Mermaid support
- **Code**: Shiki highlighting + copy button
- **Media**: Image figures, medium-zoom
- **CJK**: Chinese/Japanese typography support
- **Alerts**: GitHub-style callouts
- **Footnotes**: Extended footnote support
