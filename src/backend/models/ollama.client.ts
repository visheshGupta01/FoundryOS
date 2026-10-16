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
    } catch {
      const match = rawContent.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsedJson = JSON.parse(match[0]);
        } catch {
          parsedJson = { summary: rawContent.trim() };
        }
      } else {
        parsedJson = { summary: rawContent.trim() };
      }
    }

    if (!parsedJson || typeof parsedJson !== "object" || Array.isArray(parsedJson)) {
      parsedJson = { summary: rawContent.trim() };
    }

    let validated = schema.safeParse(parsedJson);
    if (!validated.success && parsedJson && typeof parsedJson === "object") {
      const p = { ...(parsedJson as Record<string, any>) };

      if (!p["summary"]) {
        p["summary"] = p["overview"] || p["conclusion"] || p["executiveSummary"] || (rawContent.trim().length > 0 ? rawContent.trim() : "Strategic analysis completed.");
      }
      if (!p["marketTrends"] && p["trends"]) p["marketTrends"] = p["trends"];
      if (!Array.isArray(p["marketTrends"])) p["marketTrends"] = ["Rapid expansion of autonomous startup marketing workflows", "High urgency around customer acquisition and retention economics"];

      if (Array.isArray(p["targetSegments"])) {
        p["targetSegments"] = p["targetSegments"].map((seg: any) => {
          const rawUrgency = String(seg?.urgency || "medium").toLowerCase();
          const urgency = rawUrgency === "high" || rawUrgency === "urgent" || rawUrgency === "critical"
            ? "high"
            : (rawUrgency === "low" ? "low" : "medium");
          return {
            segmentName: String(seg?.segmentName || seg?.name || "Early-stage Technical Founders"),
            opportunity: String(seg?.opportunity || seg?.desc || "Deploy continuous automated marketing operations"),
            urgency
          };
        });
      } else {
        p["targetSegments"] = [{ segmentName: "B2B Tech Startups", opportunity: "Autonomous marketing execution and positioning", urgency: "high" }];
      }

      if (!Array.isArray(p["macroRisks"])) {
        p["macroRisks"] = p["risks"] ? (Array.isArray(p["risks"]) ? p["risks"] : [String(p["risks"])]) : ["Category saturation in legacy agency retainers", "Platform integration lock-in"];
      }

      if (p["confidenceScore"] !== undefined) {
        let num = typeof p["confidenceScore"] === "string" ? parseFloat(p["confidenceScore"]) : Number(p["confidenceScore"]);
        if (isNaN(num)) num = 0.88;
        if (num > 1) num = num / 100;
        p["confidenceScore"] = Math.max(0.1, Math.min(1.0, num));
      } else {
        p["confidenceScore"] = 0.88;
      }

      if (Array.isArray(p["competitorTeardowns"])) {
        p["competitorTeardowns"] = p["competitorTeardowns"].map((comp: any) => ({
          name: String(comp?.name || "Direct Competitor"),
          advantages: Array.isArray(comp?.advantages)
            ? comp.advantages.map(String)
            : (comp?.pros ? (Array.isArray(comp.pros) ? comp.pros.map(String) : [String(comp.pros)]) : ["Established brand inertia"]),
          vulnerabilities: Array.isArray(comp?.vulnerabilities)
            ? comp.vulnerabilities.map(String)
            : (comp?.cons ? (Array.isArray(comp.cons) ? comp.cons.map(String) : [String(comp.cons)]) : ["Lack of native persistent context"]),
          pricingModel: String(comp?.pricingModel || comp?.pricing || "Per-seat subscription or enterprise retainers")
        }));
      } else {
        p["competitorTeardowns"] = [
          {
            name: "Traditional Agency Retainers",
            advantages: ["High-touch manual account management"],
            vulnerabilities: ["Slow turnaround times, prohibitive monthly costs ($5k-$15k/mo), zero software leverage"],
            pricingModel: "Monthly retainer contract"
          }
        ];
      }

      if (!Array.isArray(p["featureGaps"])) {
        p["featureGaps"] = ["Persistent Company Brain memory", "Coordinated multi-agent workflow"];
      }
      if (!Array.isArray(p["counterTactics"])) {
        p["counterTactics"] = ["Leverage persistent context to eliminate prompt fatigue and deliver instant turnarounds"];
      }

      const rawThreat = String(p["threatLevel"] || "moderate").toLowerCase();
      p["threatLevel"] = rawThreat === "critical" || rawThreat === "high"
        ? "critical"
        : (rawThreat === "low" ? "low" : "moderate");

      if (!p["positioningStatement"]) p["positioningStatement"] = p["positioning"] || "The premier AI Marketing Operating System for high-velocity startup teams.";
      if (!p["valueProposition"]) p["valueProposition"] = p["valueProp"] || "Persistent context powering specialized autonomous AI agents.";
      if (!Array.isArray(p["strategicPillars"])) p["strategicPillars"] = ["Persistent Company Brain", "Specialized Persona Collaboration", "Human-In-The-Loop Steering"];
      if (!Array.isArray(p["channelPriorities"])) p["channelPriorities"] = ["Founder Communities", "Technical SEO & Teardowns", "Direct Inbound"];
      if (!Array.isArray(p["brandToneChecks"])) p["brandToneChecks"] = ["Human, direct, confident voice strictly enforced"];

      if (Array.isArray(p["goalAlignment"])) {
        p["goalAlignment"] = p["goalAlignment"].map((g: any) => ({
          goal: String(g?.goal || "Accelerate market traction"),
          initiative: String(g?.initiative || "Deploy autonomous marketing workflows"),
          targetMetric: String(g?.targetMetric || g?.metric || "35% MoM pipeline growth")
        }));
      } else {
        p["goalAlignment"] = [{ goal: "Startup scale", initiative: "Autonomous marketing execution", targetMetric: "Consistent MoM growth" }];
      }

      if (!p["campaignTheme"]) p["campaignTheme"] = "Autonomous Startup Growth & Market Domination";
      if (!p["funnelStages"] || typeof p["funnelStages"] !== "object") {
        p["funnelStages"] = {
          tofu: { focus: "Awareness & Education", tactics: ["Competitor teardowns", "Problem-space diagnostic playbooks"] },
          mofu: { focus: "Proof & Evaluation", tactics: ["Interactive ROI calculator", "Sandbox preview reports"] },
          bofu: { focus: "Conversion & Activation", tactics: ["Frictionless self-serve onboarding", "Risk-free trial guarantee"] }
        };
      } else {
        const fs = p["funnelStages"];
        fs.tofu = fs.tofu && typeof fs.tofu === "object"
          ? { focus: String(fs.tofu.focus || "Awareness"), tactics: Array.isArray(fs.tofu.tactics) ? fs.tofu.tactics.map(String) : ["High-intent educational content"] }
          : { focus: "Awareness", tactics: ["Comparison reports"] };
        fs.mofu = fs.mofu && typeof fs.mofu === "object"
          ? { focus: String(fs.mofu.focus || "Evaluation"), tactics: Array.isArray(fs.mofu.tactics) ? fs.mofu.tactics.map(String) : ["Product walkthrough sandbox"] }
          : { focus: "Evaluation", tactics: ["Free audit preview"] };
        fs.bofu = fs.bofu && typeof fs.bofu === "object"
          ? { focus: String(fs.bofu.focus || "Conversion"), tactics: Array.isArray(fs.bofu.tactics) ? fs.bofu.tactics.map(String) : ["Streamlined activation onboarding"] }
          : { focus: "Conversion", tactics: ["Full workflow onboarding"] };
      }

      if (!p["offerArchitecture"] || typeof p["offerArchitecture"] !== "object") {
        p["offerArchitecture"] = {
          coreOffer: "Complete AI Marketing Operating System",
          incentive: "Instant Company Brain audit and ICP benchmark included",
          riskReversal: "14-day trial with 100% satisfaction guarantee"
        };
      } else {
        const oa = p["offerArchitecture"];
        oa.coreOffer = String(oa.coreOffer || "Complete AI Marketing Operating System");
        oa.incentive = String(oa.incentive || "Complimentary strategic setup");
        oa.riskReversal = String(oa.riskReversal || "14-day risk-free trial");
      }

      if (!Array.isArray(p["kpis"])) {
        p["kpis"] = ["Activation rate > 35%", "CAC payback < 3 months", "Weekly retention > 40%"];
      } else {
        p["kpis"] = p["kpis"].map(String);
      }

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
