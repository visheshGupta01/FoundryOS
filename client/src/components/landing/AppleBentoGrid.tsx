import React, { useState } from 'react';
import { Icons } from '../common/Icons';

interface BentoCardProps {
  title: string;
  badge: string;
  subtitle: string;
  children: React.ReactNode;
  span?: 1 | 2;
  className?: string;
}

const BentoCard: React.FC<BentoCardProps> = ({
  title,
  badge,
  subtitle,
  children,
  span = 1,
  className = ''
}) => {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div
      className={`bento-card span-${span} ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        '--mouse-x': `${mousePos.x}%`,
        '--mouse-y': `${mousePos.y}%`
      } as React.CSSProperties}
    >
      <div className={`bento-glint ${isHovered ? 'active' : ''}`} />
      <div className="bento-header">
        <span className="bento-badge">{badge}</span>
        <h3 className="bento-title">{title}</h3>
        <p className="bento-subtitle">{subtitle}</p>
      </div>
      <div className="bento-content">
        {children}
      </div>
    </div>
  );
};

export const AppleBentoGrid: React.FC = () => {
  const [activeMcp, setActiveMcp] = useState<number>(0);

  const mcpTools = [
    { name: 'Market Intelligence', latency: '< 18ms', desc: 'Live competitor indexation & ad creative reverse-engineering' },
    { name: 'Semantic Brand Memory', latency: '< 6ms', desc: 'HNSW vector retrieval across 7-layer company knowledge' },
    { name: 'Autonomous Web Crawler', latency: '< 42ms', desc: 'Real-time SERP scrape & keyword gap extraction' },
    { name: 'Executive Doc Synthesizer', latency: '< 30ms', desc: 'Board-ready strategy memos & automated markdown generation' }
  ];

  const agentSwarmNodes = [
    { role: 'Campaign Lead', code: 'CL', status: 'Decomposing Goal' },
    { role: 'Market Intel', code: 'MI', status: 'Scanning SERP' },
    { role: 'Copy Architect', code: 'CA', status: 'Synthesizing Tone' },
    { role: 'Brand Sentinel', code: 'BS', status: 'Enforcing Voice' }
  ];

  return (
    <section className="landing-section" id="bento-section">
      <div className="section-header" id="bento">
        <span className="section-tag">Architecture Matrix</span>
        <h2 className="section-title">Engineered Like Hardware. Built for Autonomy.</h2>
        <p className="section-desc">
          Every layer of FoundryOS is meticulously designed to eliminate hallucinations, prevent data leaks, and turn strategic intent into verified marketing execution.
        </p>
      </div>

      <div className="bento-grid">
        {/* Card 1: Multi-Agent Swarm Orchestrator (Span 2) */}
        <BentoCard
          span={2}
          badge="In-Memory Event Bus"
          title="Autonomous Multi-Agent Swarm"
          subtitle="Agents coordinate without token-expensive centralized prompts. Each specialist operates within bounded token budgets and verifies work through an asynchronous bus."
        >
          <div className="bento-swarm-visual">
            <div className="bento-swarm-nodes">
              {agentSwarmNodes.map((node, i) => (
                <div key={i} className="bento-swarm-node">
                  <div className="swarm-node-chip">
                    <span className="swarm-pulse-ring" />
                    <span className="swarm-code">{node.code}</span>
                  </div>
                  <div className="swarm-node-info">
                    <span className="swarm-role">{node.role}</span>
                    <span className="swarm-status">{node.status}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bento-swarm-telemetry">
              <div className="telemetry-bar">
                <span className="telemetry-label">Bus Throughput</span>
                <span className="telemetry-value">12.4k ops/sec</span>
              </div>
              <div className="telemetry-bar">
                <span className="telemetry-label">Consensus Protocol</span>
                <span className="telemetry-value">Deterministic HITL</span>
              </div>
              <div className="telemetry-bar">
                <span className="telemetry-label">Memory Sync</span>
                <span className="telemetry-value">Active (0ms lag)</span>
              </div>
            </div>
          </div>
        </BentoCard>

        {/* Card 2: 100% Private Local Inference (Span 1) */}
        <BentoCard
          span={1}
          badge="Air-Gapped Neural Core"
          title="Zero Data Egress"
          subtitle="Native Ollama execution directly on Apple Silicon or Nvidia cores. Your proprietary strategy never leaves your device."
        >
          <div className="bento-chip-visual">
            <div className="neural-chip">
              <div className="neural-chip-core">
                <Icons.Shield size={28} />
                <span className="chip-brand">LOCAL NPU</span>
              </div>
              <div className="chip-pins-top" />
              <div className="chip-pins-bottom" />
            </div>

            <div className="bento-stats-compact">
              <div className="stat-row">
                <span>Cloud Telemetry Egress</span>
                <strong className="stat-zero">0.00 B/s</strong>
              </div>
              <div className="stat-row">
                <span>Model Quantization</span>
                <strong>Q4_K_M Fast</strong>
              </div>
              <div className="stat-row">
                <span>Weights Location</span>
                <strong>~/.ollama/models</strong>
              </div>
            </div>
          </div>
        </BentoCard>

        {/* Card 3: 7-Layer Vector Memory Matrix (Span 1) */}
        <BentoCard
          span={1}
          badge="HNSW Vector Index"
          title="Zero Prompt Amnesia"
          subtitle="7 distinct hierarchical memory planes preserve identity, past campaigns, and brand guidelines across every session."
        >
          <div className="bento-layers-stack">
            {['Brand Voice & Archetype', 'ICP Persona & Matrix', 'Competitor Intelligence', 'Product Feature Tree', 'Historical Performance'].map((layer, idx) => (
              <div key={idx} className="bento-layer-strip">
                <span className="layer-num">0{idx + 1}</span>
                <span className="layer-name">{layer}</span>
                <span className="layer-cosine">0.9{4 - idx} Cosine</span>
              </div>
            ))}
          </div>
        </BentoCard>

        {/* Card 4: Model Context Protocol (MCP) Suite (Span 2) */}
        <BentoCard
          span={2}
          badge="Universal Tool Standard"
          title="Production-Verified MCP Tool Suite"
          subtitle="Built on the official Anthropic Model Context Protocol specification. Standardized JSON-RPC tool calling with runtime parameter schema validation."
        >
          <div className="bento-mcp-visual">
            <div className="bento-mcp-list">
              {mcpTools.map((tool, idx) => (
                <div
                  key={idx}
                  className={`bento-mcp-item ${activeMcp === idx ? 'active' : ''}`}
                  onClick={() => setActiveMcp(idx)}
                >
                  <div className="mcp-item-head">
                    <span className="mcp-dot" />
                    <span className="mcp-name">{tool.name}</span>
                    <span className="mcp-latency">{tool.latency}</span>
                  </div>
                  <div className="mcp-desc">{tool.desc}</div>
                </div>
              ))}
            </div>

            <div className="bento-mcp-code">
              <div className="code-header">
                <span>mcp_runtime.ts</span>
                <span className="code-status">Active Tool RPC</span>
              </div>
              <pre className="code-block">
{`// Schema-validated tool execution
const result = await mcpManager.callTool({
  server: "${mcpTools[activeMcp].name.toLowerCase().replace(/\s+/g, '-')}",
  name: "execute_analysis",
  parameters: {
    target: "foundryos.local",
    strictSanitization: true
  }
});`}
              </pre>
            </div>
          </div>
        </BentoCard>
      </div>
    </section>
  );
};
