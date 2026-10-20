import React from 'react';
import { BrainLogo } from '../common/BrainLogo';

export const AboutSection: React.FC = () => {
  const manifestoPoints = [
    {
      title: 'Zero Egress Privacy',
      desc: 'Your launch strategies, customer personas, and proprietary growth playbooks belong to your company. End-to-end encryption and SOC 2 compliant infrastructure means no third-party training on your confidential assets.'
    },
    {
      title: 'Persistent Memory, Never Amnesia',
      desc: 'Standard AI chats forget who you are every time you start a new conversation. FoundryOS embeds a 7-layer persistent Company Brain that remembers past campaigns, brand rules, and tone forever.'
    },
    {
      title: 'Autonomous Swarm, Not Lone Prompts',
      desc: 'Marketing is not a single prompt; it is a coordinated team of specialists. FoundryOS orchestrates researcher, copywriter, growth hacker, and brand guard over a high-speed event bus.'
    },
    {
      title: 'Deterministic Human Governance',
      desc: 'Autonomous does not mean uncontrollable. Every publish action, campaign send, or content export passes through explicit founder verification.'
    }
  ];

  return (
    <section className="landing-section" id="about-section">
      <div className="section-header" id="about">
        <span className="section-tag">About FoundryOS</span>
        <h2 className="section-title">Built for Founders Who Refuse to Compromise on Privacy or Speed</h2>
        <p className="section-desc">
          We built FoundryOS because founders spend too much capital on sluggish agency retainers and too many hours copy-pasting the same context into disjointed AI chats.
        </p>
      </div>

      <div className="about-manifesto-container">
        {/* Story Box */}
        <div className="about-story-box">
          <div className="about-story-header">
            <BrainLogo size={28} />
            <div>
              <h3>The AI Marketing Manifesto</h3>
              <span>Why the future of software runs on your hardware</span>
            </div>
          </div>
          <p className="about-story-body">
            Startups win by moving faster than incumbents. But modern marketing has become fragmented across costly agency retainers ($10k-$25k/mo) and dozens of disconnected AI subscriptions that leak proprietary strategic plans to cloud providers.
          </p>
          <p className="about-story-body">
            FoundryOS was created to give every founder a complete, coordinated marketing department powered by cutting-edge AI infrastructure. With native Model Context Protocol tooling and enterprise-grade security, you run an autonomous growth engine that scales with you.
          </p>
          <div className="about-quote">
            "Hire nobody. Launch everything. Keep 100% of your data private."
          </div>
        </div>

        {/* 4 Pillars Grid */}
        <div className="about-pillars-grid">
          {manifestoPoints.map((point, idx) => (
            <div key={idx} className="about-pillar-card">
              <span className="pillar-num">0{idx + 1}</span>
              <h4 className="pillar-title">{point.title}</h4>
              <p className="pillar-desc">{point.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Founder Metric Highlights */}
      <div className="about-metrics-strip">
        <div className="about-metric-item">
          <div className="metric-big-num">0.00 B/s</div>
          <div className="metric-caption">Proprietary Data Egress</div>
        </div>
        <div className="about-metric-item">
          <div className="metric-big-num">6</div>
          <div className="metric-caption">Autonomous AI Specialists</div>
        </div>
        <div className="about-metric-item">
          <div className="metric-big-num">7</div>
          <div className="metric-caption">Persistent Memory Layers</div>
        </div>
        <div className="about-metric-item">
          <div className="metric-big-num">100%</div>
          <div className="metric-caption">Deterministic Founder Control</div>
        </div>
      </div>
    </section>
  );
};
