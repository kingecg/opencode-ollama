import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { cwd } from 'node:process';
import { OllamaClient, OllamaFetchError } from './ollama-client.ts';
import { writeOpenCodeConfig, ConfigWriteError } from './config-writer.ts';
import { transformModels } from './model-transformer.ts';
import type { ConfigReadResult, PluginConfig } from './types.ts';

const DEFAULT_BASE_URL = 'http://localhost:11434';
const CONFIG_FILE_NAME = 'config.json';

async function main(): Promise<void> {
  try {
    console.log('OpenCode Ollama Plugin - Syncing models...');

    const { base_url } = await readConfig();

    console.log(`Fetching models from ${base_url}...`);
    const ollamaClient = new OllamaClient(base_url);
    const response = await ollamaClient.fetchModels();

    const models = transformModels(response.models, base_url);

    console.log(`Found ${models.length} model(s):`);
    models.forEach((model) => {
      const capabilities = model.capabilities.join(', ');
      console.log(`  - ${model.name} (${capabilities})`);
    });

    await writeOpenCodeConfig(models);

    console.log('✓ Sync complete!');
  } catch (error) {
    handleError(error);
    process.exit(1);
  }
}

async function readConfig(): Promise<PluginConfig> {
  const config = await readConfigFile();

  if (config.status === 'error') {
    console.warn(`Warning: ${config.message}`);
    console.warn(`Using default base_url: ${DEFAULT_BASE_URL}`);
  }

  const base_url = config.status === 'success'
    ? validateBaseUrl(config.config.base_url)
    : DEFAULT_BASE_URL;

  return { base_url };
}

async function readConfigFile(): Promise<ConfigReadResult> {
  try {
    const configPath = getConfigPath();
    const content = await readFile(configPath, { encoding: 'utf-8' });
    const config = JSON.parse(content) as unknown;
    const validated = validateConfig(config);
    return { status: 'success', config: validated };
  } catch (error) {
    if ((error as { code?: string })?.code === 'ENOENT') {
      return { status: 'not_found' };
    }
    if (error instanceof SyntaxError) {
      return { status: 'error', message: 'Invalid JSON in config file' };
    }
    return {
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

function getConfigPath(): string {
  return join(cwd(), CONFIG_FILE_NAME);
}

function validateConfig(data: unknown): PluginConfig {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Config must be an object');
  }

  const config = data as { base_url?: unknown };
  if (config.base_url !== undefined && typeof config.base_url !== 'string') {
    throw new Error('base_url must be a string');
  }

  return { base_url: config.base_url ?? DEFAULT_BASE_URL };
}

function validateBaseUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return DEFAULT_BASE_URL;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return DEFAULT_BASE_URL;
  }

  return trimmed;
}

function handleError(error: unknown): void {
  if (error instanceof OllamaFetchError) {
    console.error(`✗ Ollama API Error: ${error.message}`);
    if (error.cause) {
      console.error(`  Cause: ${error.cause instanceof Error ? error.cause.message : String(error.cause)}`);
    }
    console.error('\nPlease ensure:');
    console.error('  1. Ollama is running (ollama serve)');
    console.error('  2. The base_url is correct (default: http://localhost:11434)');
    console.error('  3. Ollama has downloaded models (ollama list)');
  } else if (error instanceof ConfigWriteError) {
    console.error(`✗ Config Write Error: ${error.message}`);
    if (error.cause) {
      console.error(`  Cause: ${error.cause instanceof Error ? error.cause.message : String(error.cause)}`);
    }
  } else {
    console.error(
      `✗ Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

main();
