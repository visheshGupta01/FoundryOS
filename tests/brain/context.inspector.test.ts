import { describe, it, expect, vi } from "vitest";
import { ContextInspector } from "../../src/brain/context.inspector.js";
import { BrainRepository } from "../../src/brain/brain.repository.js";
import type { DatabasePool } from "../../src/databases/postgres.client.js";

describe("ContextInspector & Token Budget Debugger", () => {
  const tenantId = "tenant-test-inspector";

  function createMockRepo() {
    const mockPool = {} as unknown as DatabasePool;
    const repo = new BrainRepository(mockPool);

    vi.spyOn(repo, "getCompanyProfile").mockResolvedValue({
      tenantId,
      companyName: "FoundryOS",
      industry: "Marketing Tech",
      description: "AI Marketing Operating System for Startups"
    });

    vi.spyOn(repo, "getProducts").mockResolvedValue([
      {
        id: "prod-1",
        tenantId,
        productName: "Foundry Platform",
        category: "SaaS",
        problemStatement: "Startups lack dedicated marketing teams.",
        features: ["7-layer brain", "Multi-agent flows", "Competitor tracker"]
      }
    ]);

    vi.spyOn(repo, "getIcp").mockResolvedValue({
      tenantId,
      customerType: "Early-stage Founders",
      painPoints: ["Tool fatigue", "Context loss", "Inconsistent branding"]
    });

    vi.spyOn(repo, "getPersonas").mockResolvedValue([
      { id: "pers-1", tenantId, name: "Vikram", role: "Solo Technical Founder" }
    ]);

    vi.spyOn(repo, "getBrandProfile").mockResolvedValue({
      tenantId,
      brandPositioning: "Persistent context over generic prompting.",
      tonePositive: ["clear", "confident", "human"],
      toneAvoid: ["buzzwords", "overhype"]
    });

    vi.spyOn(repo, "getCompetitors").mockResolvedValue([
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

    vi.spyOn(repo, "getGoals").mockResolvedValue([
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

    vi.spyOn(repo, "getStrategies").mockResolvedValue([
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

    vi.spyOn(repo, "queryMemories").mockResolvedValue([
      {
        id: "mem-1",
        tenantId,
        memoryType: "learning",
        statement: "Founders prefer structured reports over generic chat prose.",
        confidenceScore: 0.9,
        confidenceLevel: "HIGH",
        status: "validated",
        isCurrent: true,
        metadata: {}
      }
    ]);

    return repo;
  }

  it("should inspect context and generate a complete layer-by-layer token breakdown", async () => {
    const mockRepo = createMockRepo();
    const inspector = new ContextInspector(mockRepo);

    const report = await inspector.inspectContext(
      tenantId,
      "chief-marketing-strategist",
      "Formulate Q4 positioning and value proposition",
      { maxTokenBudget: 4096, reservedCompletionBudget: 1024 }
    );

    expect(report.tenantId).toBe(tenantId);
    expect(report.employeeId).toBe("chief-marketing-strategist");
    expect(report.totalTokensUsed).toBeGreaterThan(100);
    expect(report.maxTokenBudget).toBe(4096);
    expect(report.reservedCompletionBudget).toBe(1024);
    expect(report.availableHeadroom).toBeGreaterThan(0);
    expect(report.budgetStatus).toBe("optimal");

    const layerKeys = report.layers.map((l) => l.layerKey);
    expect(layerKeys).toContain("system_prompt");
    expect(layerKeys).toContain("user_task");
    expect(layerKeys).toContain("company_identity");
    expect(layerKeys).toContain("product_scope");
    expect(layerKeys).toContain("audience_icp");
    expect(layerKeys).toContain("brand_voice");
    expect(layerKeys).toContain("competitor_intel");
    expect(layerKeys).toContain("goals_strategy");
    expect(layerKeys).toContain("institutional_memory");
  });

  it("should warn or flag exceeded status when context budget exceeds limits", async () => {
    const mockRepo = createMockRepo();
    const inspector = new ContextInspector(mockRepo);

    // Give a tiny maxTokenBudget of 200 tokens
    const report = await inspector.inspectContext(
      tenantId,
      "market-research-analyst",
      "Analyze market",
      { maxTokenBudget: 200, reservedCompletionBudget: 150 }
    );

    expect(report.budgetStatus).toBe("exceeded");
    expect(report.availableHeadroom).toBeLessThan(0);
  });
});
