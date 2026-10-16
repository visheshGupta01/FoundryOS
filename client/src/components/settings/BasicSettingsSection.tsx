import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Icons } from '../common/Icons';
import type { SettingsSectionType } from '../../types';

interface BasicSettingsSectionProps {
  onSwitchToAdvanced: (section?: SettingsSectionType) => void;
}

export const BasicSettingsSection: React.FC<BasicSettingsSectionProps> = ({ onSwitchToAdvanced }) => {
  const {
    brainData,
    saveBrainData,
    setBrainData,
    brainHealth,
    creditStatus,
    resetCredits,
    demoProfiles,
    activeProfileId,
    applyDemoProfile
  } = useApp();

  const [companyName, setCompanyName] = useState(brainData?.name || '');
  const [website, setWebsite] = useState(brainData?.website || '');
  const [founderName, setFounderName] = useState(() => localStorage.getItem('foundry_user_name') || '');
  const [founderEmail, setFounderEmail] = useState(() => localStorage.getItem('foundry_user_email') || '');
  const [oneLiner, setOneLiner] = useState(brainData?.oneLiner || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (brainData) {
      setCompanyName(brainData.name || '');
      setWebsite(brainData.website || '');
      setOneLiner(brainData.oneLiner || '');
    }
  }, [brainData]);

  const handleSaveBasic = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    localStorage.setItem('foundry_user_name', founderName);
    localStorage.setItem('foundry_user_email', founderEmail);

    const updated = {
      ...brainData,
      name: companyName,
      website,
      oneLiner
    };
    setBrainData(updated);
    await saveBrainData(updated);

    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const remaining = creditStatus?.remainingCredits ?? 100;
  const maxCredits = creditStatus?.maxDailyCredits ?? 100;
  const creditPercent = Math.min(100, Math.round((remaining / maxCredits) * 100));

  return (
    <div style={styles.container}>
      <div style={styles.dashboardGrid}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.headerTitleRow}>
              <Icons.User size={18} style={{ color: 'var(--text-primary)' }} />
              <h3 style={styles.cardTitle}>Company & Founder Essentials</h3>
            </div>
            {saveSuccess && (
              <span style={styles.saveBadge}>
                <Icons.Check size={12} /> Saved
              </span>
            )}
          </div>

          <form onSubmit={handleSaveBasic} style={styles.formContent}>
            <div style={styles.fieldGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder=""
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Website / URL</label>
                <input
                  type="text"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  placeholder=""
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Founder Name</label>
                <input
                  type="text"
                  value={founderName}
                  onChange={e => setFounderName(e.target.value)}
                  placeholder=""
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Founder Email</label>
                <input
                  type="email"
                  value={founderEmail}
                  onChange={e => setFounderEmail(e.target.value)}
                  placeholder=""
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.formGroupFull}>
              <label style={styles.label}>Core Value Proposition (One-Liner)</label>
              <textarea
                value={oneLiner}
                onChange={e => setOneLiner(e.target.value)}
                placeholder=""
                rows={2}
                style={styles.textarea}
              />
            </div>

            <div style={styles.actionRow}>
              <button type="submit" disabled={isSaving} style={styles.primaryBtn}>
                {isSaving ? 'Saving...' : 'Save Info'}
              </button>
            </div>
          </form>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.headerTitleRow}>
              <Icons.Zap size={18} style={{ color: '#818cf8' }} />
              <h3 style={styles.cardTitle}>Plan & Daily Usage</h3>
            </div>
            <span style={styles.planBadge}>Founder Pro</span>
          </div>

          <div style={styles.subContent}>
            <div style={styles.statusBox}>
              <div style={styles.statusRow}>
                <span style={styles.statusLabel}>Today's AI Allowance</span>
                <span style={styles.statusVal}>{creditPercent}% Available</span>
              </div>
              <div style={styles.progressBar}>
                <div style={{ ...styles.progressFill, width: `${creditPercent}%` }} />
              </div>
              <div style={styles.quotaMetaRow}>
                <span>Full AI marketing team enabled</span>
                <span>Refreshes daily</span>
              </div>
            </div>

            <div style={styles.planDetailsGrid}>
              <div style={styles.planItem}>
                <span style={styles.planItemLabel}>Plan</span>
                <span style={styles.planItemValue}>Founder Pro ($49/mo)</span>
              </div>
              <div style={styles.planItem}>
                <span style={styles.planItemLabel}>Specialist Agents</span>
                <span style={styles.planItemValue}>All 5 Specialists Active</span>
              </div>
            </div>

            <div style={styles.actionRow}>
              <button
                type="button"
                onClick={() => resetCredits()}
                style={styles.secondaryBtn}
              >
                Reset Daily Capacity
              </button>
              <button
                type="button"
                onClick={() => onSwitchToAdvanced('billing')}
                style={styles.subtleLinkBtn}
              >
                Change Plan or View Details →
              </button>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.headerTitleRow}>
              <Icons.Brain size={18} style={{ color: '#a78bfa' }} />
              <h3 style={styles.cardTitle}>Company Brain Health</h3>
            </div>
            <span style={styles.percentBadge}>{brainHealth.completenessPercent}% Complete</span>
          </div>

          <div style={styles.subContent}>
            <p style={styles.cardDesc}>
              Institutional context enables specialist agents to align every output with your brand rules, ICP, and positioning.
            </p>

            <div style={styles.presetSection}>
              <span style={styles.presetHeading}>Quick-Load Startup Preset:</span>
              <div style={styles.presetBtnRow}>
                {demoProfiles.map(p => {
                  const isCurrent = p.id === activeProfileId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => applyDemoProfile(p.id)}
                      style={{
                        ...styles.presetBtn,
                        ...(isCurrent ? styles.presetBtnActive : {})
                      }}
                    >
                      <span>{p.name}</span>
                      <span style={styles.presetTag}>{p.industry.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={styles.actionRow}>
              <button
                type="button"
                onClick={() => onSwitchToAdvanced('brain')}
                style={styles.subtleLinkBtn}
              >
                Configure Full Brain Context (6/6 Anchors) →
              </button>
            </div>
          </div>
        </div>

        <div style={{ ...styles.card, ...styles.advancedCalloutCard }}>
          <div style={styles.cardHeader}>
            <div style={styles.headerTitleRow}>
              <Icons.Settings size={18} style={{ color: 'var(--text-primary)' }} />
              <h3 style={styles.cardTitle}>Advanced Configuration Available</h3>
            </div>
          </div>

          <div style={styles.subContent}>
            <p style={styles.cardDesc}>
              Switch to Advanced Settings to configure deep vector RAG parameters, custom competitor matrices, model temperatures, fallback LLMs, and API security keys.
            </p>

            <div style={styles.advancedTagList}>
              <span style={styles.featurePill}>Vector Embeddings</span>
              <span style={styles.featurePill}>LLM Temperature</span>
              <span style={styles.featurePill}>Context Inspectors</span>
              <span style={styles.featurePill}>Model Routing</span>
              <span style={styles.featurePill}>Audit Logs</span>
            </div>

            <div style={styles.actionRow}>
              <button
                type="button"
                onClick={() => onSwitchToAdvanced()}
                style={styles.advancedSwitchBtn}
              >
                <span>Open Advanced Settings</span>
                <Icons.ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
    gap: '20px',
    width: '100%'
  },
  card: {
    background: 'var(--glass-bg-card)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-md)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '16px',
    boxShadow: 'var(--glass-shadow-sm)'
  },
  advancedCalloutCard: {
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
    border: '1px solid var(--glass-border-specular)'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    paddingBottom: '14px',
    borderBottom: '1px solid var(--glass-border-subtle)'
  },
  headerTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  cardTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    margin: 0
  },
  cardDesc: {
    fontSize: '0.84rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    margin: 0
  },
  saveBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.72rem',
    fontWeight: 600,
    color: '#34d399',
    background: 'rgba(52, 211, 153, 0.1)',
    padding: '2px 8px',
    borderRadius: 'var(--radius-xs)'
  },
  planBadge: {
    fontSize: '0.72rem',
    fontWeight: 600,
    color: '#818cf8',
    background: 'rgba(129, 140, 248, 0.12)',
    border: '1px solid rgba(129, 140, 248, 0.3)',
    padding: '3px 8px',
    borderRadius: 'var(--radius-xs)',
    letterSpacing: '0.02em'
  },
  percentBadge: {
    fontSize: '0.74rem',
    fontWeight: 600,
    fontFamily: 'var(--font-mono)',
    color: '#a78bfa',
    background: 'rgba(167, 139, 250, 0.12)',
    padding: '3px 8px',
    borderRadius: 'var(--radius-xs)'
  },
  formContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    flex: 1
  },
  fieldGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  formGroupFull: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-secondary)'
  },
  input: {
    padding: '8px 12px',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-xs)',
    color: 'var(--text-primary)',
    fontSize: '0.82rem',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color var(--transition-fast)'
  },
  textarea: {
    padding: '8px 12px',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-xs)',
    color: 'var(--text-primary)',
    fontSize: '0.82rem',
    fontFamily: 'inherit',
    outline: 'none',
    resize: 'vertical',
    lineHeight: 1.4
  },
  actionRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginTop: '6px'
  },
  primaryBtn: {
    padding: '8px 16px',
    background: 'var(--accent-primary)',
    color: 'var(--bg-primary)',
    border: 'none',
    borderRadius: 'var(--radius-xs)',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity var(--transition-fast)'
  },
  secondaryBtn: {
    padding: '7px 12px',
    background: 'var(--glass-bg-surface)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-xs)',
    fontSize: '0.78rem',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)'
  },
  subtleLinkBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    fontSize: '0.78rem',
    fontWeight: 500,
    cursor: 'pointer',
    padding: 0
  },
  advancedSwitchBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: 'var(--glass-bg-surface)',
    color: 'var(--text-primary)',
    border: '1px solid var(--glass-border-specular)',
    borderRadius: 'var(--radius-xs)',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all var(--transition-fast)'
  },
  subContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    flex: 1,
    justifyContent: 'space-between'
  },
  statusBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-xs)',
    padding: '12px 14px'
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  statusLabel: {
    fontSize: '0.76rem',
    color: 'var(--text-secondary)'
  },
  statusVal: {
    fontSize: '0.82rem',
    fontWeight: 600,
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-primary)'
  },
  progressBar: {
    width: '100%',
    height: '4px',
    background: 'var(--border-subtle)',
    borderRadius: 'var(--radius-pill)',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    background: '#818cf8',
    borderRadius: 'var(--radius-pill)',
    transition: 'width 0.3s ease'
  },
  quotaMetaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.68rem',
    color: 'var(--text-tertiary)'
  },
  planDetailsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px'
  },
  planItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    padding: '8px 10px',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-xs)'
  },
  planItemLabel: {
    fontSize: '0.7rem',
    color: 'var(--text-tertiary)'
  },
  planItemValue: {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--text-primary)'
  },
  presetSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  presetHeading: {
    fontSize: '0.74rem',
    fontWeight: 600,
    color: 'var(--text-secondary)'
  },
  presetBtnRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px'
  },
  presetBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '5px 10px',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-xs)',
    color: 'var(--text-secondary)',
    fontSize: '0.74rem',
    cursor: 'pointer'
  },
  presetBtnActive: {
    borderColor: '#a78bfa',
    background: 'rgba(167, 139, 250, 0.12)',
    color: 'var(--text-primary)',
    fontWeight: 600
  },
  presetTag: {
    fontSize: '0.62rem',
    padding: '1px 5px',
    borderRadius: 'var(--radius-pill)',
    background: 'rgba(255, 255, 255, 0.08)',
    color: 'var(--text-tertiary)'
  },
  advancedTagList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px'
  },
  featurePill: {
    fontSize: '0.7rem',
    padding: '3px 8px',
    borderRadius: 'var(--radius-xs)',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--glass-border-subtle)',
    color: 'var(--text-tertiary)'
  }
};
