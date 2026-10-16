import { z } from "zod";
import { employeeRegistry } from "../employees/employee.registry.js";
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
import {
  generateMarketSizingSvg,
  generateCompetitorMatrixSvg,
  generateGtmFunnelSvg,
  generatePillarsSvg
} from "../utils/visual.charts.js";

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

export interface AgentSuggestion {
  label: string;
  prompt: string;
  agentId?: string;
}

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
  runtimeMode?: "lightweight_fast" | "specialist_pipeline" | "trueforge_production";
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
  suggestions?: AgentSuggestion[];
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


  private planRelevantTools(employeeId: string, task: string): Array<{ name: string; input: any }> {
    const plans: Array<{ name: string; input: any }> = [];
    const lower = task.toLowerCase();

    const urlMatch = task.match(/(?:https?:\/\/)?([a-zA-Z0-9][-a-zA-Z0-9]*\.(?:com|org|io|net|dev|co|ai|app|sh|so|tech|xyz|me|info|biz)(?:\/[^\s]*)?)/i);
    const rawUrl = urlMatch?.[1];
    let domainOnly: string | null = null;
    if (rawUrl) {
      const p1 = rawUrl.split("/")[0] ?? rawUrl;
      const p2 = p1.split("?")[0] ?? p1;
      domainOnly = p2.replace(/^[a-z]+:\/\//, "");
    }

    if (domainOnly) {
      if (lower.includes("latency") || lower.includes("ttfb") || lower.includes("ping") || lower.includes("speed") || lower.includes("uptime")) {
        plans.push({ name: "status_latency_probe", input: { url: `https://${domainOnly}` } });
      } else if (lower.includes("whois") || lower.includes("registrar") || lower.includes("domain age") || lower.includes("expiry")) {
        plans.push({ name: "whois_domain_auditor", input: { domain: domainOnly } });
      } else if (lower.includes("security") || lower.includes("cors") || lower.includes("csp") || lower.includes("vulnerability")) {
        plans.push({ name: "open_cors_security_scanner", input: { domain: domainOnly } });
      } else if (lower.includes("sitemap") || lower.includes("crawl") || lower.includes("robots") || lower.includes("architecture")) {
        plans.push({ name: "sitemap_page_crawler", input: { domain: domainOnly } });
      } else {
        plans.push({ name: "domain_tech_inspector", input: { domain: domainOnly } });
      }

      if (lower.includes("competitor") || lower.includes("teardown") || lower.includes("audit") || lower.includes("inspect")) {
        plans.push({ name: "competitor_analyzer", input: { url: `https://${domainOnly}` } });
      }
    }

    const ghMatch = task.match(/(?:github\.com\/|repo\s+|github\s+)?([a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+)/i);
    if ((lower.includes("github") || lower.includes("repo") || lower.includes("open source") || lower.includes("stars")) && (ghMatch || lower.length > 5)) {
      const ghCaptured = ghMatch?.[1];
      const repoQuery = ghCaptured || (task.slice(0, 40).replace(/github|repo|stars|track/gi, "").trim());
      if (repoQuery) {
        plans.push({ name: "github_repo_tracker", input: { repo: repoQuery } });
      }
    }

    if (lower.includes("pypi") || lower.includes("pip") || lower.includes("python package") || lower.includes("python library")) {
      const pypiMatch = task.match(/(?:pypi|pip|python package|python library)\s+([a-zA-Z0-9@/._-]+)/i);
      const pkg = pypiMatch?.[1] || task.replace(/pypi|pip|python|package|library/gi, "").trim().split(/\s+/)[0] || "";
      if (pkg.length > 1) {
        plans.push({ name: "pypi_package_telemetry", input: { packageName: pkg } });
      }
    }

    if (lower.includes("product hunt") || lower.includes("producthunt") || lower.includes("trending product") || lower.includes("daily launch")) {
      plans.push({ name: "producthunt_daily_tracker", input: { topic: "tech" } });
    }

    if (lower.includes("news") || lower.includes("press") || lower.includes("coverage") || lower.includes("pr strategy") || lower.includes("headline")) {
      const newsTopic = task.replace(/news|press|coverage|headline|sentiment/gi, "").trim().slice(0, 45) || task.slice(0, 45);
      plans.push({ name: "company_news_sentiment", input: { query: newsTopic, limit: 4 } });
    }

    if (lower.includes("reddit") || lower.includes("sentiment") || lower.includes("feedback") || lower.includes("complaint") || lower.includes("pain point") || lower.includes("community pulse")) {
      const redditTopic = task.replace(/reddit|sentiment|community|pulse|customer|feedback/gi, "").trim().slice(0, 45) || task.slice(0, 45);
      plans.push({ name: "reddit_community_pulse", input: { query: redditTopic, subreddit: "startups", limit: 4 } });
    }

    if (lower.includes("hacker news") || lower.includes("hackernews") || lower.includes("hn") || lower.includes("trending tech") || lower.includes("show hn")) {
      const hnTopic = task.replace(/hacker\s*news|hn|trending|tech/gi, "").trim().slice(0, 45) || task.slice(0, 45);
      plans.push({ name: "hacker_news_realtime", input: { query: hnTopic, limit: 4 } });
    }

    if (lower.includes("npm") || lower.includes("package") || lower.includes("library") || lower.includes("sdk downloads")) {
      const npmMatch = task.match(/(?:npm|package|library)\s+([a-zA-Z0-9@/._-]+)/i);
      const npmCaptured = npmMatch?.[1];
      const firstWord = task.replace(/npm|package|telemetry|downloads|library/gi, "").trim().split(/\s+/)[0] ?? "";
      const pkg = npmCaptured || firstWord;
      if (pkg && pkg.length > 1) {
        plans.push({ name: "npm_package_telemetry", input: { packageName: pkg } });
      }
    }

    if (lower.includes("keyword") || lower.includes("seo") || lower.includes("search query") || lower.includes("ranking")) {
      plans.push({ name: "keyword_suggester", input: { seedTopic: task.slice(0, 40) } });
    }

    if (lower.includes("cac") || lower.includes("ltv") || lower.includes("unit economic") || lower.includes("payback")) {
      plans.push({ name: "cac_ltv_calculator", input: { arpuMonthly: 99, cac: 280, churnRateMonthly: 0.03 } });
    }

    if (lower.includes("funnel") || lower.includes("conversion rate") || lower.includes("benchmark") || lower.includes("cro")) {
      plans.push({ name: "funnel_benchmarks", input: { businessModel: "B2B SaaS" } });
    }

    if (lower.includes("wiki") || lower.includes("wikipedia") || lower.includes("definition") || lower.includes("category overview")) {
      plans.push({ name: "wikipedia_intelligence", input: { query: task.slice(0, 40) } });
    }

    if (lower.includes("deep research") || lower.includes("deep dive") || lower.includes("neural search") || lower.includes("exa")) {
      plans.push({ name: "neural_web_research", input: { query: task.slice(0, 50), depth: "quick" } });
    }

    if (
      plans.length === 0 &&
      (lower.includes("search") || lower.includes("what is") || lower.includes("how to") || lower.includes("compare") || lower.includes("vs") || lower.includes("market") || lower.includes("competitor") || employeeId === "market-research-analyst") &&
      lower.length > 8
    ) {
      plans.push({ name: "web_search", input: { query: task.slice(0, 50), limit: 3 } });
    }

    return plans;
  }

  private async executeRelevantTools(
    employeeId: string,
    task: string,
    tenantId: string
  ): Promise<Array<{ toolName: string; input: unknown; output: unknown; result: unknown; success: boolean; durationMs: number }>> {
    const plans = this.planRelevantTools(employeeId, task);
    const toolCache = new Map<string, { output: unknown; durationMs: number; success: boolean }>();

    const execPromises = plans.map(async (plan) => {
      if (!toolRegistry.hasTool(plan.name)) return null;
      const cacheKey = `${plan.name}|${JSON.stringify(plan.input)}`;
      if (toolCache.has(cacheKey)) {
        const cached = toolCache.get(cacheKey)!;
        return {
          toolName: plan.name,
          input: plan.input,
          output: cached.output,
          result: cached.output,
          durationMs: cached.durationMs,
          success: cached.success
        };
      }

      try {
        const res = await toolRegistry.executeTool(plan.name, plan.input, { tenantId, employeeId });
        const payload = res.success ? res.data : { error: res.error || "Tool returned no payload", status: "degraded" };
        const result = {
          toolName: plan.name,
          input: plan.input,
          output: payload,
          result: payload,
          durationMs: res.durationMs || 0,
          success: res.success
        };
        toolCache.set(cacheKey, { output: payload, durationMs: res.durationMs || 0, success: res.success });
        return result;
      } catch (toolErr) {
        const errorMsg = toolErr instanceof Error ? toolErr.message : String(toolErr);
        logger.debug(`Tool execution degraded: ${plan.name}`, { error: errorMsg });
        return {
          toolName: plan.name,
          input: plan.input,
          output: { error: errorMsg, status: "degraded" },
          result: { error: errorMsg, status: "degraded" },
          durationMs: 0,
          success: false
        };
      }
    });

    const results = await Promise.all(execPromises);
    return results.filter((r): r is NonNullable<typeof r> => r !== null);
  }

  private tryInstantLightweightResponse(task: string, employeeId: string = "foundryos-assistant"): { summary: string; advice: string; keyFocus: string } | null {
    const companyState = getActiveCompanyBrainState();
    const clean = task.trim().toLowerCase().replace(/[!.?,;:]/g, "");

    const conversationalSet = new Set([
      "alrighty", "alright", "ok", "okay", "cool", "sounds good", "ready",
      "lets go", "let's go", "yep", "yes", "sure", "got it", "thanks", "thank you",
      "nice", "great", "done", "yo", "sup", "what's up", "whats up", "howdy",
      "hi", "hello", "hey", "test"
    ]);

    if (conversationalSet.has(clean) || clean.startsWith("hi ") || clean.startsWith("hello ") || clean.startsWith("hey ") || clean.startsWith("good morning") || clean.startsWith("good evening")) {
      let roleGreeting = "I'm in your corner. What are we tackling today — hunting down new demand, dismantling a competitor, or sharpening your offer?";
      if (employeeId === "competitor-analyst") {
        roleGreeting = "Name the rival. We'll strip down their pricing, expose where their product is vulnerable, and find the exact wedge you can exploit.";
      } else if (employeeId === "market-research-analyst") {
        roleGreeting = "Let's look at real customer pain, not vanity hype. What category or customer segment are we validating today?";
      } else if (employeeId === "chief-marketing-strategist") {
        roleGreeting = "Ready when you are. Let's kill the fluff and forge a positioning narrative that makes you the obvious category choice.";
      } else if (employeeId === "gtm-funnel-strategist") {
        roleGreeting = "Let's talk numbers and friction. Which stage of your funnel is bleeding conversions, or what offer are we engineering?";
      } else if (employeeId === "multi-agent") {
        roleGreeting = "Executive war room is assembled. Give us the product, competitor, or challenge, and all 4 of us will deliver a unified battle plan.";
      }

      return {
        summary: `Executive Readiness`,
        advice: roleGreeting,
        keyFocus: "Direct Dialogue"
      };
    }

    if (
      clean.includes("who are you") || clean.includes("what is foundryos") ||
      clean.includes("what can you do") || clean === "help"
    ) {
      return {
        summary: `Executive Strategy Partner`,
        advice: `Think of me as your battle-tested co-founder and GTM partner. I don't give you generic textbook theory or AI filler — I help you break down market demand, dissect competitors, craft sharp positioning, and build acquisition funnels that actually convert.\n\nWhether you need an unvarnished sanity check on pricing, a full competitor teardown, or a go-to-market playbook, lay it on me. What's on your mind?`,
        keyFocus: "Partner Capabilities"
      };
    }

    if (
      clean.includes("who are my competitors") || clean.includes("competitors list") ||
      clean.includes("list competitors") || clean === "competitors"
    ) {
      const compAdvice = companyState.competitors
        ? `Here are the key competitors we're currently tracking for **${companyState.name || "your business"}**:\n\n${companyState.competitors}\n\n*Ready to expose their weak spots? Ask me to run a deep competitor pricing teardown or select **Competitor Intelligence Analyst** to find your asymmetrical advantage.*`
        : `We haven't pinned down your direct rivals in your Company Brain yet. Tell me what product you're building or who you keep bumping into in sales conversations, and I'll tear down their moats and vulnerabilities for you.`;

      return {
        summary: `Competitor Intelligence`,
        advice: compAdvice,
        keyFocus: "Competitor Tracking"
      };
    }

    if (
      clean.includes("what is our positioning") || clean.includes("what do we do") ||
      clean.includes("one liner") || clean.includes("value prop")
    ) {
      const posAdvice = companyState.name && companyState.oneLiner
        ? `Here is your current strategic foundation for **${companyState.name}**:\n\n- 🎯 **One-Liner**: ${companyState.oneLiner}\n- 💥 **Problem Solved**: ${companyState.problem}\n- 👥 **Target Audience**: ${companyState.audience}\n- 🗣️ **Brand Voice**: ${companyState.tone}\n\n*Want to test how this holds up against market alternatives, or sharpen the hook? Just say the word.*`
        : `Your positioning isn't locked in yet. Give me the raw story: who is losing sleep over this problem, what are they using right now, and why is your way 10x better? We'll forge a positioning statement that actually wins.`;

      return {
        summary: `Core Positioning`,
        advice: posAdvice,
        keyFocus: "Core Positioning"
      };
    }

    if (
      clean === "continue" || clean === "continue without it" || clean === "proceed" ||
      clean === "proceed without it" || clean === "use benchmarks" || clean === "use defaults" ||
      clean === "proceed with benchmarks"
    ) {
      return {
        summary: `Strategic Playbook (Top-Tier Benchmarks)`,
        advice: `### ⚡ Full Speed Ahead — Calibrated to Top-Decile Benchmarks\n\nNo friction, let's roll. Here is your battle-tested playbook calibrated against high-growth, top-quartile startup metrics:\n\n1. 🎯 **The High-Urgency Wedge (ICP)**:\n   - Target only prospects who feel the pain *today*. Do not sell to people browsing or "evaluating for next year." Target the operational bottleneck where a 24-hour time-to-value creates instant relief.\n\n2. ⚔️ **Asymmetric Moat (Outmaneuver Incumbents)**:\n   - Legacy giants are slow, bloated, and trapped by enterprise red tape. Your lethal advantage is speed, direct founder empathy, and zero-bullshit onboarding. Own the niche they ignore.\n\n3. 📊 **Ruthless Unit Economics**:\n   - **Target CAC Payback**: Under 90 days. If a channel takes 9 months to break even at this stage, kill it.\n   - **Offer Structure**: Clear 2-tier pricing ($49 - $149/mo) with instant self-serve activation. Eliminate demo-call gates for early tiers.\n   - **Primary Engine**: Founder-led distribution + high-intent search / direct organic problem teardowns.\n\n*Drop any specifics — your pricing, a competitor's URL, or your target audience — whenever you want to turn this into a surgical custom teardown.*`,
        keyFocus: "Benchmark Strategic Plan"
      };
    }

    if (clean.includes("credit") || clean.includes("token balance") || clean.includes("allowance")) {
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
    let isLightweight = false;

    if (!targetEmployeeId || targetEmployeeId === "auto") {
      const decision = await routeTaskWithLlm(input.task, this.llm);
      targetEmployeeId = decision.employeeId;
      isLightweight = false;
      routedBy = "llm_router";
      routingReason = decision.reason;
    }

    const employee = employeeRegistry.getEmployee(targetEmployeeId);

    const instantOutput = this.tryInstantLightweightResponse(input.task, targetEmployeeId);
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
        llmProvider: "instant_conversational",
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

    const isLLMUp = await this.llm.isAvailable();

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

    let toolCalls: Array<{ toolName: string; input: unknown; output: unknown; result: unknown; success: boolean; durationMs: number }> = [];
    if (input.enableTools) {
      toolCalls = await this.executeRelevantTools(targetEmployeeId, input.task, input.tenantId);
      if (toolCalls.length > 0) {
        prompt += "\n\n=== REAL-TIME TELEMETRY & OPEN-SOURCE TOOL FINDINGS ===";
        for (const tc of toolCalls) {
          prompt += `\n\n[Live Tool: ${tc.toolName} | Status: ${tc.success ? "Healthy" : "Degraded"} | Latency: ${tc.durationMs}ms]:\n${JSON.stringify(tc.output, null, 2)}`;
        }
        prompt += "\n\nINSTRUCTION FOR REAL-TIME DATA SYNTHESIS: Directly cite and leverage the exact real-time tool findings above (live DNS records, GitHub telemetry, customer sentiment, latency metrics, or benchmarks) to provide an authoritative, hyper-accurate, and concrete strategic answer.";
      }
    }

    let parsedOutput: unknown;
    let activeProvider: string = this.llm.providerName;
    let activeRuntimeMode: "lightweight_fast" | "specialist_pipeline" | "trueforge_production" =
      isLightweight ? "lightweight_fast" : "specialist_pipeline";

    let trueForgeHandled = false;
    if (!isLightweight && targetEmployeeId !== "foundryos-assistant") {
      const isTfUp = await this.trueforge.isAvailable();
      if (isTfUp) {
        try {
          const tfTurn = await this.trueforge.runAgentTurn({
            agentName: targetEmployeeId,
            prompt,
            tenantId: input.tenantId,
            metadata: {
              employeeId: employee.identity.id,
              pillar: employee.identity.pillar,
              task: input.task
            }
          });

          if (tfTurn.output) {
            try {
              parsedOutput = JSON.parse(tfTurn.output);
            } catch {
              const companyState = getActiveCompanyBrainState();
              parsedOutput = {
                summary: `${employee.identity.name}: Strategic Teardown for ${companyState.name}`,
                advice: tfTurn.output,
                keyFocus: employee.identity.title
              };
            }
            activeProvider = "trueforge";
            activeRuntimeMode = "trueforge_production";
            trueForgeHandled = true;
            logger.info("Agent turn executed via TrueForge harness", {
              tenantId: input.tenantId,
              employeeId: targetEmployeeId,
              turnId: tfTurn.turnId
            });
          }
        } catch (tfErr) {
          logger.warn(`TrueForge execution fallback to local engine: ${String(tfErr)}`);
        }
      }
    }

    if (!trueForgeHandled) {
      if (targetEmployeeId === "foundryos-assistant") {
        const companyState = getActiveCompanyBrainState();
        const companyProfileContext = companyState.name
          ? `COMPANY PROFILE:
- Business Name: ${companyState.name}
- One-Liner: ${companyState.oneLiner}
- Target Audience: ${companyState.audience}
- Problem Solved: ${companyState.problem}
- Competitors: ${companyState.competitors}
- Brand Voice: ${companyState.tone}`
          : `COMPANY PROFILE:
No pre-configured company profile in settings. Directly focus on and analyze whatever business, product, market, or challenge the founder describes in their message.`;

        const assistantSystemPrompt = `You are the Executive Business & Marketing Advisor — a battle-tested startup co-founder and veteran CMO sitting directly across the table from the founder.
${companyProfileContext}

VOICE, PERSONA & HUMAN CONVICTION:
1. BOLD, CONFIDENT & DEEPLY HUMAN:
   Speak like an experienced, high-conviction operator who has real skin in the game. You are not a timid AI or a polite generic consultant; you are an opinionated partner who gives decisive, unvarnished advice.
   - Take a clear stand: Never hedge with wishy-washy "there are pros and cons to both." State the winning move with high conviction, and explain why the alternative bleeds cash or burns time.
   - Zero AI cliches & corporate throat-clearing: Eradicate robotic filler ("In today's fast-paced digital era...", "It's important to keep in mind...", "I would be delighted to assist..."). Start immediately with the core strategic punchline.
   - Grounded operator language: Use visceral, trench-tested terminology — "unit economics", "killing deadweight friction", "asymmetric wedge", "conversion cliff", "runway preservation", "zero-BS onboarding".
   - Peer-to-peer cadence: Speak with warmth, directness, and natural human rhythm. Use punchy sentences mixed with rigorous tactical breakdowns.

CORE OPERATING DIRECTIVES:
2. 100% FOUNDER-CENTRIC FOCUS:
   Focus entirely on the founder's specific venture, market, and operational realities. Never pitch FoundryOS or talk about the platform unless the founder specifically asks about it.
3. MISSING INFORMATION & CLARIFICATION PROTOCOL:
   If essential context is missing (e.g., target customer, exact pricing, or core competitor):
   - Deliver your immediate, high-conviction preliminary instinct and baseline framework right away.
   - Pinpoint the exact missing detail that would transform this from a strong strategy into an unfair competitive advantage.
   - Give the founder two frictionless options:
     a) Reply with the specific detail (e.g., "Tell me your pricing tier or top rival and I'll tailor this to the dollar").
     b) Or simply reply **"continue"** (or **"continue without it"**) and you will execute immediately using top-quartile industry benchmarks.
4. DEPTH & ACTIONABLE RIGOR:
   Deliver boardroom-ready, battle-tested depth. Organize answers with executive clarity: immediate bottom-line takeaway, sequenced tactical moves, quantitative benchmarks, and key execution pitfalls to avoid.`;

        const instantResponse = this.tryInstantLightweightResponse(input.task);
        if (instantResponse) {
          parsedOutput = instantResponse;
        } else {
          try {
            if (isLLMUp) {
              const generalResponse = await this.llm.generate(prompt, {
                system: assistantSystemPrompt,
                maxTokens: 3000,
                temperature: 0.65
              });

              let formattedAdvice = generalResponse;
              const indicatesMissing = /unable to|does not provide|not enough context|missing information|please provide|clarification|essential elements/i.test(generalResponse);
              if (indicatesMissing && !generalResponse.toLowerCase().includes("continue without it")) {
                formattedAdvice += `\n\n---\n### ⚡ How would you like to proceed?\n- ✍️ **Provide Context**: Reply with your product details, target audience, or current pricing for a bespoke plan.\n- ⏩ **Continue Without It**: Simply reply **"continue"** (or **"continue without it"**) to proceed immediately using standard industry benchmarks and general startup assumptions.`;
              }

              parsedOutput = {
                summary: companyState.name ? `Advisor for ${companyState.name}` : `Executive Strategy Guidance`,
                advice: formattedAdvice,
                keyFocus: "Executive Consultation"
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
        const companyRef = companyState.name || "the founder's business";
        const multiAgentPrompt = `You are leading the Multi-Agent Executive War Room for ${companyRef}.
You are not writing an academic overview; you are delivering a battle-ready, cross-functional master plan with high conviction and bold human insight across all 4 specialist disciplines:

1. 📊 Market Research & Demand Urgency (Maya Lin - Senior Market Intelligence)
   - Real, acute buying pain vs. vanity interest. TAM/SAM/SOM validation, macroeconomic category shifts, and the exact trigger that forces customers to buy TODAY instead of six months from now.
2. ⚔️ Competitor Teardown & Asymmetrical Warfare (Julian Vance - Lead Competitive Intelligence)
   - Surgical dissection of rivals (${companyState.competitors || "entrenched legacy incumbents"}). Expose their pricing vulnerabilities, bloated roadmaps, and bureaucratic blindspots. Define the asymmetric wedge to outmaneuver them.
3. 🎯 Brand Positioning & Strategic Narrative (Sarah Sterling - EVP of Brand & GTM)
   - The unassailable category POV. Clear out all generic jargon. State the non-negotiable value proposition and 3 core strategic pillars that make the product the only logical choice.
4. 📈 GTM Funnel & High-Velocity Conversion (Marcus Brody - Principal Funnel Architect)
   - Frictionless full-funnel mechanics: TOFU demand capture, MOFU undeniable proof/interactive sandbox, and BOFU zero-friction conversion. Irresistible offer architecture and CAC payback roadmap (< 90 days).

Task: ${input.task}
${companyState.name ? `Company: ${companyState.name} (${companyState.oneLiner})` : "Note: Analyze the specific business or product scenario described in the user task."}

Deliver an opinionated, high-conviction strategic teardown. Be direct, authoritative, and deeply human. Zero corporate platitudes. Do not pitch FoundryOS.`;

        try {
          const isLLMUp = await this.llm.isAvailable();
          if (isLLMUp) {
            const multiResponse = await this.llm.generate(prompt, {
              system: multiAgentPrompt,
              maxTokens: 3500,
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
        const companyState = getActiveCompanyBrainState();
        const directPrompt = `You are ${employee.identity.name} (${employee.identity.title}), the specialized executive in charge of ${employee.identity.pillar}${companyState.name ? ` for ${companyState.name}` : ""}.
${prompt}

Deliver an opinionated, bold, and deeply human strategic deliverable directly answering the founder's task.
Write with high conviction, authoritative clarity, and operator grit. Cut out all polite preamble, robotic summaries, and generic textbook theory. Deliver concrete playbooks, specific tactical moves, and clear trade-offs. Use clean, expressive Markdown.`;

        try {
          const isLLMUp = await this.llm.isAvailable();
          if (isLLMUp) {
            const rawText = await this.llm.generate(directPrompt, {
              system: employee.systemPrompt,
              maxTokens: 2500,
              temperature: 0.55
            });

            parsedOutput = {
              summary: `${employee.identity.name}: Strategic Analysis`,
              advice: rawText,
              keyFocus: employee.identity.title
            };
          } else {
            parsedOutput = this.generateDeterministicFallback(targetEmployeeId, input.task);
          }
        } catch (err: unknown) {
          logger.warn(`Model generation error: ${String(err)}`);
          parsedOutput = this.generateDeterministicFallback(targetEmployeeId, input.task);
        }
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

    const isLightweightRun = false;
    const estimatedCompletionTokens = 350;
    const totalTokensConsumed = (tokenReport.totalTokensUsed || 0) + estimatedCompletionTokens;
    const creditResult = creditService.consumeCredits(input.tenantId, totalTokensConsumed);

    const durationMs = Date.now() - startTime;
    const taskLower = input.task.toLowerCase();

    const isFollowupOrExecution =
      taskLower.startsWith("proceed") ||
      taskLower.includes("chosen direction") ||
      taskLower.includes("approved direction") ||
      taskLower.includes("milestones, specific deliverables") ||
      taskLower.includes("confirmed by founder");

    const isHighStakesAction =
      (taskLower.includes("publish") || taskLower.includes("commit") || taskLower.includes("broadcast")) &&
      (taskLower.includes("positioning") || taskLower.includes("brand thesis") || taskLower.includes("slack") || taskLower.includes("campaign"));

    const shouldGateApproval = !isFollowupOrExecution && (
      (employee.approvalRules.requiresHumanApproval && isHighStakesAction) ||
      (input.task.toLowerCase().includes("require-approval") && isHighStakesAction)
    );

    const status = shouldGateApproval ? "awaiting_approval" : "completed";

    let pendingApproval: {
      approvalId: string;
      actionType: string;
      title: string;
      description: string;
      options?: Array<{ id: string; label: string; description: string; badge?: string; recommended?: boolean }> | undefined;
      status: "pending" | "approved" | "rejected";
    } | undefined = undefined;

    if (shouldGateApproval) {
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

    const companyStateForVisuals = getActiveCompanyBrainState();
    parsedOutput = this.attachContextualVisuals(employee.identity.id, parsedOutput, companyStateForVisuals);

    const outputString = typeof parsedOutput === "string"
      ? parsedOutput
      : (parsedOutput as any)?.advice || (parsedOutput as any)?.summary || JSON.stringify(parsedOutput);

    const suggestions = this.extractOrGenerateSuggestions(input.task, employee.identity.id, outputString);

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
      runtimeMode: activeRuntimeMode,
      llmProvider: activeProvider,
      suggestions,
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

  private attachContextualVisuals(employeeId: string, output: unknown, companyState: any): unknown {
    if (!output || typeof output !== "object") return output;
    const current = output as Record<string, any>;
    const advice = current["advice"];
    if (typeof advice !== "string" || advice.length < 40) return output;
    if (advice.includes("data:image/svg+xml") || advice.includes("![") || advice.includes("<img")) {
      return output;
    }

    let visualMd = "";
    if (employeeId === "market-research-analyst") {
      visualMd = `\n\n![TAM SAM SOM Market Sizing Architecture](${generateMarketSizingSvg({
        categoryName: companyState.name ? `${companyState.name} Opportunity Matrix` : "Market Sizing Architecture",
        tam: "$48.5B",
        sam: "$12.2B",
        som: "$1.8B"
      })})\n`;
    } else if (employeeId === "competitor-analyst") {
      const comps = companyState.competitors
        ? companyState.competitors.split(",").map((s: string) => s.trim()).filter(Boolean)
        : ["Legacy Incumbents", "Point Tools"];
      visualMd = `\n\n![Competitive Positioning Moat & 2x2 Matrix](${generateCompetitorMatrixSvg({
        companyName: companyState.name || "Our Product",
        competitors: comps
      })})\n`;
    } else if (employeeId === "chief-marketing-strategist") {
      visualMd = `\n\n![Strategic Positioning Blueprint](${generatePillarsSvg({
        companyName: companyState.name || "Executive Strategy",
        pillars: [
          { title: "Velocity & Agility", subtitle: "Instant time-to-value < 24 hours" },
          { title: "Defensible Moat", subtitle: "Autonomous execution vs manual hours" },
          { title: "Category Disruption", subtitle: "Asymmetric customer acquisition loop" }
        ]
      })})\n`;
    } else if (employeeId === "gtm-funnel-architect") {
      visualMd = `\n\n![GTM Full-Funnel Conversion Architecture](${generateGtmFunnelSvg({
        tofuLabel: "High-Intent Search & Outbound",
        mofuLabel: "Frictionless Interactive Demo",
        bofuLabel: "Self-Serve Upgrade & Contract",
        cacPayback: "< 90 Days Payback"
      })})\n`;
    } else if (employeeId === "multi-agent") {
      visualMd = `\n\n![Competitive Positioning Moat & 2x2 Matrix](${generateCompetitorMatrixSvg({
        companyName: companyState.name || "Our Product",
        competitors: ["Legacy Incumbents", "Manual Agencies"]
      })})\n\n![GTM Full-Funnel Conversion Architecture](${generateGtmFunnelSvg({
        tofuLabel: "Multi-Agent Demand Capture",
        mofuLabel: "Proof-of-Value Activation",
        bofuLabel: "Customer Expansion"
      })})\n`;
    }

    if (visualMd) {
      return {
        ...current,
        advice: `${advice}${visualMd}`
      };
    }

    return output;
  }

  private extractOrGenerateSuggestions(task: string, employeeId: string, outputText: string): AgentSuggestion[] {
    const suggestions: AgentSuggestion[] = [];

    const sectionMatch = outputText.match(/###\s*(?:💡\s*)?(?:Suggested Next Actions|Suggested Next Steps|Next Steps|Recommended Next Steps|Next Actions)[\s\S]*?(?=(?:###|$))/i);
    if (sectionMatch) {
      const block = sectionMatch[0];
      const lines = block.split("\n");
      for (const line of lines) {
        const itemMatch = line.match(/^[-*]\s*(?:\*\*(.*?)\*\*|\[(.*?)\]|([^:]+?)):\s*(.+)$/);
        if (itemMatch) {
          const label = (itemMatch[1] || itemMatch[2] || itemMatch[3] || "").trim();
          const prompt = (itemMatch[4] || "").trim();
          if (label && prompt && label.length <= 45) {
            suggestions.push({
              label,
              prompt,
              agentId: this.inferAgentIdFromText(label + " " + prompt)
            });
          }
        }
      }
    }

    if (suggestions.length >= 2) {
      return suggestions.slice(0, 3);
    }

    return this.synthesizeContextualSuggestions(task, employeeId, outputText);
  }

  private inferAgentIdFromText(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes("competitor") || lower.includes("moat") || lower.includes("pricing teardown") || lower.includes("battlecard")) {
      return "competitor-analyst";
    }
    if (lower.includes("funnel") || lower.includes("cac") || lower.includes("ltv") || lower.includes("conversion") || lower.includes("landing page") || lower.includes("retention")) {
      return "gtm-funnel-strategist";
    }
    if (lower.includes("tam") || lower.includes("market") || lower.includes("trend") || lower.includes("demand") || lower.includes("customer interview") || lower.includes("audience")) {
      return "market-research-analyst";
    }
    if (lower.includes("positioning") || lower.includes("value prop") || lower.includes("brand") || lower.includes("narrative") || lower.includes("pillar")) {
      return "chief-marketing-strategist";
    }
    return "foundryos-assistant";
  }

  private synthesizeContextualSuggestions(task: string, employeeId: string, outputText: string): AgentSuggestion[] {
    const lower = (task + " " + outputText).toLowerCase();
    const suggestions: AgentSuggestion[] = [];

    if (lower.includes("competitor") || lower.includes("pricing") || employeeId === "competitor-analyst") {
      suggestions.push({
        label: "Pricing & Packaging Model",
        prompt: "Audit competitor pricing tiers and model our optimal packaging structure.",
        agentId: "gtm-funnel-strategist"
      });
      suggestions.push({
        label: "Counter-Positioning Pitch",
        prompt: "Draft our core positioning statement and counter-narrative against top alternatives.",
        agentId: "chief-marketing-strategist"
      });
      suggestions.push({
        label: "TAM Demand Validation",
        prompt: "Validate market demand and customer pain signals for our alternative solution.",
        agentId: "market-research-analyst"
      });
    } else if (lower.includes("market") || lower.includes("tam") || lower.includes("trend") || employeeId === "market-research-analyst") {
      suggestions.push({
        label: "Competitor Vulnerability Audit",
        prompt: "Audit current market players, their pricing models, and key feature gaps.",
        agentId: "competitor-analyst"
      });
      suggestions.push({
        label: "Core Value Proposition",
        prompt: "Formulate our company positioning statement and value proposition targeting this market segment.",
        agentId: "chief-marketing-strategist"
      });
      suggestions.push({
        label: "Full-Funnel GTM Plan",
        prompt: "Design a customer acquisition funnel with TOFU lead magnets and conversion mechanics.",
        agentId: "gtm-funnel-strategist"
      });
    } else if (lower.includes("positioning") || lower.includes("value prop") || lower.includes("brand") || employeeId === "chief-marketing-strategist") {
      suggestions.push({
        label: "Conversion Landing Page Copy",
        prompt: "Generate high-converting hero headlines, subheads, and CTA copy based on our positioning.",
        agentId: "gtm-funnel-strategist"
      });
      suggestions.push({
        label: "Competitive Teardown",
        prompt: "Perform a competitor audit to stress-test our positioning against direct market alternatives.",
        agentId: "competitor-analyst"
      });
      suggestions.push({
        label: "Customer Discovery Script",
        prompt: "Draft customer discovery interview questions validating our core value proposition.",
        agentId: "market-research-analyst"
      });
    } else if (lower.includes("funnel") || lower.includes("cac") || lower.includes("conversion") || lower.includes("ltv") || employeeId === "gtm-funnel-strategist") {
      suggestions.push({
        label: "CAC / LTV Payback Analysis",
        prompt: "Calculate unit economics, CAC payback period, and conversion benchmark targets.",
        agentId: "gtm-funnel-strategist"
      });
      suggestions.push({
        label: "Competitor Pricing Benchmarks",
        prompt: "Benchmark our pricing strategy against key competitor price points and friction points.",
        agentId: "competitor-analyst"
      });
      suggestions.push({
        label: "Brand Authority Angles",
        prompt: "Formulate thought leadership angles and narrative content pillars to drive organic TOFU demand.",
        agentId: "chief-marketing-strategist"
      });
    } else {
      suggestions.push({
        label: "360° Multi-Agent Teardown",
        prompt: "Execute a collaborative multi-agent strategic teardown across research, competitors, positioning, and GTM.",
        agentId: "multi-agent"
      });
      suggestions.push({
        label: "Competitor Intelligence Teardown",
        prompt: "Audit top market alternatives, pricing vulnerabilities, and defensible moats.",
        agentId: "competitor-analyst"
      });
      suggestions.push({
        label: "GTM Conversion Engine",
        prompt: "Design our customer acquisition funnel with TOFU demand capture and high-converting offers.",
        agentId: "gtm-funnel-strategist"
      });
    }

    return suggestions.slice(0, 3);
  }

  private generateDeterministicFallback(employeeId: string, task: string): unknown {
    const employee = employeeRegistry.getEmployee(employeeId);
    const empName = employee?.identity?.name || "AI Specialist";

    const base = {
      summary: `${empName} Consultation`,
      advice: `Direct strategic assessment on "${task.slice(0, 100)}": Lock down your highest-urgency customer segment first, ruthlessly compress onboarding time down to under 24 hours to value, and protect your CAC payback window (<90 days). Ask any tactical follow-up or connect your local LLM model to run custom generative depth!`,
      keyFocus: employee?.identity?.title || "Executive Consultation"
    };

    switch (employeeId) {
      case "market-research-analyst":
        return {
          ...base,
          marketTrends: ["AI-driven workflow automation", "Founder-led marketing", "Contextual LLM tooling"],
          targetSegments: ["Early-stage founders", "Technical solopreneurs"]
        };
      case "competitor-analyst":
        return {
          ...base,
          competitorTeardowns: [{ competitor: "Status Quo", moat: "Brand familiarity", vulnerability: "Lack of deep context memory" }],
          threatLevel: "Moderate",
          counterTactics: ["Deploy persistent memory", "Highlight integrated cross-functional team"]
        };
      case "chief-marketing-strategist":
        return {
          ...base,
          positioningStatement: "Persistent contextual AI operating system for startup founders.",
          strategicPillars: ["Context Persistence", "Autonomous Execution", "Multi-Agent Collaboration"]
        };
      default:
        return base;
    }
  }
}

export const agentRunner = new AgentRunner();
