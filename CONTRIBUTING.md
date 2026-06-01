# Contribution Guide

> [!Important]
> To ensure effective collaboration, please use **English** as the *primary language* for all Issues, Pull Requests, and Commit Messages.
>
> If you’re not comfortable writing in English, feel free to include a translation first, followed by your original text.

Thank you for your interest in contributing!

Before you dive in, please review the guidelines below.\
Following these steps ensures that all contributions align with the project’s vision and maintain a streamlined workflow.

## Development Environment Setup

### Prerequisites

- **Node.js**: 22.x or later
- **pnpm**: 10.30.0 or later
- **Git**: Latest version

### Installation

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/DavidHLP.github.io.git
   cd DavidHLP.github.io
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start development server**
   ```bash
   pnpm dev
   ```
   The site will be available at `http://localhost:4321`

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm new` | Create a new content file |
| `pnpm dev` | Start development server |
| `pnpm check` | Run type checking |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm format` | Format code |
| `pnpm lint` | Lint code |

For detailed script documentation, see [docs/SCRIPTS.md](docs/SCRIPTS.md).

## Code Style Enforcement

### Formatters and Linters

This project uses:
- **Biome**: Primary formatter and linter for JavaScript/TypeScript
- **Prettier**: Fallback for Astro and Svelte files
- **Husky**: Git hooks for pre-commit formatting
- **lint-staged**: Format only staged files

### Pre-commit Hooks

When you commit changes, Husky will automatically:
1. Run Biome on staged files
2. Format code according to project standards
3. Prevent commits with formatting issues

### Manual Formatting

```bash
# Format all files
pnpm format

# Check for linting issues
pnpm lint

# Run both format and lint
pnpm format && pnpm lint
```

## Testing Procedures

### Type Checking

```bash
pnpm check
```

This runs Astro’s type checker to validate:
- TypeScript types in `.astro` files
- Content collection schemas
- Configuration validity

### Build Verification

```bash
pnpm build
```

Always verify your changes build successfully before submitting a PR.

### Content Validation

When creating or modifying content:
1. Ensure frontmatter schema is correct
2. Test with different locales if applicable
3. Verify markdown rendering

## Content Creation

### Using the New Command

```bash
pnpm new
```

This interactive script will:
1. Ask for content type (note/jotting)
2. Prompt for title and metadata
3. Create the file in the correct directory

### Content Structure

- **note/**: Long-form articles with full metadata
- **jotting/**: Short posts with minimal metadata
- **preface/**: Homepage introductory content
- **information/**: Static pages (about, policy)

### i18n Support

All content supports three locales:
- `en`: English
- `zh-cn`: Simplified Chinese
- `ja`: Japanese

Create content in all supported locales when possible.

## Issues

> [!Tip]
> **Developers in mainland China**:\
> Before creating an Issue regarding connectivity, please verify that the *terminal environment* has unrestricted access to GitHub and Google services.

- Check existing Issues (*including closed ones*) to avoid duplicates.
- Follow the provided **template** to ensure all necessary context is included.

### Bug Reports

- Document the steps to reproduce the bug and the expected behavior.
- Whenever possible, provide a link to a live demo, a screenshot, or the relevant configuration files to help isolate the Issue.

### Enhancement Proposals

- Clearly describe the proposed enhancement and its intended function.
- Outline the reasoning behind the request and how it improves the user experience.
- Whenever possible, provide examples, references, or mockups to illustrate the concept.

## Pull Requests

> [!Warning]
> **About AI Assistance**:\
> Pull Requests failing to meet the following requirements will be **closed immediately**:
> - Manually review and test all code to prevent hallucinated logic or syntax
> - Ensure PR descriptions provide clear, meaningful value to the review process
> - Maintain strict adherence to the established workflow and commit specifications
> - Disclose any use of AI tools for code or documentation generation within the PR description

- An Issue describing the problem or feature is **required** before submitting a Pull Request.
- A **single problem** or a **single feature** per Pull Request to avoid bundling unrelated changes.
- Updated documentation for any new **user-facing features** or **configuration options**.
- Separate Pull Requests for **code refactoring** before submitting a new feature.
- Compliance with **basic tests** and the project's existing **code style**.

> [!Note]
> This project uses [Biome](https://biomejs.dev/) as the primary formatter and linter.\
> Due to current limitations in Biome's formatting for **Astro** and **Svelte** files, Prettier is used as a fallback for those specific file types.\
> Please format with Prettier first, then run Biome.

### Development Workflow

1. [Fork](https://github.com/tuyuritio/astro-theme-thought-lite/fork) this repository to your own GitHub account.
2. Create a new branch for your changes: `git checkout -b feat/your-feature`
3. Make your changes and [commit](#commit-convention) them: `git commit -m "feat: add new feature"`.
4. Pull the latest changes from the base repository to avoid conflicts: `git pull origin main`
5. Push your branch to your fork: `git push origin feat/your-feature`
6. Open a Pull Request from your branch to the appropriate base branch in this repository.

### Commit Convention

Using [Conventional Commits](https://www.conventionalcommits.org/). The commit message format is:

```
<type>[(<scope>)]: <description>
```

**Common Types**:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring

---

Thank you for your contribution ❤️
