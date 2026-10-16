import { env } from "../config/env.js";
import { logger } from "../shared/logger.js";
import type { LLMClient } from "./llm.interface.js";
import { ollamaClient } from "./ollama.client.js";

let cachedClient: LLMClient | null = null;

export function resolveLLMClient(): LLMClient {
  if (cachedClient) return cachedClient;

  logger.info("LLM provider resolved to Ollama (local)", { model: env.OLLAMA_MODEL });
  cachedClient = ollamaClient;
  return cachedClient;
}

export async function resolveLLMClientWithFallback(): Promise<LLMClient> {
  const primary = resolveLLMClient();

  if (await primary.isAvailable()) {
    return primary;
  }

  logger.warn("Ollama instance unavailable at localhost:11434, fallback to deterministic agent execution");
  return primary;
}

export function resetResolverCache(): void {
  cachedClient = null;
}
