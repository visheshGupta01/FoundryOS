import React, { useState, useEffect } from 'react';
import { Icons } from '../common/Icons';

interface Scenario {
  id: string;
  name: string;
  employee: string;
  prompt: string;
  stages: Array<{
    title: string;
    desc: string;
    log: string;
  }>;
  deliverable: {
    title: string;
    badge: string;
    content: string;
  };
}

const SCENARIOS: Scenario[] = [
  {
    id: 'gtm',
    name: 'GTM Strategy & Battlecard',
    employee: 'Sarah Sterling (Chief Strategist)',
    prompt: 'Formulate core market positioning and competitive differentiation against generic AI tools.',
    stages: [
      {
        title: 'Router & Dispatch',
        desc: 'Heuristic matches Strategy pillar; persona Sarah Sterling activated',
        log: '[0.04s] Router: Matched pillar "strategy" -> Sarah Sterling (Chief Strategist)'
      },
      {
        title: '7-Layer Brain Assembly',
        desc: 'Vector retrieval injects ICP, Brand Voice, and Competitor layers',
        log: '[0.12s] Company Brain: Assembled 605 tokens across 7 layers. Headroom: 2467 tok'
      },
      {
        title: 'MCP Multi-Tool Bus',
        desc: 'Dispatches calls to Market Intelligence & SEO Audit tools',
        log: '[0.28s] MCP Bus: Dispatched 2 tool queries -> market-intel-mcp, seo-audit-mcp'
      },
      {
        title: 'HITL Steering Gate',
        desc: 'Deterministic check verifies strategic alignment with founder goals',
        log: '[0.55s] Governance: Founder strategic alignment verified. Proceeding.'
      },
      {
        title: 'Execution & Learning',
        desc: 'Generates structured brief and commits new learnings to Company Brain',
        log: '[0.82s] Brain Store: New learning committed (mem-17918805). Status: COMPLETED'
      }
    ],
    deliverable: {
      title: 'Strategic Positioning Brief: FoundryOS vs. Point Solutions',
      badge: 'GTM Brief • Verified',
      content: `### Executive Core Positioning
FoundryOS is the Autonomous Marketing Operating System for founders. Unlike disconnected AI chats that require constant prompt re-entry, FoundryOS maintains a persistent 7-layer Company Brain and executes coordinated multi-agent workflows.

### Competitive Moats
1. **Zero Prompt Re-Entry**: 7-layer context engine assembles ICP and rules automatically.
2. **100% Local Inference**: Zero data leaks via native Ollama protocol.
3. **Deterministic Governance**: High-stakes decisions stay strictly founder-approved.`
    }
  },
  {
    id: 'intel',
    name: 'Competitor Intelligence',
    employee: 'Marcus Vance (Market Analyst)',
    prompt: 'Scan target enterprise CRM landscape and extract positioning vulnerabilities.',
    stages: [
      {
        title: 'Router & Dispatch',
        desc: 'Objective routes to Marcus Vance for deep market telemetry',
        log: '[0.05s] Router: Assigned to Marcus Vance (Market Research Analyst)'
      },
      {
        title: '7-Layer Brain Assembly',
        desc: 'Pulls existing competitor matrix & customer pain points from memory',
        log: '[0.14s] Company Brain: Injected Competitor Intel layer (15 tok) + Audience ICP (70 tok)'
      },
      {
        title: 'MCP Multi-Tool Bus',
        desc: 'Executes live web search & competitor pricing crawl tools',
        log: '[0.32s] MCP Bus: Dispatched web-search-plugin:query_market_news'
      },
      {
        title: 'HITL Steering Gate',
        desc: 'Autonomous research review; zero approval bottleneck required',
        log: '[0.61s] Governance: Standard analysis bypasses HITL gating. Continuous flow.'
      },
      {
        title: 'Execution & Learning',
        desc: 'Structured market report delivered and added to semantic index',
        log: '[0.91s] Brain Store: Indexed new competitor battlecard vectors. Status: COMPLETED'
      }
    ],
    deliverable: {
      title: 'Market Landscape Intelligence: SaaS Marketing Gaps',
      badge: 'Market Telemetry • Active',
      content: `### Key Competitor Vulnerabilities
- **Generic Chatbots**: Suffer from context collapse and 0% cross-session retention.
- **Traditional Agencies**: 6-week turnaround time and $8,000/mo retainer overhead.

### Strategic Wedge
Target technical B2B SaaS founders who demand structured schemas, reproducible execution, and private local models.`
    }
  },
  {
    id: 'launch',
    name: 'Multi-Channel Launch Engine',
    employee: 'Elena Rostova (Content Architect)',
    prompt: 'Generate cross-platform narrative and launch sequence for Product Hunt & LinkedIn.',
    stages: [
      {
        title: 'Router & Dispatch',
        desc: 'Classified as Content & Copy pillar; Elena Rostova mobilized',
        log: '[0.03s] Router: Routed to Elena Rostova (Content & Copy Architect)'
      },
      {
        title: '7-Layer Brain Assembly',
        desc: 'Injects Brand Voice & Avoid Rules (banned jargon, tone constraints)',
        log: '[0.11s] Company Brain: Injected Brand Voice Layer (61 tok) - 0 banned buzzwords'
      },
      {
        title: 'MCP Multi-Tool Bus',
        desc: 'Connects Document Archive & PDF deliverable engine',
        log: '[0.29s] MCP Bus: Connected doc-archive-mcp & format-synthesizer'
      },
      {
        title: 'HITL Steering Gate',
        desc: 'Founder confirms tone checks before queueing broadcasts',
        log: '[0.50s] Governance: Editorial tone verified against Founder Guidelines.'
      },
      {
        title: 'Execution & Learning',
        desc: 'Full distribution copy synthesized with zero hallucination',
        log: '[0.78s] Deliverable formatted: 3 channel variants generated. Status: COMPLETED'
      }
    ],
    deliverable: {
      title: 'Omnichannel Launch Campaign: "Reclaim Founder Hours"',
      badge: 'Launch Pack • Production Ready',
      content: `### LinkedIn Announcement Hook
Most founders spend 15 hours a week re-explaining their company to generic AI chatbots.

Today we are launching FoundryOS 2.0:
- A persistent 7-layer Company Brain that remembers everything.
- Coordinated specialist AI employees that act in concert.
- 100% private local execution on your machine via Ollama.`
    }
  }
];

export const AgentSimulator: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(SCENARIOS[0]);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Simulation execution loop
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (isRunning && currentStep < selectedScenario.stages.length) {
      timer = setTimeout(() => {
        const nextStage = selectedScenario.stages[currentStep];
        setLogs(prev => [...prev, nextStage.log]);
        setCurrentStep(prev => prev + 1);
      }, 700);
    } else if (currentStep >= selectedScenario.stages.length) {
      setIsRunning(false);
    }

    return () => clearTimeout(timer);
  }, [isRunning, currentStep, selectedScenario]);

  const handleSelectScenario = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setCurrentStep(0);
    setIsRunning(false);
    setLogs([`[0.00s] Initialized workspace objective: "${scenario.prompt}"`]);
  };

  const handleRun = () => {
    setCurrentStep(0);
    setLogs([`[0.00s] Initialized workspace objective: "${selectedScenario.prompt}"`]);
    setIsRunning(true);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsRunning(false);
    setLogs([`[0.00s] Simulation reset. Select a scenario and click "Run Simulation".`]);
  };

  return (
    <div className="simulator-card" id="simulator">
      <div className="simulator-header">
        <div className="simulator-scenarios">
          {SCENARIOS.map(sc => (
            <button
              key={sc.id}
              className={`scenario-btn ${selectedScenario.id === sc.id ? 'active' : ''}`}
              onClick={() => handleSelectScenario(sc)}
            >
              {sc.name}
            </button>
          ))}
        </div>

        <div className="simulator-actions">
          <button className="sim-run-btn" onClick={handleRun} disabled={isRunning}>
            <Icons.Sparkles size={14} />
            <span>{isRunning ? 'Simulating...' : 'Run Simulation'}</span>
          </button>
          <button className="landing-btn-ghost" onClick={handleReset} style={{ padding: '8px 12px' }}>
            <Icons.RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div className="simulator-body">
        {/* Animated Progress Beam */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '3px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '999px',
          overflow: 'hidden',
          marginBottom: '-16px'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${Math.min(100, (currentStep / selectedScenario.stages.length) * 100)}%`,
            background: 'linear-gradient(90deg, #555555, #ffffff)',
            boxShadow: '0 0 12px rgba(255, 255, 255, 0.4)',
            transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }} />
        </div>

        {/* Animated 5-Stage Pipeline */}
        <div className="sim-pipeline">
          {selectedScenario.stages.map((st, idx) => {
            const isCompleted = currentStep > idx;
            const isActive = currentStep === idx && isRunning;
            return (
              <div
                key={idx}
                className={`sim-stage-node ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              >
                <div className="sim-stage-header">
                  <span className="sim-stage-step">STAGE 0{idx + 1}</span>
                  {isCompleted && <Icons.Check size={14} style={{ color: 'var(--text-primary)' }} />}
                  {isActive && <div className="hero-pulse-dot" />}
                </div>
                <div className="sim-stage-title">{st.title}</div>
                <div className="sim-stage-desc">{st.desc}</div>
              </div>
            );
          })}
        </div>

        {/* Output Split: Real-time Terminal vs Deliverable Preview */}
        <div className="sim-output-grid">
          <div className="sim-terminal">
            <div style={{ color: '#737373', fontSize: '0.72rem', marginBottom: '4px' }}>
              // FOUNDRYOS RUNTIME BUS TELEMETRY
            </div>
            {logs.map((line, i) => (
              <div
                key={i}
                className={`sim-term-line ${
                  line.includes('COMPLETED')
                    ? 'success'
                    : line.includes('Governance')
                    ? 'warn'
                    : line.includes('Router')
                    ? 'info'
                    : ''
                }`}
              >
                {line}
              </div>
            ))}
            {isRunning && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff', fontSize: '0.75rem' }}>
                <span className="hero-pulse-dot" style={{ width: '6px', height: '6px' }} />
                <span>streaming packet data...</span>
              </div>
            )}
          </div>

          <div className="sim-deliverable-preview">
            <div className="sim-deliverable-title">
              <span>{selectedScenario.deliverable.title}</span>
              <span className="sim-deliverable-badge">{selectedScenario.deliverable.badge}</span>
            </div>
            <div className="sim-deliverable-body">
              {currentStep >= 4 ? (
                selectedScenario.deliverable.content
              ) : (
                <div style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', paddingTop: '20px' }}>
                  Execution in progress... Structured deliverable will synthesize once all pipeline stages complete.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
