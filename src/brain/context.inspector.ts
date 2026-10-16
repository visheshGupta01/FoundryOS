import { z } from "zod";
import { BrainRepository, brainRepository } from "./brain.repository.js";
import { estimateTokenCount, getActiveCompanyBrainState } from "./context.builder.js";
import { employeeRegistry } from "../backend/employees/employee.registry.js";

export const LayerTokenMetricSchema = z.object({
  layerKey: z.string(),
  displayName: z.string(),
  tokenCount: z.number(),
  percentageOfBudget: z.number(),
  snippet: z.string()
});
export type LayerTokenMetric = z.infer<typeof LayerTokenMetricSchema>;

export const ContextInspectionReportSchema = z.object({
  tenantId: z.string(),
  employeeId: z.string(),
  totalTokensUsed: z.number(),
  maxTokenBudget: z.number(),
  reservedCompletionBudget: z.number(),
  availableHeadroom: z.number(),
  budgetStatus: z.enum(["optimal", "warning", "exceeded"]),
  layers: z.array(LayerTokenMetricSchema)
});
export type ContextInspectionReport = z.infer<typeof ContextInspectionReportSchema>;

export class ContextInspector {
  private readonly repo: BrainRepository;

  constructor(repo: BrainRepository = brainRepository) {
    this.repo = repo;
  }

  public async inspectContext(
    tenantId: string,
    employeeId: string,
    userTask: string,
    options: { maxTokenBudget?: number; reservedCompletionBudget?: number } = {},
    repoOverride?: BrainRepository
  ): Promise<ContextInspectionReport> {
    const activeRepo = repoOverride ?? this.repo;
    const maxBudget = options.maxTokenBudget ?? 4096;
    const reservedBudget = options.reservedCompletionBudget ?? 1024;
    const employee = employeeRegistry.getEmployee(employeeId);

    let company: any = null;
    let products: any[] = [];
    let icp: any = null;
    let personas: any[] = [];
    let brand: any = null;
    let competitors: any[] = [];
    let goals: any[] = [];
    let strategies: any[] = [];
    let memories: any[] = [];

    try {
      [company, products, icp, personas, brand, competitors, goals, strategies, memories] =
        await Promise.all([
          activeRepo.getCompanyProfile(tenantId),
          activeRepo.getProducts(tenantId),
          activeRepo.getIcp(tenantId),
          activeRepo.getPersonas(tenantId),
          activeRepo.getBrandProfile(tenantId),
          activeRepo.getCompetitors(tenantId),
          activeRepo.getGoals(tenantId, "active"),
          activeRepo.getStrategies(tenantId, true),
          activeRepo.queryMemories(tenantId, { status: "validated", minConfidence: 0.6 })
        ]);
    } catch {
      const activeState = getActiveCompanyBrainState();
      if (activeState.name) {
        company = {
          companyName: activeState.name,
          website: activeState.website,
          industry: "General Business",
          description: activeState.oneLiner
        };
        products = activeState.problem
          ? [
              {
                productName: `${activeState.name} Solution`,
                category: "Product/Service",
                problemStatement: activeState.problem,
                features: []
              }
            ]
          : [];
        icp = activeState.audience
          ? {
              customerType: activeState.audience,
              painPoints: activeState.problem ? [activeState.problem] : []
            }
          : null;
        personas = [{ name: "Customer", role: "Target User" }];
        brand = {
          brandPositioning: activeState.oneLiner,
          tonePositive: activeState.tone ? activeState.tone.split(",").map((s) => s.trim()) : ["direct"],
          toneAvoid: activeState.avoidTone ? activeState.avoidTone.split(",").map((s) => s.trim()) : []
        };
        competitors = activeState.competitors
          ? [
              {
                name: activeState.competitors.split(",")[0]?.trim() || "Competitors",
                strengths: [],
                weaknesses: []
              }
            ]
          : [];
        goals = activeState.goal
          ? [
              {
                objective: activeState.goal,
                successMetric: ""
              }
            ]
          : [];
      }
    }

    const layers: LayerTokenMetric[] = [];

    const systemText = employee.systemPrompt;
    const systemTokens = estimateTokenCount(systemText);
    layers.push({
      layerKey: "system_prompt",
      displayName: "System Directive (Persona)",
      tokenCount: systemTokens,
      percentageOfBudget: Number(((systemTokens / maxBudget) * 100).toFixed(1)),
      snippet: systemText.slice(0, 120)
    });

    const userTokens = estimateTokenCount(userTask);
    layers.push({
      layerKey: "user_task",
      displayName: "User Objective / Task",
      tokenCount: userTokens,
      percentageOfBudget: Number(((userTokens / maxBudget) * 100).toFixed(1)),
      snippet: userTask.slice(0, 120)
    });

    if (company) {
      const companyText = `${company.companyName} | ${company.industry ?? "Tech"}\n${company.description ?? ""}`;
      const count = estimateTokenCount(companyText);
      layers.push({
        layerKey: "company_identity",
        displayName: "Company Profile & Identity",
        tokenCount: count,
        percentageOfBudget: Number(((count / maxBudget) * 100).toFixed(1)),
        snippet: companyText.slice(0, 120)
      });
    }

    if (products.length > 0) {
      const p = products[0]!;
      const productText = `${p.productName} (${p.category ?? "Product"})\nProblem: ${p.problemStatement ?? "N/A"}\nFeatures: ${(p.features ?? []).slice(0, 5).join(", ")}`;
      const count = estimateTokenCount(productText);
      layers.push({
        layerKey: "product_scope",
        displayName: "Product Scope & Features",
        tokenCount: count,
        percentageOfBudget: Number(((count / maxBudget) * 100).toFixed(1)),
        snippet: productText.slice(0, 120)
      });
    }

    if (icp || personas.length > 0) {
      const personaName = personas.length > 0 ? `${personas[0]!.name} (${personas[0]!.role})` : "General";
      const audienceText = `Target: ${icp?.customerType ?? "Founders"}\nPain Points: ${(icp?.painPoints ?? []).join("; ")}\nPrimary Persona: ${personaName}`;
      const count = estimateTokenCount(audienceText);
      layers.push({
        layerKey: "audience_icp",
        displayName: "Audience & ICP Personas",
        tokenCount: count,
        percentageOfBudget: Number(((count / maxBudget) * 100).toFixed(1)),
        snippet: audienceText.slice(0, 120)
      });
    }

    if (brand) {
      const brandText = `Positioning: ${brand.brandPositioning ?? "N/A"}\nTone: ${(brand.tonePositive ?? []).join(", ")}\nAvoid Rules: ${(brand.toneAvoid ?? []).join(", ")}`;
      const count = estimateTokenCount(brandText);
      layers.push({
        layerKey: "brand_voice",
        displayName: "Brand Voice & Avoid Rules",
        tokenCount: count,
        percentageOfBudget: Number(((count / maxBudget) * 100).toFixed(1)),
        snippet: brandText.slice(0, 120)
      });
    }

    if (competitors.length > 0) {
      const competitorText = competitors.slice(0, 3).map((c) => `${c.name}: ${(c.strengths ?? []).slice(0, 2).join(", ")}`).join("\n");
      const count = estimateTokenCount(competitorText);
      layers.push({
        layerKey: "competitor_intel",
        displayName: "Competitor Intelligence",
        tokenCount: count,
        percentageOfBudget: Number(((count / maxBudget) * 100).toFixed(1)),
        snippet: competitorText.slice(0, 120)
      });
    }

    if (goals.length > 0 || strategies.length > 0) {
      const goalStr = goals.slice(0, 2).map((g) => `${g.objective} (${g.successMetric})`).join("; ");
      const stratStr = strategies.slice(0, 1).map((s) => `v${s.version}: ${s.title}`).join("; ");
      const strategyText = `Goals: ${goalStr}\nStrategy: ${stratStr}`;
      const count = estimateTokenCount(strategyText);
      layers.push({
        layerKey: "goals_strategy",
        displayName: "Goals & Strategy Versions",
        tokenCount: count,
        percentageOfBudget: Number(((count / maxBudget) * 100).toFixed(1)),
        snippet: strategyText.slice(0, 120)
      });
    }

    if (memories.length > 0) {
      const memoryText = memories.slice(0, 3).map((m) => `[${m.memoryType}] ${m.statement}`).join("\n");
      const count = estimateTokenCount(memoryText);
      layers.push({
        layerKey: "institutional_memory",
        displayName: "Digital Institutional Memory",
        tokenCount: count,
        percentageOfBudget: Number(((count / maxBudget) * 100).toFixed(1)),
        snippet: memoryText.slice(0, 120)
      });
    }

    const totalTokensUsed = layers.reduce((acc, l) => acc + l.tokenCount, 0);
    const availableHeadroom = maxBudget - totalTokensUsed - reservedBudget;

    let budgetStatus: "optimal" | "warning" | "exceeded" = "optimal";
    if (availableHeadroom < 0) {
      budgetStatus = "exceeded";
    } else if (availableHeadroom < maxBudget * 0.15) {
      budgetStatus = "warning";
    }

    return {
      tenantId,
      employeeId,
      totalTokensUsed,
      maxTokenBudget: maxBudget,
      reservedCompletionBudget: reservedBudget,
      availableHeadroom,
      budgetStatus,
      layers
    };
  }
}

export const contextInspector = new ContextInspector();
