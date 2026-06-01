<!-- AUTO-GENERATED -->
# Script Reference

## Available Commands

| Command | Description |
|---------|-------------|
| `pnpm new` | Create a new content file using interactive prompts |
| `pnpm dev` | Start local development server (default: `http://localhost:4321`) |
| `pnpm check` | Run Astro type checking |
| `pnpm build` | Build production version |
| `pnpm preview` | Preview the built site locally |
| `pnpm format` | Format code using Biome |
| `pnpm lint` | Lint code using Biome |
| `pnpm count` | Count git lines added/removed |
| `pnpm prepare` | Set up Husky git hooks |

## Script Details

### `pnpm new`
```bash
tsx --loader esm-loader-yaml scripts/new.ts
```
Interactive content creation script. Guides through:
- Content type selection (note/jotting)
- Title and metadata input
- Locale selection
- File placement in appropriate content directory

### `pnpm dev`
```bash
astro dev
```
Starts Astro development server with:
- Hot module replacement (HMR)
- Live reload on file changes
- Default port: 4321

### `pnpm check`
```bash
astro check
```
Runs Astro's built-in type checker to validate:
- TypeScript types in `.astro` files
- Content collection schemas
- Configuration validity

### `pnpm build`
```bash
astro build
```
Production build that:
- Compiles all pages to static HTML
- Bundles and minifies JavaScript/CSS
- Generates sitemap and RSS feed
- Outputs to `dist/` directory

### `pnpm preview`
```bash
astro preview
```
Serves the production build locally for testing before deployment.

### `pnpm format`
```bash
biome format --write
```
Formats all supported files using Biome:
- JavaScript/TypeScript
- JSON/JSONC
- CSS
- Svelte/Astro (fallback to Prettier)

### `pnpm lint`
```bash
biome lint
```
Lints code using Biome for:
- Code style violations
- Potential bugs
- Best practices

### `pnpm count`
```bash
git log --pretty=tformat: --numstat | grep -v package | awk '{ A += $1; S += $2; T += $1 - $2 } END { printf "+ %s\tLines\n- %s\tLines\n= %s\tLines\n", A, S, T }'
```
Shows git statistics:
- Lines added
- Lines removed
- Net change

### `pnpm prepare`
```bash
husky
```
Sets up Git hooks via Husky for:
- Pre-commit: lint-staged formatting
- Commit message validation

## CI/CD Scripts

### GitHub Actions Workflows

#### Deploy (`deploy.yml`)
- **Trigger**: Push to `main` branch
- **Actions**: Build → Deploy to GitHub Pages
- **Environment**: Node.js 22, pnpm 10.30.0

#### Quality (`quality.yaml`)
- **Trigger**: Pull requests
- **Actions**: Run Biome CI checks
- **Purpose**: Code quality enforcement

#### Release (`release.yaml`)
- **Trigger**: Release events
- **Actions**: Automated versioning and changelog
<!-- /AUTO-GENERATED -->
