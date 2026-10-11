export interface StartupProfile {
  id: string;
  name: string;
  website: string;
  industry: string;
  oneLiner: string;
  audience: string;
  problem: string;
  competitors: string;
  tone: string;
  avoidTone: string;
  pricing: string;
  goal: string;
  quickPrompts: Array<{
    agentId: string;
    label: string;
    prompt: string;
  }>;
}

export const DEMO_PROFILES: StartupProfile[] = [
  {
    id: "foundry-os",
    name: "FoundryOS",
    website: "https://foundryos.ai",
    industry: "AI Marketing & Operations Operating System",
    oneLiner: "The Autonomous AI Marketing Operating System that coordinates specialized AI employees to research, position, and scale startups.",
    audience: "Early-stage technical founders, solo founders, and Series A B2B SaaS leadership teams.",
    problem: "Founders spend over 60% of their operational cycles juggling fragmented point tools and generic AI prompts that lack company context.",
    competitors: "Traditional marketing retainers, Zapier/Make automation workflows, disconnected AI copy assistants.",
    tone: "Direct, confident, human, pragmatic, startup-obsessed.",
    avoidTone: "Corporate buzzwords, generic fluff, speculative hype, passive voice.",
    pricing: "Starter: $99/mo | Growth: $299/mo (unlimited autonomous executions & company memory).",
    goal: "Reach $1M ARR within 12 months through organic developer evangelism and founder-led product distribution.",
    quickPrompts: [
      {
        agentId: "multi-agent",
        label: "360° Multi-Agent Launch Teardown",
        prompt: "Execute a collaborative multi-agent teardown: evaluate market demand, expose competitor weaknesses, refine core positioning, and design the GTM funnel."
      },
      {
        agentId: "chief-marketing-strategist",
        label: "Enterprise Brand Positioning",
        prompt: "Draft our core positioning statement, value proposition, and strategic pillars to differentiate us from generic AI copy tools."
      },
      {
        agentId: "competitor-analyst",
        label: "Competitive Moat Audit",
        prompt: "Perform a competitive audit comparing FoundryOS against traditional agency retainers and single-prompt AI tools."
      },
      {
        agentId: "gtm-funnel-strategist",
        label: "Full-Funnel GTM Conversion Engine",
        prompt: "Design a full-funnel acquisition engine targeting seed-stage founders with TOFU benchmarks and high-converting BOFU offers."
      }
    ]
  },
  {
    id: "devpulse",
    name: "DevPulse",
    website: "https://devpulse.io",
    industry: "AI Developer Observability & Agent Tracing",
    oneLiner: "Distributed tracing, cost attribution, and hallucination monitoring for multi-agent LLM systems in production.",
    audience: "AI Engineers, VP of Engineering, and Platform Architects building LLM agents.",
    problem: "Teams deploying agentic AI to production have zero visibility into cascading token consumption, latency spikes, and silent hallucination failures.",
    competitors: "LangSmith, Arize Phoenix, Datadog (generic APM without native agent trace graphs).",
    tone: "Deeply technical, analytical, developer-first, transparent.",
    avoidTone: "Salesy hype, superficial AI claims, non-technical hand-waving.",
    pricing: "Free Developer Tier | Scale: $0.05 per 1,000 traced agent turns | Enterprise self-hosted VPC.",
    goal: "Win 2,500 active engineering teams and achieve $150K MRR by Q4.",
    quickPrompts: [
      {
        agentId: "multi-agent",
        label: "Multi-Agent Developer GTM Strategy",
        prompt: "Synthesize developer marketing strategy for DevPulse: developer community outreach, LangSmith comparison narrative, and PLG funnel."
      },
      {
        agentId: "competitor-analyst",
        label: "LangSmith & Arize Vulnerability Teardown",
        prompt: "Audit LangSmith and Datadog to identify pricing gaps and enterprise security objections that DevPulse can exploit."
      },
      {
        agentId: "market-research-analyst",
        label: "AI Observability Market Sizing",
        prompt: "Evaluate market TAM, CAGR, and urgent buyer pain points for LLM agent tracing across high-growth startups."
      },
      {
        agentId: "chief-marketing-strategist",
        label: "Technical Positioning Statement",
        prompt: "Craft authoritative developer positioning emphasizing open telemetry standards, zero-overhead tracing, and private VPC security."
      }
    ]
  },
  {
    id: "aurapay",
    name: "AuraPay",
    website: "https://aurapay.global",
    industry: "Fintech & Global Multi-Currency Payouts",
    oneLiner: "Instant cross-border stablecoin and fiat contractor payouts with automatic tax compliance and zero wire delays.",
    audience: "Global remote companies, Web3 agencies, and international creator economy platforms.",
    problem: "Traditional international SWIFT wires take 3-5 days, cost $45 per transfer, and create administrative tax nightmare for remote contractors.",
    competitors: "Deel, Remote.com, Wise Business, PayPal/Payoneer.",
    tone: "Institutional trust, modern, frictionless, empowering.",
    avoidTone: "Overly speculative crypto jargon, slow bureaucratic banking language.",
    pricing: "0.4% per outbound payout (vs 3-5% legacy international wire fees).",
    goal: "Process $20M monthly payout volume and become the default payment rail for top 50 remote engineering agencies.",
    quickPrompts: [
      {
        agentId: "multi-agent",
        label: "Global Contractor Expansion Plan",
        prompt: "Build an executive strategy to displace legacy wire transfers and Deel fees for remote software development firms."
      },
      {
        agentId: "chief-marketing-strategist",
        label: "Trust & Compliance Positioning",
        prompt: "Formulate positioning highlighting institutional security, licensed custody, and same-second global contractor payouts."
      },
      {
        agentId: "gtm-funnel-strategist",
        label: "Agency Outbound Funnel",
        prompt: "Design a high-converting outbound acquisition funnel targeting CTOs and Finance Directors spending >$5,000/mo on wire fees."
      },
      {
        agentId: "competitor-analyst",
        label: "Deel vs AuraPay Cost Comparison",
        prompt: "Break down Deel and Wise fee structures to produce a high-impact cost calculator and competitive battlecard."
      }
    ]
  },
  {
    id: "biokite",
    name: "BioKite",
    website: "https://biokite.health",
    industry: "Healthcare & AI Clinical Protocol Intelligence",
    oneLiner: "AI-powered clinical trial protocol simulation and automated patient cohort matching for biopharma innovators.",
    audience: "Clinical Research Directors, VP of Medical Affairs, and Biotech Chief Medical Officers.",
    problem: "80% of clinical trials miss enrollment deadlines due to overly restrictive protocol criteria and inefficient investigator site selection.",
    competitors: "IQVIA, Medidata, manual CRO consulting contracts.",
    tone: "Rigorous, scientifically validated, empathetic, compliance-centered.",
    avoidTone: "Casual slang, untested promises, hype, reckless automation claims.",
    pricing: "$12,000 per protocol optimization run | Enterprise annual license for biopharma sponsors.",
    goal: "Secure 15 Phase II/III biopharma sponsor pilots within the next 6 months.",
    quickPrompts: [
      {
        agentId: "multi-agent",
        label: "Biopharma Protocol Launch Strategy",
        prompt: "Synthesize comprehensive GTM plan: scientific credibility proof, CRO partnership channels, and regulatory risk mitigation."
      },
      {
        agentId: "chief-marketing-strategist",
        label: "Clinical Trial Protocol Positioning",
        prompt: "Position BioKite as the indispensable protocol optimization layer that saves sponsors 6 months of trial delay."
      },
      {
        agentId: "competitor-analyst",
        label: "IQVIA & Legacy CRO Moat Analysis",
        prompt: "Expose vulnerabilities in legacy CRO consulting speed and showcase BioKite's algorithmic advantage."
      },
      {
        agentId: "gtm-funnel-strategist",
        label: "Enterprise Biopharma Pilot Funnel",
        prompt: "Create an account-based marketing (ABM) funnel to engage Clinical Operations executives at Mid-market Biopharma."
      }
    ]
  }
];

export function getDemoProfile(id: string): StartupProfile | undefined {
  return DEMO_PROFILES.find((p) => p.id === id);
}
