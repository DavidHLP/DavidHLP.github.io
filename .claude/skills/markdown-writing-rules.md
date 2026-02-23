---
name: markdown-writing-rules
description: Markdown format and writing rules for DavidHLP.github.io Astro blog
version: 1.0.0
source: local-git-analysis
analyzed_commits: 4
---

# Markdown Writing Rules

This skill defines the markdown format and writing conventions for the DavidHLP.github.io Astro blog project.

## Content Types & Directory Structure

The project has four content types organized by locale:

```
src/content/
├── note/{locale}/        # Long-form articles (core content)
├── jotting/{locale}/     # Short thoughts, micro-blog entries
├── preface/{locale}/     # Site announcements, introductory content
└── information/{locale}/ # Static pages (about, policies, linkroll)
```

Supported locales: `en`, `zh-cn`, `ja`

## Frontmatter Schema

### Note Collection

```yaml
---
title: Post Title # Required
timestamp: 2025-04-04 00:00:00+00:00 # Required (ISO format)
series: Astro # Optional - for grouped posts
tags: [Guide] # Optional - array of tags
description: "Brief description" # Optional - for SEO/excerpt
toc: true # Optional - show table of contents
top: 1 # Optional - pin priority (higher = more important)
draft: false # Optional - exclude from public listing
sensitive: false # Optional - mark as sensitive content
---
```

### Jotting Collection

```yaml
---
title: Jotting Title # Required
timestamp: 2025-04-04 00:00:00+00:00 # Required
tags: [Tag1, Tag2] # Optional
description: "Brief description" # Optional
top: 0 # Optional
draft: false # Optional
sensitive: false # Optional
---
```

### Preface Collection

```yaml
---
timestamp: 2025-04-04 00:00:00+00:00 # Required only
---
```

## Markdown Syntax Extensions

### Standard GFM

- Strikethrough: `~~text~~`
- Task lists: `- [ ] task` / `- [x] done`
- Tables with alignment

### Extended Syntax

#### Ruby Annotations (for CJK)

```
{拼音}(pīn|yīn)
{振り仮名}(ふ||が|な)
```

#### Spoiler Text

```
!!Hidden content!!
```

#### Emoji Shortcodes

```
:wink: :cry: :laughing: :yum:
```

Reference: [Emoji Cheat Sheet](https://github.com/ikatyang/emoji-cheat-sheet)

#### Math (KaTeX)

Inline: `$e^{ix} = \cos x + i \sin x$`

Block:

```
$$
(f*g)(t)=\int f(\tau)g(t-\tau)d\tau
$$
```

#### Footnotes

Standard: `Footnote[^1]` + `[^1]: Definition`

Inline: `Text^[Inline footnote content]`

#### Abbreviations

```
ABBR is an abbreviation.
*[ABBR]: Abbreviation Definition
```

#### GitHub Alerts

```
> [!NOTE]
> General information

> [!TIP]
> Optional suggestion

> [!IMPORTANT]
> Key information

> [!WARNING]
> Risk awareness

> [!CAUTION]
> Warning information

> [!NOTE] Custom Title
> Alert with custom title
```

#### Extended Tables (Cell Merging)

```
| Left | Center | Right |
|:-----|:------:|------:|
| Cell | Merged Cell ||  <- Rowspan
| Cell |    ^     ||    <- Continue merge
```

Use `||` for column span, `^` for row span.

#### Inline Element Attributes

Custom ID: `## Heading {#custom-id}`

Image width: `![](image.png){width=300}`

CSS classes: `**text**{.red .big}`

Custom attributes: `**text**{key="value"}`

#### Insert & Mark

Insert: `++inserted text++`

Mark/highlight: `==highlighted text==`

## Image Handling

### Recommended: Relative Path

For posts with images, use directory structure:

```
src/content/note/en/
└── my-post/
    ├── index.md
    └── photo.png
```

In `index.md`:

```md
![Image description](photo.png)
```

### External Image Hosting

```md
![Description](https://image.host/photo.png)
```

### Not Recommended: Absolute Path

```md
![Description](/photo.png) # No Astro optimization
```

## Code Blocks

Use triple backticks with language identifier:

````md
```ts
const greeting: string = "Hello";
```
````

Supported themes:

- Light: `github-light`
- Dark: `dark-plus`

Code copy button is auto-enabled.

## MDX Components

For `linkroll.mdx` files, import and use the Linkroll component:

```mdx
---
title: Linkroll
---

import Linkroll from "$components/Linkroll.astro";

export const links = [
	{
		title: "Example Site",
		url: "https://example.com",
		image: "https://example.com/favicon.ico",
		description: "Site description",
		type: "resources" // resources|community|insights|technology|expertise|creative|lifestyle|general
	}
];

<Linkroll locale={props.locale} links={links} />
```

## Writing Guidelines

### Notes (文记)

- Structured, in-depth long-form content
- Complete arguments or narratives
- Examples: reviews, research, stories, detailed guides

### Jottings (随笔)

- Lightweight, immediate recordings
- Scattered thoughts, inspirations, daily observations
- Short and concise format

### Preface (序文)

- Site homepage introduction
- Life updates, insights, site announcements
- Displayed as visitor's first impression

### Information

- `introduction.md`: Site characteristics and value proposition
- `policy.md`: Privacy policy, terms of service
- `linkroll.mdx`: Friend links and recommended resources
- `chronicle.yaml`: Site development timeline

## File Naming

- Use lowercase with hyphens: `my-article-title.md`
- For dated content, use timestamp format: `2025-04-06-00-00-00.md`
- Prefix with underscore for drafts (excluded from build): `_draft.md`

## Multilingual Content

When creating translated versions:

1. Create file in corresponding locale directory
2. Translate all frontmatter fields
3. Maintain same file ID across locales for cross-referencing

Example:

- `src/content/note/en/my-article.md`
- `src/content/note/zh-cn/my-article.md`
- `src/content/note/ja/my-article.md`
