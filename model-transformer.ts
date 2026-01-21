import type { OllamaModel, OpenCodeModelConfig } from './types.ts';

export function transformModel(
  ollamaModel: OllamaModel,
  baseUrl: string,
): OpenCodeModelConfig {
  return {
    name: ollamaModel.name,
    provider: 'ollama',
    base_url: baseUrl,
    capabilities: deriveCapabilities(ollamaModel),
    context_length: deriveContextLength(ollamaModel),
  };
}

export function transformModels(
  ollamaModels: OllamaModel[],
  baseUrl: string,
): OpenCodeModelConfig[] {
  return ollamaModels.map((model) => transformModel(model, baseUrl));
}

function deriveCapabilities(model: OllamaModel): string[] {
  const capabilities: string[] = ['text'];

  const families = model.details?.families ?? [];
  if (families.includes('llava') || families.includes('clip')) {
    capabilities.push('vision');
  }

  if (families.includes('nomic-bert') || families.includes('mxbai-embed')) {
    capabilities.push('embeddings');
  }

  return capabilities;
}

function deriveContextLength(model: OllamaModel): number | undefined {
  const details = model.details;
  if (!details) {
    return undefined;
  }

  const parameterSize = details.parameter_size;
  const family = details.family.toLowerCase();

  const modelContextLengths: Record<string, number> = {
    'llama': 32768,
    'mistral': 32768,
    'gemma': 8192,
    'gemma2': 8192,
    'qwen': 32768,
    'phi': 8192,
    'yi': 4096,
    'deepseek': 16384,
  };

  const familyKey = Object.keys(modelContextLengths).find((key) => family.includes(key));
  if (!familyKey) {
    return undefined;
  }

  const baseContext = modelContextLengths[familyKey];
  if (!baseContext) {
    return undefined;
  }

  if (parameterSize.includes('70B') || parameterSize.includes('70b')) {
    return baseContext * 2;
  }

  return baseContext;
}
