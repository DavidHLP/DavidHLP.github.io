<!-- AUTO-GENERATED -->
# Environment Variables

## Configuration

### `.env` File

Create a `.env` file in the project root with the following variables:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PUBLIC_TIMEZONE` | No | Timezone for date/time display | `Asia/Shanghai` |

### `.env.example`

```bash
# Basic configuration
PUBLIC_TIMEZONE=
```

## Usage

### In Astro Components

```typescript
// Access environment variables in Astro components
const timezone = import.meta.env.PUBLIC_TIMEZONE;
```

### In Client-Side Code

Only variables prefixed with `PUBLIC_` are exposed to client-side code:

```typescript
// This works in browser
console.log(import.meta.env.PUBLIC_TIMEZONE);

// This only works in server-side code
console.log(import.meta.env.SECRET_KEY);
```

## Configuration Files

### `site.config.ts`

Main site configuration file that defines:

- **title**: Site title
- **prologue**: Site tagline
- **author**: Author information (name, email, link)
- **description**: Site description
- **copyright**: License configuration
- **i18n**: Internationalization settings
  - `locales`: Supported language codes
  - `defaultLocale`: Default language
- **pagination**: Items per page for each content type
- **heatmap**: Contribution heatmap configuration
- **feed**: RSS feed configuration
- **latest**: Latest content display settings

### `astro.config.ts`

Astro framework configuration:

- **site**: Site URL (`https://davidhlp.github.io`)
- **trailingSlash**: URL trailing slash behavior
- **i18n**: Internationalization routing
- **markdown**: Remark/Rehype plugin configuration
- **vite**: Vite build configuration
- **integrations**: Astro integrations (Svelte, MDX, Sitemap, Swup)
- **experimental.fonts**: Font configuration

### `tsconfig.json`

TypeScript configuration with path aliases:

```json
{
  "compilerOptions": {
    "paths": {
      "$config": ["./site.config.ts"],
      "$layouts/*": ["./src/layouts/*"],
      "$components/*": ["./src/components/*"],
      "$styles/*": ["./src/styles/*"],
      "$utils/*": ["./src/utils/*"]
    }
  }
}
```

## Build Environment

### Requirements

- **Node.js**: 22.x or later
- **pnpm**: 10.30.0 or later
- **OS**: Linux, macOS, or Windows (WSL recommended)

### CI/CD Environment

GitHub Actions uses:
- **Runner**: `ubuntu-latest`
- **Node.js**: 22
- **pnpm**: 10.30.0
<!-- /AUTO-GENERATED -->
