import type { LLMClient } from "../models/llm.interface.js";
import { resolveLLMClient } from "../models/llm.resolver.js";
import { getActiveCompanyBrainState } from "../../brain/context.builder.js";

export type RouteTargetRole =
  | "market-research-analyst"
  | "competitor-analyst"
  | "chief-marketing-strategist"
  | "gtm-funnel-strategist"
  | "foundryos-assistant"
  | "multi-agent";

export interface RoutingDecision {
  employeeId: RouteTargetRole;
  employeeName: string;
  avatar: string;
  pillar: string;
  reason: string;
  isSpecialist: boolean;
  isLightweight: boolean;
}

export const ROLE_METADATA: Record<RouteTargetRole, { employeeName: string; avatar: string; pillar: string }> = {
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
  },
  "multi-agent": {
    employeeName: "Multi-Agent Specialist Team",
    avatar: "👥",
    pillar: "Executive Cross-Functional"
  }
};

interface DomainPatternSet {
  exactPhrases: string[];
  primaryTokens: string[];
  secondaryTokens: string[];
}

const DOMAIN_PATTERNS: Record<Exclude<RouteTargetRole, "foundryos-assistant" | "multi-agent">, DomainPatternSet> = {
  "competitor-analyst": {
    exactPhrases: [
      "position ourselves against",
      "position against",
      "competing against",
      "compete against",
      "competitor analysis",
      "competitor teardown",
      "competitive intelligence",
      "competitor battlecard",
      "competitor battlecards",
      "pricing teardown",
      "pricing comparison",
      "feature matrix",
      "alternative to",
      "alternatives to",
      "rival moat",
      "competing with",
      "beat our competitors",
      "competitor pricing",
      "battlecard",
      "battlecards",
      "competitive advantage",
      "competitive landscape",
      "threat analysis",
      "swot analysis"
    ],
    primaryTokens: [
      "competitor", "competitors", "rival", "rivals", "adversary", "adversaries",
      "alternative", "alternatives", "teardown", "teardowns", "battlecard", "battlecards",
      "moat", "moats", "counter-tactic", "counter-tactics", "vulnerability", "vulnerabilities"
    ],
    secondaryTokens: [
      "vs", "versus", "against", "differentiation", "displace", "displacement", "parity", "incumbent", "incumbents"
    ]
  },
  "gtm-funnel-strategist": {
    exactPhrases: [
      "conversion funnel",
      "acquisition funnel",
      "sales funnel",
      "gtm funnel",
      "tofu",
      "mofu",
      "bofu",
      "top of funnel",
      "middle of funnel",
      "bottom of funnel",
      "lead magnet",
      "cac ltv",
      "cac payback",
      "unit economics",
      "conversion rate",
      "onboarding sequence",
      "cold email sequence",
      "offer architecture",
      "risk reversal",
      "retention loop",
      "churn rate",
      "referral loop",
      "landing page conversion",
      "checkout conversion",
      "customer journey"
    ],
    primaryTokens: [
      "funnel", "funnels", "cac", "ltv", "payback", "tofu", "mofu", "bofu",
      "conversion", "conversions", "churn", "retention", "activation", "onboarding",
      "leadgen", "outbound", "offer", "offers", "upsell", "cross-sell"
    ],
    secondaryTokens: [
      "arpu", "mrr", "arr", "lead", "leads", "signup", "signups", "pipeline",
      "campaign", "checkout", "cta", "landing page", "cold email", "ad copy"
    ]
  },
  "market-research-analyst": {
    exactPhrases: [
      "tam sam som",
      "market research",
      "market sizing",
      "market size",
      "market trend",
      "market trends",
      "target segment",
      "target segments",
      "customer segment",
      "customer segments",
      "demand signal",
      "demand signals",
      "customer discovery",
      "user interview",
      "user interviews",
      "pain point validation",
      "macro trend",
      "macro trends",
      "search volume",
      "market demand",
      "industry shift",
      "industry shifts",
      "market dynamics",
      "category trend",
      "category trends",
      "market intelligence",
      "pitch deck"
    ],
    primaryTokens: [
      "tam", "sam", "som", "tailwinds", "headwinds", "macro", "demographics",
      "segmentation", "niche", "segment", "segments"
    ],
    secondaryTokens: [
      "interviews", "survey", "surveys", "trend", "trends", "shifts",
      "search volume", "customer discovery", "pain point", "pain points", "market share"
    ]
  },
  "chief-marketing-strategist": {
    exactPhrases: [
      "positioning statement",
      "value proposition",
      "value prop",
      "brand narrative",
      "brand voice",
      "tone of voice",
      "brand pillar",
      "brand pillars",
      "messaging hierarchy",
      "tagline formulation",
      "brand identity",
      "category design",
      "brand manifesto",
      "brand guidelines",
      "positioning canvas",
      "core narrative",
      "brand strategy",
      "brand positioning"
    ],
    primaryTokens: [
      "positioning", "tagline", "taglines", "manifesto", "category design",
      "slogan", "pillars"
    ],
    secondaryTokens: [
      "narrative", "messaging", "brand voice", "brand tone", "tone", "identity",
      "value prop", "mission statement", "brand thesis"
    ]
  }
};

function normalizeQuery(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchConversationalGuardrail(normalized: string): RoutingDecision | null {
  const directGreetings = new Set([
    "hi", "hello", "hey", "sup", "yo", "howdy", "hola",
    "test", "help", "start", "clear", "reset", "menu",
    "thanks", "thank you", "thx", "awesome", "great", "cool",
    "ok", "okay", "sure", "got it", "perfect", "bye", "goodbye", "see ya",
    "continue", "continue without it", "proceed", "proceed without it", "use benchmarks", "use defaults"
  ]);

  if (directGreetings.has(normalized)) {
    return {
      employeeId: "foundryos-assistant",
      ...ROLE_METADATA["foundryos-assistant"],
      reason: "High-precision conversational guardrail",
      isSpecialist: false,
      isLightweight: true
    };
  }

  const prefixGreetings = ["hi ", "hello ", "hey ", "good morning", "good afternoon", "good evening", "greetings"];
  if (prefixGreetings.some(prefix => normalized.startsWith(prefix))) {
    const remainder = normalized.replace(/^(hi|hello|hey|good morning|good afternoon|good evening|greetings)\s*/, "").trim();
    if (remainder.length === 0 || remainder === "there" || remainder === "team" || remainder === "foundryos") {
      return {
        employeeId: "foundryos-assistant",
        ...ROLE_METADATA["foundryos-assistant"],
        reason: "High-precision greeting guardrail",
        isSpecialist: false,
        isLightweight: true
      };
    }
  }

  const systemQueries = [
    "who are you",
    "what is foundryos",
    "what can you do",
    "how do i use foundryos",
    "how to use foundryos",
    "how does foundryos work",
    "what are your capabilities",
    "list capabilities",
    "list agents",
    "list specialists",
    "what agents do you have",
    "who are my competitors",
    "list competitors",
    "what is our positioning",
    "what do we do",
    "what is our one-liner",
    "who is our target audience",
    "what is company brain",
    "credit balance",
    "token balance",
    "daily limit",
    "how many credits"
  ];

  if (systemQueries.some(sq => normalized.includes(sq))) {
    return {
      employeeId: "foundryos-assistant",
      ...ROLE_METADATA["foundryos-assistant"],
      reason: "High-precision system & intelligence navigation guardrail",
      isSpecialist: false,
      isLightweight: true
    };
  }

  return null;
}

function matchMultiAgentTrigger(normalized: string): RoutingDecision | null {
  const multiAgentTriggers = [
    "multi-agent",
    "multi agent",
    "360",
    "360 review",
    "360 teardown",
    "collaborative teardown",
    "all specialists",
    "all agents",
    "team review",
    "full team",
    "cross-functional",
    "team teardown",
    "executive master plan",
    "synthesize all specialists"
  ];

  if (multiAgentTriggers.some(trigger => normalized.includes(trigger))) {
    return {
      employeeId: "multi-agent",
      ...ROLE_METADATA["multi-agent"],
      reason: "High-precision multi-agent 360 teardown trigger",
      isSpecialist: true,
      isLightweight: false
    };
  }

  return null;
}

interface DomainScoreResult {
  role: Exclude<RouteTargetRole, "foundryos-assistant" | "multi-agent">;
  score: number;
}

function computeDomainScores(normalized: string): DomainScoreResult[] {
  const results: DomainScoreResult[] = [];
  const activeCompany = getActiveCompanyBrainState();
  const trackedCompetitors = activeCompany.competitors
    ? activeCompany.competitors.split(",").map(c => c.trim().toLowerCase()).filter(Boolean)
    : [];

  const roles = Object.keys(DOMAIN_PATTERNS) as Array<Exclude<RouteTargetRole, "foundryos-assistant" | "multi-agent">>;

  for (const role of roles) {
    let score = 0;
    const patterns = DOMAIN_PATTERNS[role];

    for (const phrase of patterns.exactPhrases) {
      if (normalized.includes(phrase)) {
        score += 8;
      }
    }

    for (const token of patterns.primaryTokens) {
      const regex = new RegExp(`\\b${token}\\b`, "i");
      if (regex.test(normalized)) {
        score += 4;
      }
    }

    for (const token of patterns.secondaryTokens) {
      const regex = new RegExp(`\\b${token}\\b`, "i");
      if (regex.test(normalized)) {
        score += 2;
      }
    }

    if (role === "competitor-analyst") {
      for (const comp of trackedCompetitors) {
        if (comp.length > 2 && normalized.includes(comp)) {
          score += 6;
        }
      }
    }

    results.push({ role, score });
  }

  return results.sort((a, b) => b.score - a.score);
}

export function isSpecialistTask(task: string): boolean {
  const normalized = normalizeQuery(task);
  if (matchConversationalGuardrail(normalized)) return false;
  if (matchMultiAgentTrigger(normalized)) return true;

  const scores = computeDomainScores(normalized);
  return Boolean(scores[0] && scores[0].score >= 4);
}

async function disambiguateWithLlm(task: string, client: LLMClient): Promise<RoutingDecision> {
  const isUp = await client.isAvailable();
  if (!isUp) {
    return {
      employeeId: "foundryos-assistant",
      ...ROLE_METADATA["foundryos-assistant"],
      reason: "Safe default: FoundryOS Executive Assistant (LLM offline)",
      isSpecialist: false,
      isLightweight: true
    };
  }

  const prompt = `You are the master supervisor routing tasks in FoundryOS.
Determine whether the user's message is a conversational chat/question OR actual project work requiring a specialized AI employee:

ROLES:
- foundryos-assistant: Choose this for all short conversations, general chats, greetings, advice, explanations, questions, or informal discussions.
- competitor-analyst: Choose this ONLY when real competitor teardown, battlecard, or pricing vulnerability analysis work is requested.
- gtm-funnel-strategist: Choose this ONLY when real conversion funnel design, CAC/LTV modeling, or offer architecture work is requested.
- market-research-analyst: Choose this ONLY when real TAM/SAM/SOM modeling, market trend research, or customer validation work is requested.
- chief-marketing-strategist: Choose this ONLY when real positioning statement, value proposition, or brand narrative work is requested.
- multi-agent: Choose this for full 360-degree cross-functional team strategic audits.

CRITICAL RULE:
If the user is having a short conversation, asking a casual question, or chatting, ALWAYS respond with 'foundryos-assistant'. Only assign a specialist when actual deliverables or work tasks are requested.

User Message: "${task.slice(0, 250)}"
Role:`;

  const response = await client.generate(prompt, {
    system: "Respond with only the role name in lowercase (e.g. foundryos-assistant, competitor-analyst, etc.).",
    temperature: 0.0,
    maxTokens: 25
  });

  const cleaned = response.trim().toLowerCase();

  if (cleaned.includes("competitor")) {
    return {
      employeeId: "competitor-analyst",
      ...ROLE_METADATA["competitor-analyst"],
      reason: "LLM supervisor assigned: Competitor Intelligence work",
      isSpecialist: true,
      isLightweight: false
    };
  }

  if (cleaned.includes("gtm") || cleaned.includes("funnel")) {
    return {
      employeeId: "gtm-funnel-strategist",
      ...ROLE_METADATA["gtm-funnel-strategist"],
      reason: "LLM supervisor assigned: GTM Funnel Strategy work",
      isSpecialist: true,
      isLightweight: false
    };
  }

  if (cleaned.includes("market-research") || (cleaned.includes("research") && !cleaned.includes("assistant"))) {
    return {
      employeeId: "market-research-analyst",
      ...ROLE_METADATA["market-research-analyst"],
      reason: "LLM supervisor assigned: Market Research work",
      isSpecialist: true,
      isLightweight: false
    };
  }

  if (cleaned.includes("chief-marketing") || cleaned.includes("strategist") || cleaned.includes("positioning")) {
    return {
      employeeId: "chief-marketing-strategist",
      ...ROLE_METADATA["chief-marketing-strategist"],
      reason: "LLM supervisor assigned: Brand & Marketing Strategy work",
      isSpecialist: true,
      isLightweight: false
    };
  }

  return {
    employeeId: "foundryos-assistant",
    ...ROLE_METADATA["foundryos-assistant"],
    reason: "LLM supervisor assigned: Conversational LLM handling direct chat/question",
    isSpecialist: false,
    isLightweight: true
  };
}

export async function routeTaskWithLlm(
  task: string,
  llm?: LLMClient
): Promise<RoutingDecision> {
  const normalized = normalizeQuery(task);

  const guardrailDecision = matchConversationalGuardrail(normalized);
  if (guardrailDecision) {
    return guardrailDecision;
  }

  const multiAgentDecision = matchMultiAgentTrigger(normalized);
  if (multiAgentDecision) {
    return multiAgentDecision;
  }

  const scores = computeDomainScores(normalized);
  const top = scores[0];
  const runnerUp = scores[1];

  if (top && top.score >= 4) {
    if (runnerUp && runnerUp.score >= 6 && (top.score - runnerUp.score) <= 1) {
      return {
        employeeId: "multi-agent",
        ...ROLE_METADATA["multi-agent"],
        reason: `Multi-domain affinity detected (${top.role} + ${runnerUp.role}): 360 Cross-Functional Review`,
        isSpecialist: true,
        isLightweight: false
      };
    }

    return {
      employeeId: top.role,
      ...ROLE_METADATA[top.role],
      reason: `High-precision domain matrix classified: ${ROLE_METADATA[top.role].employeeName} (score: ${top.score})`,
      isSpecialist: true,
      isLightweight: false
    };
  }

  const client = llm ?? resolveLLMClient();
  try {
    return await disambiguateWithLlm(task, client);
  } catch {
    return {
      employeeId: "foundryos-assistant",
      ...ROLE_METADATA["foundryos-assistant"],
      reason: "Safe fallback: FoundryOS Executive Assistant",
      isSpecialist: false,
      isLightweight: true
    };
  }
}
