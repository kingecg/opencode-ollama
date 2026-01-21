export interface OllamaModelDetails {
  format: string;
  family: string;
  families: string[];
  parameter_size: string;
  quantization_level: string;
}

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: OllamaModelDetails;
}

export interface OllamaModelsResponse {
  models: OllamaModel[];
}

export interface OpenCodeModelConfig {
  name: string;
  provider: string;
  base_url: string;
  capabilities: string[];
  context_length?: number;
}

export interface PluginConfig {
  base_url: string;
}

export type ConfigReadResult =
  | { status: "success"; config: PluginConfig }
  | { status: "not_found" }
  | { status: "error"; message: string };
