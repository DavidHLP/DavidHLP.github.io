# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`content/locales.json`**: the three-language vocabulary for categories, archive columns and access levels.
- **`docs/DOCUMENT-CLASSIFICATION.md`**: the authoritative documentation layers, domains and statuses.

`GLOSSARY.md` and `docs/adr/` are historical ThoughtLite artifacts. They now live under `docs/archive/` (`docs/archive/GLOSSARY.md`, `docs/archive/adr/`) and are not current decision or vocabulary sources. Read them only when investigating history.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## Use the current vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `content/locales.json` or the classification registry. Don't drift to synonyms those sources explicitly avoid.

If the concept you need isn't defined yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Treat archived decisions as history

The ADRs under `docs/archive/adr/` describe code that has been removed. Do not present them as current decisions or silently revive their conclusions. If a proposal contradicts a current document, surface the conflict explicitly:

> _Contradicts `docs/DOCUMENT-CLASSIFICATION.md` (…), but worth reopening because…_
