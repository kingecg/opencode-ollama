import { fetch } from 'bun';
import type { OllamaModelsResponse } from './types.ts';

export class OllamaFetchError extends Error {
  constructor(message: string, public override readonly cause?: unknown) {
    super(message);
    this.name = 'OllamaFetchError';
  }
}

export class OllamaClient {
  constructor(private readonly baseUrl: string) {}

  async fetchModels(): Promise<OllamaModelsResponse> {
    try {
      const url = this.normalizeUrl(this.baseUrl);
      const response = await fetch(url);

      if (!response.ok) {
        throw new OllamaFetchError(
          `Ollama API returned ${response.status}: ${response.statusText}`,
        );
      }

      const data = await response.json() as unknown;
      return this.validateModelsResponse(data);
    } catch (error) {
      if (error instanceof OllamaFetchError) {
        throw error;
      }
      if (error instanceof TypeError) {
        throw new OllamaFetchError(`Failed to connect to Ollama at ${this.baseUrl}`, error);
      }
      throw new OllamaFetchError(
        `Unexpected error fetching models: ${error instanceof Error ? error.message : String(error)}`,
        error,
      );
    }
  }

  private normalizeUrl(baseUrl: string): string {
    const url = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${url}/api/tags`;
  }

  private validateModelsResponse(data: unknown): OllamaModelsResponse {
    if (typeof data !== 'object' || data === null) {
      throw new OllamaFetchError('Invalid response: expected object');
    }

    const response = data as { models?: unknown };
    if (!Array.isArray(response.models)) {
      throw new OllamaFetchError('Invalid response: missing or invalid models array');
    }

    return { models: response.models };
  }
}
