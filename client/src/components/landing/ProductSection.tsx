import React, { useState } from 'react';
import { Icons } from '../common/Icons';

export const ProductSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stack' | 'governance' | 'mcp'>('stack');

  const capabilities = [
    {
      icon: <Icons.Target size={22} />,
      title: 'Campaign Strategist',
      role: 'Chief Marketing Officer',
      desc: 'Decomposes high-level growth objectives into structured multi-channel sprints with clear success criteria.',
      deliverables: ['Launch Roadmaps', 'GTM Positioning', 'Channel Allocation']
    },
    {
      icon: <Icons.Search size={22} />,
      title: 'Market Intelligence',
      role: 'Research & SEO Analyst',
      desc: 'Autonomously indexes competitor keywords, tracks organic search volume shifts, and identifies content gaps.',
      deliverables: ['SERP Keyword Maps', 'Competitor Teardowns', 'Backlink Audits']
    },
    {
      icon: <Icons.Sparkles size={22} />,
      title: 'Copy Architect',
      role: 'Conversion Copywriter',
      desc: 'Drafts high-converting landing pages, cold emails, and launch announcements strictly formatted to your brand tone.',
      deliverables: ['Landing Page Copy', 'Email Sequences', 'Product Hunt Launches']
    },
    {
      icon: <Icons.TrendingUp size={22} />,
      title: 'Growth Hacker',
      role: 'Acquisition Engineer',
      desc: 'Formulates rapid virality experiments, referral flywheels, and programmatic distribution tactics.',
      deliverables: ['A/B Test Frameworks', 'Referral Mechanics', 'Viral Loops']
    },
    {
      icon: <Icons.Zap size={22} />,
      title: 'Social Director',
      role: 'Audience & Community Lead',
      desc: 'Converts long-form engineering milestones into punchy Twitter/X threads, LinkedIn founder posts, and newsletters.',
      deliverables: ['X/Twitter Threads', 'Founder LinkedIn Posts', 'Weekly Bulletins']
    },
    {
      icon: <Icons.Shield size={22} />,
      title: 'Brand Sentinel',
      role: 'Quality & Voice Guard',
      desc: 'Runs automated tone-matching audits against your 7-layer memory to intercept fluff or off-brand outputs.',
      deliverables: ['Voice Verification', 'Fact Checking', 'Anti-Hallucination Gate']
    }
  ];

  return (
    <section className="landing-section" id="product-section">
      <div className="section-header" id="product">
        <span className="section-tag">Product Overview</span>
        <h2 className="section-title">An Entire Marketing Department in One Binary</h2>
        <p className="section-desc">
          Stop hiring fragmented agencies or copy-pasting prompts between disjointed chatbots. FoundryOS coordinates 6 specialized autonomous roles over your proprietary brand memory.
        </p>
      </div>

      {/* Product Feature Pillars */}
      <div className="product-grid">
        {capabilities.map((item, index) => (
          <div key={index} className="product-card">
            <div className="product-card-top">
              <div className="product-icon-wrap">{item.icon}</div>
              <span className="product-role-badge">{item.role}</span>
            </div>
            <h3 className="product-card-title">{item.title}</h3>
            <p className="product-card-desc">{item.desc}</p>
            <div className="product-deliverables">
              <span className="deliverable-label">Outputs:</span>
              <div className="deliverable-tags">
                {item.deliverables.map((d, i) => (
                  <span key={i} className="deliverable-tag">{d}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Deep-Dive Interactive Product Pillars */}
      <div className="product-deepdive-box">
        <div className="deepdive-tabs">
          <button
            className={`deepdive-tab ${activeTab === 'stack' ? 'active' : ''}`}
            onClick={() => setActiveTab('stack')}
          >
            End-to-End Autonomous Stack
          </button>
          <button
            className={`deepdive-tab ${activeTab === 'governance' ? 'active' : ''}`}
            onClick={() => setActiveTab('governance')}
          >
            Human-In-The-Loop Governance
          </button>
          <button
            className={`deepdive-tab ${activeTab === 'mcp' ? 'active' : ''}`}
            onClick={() => setActiveTab('mcp')}
          >
            Native MCP Tool Execution
          </button>
        </div>

        <div className="deepdive-content">
          {activeTab === 'stack' && (
            <div className="deepdive-panel">
              <div className="panel-text">
                <span className="panel-badge">Autonomous Workflow</span>
                <h4>Goal Ingestion to Executable Campaign</h4>
                <p>
                  FoundryOS takes your raw founder goal (e.g., "Prepare Product Hunt launch for v2.0") and decomposes it into parallel agent tickets. Market Intel conducts competitor analysis, Copy Architect writes the story, and Brand Sentinel enforces consistency.
                </p>
                <div className="panel-points">
                  <div className="point-item">
                    <Icons.Check size={14} />
                    <span>Zero prompt boilerplate re-entry</span>
                  </div>
                  <div className="point-item">
                    <Icons.Check size={14} />
                    <span>In-memory event bus coordination</span>
                  </div>
                  <div className="point-item">
                    <Icons.Check size={14} />
                    <span>Direct export to Markdown, PDF, and social drafts</span>
                  </div>
                </div>
              </div>
              <div className="panel-visual">
                <div className="stack-flow-node">
                  <span className="flow-num">1</span>
                  <div className="flow-info">
                    <strong>Founder Prompt</strong>
                    <span>High-level strategic milestone</span>
                  </div>
                </div>
                <div className="flow-connector" />
                <div className="stack-flow-node">
                  <span className="flow-num">2</span>
                  <div className="flow-info">
                    <strong>Memory Recall</strong>
                    <span>Queries 7 vector layers in SQLite</span>
                  </div>
                </div>
                <div className="flow-connector" />
                <div className="stack-flow-node active">
                  <span className="flow-num">3</span>
                  <div className="flow-info">
                    <strong>Swarm Execution</strong>
                    <span>Parallel tool calls & synthesis</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'governance' && (
            <div className="deepdive-panel">
              <div className="panel-text">
                <span className="panel-badge">Control & Safety</span>
                <h4>Deterministic Human-In-The-Loop Approvals</h4>
                <p>
                  FoundryOS never publishes, deploys, or spends without your explicit approval. Every critical action generates a clean diff card in the Approvals queue for one-click verification.
                </p>
                <div className="panel-points">
                  <div className="point-item">
                    <Icons.Check size={14} />
                    <span>One-click approve, edit, or reject</span>
                  </div>
                  <div className="point-item">
                    <Icons.Check size={14} />
                    <span>Side-by-side diff preview against brand policy</span>
                  </div>
                  <div className="point-item">
                    <Icons.Check size={14} />
                    <span>Immutable audit log for all generated artifacts</span>
                  </div>
                </div>
              </div>
              <div className="panel-visual">
                <div className="governance-card-preview">
                  <div className="gov-header">
                    <Icons.Shield size={16} />
                    <span>Approval Required: Product Launch Copy</span>
                  </div>
                  <div className="gov-body">
                    <code>+ "Eliminate agency bloat with 100% on-device AI."</code>
                    <p>Safety Check: 0 Hallucinations, Tone Match 98.4%</p>
                  </div>
                  <div className="gov-actions">
                    <span className="btn-mock-approve">Approve</span>
                    <span className="btn-mock-reject">Reject</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mcp' && (
            <div className="deepdive-panel">
              <div className="panel-text">
                <span className="panel-badge">Extensibility</span>
                <h4>Standard Model Context Protocol Integration</h4>
                <p>
                  Connect your live tools directly to your AI workforce. Using the Anthropic MCP specification, agents can crawl URLs, query search indexes, and generate production PDFs without proprietary glue code.
                </p>
                <div className="panel-points">
                  <div className="point-item">
                    <Icons.Check size={14} />
                    <span>Standardized JSON-RPC 2.0 communication</span>
                  </div>
                  <div className="point-item">
                    <Icons.Check size={14} />
                    <span>Schema-validated parameter guards</span>
                  </div>
                  <div className="point-item">
                    <Icons.Check size={14} />
                    <span>Sub-20ms in-memory server communication</span>
                  </div>
                </div>
              </div>
              <div className="panel-visual">
                <div className="mcp-servers-list">
                  <div className="server-item">
                    <span className="server-status-dot" />
                    <span className="server-name">Market Intel MCP</span>
                    <span className="server-tools">3 Tools</span>
                  </div>
                  <div className="server-item">
                    <span className="server-status-dot" />
                    <span className="server-name">Vector Brain Memory MCP</span>
                    <span className="server-tools">3 Tools</span>
                  </div>
                  <div className="server-item">
                    <span className="server-status-dot" />
                    <span className="server-name">Document & PDF Synthesizer</span>
                    <span className="server-tools">2 Tools</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
