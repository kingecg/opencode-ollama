# AGENTS.md

This file provides context and instructions for AI coding agents working on this repository.

## Project Overview

This is an OpenCode Ollama plugin built with Bun and TypeScript. The plugin fetches model lists from an Ollama API endpoint and configures them into OpenCode.

## Build / Lint / Test Commands

```bash
# Install dependencies
bun install

# Development
bun run dev              # Run with hot reload (--watch)
bun run start            # Run once
bun run index.ts         # Run once (alias)

# Build
bun run clean            # Clean dist directory
bun run build            # Build to ./dist/index.js and CLI wrapper
bun run build:cli-wrapper  # Build CLI wrapper with shebang for direct execution
bun run build:cli        # Build compiled CLI executable to ./dist/cli.js (97MB, includes Bun runtime)

# Type checking
bun run type-check       # TypeScript type checking only
bun run tsc --noEmit    # Direct TypeScript compiler check

# Publishing
bun publish             # Publish to npm (runs prepublishOnly: clean -> type-check -> build)
bun publish --dry-run   # Test publish without uploading
```

Note: This project does not currently have a test framework configured. When adding tests, consider using Bun's built-in test runner.

### Build Process Details

The `build` script:
1. Cleans the `dist` directory
2. Runs TypeScript type checking
3. Bundles TypeScript to JavaScript using Bun's bundler
4. Creates a CLI wrapper with proper shebang for direct execution

The `prepublishOnly` script runs automatically before publishing:
```bash
bun run clean      # Remove old build artifacts
bun run type-check # Verify type safety
bun run build      # Build distributable files
```

## Usage

### Configuration

Create a `config.json` file in the project root (optional):

```bash
# Copy example config
cp config.json.example config.json

# Then edit base_url if needed (default: http://localhost:11434)
```

```json
{
  "base_url": "http://localhost:11434"
}
```

If no config file exists, the plugin defaults to `http://localhost:11434`.

### Running

Simply run:

```bash
bun run index.ts
```

The plugin will:
1. Read the `base_url` from config.json (or use default)
2. Fetch models from Ollama's `/api/tags` endpoint
3. Transform models to OpenCode's expected format
4. Write the configuration to `~/.opencode/models.json`

## Code Style Guidelines

### TypeScript Configuration

This project uses strict TypeScript settings defined in `tsconfig.json`:

- **Strict mode**: Enabled - All type checking options are on
- **Target**: ESNext - Use latest JavaScript/TypeScript features
- **Module**: Preserve with bundler resolution
- **No unchecked indexed access**: Enabled - Array/object access requires undefined checks
- **No implicit override**: Enabled - Override methods must use `override` keyword
- **No fallthrough cases in switch**: Enabled - All switch cases must break or return

### Import Style

- Use ES module imports (ESM) - `"type": "module"` is set in package.json
- Import from `.ts` files with extensions: `import { foo } from './file.ts'`
- Prefer named exports over default exports for better tree-shaking
- Group imports: standard library first, then third-party, then local

```typescript
// ✅ Good
import { readFile } from 'node:fs/promises';
import { fetch } from 'bun';

import type { Config } from './types.ts';
import { logger } from './utils.ts';
```

### Type Safety

- Never use `any` or `@ts-ignore`
- Use `unknown` for untyped values instead of `any`
- Explicitly handle `undefined` from indexed access (due to `noUncheckedIndexedAccess`)
- Use type inference where possible, but annotate function parameters and return types

```typescript
// ✅ Good
function getModelList(url: string): Promise<string[]> {
  const response = await fetch(url);
  const data = await response.json() as unknown;
  // Validate and transform data to typed structure
  return Array.isArray(data) ? data : [];
}

// ❌ Bad
function getModelList(url: any): any {
  return fetch(url).then(r => r.json());
}
```

### Naming Conventions

- **Files**: kebab-case (e.g., `model-fetcher.ts`, `config-manager.ts`)
- **Constants**: UPPER_SNAKE_CASE for top-level exports
- **Classes**: PascalCase
- **Functions/Variables**: camelCase
- **Private members**: Underscore prefix (_privateMethod)
- **Interfaces**: PascalCase, no "I" prefix

```typescript
const API_BASE_URL = 'https://localhost:11434';

export class ModelFetcher {
  private _cache: Map<string, unknown> = new Map();

  async fetchModels(): Promise<Model[]> {
    // ...
  }
}
```

### Error Handling

- Never use empty catch blocks
- Provide meaningful error messages
- Use typed custom errors when appropriate
- Log errors appropriately (consider Bun's `console` with formatting)

```typescript
// ✅ Good
try {
  const models = await fetchModels(baseUrl);
  return models;
} catch (error) {
  if (error instanceof TypeError) {
    throw new ConfigError(`Invalid base URL: ${baseUrl}`);
  }
  throw new FetchError(`Failed to fetch models: ${error instanceof Error ? error.message : String(error)}`);
}

// ❌ Bad
try {
  await fetchModels(baseUrl);
} catch (e) {}
```

### Async/Await

- Prefer async/await over Promise chains
- Always handle promise rejections
- Use Promise.all() for parallel independent operations
- Use Promise.allSettled() when some failures are acceptable

### API Integration (Ollama)

The main purpose of this plugin is to integrate with Ollama's API:

- Configure via `base_url` setting
- Fetch model list from the configured endpoint
- Transform and inject models into OpenCode configuration
- Handle network errors gracefully with retry considerations

### Formatting

No formatter is currently configured. When adding one, prefer:
- Prettier (standard choice)
- OR Biome (faster, compatible with Prettier config)

## Additional Notes

- This is a minimal Bun project initialized with `bun init`
- The codebase is currently minimal (entry point: `index.ts`)
- Follow Bun best practices for performance: https://bun.sh/docs
- Keep dependencies minimal - Bun has many built-in APIs that replace external packages
