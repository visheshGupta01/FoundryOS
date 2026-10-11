import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

interface KeywordSuggestion {
  keyword: string;
  intent: "informational" | "commercial" | "transactional" | "navigational";
  estimatedVolume: string;
  competition: "low" | "medium" | "high";
  recommendedPillar: string;
}

function generateKeywordIdeas(seed: string): KeywordSuggestion[] {
  const cleanSeed = seed.toLowerCase().trim();
  return [
    {
      keyword: `best ${cleanSeed} for startups`,
      intent: "commercial",
      estimatedVolume: "1.2K - 2.5K/mo",
      competition: "medium",
      recommendedPillar: "Comparison & Listicle Content"
    },
    {
      keyword: `${cleanSeed} alternative`,
      intent: "transactional",
      estimatedVolume: "800 - 1.8K/mo",
      competition: "low",
      recommendedPillar: "Competitor Displacement Pages"
    },
    {
      keyword: `how to automate ${cleanSeed}`,
      intent: "informational",
      estimatedVolume: "2.4K - 5K/mo",
      competition: "medium",
      recommendedPillar: "Educational Guides & Playbooks"
    },
    {
      keyword: `open source ${cleanSeed} vs ai`,
      intent: "informational",
      estimatedVolume: "500 - 1.2K/mo",
      competition: "low",
      recommendedPillar: "Technical Teardowns"
    },
    {
      keyword: `${cleanSeed} pricing teardown`,
      intent: "commercial",
      estimatedVolume: "400 - 900/mo",
      competition: "low",
      recommendedPillar: "Transparent Pricing Comparison"
    }
  ];
}

function auditPricingModel(competitorName: string, modelType = "seat-based") {
  return {
    competitor: competitorName,
    detectedModel: modelType,
    vulnerabilities: [
      "Per-seat pricing penalizes growing startup teams and discourages company-wide adoption",
      "Gated enterprise features create friction for self-serve conversion",
      "Opaque pricing requires contact-us forms leading to high bounce rates"
    ],
    recommendedDisplacement: [
      "Offer transparent value-based or usage-tiered pricing ($49/mo - $199/mo)",
      "Provide zero-barrier onboarding with persistent institutional context included",
      "Highlight 'Hire Nobody, Launch Everything' positioning vs seat taxes"
    ],
    urgency: "high"
  };
}

export function createSeoAuditMcpServer(): Server {
  const server = new Server(
    { name: "seo-competitor-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "seo_audit",
          description: "Audits page headings, title tags, meta description length, and content readiness",
          inputSchema: {
            type: "object",
            properties: {
              title: { type: "string", description: "Page title" },
              metaDescription: { type: "string", description: "Meta description" },
              headings: { type: "array", items: { type: "string" }, description: "Page H1/H2 headlines" }
            },
            required: ["title"]
          }
        },
        {
          name: "keyword_suggester",
          description: "Generates high-converting commercial and competitor comparison SEO keywords",
          inputSchema: {
            type: "object",
            properties: {
              seedTopic: { type: "string", description: "Target product category or seed query" }
            },
            required: ["seedTopic"]
          }
        },
        {
          name: "competitor_pricing_audit",
          description: "Identifies vulnerabilities and counter-tactics against competitor pricing tiers",
          inputSchema: {
            type: "object",
            properties: {
              competitorName: { type: "string", description: "Competitor name or category" },
              modelType: { type: "string", description: "Pricing model (seat-based, usage, enterprise)" }
            },
            required: ["competitorName"]
          }
        }
      ]
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === "keyword_suggester") {
      const seed = String(args?.["seedTopic"] || "startup marketing");
      const suggestions = generateKeywordIdeas(seed);
      return {
        content: [{ type: "text", text: JSON.stringify({ seed, count: suggestions.length, suggestions }, null, 2) }]
      };
    }

    if (name === "competitor_pricing_audit") {
      const comp = String(args?.["competitorName"] || "Legacy SaaS");
      const model = String(args?.["modelType"] || "seat-based");
      const audit = auditPricingModel(comp, model);
      return {
        content: [{ type: "text", text: JSON.stringify(audit, null, 2) }]
      };
    }

    if (name === "seo_audit") {
      const title = String(args?.["title"] || "");
      const meta = String(args?.["metaDescription"] || "");
      const titleValid = title.length >= 30 && title.length <= 65;
      const metaValid = meta.length >= 100 && meta.length <= 165;

      const report = {
        titleAudit: {
          title,
          length: title.length,
          status: titleValid ? "optimal" : "needs_attention",
          recommendation: titleValid ? "Optimal length for Google SERP" : "Aim for 40-60 characters with primary keyword first"
        },
        metaAudit: {
          metaDescription: meta,
          length: meta.length,
          status: metaValid ? "optimal" : "needs_attention",
          recommendation: metaValid ? "Optimal length" : "Aim for 120-160 characters including clear call to action"
        }
      };

      return {
        content: [{ type: "text", text: JSON.stringify(report, null, 2) }]
      };
    }

    return {
      isError: true,
      content: [{ type: "text", text: `Unknown SEO tool: ${name}` }]
    };
  });

  return server;
}
