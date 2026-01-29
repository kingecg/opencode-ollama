import { writeFile } from 'node:fs/promises';
import * as fs from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { OpenCodeModelConfig } from './types.ts';
import inquirer from 'inquirer';
export class ConfigWriteError extends Error {
  constructor(message: string, public override readonly cause?: unknown) {
    super(message);
    this.name = 'ConfigWriteError';
  }
}
export const DEFAULT_BASE_URL = 'http://localhost:11434';
const OPENCODE_CONFIG_DIR = '.config/opencode';
const CONFIG_FILE_NAME = 'opencode.json';

export async function writeOpenCodeConfig(
  models: OpenCodeModelConfig[],
  configDir?: string,
): Promise<void> {
  const configPath = getConfigPath(configDir);
  const nmodels = formatConfig(models);

  try {
    await ensureConfigDirectory(configPath);
    const configContent = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    
    const providers = Object.keys(configContent.provider||{})
    console.log(`Current config: ${providers}`)
    // providers.push('None')
    // console.log(`Current providers: ${providers} && ${Array.isArray(providers)}`)
    const {ollamaProviderName} = await inquirer.prompt([
      {
        type: 'list',
        name: 'ollamaProviderName',
        message: 'Select Ollama provider:',
        choices: providers
      }
    ]);
    if(ollamaProviderName != 'None'){
      configContent.provider[ollamaProviderName].models = nmodels
    } else {
      if(!configContent.providers){
        configContent.providers = {}
      }
      configContent.providers["ollama"] = {
        npm: "@ai-sdk/openai-compatible",
        name: "Ollama (local)",
        options:{
          baseURL: `${DEFAULT_BASE_URL}/v1`
        },
        models: nmodels
      }
    }
    await writeFile(configPath, JSON.stringify(configContent,null,4), { encoding: 'utf-8' });
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

function formatConfig(gmodels: OpenCodeModelConfig[]): any {
  let models:any = {}
  for (const model of gmodels) {
    models[model.name] = {
      name: model.name,
    }
  }
  return models
}
