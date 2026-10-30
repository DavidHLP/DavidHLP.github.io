---
{
  "archiveId": "X-1020",
  "title": "Documentation",
  "en": "DOCUMENTATION",
  "category": "特别项目",
  "department": "项目文档",
  "date": "2026-10-05",
  "lead": "DavidHLPL",
  "clearance": "PUBLIC",
  "abstract": "Documentation · docs/README.md",
  "findings": [
    "Original document: docs/README.md",
    "Source revision: f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64"
  ],
  "source": "https://github.com/DavidHLP/DavidHLP.github.io/blob/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/docs/README.md",
  "pubDate": "2026-10-05T05:34:00.000Z",
  "tags": [
    "docs",
    "documentation"
  ],
  "draft": false,
  "lang": "zh-CN",
  "legacy": {
    "path": "docs/README.md",
    "revision": "f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64",
    "metadata": {}
  }
}
---

# Documentation

This directory contains project documentation for the DavidHLPL technical blog.

## Documentation Structure

```
docs/
├── README.md           # This file
├── SCRIPTS.md          # Available npm scripts reference
├── ENV.md              # Environment variables and configuration
├── RUNBOOK.md          # Deployment and operations guide
├── UPDATE_SUMMARY.md   # Documentation update history
└── CODEMAPS/           # Architecture documentation
    ├── architecture.md # System architecture overview
    ├── frontend.md     # Page tree and component hierarchy
    ├── content.md      # Content collections and i18n
    └── dependencies.md # External dependencies
```

## Quick Links

- **Scripts**: [docs/SCRIPTS.md](/blog/legacy/documentation/docs/scripts/) - All available npm commands
- **Environment**: [docs/ENV.md](/blog/legacy/documentation/docs/env/) - Configuration and environment variables
- **Deployment**: [docs/RUNBOOK.md](/blog/legacy/documentation/docs/runbook/) - How to deploy and troubleshoot
- **Architecture**: [docs/CODEMAPS/](https://github.com/DavidHLP/DavidHLP.github.io/tree/f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64/docs/CODEMAPS) - System design and structure

## For Contributors

See [CONTRIBUTING.md](/blog/legacy/documentation/contributing/) for:
- Development environment setup
- Code style guidelines
- Testing procedures
- Pull request process

## For Operators

See [docs/RUNBOOK.md](/blog/legacy/documentation/docs/runbook/) for:
- Deployment procedures
- Health checks
- Common issues and fixes
- Emergency procedures

## Documentation Standards

### Auto-Generated Sections

Sections marked with `<!-- AUTO-GENERATED -->` are generated from source code:
- Do not manually edit these sections
- Run documentation update command to refresh
- Source of truth is in the code

### Manual Sections

All other documentation is manually maintained:
- Keep up to date with code changes
- Use clear, concise language
- Include examples where helpful

## Updating Documentation

### When to Update

- Adding new scripts or commands
- Changing environment variables
- Modifying deployment process
- Updating configuration options
- Fixing documentation errors

### How to Update

1. Edit the relevant documentation file
2. Keep auto-generated sections intact
3. Update this README if adding new files
4. Submit changes via pull request

## Documentation Tools

- **Markdown**: All documentation uses Markdown format
- **Code blocks**: Use fenced code blocks with language hints
- **Tables**: Use Markdown tables for structured data
- **Links**: Use relative links within the repository

## Style Guide

- Use present tense ("runs" not "will run")
- Be concise and direct
- Include code examples where helpful
- Use consistent formatting
- Keep lines under 100 characters when possible
