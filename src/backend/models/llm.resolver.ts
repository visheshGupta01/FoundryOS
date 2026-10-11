import { env } from "../config/env.js";
import { logger } from "../shared/logger.js";
import type { LLMClient } from "./llm.interface.js";
import { ollamaClient } from "./ollama.client.js";
import { openaiClient } from "./openai.client.js";

/*
  The resolver is a factory that picks the right LLM client based on
  the LLM_PROVIDER env var. It also handles the fallback chain:
  
  OpenAI (primary) → Ollama (fallback) → deterministic (hardcoded responses)
  
  This lets the agent runner and router stay provider-agnostic.
  They just call resolveLLMClient() and get whatever's available.
*/

let cachedClient: LLMClient | null = null;

export function resolveLLMClient(): LLMClient {
  if (cachedClient) return cachedClient;

  if (env.LLM_PROVIDER === "openai" && env.OPENAI_API_KEY) {
    logger.info("LLM provider resolved to OpenAI", { model: env.OPENAI_MODEL });
    cachedClient = openaiClient;
    return cachedClient;
  }

  logger.info("LLM provider resolved to Ollama (local)", { model: env.OLLAMA_MODEL });
  cachedClient = ollamaClient;
  return cachedClient;
}

export async function resolveLLMClientWithFallback(): Promise<LLMClient> {
  const primary = resolveLLMClient();

  if (await primary.isAvailable()) {
    return primary;
  }

  if (primary.providerName === "openai") {
    logger.warn("OpenAI unavailable, falling back to Ollama");
    if (await ollamaClient.isAvailable()) {
      return ollamaClient;
    }
  }

  if (primary.providerName === "ollama") {
    logger.warn("Ollama unavailable, trying OpenAI fallback");
    if (env.OPENAI_API_KEY && await openaiClient.isAvailable()) {
      return openaiClient;
    }
  }

  logger.warn("No LLM provider available, agent will use deterministic fallback");
  return primary;
}

export function resetResolverCache(): void {
  cachedClient = null;
}
