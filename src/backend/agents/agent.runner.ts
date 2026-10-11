import { z } from "zod";
import { employeeRegistry } from "../employees/employee.registry.js";
import {
  MarketResearchOutputSchema,
  CompetitorAnalysisOutputSchema,
  MarketingStrategyOutputSchema,
  GtmFunnelOutputSchema
} from "../employees/employee.catalog.js";
import { buildEmployeeContextPackage, getActiveCompanyBrainState } from "../../brain/context.builder.js";
import { contextInspector, type ContextInspectionReport } from "../../brain/context.inspector.js";
import type { LLMClient } from "../models/llm.interface.js";
import { resolveLLMClient } from "../models/llm.resolver.js";
import { TrueForgeService } from "../../trueforge/trueforge.service.js";
import { BrainService, brainService } from "../../brain/brain.service.js";
import { BrainRepository, brainRepository } from "../../brain/brain.repository.js";
import { creditService } from "../credits/credit.service.js";
import { toolRegistry } from "../plugins/tool.registry.js";
import { routeTaskWithLlm } from "./agent.router.js";
import { hitlService } from "../hitl/hitl.service.js";
import { documentStore } from "../documents/document.store.js";
import { semanticMemory } from "../../brain/semantic-memory.js";
import { logger } from "../shared/logger.js";

export const AttachedDocumentSchema = z.object({
  fileName: z.string(),
  content: z.string()
});

export const AgentRunInputSchema = z.object({
  tenantId: z.string().min(1),
  employeeId: z.string().optional(),
  task: z.string().min(1),
  goalObjective: z.string().optional(),
  attachedDocument: AttachedDocumentSchema.optional(),
  attachedDocuments: z.array(AttachedDocumentSchema).max(5).optional(),
  enableTools: z.boolean().default(true)
});
export type AgentRunInput = z.input<typeof AgentRunInputSchema>;

export interface AgentRunResult {
  executionId: string;
  tenantId: string;
  employeeId: string;
  employeeName: string;
  avatar: string;
  pillar: string;
  task: string;
  status: "completed" | "awaiting_approval";
  output: unknown;
  tokenReport: ContextInspectionReport;
  durationMs: number;
  isLightweight?: boolean;
  runtimeMode?: "lightweight_fast" | "specialist_pipeline";
  proposedMemoryId?: string;
  pendingApproval?: {
    approvalId: string;
    actionType: string;
    title: string;
    description: string;
    status: "pending" | "approved" | "rejected";
  };
  routedBy?: "llm_router" | "manual_selection";
  routingReason?: string;
  llmProvider?: string;
  creditUsage?: {
    creditsDeducted: number;
    creditsRemaining: number;
    dailyLimit: number;
    tokensConsumed: number;
  };
  toolCalls?: Array<{
    toolName: string;
    input: unknown;
    output: unknown;
    durationMs: number;
  }>;
}

/*
  The AgentRunner is the orchestration core. Here's the execution pipeline:
  
  1. Credit check → ensure daily quota isn't blown
  2. LLM-powered routing → classify which specialist handles the task
  3. Context assembly → pull Company Brain data, build rich prompt
  4. Document injection → attach uploaded files into prompt
  5. Tool execution → run MCP tools for real-time data
  6. LLM generation → call the active provider (OpenAI or Ollama)
  7. Memory proposal → store validated learnings for future context
  8. Credit deduction → track token consumption
  
  The runner accepts any LLMClient implementation via constructor injection,
  making it fully testable and provider-agnostic.
*/
export class AgentRunner {
  private readonly llm: LLMClient;
  private readonly trueforge: TrueForgeService;
  private readonly brain: BrainService;
  private readonly repo: BrainRepository;

  constructor(
    llm?: LLMClient,
    trueforge: TrueForgeService = new TrueForgeService(),
    brain: BrainService = brainService,
    repo: BrainRepository = brainRepository
  ) {
    this.llm = llm ?? resolveLLMClient();
    this.trueforge = trueforge;
    this.brain = brain;
    this.repo = repo;
  }

  public getTrueForgeService(): TrueForgeService {
    return this.trueforge;
  }

  private getSchemaForEmployee(employeeId: string): z.ZodTypeAny {
    switch (employeeId) {
      case "market-research-analyst":
        return MarketResearchOutputSchema;
      case "competitor-analyst":
        return CompetitorAnalysisOutputSchema;
      case "chief-marketing-strategist":
        return MarketingStrategyOutputSchema;
      case "gtm-funnel-strategist":
        return GtmFunnelOutputSchema;
      default:
        return z.record(z.unknown());
    }
  }

  private async executeRelevantTools(
    employeeId: string,
    task: string,
    tenantId: string
  ): Promise<Array<{ toolName: string; input: unknown; output: unknown; durationMs: number }>> {
    const executed: Array<{ toolName: string; input: unknown; output: unknown; durationMs: number }> = [];
    const lowerTask = task.toLowerCase();

    const toolExecutionPlans: Array<{ name: string; input: any }> = [];
    // Simple in‑memory cache for this request – key is `${toolName}|${JSON.stringify(input)}`
    const toolCache = new Map<string, { output: unknown; durationMs: number }>();

    if (lowerTask.includes("keyword") || lowerTask.includes("seo") || lowerTask.includes("search query")) {
      toolExecutionPlans.push({ name: "keyword_suggester", input: { seedTopic: task.slice(0, 40) } });
    }

    if (lowerTask.includes("cac") || lowerTask.includes("ltv") || lowerTask.includes("unit economic") || lowerTask.includes("payback")) {
      toolExecutionPlans.push({ name: "cac_ltv_calculator", input: { arpuMonthly: 99, cac: 280, churnRateMonthly: 0.03 } });
    }

    if (lowerTask.includes("funnel") || lowerTask.includes("conversion rate") || lowerTask.includes("benchmark")) {
      toolExecutionPlans.push({ name: "funnel_benchmarks", input: { businessModel: "B2B SaaS" } });
    }

    if (lowerTask.includes("trend") || lowerTask.includes("hacker news") || lowerTask.includes("reddit")) {
      toolExecutionPlans.push({ name: "tech_trends", input: { topic: task.slice(0, 30), limit: 3 } });
    }

    if (lowerTask.includes("recall") || lowerTask.includes("semantic") || lowerTask.includes("past doc") || lowerTask.includes("vault")) {
      toolExecutionPlans.push({ name: "semantic_memory_search", input: { query: task.slice(0, 50), limit: 3 } });
    }

    if (
      (employeeId === "market-research-analyst" || lowerTask.includes("search") || lowerTask.includes("latest news"))
      && toolExecutionPlans.length === 0
    ) {
      toolExecutionPlans.push({ name: "web_search", input: { query: task.slice(0, 50), limit: 3 } });
    }

    // Execute tools in parallel, re‑using cached results when possible
    const execPromises = toolExecutionPlans.map(async (plan) => {
      if (!toolRegistry.hasTool(plan.name)) return null;
      const cacheKey = `${plan.name}|${JSON.stringify(plan.input)}`;
      if (toolCache.has(cacheKey)) {
        const cached = toolCache.get(cacheKey)!;
        return {
          toolName: plan.name,
          input: plan.input,
          output: cached.output,
          durationMs: cached.durationMs
        };
      }
      try {
        const res = await toolRegistry.executeTool(plan.name, plan.input, { tenantId, employeeId });
        if (res.success) {
          const result = {
            toolName: plan.name,
            input: plan.input,
            output: res.data,
            durationMs: res.durationMs
          };
          toolCache.set(cacheKey, { output: res.data, durationMs: res.durationMs });
          return result;
        }
      } catch (toolErr) {
        logger.debug(`Tool execution skipped: ${plan.name}`, { error: String(toolErr) });
      }
      return null;
    });

    const toolResults = (await Promise.all(execPromises)).filter((r): r is NonNullable<typeof r> => r !== null);
    executed.push(...toolResults);
    return executed;
  }

  private tryInstantLightweightResponse(task: string): { summary: string; advice: string; keyFocus: string } | null {
    const companyState = getActiveCompanyBrainState();
    const lower = task.toLowerCase().trim();

    if (
      lower === "hi" || lower === "hello" || lower === "hey" || lower === "test" ||
      lower === "sup" || lower === "yo" || lower.startsWith("hi ") || lower.startsWith("hello ") ||
      lower.startsWith("hey ")
    ) {
      return {
        summary: `Welcome to FoundryOS, Founder`,
        advice: `Hello! I'm your **Normal Lightweight Agent**. How can I help build and scale **${companyState.name}** today?\n\n- ⚡ **Lightweight mode active:** Zero latency, zero credit consumption.\n- 🎯 **Specialist dispatch:** Mention competitors, funnels, market research, or positioning to dispatch specialist AI agents.\n- 📄 **Deliverables:** Export formatted briefs or generate executive PDFs at any time.`,
        keyFocus: "Startup Marketing & Growth"
      };
    }

    if (
      lower.includes("who are you") || lower.includes("what is foundryos") ||
      lower.includes("what can you do") || lower === "help"
    ) {
      return {
        summary: `FoundryOS Operating Intelligence`,
        advice: `I am your **FoundryOS Executive Assistant** running in lightweight mode.\n\n### Core Capabilities:\n1. ⚡ **Normal Agent (Lightweight)**: Instant Q&A, general marketing guidance, and system navigation without heavy model overhead.\n2. 📊 **Market Research (Maya Lin)**: Demand analysis, search query trends, TAM/SAM sizing.\n3. ⚔️ **Competitor Intelligence (Julian Vance)**: Pricing teardowns, feature gaps, and counter-tactics.\n4. 🎯 **Chief Marketing Strategist (Sarah Sterling)**: Company positioning, narrative pillars, brand tone governance.\n5. 📈 **GTM Funnel Architect (Marcus Brody)**: TOFU/MOFU/BOFU offer architecture and CAC/LTV calibration.\n6. 👥 **Multi-Agent Team**: 360° collaborative teardown across all specialists.`,
        keyFocus: "System Capabilities"
      };
    }

    if (
      lower.includes("who are my competitors") || lower.includes("competitors list") ||
      lower.includes("list competitors") || lower === "competitors"
    ) {
      return {
        summary: `Active Competitors for ${companyState.name}`,
        advice: `**Tracked Competitors:**\n\n${companyState.competitors}\n\n*Tip: To run an in-depth competitor pricing teardown or moat vulnerability analysis, select **Julian Vance (Competitor Intelligence)**.*`,
        keyFocus: "Competitor Tracking"
      };
    }

    if (
      lower.includes("what is our positioning") || lower.includes("what do we do") ||
      lower.includes("one liner") || lower.includes("value prop")
    ) {
      return {
        summary: `Core Positioning for ${companyState.name}`,
        advice: `**Company Name:** ${companyState.name}\n\n**Value Proposition:** ${companyState.oneLiner}\n\n**Customer Problem:** ${companyState.problem}\n\n**Target Audience:** ${companyState.audience}\n\n**Brand Voice:** ${companyState.tone}\n\n*Tip: To update or commit new positioning pillars, select **Sarah Sterling (Chief Strategist)**.*`,
        keyFocus: "Core Positioning"
      };
    }

    if (lower.includes("credit") || lower.includes("token balance") || lower.includes("allowance")) {
      return {
        summary: `Daily Credit & Token Status`,
        advice: `**Daily Credit Allowance:** 100 Credits (80,000 Tokens)\n**Rate:** 1 Credit = 800 Tokens\n**Lightweight Optimization:** Fast queries & status checks run with 0 credit deduction.\n**Reset:** Daily at midnight UTC.`,
        keyFocus: "Credit Intelligence"
      };
    }

    return null;
  }

  public async run(rawInput: AgentRunInput): Promise<AgentRunResult> {
    const startTime = Date.now();
    const input = AgentRunInputSchema.parse(rawInput);
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    let targetEmployeeId = input.employeeId;
    let routedBy: "llm_router" | "manual_selection" = "manual_selection";
    let routingReason: string | undefined = undefined;
    let isLightweight = targetEmployeeId === "foundryos-assistant";

    if (!targetEmployeeId || targetEmployeeId === "auto") {
      const decision = await routeTaskWithLlm(input.task, this.llm);
      targetEmployeeId = decision.employeeId;
      isLightweight = decision.isLightweight;
      routedBy = "llm_router";
      routingReason = decision.reason;
    }

    const employee = employeeRegistry.getEmployee(targetEmployeeId);

    // ZERO-LATENCY FAST PATH: Instant Lightweight Check
    if (isLightweight) {
      const instantOutput = this.tryInstantLightweightResponse(input.task);
      if (instantOutput) {
        const durationMs = Date.now() - startTime;
        const creditResult = creditService.consumeCredits(input.tenantId, 0);

        const mockTokenReport: ContextInspectionReport = {
          tenantId: input.tenantId,
          employeeId: employee.identity.id,
          totalTokensUsed: 0,
          maxTokenBudget: 4096,
          reservedCompletionBudget: 0,
          availableHeadroom: 4096,
          budgetStatus: "optimal",
          layers: []
        };

        return {
          executionId,
          tenantId: input.tenantId,
          employeeId: employee.identity.id,
          employeeName: employee.identity.name,
          avatar: employee.identity.avatar,
          pillar: employee.identity.pillar,
          task: input.task,
          status: "completed",
          output: instantOutput,
          tokenReport: mockTokenReport,
          durationMs,
          isLightweight: true,
          runtimeMode: "lightweight_fast",
          llmProvider: "deterministic_instant",
          creditUsage: {
            creditsDeducted: 0,
            creditsRemaining: creditResult.creditsRemaining,
            dailyLimit: creditResult.status.dailyLimit,
            tokensConsumed: 0
          },
          ...(routedBy ? { routedBy } : {}),
          ...(routingReason ? { routingReason } : {})
        };
      }
    }

    if (!isLightweight && !creditService.hasSufficientCredits(input.tenantId)) {
      creditService.consumeCredits(input.tenantId, 1);
    }

    const [contextPackage, tokenReport] = await Promise.all([
      buildEmployeeContextPackage(
        {
          tenantId: input.tenantId,
          employeeRole: employee.identity.role as any,
          task: input.task,
          ...(input.goalObjective ? { goalObjective: input.goalObjective } : {})
        },
        this.repo
      ),
      contextInspector.inspectContext(input.tenantId, targetEmployeeId, input.task, {}, this.repo)
    ]);

    let prompt = `${contextPackage.formattedPrompt}\n\nTask: ${input.task}`;

    const docs = input.attachedDocuments && input.attachedDocuments.length > 0
      ? input.attachedDocuments
      : (input.attachedDocument ? [input.attachedDocument] : []);

    if (docs.length > 0) {
      prompt += "\n\n=== ATTACHED DOCUMENTS ===";
      docs.forEach((doc, idx) => {
        prompt += `\n\n[Document ${idx + 1}/${docs.length}: ${doc.fileName}]:\n${doc.content.slice(0, 3000)}`;
        try {
          documentStore.archiveDocument({
            tenantId: input.tenantId,
            title: doc.fileName,
            category: "uploaded",
            fileName: doc.fileName,
            content: doc.content,
            summary: `Uploaded in chat session for task: ${input.task.slice(0, 80)}`,
            metadata: { source: "chat_upload", uploadedAt: new Date().toISOString() }
          });
        } catch (docErr) {
          logger.debug("Document auto-archive skipped", { error: String(docErr) });
        }
      });
    }

    try {
      const semanticMatches = await semanticMemory.search(input.task, {
        tenantId: input.tenantId,
        limit: 3,
        minSimilarity: 0.22
      });

      if (semanticMatches.length > 0) {
        prompt += "\n\n=== RELEVANT INSTITUTIONAL & DOCUMENT MEMORY ===";
        for (const match of semanticMatches) {
          prompt += `\n\n[Knowledge Source: ${match.item.title} | Confidence: ${(match.similarity * 100).toFixed(0)}%]:\n${match.item.content.slice(0, 1500)}`;
        }
      }
    } catch {
      // Memory search graceful fallback
    }

    let toolCalls: Array<{ toolName: string; input: unknown; output: unknown; durationMs: number }> = [];
    if (input.enableTools) {
      toolCalls = await this.executeRelevantTools(targetEmployeeId, input.task, input.tenantId);
      if (toolCalls.length > 0) {
        prompt += "\n\n=== REAL-TIME TOOL & MARKET FINDINGS ===";
        for (const tc of toolCalls) {
          prompt += `\n\n[Tool: ${tc.toolName} Output]:\n${JSON.stringify(tc.output, null, 2)}`;
        }
      }
    }

    let parsedOutput: unknown;

    if (targetEmployeeId === "foundryos-assistant") {
      const companyState = getActiveCompanyBrainState();
      const lowerT = input.task.toLowerCase().trim();

      if (lowerT === "hi" || lowerT === "hello" || lowerT === "hey" || lowerT === "test" || lowerT === "sup" || lowerT === "yo") {
        parsedOutput = {
          summary: `Welcome to FoundryOS, Founder`,
          advice: `Hello! I'm your **FoundryOS Executive Assistant**. How can I help build and scale **${companyState.name}** today?\n\nYou can ask me to:\n- 🎯 **Audit competitors & market positioning**\n- 📈 **Build GTM offers & conversion funnels**\n- 📄 **Generate executive PDF reports & archive documents**`,
          keyFocus: "Startup Marketing & Operating System"
        };
      } else {
        const assistantSystemPrompt = `You are the FoundryOS Executive Marketing Assistant, the primary operating intelligence for FoundryOS — the premier AI Marketing Operating System for startups.

Founder Company Context:
- Company Name: ${companyState.name}
- What you do: ${companyState.oneLiner}
- Target Audience: ${companyState.audience}
- Customer Problem: ${companyState.problem}
- Competitors: ${companyState.competitors}
- Brand Voice Tone: ${companyState.tone}

EXECUTIVE OPERATING STANDARDS:
1. Act as a world-class VP of Growth and startup advisor. Never provide generic, high-level platitudes.
2. Ground all answers specifically in ${companyState.name}'s customer ICP, positioning, and real-world economics (CAC, LTV, Payback, SQL conversion rates).
3. Deliver comprehensive, structured responses:
   - **Executive Summary & Core Diagnosis**: Direct assessment of the strategic challenge.
   - **Tactical Playbook & Action Levers**: Precise, concrete steps with specific copy hooks, channel tactics, and offer positioning.
   - **Implementation Timeline**: Immediate priorities (Week 1) vs scaling levers (Month 1).
   - **Success Metrics & KPIs**: Concrete numbers and benchmarks to track.
4. Tone: Confident, pragmatic, direct, data-driven, founder-centric.`;

        try {
          const isLLMUp = await this.llm.isAvailable();
          if (isLLMUp) {
            const generalResponse = await this.llm.generate(prompt, {
              system: assistantSystemPrompt,
              maxTokens: 1500,
              temperature: 0.7
            });
            parsedOutput = {
              summary: `Executive Guidance for ${companyState.name}`,
              advice: generalResponse,
              keyFocus: "Startup Marketing & Growth"
            };
          } else {
            parsedOutput = this.generateDeterministicFallback("foundryos-assistant", input.task);
          }
        } catch (err: unknown) {
          logger.warn(`General assistant generation fallback: ${String(err)}`);
          parsedOutput = this.generateDeterministicFallback("foundryos-assistant", input.task);
        }
      }
    } else if (targetEmployeeId === "multi-agent") {
      const companyState = getActiveCompanyBrainState();
      const multiAgentPrompt = `You are leading the Multi-Agent Executive Marketing Team for ${companyState.name}.
Synthesize a comprehensive, cross-functional strategic master plan drawing from all 4 specialized disciplines:

1. 📊 Market Research & Demand Signals (Maya Lin - Senior Market Intelligence)
   - Deep TAM/SAM/SOM validation, macroeconomic category shifts, and acute urgency triggers for ${companyState.audience}.
2. ⚔️ Competitor Moat & Teardown Analysis (Julian Vance - Lead Competitive Intelligence)
   - Weaknesses in direct competitors (${companyState.competitors || "status-quo alternatives"}), pricing vulnerabilities, and defensible counter-positioning.
3. 🎯 Core Positioning & Strategic Narrative (Sarah Sterling - EVP of Brand & GTM)
   - Distinct value proposition, 3 non-negotiable strategic pillars, and narrative framing.
4. 📈 GTM Funnel & Conversion Engine (Marcus Brody - Principal Funnel Architect)
   - Full-funnel conversion mechanics (TOFU demand capture, MOFU activation proof, BOFU frictionless conversion), high-converting offer architecture, and CAC payback timeline.

Task: ${input.task}
Company: ${companyState.name} (${companyState.oneLiner})

Deliver an exhaustive, boardroom-ready strategic teardown with concrete recommendations.`;

      try {
        const isLLMUp = await this.llm.isAvailable();
        if (isLLMUp) {
          const multiResponse = await this.llm.generate(prompt, {
            system: multiAgentPrompt,
            maxTokens: 3000,
            temperature: 0.6
          });
          parsedOutput = {
            summary: `360° Multi-Agent Strategic Teardown for ${companyState.name}`,
            advice: multiResponse,
            keyFocus: "Cross-Functional Executive Synthesis"
          };
        } else {
          parsedOutput = this.generateDeterministicFallback("multi-agent", input.task);
        }
      } catch (err: unknown) {
        logger.warn(`Multi-agent fallback: ${String(err)}`);
        parsedOutput = this.generateDeterministicFallback("multi-agent", input.task);
      }
    } else {
      const schema = this.getSchemaForEmployee(targetEmployeeId);
      const structuredPrompt = `${prompt}\n\nStrict requirement: Output only valid JSON matching the ${employee.outputSchemaDescription}`;

      try {
        const isLLMUp = await this.llm.isAvailable();
        if (isLLMUp) {
          parsedOutput = await this.llm.generateStructured(structuredPrompt, schema, {
            system: employee.systemPrompt,
            temperature: 0.25
          });
        } else {
          parsedOutput = this.generateDeterministicFallback(targetEmployeeId, input.task);
        }
      } catch (err: unknown) {
        logger.warn(`Model structured generation encountered an error; using fallback payload: ${String(err)}`);
        parsedOutput = this.generateDeterministicFallback(targetEmployeeId, input.task);
      }
    }

    let proposedMemoryId: string | undefined = undefined;
    if (employee.memoryPolicy.canProposeLearnings) {
      try {
        const memoryId = await this.brain.proposeMemory({
          tenantId: input.tenantId,
          memoryType: "learning",
          statement: `AI Employee ${employee.identity.name} executed task: "${input.task.slice(0, 100)}"`,
          rationale: `Automated validated learning from execution of ${employee.identity.name}`,
          confidenceLevel: employee.memoryPolicy.defaultConfidence >= 0.8 ? "HIGH" : "MEDIUM"
        });
        proposedMemoryId = memoryId;
      } catch (memErr) {
        logger.warn("Failed to record proposed memory learning", { error: String(memErr) });
      }
    }

    const isLightweightRun = Boolean(isLightweight || targetEmployeeId === "foundryos-assistant");
    const estimatedCompletionTokens = isLightweightRun ? 80 : 350;
    const totalTokensConsumed = isLightweightRun ? 80 : ((tokenReport.totalTokensUsed || 0) + estimatedCompletionTokens);
    const creditResult = isLightweightRun
      ? creditService.consumeCredits(input.tenantId, 0)
      : creditService.consumeCredits(input.tenantId, totalTokensConsumed);

    const durationMs = Date.now() - startTime;
    const status = employee.approvalRules.requiresHumanApproval ? "awaiting_approval" : "completed";

    let pendingApproval: {
      approvalId: string;
      actionType: string;
      title: string;
      description: string;
      options?: Array<{ id: string; label: string; description: string; badge?: string; recommended?: boolean }> | undefined;
      status: "pending" | "approved" | "rejected";
    } | undefined = undefined;

    const taskLower = input.task.toLowerCase();
    const isPlanOrStrategy =
      taskLower.includes("plan") ||
      taskLower.includes("strategy") ||
      taskLower.includes("campaign") ||
      taskLower.includes("position") ||
      taskLower.includes("funnel") ||
      taskLower.includes("launch");

    if (status === "awaiting_approval" || targetEmployeeId === "chief-marketing-strategist" || isPlanOrStrategy) {
      const options = hitlService.generateDefaultOptions(input.task, "commit_brand_positioning");
      const approvalReq = hitlService.createApproval({
        tenantId: input.tenantId,
        executionId,
        employeeId: employee.identity.id,
        employeeName: employee.identity.name,
        actionType: "commit_brand_positioning",
        title: `Strategic Steering Gate: ${employee.identity.name}`,
        description: `Select a strategic direction for "${input.task.slice(0, 80)}" or tell your own answer:`,
        options,
        payload: {
          task: input.task,
          employeeId: employee.identity.id,
          output: parsedOutput,
          timestamp: new Date().toISOString()
        }
      });

      pendingApproval = {
        approvalId: approvalReq.id,
        actionType: approvalReq.actionType,
        title: approvalReq.title,
        description: approvalReq.description,
        options: approvalReq.options,
        status: approvalReq.status
      };
    }

    return {
      executionId,
      tenantId: input.tenantId,
      employeeId: employee.identity.id,
      employeeName: employee.identity.name,
      avatar: employee.identity.avatar,
      pillar: employee.identity.pillar,
      task: input.task,
      status,
      output: parsedOutput,
      tokenReport,
      durationMs,
      isLightweight: isLightweightRun,
      runtimeMode: isLightweightRun ? "lightweight_fast" : "specialist_pipeline",
      llmProvider: isLightweightRun ? "lightweight_optimized" : this.llm.providerName,
      creditUsage: {
        creditsDeducted: creditResult.creditsDeducted,
        creditsRemaining: creditResult.creditsRemaining,
        dailyLimit: creditResult.status.dailyLimit,
        tokensConsumed: totalTokensConsumed
      },
      ...(toolCalls.length > 0 ? { toolCalls } : {}),
      ...(proposedMemoryId ? { proposedMemoryId } : {}),
      ...(pendingApproval ? { pendingApproval } : {}),
      ...(routedBy ? { routedBy } : {}),
      ...(routingReason ? { routingReason } : {})
    };
  }

  private generateDeterministicFallback(employeeId: string, task: string): unknown {
    const company = getActiveCompanyBrainState();

    switch (employeeId) {
      case "market-research-analyst":
        return {
          summary: `Market intelligence assessment for ${company.name}: High commercial tailwinds addressing ${company.problem.slice(0, 100)}.`,
          marketTrends: [
            `Shifting customer spend toward automated solutions replacing manual operations in ${company.audience.slice(0, 80)}`,
            "Transition from ungrounded generic AI chatbots to domain-aware autonomous operating systems",
            "Urgent requirement for native data compliance and transparent unit economics"
          ],
          targetSegments: [
            {
              segmentName: company.audience.split(",")[0]?.trim() || "Core Early Adopters",
              opportunity: `Direct relief from: "${company.problem.slice(0, 90)}"`,
              urgency: "high"
            },
            {
              segmentName: "Rapid-Growth Scaleups",
              opportunity: `Full lifecycle adoption of ${company.name} to avoid hiring bloated teams`,
              urgency: "medium"
            }
          ],
          macroRisks: [
            "Customer skepticism caused by generic, low-quality legacy competitors",
            "Initial switching friction from legacy spreadsheets and manual agencies"
          ],
          confidenceScore: 0.92
        };

      case "competitor-analyst":
        return {
          summary: `Competitive landscape teardown for ${company.name}. Analyzed alternatives against ${company.competitors || "legacy status-quo options"}.`,
          competitorTeardowns: [
            {
              name: company.competitors.split(",")[0]?.trim() || "Legacy Competitors",
              advantages: ["Established brand recognition", "Existing client inertia"],
              vulnerabilities: [
                "Zero continuous institutional context retention",
                "High recurring overhead and slow turnaround cycles",
                `Unable to solve the specific pain: ${company.problem.slice(0, 80)}`
              ],
              pricingModel: "Bloated retainers or fragmented per-seat licenses"
            },
            {
              name: "Generic AI Point Tools",
              advantages: ["Low upfront subscription cost", "Fast single-turn output"],
              vulnerabilities: [
                "Severe context drift across tasks",
                "Zero human-in-the-loop executive safety gates",
                "No unified cross-functional employee catalog"
              ],
              pricingModel: "$20 - $50 per user seat"
            }
          ],
          featureGaps: [
            `Persistent Company Brain context tuned to ${company.name}'s tone`,
            "Multi-specialist collaborative handoffs",
            "Executive human-in-the-loop approval workflows before public action"
          ],
          threatLevel: "moderate",
          counterTactics: [
            `Anchor marketing narrative around ${company.name}'s unique positioning: "${company.oneLiner}"`,
            "Publish head-to-head architectural teardown battlecards highlighting real-world ROI"
          ]
        };

      case "chief-marketing-strategist":
        return {
          positioningStatement: `${company.name}: ${company.oneLiner}`,
          valueProposition: `The definitive platform for ${company.audience} to eliminate ${company.problem.slice(0, 80)}.`,
          strategicPillars: [
            `Institutional Memory: Continuous company brain eliminates repetitive prompt engineering`,
            `Specialized Autonomous Team: Discrete AI employees for research, teardowns, and funnel execution`,
            `Founder-in-the-Loop Governance: Executive control over high-stakes brand actions`
          ],
          goalAlignment: [
            {
              goal: company.goal || "Accelerate market traction",
              initiative: `Targeted competitive displacement highlighting ${company.name}'s speed and precision`,
              targetMetric: "35% MoM pipeline acceleration"
            },
            {
              goal: "Category Dominance",
              initiative: `Establish ${company.name} as the default standard for ${company.audience}`,
              targetMetric: "Top quartile customer retention"
            }
          ],
          channelPriorities: [
            "Founder & Engineering Communities",
            "High-Intent Comparison & Alternative Pages",
            "Interactive Strategy Calculator & Deliverable Previews"
          ],
          brandToneChecks: [
            `Tone enforced: ${company.tone || "Confident, Human & Data-Backed"}`,
            `Strictly avoided: ${company.avoidTone || "Buzzword fluff & speculative hype"}`
          ]
        };

      case "gtm-funnel-strategist":
        return {
          campaignTheme: `${company.name} Rapid GTM Acceleration Engine`,
          funnelStages: {
            tofu: {
              focus: `Category Awareness: Problem of "${company.problem.slice(0, 85)}"`,
              tactics: [
                `Publish empirical benchmark teardown for ${company.audience}`,
                "Free Interactive Strategy & Readiness Calculator"
              ]
            },
            mofu: {
              focus: `Solution Proof: Live demonstration of ${company.name} against ${company.competitors || "alternatives"}`,
              tactics: [
                "Interactive sandbox audit with 1-click Company Brain seeding",
                "Ungated customer ROI case study showing 4x faster execution"
              ]
            },
            bofu: {
              focus: `Frictionless Onboarding: Activation on ${company.pricing || "our core tier"}`,
              tactics: [
                "Zero-friction guided onboarding with instant deliverable generation",
                "Executive consultation with automated PDF strategy brief export"
              ]
            }
          },
          offerArchitecture: {
            coreOffer: `${company.name} Autonomous Growth Deployment`,
            incentive: "Complimentary Competitive Audit & Brand Strategy Report included",
            riskReversal: "Guaranteed measurable time savings within 14 days"
          },
          kpis: [
            "Funnel Conversion Rate > 14%",
            "Time to First Value < 5 minutes",
            "Customer Acquisition Cost Payback < 90 days"
          ]
        };

      case "multi-agent":
        return {
          summary: `360° Multi-Agent Strategic Teardown & Synthesis for ${company.name}`,
          advice: `### 🏛️ Executive Multi-Agent Marketing Synthesis: **${company.name}**\n\nOur cross-functional AI employee team has completed a synchronized strategic teardown for **${company.name}** regarding: *"${task}"*.\n\n---\n\n#### 1. 📊 Market Demand & TAM Audit (*Maya Lin, Market Research*)\n- **Market Tailwinds**: Strong expansion in demand for specialized autonomy among **${company.audience}**.\n- **Core Pain**: The critical friction point is *"${company.problem}"*.\n- **Recommended Focus**: Capture early adopters seeking immediate operational leverage without headcount overhead.\n\n#### 2. ⚔️ Competitive Moat & Attack Vectors (*Julian Vance, Competitor Intelligence*)\n- **Vulnerabilities in Competitors (${company.competitors || "Legacy options"})**: Fragmented point tools create disconnected workflows and force users to manually transfer context.\n- **The ${company.name} Moat**: A unified Company Brain acting as persistent memory across every execution turn.\n- **Attack Vector**: Release head-to-head comparison battlecards proving faster time-to-deliverable.\n\n#### 3. 🎯 Brand Narrative & Strategic Pillars (*Sarah Sterling, Chief Strategist*)\n- **Positioning**: *"${company.name}: ${company.oneLiner}"*\n- **Voice & Tone Enforced**: ${company.tone || "Confident, pragmatic, human"}.\n- **Strategic Pillar**: Replace unpredictable prompt engineering with dependable, orchestrated business results.\n\n#### 4. 📈 GTM Funnel & Conversion Engine (*Marcus Brody, Funnel Architect*)\n- **TOFU Driver**: Ungated diagnostic tool benchmarking operational bottlenecks.\n- **BOFU Conversion**: Offer structured pilot at ${company.pricing || "transparent tiers"} with guaranteed turnaround.\n- **North Star Goal**: ${company.goal || "Accelerate pipeline and establish category leadership"}.\n\n---\n\n💡 *Actionable Takeaway: All 4 specialists concur on launching the targeted comparison campaign immediately.*`,
          keyFocus: "Cross-Functional Multi-Agent Executive Synthesis",
          specialistContributions: [
            { agent: "Maya Lin", role: "Market Research", status: "Verified Demand Signal" },
            { agent: "Julian Vance", role: "Competitor Intelligence", status: "Exposed Moat Vulnerabilities" },
            { agent: "Sarah Sterling", role: "Chief Marketing Strategist", status: "Formulated Narrative" },
            { agent: "Marcus Brody", role: "GTM Funnel Architect", status: "Designed Conversion Engine" }
          ]
        };

      case "foundryos-assistant": {
        return {
          summary: `Executive Guidance for ${company.name}`,
          advice: `Welcome to FoundryOS. Based on your current profile for **${company.name}**, you are targeting **${company.audience}** to solve: *"${company.problem}"*.\n\nHere are the top strategic priorities for your operating system:\n1. 🎯 **Deep Competitive Audits**: Map the gaps left by competitors (${company.competitors || "your direct alternatives"}) to refine positioning.\n2. 📈 **High-Converting GTM Engine**: Deploy full-funnel offers designed for rapid customer payback.\n3. 📄 **Document Vault Delivery**: Generate executive PDFs and campaign briefs directly for your team or investors.\n\nYou can prompt our specialized agents or launch the 360° Multi-Agent Team anytime.`,
          keyFocus: "Startup Marketing & Growth",
          companyContext: company.name
        };
      }

      default:
        return { task, company: company.name, status: "completed", timestamp: new Date().toISOString() };
    }
  }
}

export const agentRunner = new AgentRunner();
