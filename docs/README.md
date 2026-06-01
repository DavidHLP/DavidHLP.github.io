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

- **Scripts**: [docs/SCRIPTS.md](SCRIPTS.md) - All available npm commands
- **Environment**: [docs/ENV.md](ENV.md) - Configuration and environment variables
- **Deployment**: [docs/RUNBOOK.md](RUNBOOK.md) - How to deploy and troubleshoot
- **Architecture**: [docs/CODEMAPS/](CODEMAPS/) - System design and structure

## For Contributors

See [CONTRIBUTING.md](../CONTRIBUTING.md) for:
- Development environment setup
- Code style guidelines
- Testing procedures
- Pull request process

## For Operators

See [docs/RUNBOOK.md](RUNBOOK.md) for:
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
