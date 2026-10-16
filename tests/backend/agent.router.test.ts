import { describe, it, expect, vi } from "vitest";
import { routeTaskWithLlm, isSpecialistTask } from "../../src/backend/agents/agent.router.js";
import { OllamaClient } from "../../src/backend/models/ollama.client.js";

describe("Agent Router (Ultra-High-Precision Multi-Tier Intent Routing)", () => {
  it("routes competitor analysis queries to competitor-analyst", async () => {
    const decision = await routeTaskWithLlm("Can you teardown our competitor's pricing model?");
    expect(decision.employeeId).toBe("competitor-analyst");
    expect(decision.employeeName).toBe("Competitor Intelligence Analyst");
    expect(decision.isSpecialist).toBe(true);
  });

  it("routes market trends and TAM queries to market-research-analyst", async () => {
    const decision = await routeTaskWithLlm("What are the macro market trends and TAM expansion opportunities?");
    expect(decision.employeeId).toBe("market-research-analyst");
    expect(decision.employeeName).toBe("Market Research Analyst");
    expect(decision.isSpecialist).toBe(true);
  });

  it("routes positioning and brand voice queries to chief-marketing-strategist", async () => {
    const decision = await routeTaskWithLlm("Help us define our core company positioning statement and brand pillars");
    expect(decision.employeeId).toBe("chief-marketing-strategist");
    expect(decision.employeeName).toBe("Chief Marketing Strategist");
    expect(decision.isSpecialist).toBe(true);
  });

  it("routes funnel and customer journey queries to gtm-funnel-strategist", async () => {
    const decision = await routeTaskWithLlm("Design a high-converting 3-step go-to-market funnel and TOFU campaign");
    expect(decision.employeeId).toBe("gtm-funnel-strategist");
    expect(decision.employeeName).toBe("GTM & Funnel Strategist");
    expect(decision.isSpecialist).toBe(true);
  });

  it("routes general founder questions to foundryos-assistant with dedicated OS personality", async () => {
    const decision = await routeTaskWithLlm("Hey, how do I use FoundryOS to grow my business?");
    expect(decision.employeeId).toBe("foundryos-assistant");
    expect(decision.employeeName).toBe("FoundryOS Assistant");
    expect(decision.avatar).toBe("FOS");
    expect(decision.isSpecialist).toBe(false);
  });

  it("routes single-word and casual greetings directly to foundryos-assistant in 1ms", async () => {
    const greetings = ["hi", "hello", "hey", "good morning", "yo", "sup", "thanks", "thank you"];
    for (const g of greetings) {
      const decision = await routeTaskWithLlm(g);
      expect(decision.employeeId).toBe("foundryos-assistant");
      expect(decision.isLightweight).toBe(true);
      expect(decision.isSpecialist).toBe(false);
    }
  });

  it("routes 360 multi-agent teardown requests directly to multi-agent", async () => {
    const multiTasks = [
      "run a 360 review of our entire go-to-market strategy",
      "synthesize all specialists for an executive master plan",
      "multi-agent collaborative teardown"
    ];
    for (const task of multiTasks) {
      const decision = await routeTaskWithLlm(task);
      expect(decision.employeeId).toBe("multi-agent");
      expect(decision.isSpecialist).toBe(true);
    }
  });

  it("routes live company competitor name queries to competitor-analyst", async () => {
    const decision = await routeTaskWithLlm("How can we position ourselves against Zapier and traditional agencies?");
    expect(decision.employeeId).toBe("competitor-analyst");
    expect(decision.isSpecialist).toBe(true);
  });

  it("routes retention and CAC payback queries to gtm-funnel-strategist", async () => {
    const decision = await routeTaskWithLlm("How do we lower customer churn and optimize our CAC payback period?");
    expect(decision.employeeId).toBe("gtm-funnel-strategist");
    expect(decision.isSpecialist).toBe(true);
  });

  it("correctly identifies specialist vs conversational tasks via isSpecialistTask", () => {
    expect(isSpecialistTask("hi")).toBe(false);
    expect(isSpecialistTask("what is foundryos")).toBe(false);
    expect(isSpecialistTask("who are you")).toBe(false);
    expect(isSpecialistTask("build a competitive battlecard against our rivals")).toBe(true);
    expect(isSpecialistTask("calculate our TAM SAM SOM market sizing")).toBe(true);
    expect(isSpecialistTask("craft an April Dunford positioning statement")).toBe(true);
    expect(isSpecialistTask("optimize our checkout conversion funnel and offer architecture")).toBe(true);
  });

  it("uses LLM when prompt does not match obvious heuristics", async () => {
    const mockOllama = new OllamaClient();
    vi.spyOn(mockOllama, "isAvailable").mockResolvedValue(true);
    vi.spyOn(mockOllama, "generate").mockResolvedValue("competitor-analyst");

    const decision = await routeTaskWithLlm("Evaluate our adversaries in the space", mockOllama);
    expect(decision.employeeId).toBe("competitor-analyst");
    expect(decision.reason).toContain("classified");
  });
});
