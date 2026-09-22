import { OllamaClient, ollamaClient } from "../models/ollama.client.js";

export type RouteTargetRole =
  | "market-research-analyst"
  | "competitor-analyst"
  | "chief-marketing-strategist"
  | "gtm-funnel-strategist"
  | "foundryos-assistant";

export interface RoutingDecision {
  employeeId: RouteTargetRole;
  employeeName: string;
  avatar: string;
  pillar: string;
  reason: string;
  isSpecialist: boolean;
}

const ROLE_METADATA: Record<RouteTargetRole, { employeeName: string; avatar: string; pillar: string }> = {
  "market-research-analyst": {
    employeeName: "Market Research Analyst",
    avatar: "MR",
    pillar: "Research"
  },
  "competitor-analyst": {
    employeeName: "Competitor Intelligence Analyst",
    avatar: "CI",
    pillar: "Research"
  },
  "chief-marketing-strategist": {
    employeeName: "Chief Marketing Strategist",
    avatar: "CS",
    pillar: "Strategy"
  },
  "gtm-funnel-strategist": {
    employeeName: "GTM & Funnel Strategist",
    avatar: "FS",
    pillar: "Strategy"
  },
  "foundryos-assistant": {
    employeeName: "FoundryOS Assistant",
    avatar: "FOS",
    pillar: "Operating System"
  }
};

export async function routeTaskWithLlm(
  task: string,
  ollama: OllamaClient = ollamaClient
): Promise<RoutingDecision> {
  const normalized = task.toLowerCase();

  // 1. Fast heuristic classification
  if (
    normalized.includes("competitor") ||
    normalized.includes("alternative") ||
    normalized.includes("pricing vs") ||
    normalized.includes("teardown") ||
    normalized.includes("vs ") ||
    normalized.includes("competing with")
  ) {
    return {
      employeeId: "competitor-analyst",
      ...ROLE_METADATA["competitor-analyst"],
      reason: "Competitive intelligence and teardown request detected",
      isSpecialist: true
    };
  }

  if (
    normalized.includes("funnel") ||
    normalized.includes("tofu") ||
    normalized.includes("mofu") ||
    normalized.includes("bofu") ||
    normalized.includes("offer") ||
    normalized.includes("conversion offer") ||
    normalized.includes("customer journey") ||
    normalized.includes("launch campaign")
  ) {
    return {
      employeeId: "gtm-funnel-strategist",
      ...ROLE_METADATA["gtm-funnel-strategist"],
      reason: "Go-to-market funnel and offer architecture detected",
      isSpecialist: true
    };
  }

  if (
    normalized.includes("market trend") ||
    normalized.includes("market research") ||
    normalized.includes("tam") ||
    normalized.includes("market demand") ||
    normalized.includes("customer pain point") ||
    normalized.includes("target segment") ||
    normalized.includes("industry shift")
  ) {
    return {
      employeeId: "market-research-analyst",
      ...ROLE_METADATA["market-research-analyst"],
      reason: "Market intelligence and demand audit detected",
      isSpecialist: true
    };
  }

  if (
    normalized.includes("positioning") ||
    normalized.includes("value proposition") ||
    normalized.includes("brand pillar") ||
    normalized.includes("core narrative") ||
    normalized.includes("brand voice") ||
    normalized.includes("messaging pillar")
  ) {
    return {
      employeeId: "chief-marketing-strategist",
      ...ROLE_METADATA["chief-marketing-strategist"],
      reason: "Brand positioning and strategic narrative detected",
      isSpecialist: true
    };
  }

  // 2. Intelligent LLM classification for ambiguous queries
  try {
    const isUp = await ollama.isAvailable();
    if (isUp) {
      const prompt = `Classify this startup founder query into exactly one role name:
- market-research-analyst (trends, demand, TAM, pain points)
- competitor-analyst (competitors, comparison, teardowns, differentiation)
- chief-marketing-strategist (positioning, messaging, brand pillars)
- gtm-funnel-strategist (funnels, conversion, offers, launch steps)
- foundryos-assistant (general advice, greetings, overview, broad marketing questions)

Founder Query: "${task.slice(0, 240)}"
Classification:`;

      const response = await ollama.generate(prompt, {
        system: "You are an AI router. Respond with ONLY the role name."
      });

      const cleaned = response.trim().toLowerCase();
      if (cleaned.includes("market-research")) {
        return {
          employeeId: "market-research-analyst",
          ...ROLE_METADATA["market-research-analyst"],
          reason: "LLM classified as Market Research",
          isSpecialist: true
        };
      }
      if (cleaned.includes("competitor")) {
        return {
          employeeId: "competitor-analyst",
          ...ROLE_METADATA["competitor-analyst"],
          reason: "LLM classified as Competitor Intelligence",
          isSpecialist: true
        };
      }
      if (cleaned.includes("chief-marketing") || (cleaned.includes("strategist") && !cleaned.includes("funnel"))) {
        return {
          employeeId: "chief-marketing-strategist",
          ...ROLE_METADATA["chief-marketing-strategist"],
          reason: "LLM classified as Brand & Marketing Strategy",
          isSpecialist: true
        };
      }
      if (cleaned.includes("gtm") || cleaned.includes("funnel")) {
        return {
          employeeId: "gtm-funnel-strategist",
          ...ROLE_METADATA["gtm-funnel-strategist"],
          reason: "LLM classified as GTM Funnel Strategy",
          isSpecialist: true
        };
      }
    }
  } catch {
    // Fall back to general assistant
  }

  return {
    employeeId: "foundryos-assistant",
    ...ROLE_METADATA["foundryos-assistant"],
    reason: "General startup marketing consultation",
    isSpecialist: false
  };
}
