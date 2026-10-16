import React, { useState } from 'react';
import { Icons } from '../common/Icons';

interface BrainLayer {
  number: number;
  id: string;
  name: string;
  tagline: string;
  tokenCount: number;
  sampleContent: string;
  whyItMatters: string;
}

const BRAIN_LAYERS: BrainLayer[] = [
  {
    number: 7,
    id: 'institutional_memory',
    name: 'Digital Institutional Memory',
    tagline: 'Learned founder feedback, corrections & decision records',
    tokenCount: 42,
    sampleContent: `[learning] Technical founders prefer structured tables and verified citations over generic marketing prose.
[feedback] Avoid using words like "synergy", "paradigm", or "next-gen". Keep value statements quantified.`,
    whyItMatters: 'Captures every human correction so agents never make the same strategic mistake twice.'
  },
  {
    number: 6,
    id: 'goals_strategy',
    name: 'Goals & Strategy Engine',
    tagline: 'Active quarterly objectives, north-star metrics & target CAC',
    tokenCount: 52,
    sampleContent: `North Star: Acquire first 100 paying technical founders with CAC payback under 90 days.
Active Initiative: Scale developer community via technical tear-downs and open-source MCP tools.`,
    whyItMatters: 'Forces every AI campaign, article, and tweet to align with measurable revenue goals.'
  },
  {
    number: 5,
    id: 'competitor_intel',
    name: 'Competitor Intelligence',
    tagline: 'Dynamic battlecards, feature gaps & rival market vulnerabilities',
    tokenCount: 38,
    sampleContent: `Competitor Matrix:
- Disconnected AI Chatbots: Fast single-turn text, but 0% shared company memory.
- Traditional B2B Agencies: High touch, but $8,000/mo retainer and multi-week turnaround.`,
    whyItMatters: 'Equips your AI team with real-time differentiation so copy never sounds like generic copycat filler.'
  },
  {
    number: 4,
    id: 'brand_voice',
    name: 'Brand Voice & Avoid Rules',
    tagline: 'Banned buzzwords, tonality parameters & editorial guidelines',
    tokenCount: 61,
    sampleContent: `Tone: Data-driven, founder-centric, concise, highly authoritative.
Avoid Rules: Never invent fake metrics. Never use corporate jargon. Emphasize local privacy and autonomy.`,
    whyItMatters: 'Prevents brand dilution and eliminates hallucinated company traits across all channels.'
  },
  {
    number: 3,
    id: 'audience_icp',
    name: 'Audience & ICP Personas',
    tagline: 'Ideal customer profiles, core pain points & purchasing triggers',
    tokenCount: 70,
    sampleContent: `Primary ICP: Technical founders, CTOs & Solopreneurs (Team size: 1-20).
Pain Point: Spending 10+ hours a week context-switching and repeating instructions to basic chatbots.`,
    whyItMatters: 'Ensures every pitch addresses the exact psychological trigger that drives buying decisions.'
  },
  {
    number: 2,
    id: 'product_scope',
    name: 'Product Scope & Features',
    tagline: 'Technical capabilities, architectural boundaries & feature sets',
    tokenCount: 66,
    sampleContent: `Architecture: Local-first Ollama orchestration, 7-layer memory engine, Multi-MCP tool bus.
Integrations: Slack, Google Drive, PDF synthesis, live web intelligence.`,
    whyItMatters: 'Keeps AI employees grounded in what your product actually does, preventing over-promising.'
  },
  {
    number: 1,
    id: 'company_identity',
    name: 'Company Profile & Identity',
    tagline: 'Founding mission, core value proposition & brand pillars',
    tokenCount: 41,
    sampleContent: `Company: FoundryOS | The Autonomous Marketing Operating System.
Mission: Giving high-growth founders a coordinated AI marketing team with persistent memory and local privacy.`,
    whyItMatters: 'Forms the baseline grounding layer for every agent prompt and system directive.'
  }
];

export const BrainLayersVisualizer: React.FC = () => {
  const [activeLayer, setActiveLayer] = useState<BrainLayer>(BRAIN_LAYERS[0]);

  return (
    <div className="brain-layers-container" id="brain-layers">
      {/* 7-Layer Interactive Stack */}
      <div className="brain-stack">
        {BRAIN_LAYERS.map(layer => {
          const isActive = activeLayer.id === layer.id;
          return (
            <div
              key={layer.id}
              className={`brain-layer-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveLayer(layer)}
            >
              <div className="brain-layer-left">
                <span className="brain-layer-num">{layer.number}</span>
                <div>
                  <div className="brain-layer-name">{layer.name}</div>
                  <div className="brain-layer-tagline">{layer.tagline}</div>
                </div>
              </div>
              <span className="brain-layer-tokens">{layer.tokenCount} tok</span>
            </div>
          );
        })}
      </div>

      {/* Layer Detail Inspector */}
      <div className="brain-layer-preview">
        <div className="layer-preview-header">
          <div>
            <div className="layer-preview-title">{activeLayer.name}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Layer 0{activeLayer.number} • Memory Persistence Engine
            </div>
          </div>
          <span className="layer-preview-badge">{activeLayer.tokenCount} Tokens</span>
        </div>

        <div className="layer-preview-content">
          {activeLayer.sampleContent}
        </div>

        <div className="layer-preview-impact">
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icons.Sparkles size={14} style={{ color: 'var(--text-primary)' }} />
            <span>Why This Layer Eliminates Hallucinations:</span>
          </div>
          {activeLayer.whyItMatters}
        </div>
      </div>
    </div>
  );
};
