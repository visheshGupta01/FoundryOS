import { describe, it, expect } from "vitest";
import { employeeRegistry } from "../../src/backend/employees/employee.registry.js";
import {
  MarketResearchOutputSchema,
  CompetitorAnalysisOutputSchema,
  MarketingStrategyOutputSchema,
  GtmFunnelOutputSchema
} from "../../src/backend/employees/employee.catalog.js";

describe("Research & Strategy AI Employee Workforce", () => {
  it("should have specialized AI employees plus Assistant and Multi-Agent Team in registry", () => {
    const employees = employeeRegistry.listEmployees();
    expect(employees.length).toBe(6);
  });

  it("should filter employees by pillar correctly", () => {
    const researchEmployees = employeeRegistry.getEmployeesByPillar("research");
    const strategyEmployees = employeeRegistry.getEmployeesByPillar("strategy");

    expect(researchEmployees.length).toBe(2);
    expect(strategyEmployees.length).toBe(4);

    expect(researchEmployees.map((e) => e.identity.id)).toContain("market-research-analyst");
    expect(researchEmployees.map((e) => e.identity.id)).toContain("competitor-analyst");

    expect(strategyEmployees.map((e) => e.identity.id)).toContain("chief-marketing-strategist");
    expect(strategyEmployees.map((e) => e.identity.id)).toContain("gtm-funnel-strategist");
    expect(strategyEmployees.map((e) => e.identity.id)).toContain("foundryos-assistant");
  });

  it("should validate all 8 points of the Operating Contract for each employee", () => {
    const employees = employeeRegistry.listEmployees();

    for (const emp of employees) {
      expect(emp.identity.id).toBeDefined();
      expect(emp.identity.name).toBeDefined();
      expect(emp.identity.title).toBeDefined();
      expect(["research", "strategy"]).toContain(emp.identity.pillar);
      expect(emp.specialties.length).toBeGreaterThan(0);
      expect(emp.worksWith.length).toBeGreaterThan(0);
      expect(emp.systemPrompt.length).toBeGreaterThan(50);
      expect(emp.requiredLayers.length).toBeGreaterThan(0);
      expect(emp.tools.length).toBeGreaterThan(0);
      expect(typeof emp.approvalRules.requiresHumanApproval).toBe("boolean");
      expect(emp.memoryPolicy.defaultConfidence).toBeGreaterThanOrEqual(0.7);
      expect(emp.outputSchemaDescription.length).toBeGreaterThan(10);
    }
  });

  it("should validate structured output schema for MarketResearchOutput", () => {
    const sample = {
      summary: "High market potential in B2B SaaS marketing automation.",
      marketTrends: ["AI memory over stateless prompts", "Multi-agent coordination"],
      targetSegments: [
        { segmentName: "Seed Startups", opportunity: "Zero headcount marketing", urgency: "high" }
      ],
      macroRisks: ["Search algorithm volatility"],
      confidenceScore: 0.92
    };

    const parsed = MarketResearchOutputSchema.parse(sample);
    expect(parsed.confidenceScore).toBe(0.92);
    expect(parsed.targetSegments[0]!.urgency).toBe("high");
  });

  it("should validate structured output schema for CompetitorAnalysisOutput", () => {
    const sample = {
      summary: "Competitors rely on isolated chat windows.",
      competitorTeardowns: [
        {
          name: "PointTool Inc",
          advantages: ["Cheap"],
          vulnerabilities: ["No persistent brain"],
          pricingModel: "$29/mo"
        }
      ],
      featureGaps: ["Institutional memory", "Automated flow handoffs"],
      threatLevel: "moderate",
      counterTactics: ["Highlight Company Brain continuity"]
    };

    const parsed = CompetitorAnalysisOutputSchema.parse(sample);
    expect(parsed.threatLevel).toBe("moderate");
    expect(parsed.competitorTeardowns.length).toBe(1);
  });

  it("should validate structured output schema for MarketingStrategyOutput", () => {
    const sample = {
      positioningStatement: "FoundryOS is the AI Marketing Operating System.",
      valueProposition: "Hire Nobody. Launch Everything.",
      strategicPillars: ["Context First", "Controlled Orchestration"],
      goalAlignment: [
        { goal: "User Growth", initiative: "SEO displacement", targetMetric: "10k MRR" }
      ],
      channelPriorities: ["LinkedIn", "Developer Forums"],
      brandToneChecks: ["Confident", "Human", "No buzzwords"]
    };

    const parsed = MarketingStrategyOutputSchema.parse(sample);
    expect(parsed.positioningStatement).toContain("FoundryOS");
    expect(parsed.strategicPillars.length).toBe(2);
  });

  it("should validate structured output schema for GtmFunnelOutput", () => {
    const sample = {
      campaignTheme: "The Autonomous Marketing Function",
      funnelStages: {
        tofu: { focus: "Problem Awareness", tactics: ["Industry Report"] },
        mofu: { focus: "Evaluation", tactics: ["Interactive Brain Health Demo"] },
        bofu: { focus: "Conversion", tactics: ["Free 14-day trial"] }
      },
      offerArchitecture: {
        coreOffer: "Complete AI Marketing Team",
        incentive: "Instant Competitor Audit",
        riskReversal: "Guaranteed Satisfaction"
      },
      kpis: ["Demo conversion > 30%"]
    };

    const parsed = GtmFunnelOutputSchema.parse(sample);
    expect(parsed.funnelStages.tofu.focus).toBe("Problem Awareness");
  });
});
