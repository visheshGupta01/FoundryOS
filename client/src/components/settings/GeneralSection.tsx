import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Icons } from '../common/Icons';

export const GeneralSection: React.FC = () => {
  const { brainData, saveBrainData, setBrainData } = useApp();

  const [companyName, setCompanyName] = useState(brainData?.name || '');
  const [website, setWebsite] = useState(brainData?.website || '');
  const [oneLiner, setOneLiner] = useState(brainData?.oneLiner || '');
  const [founderName, setFounderName] = useState(() => localStorage.getItem('foundry_user_name') || '');
  const [founderEmail, setFounderEmail] = useState(() => localStorage.getItem('foundry_user_email') || '');
  const [executionRouting, setExecutionRouting] = useState<'auto' | 'manual'>('auto');
  const [steeringMode, setSteeringMode] = useState<'autonomous' | 'gated' | 'fastpath'>('autonomous');
  const [enableWebTools, setEnableWebTools] = useState(true);
  const [enableSemanticMemory, setEnableSemanticMemory] = useState(true);
  const [allowAiTraining, setAllowAiTraining] = useState<boolean>(() => {
    return localStorage.getItem('foundry_allow_ai_training') !== 'false';
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleToggleAiTraining = () => {
    setAllowAiTraining(prev => {
      const nextVal = !prev;
      localStorage.setItem('foundry_allow_ai_training', String(nextVal));
      return nextVal;
    });
  };

  useEffect(() => {
    if (brainData) {
      setCompanyName(brainData.name || '');
      setWebsite(brainData.website || '');
      setOneLiner(brainData.oneLiner || '');
    }
  }, [brainData]);

  const handleSaveCompany = async (e: React.FormEvent) => {
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
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>General</h2>
        <p style={styles.subtitle}>Configure core company identity, agent routing, and autonomous execution policies.</p>
      </div>

      {/* Company Identity Form */}
      <div style={styles.section}>
        <div style={styles.sectionHeaderRow}>
          <span style={styles.sectionHeader}>Company Essentials</span>
          {saveSuccess && (
            <span style={styles.savedPill}>
              <Icons.Check size={11} /> Saved to Brain
            </span>
          )}
        </div>
        <form onSubmit={handleSaveCompany} style={styles.card}>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Website / Product URL</label>
              <input
                type="text"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>One-Liner / Value Proposition</label>
            <input
              type="text"
              value={oneLiner}
              onChange={e => setOneLiner(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Founder Name</label>
              <input
                type="text"
                value={founderName}
                onChange={e => setFounderName(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Founder Email</label>
              <input
                type="email"
                value={founderEmail}
                onChange={e => setFounderEmail(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.formFooter}>
            <button
              type="submit"
              disabled={isSaving}
              style={styles.primaryBtn}
            >
              {isSaving ? 'Saving...' : 'Save Company Details'}
            </button>
          </div>
        </form>
      </div>

      {/* Execution Routing Mode */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>Agent Execution Routing</div>
        <div style={styles.routingCard}>
          <div style={styles.cardLeft}>
            <div style={styles.cardTitle}>Specialist Task Routing</div>
            <div style={styles.cardDesc}>Determine whether FoundryOS automatically selects the specialist agent or runs directly.</div>
          </div>
          <div style={styles.segmentedControl}>
            <button
              type="button"
              onClick={() => setExecutionRouting('auto')}
              style={{
                ...styles.segmentedBtn,
                ...(executionRouting === 'auto' ? styles.segmentedBtnActive : {})
              }}
            >
              Auto-Route
            </button>
            <button
              type="button"
              onClick={() => setExecutionRouting('manual')}
              style={{
                ...styles.segmentedBtn,
                ...(executionRouting === 'manual' ? styles.segmentedBtnActive : {})
              }}
            >
              Direct Selection
            </button>
          </div>
        </div>
      </div>

      {/* Autonomous Steering Mode */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>Autonomous Execution Mode</div>
        <div style={styles.sectionSubDesc}>Control the level of autonomy granted to AI employees across strategic teardowns.</div>
        <div style={styles.securityGrid}>
          {/* Autonomous */}
          <div
            onClick={() => setSteeringMode('autonomous')}
            style={{
              ...styles.securityCard,
              ...(steeringMode === 'autonomous' ? styles.securityCardActive : {})
            }}
          >
            <div style={styles.securityTitle}>Fully Autonomous</div>
            <div style={styles.securityDesc}>
              Agents autonomously synthesize market data, compare competitors, and draft GTM plans without pausing.
            </div>
          </div>

          {/* Gated */}
          <div
            onClick={() => setSteeringMode('gated')}
            style={{
              ...styles.securityCard,
              ...(steeringMode === 'gated' ? styles.securityCardActive : {})
            }}
          >
            <div style={styles.securityTitle}>Steering Gated (HITL)</div>
            <div style={styles.securityDesc}>
              Requires founder confirmation before publishing brand positioning or launching multi-channel campaigns.
            </div>
          </div>

          {/* Fast-Path */}
          <div
            onClick={() => setSteeringMode('fastpath')}
            style={{
              ...styles.securityCard,
              ...(steeringMode === 'fastpath' ? styles.securityCardActive : {})
            }}
          >
            <div style={styles.securityTitle}>Fast-Path Prioritized</div>
            <div style={styles.securityDesc}>
              Optimizes for zero-credit, sub-second responses on definitions, capability lookups, and status checks.
            </div>
          </div>
        </div>
      </div>

      {/* Realtime Telemetry & Plugins */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>Intelligence & Tools</div>
        <div style={styles.toggleCard}>
          <div style={styles.toggleRow}>
            <div style={styles.toggleTextGroup}>
              <div style={styles.cardTitle}>Real-Time Web Intelligence & Search</div>
              <div style={styles.cardDesc}>Allow employees to execute live Google/SearXNG queries and real-time market data pulls.</div>
            </div>
            <div
              onClick={() => setEnableWebTools(prev => !prev)}
              style={{
                ...styles.switch,
                ...(enableWebTools ? styles.switchOn : {})
              }}
            >
              <div style={{
                ...styles.switchKnob,
                ...(enableWebTools ? styles.switchKnobOn : {})
              }} />
            </div>
          </div>

          <div style={styles.divider} />

          <div style={styles.toggleRow}>
            <div style={styles.toggleTextGroup}>
              <div style={styles.cardTitle}>Company Brain Semantic Learning</div>
              <div style={styles.cardDesc}>Automatically commit validated takeaways, founder feedback, and market learnings into vector memory.</div>
            </div>
            <div
              onClick={() => setEnableSemanticMemory(prev => !prev)}
              style={{
                ...styles.switch,
                ...(enableSemanticMemory ? styles.switchOn : {})
              }}
            >
              <div style={{
                ...styles.switchKnob,
                ...(enableSemanticMemory ? styles.switchKnobOn : {})
              }} />
            </div>
          </div>

          <div style={styles.divider} />

          <div style={styles.toggleRow}>
            <div style={styles.toggleTextGroup}>
              <div style={styles.cardTitle}>Allow data to be used to train the AI for accurate answers</div>
              <div style={styles.cardDesc}>
                {allowAiTraining
                  ? 'Active: Workflow context and prompt sessions are securely leveraged to continuously fine-tune agent response accuracy.'
                  : 'Disabled: Private sovereign mode. No session data is retained or utilized for model training.'}
              </div>
            </div>
            <div
              onClick={handleToggleAiTraining}
              style={{
                ...styles.switch,
                ...(allowAiTraining ? styles.switchOn : {})
              }}
            >
              <div style={{
                ...styles.switchKnob,
                ...(allowAiTraining ? styles.switchKnobOn : {})
              }} />
            </div>
          </div>
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
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: '6px'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
    margin: 0
  },
  subtitle: {
    fontSize: '0.86rem',
    color: 'var(--text-secondary)',
    margin: 0,
    lineHeight: 1.4
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  sectionHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  sectionHeader: {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    letterSpacing: '-0.01em'
  },
  savedPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.70rem',
    color: 'var(--text-primary)',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '12px',
    padding: '2px 8px'
  },
  sectionSubDesc: {
    fontSize: '0.78rem',
    color: 'var(--text-tertiary)',
    marginTop: '-4px',
    marginBottom: '2px'
  },
  card: {
    background: 'var(--glass-bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '10px',
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  routingCard: {
    background: 'var(--glass-bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '10px',
    padding: '18px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap'
  },
  cardLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  cardTitle: {
    fontSize: '0.88rem',
    fontWeight: 500,
    color: 'var(--text-primary)'
  },
  cardDesc: {
    fontSize: '0.78rem',
    color: 'var(--text-tertiary)'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '0.76rem',
    fontWeight: 500,
    color: 'var(--text-secondary)'
  },
  input: {
    background: 'var(--glass-bg-input)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '6px',
    padding: '8px 12px',
    color: 'var(--text-primary)',
    fontSize: '0.82rem',
    outline: 'none',
    transition: 'border-color 0.15s ease'
  },
  formFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '6px'
  },
  primaryBtn: {
    padding: '7px 16px',
    background: 'var(--text-primary)',
    border: 'none',
    borderRadius: '6px',
    color: 'var(--bg-primary)',
    fontSize: '0.80rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.15s ease'
  },
  segmentedControl: {
    display: 'inline-flex',
    background: 'var(--glass-bg-input)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '8px',
    padding: '3px',
    gap: '2px',
    alignSelf: 'flex-start'
  },
  segmentedBtn: {
    padding: '6px 14px',
    fontSize: '0.78rem',
    fontWeight: 500,
    borderRadius: '6px',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  segmentedBtnActive: {
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    fontWeight: 600,
    border: '1px solid var(--border-subtle)'
  },
  securityGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px'
  },
  securityCard: {
    background: 'var(--glass-bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '10px',
    padding: '16px',
    cursor: 'pointer',
    transition: 'all 0.18s ease',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minHeight: '120px'
  },
  securityCardActive: {
    border: '1px solid var(--text-primary)',
    background: 'var(--bg-surface)'
  },
  securityTitle: {
    fontSize: '0.88rem',
    fontWeight: 600,
    color: 'var(--text-primary)'
  },
  securityDesc: {
    fontSize: '0.76rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.45
  },
  toggleCard: {
    background: 'var(--glass-bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '10px',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px'
  },
  toggleTextGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    flex: 1
  },
  divider: {
    height: '1px',
    background: 'var(--border-subtle)',
    width: '100%'
  },
  switch: {
    width: '40px',
    height: '22px',
    borderRadius: '11px',
    background: 'var(--border-subtle)',
    position: 'relative',
    cursor: 'pointer',
    transition: 'background 0.2s ease',
    flexShrink: 0
  },
  switchOn: {
    background: 'var(--text-primary)'
  },
  switchKnob: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    background: 'var(--text-primary)',
    position: 'absolute',
    top: '3px',
    left: '3px',
    transition: 'transform 0.2s ease'
  },
  switchKnobOn: {
    transform: 'translateX(18px)',
    background: 'var(--bg-primary)'
  }
};
