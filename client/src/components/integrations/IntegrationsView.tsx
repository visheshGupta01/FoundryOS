import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Icons } from '../common/Icons';

export interface IntegrationDef {
  id: string;
  name: string;
  category: 'Communication' | 'Storage' | 'Productivity' | 'CRM' | 'Analytics' | 'AI Providers';
  description: string;
  badge: string;
  keyLabel: string;
  keyPlaceholder: string;
  keyHelp: string;
  secondaryLabel?: string;
  secondaryPlaceholder?: string;
  secondaryHelp?: string;
  docsUrl?: string;
}

const INTEGRATIONS_CATALOG: IntegrationDef[] = [
  {
    id: 'notion',
    name: 'Notion',
    category: 'Productivity',
    description: 'Bi-directional knowledge base synchronization. Export Company Brain context and campaign strategy cards into Notion workspaces.',
    badge: 'Knowledge Hub',
    keyLabel: 'Internal Integration Secret',
    keyPlaceholder: 'secret_...',
    keyHelp: 'Create an internal integration at notion.so/my-integrations and share your database.',
    secondaryLabel: 'Database ID or Page ID',
    secondaryPlaceholder: 'a1b2c3d4...',
    secondaryHelp: 'The 32-character ID found in your Notion database URL.',
    docsUrl: 'https://notion.so/my-integrations'
  },
  {
    id: 'github',
    name: 'GitHub',
    category: 'Productivity',
    description: 'Sync engineering release notes, trigger marketing changelogs from Git commits, and push documentation archives to repositories.',
    badge: 'Code & Changelogs',
    keyLabel: 'Personal Access Token',
    keyPlaceholder: 'ghp_... or github_pat_...',
    keyHelp: 'Settings > Developer settings > Personal access tokens with repo scope.',
    secondaryLabel: 'Target Repository',
    secondaryPlaceholder: 'organization/repository',
    secondaryHelp: 'Default repository identifier for documentation commits.',
    docsUrl: 'https://github.com/settings/tokens'
  },
  {
    id: 'linear',
    name: 'Linear',
    category: 'Productivity',
    description: 'Automatically convert AI employee marketing recommendations and GTM deliverables into actionable team backlog issues.',
    badge: 'Issue Tracking',
    keyLabel: 'Personal API Key',
    keyPlaceholder: 'lin_api_...',
    keyHelp: 'Generate an API key in Linear Settings > Account > API.',
    secondaryLabel: 'Team Key / Prefix',
    secondaryPlaceholder: 'MKT',
    secondaryHelp: 'The short team prefix (e.g. MKT, ENG) where tasks will be routed.',
    docsUrl: 'https://linear.app/settings/api'
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    category: 'CRM',
    description: 'Enrich lead pipeline intelligence, sync ICP audience segmentation rules, and calibrate conversion funnel bottlenecks.',
    badge: 'CRM & Pipeline',
    keyLabel: 'Private App Access Token',
    keyPlaceholder: 'pat-na1-...',
    keyHelp: 'Created under HubSpot Settings > Integrations > Private Apps with crm.objects scopes.',
    secondaryLabel: 'Portal / Hub ID',
    secondaryPlaceholder: '12345678',
    secondaryHelp: 'Your numeric HubSpot portal ID.',
    docsUrl: 'https://app.hubspot.com'
  },
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'Analytics',
    description: 'Calibrate CAC, LTV, and payback metrics with live revenue telemetry and churn rate data from your billing engine.',
    badge: 'Revenue Telemetry',
    keyLabel: 'Restricted API Key',
    keyPlaceholder: 'rk_live_... or rk_test_...',
    keyHelp: 'Create in Stripe Dashboard > Developers > API keys with read-only charges and subscriptions access.',
    secondaryLabel: 'Webhook Signing Secret',
    secondaryPlaceholder: 'whsec_...',
    secondaryHelp: 'Optional secret for live subscription change event listening.',
    docsUrl: 'https://dashboard.stripe.com/apikeys'
  },
  {
    id: 'openai',
    name: 'Custom LLM / OpenAI',
    category: 'AI Providers',
    description: 'Supply your own enterprise API key for dedicated foundation model inference, custom rate limits, and unmetered execution.',
    badge: 'Model Gateway',
    keyLabel: 'API Key',
    keyPlaceholder: 'sk-proj-... or custom API key',
    keyHelp: 'Provided by OpenAI Platform or your private LLM endpoint provider.',
    secondaryLabel: 'Base URL (Optional)',
    secondaryPlaceholder: 'https://api.openai.com/v1',
    secondaryHelp: 'Leave blank for standard OpenAI, or specify your proxy / compatible gateway.',
    docsUrl: 'https://platform.openai.com/api-keys'
  }
];

export const IntegrationsView: React.FC = () => {
  const {
    integrationsConfig,
    connectIntegration,
    disconnectIntegration,
    connectedIntegrationsCount
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeModal, setActiveModal] = useState<IntegrationDef | null>(null);

  const [modalKey, setModalKey] = useState('');
  const [modalSecondary, setModalSecondary] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const categories = ['All', 'Productivity', 'CRM', 'Analytics', 'AI Providers'];

  const getIsConnected = (item: IntegrationDef): boolean => {
    return !!integrationsConfig[item.id]?.connected;
  };

  const getConnectedDetails = (item: IntegrationDef) => {
    const config = integrationsConfig[item.id];
    if (config?.connected) {
      return {
        date: config.connectedAt ? new Date(config.connectedAt).toLocaleDateString() : 'Active',
        secondary: config.secondaryValue
      };
    }
    return null;
  };

  const handleOpenModal = (item: IntegrationDef) => {
    setActiveModal(item);
    const existing = integrationsConfig[item.id];
    setModalKey(existing?.apiKey || '');
    setModalSecondary(existing?.secondaryValue || '');
    setShowKey(false);
    setTestResult(null);
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setModalKey('');
    setModalSecondary('');
    setShowKey(false);
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    if (!modalKey.trim()) {
      setTestResult({ ok: false, message: `Please enter a valid ${activeModal?.keyLabel || 'API key'} first.` });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      if (modalKey.trim().length < 8) {
        setTestResult({ ok: false, message: 'Key appears malformed or too short. Please verify.' });
      } else {
        setTestResult({ ok: true, message: `Credential handshake simulated successfully for ${activeModal?.name}.` });
      }
    } catch {
      setTestResult({ ok: false, message: 'Connection test failed. Check your network or credentials.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModal) return;
    if (!modalKey.trim()) {
      setTestResult({ ok: false, message: `${activeModal.keyLabel} is required to connect.` });
      return;
    }
    setIsSaving(true);
    try {
      await connectIntegration(activeModal.id, modalKey, modalSecondary || undefined);
      handleCloseModal();
    } catch (err) {
      setTestResult({ ok: false, message: String(err) });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async (id: string) => {
    if (window.confirm(`Disconnect ${activeModal?.name || 'this integration'}? AI employees will no longer have access.`)) {
      await disconnectIntegration(id);
      handleCloseModal();
    }
  };

  const filteredIntegrations = INTEGRATIONS_CATALOG.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const renderIcon = (id: string) => {
    switch (id) {
      case 'github':
        return <Icons.Wrench size={20} />;
      case 'notion':
        return <Icons.FileText size={20} />;
      case 'linear':
        return <Icons.Target size={20} />;
      case 'hubspot':
        return <Icons.Users size={20} />;
      case 'stripe':
        return <Icons.TrendingUp size={20} />;
      case 'openai':
        return <Icons.Sparkles size={20} />;
      default:
        return <Icons.Link size={20} />;
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTopRow}>
          <div style={styles.badgePill}>
            <Icons.Shield size={12} />
            <span>SECURE VAULT • ZERO SECRETS STORED REMOTELY</span>
          </div>
          <div style={styles.statsPill}>
            <span style={styles.activeDot} />
            <span>{connectedIntegrationsCount} Connected Integrations</span>
          </div>
        </div>

        <h1 style={styles.title}>Workspace Integrations</h1>
        <p style={styles.subtitle}>
          Connect your team's tools to empower FoundryOS AI employees with real-time data feeds, automated task routing, and cloud sync.
          All credentials are encrypted client-side in your secure local session.
        </p>

        {/* Filter & Search Bar */}
        <div style={styles.controlsBar}>
          <div style={styles.categoryPills}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  ...styles.catButton,
                  backgroundColor: selectedCategory === cat ? 'var(--text-primary)' : 'var(--glass-bg-surface)',
                  color: selectedCategory === cat ? 'var(--bg-primary)' : 'var(--text-secondary)',
                  borderColor: selectedCategory === cat ? 'var(--text-primary)' : 'var(--border-subtle)',
                  fontWeight: selectedCategory === cat ? 600 : 500
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={styles.searchWrapper}>
            <Icons.Search size={14} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search integrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>
      </div>

      {/* Grid of Integration Cards */}
      <div style={styles.grid}>
        {filteredIntegrations.map((item) => {
          const isConnected = getIsConnected(item);
          const details = getConnectedDetails(item);

          return (
            <div
              key={item.id}
              style={{
                ...styles.card,
                borderColor: isConnected ? 'rgba(52, 211, 153, 0.3)' : 'var(--border-subtle)'
              }}
            >
              <div style={styles.cardHeader}>
                <div style={styles.brandRow}>
                  <div style={styles.iconWrapper}>
                    {renderIcon(item.id)}
                  </div>
                  <div>
                    <h3 style={styles.cardTitle}>{item.name}</h3>
                    <span style={styles.cardCategory}>{item.badge}</span>
                  </div>
                </div>

                <div
                  style={{
                    ...styles.statusTag,
                    backgroundColor: isConnected ? 'rgba(52, 211, 153, 0.1)' : 'var(--glass-bg-surface)',
                    borderColor: isConnected ? 'rgba(52, 211, 153, 0.25)' : 'var(--border-subtle)',
                    color: isConnected ? '#34d399' : 'var(--text-tertiary)'
                  }}
                >
                  <span
                    style={{
                      ...styles.statusDot,
                      backgroundColor: isConnected ? '#34d399' : '#6b7280'
                    }}
                  />
                  <span>{isConnected ? 'Connected' : 'Available'}</span>
                </div>
              </div>

              <p style={styles.cardDesc}>{item.description}</p>

              {isConnected && details && (
                <div style={styles.cardMeta}>
                  {details.secondary && (
                    <span style={styles.metaItem}>
                      Target: <strong>{details.secondary}</strong>
                    </span>
                  )}
                  <span style={styles.metaItem}>
                    Active since: <strong>{details.date}</strong>
                  </span>
                </div>
              )}

              <div style={styles.cardFooter}>
                <button
                  type="button"
                  onClick={() => handleOpenModal(item)}
                  style={{
                    ...styles.actionBtn,
                    backgroundColor: isConnected ? 'var(--glass-bg-surface)' : 'var(--accent-primary)',
                    color: isConnected ? 'var(--text-primary)' : 'var(--bg-primary)',
                    borderColor: isConnected ? 'var(--border-subtle)' : 'var(--accent-primary)'
                  }}
                >
                  {isConnected ? (
                    <>
                      <Icons.Wrench size={13} />
                      <span>Configure</span>
                    </>
                  ) : (
                    <>
                      <Icons.Key size={13} />
                      <span>Connect</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Connect / Configure Modal Popup */}
      {activeModal && (
        <div style={styles.modalOverlay} onClick={handleCloseModal}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={styles.modalHeader}>
              <div style={styles.modalTitleGroup}>
                <div style={styles.modalIconWrap}>
                  {renderIcon(activeModal.id)}
                </div>
                <div>
                  <h2 style={styles.modalTitle}>Connect {activeModal.name}</h2>
                  <span style={styles.modalSub}>{activeModal.category} • {activeModal.badge}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                style={styles.modalCloseBtn}
                title="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveConnection} style={styles.modalForm}>
              <p style={styles.modalDesc}>{activeModal.description}</p>

              <div style={styles.securityBanner}>
                <Icons.Lock size={14} style={{ color: '#34d399', flexShrink: 0 }} />
                <span>
                  Credentials are encrypted client-side in your secure browser session. FoundryOS never logs or shares external API tokens.
                </span>
              </div>

              {/* Primary Key Input */}
              <div style={styles.inputGroup}>
                <div style={styles.labelRow}>
                  <label style={styles.label}>{activeModal.keyLabel} (Required)</label>
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    style={styles.toggleVisibilityBtn}
                  >
                    {showKey ? <Icons.EyeOff size={13} /> : <Icons.Eye size={13} />}
                    <span>{showKey ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <input
                  type={showKey ? 'text' : 'password'}
                  placeholder={activeModal.keyPlaceholder}
                  value={modalKey}
                  onChange={(e) => setModalKey(e.target.value)}
                  style={styles.input}
                  autoFocus
                />
                <span style={styles.inputHint}>{activeModal.keyHelp}</span>
              </div>

              {/* Secondary Input if defined */}
              {activeModal.secondaryLabel && (
                <div style={styles.inputGroup}>
                  <label style={styles.label}>{activeModal.secondaryLabel}</label>
                  <input
                    type="text"
                    placeholder={activeModal.secondaryPlaceholder}
                    value={modalSecondary}
                    onChange={(e) => setModalSecondary(e.target.value)}
                    style={styles.input}
                  />
                  {activeModal.secondaryHelp && (
                    <span style={styles.inputHint}>{activeModal.secondaryHelp}</span>
                  )}
                </div>
              )}

              {/* Test Status Banner */}
              {testResult && (
                <div
                  style={{
                    ...styles.feedbackBox,
                    backgroundColor: testResult.ok ? 'rgba(52, 211, 153, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                    borderColor: testResult.ok ? 'rgba(52, 211, 153, 0.25)' : 'rgba(239, 68, 68, 0.25)',
                    color: testResult.ok ? '#34d399' : '#f87171'
                  }}
                >
                  {testResult.ok ? <Icons.Check size={14} /> : <Icons.AlertCircle size={14} />}
                  <span>{testResult.message}</span>
                </div>
              )}

              {/* Modal Action Buttons */}
              <div style={styles.modalFooter}>
                <div style={styles.modalLeftActions}>
                  {getIsConnected(activeModal) && (
                    <button
                      type="button"
                      onClick={() => handleDisconnect(activeModal.id)}
                      style={styles.disconnectBtn}
                    >
                      <Icons.Trash size={13} />
                      <span>Disconnect</span>
                    </button>
                  )}
                </div>

                <div style={styles.modalRightActions}>
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    style={styles.testBtn}
                  >
                    {isTesting ? 'Verifying...' : 'Test Key'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    style={styles.saveBtn}
                  >
                    {isSaving ? 'Saving...' : getIsConnected(activeModal) ? 'Update Connection' : 'Save & Connect'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '32px 40px 80px 40px',
    maxWidth: '1280px',
    margin: '0 auto',
    color: 'var(--text-primary)',
    width: '100%',
    flex: 1,
    minHeight: 0,
    height: '100%',
    overflowY: 'auto',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '28px'
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  headerTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap'
  },
  badgePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 10px',
    borderRadius: '12px',
    border: '1px solid var(--border-subtle)',
    backgroundColor: 'var(--glass-bg-card)',
    fontSize: '11px',
    letterSpacing: '0.04em',
    color: 'var(--text-secondary)'
  },
  statsPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '12px',
    border: '1px solid rgba(52, 211, 153, 0.25)',
    backgroundColor: 'rgba(52, 211, 153, 0.05)',
    fontSize: '12px',
    color: '#34d399',
    fontWeight: 500
  },
  activeDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#34d399'
  },
  title: {
    fontSize: '26px',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    margin: 0,
    color: 'var(--text-primary)'
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    margin: 0,
    maxWidth: '820px'
  },
  controlsBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    marginTop: '12px',
    flexWrap: 'wrap'
  },
  categoryPills: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap'
  },
  catButton: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid var(--border-subtle)',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  searchWrapper: {
    position: 'relative',
    minWidth: '240px'
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-tertiary)',
    pointerEvents: 'none'
  },
  searchInput: {
    width: '100%',
    padding: '7px 12px 7px 34px',
    backgroundColor: 'var(--glass-bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '6px',
    color: 'var(--text-primary)',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: '18px'
  },
  card: {
    backgroundColor: 'var(--glass-bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '10px',
    padding: '22px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    transition: 'border-color 0.2s ease, transform 0.2s ease',
    boxSizing: 'border-box'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px'
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  iconWrapper: {
    width: '38px',
    height: '38px',
    borderRadius: '8px',
    backgroundColor: 'var(--glass-bg-surface)',
    border: '1px solid var(--border-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-primary)',
    flexShrink: 0
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: 600,
    margin: 0,
    color: 'var(--text-primary)'
  },
  cardCategory: {
    fontSize: '12px',
    color: 'var(--text-tertiary)'
  },
  statusTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '3px 8px',
    borderRadius: '6px',
    border: '1px solid var(--border-subtle)',
    fontSize: '11px',
    fontWeight: 500
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%'
  },
  cardDesc: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: 1.45,
    margin: 0,
    flexGrow: 1
  },
  cardMeta: {
    padding: '8px 12px',
    borderRadius: '6px',
    backgroundColor: 'var(--glass-bg-surface)',
    border: '1px solid var(--border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '11px',
    color: 'var(--text-tertiary)'
  },
  metaItem: {
    lineHeight: 1.4
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: '6px'
  },
  actionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 14px',
    borderRadius: '6px',
    border: '1px solid var(--border-subtle)',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'opacity 0.15s ease'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modalCard: {
    backgroundColor: 'var(--glass-bg-modal)',
    border: '1px solid var(--glass-border-specular)',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '540px',
    boxShadow: 'var(--glass-shadow-md)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid var(--glass-border-subtle)'
  },
  modalTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  modalIconWrap: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: 'var(--glass-bg-surface)',
    border: '1px solid var(--border-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-primary)'
  },
  modalTitle: {
    fontSize: '17px',
    fontWeight: 600,
    margin: 0,
    color: 'var(--text-primary)'
  },
  modalSub: {
    fontSize: '12px',
    color: 'var(--text-tertiary)'
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px'
  },
  modalForm: {
    padding: '22px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px'
  },
  modalDesc: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: 1.45,
    margin: 0
  },
  securityBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    borderRadius: '6px',
    border: '1px solid rgba(52, 211, 153, 0.2)',
    backgroundColor: 'rgba(52, 211, 153, 0.04)',
    fontSize: '12px',
    color: 'var(--text-secondary)',
    lineHeight: 1.4
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  labelRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  label: {
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--text-primary)'
  },
  toggleVisibilityBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    background: 'none',
    border: 'none',
    color: 'var(--text-tertiary)',
    fontSize: '11px',
    cursor: 'pointer',
    padding: 0
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    backgroundColor: 'var(--glass-bg-input)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    fontSize: '13px',
    fontFamily: 'monospace',
    outline: 'none',
    boxSizing: 'border-box'
  },
  inputHint: {
    fontSize: '11px',
    color: 'var(--text-tertiary)'
  },
  feedbackBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    borderRadius: '6px',
    border: '1px solid',
    fontSize: '12px'
  },
  modalFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '8px',
    gap: '12px'
  },
  modalLeftActions: {
    display: 'flex',
    alignItems: 'center'
  },
  modalRightActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  disconnectBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '6px',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    color: '#f87171',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer'
  },
  testBtn: {
    padding: '8px 14px',
    borderRadius: '8px',
    border: '1px solid var(--border-subtle)',
    backgroundColor: 'var(--glass-bg-surface)',
    color: 'var(--text-primary)',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  saveBtn: {
    padding: '8px 18px',
    borderRadius: '8px',
    border: '1px solid var(--accent-primary)',
    backgroundColor: 'var(--accent-primary)',
    color: 'var(--bg-primary)',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  }
};
