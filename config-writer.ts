import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { OpenCodeModelConfig } from './types.ts';

export class ConfigWriteError extends Error {
  constructor(message: string, public override readonly cause?: unknown) {
    super(message);
    this.name = 'ConfigWriteError';
  }
}

const OPENCODE_CONFIG_DIR = '.opencode';
const CONFIG_FILE_NAME = 'models.json';

export async function writeOpenCodeConfig(
  models: OpenCodeModelConfig[],
  configDir?: string,
): Promise<void> {
  const configPath = getConfigPath(configDir);
  const configContent = formatConfig(models);

  try {
    await ensureConfigDirectory(configPath);
    await writeFile(configPath, configContent, { encoding: 'utf-8' });
    console.log(`✓ Written ${models.length} model(s) to ${configPath}`);
  } catch (error) {
    throw new ConfigWriteError(
      `Failed to write OpenCode config to ${configPath}`,
      error,
    );
  }
}

function getConfigPath(configDir?: string): string {
  const dir = configDir ?? join(homedir(), OPENCODE_CONFIG_DIR);
  return join(dir, CONFIG_FILE_NAME);
}

async function ensureConfigDirectory(configPath: string): Promise<void> {
  const fs = await import('node:fs/promises');
  const { dirname } = await import('node:path');

  const dir = dirname(configPath);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

function formatConfig(models: OpenCodeModelConfig[]): string {
  return JSON.stringify(
    { models },
    null,
    2,
  );
}
