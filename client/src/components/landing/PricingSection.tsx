import React, { useState } from 'react';
import { Icons } from '../common/Icons';

interface PricingSectionProps {
  onLaunch: () => void;
  onSignIn: () => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onLaunch, onSignIn }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  const tiers = [
    {
      name: 'Community Local',
      tag: '100% Free Forever',
      badge: 'Open Source',
      price: '$0',
      period: 'forever',
      desc: 'Run autonomous AI marketing directly on your local device with Ollama. Zero cost, zero data leaks.',
      features: [
        '100% Private local Ollama inference',
        'All 6 autonomous marketing roles',
        '7-Layer persistent SQLite vector memory',
        'Standard MCP tool integrations',
        'Deterministic Human-In-The-Loop approvals',
        'Unlimited local runs & prompts',
        'Community Discord & GitHub support'
      ],
      ctaText: 'Launch Free Workspace',
      popular: false,
      onAction: onLaunch
    },
    {
      name: 'Founder Pro',
      tag: 'Most Popular',
      badge: 'Recommended',
      price: billingCycle === 'annual' ? '$39' : '$49',
      period: '/ month',
      desc: 'For high-velocity founders needing cloud memory sync, multi-model fallback, and scheduled reports.',
      features: [
        'Everything in Community Local',
        'Hybrid cloud vector backup & sync',
        'Multi-model fallback (Claude 3.5 & GPT-4o)',
        'Automated weekly executive growth memos',
        'Live SERP scraping & competitor alerts',
        'Document Archive & multi-format PDF export',
        'Priority founder support & early features'
      ],
      ctaText: 'Start Founder Pro',
      popular: true,
      onAction: onLaunch
    },
    {
      name: 'Air-Gapped Enterprise',
      tag: 'Custom Deployment',
      badge: 'Dedicated',
      price: 'Custom',
      period: 'billed annually',
      desc: 'Dedicated on-premise deployment for regulated companies requiring custom fine-tuned weights and team RBAC.',
      features: [
        'Everything in Founder Pro',
        'Air-gapped VPC / on-premise installation',
        'Custom brand-voice LoRA fine-tuning',
        'Multi-seat role-based access control (RBAC)',
        'SOC 2 Type II audit logging & compliance',
        'Custom MCP server integrations & API webhooks',
        'Dedicated solutions engineer & 99.9% uptime SLA'
      ],
      ctaText: 'Contact Enterprise',
      popular: false,
      onAction: onSignIn
    }
  ];

  return (
    <section className="landing-section" id="pricing-section">
      <div className="section-header" id="pricing">
        <span className="section-tag">Founder Pricing</span>
        <h2 className="section-title">Transparent, Predictable Founder Economics</h2>
        <p className="section-desc">
          Run 100% free locally on your own hardware, or upgrade to Pro for cloud memory sync and multi-model fallback. No surprise token bills.
        </p>
      </div>

      {/* Annual / Monthly Toggle */}
      <div className="pricing-toggle-wrap">
        <button
          className={`pricing-toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
          onClick={() => setBillingCycle('monthly')}
        >
          Monthly
        </button>
        <button
          className={`pricing-toggle-btn ${billingCycle === 'annual' ? 'active' : ''}`}
          onClick={() => setBillingCycle('annual')}
        >
          <span>Annual Billing</span>
          <span className="pricing-save-badge">Save 20%</span>
        </button>
      </div>

      {/* Pricing Cards Grid */}
      <div className="pricing-grid">
        {tiers.map((tier, idx) => (
          <div key={idx} className={`pricing-card ${tier.popular ? 'popular' : ''}`}>
            {tier.popular && <div className="popular-badge">Founders' Choice</div>}
            
            <div className="pricing-card-header">
              <span className="pricing-badge">{tier.badge}</span>
              <h3 className="pricing-name">{tier.name}</h3>
              <p className="pricing-desc">{tier.desc}</p>
            </div>

            <div className="pricing-price-box">
              <span className="pricing-amount">{tier.price}</span>
              <span className="pricing-period">{tier.period}</span>
            </div>

            <button
              className={`pricing-cta ${tier.popular ? 'cta-primary' : 'cta-secondary'}`}
              onClick={tier.onAction}
            >
              <span>{tier.ctaText}</span>
              <Icons.ChevronRight size={14} />
            </button>

            <div className="pricing-features-list">
              <span className="features-title">What is included:</span>
              {tier.features.map((feat, fIdx) => (
                <div key={fIdx} className="feature-item">
                  <Icons.Check size={14} style={{ color: 'var(--text-primary)', flexShrink: 0 }} />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
