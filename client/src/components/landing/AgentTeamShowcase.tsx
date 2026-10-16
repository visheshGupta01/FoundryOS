import React, { useState } from 'react';

interface Specialist {
  id: string;
  name: string;
  avatar: string;
  role: string;
  pillar: 'strategy' | 'research' | 'content' | 'growth';
  pillarLabel: string;
  bio: string;
  tools: string[];
}

const SPECIALISTS: Specialist[] = [
  {
    id: 'sarah',
    name: 'Sarah Sterling',
    avatar: 'CS',
    role: 'Chief Marketing Strategist',
    pillar: 'strategy',
    pillarLabel: 'Strategy',
    bio: 'Formulates high-stakes GTM positioning, value proposition hierarchies, and quarter-by-quarter marketing roadmaps.',
    tools: ['Market Intelligence MCP', 'Company Brain Recall', 'HITL Governance']
  },
  {
    id: 'marcus',
    name: 'Marcus Vance',
    avatar: 'MR',
    role: 'Market Research Analyst',
    pillar: 'research',
    pillarLabel: 'Research',
    bio: 'Scrapes competitor landscape, identifies pricing vulnerabilities, and analyzes search volume trends.',
    tools: ['Web Search Tool', 'SEO & Competitor Audit MCP', 'Vector Memory Store']
  },
  {
    id: 'elena',
    name: 'Elena Rostova',
    avatar: 'CA',
    role: 'Content & Copy Architect',
    pillar: 'content',
    pillarLabel: 'Content',
    bio: 'Engineers high-converting copy, technical founder essays, and multi-channel launch announcements with zero fluff.',
    tools: ['Document Archive MCP', 'PDF Generation Engine', 'Brand Voice Guardian']
  },
  {
    id: 'devon',
    name: 'Devon Cross',
    avatar: 'GH',
    role: 'GTM & Growth Hacker',
    pillar: 'growth',
    pillarLabel: 'Growth',
    bio: 'Designs viral loops, referral funnels, conversion optimization experiments, and acquisition mechanics.',
    tools: ['Growth Analytics MCP', 'Token Telemetry', 'Slack MCP']
  },
  {
    id: 'kavita',
    name: 'Kavita Patel',
    avatar: 'SC',
    role: 'Social & Community Director',
    pillar: 'content',
    pillarLabel: 'Social',
    bio: 'Orchestrates LinkedIn thought leadership, X/Twitter threads, community discussions, and developer advocacy.',
    tools: ['Slack Broadcast MCP', 'Social Format Synthesizer', 'Community Memory']
  },
  {
    id: 'aiden',
    name: 'Aiden Brooks',
    avatar: 'BP',
    role: 'Brand & PR Specialist',
    pillar: 'strategy',
    pillarLabel: 'Brand',
    bio: 'Protects brand integrity, drafts press releases, pitches podcasts, and manages company narrative consistency.',
    tools: ['Company Brain Memory', 'PR Brief Synthesizer', 'Governance Steering']
  }
];

export const AgentTeamShowcase: React.FC = () => {
  const [filter, setFilter] = useState<string>('all');

  const filteredSpecialists = filter === 'all'
    ? SPECIALISTS
    : SPECIALISTS.filter(s => s.pillar === filter);

  return (
    <div id="specialists">
      {/* Discipline Filter Bar */}
      <div className="agents-filter-bar">
        {['all', 'strategy', 'research', 'content', 'growth'].map(category => (
          <button
            key={category}
            className={`agent-filter-btn ${filter === category ? 'active' : ''}`}
            onClick={() => setFilter(category)}
          >
            {category === 'all' ? 'All Specialists' : category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Grid of Specialists */}
      <div className="agents-grid">
        {filteredSpecialists.map(specialist => (
          <div key={specialist.id} className="agent-card">
            <div className="agent-card-header">
              <div className="agent-avatar">{specialist.avatar}</div>
              <div className="agent-identity">
                <div className="agent-name">{specialist.name}</div>
                <div className="agent-role">{specialist.role}</div>
              </div>
              <span className="agent-pillar-badge">{specialist.pillarLabel}</span>
            </div>

            <p className="agent-bio">{specialist.bio}</p>

            <div className="agent-tools-row">
              {specialist.tools.map((tool, idx) => (
                <span key={idx} className="agent-tool-tag">{tool}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
