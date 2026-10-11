import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import type { BrainData } from '../../types';

export const BrainView: React.FC = () => {
  const { brainData, saveBrainData, brainHealth, demoProfiles, activeProfileId, applyDemoProfile } = useApp();
  const [formData, setFormData] = useState<BrainData>({ ...brainData });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    setFormData({ ...brainData });
  }, [brainData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus(null);
    const res = await saveBrainData(formData);
    setIsSaving(false);
    if (res.success) {
      setSaveStatus('Brain Context synchronized and injected into runtime memory.');
      setTimeout(() => setSaveStatus(null), 4000);
    } else {
      setSaveStatus(`Error saving: ${res.error}`);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Company Brain Context</h1>
          <p style={styles.subtitle}>
            FoundryOS agents read this single source of truth prior to every decision. Keep it updated to ensure high-fidelity deliverables.
          </p>
        </div>

        {/* Completeness Card */}
        <div style={styles.healthCard}>
          <div style={styles.healthTop}>
            <span style={styles.healthTitle}>Brain Completeness</span>
            <span style={styles.healthPercent}>{brainHealth.completenessPercent}%</span>
          </div>
          <div style={styles.track}>
            <div style={{ ...styles.fill, width: `${brainHealth.completenessPercent}%` }} />
          </div>
          <span style={styles.healthSubtext}>{brainHealth.configuredFields.length}/6 Core Fields Active</span>
        </div>
      </div>

      {saveStatus && (
        <div style={{ ...styles.statusBanner, ...(saveStatus.includes('Error') ? styles.errorBanner : styles.successBanner) }}>
          {saveStatus}
        </div>
      )}

      {/* Demo Startup Profile Switcher Banner */}
      {demoProfiles.length > 0 && (
        <div style={styles.demoBanner}>
          <div style={styles.demoBannerLeft}>
            <span style={styles.demoBadge}>DEMO PROFILES</span>
            <span style={styles.demoText}>Quick-load realistic startup contexts for instant product demos:</span>
          </div>
          <div style={styles.demoPills}>
            {demoProfiles.map((p) => {
              const isActive = p.id === activeProfileId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyDemoProfile(p.id)}
                  style={{
                    ...styles.demoPill,
                    ...(isActive ? styles.demoPillActive : {})
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{p.name}</span>
                  <span style={styles.demoIndustry}>({p.industry.split(' ')[0]})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={styles.contentGrid}>
        {/* Core Detail Form */}
        <form onSubmit={handleSubmit} style={styles.formCard}>
          <h2 style={styles.sectionTitle}>1. Company Core Architecture</h2>

          <div style={styles.formRow}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Company / Product Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                style={styles.input}
                placeholder="e.g. Acme AI"
                required
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Website / Domain</label>
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleChange}
                style={styles.input}
                placeholder="e.g. https://acme.ai"
              />
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>One-Liner Elevator Pitch</label>
            <textarea
              name="oneLiner"
              value={formData.oneLiner}
              onChange={handleChange}
              style={{ ...styles.input, minHeight: '60px' }}
              placeholder="What do you do, for whom, with what unique advantage?"
              required
            />
          </div>

          <div style={styles.formRow}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Ideal Customer Profile (ICP)</label>
              <textarea
                name="audience"
                value={formData.audience}
                onChange={handleChange}
                style={{ ...styles.input, minHeight: '70px' }}
                placeholder="Job titles, company stage, industry, tech stack..."
                required
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Core Pain Points Solved</label>
              <textarea
                name="problem"
                value={formData.problem}
                onChange={handleChange}
                style={{ ...styles.input, minHeight: '70px' }}
                placeholder="Why do customers urgently need this solution today?"
                required
              />
            </div>
          </div>

          <div style={styles.formRow}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Key Competitors</label>
              <input
                type="text"
                name="competitors"
                value={formData.competitors}
                onChange={handleChange}
                style={styles.input}
                placeholder="e.g. Legacy agencies, Zapier, Spreadsheets"
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Pricing & Business Model</label>
              <input
                type="text"
                name="pricing"
                value={formData.pricing}
                onChange={handleChange}
                style={styles.input}
                placeholder="e.g. Freemium with $99/mo Pro"
              />
            </div>
          </div>

          <div style={styles.formRow}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Brand Voice Tone</label>
              <input
                type="text"
                name="tone"
                value={formData.tone}
                onChange={handleChange}
                style={styles.input}
                placeholder="e.g. Confident, direct, authoritative, human"
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Tone to Avoid</label>
              <input
                type="text"
                name="avoidTone"
                value={formData.avoidTone}
                onChange={handleChange}
                style={styles.input}
                placeholder="e.g. Jargon, fluff, aggressive sales hype"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            style={styles.saveBtn}
          >
            {isSaving ? 'Syncing...' : 'Save & Sync Brain Memory'}
          </button>
        </form>

        {/* Agent Memory Directives & Live Context */}
        <div style={styles.sideCard}>
          <h2 style={styles.sectionTitle}>2. Active Memory & Directives</h2>
          <p style={styles.sideText}>
            Autonomous agents inject these core parameters into system prompts before generating strategy deliverables.
          </p>

          <div style={styles.directivesList}>
            <div style={styles.directiveCard}>
              <span style={styles.directiveLabel}>Target Audience (ICP)</span>
              <p style={styles.directiveValue}>{formData.audience || 'Not specified yet'}</p>
            </div>

            <div style={styles.directiveCard}>
              <span style={styles.directiveLabel}>Tone of Voice</span>
              <p style={styles.directiveValue}>{formData.tone || 'Founder-led, authoritative'}</p>
            </div>

            <div style={styles.directiveCard}>
              <span style={styles.directiveLabel}>Tone Avoidance & Guardrails</span>
              <p style={styles.directiveValue}>{formData.avoidTone || 'No generic fluff, buzzwords'}</p>
            </div>

            <div style={styles.directiveCard}>
              <span style={styles.directiveLabel}>Primary Business Goal</span>
              <p style={styles.directiveValue}>{formData.goal || 'Accelerate qualified pipeline'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '30px 40px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    overflowY: 'auto',
    height: 'calc(100vh - 60px)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '28px',
    gap: '24px'
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '2rem',
    fontWeight: 700,
    letterSpacing: '-0.03em',
    color: 'var(--text-primary)',
    marginBottom: '8px'
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.96rem',
    maxWidth: '680px',
    lineHeight: '1.5'
  },
  healthCard: {
    background: 'var(--glass-bg-card)',
    backdropFilter: 'var(--glass-blur)',
    WebkitBackdropFilter: 'var(--glass-blur)',
    border: '1px solid var(--glass-border-specular)',
    borderRadius: 'var(--radius-lg)',
    padding: '16px 20px',
    minWidth: '220px',
    boxShadow: 'var(--glass-inner-light)'
  },
  healthTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  healthTitle: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-primary)'
  },
  healthPercent: {
    fontSize: '0.88rem',
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
    color: 'var(--apple-accent)'
  },
  track: {
    height: '6px',
    background: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 'var(--radius-pill)',
    overflow: 'hidden',
    marginBottom: '6px'
  },
  fill: {
    height: '100%',
    background: '#ffffff',
    transition: 'width 0.4s var(--ease-apple)'
  },
  healthSubtext: {
    fontSize: '0.72rem',
    color: 'var(--text-tertiary)'
  },
  statusBanner: {
    padding: '12px 18px',
    borderRadius: 'var(--radius-pill)',
    fontSize: '0.86rem',
    fontWeight: 500,
    marginBottom: '20px'
  },
  successBanner: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    color: '#ffffff'
  },
  errorBanner: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    color: '#ffffff'
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '1.4fr 1fr',
    gap: '24px'
  },
  formCard: {
    background: 'var(--glass-bg-card)',
    backdropFilter: 'var(--glass-blur)',
    WebkitBackdropFilter: 'var(--glass-blur)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
    boxShadow: 'var(--glass-inner-light), var(--glass-shadow-sm)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  sideCard: {
    background: 'var(--glass-bg-card)',
    backdropFilter: 'var(--glass-blur)',
    WebkitBackdropFilter: 'var(--glass-blur)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
    boxShadow: 'var(--glass-inner-light), var(--glass-shadow-sm)',
    display: 'flex',
    flexDirection: 'column'
  },
  sectionTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.05rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '6px'
  },
  sideText: {
    fontSize: '0.84rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.45',
    marginBottom: '16px'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '14px'
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '0.76rem',
    fontWeight: 600,
    color: 'var(--text-secondary)'
  },
  input: {
    background: 'var(--glass-bg-input)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-md)',
    padding: '9px 12px',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.86rem',
    outline: 'none',
    transition: 'border-color var(--transition-fast)'
  },
  saveBtn: {
    marginTop: '10px',
    padding: '13px',
    background: '#ffffff',
    border: 'none',
    borderRadius: 'var(--radius-pill)',
    color: '#000000',
    fontWeight: 600,
    fontSize: '0.88rem',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(255, 255, 255, 0.2)',
    transition: 'all var(--transition-smooth)'
  },
  directivesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  directiveCard: {
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-sm)',
    padding: '12px 14px'
  },
  directiveLabel: {
    fontSize: '0.72rem',
    fontWeight: 600,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    display: 'block',
    marginBottom: '4px'
  },
  directiveValue: {
    fontSize: '0.84rem',
    color: 'var(--text-primary)',
    lineHeight: '1.45',
    margin: 0
  },
  demoBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 18px',
    background: 'rgba(99, 102, 241, 0.08)',
    border: '1px solid rgba(99, 102, 241, 0.22)',
    borderRadius: 'var(--radius-lg)',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px'
  },
  demoBannerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  demoBadge: {
    padding: '3px 8px',
    borderRadius: '4px',
    background: 'rgba(99, 102, 241, 0.25)',
    color: '#a5b4fc',
    fontSize: '0.66rem',
    fontWeight: 700,
    letterSpacing: '0.05em'
  },
  demoText: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)'
  },
  demoPills: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  demoPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '5px 10px',
    borderRadius: 'var(--radius-xs)',
    border: '1px solid var(--glass-border-subtle)',
    background: 'var(--glass-bg-surface)',
    color: 'var(--text-secondary)',
    fontSize: '0.74rem',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)'
  },
  demoPillActive: {
    background: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'var(--glass-border-specular)',
    color: 'var(--text-primary)'
  },
  demoIndustry: {
    fontSize: '0.66rem',
    color: 'var(--text-tertiary)'
  }
};
