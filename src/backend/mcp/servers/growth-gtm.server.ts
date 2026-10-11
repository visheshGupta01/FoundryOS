import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

function evaluateValueProposition(statement: string) {
  const buzzwords = [
    "revolutionary",
    "disruptive",
    "synergy",
    "game-changer",
    "next-gen",
    "best-in-class",
    "all-in-one",
    "seamless",
    "paradigm shift",
    "supercharged"
  ];

  const lower = statement.toLowerCase();
  const detectedBuzzwords = buzzwords.filter((w) => lower.includes(w));
  const wordCount = statement.split(/\s+/).filter(Boolean).length;

  const lengthScore = wordCount <= 25 && wordCount >= 8 ? 10 : 6;
  const clarityScore = Math.max(0, 10 - detectedBuzzwords.length * 3);
  const compositeScore = Math.round((lengthScore * 0.4 + clarityScore * 0.6) * 10) / 10;

  return {
    statement,
    wordCount,
    clarityScore: `${compositeScore}/10`,
    detectedBuzzwords,
    feedback: detectedBuzzwords.length > 0
      ? `Found vague hype words: [${detectedBuzzwords.join(", ")}]. Replace with concrete operational outcomes.`
      : "Crisp and concrete. No empty buzzwords detected.",
    recommendation: wordCount > 25
      ? "Shorten to under 20 words: Who you help + What pain you solve + The unique proof point."
      : "Strong headline length suitable for hero section and ad copy."
  };
}

function calculateCacLtv(arpuMonthly: number, cac: number, churnRateMonthly = 0.03) {
  const safeChurn = Math.max(0.005, churnRateMonthly);
  const customerLifetimeMonths = 1 / safeChurn;
  const ltv = Math.round(arpuMonthly * customerLifetimeMonths);
  const ltvCacRatio = cac > 0 ? Math.round((ltv / cac) * 10) / 10 : 0;
  const paybackMonths = arpuMonthly > 0 ? Math.round((cac / arpuMonthly) * 10) / 10 : 0;

  let health: "poor" | "healthy" | "exceptional" = "healthy";
  if (ltvCacRatio < 3 || paybackMonths > 14) health = "poor";
  else if (ltvCacRatio >= 4 && paybackMonths <= 9) health = "exceptional";

  return {
    inputs: { arpuMonthly, cac, churnRateMonthly: `${(churnRateMonthly * 100).toFixed(1)}%` },
    metrics: {
      ltv: `$${ltv.toLocaleString()}`,
      ltvCacRatio: `${ltvCacRatio}x`,
      paybackPeriodMonths: `${paybackMonths} months`,
      estimatedLifetimeMonths: `${Math.round(customerLifetimeMonths)} months`
    },
    assessment: health,
    targetBenchmarks: {
      idealLtvCac: "3.0x - 5.0x",
      idealPayback: "< 12 months for Seed / Series A SaaS"
    }
  };
}

export function createGrowthGtmMcpServer(): Server {
  const server = new Server(
    { name: "growth-gtm-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "value_prop_evaluator",
          description: "Critiques startup positioning statements for clarity, buzzword avoidance, and punchiness",
          inputSchema: {
            type: "object",
            properties: {
              statement: { type: "string", description: "Value proposition or headline to critique" }
            },
            required: ["statement"]
          }
        },
        {
          name: "cac_ltv_calculator",
          description: "Calculates unit economics, payback months, and LTV/CAC ratio for SaaS marketing",
          inputSchema: {
            type: "object",
            properties: {
              arpuMonthly: { type: "number", description: "Average monthly revenue per user/customer" },
              cac: { type: "number", description: "Customer Acquisition Cost" },
              churnRateMonthly: { type: "number", description: "Monthly churn rate (e.g. 0.03 for 3%)", default: 0.03 }
            },
            required: ["arpuMonthly", "cac"]
          }
        },
        {
          name: "funnel_benchmarks",
          description: "Retrieve baseline conversion rate benchmarks for TOFU, MOFU, and BOFU stages",
          inputSchema: {
            type: "object",
            properties: {
              businessModel: { type: "string", description: "B2B SaaS, DevTools, or Marketplace", default: "B2B SaaS" }
            }
          }
        }
      ]
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === "value_prop_evaluator") {
      const stmt = String(args?.["statement"] || "");
      const res = evaluateValueProposition(stmt);
      return {
        content: [{ type: "text", text: JSON.stringify(res, null, 2) }]
      };
    }

    if (name === "cac_ltv_calculator") {
      const arpu = Number(args?.["arpuMonthly"] || 100);
      const cac = Number(args?.["cac"] || 300);
      const churn = Number(args?.["churnRateMonthly"] || 0.03);
      const res = calculateCacLtv(arpu, cac, churn);
      return {
        content: [{ type: "text", text: JSON.stringify(res, null, 2) }]
      };
    }

    if (name === "funnel_benchmarks") {
      const model = String(args?.["businessModel"] || "B2B SaaS");
      const benchmarks = {
        model,
        stages: {
          tofuToLead: "2.5% - 4.8% (Visitor to demo signup / lead)",
          leadToQualified: "30% - 45% (Lead to Sales Qualified / MQL to SQL)",
          qualifiedToClosed: "20% - 32% (Opportunity to closed-won customer)",
          selfServeTrialToPaid: "8% - 14% (Free trial / freemium to paid plan)"
        },
        tacticsToImprove: [
          "Eliminate credit card requirements on initial signup",
          "Show interactive product walkthroughs before forcing email gates",
          "Equip sales and marketing with personalized competitive displacement cheat sheets"
        ]
      };
      return {
        content: [{ type: "text", text: JSON.stringify(benchmarks, null, 2) }]
      };
    }

    return {
      isError: true,
      content: [{ type: "text", text: `Unknown growth tool: ${name}` }]
    };
  });

  return server;
}
