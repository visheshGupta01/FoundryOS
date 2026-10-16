import {
  type AssembledContext,
  type ContextAssemblyInput,
  type ContextBlock,
  ContextAssemblyInputSchema,
  type RetrievedChunk,
  type EmployeeContextInput,
  EmployeeContextInputSchema,
  type EmployeeContextPackage
} from "./context.contracts.js";
import { BrainRepository, brainRepository } from "./brain.repository.js";
import { semanticMemory } from "./semantic-memory.js";
import { DomainError } from "../backend/errors/base.error.js";
import { ErrorCode } from "../backend/errors/error-codes.js";

export function estimateTokenCount(text: string): number {
  if (!text || text.length === 0) {
    return 0;
  }
  return Math.ceil(text.length / 4);
}

function formatContextChunk(chunk: RetrievedChunk, index: number): string {
  return `[Source ${index + 1} | Reqd: ${chunk.similarity.toFixed(3)}]\n${chunk.content}`;
}

export function buildContext(rawInput: ContextAssemblyInput): AssembledContext {
  const parseResult = ContextAssemblyInputSchema.safeParse(rawInput);
  if (!parseResult.success) {
    throw new DomainError(
      "Invalid context assembly input",
      ErrorCode.VALIDATION_ERROR,
      { issues: parseResult.error.issues }
    );
  }

  const input = parseResult.data;
  const effectiveBudget = input.maxTokenBudget - input.reservedCompletionBudget;

  if (effectiveBudget <= 0) {
    throw new DomainError(
      "Effective context budget is non-positive",
      ErrorCode.CONTEXT_BUDGET_EXCEEDED,
      { maxTokenBudget: input.maxTokenBudget, reservedCompletionBudget: input.reservedCompletionBudget }
    );
  }

  const systemTokens = estimateTokenCount(input.systemDirective);
  const userTokens = estimateTokenCount(input.userQuery);
  const baseTokens = systemTokens + userTokens;

  if (baseTokens > effectiveBudget) {
    throw new DomainError(
      "Base prompt tokens exceed effective budget",
      ErrorCode.CONTEXT_BUDGET_EXCEEDED,
      { baseTokens, effectiveBudget }
    );
  }

  const availableChunkBudget = effectiveBudget - baseTokens;
  const sortedChunks = [...input.retrievedChunks].sort((a, b) => b.similarity - a.similarity);

  const includedChunks: RetrievedChunk[] = [];
  const includedChunkIds: string[] = [];
  let currentChunkTokens = 0;
  let droppedChunkCount = 0;

  for (let i = 0; i < sortedChunks.length; i++) {
    const chunk = sortedChunks[i]!;
    const formatted = formatContextChunk(chunk, i);
    const chunkCost = estimateTokenCount(formatted);

    if (currentChunkTokens + chunkCost <= availableChunkBudget) {
      includedChunks.push(chunk);
      includedChunkIds.push(chunk.chunkId);
      currentChunkTokens += chunkCost;
    } else {
      droppedChunkCount++;
    }
  }

  const blocks: ContextBlock[] = [
    {
      role: "system",
      content: input.systemDirective,
      tokenEstimate: systemTokens
    }
  ];

  if (includedChunks.length > 0) {
    const contextContent = includedChunks
      .map((c, idx) => formatContextChunk(c, idx))
      .join("\n\n");
    blocks.push({
      role: "context",
      content: contextContent,
      tokenEstimate: currentChunkTokens
    });
  }

  blocks.push({
    role: "user",
    content: input.userQuery,
    tokenEstimate: userTokens
  });

  const promptParts: string[] = [];
  promptParts.push(`### SYSTEM\n${input.systemDirective}`);
  if (includedChunks.length > 0) {
    const chunkSection = includedChunks
      .map((c, idx) => formatContextChunk(c, idx))
      .join("\n\n");
    promptParts.push(`### CONTEXT\n${chunkSection}`);
  }
  promptParts.push(`### USER\n${input.userQuery}`);

  const totalTokenEstimate = baseTokens + currentChunkTokens;
  const budgetRemaining = effectiveBudget - totalTokenEstimate;

  return {
    formattedPrompt: promptParts.join("\n\n"),
    blocks,
    totalTokenEstimate,
    budgetRemaining,
    includedChunkIds,
    droppedChunkCount
  };
}

let activeCompanyState = {
  name: "",
  website: "",
  oneLiner: "",
  audience: "",
  problem: "",
  competitors: "",
  tone: "",
  avoidTone: "",
  pricing: "",
  goal: ""
};

export function updateActiveCompanyBrainState(data: Partial<typeof activeCompanyState>): void {
  activeCompanyState = { ...activeCompanyState, ...data };
}

export function getActiveCompanyBrainState(): typeof activeCompanyState {
  return activeCompanyState;
}

export async function buildEmployeeContextPackage(
  rawInput: EmployeeContextInput,
  repo: BrainRepository = brainRepository
): Promise<EmployeeContextPackage> {
  const parseResult = EmployeeContextInputSchema.safeParse(rawInput);
  if (!parseResult.success) {
    throw new DomainError(
      "Invalid employee context input",
      ErrorCode.VALIDATION_ERROR,
      { issues: parseResult.error.issues }
    );
  }

  const input = parseResult.data;
  const effectiveBudget = input.maxTokenBudget - input.reservedCompletionBudget;
  const includedLayers: string[] = [];

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
        repo.getCompanyProfile(input.tenantId),
        repo.getProducts(input.tenantId),
        repo.getIcp(input.tenantId),
        repo.getPersonas(input.tenantId),
        repo.getBrandProfile(input.tenantId),
        repo.getCompetitors(input.tenantId),
        repo.getGoals(input.tenantId, "active"),
        repo.getStrategies(input.tenantId, true),
        repo.queryMemories(input.tenantId, { status: "validated", minConfidence: 0.6 })
      ]);
  } catch {
    if (activeCompanyState.name) {
      company = {
        companyName: activeCompanyState.name,
        website: activeCompanyState.website,
        industry: "General Business",
        description: activeCompanyState.oneLiner
      };
      products = activeCompanyState.problem
        ? [
            {
              productName: `${activeCompanyState.name} Solution`,
              category: "Product/Service",
              problemStatement: activeCompanyState.problem,
              features: []
            }
          ]
        : [];
      icp = activeCompanyState.audience
        ? {
            customerType: activeCompanyState.audience,
            painPoints: activeCompanyState.problem ? [activeCompanyState.problem] : []
          }
        : null;
      brand = {
        brandPositioning: activeCompanyState.oneLiner,
        tonePositive: activeCompanyState.tone ? activeCompanyState.tone.split(",").map((s) => s.trim()) : ["direct", "helpful"],
        toneAvoid: activeCompanyState.avoidTone ? activeCompanyState.avoidTone.split(",").map((s) => s.trim()) : []
      };
      competitors = activeCompanyState.competitors
        ? [
            {
              name: activeCompanyState.competitors.split(",")[0]?.trim() || "Competitors",
              strengths: [],
              weaknesses: []
            }
          ]
        : [];
      goals = activeCompanyState.goal
        ? [
            {
              objective: activeCompanyState.goal,
              successMetric: ""
            }
          ]
        : [];
    }
  }

  const sections: { title: string; content: string }[] = [];

  if (company && company.companyName) {
    sections.push({
      title: "COMPANY",
      content: `${company.companyName}${company.industry ? ` | ${company.industry}` : ""}${company.description ? `\n${company.description}` : ""}`
    });
    includedLayers.push("companyIdentity");
  } else if (activeCompanyState.name) {
    sections.push({
      title: "COMPANY",
      content: `${activeCompanyState.name}${activeCompanyState.oneLiner ? `\n${activeCompanyState.oneLiner}` : ""}`
    });
    includedLayers.push("companyIdentity");
  } else {
    sections.push({
      title: "CONTEXT_DIRECTIVE",
      content: "No company profile pre-configured in Company Brain. Analyze and respond specifically to the business, market, product, and questions stated in the user task. Do NOT assume the business is FoundryOS and do NOT preach or pitch FoundryOS."
    });
  }

  if (products.length > 0) {
    const p = products[0]!;
    const features = p.features ?? [];
    sections.push({
      title: "PRODUCT",
      content: `${p.productName}${p.category ? ` (${p.category})` : ""}${p.problemStatement ? `\nProblem Solved: ${p.problemStatement}` : ""}${features.length > 0 ? `\nKey Features: ${features.slice(0, 5).join(", ")}` : ""}`
    });
    includedLayers.push("product");
  }

  if (["copywriter", "social_media_manager", "marketing_analyst", "strategist", "general_assistant"].includes(input.employeeRole)) {
    if (icp) {
      const painPoints = icp.painPoints ?? [];
      const personaSummary = personas.length > 0 ? `\nPrimary Persona: ${personas[0]!.name} (${personas[0]!.role})` : "";
      sections.push({
        title: "AUDIENCE",
        content: `Target: ${icp.customerType ?? "Target Customers"}${painPoints.length > 0 ? `\nPain Points: ${painPoints.slice(0, 3).join("; ")}` : ""}${personaSummary}`
      });
      includedLayers.push("audience");
    }
  }

  if (brand) {
    if (brand.brandPositioning) {
      sections.push({
        title: "POSITIONING",
        content: brand.brandPositioning
      });
      includedLayers.push("positioning");
    }

    if (["copywriter", "social_media_manager"].includes(input.employeeRole)) {
      sections.push({
        title: "BRAND VOICE",
        content: `Positive Tone: ${brand.tonePositive.join(", ")}\nAvoid Tone: ${brand.toneAvoid.join(", ")}${brand.contentRules.length > 0 ? `\nRules: ${brand.contentRules.join("; ")}` : ""}`
      });
      includedLayers.push("brandVoice");
    }
  }

  if (["competitor_analyst", "strategist"].includes(input.employeeRole) && competitors.length > 0) {
    const compSummary = competitors
      .slice(0, 3)
      .map((c) => `- ${c.name}${c.currentPricing ? ` (${c.currentPricing})` : ""}: ${c.positioning ?? "Competitor"}`)
      .join("\n");
    sections.push({
      title: "COMPETITORS",
      content: compSummary
    });
    includedLayers.push("competitorIntelligence");
  }

  const activeGoal = input.goalObjective ?? (goals.length > 0 ? goals[0]!.objective : undefined);
  if (activeGoal) {
    sections.push({
      title: "CURRENT GOAL",
      content: activeGoal
    });
    includedLayers.push("goals");
  }

  if (strategies.length > 0 && ["strategist", "marketing_analyst", "copywriter"].includes(input.employeeRole)) {
    sections.push({
      title: "ACTIVE STRATEGY",
      content: `${strategies[0]!.title}: ${strategies[0]!.content}`
    });
    includedLayers.push("strategy");
  }

  if (memories.length > 0) {
    const learningItems = memories
      .slice(0, 3)
      .map((m) => `- ${m.statement}`)
      .join("\n");
    sections.push({
      title: "RELEVANT LEARNINGS",
      content: learningItems
    });
    includedLayers.push("learnings");
  }

  try {
    const semanticHits = await semanticMemory.search(input.task, {
      tenantId: input.tenantId,
      limit: 3,
      minSimilarity: 0.2
    });

    if (semanticHits.length > 0) {
      const recallText = semanticHits
        .map((h, i) => `[Source ${i + 1}: ${h.item.title} (Relevance: ${(h.similarity * 100).toFixed(0)}%)]\n${h.item.content}`)
        .join("\n\n");
      sections.push({
        title: "SEMANTIC RECALL & RETRIEVED MEMORY",
        content: recallText
      });
      includedLayers.push("semanticRecall");
    }
  } catch {
    // Semantic search graceful fallback
  }

  sections.push({
    title: "TASK",
    content: input.task
  });

  const blocks: ContextBlock[] = [];
  let totalTokenEstimate = 0;
  const promptParts: string[] = [];

  for (const sec of sections) {
    const sectionText = `### ${sec.title}\n${sec.content}`;
    const tokenCount = estimateTokenCount(sectionText);

    if (totalTokenEstimate + tokenCount <= effectiveBudget) {
      blocks.push({
        role: sec.title === "TASK" ? "user" : "context",
        content: sectionText,
        tokenEstimate: tokenCount
      });
      promptParts.push(sectionText);
      totalTokenEstimate += tokenCount;
    }
  }

  const budgetRemaining = Math.max(0, effectiveBudget - totalTokenEstimate);

  return {
    formattedPrompt: promptParts.join("\n\n"),
    employeeRole: input.employeeRole,
    task: input.task,
    blocks,
    totalTokenEstimate,
    budgetRemaining,
    includedLayers
  };
}
