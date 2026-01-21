# OpenCode Ollama Plugin

Fetches Ollama models and configures them into OpenCode.

## Installation

```bash
npm install -g opencode-ollama
```

Or with Bun:

```bash
bun install -g opencode-ollama
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

Using the CLI:

```bash
opencode-ollama
```

Or run directly with Bun:

```bash
bun run index.ts
```

The plugin will:
1. Read the `base_url` from config.json (or use default)
2. Fetch models from Ollama's `/api/tags` endpoint
3. Transform models to OpenCode's expected format
4. Write the configuration to `~/.opencode/models.json`

### Example Output

```
OpenCode Ollama Plugin - Syncing models...
Fetching models from http://localhost:11434...
Found 2 model(s):
  - codellama:7b (text)
  - qwen3:8b (text)
✓ Written 2 model(s) to /home/username/.opencode/models.json
✓ Sync complete!
```

### OpenCode Config Format

The generated `~/.opencode/models.json`:

```json
{
  "models": [
    {
      "name": "codellama:7b",
      "provider": "ollama",
      "base_url": "http://localhost:11434",
      "capabilities": ["text"],
      "context_length": 32768
    }
  ]
}
```

## Development

```bash
# Install dependencies
bun install

# Development (watch mode)
bun run dev

# Build
bun run build

# Build CLI executable
bun run build:cli

# Type checking
bun run type-check
```

## Publishing

### Manual Publish

```bash
bun publish
```

This will:
1. Run type checking
2. Build the project
3. Publish to npm

### Automated Publishing via CI

The project uses GitHub Actions for automated publishing to npm on tag pushes.

**Setup**:
1. Go to GitHub repository Settings → Secrets and variables → Actions
2. Create a new secret named `NPM_TOKEN`
3. Use your npm access token (automation token recommended)

**Release process**:
```bash
# Update version in package.json
npm version patch|minor|major

# Create and push tag
git push origin --tags

# CI will automatically publish to npm
```

**Trigger**: Pushing a tag matching `v*` (e.g., `v1.0.0`, `v1.1.0`)

## Requirements

- Bun >= 1.0.0
- Ollama running locally (or accessible via configured `base_url`)
- Ollama with at least one downloaded model

## License

MIT License - see LICENSE file for details.
