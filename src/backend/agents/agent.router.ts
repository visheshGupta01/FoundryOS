import type { LLMClient } from "../models/llm.interface.js";
import { resolveLLMClient } from "../models/llm.resolver.js";

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
  isLightweight: boolean;
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
    employeeName: "Normal Agent (Lightweight)",
    avatar: "NA",
    pillar: "Operating System"
  }
};

const SPECIALIST_KEYWORDS = {
  competitor: [
    "competitor", "alternative", "pricing vs", "teardown", "vs ",
    "competing with", "rival moat", "pricing tier comparison"
  ],
  funnel: [
    "funnel", "tofu", "mofu", "bofu", "conversion offer",
    "customer journey", "launch campaign", "cac ltv", "retention loop"
  ],
  research: [
    "market trend", "market research", "tam", "sam som", "market demand",
    "customer pain point", "target segment", "industry shift", "market size"
  ],
  positioning: [
    "positioning statement", "value proposition", "brand pillar",
    "core narrative", "brand voice", "messaging pillar", "tagline formulation"
  ]
};

export function isSpecialistTask(task: string): boolean {
  const normalized = task.toLowerCase();
  return (
    SPECIALIST_KEYWORDS.competitor.some(k => normalized.includes(k)) ||
    SPECIALIST_KEYWORDS.funnel.some(k => normalized.includes(k)) ||
    SPECIALIST_KEYWORDS.research.some(k => normalized.includes(k)) ||
    SPECIALIST_KEYWORDS.positioning.some(k => normalized.includes(k))
  );
}

export async function routeTaskWithLlm(
  task: string,
  llm?: LLMClient
): Promise<RoutingDecision> {
  const normalized = task.toLowerCase();

  // 1. Fast-path: Greetings, General Q&A, and Non-Specialist Queries -> Normal Agent (Lightweight)
  if (!isSpecialistTask(task)) {
    return {
      employeeId: "foundryos-assistant",
      ...ROLE_METADATA["foundryos-assistant"],
      reason: "Bypassed LLM: Routed to Normal Lightweight Agent for fast execution",
      isSpecialist: false,
      isLightweight: true
    };
  }

  // 2. High-speed heuristic classification for specialist tasks
  if (SPECIALIST_KEYWORDS.competitor.some(k => normalized.includes(k))) {
    return {
      employeeId: "competitor-analyst",
      ...ROLE_METADATA["competitor-analyst"],
      reason: "Heuristic: Competitive intelligence & teardown analysis",
      isSpecialist: true,
      isLightweight: false
    };
  }

  if (SPECIALIST_KEYWORDS.funnel.some(k => normalized.includes(k))) {
    return {
      employeeId: "gtm-funnel-strategist",
      ...ROLE_METADATA["gtm-funnel-strategist"],
      reason: "Heuristic: GTM funnel & conversion architecture",
      isSpecialist: true,
      isLightweight: false
    };
  }

  if (SPECIALIST_KEYWORDS.research.some(k => normalized.includes(k))) {
    return {
      employeeId: "market-research-analyst",
      ...ROLE_METADATA["market-research-analyst"],
      reason: "Heuristic: Market research & demand trends",
      isSpecialist: true,
      isLightweight: false
    };
  }

  if (SPECIALIST_KEYWORDS.positioning.some(k => normalized.includes(k))) {
    return {
      employeeId: "chief-marketing-strategist",
      ...ROLE_METADATA["chief-marketing-strategist"],
      reason: "Heuristic: Brand positioning & narrative pillars",
      isSpecialist: true,
      isLightweight: false
    };
  }

  // 3. Fallback to LLM only if ambiguous specialist query
  const client = llm ?? resolveLLMClient();
  try {
    const isUp = await client.isAvailable();
    if (isUp) {
      const prompt = `Classify this startup founder query into exactly one role:
- market-research-analyst (trends, demand, TAM)
- competitor-analyst (competitors, comparison, teardowns)
- chief-marketing-strategist (positioning, messaging, brand)
- gtm-funnel-strategist (funnels, conversion, offers)
- foundryos-assistant (general, lightweight)

Founder Query: "${task.slice(0, 200)}"
Role:`;

      const response = await client.generate(prompt, {
        system: "Respond with only the role name.",
        temperature: 0.1,
        maxTokens: 25
      });

      const cleaned = response.trim().toLowerCase();
      if (cleaned.includes("market-research")) {
        return {
          employeeId: "market-research-analyst",
          ...ROLE_METADATA["market-research-analyst"],
          reason: `LLM classified as Market Research`,
          isSpecialist: true,
          isLightweight: false
        };
      }
      if (cleaned.includes("competitor")) {
        return {
          employeeId: "competitor-analyst",
          ...ROLE_METADATA["competitor-analyst"],
          reason: `LLM classified as Competitor Intelligence`,
          isSpecialist: true,
          isLightweight: false
        };
      }
      if (cleaned.includes("chief-marketing") || (cleaned.includes("strategist") && !cleaned.includes("funnel"))) {
        return {
          employeeId: "chief-marketing-strategist",
          ...ROLE_METADATA["chief-marketing-strategist"],
          reason: `LLM classified as Brand & Marketing Strategy`,
          isSpecialist: true,
          isLightweight: false
        };
      }
      if (cleaned.includes("gtm") || cleaned.includes("funnel")) {
        return {
          employeeId: "gtm-funnel-strategist",
          ...ROLE_METADATA["gtm-funnel-strategist"],
          reason: `LLM classified as GTM Funnel Strategy`,
          isSpecialist: true,
          isLightweight: false
        };
      }
    }
  } catch {
    // Graceful fallback to lightweight normal agent
  }

  return {
    employeeId: "foundryos-assistant",
    ...ROLE_METADATA["foundryos-assistant"],
    reason: "Optimized fallback: Normal Lightweight Agent",
    isSpecialist: false,
    isLightweight: true
  };
}
