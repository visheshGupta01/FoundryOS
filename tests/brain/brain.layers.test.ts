import { describe, it, expect, vi } from "vitest";
import { BrainService } from "../../src/brain/brain.service.js";
import { BrainRepository } from "../../src/brain/brain.repository.js";
import { buildEmployeeContextPackage } from "../../src/brain/context.builder.js";
import type { DatabasePool } from "../../src/databases/postgres.client.js";

describe("FoundryOS Company Brain - 7 Layer Architecture", () => {
  const tenantId = "tenant-foundry-test";

  function createMockRepository() {
    let companyStore: any = null;
    let productsStore: any[] = [];
    let icpStore: any = null;
    let personasStore: any[] = [];
    let brandStore: any = null;
    let competitorsStore: any[] = [];
    let competitorHistoryStore: any[] = [];
    let goalsStore: any[] = [];
    let strategiesStore: any[] = [];
    let campaignsStore: any[] = [];
    let memoriesStore: any[] = [];

    const mockPool = {} as unknown as DatabasePool;
    const repo = new BrainRepository(mockPool);

    vi.spyOn(repo, "upsertCompanyProfile").mockImplementation(async (profile) => {
      companyStore = { ...profile };
    });
    vi.spyOn(repo, "getCompanyProfile").mockImplementation(async () => companyStore);

    vi.spyOn(repo, "upsertProduct").mockImplementation(async (product) => {
      productsStore.push({ ...product, id: `prod-${productsStore.length + 1}` });
    });
    vi.spyOn(repo, "getProducts").mockImplementation(async () => productsStore);

    vi.spyOn(repo, "upsertIcp").mockImplementation(async (icp) => {
      icpStore = { ...icp };
    });
    vi.spyOn(repo, "getIcp").mockImplementation(async () => icpStore);

    vi.spyOn(repo, "upsertPersona").mockImplementation(async (persona) => {
      personasStore.push({ ...persona, id: `pers-${personasStore.length + 1}` });
    });
    vi.spyOn(repo, "getPersonas").mockImplementation(async () => personasStore);

    vi.spyOn(repo, "upsertBrandProfile").mockImplementation(async (brand) => {
      brandStore = {
        ...brand,
        tonePositive: brand.tonePositive ?? ["professional", "confident", "clear", "human"],
        toneAvoid: brand.toneAvoid ?? ["overly corporate", "generic AI language", "excessive hype", "buzzwords"],
        contentRules: brand.contentRules ?? []
      };
    });
    vi.spyOn(repo, "getBrandProfile").mockImplementation(async () => brandStore);

    vi.spyOn(repo, "upsertCompetitor").mockImplementation(async (comp) => {
      const existingIdx = competitorsStore.findIndex((c) => c.name.toLowerCase() === comp.name.toLowerCase());
      if (existingIdx >= 0) {
        competitorsStore[existingIdx] = { ...competitorsStore[existingIdx], ...comp };
        return competitorsStore[existingIdx].id;
      }
      const newId = `comp-${competitorsStore.length + 1}`;
      competitorsStore.push({
        ...comp,
        id: newId,
        features: comp.features ?? [],
        strengths: comp.strengths ?? [],
        weaknesses: comp.weaknesses ?? [],
        marketingChannels: comp.marketingChannels ?? []
      });
      return newId;
    });
    vi.spyOn(repo, "getCompetitors").mockImplementation(async () => competitorsStore);

    vi.spyOn(repo, "recordCompetitorHistory").mockImplementation(async (entry) => {
      competitorHistoryStore.push({ ...entry, id: `hist-${competitorHistoryStore.length + 1}`, detectedAt: new Date() });
    });
    vi.spyOn(repo, "getCompetitorHistory").mockImplementation(async () => competitorHistoryStore);

    vi.spyOn(repo, "upsertGoal").mockImplementation(async (goal) => {
      const id = `goal-${goalsStore.length + 1}`;
      goalsStore.push({ ...goal, id, channels: goal.channels ?? [], priority: goal.priority ?? "medium", status: goal.status ?? "active" });
      return id;
    });
    vi.spyOn(repo, "getGoals").mockImplementation(async (_t, status) => {
      return status ? goalsStore.filter((g) => g.status === status) : goalsStore;
    });

    vi.spyOn(repo, "recordStrategyVersion").mockImplementation(async (strat) => {
      strategiesStore.forEach((s) => {
        if (s.strategyKey === strat.strategyKey) s.isCurrent = false;
      });
      strategiesStore.push({
        ...strat,
        id: `strat-${strategiesStore.length + 1}`,
        version: strat.version ?? 1,
        isCurrent: strat.isCurrent ?? true,
        status: strat.status ?? "active",
        createdAt: new Date()
      });
    });
    vi.spyOn(repo, "getStrategies").mockImplementation(async (_t, onlyCurrent) => {
      return onlyCurrent ? strategiesStore.filter((s) => s.isCurrent) : strategiesStore;
    });

    vi.spyOn(repo, "recordCampaignExecution").mockImplementation(async (camp) => {
      const id = `camp-${campaignsStore.length + 1}`;
      campaignsStore.push({ ...camp, id });
      return id;
    });
    vi.spyOn(repo, "getCampaigns").mockImplementation(async () => campaignsStore);

    vi.spyOn(repo, "saveMemory").mockImplementation(async (mem) => {
      const id = `mem-${memoriesStore.length + 1}`;
      memoriesStore.push({
        ...mem,
        id,
        confidenceLevel: mem.confidenceLevel ?? "MEDIUM",
        confidenceScore: mem.confidenceScore ?? 0.5,
        evidenceCount: mem.evidenceCount ?? 1,
        evidence: mem.evidence ?? [],
        status: mem.status ?? "unvalidated",
        sourcePriority: mem.sourcePriority ?? 5,
        isCurrent: mem.isCurrent ?? true,
        metadata: mem.metadata ?? {}
      });
      return id;
    });
    vi.spyOn(repo, "updateMemoryStatus").mockImplementation(async (_t, id, status, validatedBy, newType, newConfidence) => {
      const item = memoriesStore.find((m) => m.id === id);
      if (item) {
        item.status = status;
        if (validatedBy) item.validatedBy = validatedBy;
        if (newType) item.memoryType = newType;
        if (newConfidence) item.confidenceLevel = newConfidence;
        if (newConfidence === "HIGH") item.confidenceScore = 0.95;
      }
    });
    vi.spyOn(repo, "queryMemories").mockImplementation(async (_t, options) => {
      let filtered = [...memoriesStore];
      if (options?.memoryType) filtered = filtered.filter((m) => m.memoryType === options.memoryType);
      if (options?.status) filtered = filtered.filter((m) => m.status === options.status);
      if (options?.minConfidence !== undefined) filtered = filtered.filter((m) => m.confidenceScore >= options.minConfidence!);
      return filtered;
    });

    return {
      repo,
      stores: {
        companyStore,
        productsStore,
        icpStore,
        personasStore,
        brandStore,
        competitorsStore,
        competitorHistoryStore,
        goalsStore,
        strategiesStore,
        campaignsStore,
        memoriesStore
      }
    };
  }

  it("Layer 1: should store and retrieve company profile and product details", async () => {
    const { repo } = createMockRepository();

    await repo.upsertCompanyProfile({
      tenantId,
      companyName: "FoundryOS Inc.",
      industry: "B2B SaaS / Enterprise AI",
      businessModel: "Subscription",
      businessStage: "Growth",
      description: "Autonomous AI employees powered by continuous institutional memory.",
      foundedYear: 2026,
      targetGeography: "Global"
    });

    const company = await repo.getCompanyProfile(tenantId);
    expect(company?.companyName).toBe("FoundryOS Inc.");
    expect(company?.industry).toBe("B2B SaaS / Enterprise AI");

    await repo.upsertProduct({
      tenantId,
      productName: "FoundryOS Platform",
      category: "Marketing Operating System",
      problemStatement: "Companies repeatedly explain context to AI tools without memory.",
      solutionStatement: "Persistent 7-layer Company Brain linking context to specialized AI employees.",
      features: ["Company Brain", "TrueForge Harness", "Context Engine"],
      limitations: ["Requires initial onboarding data"]
    });

    const products = await repo.getProducts(tenantId);
    expect(products).toHaveLength(1);
    expect(products[0]?.productName).toBe("FoundryOS Platform");
    expect(products[0]?.features).toContain("Company Brain");
  });

  it("Layer 2: should store structured ICP and multiple distinct personas", async () => {
    const { repo } = createMockRepository();

    await repo.upsertIcp({
      tenantId,
      customerType: "Early-stage B2B SaaS Founders",
      companySize: "5-50 employees",
      industry: "Software",
      jobRoles: ["Founder", "CEO", "Head of Growth"],
      painPoints: ["Cannot afford large marketing team", "Disjointed AI tools hallucinate"],
      decisionCriteria: ["Rapid setup", "Verifiable memory", "Autonomous turnaround"]
    });

    const icp = await repo.getIcp(tenantId);
    expect(icp?.customerType).toBe("Early-stage B2B SaaS Founders");
    expect(icp?.painPoints).toHaveLength(2);

    await repo.upsertPersona({
      tenantId,
      name: "Startup Founder",
      role: "CEO / Founder",
      painPoints: ["Overwhelmed by marketing tasks"],
      goals: ["Scale organic reach"],
      objections: ["Concerned about generic AI output"]
    });

    await repo.upsertPersona({
      tenantId,
      name: "Head of Marketing",
      role: "Growth Lead",
      painPoints: ["Too many fragmented tools"],
      goals: ["Maintain consistent brand voice"],
      objections: ["Integration friction"]
    });

    const personas = await repo.getPersonas(tenantId);
    expect(personas).toHaveLength(2);
    expect(personas[0]?.name).toBe("Startup Founder");
    expect(personas[1]?.name).toBe("Head of Marketing");
  });

  it("Layer 3: should store Brand identity, tone rules, and content constraints", async () => {
    const { repo } = createMockRepository();

    await repo.upsertBrandProfile({
      tenantId,
      brandName: "FoundryOS",
      brandPositioning: "Company-aware AI marketing operating system",
      mission: "Empower companies with autonomous digital institutional memory.",
      tonePositive: ["professional", "confident", "clear", "human"],
      toneAvoid: ["overly corporate", "generic AI language", "excessive hype", "buzzwords"],
      coreMessage: "FoundryOS learns what works so your marketing gets smarter every day.",
      contentRules: ["Use short sentences", "Do not say 'revolutionary'", "Focus on founder outcomes"]
    });

    const brand = await repo.getBrandProfile(tenantId);
    expect(brand?.brandName).toBe("FoundryOS");
    expect(brand?.toneAvoid).toContain("excessive hype");
    expect(brand?.contentRules).toContain("Use short sentences");
  });

  it("Layer 4: should track competitor pricing changes across time without overwriting history", async () => {
    const { repo } = createMockRepository();
    const service = new BrainService(repo);

    await repo.upsertCompetitor({
      tenantId,
      name: "Competitor X",
      website: "https://competitorx.ai",
      currentPricing: "₹999/mo",
      positioning: "Basic AI copywriter"
    });

    await service.recordCompetitorObservation({
      tenantId,
      competitorName: "Competitor X",
      attributeName: "pricing",
      newValue: "₹1,299/mo",
      sourceNotes: "Pricing page audit"
    });

    await service.recordCompetitorObservation({
      tenantId,
      competitorName: "Competitor X",
      attributeName: "pricing",
      newValue: "₹1,499/mo",
      sourceNotes: "Quarterly review"
    });

    const competitors = await repo.getCompetitors(tenantId);
    expect(competitors[0]?.currentPricing).toBe("₹1,499/mo");

    const history = await repo.getCompetitorHistory(tenantId, competitors[0]!.id!);
    expect(history).toHaveLength(2);
    expect(history[0]?.oldValue).toBe("₹999/mo");
    expect(history[0]?.newValue).toBe("₹1,299/mo");
    expect(history[1]?.oldValue).toBe("₹1,299/mo");
    expect(history[1]?.newValue).toBe("₹1,499/mo");
  });

  it("Layer 5: should version strategies (V1 -> V2) while maintaining history", async () => {
    const { repo } = createMockRepository();

    await repo.recordStrategyVersion({
      tenantId,
      strategyKey: "positioning_strategy",
      version: 1,
      title: "Tool Positioning",
      content: "Position as an AI marketing tool.",
      decisionMaker: "Founder",
      isCurrent: true
    });

    await repo.recordStrategyVersion({
      tenantId,
      strategyKey: "positioning_strategy",
      version: 2,
      title: "Team Positioning",
      content: "Position as an AI marketing team.",
      rationale: "Customers demand end-to-end delegation rather than individual tools.",
      decisionMaker: "Founder",
      isCurrent: true
    });

    const activeStrategies = await repo.getStrategies(tenantId, true);
    expect(activeStrategies).toHaveLength(1);
    expect(activeStrategies[0]?.version).toBe(2);
    expect(activeStrategies[0]?.title).toBe("Team Positioning");

    const allStrategies = await repo.getStrategies(tenantId, false);
    expect(allStrategies).toHaveLength(2);
  });

  it("Layer 7: should execute Brain Write Pipeline (hypothesis -> validation -> learning)", async () => {
    const { repo } = createMockRepository();
    const service = new BrainService(repo);

    const memoryId = await service.proposeMemory({
      tenantId,
      memoryType: "hypothesis",
      statement: "Founder-led messaging outperforms feature-led messaging.",
      evidence: ["Campaign #101: 2.4x CTR compared to feature list ads"],
      confidenceLevel: "MEDIUM",
      proposedByEmployee: "marketing_analyst"
    });

    expect(memoryId).toBeDefined();

    const unvalidated = await repo.queryMemories(tenantId, { status: "unvalidated" });
    expect(unvalidated).toHaveLength(1);
    expect(unvalidated[0]?.memoryType).toBe("hypothesis");
    expect(unvalidated[0]?.status).toBe("unvalidated");

    await service.validateMemory({
      tenantId,
      memoryId,
      reviewer: "Chief Marketing Strategist",
      targetType: "learning",
      confidenceLevel: "HIGH",
      reason: "Confirmed across 3 independent campaign splits."
    });

    const validated = await repo.queryMemories(tenantId, { status: "validated" });
    expect(validated).toHaveLength(1);
    expect(validated[0]?.memoryType).toBe("learning");
    expect(validated[0]?.confidenceLevel).toBe("HIGH");
    expect(validated[0]?.confidenceScore).toBeGreaterThanOrEqual(0.9);
  });

  it("Context Engine: should assemble employee-specific context package tailored to role", async () => {
    const { repo } = createMockRepository();

    await repo.upsertCompanyProfile({
      tenantId,
      companyName: "FoundryOS",
      industry: "AI SaaS"
    });

    await repo.upsertProduct({
      tenantId,
      productName: "FoundryOS Marketing System",
      problemStatement: "AI tools lack institutional memory."
    });

    await repo.upsertIcp({
      tenantId,
      customerType: "Early-stage SaaS founders",
      painPoints: ["Limited marketing bandwidth"]
    });

    await repo.upsertBrandProfile({
      tenantId,
      brandName: "FoundryOS",
      brandPositioning: "Company-aware AI marketing team",
      tonePositive: ["professional", "clear", "confident"],
      toneAvoid: ["buzzwords", "excessive hype"]
    });

    await repo.upsertGoal({
      tenantId,
      objective: "Acquire 100 qualified founder signups",
      successMetric: "Signups"
    });

    await repo.saveMemory({
      tenantId,
      memoryType: "learning",
      statement: "Founder pain-point messaging outperforms generic feature ads.",
      confidenceLevel: "HIGH",
      confidenceScore: 0.95,
      status: "validated"
    });

    const copywriterContext = await buildEmployeeContextPackage(
      {
        tenantId,
        employeeRole: "copywriter",
        task: "Draft a high-converting LinkedIn post targeting SaaS founders."
      },
      repo
    );

    expect(copywriterContext.employeeRole).toBe("copywriter");
    expect(copywriterContext.includedLayers).toContain("companyIdentity");
    expect(copywriterContext.includedLayers).toContain("product");
    expect(copywriterContext.includedLayers).toContain("audience");
    expect(copywriterContext.includedLayers).toContain("brandVoice");
    expect(copywriterContext.includedLayers).toContain("goals");
    expect(copywriterContext.includedLayers).toContain("learnings");
    expect(copywriterContext.formattedPrompt).toContain("### BRAND VOICE");
    expect(copywriterContext.formattedPrompt).toContain("### CURRENT GOAL");
    expect(copywriterContext.formattedPrompt).toContain("### RELEVANT LEARNINGS");
    expect(copywriterContext.totalTokenEstimate).toBeGreaterThan(0);
    expect(copywriterContext.budgetRemaining).toBeGreaterThan(0);
  });

  it("Proactive Intelligence: should detect conflicts between brand tone rules and campaigns", async () => {
    const { repo } = createMockRepository();
    const service = new BrainService(repo);

    await repo.upsertBrandProfile({
      tenantId,
      brandName: "FoundryOS",
      tonePositive: ["professional", "confident"],
      toneAvoid: ["excessive hype", "buzzwords"]
    });

    await repo.recordCampaignExecution({
      tenantId,
      campaignName: "Viral Growth Hack Blast",
      channel: "Twitter",
      objective: "Drive massive virality with excessive hype buzzwords"
    });

    const conflicts = await service.detectConflicts(tenantId);
    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts[0]?.conflictType).toBe("BRAND_VOICE_MISMATCH");
    expect(conflicts[0]?.description).toContain("excessive hype");
  });

  it("Proactive Intelligence: should compute Brain Health score and highlight missing layers", async () => {
    const { repo } = createMockRepository();
    const service = new BrainService(repo);

    const initialHealth = await service.computeBrainHealth(tenantId);
    expect(initialHealth.overallScore).toBeLessThan(50);
    expect(initialHealth.staleAlerts).toContain("Company profile is incomplete (missing core industry or description).");
    expect(initialHealth.staleAlerts).toContain("No active goals found in Company Brain.");

    await repo.upsertCompanyProfile({
      tenantId,
      companyName: "FoundryOS",
      industry: "AI SaaS",
      description: "Company Brain platform",
      website: "https://foundryos.com"
    });

    await repo.upsertGoal({
      tenantId,
      objective: "Scale ARR",
      successMetric: "ARR",
      status: "active"
    });

    const updatedHealth = await service.computeBrainHealth(tenantId);
    expect(updatedHealth.layerScores["companyIdentity"]).toBe(100);
    expect(updatedHealth.layerScores["goals"]).toBe(100);
    expect(updatedHealth.overallScore).toBeGreaterThan(initialHealth.overallScore);
  });
});
