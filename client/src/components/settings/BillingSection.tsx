import React, { useState } from 'react';
import { Icons } from '../common/Icons';

export const BillingSection: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [activePlan, setActivePlan] = useState<string>('pro');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const plans = [
    {
      id: 'starter',
      name: 'Free Starter',
      badge: 'Solo Testing',
      priceMonthly: 0,
      priceYearly: 0,
      description: 'Free forever for exploring autonomous AI and drafting initial startup marketing plans.',
      simpleBullets: [
        '50 AI tasks & chats per day',
        '3 Core AI Specialists (Research, Competitors, Voice)',
        '1 Saved Company Brain (product & customer details)',
        'Export strategy briefs as PDF & Markdown',
        'Standard execution speed'
      ],
      isPopular: false
    },
    {
      id: 'pro',
      name: 'Founder Pro',
      badge: 'MOST POPULAR FOR FOUNDERS',
      priceMonthly: 49,
      priceYearly: 39,
      description: 'Your complete autonomous marketing department. Run growth experiments without hiring an agency.',
      simpleBullets: [
        '500 AI tasks & chats per day',
        'All 5 Specialist AI Agents (Full Marketing Team)',
        'Real-time live web research & competitor tracking',
        'Connect Google Drive, Slack & Notion',
        'Review & approve actions before AI executes',
        'Unlimited Company Memory & audience profiles'
      ],
      isPopular: true
    },
    {
      id: 'enterprise',
      name: 'Team & Scale',
      badge: 'For Growing Startups',
      priceMonthly: 199,
      priceYearly: 159,
      description: 'Custom AI agent personas trained on your brand, shared team workspace, and priority speed.',
      simpleBullets: [
        'Unlimited daily AI tasks & zero queue wait',
        'Custom AI Specialist personas trained on your data',
        'Unlimited team members & shared workspace',
        'Private sovereign execution & custom API connectors',
        'Dedicated 1-on-1 strategy onboarding & priority support'
      ],
      isPopular: false
    }
  ];

  const comparisonRows = [
    { feature: 'Daily AI Tasks', starter: '50 / day', pro: '500 / day', enterprise: 'Unlimited' },
    { feature: 'Specialist AI Agents', starter: '3 Agents', pro: 'All 5 Agents', enterprise: 'Custom Personas' },
    { feature: 'Company Memory (Brain)', starter: '1 Profile', pro: 'Unlimited Profiles', enterprise: 'Multi-Tenant Vector' },
    { feature: 'Live Web & Competitor Intel', starter: 'Standard', pro: 'Real-Time Web Search', enterprise: 'Deep Autonomous Scrapes' },
    { feature: 'Connected Tools (Slack, Drive)', starter: 'View Only', pro: 'Full Read & Write Sync', enterprise: 'Custom MCP Bridges' },
    { feature: 'Human-in-the-Loop Review', starter: 'Basic', pro: 'Full Approval Gates', enterprise: 'Custom Multi-Approver' },
    { feature: 'Support & Onboarding', starter: 'Community', pro: 'Priority Email & Chat', enterprise: '1-on-1 Dedicated Lead' }
  ];

  const invoices = [
    { id: 'INV-2026-003', date: 'Oct 01, 2026', plan: 'Founder Pro Subscription (Monthly)', amount: '$49.00', status: 'Paid' },
    { id: 'INV-2026-002', date: 'Sep 01, 2026', plan: 'Founder Pro Subscription (Monthly)', amount: '$49.00', status: 'Paid' },
    { id: 'INV-2026-001', date: 'Aug 01, 2026', plan: 'Founder Pro Subscription (Monthly)', amount: '$49.00', status: 'Paid' }
  ];

  const handleSelectPlan = (planId: string, planName: string) => {
    setActivePlan(planId);
    setActionNotice(`Active plan switched to ${planName}. Allowance updated.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  return (
    <div style={styles.container}>
      <div style={styles.currentPlanBanner}>
        <div style={styles.planStatusLeft}>
          <div style={styles.statusPill}>
            <span style={styles.pulseDot} />
            <span style={styles.statusText}>ACTIVE SUBSCRIPTION</span>
          </div>
          <h3 style={styles.currentPlanTitle}>
            {plans.find(p => p.id === activePlan)?.name || 'Founder Pro'}
          </h3>
          <p style={styles.currentPlanDesc}>
            {activePlan === 'starter' && 'Basic testing tier active with 50 daily tasks and 3 specialist agents.'}
            {activePlan === 'pro' && 'Full autonomous marketing team active with 500 daily tasks, live web research, and approval gates.'}
            {activePlan === 'enterprise' && 'Scale enterprise active with unlimited allowance, custom trained personas, and priority speed.'}
          </p>
        </div>
        <div style={styles.planStatusRight}>
          <div style={styles.priceTag}>
            <span style={styles.priceNum}>
              ${activePlan === 'starter' ? 0 : activePlan === 'pro' ? (billingCycle === 'yearly' ? 39 : 49) : (billingCycle === 'yearly' ? 159 : 199)}
            </span>
            <span style={styles.pricePer}>/month</span>
          </div>
          <span style={styles.renewalText}>Next renewal: Nov 01, 2026</span>
        </div>
      </div>

      {actionNotice && (
        <div style={styles.noticeAlert}>
          <Icons.Check size={14} style={{ color: '#10b981' }} />
          <span>{actionNotice}</span>
        </div>
      )}

      <div style={styles.headerRow}>
        <div>
          <h4 style={styles.sectionHeading}>Choose Your Plan</h4>
          <p style={styles.sectionSubtitle}>Simple, transparent plans designed for founders running autonomous growth.</p>
        </div>

        <div style={styles.toggleWrapper}>
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            style={{
              ...styles.toggleBtn,
              ...(billingCycle === 'monthly' ? styles.toggleBtnActive : {})
            }}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('yearly')}
            style={{
              ...styles.toggleBtn,
              ...(billingCycle === 'yearly' ? styles.toggleBtnActive : {})
            }}
          >
            Annual <span style={styles.discountBadge}>Save 20%</span>
          </button>
        </div>
      </div>

      <div style={styles.plansGrid}>
        {plans.map(p => {
          const isCurrent = activePlan === p.id;
          const price = billingCycle === 'yearly' ? p.priceYearly : p.priceMonthly;

          return (
            <div
              key={p.id}
              style={{
                ...styles.planCard,
                ...(p.isPopular ? styles.planCardPopular : {}),
                ...(isCurrent ? styles.planCardSelected : {})
              }}
            >
              <div style={styles.cardHeaderArea}>
                <div style={styles.planNameRow}>
                  <h4 style={styles.planName}>{p.name}</h4>
                  <span style={{
                    ...styles.planTypeTag,
                    ...(p.isPopular ? styles.planTypeTagPopular : {})
                  }}>
                    {p.badge}
                  </span>
                </div>
                <p style={styles.planDesc}>{p.description}</p>
                <div style={styles.planPriceRow}>
                  <span style={styles.priceValue}>${price}</span>
                  <span style={styles.pricePeriod}>/month {billingCycle === 'yearly' && '(billed annually)'}</span>
                </div>
              </div>

              <div style={styles.featureList}>
                <span style={styles.featuresHeader}>What's included:</span>
                {p.simpleBullets.map((bullet, i) => (
                  <div key={i} style={styles.featureItem}>
                    <div style={styles.checkIconWrap}>
                      <Icons.Check size={13} style={{ color: '#38bdf8' }} />
                    </div>
                    <span style={styles.featureText}>{bullet}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleSelectPlan(p.id, p.name)}
                style={{
                  ...styles.planActionBtn,
                  ...(isCurrent ? styles.planCurrentBtn : p.isPopular ? styles.planPopularBtn : {})
                }}
              >
                {isCurrent ? 'Current Plan' : `Switch to ${p.name}`}
              </button>
            </div>
          );
        })}
      </div>

      <div style={styles.card}>
        <div style={styles.comparisonHeader}>
          <h4 style={styles.cardTitle}>Quick Plan Comparison</h4>
          <p style={styles.cardSubtitle}>Compare everyday capabilities side-by-side to find the right fit for your stage.</p>
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Capability</th>
                <th style={styles.th}>Free Starter</th>
                <th style={{ ...styles.th, color: 'var(--text-primary)' }}>Founder Pro (Most Popular)</th>
                <th style={styles.th}>Team & Scale</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, idx) => (
                <tr key={idx} style={styles.tr}>
                  <td style={styles.tdBold}>{row.feature}</td>
                  <td style={styles.tdMuted}>{row.starter}</td>
                  <td style={styles.tdHighlight}>{row.pro}</td>
                  <td style={styles.td}>{row.enterprise}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={styles.card}>
        <h4 style={styles.cardTitle}>Payment Method</h4>
        <div style={styles.paymentRow}>
          <div style={styles.cardPreview}>
            <div style={styles.cardBrand}>VISA</div>
            <div style={styles.cardLast4}>•••• •••• •••• 4242</div>
            <div style={styles.cardExpiry}>Expires 12/28</div>
          </div>
          <div style={styles.paymentInfo}>
            <div style={styles.primaryPaymentTag}>Primary Card for Subscription</div>
            <div style={styles.billingAddressText}>Billed to: Acme AI Inc, San Francisco, CA</div>
            <button
              type="button"
              onClick={() => alert('Payment method management portal will open in production.')}
              style={styles.managePaymentBtn}
            >
              Update Payment Method
            </button>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.invoiceHeaderRow}>
          <h4 style={styles.cardTitle}>Billing & Receipt History</h4>
          <span style={styles.invoiceCount}>{invoices.length} Invoices Available</span>
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Invoice</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Description</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} style={styles.tr}>
                  <td style={styles.tdMono}>{inv.id}</td>
                  <td style={styles.td}>{inv.date}</td>
                  <td style={styles.td}>{inv.plan}</td>
                  <td style={styles.tdBold}>{inv.amount}</td>
                  <td style={styles.td}>
                    <span style={styles.paidBadge}>{inv.status}</span>
                  </td>
                  <td style={styles.td}>
                    <button
                      type="button"
                      onClick={() => alert(`Downloading receipt for ${inv.id}`)}
                      style={styles.downloadBtn}
                    >
                      <Icons.FileText size={12} />
                      <span>PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    width: '100%'
  },
  currentPlanBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 28px',
    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(56, 189, 248, 0.08) 100%)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    borderRadius: 'var(--radius-md)',
    gap: '20px',
    flexWrap: 'wrap'
  },
  planStatusLeft: {
    flex: 1,
    minWidth: '280px'
  },
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '2px 8px',
    borderRadius: 'var(--radius-pill)',
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    marginBottom: '8px'
  },
  pulseDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#10b981'
  },
  statusText: {
    fontSize: '0.66rem',
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
    color: '#34d399',
    letterSpacing: '0.04em'
  },
  currentPlanTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.4rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: '0 0 6px 0'
  },
  currentPlanDesc: {
    fontSize: '0.86rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.45,
    margin: 0
  },
  planStatusRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px'
  },
  priceTag: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px'
  },
  priceNum: {
    fontFamily: 'var(--font-display)',
    fontSize: '2rem',
    fontWeight: 700,
    color: 'var(--text-primary)'
  },
  pricePer: {
    fontSize: '0.82rem',
    color: 'var(--text-tertiary)'
  },
  renewalText: {
    fontSize: '0.74rem',
    color: 'var(--text-tertiary)'
  },
  noticeAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: 'var(--radius-xs)',
    color: '#34d399',
    fontSize: '0.82rem'
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: '16px'
  },
  sectionHeading: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.2rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: '0 0 4px 0'
  },
  sectionSubtitle: {
    fontSize: '0.84rem',
    color: 'var(--text-tertiary)',
    margin: 0
  },
  toggleWrapper: {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-pill)',
    padding: '3px',
    gap: '2px'
  },
  toggleBtn: {
    padding: '6px 14px',
    borderRadius: 'var(--radius-pill)',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-tertiary)',
    fontSize: '0.78rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  toggleBtnActive: {
    background: 'var(--text-primary)',
    color: 'var(--bg-primary)',
    fontWeight: 700
  },
  discountBadge: {
    fontSize: '0.65rem',
    padding: '2px 6px',
    borderRadius: 'var(--radius-pill)',
    background: '#10b981',
    color: '#ffffff',
    fontWeight: 700
  },
  plansGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
    width: '100%'
  },
  planCard: {
    background: 'var(--glass-bg-card)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-md)',
    padding: '26px 22px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '20px',
    transition: 'all var(--transition-smooth)',
    boxShadow: 'var(--glass-shadow-sm)'
  },
  planCardPopular: {
    border: '1px solid rgba(56, 189, 248, 0.4)',
    background: 'linear-gradient(180deg, rgba(56, 189, 248, 0.04) 0%, var(--glass-bg-card) 100%)',
    boxShadow: '0 8px 28px rgba(56, 189, 248, 0.1)'
  },
  planCardSelected: {
    borderColor: 'var(--accent-primary)'
  },
  cardHeaderArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  planNameRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px'
  },
  planName: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.2rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0
  },
  planTypeTag: {
    fontSize: '0.68rem',
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: 'var(--radius-xs)',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--glass-border-subtle)',
    color: 'var(--text-secondary)'
  },
  planTypeTagPopular: {
    background: 'rgba(56, 189, 248, 0.15)',
    border: '1px solid rgba(56, 189, 248, 0.4)',
    color: '#38bdf8'
  },
  planDesc: {
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.45,
    margin: 0
  },
  planPriceRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px',
    marginTop: '6px'
  },
  priceValue: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.8rem',
    fontWeight: 700,
    color: 'var(--text-primary)'
  },
  pricePeriod: {
    fontSize: '0.78rem',
    color: 'var(--text-tertiary)'
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    flex: 1,
    padding: '12px 0',
    borderTop: '1px solid var(--glass-border-subtle)'
  },
  featuresHeader: {
    fontSize: '0.74rem',
    fontWeight: 600,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
  },
  featureItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px'
  },
  checkIconWrap: {
    marginTop: '2px',
    flexShrink: 0
  },
  featureText: {
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.4
  },
  planActionBtn: {
    width: '100%',
    padding: '10px 16px',
    borderRadius: 'var(--radius-xs)',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--glass-border-subtle)',
    color: 'var(--text-primary)',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all var(--transition-fast)'
  },
  planPopularBtn: {
    background: 'var(--accent-primary)',
    border: '1px solid var(--accent-primary)',
    color: 'var(--bg-primary)'
  },
  planCurrentBtn: {
    background: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'var(--border-active)',
    color: 'var(--text-primary)',
    cursor: 'default'
  },
  card: {
    background: 'var(--glass-bg-card)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-md)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    boxShadow: 'var(--glass-shadow-sm)'
  },
  cardTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    margin: 0
  },
  cardSubtitle: {
    fontSize: '0.82rem',
    color: 'var(--text-tertiary)',
    margin: 0
  },
  comparisonHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  tableWrapper: {
    overflowX: 'auto',
    width: '100%'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.82rem'
  },
  th: {
    textAlign: 'left',
    padding: '10px 14px',
    borderBottom: '1px solid var(--glass-border-subtle)',
    color: 'var(--text-tertiary)',
    fontWeight: 600,
    fontSize: '0.76rem',
    textTransform: 'uppercase',
    letterSpacing: '0.03em'
  },
  tr: {
    borderBottom: '1px solid var(--glass-border-subtle)'
  },
  td: {
    padding: '12px 14px',
    color: 'var(--text-secondary)'
  },
  tdBold: {
    padding: '12px 14px',
    fontWeight: 600,
    color: 'var(--text-primary)'
  },
  tdMuted: {
    padding: '12px 14px',
    color: 'var(--text-tertiary)'
  },
  tdHighlight: {
    padding: '12px 14px',
    color: '#38bdf8',
    fontWeight: 600
  },
  tdMono: {
    padding: '12px 14px',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.78rem',
    color: 'var(--text-tertiary)'
  },
  paidBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 'var(--radius-xs)',
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#34d399',
    fontSize: '0.72rem',
    fontWeight: 600
  },
  downloadBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 8px',
    borderRadius: 'var(--radius-xs)',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--glass-border-subtle)',
    color: 'var(--text-secondary)',
    fontSize: '0.74rem',
    cursor: 'pointer'
  },
  paymentRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    flexWrap: 'wrap'
  },
  cardPreview: {
    width: '200px',
    height: '115px',
    background: 'linear-gradient(135deg, #1e1e24 0%, #121217 100%)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-sm)',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxShadow: 'var(--glass-shadow-sm)'
  },
  cardBrand: {
    fontSize: '0.84rem',
    fontWeight: 800,
    letterSpacing: '0.08em',
    color: '#ffffff'
  },
  cardLast4: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    letterSpacing: '0.04em'
  },
  cardExpiry: {
    fontSize: '0.7rem',
    color: 'var(--text-tertiary)'
  },
  paymentInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  primaryPaymentTag: {
    fontSize: '0.84rem',
    fontWeight: 600,
    color: 'var(--text-primary)'
  },
  billingAddressText: {
    fontSize: '0.8rem',
    color: 'var(--text-tertiary)'
  },
  managePaymentBtn: {
    alignSelf: 'flex-start',
    padding: '7px 12px',
    borderRadius: 'var(--radius-xs)',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--glass-border-subtle)',
    color: 'var(--text-primary)',
    fontSize: '0.78rem',
    fontWeight: 500,
    cursor: 'pointer'
  },
  invoiceHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  invoiceCount: {
    fontSize: '0.76rem',
    color: 'var(--text-tertiary)'
  }
};
