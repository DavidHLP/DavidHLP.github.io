# Contribution Guide

> [!Important]
> To ensure effective collaboration, please use **English** as the *primary language* for all Issues, Pull Requests, and Commit Messages.
>
> If you’re not comfortable writing in English, feel free to include a translation first, followed by your original text.

Thank you for your interest in contributing. This repository is the personal blog `DavidHLP/DavidHLP.github.io`; the generic template lives separately at `DavidHLP/RhineLabUI-Astro`.

## Development Environment Setup

### Prerequisites

- **Node.js**: 22.12 or later
- **npm**: bundled with Node.js, using `package-lock.json`
- **Git**: latest version

### Installation

1. **Fork and clone this repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/DavidHLP.github.io.git
   cd DavidHLP.github.io
   ```

2. **Install dependencies**
   ```bash
   npm ci
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   The site is available at `http://127.0.0.1:4321`.

Run installation, builds and checks on `remote-dev`.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Run `astro check`, build the site and generate PWA output |
| `npm run preview` | Preview the production build |
| `npm run check` | Run `astro check` only |
| `npm run check:content` | Validate content and the Fuwari archive |
| `npm run check:viewport` | Check viewport constraints |
| `npm run build:cloudflare` | Build and package for Cloudflare |
| `npm run format` | Format with Prettier |
| `npm run kb:lint` | Validate knowledge-base evidence and index invariants |
| `npm run test:kb` | Run the knowledge-base ingestion tests |

For detailed script documentation, see [docs/SCRIPTS.md](docs/SCRIPTS.md).

## Code Style

- **Prettier** is the formatter. Run `npm run format` before committing.
- No git hook or staged-file formatting setup is required.
- Keep Astro components and project conventions consistent with the surrounding code.

## Testing Procedures

### Type Checking

```bash
npm run check
```

### Build Verification

```bash
npm run build
```

### Content Validation

```bash
npm run check:content
npm run check:viewport
npm run kb:lint
npm run test:kb
```

Always verify your changes build and pass the content checks before submitting a PR.

## Content Structure

Editable articles live under `content/blog/legacy/`:

- `note/`: long-form, evidence-backed knowledge pages.
- `jotting/`: short posts and the knowledge-base inbox.
- `information/`: about, policy, linkroll, chronology and knowledge-base index/log.
- `preface/`: site preface.

`src/content/` is a frozen migration snapshot. `src/content/raw/` is immutable evidence and must not be edited. Do not edit or delete archive IDs, URLs, draft flags, languages or original metadata.

All published content supports three locales: `en`, `zh-cn` and `ja`. The knowledge base uses `zh-cn` as its canonical language. When a change touches the knowledge base, read `KB.md` and `.claude/skills/knowledge-base.md` first.

## Issues

Issues live in this repository's GitHub Issues and are managed with the `gh` CLI; see [docs/agents/issue-tracker.md](docs/agents/issue-tracker.md).

- Check existing issues, including closed ones, to avoid duplicates.
- Use the provided templates.
- For bug reports, document the reproduction steps, expected behavior and environment.
- For proposals, describe the problem, the intended behavior and the reasoning.

## Pull Requests

> [!Warning]
> **About AI Assistance**:
> Pull Requests failing to meet the following requirements will be **closed immediately**:
> - Manually review and test all code to prevent hallucinated logic or syntax.
> - Ensure PR descriptions provide clear, meaningful value to the review process.
> - Maintain strict adherence to the established workflow and commit specifications.
> - Disclose any use of AI tools for code or documentation generation within the PR description.

- An issue describing the problem or feature is required before submitting a Pull Request.
- Keep a **single problem or single feature** per Pull Request; do not bundle unrelated changes.
- Update documentation for any new user-facing feature or configuration option.
- Submit code refactoring in a separate Pull Request.
- Ensure the required checks and the project's code style pass.

### Development Workflow

1. [Fork](https://github.com/DavidHLP/DavidHLP.github.io/fork) this repository to your own GitHub account.
2. Create a new branch: `git checkout -b feat/your-feature`.
3. Make your changes and commit them: `git commit -m "feat: add new feature"`.
4. Pull the latest changes from the base repository: `git pull origin main`.
5. Push your branch: `git push origin feat/your-feature`.
6. Open a Pull Request against this repository.

### Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[(<scope>)]: <description>
```

**Common Types**:

- `feat`: a new feature
- `fix`: a bug fix
- `docs`: documentation changes
- `style`: code style changes
- `refactor`: code refactoring

---

Thank you for your contribution.
