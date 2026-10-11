import { describe, it, expect, beforeEach } from "vitest";
import { AgentRunner } from "../../src/backend/agents/agent.runner.js";
import { creditService } from "../../src/backend/credits/credit.service.js";

describe("AgentRunner Multi-Upload & Agent Selection", () => {
  let runner: AgentRunner;
  const tenantId = "test-multi-tenant";

  beforeEach(() => {
    runner = new AgentRunner();
    creditService.resetCredits(tenantId);
  });

  it("should process multi-file uploads (up to 5 documents)", async () => {
    const docs = [
      { fileName: "deck.txt", content: "FoundryOS Pitch Deck summary" },
      { fileName: "interviews.txt", content: "Customer interview notes from 10 founders" },
      { fileName: "competitors.txt", content: "Features of Competitor A and Competitor B" }
    ];

    const result = await runner.run({
      tenantId,
      employeeId: "market-research-analyst",
      task: "Synthesize customer pain points from attached documents",
      attachedDocuments: docs
    });

    expect(result.status).toBe("completed");
    expect(result.employeeId).toBe("market-research-analyst");
    expect(result.creditUsage).toBeDefined();
    expect(result.creditUsage?.creditsDeducted).toBeGreaterThan(0);
    expect(result.creditUsage?.creditsRemaining).toBeLessThan(100);
  }, 15000);

  it("should execute specific chosen employee directly without auto routing", async () => {
    const result = await runner.run({
      tenantId,
      employeeId: "competitor-analyst",
      task: "Perform quick competitor audit"
    });

    expect(result.employeeId).toBe("competitor-analyst");
    expect(result.routedBy).toBe("manual_selection");
  });

  it("should enforce maximum of 5 uploaded files", async () => {
    const excessiveDocs = [
      { fileName: "1.txt", content: "1" },
      { fileName: "2.txt", content: "2" },
      { fileName: "3.txt", content: "3" },
      { fileName: "4.txt", content: "4" },
      { fileName: "5.txt", content: "5" },
      { fileName: "6.txt", content: "6" }
    ];

    await expect(
      runner.run({
        tenantId,
        task: "Too many files",
        attachedDocuments: excessiveDocs
      })
    ).rejects.toThrow();
  });
});
