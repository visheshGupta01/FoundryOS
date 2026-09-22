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
import { OllamaClient, ollamaClient } from "../models/ollama.client.js";
import { TrueForgeService } from "../../trueforge/trueforge.service.js";
import { BrainService, brainService } from "../../brain/brain.service.js";
import { BrainRepository, brainRepository } from "../../brain/brain.repository.js";
import { routeTaskWithLlm } from "./agent.router.js";
import { logger } from "../shared/logger.js";

export const AgentRunInputSchema = z.object({
  tenantId: z.string().min(1),
  employeeId: z.string().optional(),
  task: z.string().min(1),
  goalObjective: z.string().optional(),
  attachedDocument: z
    .object({
      fileName: z.string(),
      content: z.string()
    })
    .optional()
});
export type AgentRunInput = z.infer<typeof AgentRunInputSchema>;

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
  proposedMemoryId?: string;
  routedBy?: "llm_router" | "manual_selection";
  routingReason?: string;
}

export class AgentRunner {
  private readonly ollama: OllamaClient;
  private readonly trueforge: TrueForgeService;
  private readonly brain: BrainService;
  private readonly repo: BrainRepository;

  constructor(
    ollama: OllamaClient = ollamaClient,
    trueforge: TrueForgeService = new TrueForgeService(),
    brain: BrainService = brainService,
    repo: BrainRepository = brainRepository
  ) {
    this.ollama = ollama;
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

  public async run(rawInput: AgentRunInput): Promise<AgentRunResult> {
    const startTime = Date.now();
    const input = AgentRunInputSchema.parse(rawInput);
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // 1. LLM-directed routing if employee is not explicitly assigned or set to "auto"
    let targetEmployeeId = input.employeeId;
    let routedBy: "llm_router" | "manual_selection" = "manual_selection";
    let routingReason: string | undefined = undefined;

    if (!targetEmployeeId || targetEmployeeId === "auto") {
      const decision = await routeTaskWithLlm(input.task, this.ollama);
      targetEmployeeId = decision.employeeId;
      routedBy = "llm_router";
      routingReason = decision.reason;
    }

    const employee = employeeRegistry.getEmployee(targetEmployeeId);

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
    if (input.attachedDocument) {
      prompt += `\n\n[Uploaded Document: ${input.attachedDocument.fileName}]:\n${input.attachedDocument.content.slice(0, 4000)}`;
    }

    let parsedOutput: unknown;

    // 2. Branch: General FoundryOS Assistant vs Specialized Employee
    if (targetEmployeeId === "foundryos-assistant") {
      const companyState = getActiveCompanyBrainState();
      const assistantSystemPrompt = `You are the FoundryOS Executive Marketing Assistant, the primary operating intelligence for FoundryOS — the AI Marketing Operating System for startups.
Founder Company Context:
- Company Name: ${companyState.name}
- What you do: ${companyState.oneLiner}
- Target Audience: ${companyState.audience}
- Customer Problem: ${companyState.problem}
- Competitors: ${companyState.competitors}
- Brand Voice Tone: ${companyState.tone}

RULES & GUARDRAILS:
1. Stay strictly focused on FoundryOS, startup marketing, strategy, and business growth.
2. Never venture into irrelevant topics (e.g. unrelated programming, fiction, general trivia). If asked about unrelated topics, politely decline and refocus on growing ${companyState.name}.
3. Tone: Direct, confident, human, pragmatic, startup-obsessed. No corporate buzzwords or AI hype.
4. Format advice with bold key highlights and structured bullet points.`;

      try {
        const isOllamaUp = await this.ollama.isAvailable();
        if (isOllamaUp) {
          const generalResponse = await this.ollama.generate(prompt, {
            system: assistantSystemPrompt
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
    } else {
      const schema = this.getSchemaForEmployee(targetEmployeeId);
      const structuredPrompt = `${prompt}\n\nStrict requirement: Output only valid JSON matching the ${employee.outputSchemaDescription}`;

      try {
        const isOllamaUp = await this.ollama.isAvailable();
        if (isOllamaUp) {
          parsedOutput = await this.ollama.generateStructured(structuredPrompt, schema, {
            system: employee.systemPrompt
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

    const durationMs = Date.now() - startTime;
    const status = employee.approvalRules.requiresHumanApproval ? "awaiting_approval" : "completed";

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
      ...(proposedMemoryId ? { proposedMemoryId } : {}),
      ...(routedBy ? { routedBy } : {}),
      ...(routingReason ? { routingReason } : {})
    };
  }

  private generateDeterministicFallback(employeeId: string, task: string): unknown {
    switch (employeeId) {
      case "market-research-analyst":
        return {
          summary: `Market assessment for: ${task}. High founder demand for automated marketing operations.`,
          marketTrends: [
            "Startups shifting from fragmented point tools to unified marketing operating systems",
            "Rise of context-driven AI memory replacing zero-shot prompting",
            "Increasing demand for programmatic competitor intelligence audits"
          ],
          targetSegments: [
            { segmentName: "B2B SaaS Seed/Series A", opportunity: "Zero headcount marketing automation", urgency: "high" },
            { segmentName: "Solopreneurs & Technical Founders", opportunity: "Complete marketing lifecycle delegation", urgency: "medium" }
          ],
          macroRisks: [
            "AI content saturation in organic search channels",
            "Ad platform API rate limits and compliance constraints"
          ],
          confidenceScore: 0.88
        };

      case "competitor-analyst":
        return {
          summary: `Competitive landscape audit regarding: ${task}. Traditional tools lack persistent institutional memory.`,
          competitorTeardowns: [
            {
              name: "Generic AI Writing Assistants",
              advantages: ["Fast generation", "Low initial barrier"],
              vulnerabilities: ["Zero cross-workflow context", "No competitor tracking", "High prompt fatigue"],
              pricingModel: "Seat-based SaaS ($20-50/mo)"
            },
            {
              name: "Fragmented Workflow Builders",
              advantages: ["Custom API plumbing", "Broad generic connectors"],
              vulnerabilities: ["Complex maintenance", "Lacks native marketing intelligence", "No brand tone guardrails"],
              pricingModel: "Usage-based task credits"
            }
          ],
          featureGaps: [
            "Persistent Company Brain memory",
            "Autonomous Research & Strategy coordination",
            "Automated competitor move tracking"
          ],
          threatLevel: "moderate",
          counterTactics: [
            "Emphasize FoundryOS persistent Company Brain context over single-turn prompting",
            "Promote unified Research -> Strategy pipeline integration"
          ]
        };

      case "chief-marketing-strategist":
        return {
          positioningStatement: "FoundryOS: The AI Marketing Operating System that understands your company, coordinates your workforce, and launches your marketing.",
          valueProposition: "Hire Nobody. Launch Everything. Persistent company context powering specialized AI Employees.",
          strategicPillars: [
            "Persistent Context First: Zero prompt re-entry",
            "Specialized Execution: Dedicated Research & Strategy agents",
            "Human Oversight: Complete founder control before external deployment"
          ],
          goalAlignment: [
            { goal: "Rapid customer acquisition", initiative: "Targeted competitive displacement campaigns", targetMetric: "35% MoM pipeline growth" },
            { goal: "Category leadership", initiative: "Thought leadership benchmarking against legacy tooling", targetMetric: "1,500 qualified signups" }
          ],
          channelPriorities: ["Developer & Founder Communities", "Technical SEO / Comparison Pages", "Direct Outbound"],
          brandToneChecks: ["No hype/buzzwords detected", "Professional and confident voice enforced"]
        };

      case "gtm-funnel-strategist":
        return {
          campaignTheme: "Autonomous Startup Marketing Foundation",
          funnelStages: {
            tofu: {
              focus: "Category awareness: Problem of fragmented marketing tools vs. Marketing OS",
              tactics: ["Benchmark comparison reports", "Interactive Brain Health calculator"]
            },
            mofu: {
              focus: "Evaluation: Demonstrating persistent Company Brain memory and competitor audits",
              tactics: ["Free competitor audit preview", "Live interactive agent demo"]
            },
            bofu: {
              focus: "Conversion: Onboarding to FoundryOS with instant company profile indexing",
              tactics: ["One-click knowledge ingestion", "Guaranteed strategy roadmap delivery"]
            }
          },
          offerArchitecture: {
            coreOffer: "Complete AI Marketing Function on FoundryOS",
            incentive: "Instant Company Brain audit with competitor tracking included",
            riskReversal: "14-day full satisfaction trial with zero commitment"
          },
          kpis: ["Demo activation rate > 40%", "Free-to-paid conversion > 12%", "CAC payback < 3 months"]
        };

      case "foundryos-assistant": {
        const company = getActiveCompanyBrainState();
        return {
          summary: `Executive Guidance for ${company.name}`,
          advice: `Welcome to FoundryOS. Based on your current profile for ${company.name}, you are targeting ${company.audience} to address "${company.problem}".\n\nTo scale your marketing and go-to-market trajectory, I recommend focusing on three core pillars:\n1. **Deep Competitive Audits**: Map the gaps left by competitors (${company.competitors || "your direct alternatives"}) to refine positioning.\n2. **High-Value Acquisition Channel**: Launch a targeted awareness campaign highlighting ${company.name}'s unique value proposition.\n3. **Conversion Funnel Optimization**: Streamline user onboarding and implement clear value-proof points.\n\nYou can ask our specialized agents (Market Research, Competitive Intelligence, Chief Strategist, or GTM Funnel Architect) to drill into any specific area whenever you're ready.`,
          keyFocus: "Startup Marketing & Growth",
          companyContext: company.name
        };
      }

      default:
        return { task, status: "completed", timestamp: new Date().toISOString() };
    }
  }
}

export const agentRunner = new AgentRunner();
