import { type z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { env } from "../config/env.js";
import { InfrastructureError, ValidationError } from "../errors/base.error.js";
import { ErrorCode } from "../errors/error-codes.js";
import { logger } from "../shared/logger.js";
import { withRetry } from "../shared/retry.js";

export interface OllamaChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OllamaClientOptions {
  baseUrl?: string;
  model?: string;
  embeddingModel?: string;
}

export class OllamaClient {
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly defaultEmbeddingModel: string;

  constructor(options: OllamaClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? env.OLLAMA_BASE_URL).replace(/\/+$/, "");
    this.defaultModel = options.model ?? env.OLLAMA_MODEL;
    this.defaultEmbeddingModel = options.embeddingModel ?? "nomic-embed-text";
  }

  public async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`);
      return res.ok;
    } catch {
      return false;
    }
  }

  public async listModels(): Promise<string[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`);
      if (!res.ok) {
        return [];
      }
      const data = (await res.json()) as { models?: Array<{ name: string }> };
      return (data.models ?? []).map((m) => m.name);
    } catch {
      return [];
    }
  }

  public async embed(text: string, model: string = this.defaultEmbeddingModel): Promise<number[]> {
    const embeddings = await this.embedBatch([text], model);
    const first = embeddings[0];
    if (!first || first.length === 0) {
      throw new InfrastructureError("Ollama returned an empty embedding vector", ErrorCode.VECTOR_DIMENSION_MISMATCH);
    }
    return first;
  }

  public async embedBatch(texts: string[], model: string = this.defaultEmbeddingModel): Promise<number[][]> {
    return await withRetry(async () => {
      try {
        const response = await fetch(`${this.baseUrl}/api/embed`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            input: texts
          })
        });

        if (!response.ok) {
          const errorBody = await response.text().catch(() => "");
          throw new InfrastructureError(`Ollama embedding call failed: ${response.status} ${response.statusText}`, ErrorCode.TRUEFORGE_API_ERROR, {
            status: response.status,
            errorBody
          });
        }

        const data = (await response.json()) as { embeddings?: number[][] };
        if (!data.embeddings || !Array.isArray(data.embeddings)) {
          throw new InfrastructureError("Ollama did not return an embeddings array", ErrorCode.VECTOR_DIMENSION_MISMATCH);
        }

        return data.embeddings;
      } catch (err: unknown) {
        if (err instanceof InfrastructureError) {
          throw err;
        }
        logger.error("Failed to connect to Ollama embedding API", err, { model, baseUrl: this.baseUrl });
        throw new InfrastructureError("Failed to communicate with Ollama embedding service", ErrorCode.DATABASE_CONNECTION_ERROR, {
          originalMessage: err instanceof Error ? err.message : String(err)
        });
      }
    });
  }

  public async chat(
    messages: OllamaChatMessage[],
    options: { model?: string; temperature?: number; format?: Record<string, unknown> | string } = {}
  ): Promise<string> {
    const model = options.model ?? this.defaultModel;

    return await withRetry(async () => {
      try {
        const response = await fetch(`${this.baseUrl}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            messages,
            ...(options.format ? { format: options.format } : {}),
            stream: false,
            options: {
              temperature: options.temperature ?? 0.7
            }
          })
        });

        if (!response.ok) {
          const errorBody = await response.text().catch(() => "");
          throw new InfrastructureError(`Ollama chat call failed: ${response.status} ${response.statusText}`, ErrorCode.TRUEFORGE_API_ERROR, {
            status: response.status,
            errorBody
          });
        }

        const data = (await response.json()) as { message?: { content: string } };
        return data.message?.content?.trim() ?? "";
      } catch (err: unknown) {
        if (err instanceof InfrastructureError) {
          throw err;
        }
        logger.error("Failed to connect to Ollama chat API", err, { model, baseUrl: this.baseUrl });
        throw new InfrastructureError("Failed to communicate with Ollama chat service", ErrorCode.TRUEFORGE_API_ERROR, {
          originalMessage: err instanceof Error ? err.message : String(err)
        });
      }
    });
  }

  public async generate(
    prompt: string,
    options: { system?: string; model?: string; temperature?: number } = {}
  ): Promise<string> {
    const messages: OllamaChatMessage[] = [];
    if (options.system) {
      messages.push({ role: "system", content: options.system });
    }
    messages.push({ role: "user", content: prompt });
    return await this.chat(messages, options);
  }

  public async generateStructured<T>(
    prompt: string,
    schema: z.ZodType<T>,
    options: { system?: string; model?: string; temperature?: number } = {}
  ): Promise<T> {
    const model = options.model ?? this.defaultModel;
    const systemPrompt = options.system
      ? `${options.system}\nYou must output strictly valid JSON conforming to the schema.`
      : "You must output strictly valid JSON conforming to the schema.";

    let jsonSchema: Record<string, unknown> | "json" = "json";
    try {
      const converted = zodToJsonSchema(schema) as Record<string, unknown>;
      delete converted["$schema"];
      jsonSchema = converted;
    } catch {
      jsonSchema = "json";
    }

    const messages: OllamaChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt }
    ];

    const rawContent = await this.chat(messages, {
      model,
      temperature: options.temperature ?? 0.2,
      format: jsonSchema
    });

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawContent);
    } catch (jsonErr: unknown) {
      const match = rawContent.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsedJson = JSON.parse(match[0]);
        } catch {
          throw new ValidationError("Ollama output could not be parsed as JSON", {
            rawContent,
            originalError: jsonErr instanceof Error ? jsonErr.message : String(jsonErr)
          });
        }
      } else {
        throw new ValidationError("Ollama output could not be parsed as JSON", {
          rawContent,
          originalError: jsonErr instanceof Error ? jsonErr.message : String(jsonErr)
        });
      }
    }

    const validated = schema.safeParse(parsedJson);
    if (!validated.success) {
      throw new ValidationError("Ollama structured output failed schema validation", {
        issues: validated.error.issues,
        rawContent
      });
    }

    return validated.data;
  }
}

export const ollamaClient = new OllamaClient();
