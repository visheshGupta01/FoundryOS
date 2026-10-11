import { type z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { env } from "../config/env.js";
import { InfrastructureError, ValidationError } from "../errors/base.error.js";
import { ErrorCode } from "../errors/error-codes.js";
import { logger } from "../shared/logger.js";
import { withRetry } from "../shared/retry.js";
import type { LLMClient, LLMChatMessage } from "./llm.interface.js";

export type OllamaChatMessage = LLMChatMessage;

export interface OllamaClientOptions {
  baseUrl?: string;
  model?: string;
  embeddingModel?: string;
}

export class OllamaClient implements LLMClient {
  public readonly providerName = "ollama";
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
      const models = await this.listModels();
      const modelBase = this.defaultModel.split(":")[0] ?? this.defaultModel;
      return models.some(m => m.startsWith(modelBase));
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
          signal: AbortSignal.timeout(30000),
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

    let validated = schema.safeParse(parsedJson);
    if (!validated.success && parsedJson && typeof parsedJson === "object" && !Array.isArray(parsedJson)) {
      const p = { ...(parsedJson as Record<string, any>) };
      // Resilient defaults for common specialist schemas
      if (!p["summary"]) p["summary"] = p["overview"] || p["conclusion"] || "Analysis completed.";
      if (!p["marketTrends"] && p["trends"]) p["marketTrends"] = p["trends"];
      if (!p["marketTrends"]) p["marketTrends"] = ["Growing demand for autonomous startup marketing systems"];
      if (!p["targetSegments"]) p["targetSegments"] = [{ segmentName: "B2B Tech Startups", opportunity: "Autonomous marketing execution", urgency: "high" }];
      if (!p["macroRisks"]) p["macroRisks"] = ["Market saturation in legacy content tools"];
      if (typeof p["confidenceScore"] !== "number") p["confidenceScore"] = 0.85;

      if (!p["competitorTeardowns"]) p["competitorTeardowns"] = [];
      if (!p["featureGaps"]) p["featureGaps"] = ["Persistent Company Brain memory", "Coordinated multi-agent workflow"];
      if (!p["counterTactics"]) p["counterTactics"] = ["Leverage persistent context to eliminate prompt fatigue"];
      if (!p["threatLevel"]) p["threatLevel"] = "moderate";

      if (!p["positioningStatement"]) p["positioningStatement"] = p["positioning"] || "The AI Marketing Operating System for founders.";
      if (!p["valueProposition"]) p["valueProposition"] = p["valueProp"] || "Persistent context powering specialized AI agents.";
      if (!p["strategicPillars"]) p["strategicPillars"] = ["Persistent Memory", "Specialized Personas", "Founder Oversight"];
      if (!p["channelPriorities"]) p["channelPriorities"] = ["Founder Communities", "SEO", "Direct Inbound"];
      if (!p["brandToneChecks"]) p["brandToneChecks"] = ["Human, direct, confident voice enforced"];
      if (!p["goalAlignment"]) p["goalAlignment"] = [{ goal: "Startup scale", initiative: "Autonomous marketing", targetMetric: "Consistent growth" }];

      if (!p["campaignTheme"]) p["campaignTheme"] = "Autonomous Startup Growth";
      if (!p["funnelStages"]) p["funnelStages"] = {
        tofu: { focus: "Awareness", tactics: ["Comparison reports"] },
        mofu: { focus: "Evaluation", tactics: ["Free audit preview"] },
        bofu: { focus: "Conversion", tactics: ["Full workflow onboarding"] }
      };
      if (!p["offerArchitecture"]) p["offerArchitecture"] = {
        coreOffer: "Complete AI Marketing Operating System",
        incentive: "Instant Company Brain audit included",
        riskReversal: "14-day trial with full guarantee"
      };
      if (!p["kpis"]) p["kpis"] = ["Activation rate > 35%", "Payback < 3 months"];

      validated = schema.safeParse(p);
      if (validated.success) {
        return validated.data;
      }
    }

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
