import React, { useState } from 'react';
import { Icons } from '../common/Icons';

interface PricingSectionProps {
  onLaunch: () => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onLaunch }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  const tiers = [
    {
      name: 'Starter',
      tag: '100% Free Forever',
      badge: 'Free Tier',
      price: '$0',
      period: 'forever',
      desc: 'Launch your autonomous AI marketing workspace instantly. Zero cost, full power.',
      features: [
        'Enterprise-grade data encryption',
        'All 6 autonomous marketing roles',
        '7-Layer persistent vector memory',
        'Standard MCP tool integrations',
        'Deterministic Human-In-The-Loop approvals',
        'Unlimited runs & prompts',
        'Community Discord & support'
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
        'Everything in Starter',
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
      desc: 'Dedicated deployment for regulated companies requiring custom fine-tuned models and team RBAC.',
      features: [
        'Everything in Founder Pro',
        'Private VPC / dedicated cloud installation',
        'Custom brand-voice LoRA fine-tuning',
        'Multi-seat role-based access control (RBAC)',
        'SOC 2 Type II audit logging & compliance',
        'Custom MCP server integrations & API webhooks',
        'Dedicated solutions engineer & 99.9% uptime SLA'
      ],
      ctaText: 'Launch Enterprise',
      popular: false,
      onAction: onLaunch
    }
  ];

  return (
    <section className="landing-section" id="pricing-section">
      <div className="section-header" id="pricing">
        <span className="section-tag">Founder Pricing</span>
        <h2 className="section-title">Transparent, Predictable Founder Economics</h2>
        <p className="section-desc">
          Start free with the full platform, or upgrade to Pro for cloud memory sync and multi-model orchestration. No surprise token bills.
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
