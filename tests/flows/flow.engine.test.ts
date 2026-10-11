import { describe, it, expect, vi } from "vitest";
import { FlowEngine } from "../../src/backend/flows/flow.engine.js";
import { AgentRunner } from "../../src/backend/agents/agent.runner.js";
import type { FlowDefinition } from "../../src/backend/flows/flow.types.js";

describe("FlowEngine (Research & Strategy Sequential Orchestration)", () => {
  const tenantId = "tenant-flow-test";

  const sampleFlow: FlowDefinition = {
    id: "research-to-strategy-flow",
    name: "Research to Strategy Pipeline",
    description: "Executes market research, feeds findings to competitor analyst, and pauses for founder approval before strategy sign-off.",
    steps: [
      {
        stepId: "step-1-market-research",
        name: "Market Research Phase",
        employeeId: "market-research-analyst",
        taskTemplate: "Investigate market opportunities regarding: {{objective}}",
        requiresApproval: false
      },
      {
        stepId: "step-2-strategy-formulation",
        name: "Strategy Formulation Phase",
        employeeId: "chief-marketing-strategist",
        taskTemplate: "Formulate positioning and strategic pillars for: {{objective}}",
        requiresApproval: true
      }
    ]
  };

  it("should run flow step by step and pause at human approval checkpoint", async () => {
    const mockRunner = new AgentRunner();
    vi.spyOn(mockRunner, "run").mockImplementation(async (input) => {
      const employeeId = input.employeeId ?? "market-research-analyst";

      if (employeeId === "chief-marketing-strategist") {
        return {
          executionId: "exec-strat",
          tenantId: input.tenantId,
          employeeId,
          employeeName: "Chief Marketing Strategist",
          avatar: "CS",
          pillar: "strategy",
          task: input.task,
          status: "awaiting_approval",
          output: { positioning: "FoundryOS Positioning" },
          tokenReport: {
            tenantId: input.tenantId,
            employeeId,
            totalTokensUsed: 1200,
            maxTokenBudget: 4096,
            reservedCompletionBudget: 1024,
            availableHeadroom: 1872,
            budgetStatus: "optimal",
            layers: []
          },
          durationMs: 45
        };
      }

      return {
        executionId: "exec-research",
        tenantId: input.tenantId,
        employeeId,
        employeeName: "Market Research Analyst",
        avatar: "MR",
        pillar: "research",
        task: input.task,
        status: "completed",
        output: { trends: ["AI Memory Growth"] },
        tokenReport: {
          tenantId: input.tenantId,
          employeeId,
          totalTokensUsed: 950,
          maxTokenBudget: 4096,
          reservedCompletionBudget: 1024,
          availableHeadroom: 2122,
          budgetStatus: "optimal",
          layers: []
        },
        durationMs: 35
      };
    });

    const engine = new FlowEngine(mockRunner);
    const flowRun = await engine.startFlow(tenantId, sampleFlow, "FoundryOS B2B SaaS Launch");

    expect(flowRun.flowRunId).toBeDefined();
    expect(flowRun.steps[0]!.status).toBe("completed");
    expect(flowRun.steps[1]!.status).toBe("awaiting_approval");
    expect(flowRun.status).toBe("awaiting_approval");

    // Approve the paused step
    const approvedRun = await engine.approveStep(flowRun.flowRunId, "Founder / CEO");
    expect(approvedRun.status).toBe("completed");
    expect(approvedRun.steps[1]!.status).toBe("completed");
    expect(approvedRun.steps[1]!.approvedBy).toBe("Founder / CEO");
  });
});
