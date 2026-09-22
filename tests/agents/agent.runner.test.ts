import { describe, it, expect, vi } from "vitest";
import { AgentRunner } from "../../src/backend/agents/agent.runner.js";
import { OllamaClient } from "../../src/backend/models/ollama.client.js";
import { TrueForgeService } from "../../src/trueforge/trueforge.service.js";
import { BrainService } from "../../src/brain/brain.service.js";
import { BrainRepository } from "../../src/brain/brain.repository.js";
import type { DatabasePool } from "../../src/databases/postgres.client.js";

describe("AgentRunner (Research & Strategy AI Execution)", () => {
  const tenantId = "tenant-runner-test";

  function createMockDependencies() {
    const mockOllama = new OllamaClient();
    const mockTrueForge = new TrueForgeService({} as any);
    const mockPool = {} as unknown as DatabasePool;
    const mockRepo = new BrainRepository(mockPool);
    const mockBrain = new BrainService(mockRepo);

    vi.spyOn(mockOllama, "isAvailable").mockResolvedValue(false);
    vi.spyOn(mockBrain, "proposeMemory").mockResolvedValue("mem-proposed-123");

    vi.spyOn(mockRepo, "getCompanyProfile").mockResolvedValue({
      tenantId,
      companyName: "FoundryOS",
      industry: "Marketing Tech",
      description: "AI Marketing Operating System for Startups"
    });
    vi.spyOn(mockRepo, "getProducts").mockResolvedValue([
      {
        id: "prod-1",
        tenantId,
        productName: "Foundry Platform",
        category: "SaaS",
        problemStatement: "Startups lack dedicated marketing teams.",
        features: ["7-layer brain", "Multi-agent flows", "Competitor tracker"],
        benefits: ["Eliminates need for a marketing team", "Persistent brand context"],
        useCases: ["Startup GTM launch", "Founder-led content marketing"],
        pricingDetails: {},
        uniqueFeatures: ["7-layer persistent memory", "Multi-agent orchestration"],
        limitations: []
      }
    ]);
    vi.spyOn(mockRepo, "getIcp").mockResolvedValue({
      tenantId,
      customerType: "Early-stage Founders",
      painPoints: ["Tool fatigue", "Context loss", "Inconsistent branding"],
      jobRoles: ["Technical Founder", "Solo CEO"],
      needs: ["Automated marketing", "Consistent brand voice"],
      goals: ["500 beta users", "40% weekly retention"],
      objections: ["Too early for AI marketing", "Already using generic tools"],
      buyingTriggers: ["Hiring freeze", "Failed agency engagement"],
      decisionCriteria: ["Ease of setup", "Context persistence", "Pricing"]
    });
    vi.spyOn(mockRepo, "getPersonas").mockResolvedValue([
      { id: "pers-1", tenantId, name: "Vikram", role: "Solo Technical Founder", painPoints: [], goals: [], objections: [] }
    ]);
    vi.spyOn(mockRepo, "getBrandProfile").mockResolvedValue({
      tenantId,
      brandName: "FoundryOS",
      brandPositioning: "Persistent context over generic prompting.",
      values: [],
      personality: [],
      differentiators: [],
      tonePositive: ["clear", "confident", "human"],
      toneAvoid: ["buzzwords", "overhype"],
      secondaryMessages: [],
      taglines: [],
      keyBenefits: [],
      proofPoints: [],
      objectionHandling: {},
      claims: [],
      contentRules: []
    });
    vi.spyOn(mockRepo, "getCompetitors").mockResolvedValue([
      {
        id: "comp-a",
        tenantId,
        name: "LegacyTool",
        strengths: ["Brand awareness"],
        features: ["Stateless chat"],
        weaknesses: ["No persistent memory"],
        marketingChannels: ["Ads"]
      }
    ]);
    vi.spyOn(mockRepo, "getGoals").mockResolvedValue([
      {
        id: "goal-1",
        tenantId,
        objective: "Achieve 500 active beta users",
        successMetric: "Weekly retention > 40%",
        priority: "high",
        status: "active",
        channels: ["Outbound"]
      }
    ]);
    vi.spyOn(mockRepo, "getStrategies").mockResolvedValue([
      {
        id: "strat-1",
        tenantId,
        strategyKey: "gtm-v1",
        title: "Targeted founder displacement",
        version: 1,
        content: "Highlight persistent context vs single turn chat",
        status: "active",
        isCurrent: true
      }
    ]);
    vi.spyOn(mockRepo, "queryMemories").mockResolvedValue([
      {
        id: "mem-1",
        tenantId,
        memoryType: "learning",
        statement: "Founders prefer structured reports over generic chat prose.",
        confidenceScore: 0.9,
        confidenceLevel: "HIGH",
        evidenceCount: 1,
        evidence: [],
        sourcePriority: 5,
        status: "validated",
        isCurrent: true,
        metadata: {}
      }
    ]);

    return { mockOllama, mockTrueForge, mockBrain, mockRepo };
  }

  it("should execute Market Research Analyst and return structured market trends", async () => {
    const { mockOllama, mockTrueForge, mockBrain, mockRepo } = createMockDependencies();
    const runner = new AgentRunner(mockOllama, mockTrueForge, mockBrain, mockRepo);

    const result = await runner.run({
      tenantId,
      employeeId: "market-research-analyst",
      task: "Analyze TAM and customer problem space for marketing OS."
    });

    expect(result.executionId).toBeDefined();
    expect(result.employeeId).toBe("market-research-analyst");
    expect(result.employeeName).toBe("Market Research Analyst");
    expect(result.pillar).toBe("research");
    expect(result.status).toBe("completed");
    expect(result.tokenReport).toBeDefined();
    expect(result.proposedMemoryId).toBe("mem-proposed-123");

    const output = result.output as any;
    expect(output.summary).toBeDefined();
    expect(Array.isArray(output.marketTrends)).toBe(true);
    expect(output.marketTrends.length).toBeGreaterThan(0);
    expect(output.targetSegments.length).toBeGreaterThan(0);
  });

  it("should execute Competitor Intelligence Analyst and return competitor teardowns", async () => {
    const { mockOllama, mockTrueForge, mockBrain, mockRepo } = createMockDependencies();
    const runner = new AgentRunner(mockOllama, mockTrueForge, mockBrain, mockRepo);

    const result = await runner.run({
      tenantId,
      employeeId: "competitor-analyst",
      task: "Audit point tools and pricing models."
    });

    expect(result.employeeId).toBe("competitor-analyst");
    const output = result.output as any;
    expect(output.competitorTeardowns.length).toBeGreaterThan(0);
    expect(output.threatLevel).toBeDefined();
    expect(output.counterTactics.length).toBeGreaterThan(0);
  });

  it("should execute Chief Marketing Strategist and require human approval gate", async () => {
    const { mockOllama, mockTrueForge, mockBrain, mockRepo } = createMockDependencies();
    const runner = new AgentRunner(mockOllama, mockTrueForge, mockBrain, mockRepo);

    const result = await runner.run({
      tenantId,
      employeeId: "chief-marketing-strategist",
      task: "Publish company positioning statement and commit strategic version."
    });

    expect(result.employeeId).toBe("chief-marketing-strategist");
    expect(result.status).toBe("awaiting_approval");

    const output = result.output as any;
    expect(output.positioningStatement).toBeDefined();
    expect(output.strategicPillars.length).toBeGreaterThan(0);
  });

  it("should dynamically route ambiguous tasks to foundryos-assistant when employeeId is omitted", async () => {
    const { mockOllama, mockTrueForge, mockBrain, mockRepo } = createMockDependencies();
    const runner = new AgentRunner(mockOllama, mockTrueForge, mockBrain, mockRepo);

    const result = await runner.run({
      tenantId,
      task: "What are some general tips for growing our startup presence?"
    });

    expect(result.employeeId).toBe("foundryos-assistant");
    expect(result.routedBy).toBeDefined();
    const output = result.output as any;
    expect(output.summary).toBeDefined();
    expect(output.advice).toBeDefined();
  });

  it("should dynamically route competitor tasks to competitor-analyst when employeeId is omitted", async () => {
    const { mockOllama, mockTrueForge, mockBrain, mockRepo } = createMockDependencies();
    const runner = new AgentRunner(mockOllama, mockTrueForge, mockBrain, mockRepo);

    const result = await runner.run({
      tenantId,
      task: "Run a competitor teardown on LegacyTool pricing."
    });

    expect(result.employeeId).toBe("competitor-analyst");
    expect(result.routedBy).toBe("llm_router");
  });

  it("should accept attached documents and inject them into execution context", async () => {
    const { mockOllama, mockTrueForge, mockBrain, mockRepo } = createMockDependencies();
    const runner = new AgentRunner(mockOllama, mockTrueForge, mockBrain, mockRepo);

    const result = await runner.run({
      tenantId,
      task: "Analyze this pitch deck and review our target segment.",
      attachedDocument: {
        fileName: "pitch_deck.txt",
        content: "Company: Acme Corp. Problem: 80% churn due to poor onboarding."
      }
    });

    expect(result.employeeId).toBe("market-research-analyst");
    expect(result.status).toBe("completed");
    expect(result.output).toBeDefined();
  });
});
