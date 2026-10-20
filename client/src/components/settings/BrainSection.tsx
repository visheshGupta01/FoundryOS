import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Icons } from '../common/Icons';
import type { BrainData } from '../../types';

export const BrainSection: React.FC = () => {
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
      <div style={styles.healthBanner}>
        <div style={styles.healthInfo}>
          <div style={styles.healthTag}>
            <Icons.Brain size={14} style={{ color: '#a78bfa' }} />
            <span>COMPANY BRAIN KNOWLEDGE GRAPH</span>
          </div>
          <h3 style={styles.healthTitle}>FoundryOS Strategic Knowledge Base</h3>
          <p style={styles.healthDesc}>
            FoundryOS agents inspect this verified corporate context before generating marketing strategies, landing copy, or running competitor audits.
          </p>
        </div>

        <div style={styles.completenessBox}>
          <div style={styles.completenessTop}>
            <span style={styles.completenessLabel}>Completeness Score</span>
            <span style={styles.completenessPercent}>{brainHealth.completenessPercent}%</span>
          </div>
          <div style={styles.track}>
            <div style={{ ...styles.fill, width: `${brainHealth.completenessPercent}%` }} />
          </div>
          <span style={styles.completenessSubtext}>
            {brainHealth.configuredFields.length} Anchors • {brainHealth.docCount || 0} Vault Docs • {brainHealth.memoryCount || 0} Sessions & Learnings
          </span>
        </div>
      </div>

      {saveStatus && (
        <div style={{ ...styles.statusBanner, ...(saveStatus.includes('Error') ? styles.errorBanner : styles.successBanner) }}>
          <Icons.Check size={14} />
          <span>{saveStatus}</span>
        </div>
      )}

      {demoProfiles.length > 0 && (
        <div style={styles.card}>
          <div style={styles.profileRow}>
            <div>
              <h4 style={styles.cardTitle}>Quick-Load Startup Profile Context</h4>
              <p style={styles.cardSubtitle}>
                Load realistic ICP, positioning, and competitor data into your brain context instantly.
              </p>
            </div>
            <div style={styles.presetButtons}>
              {demoProfiles.map(p => {
                const isActive = activeProfileId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyDemoProfile(p.id)}
                    style={{
                      ...styles.presetBtn,
                      ...(isActive ? styles.presetBtnActive : {})
                    }}
                  >
                    <span>{p.name}</span>
                    <span style={styles.presetIndustry}>{p.industry.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.formCard}>
        <div style={styles.formHeaderRow}>
          <div>
            <h4 style={styles.cardTitle}>Core Positioning & Knowledge Graph</h4>
            <p style={styles.cardSubtitle}>Every change immediately updates RAG embeddings and agent prompt injections.</p>
          </div>
          <button type="submit" disabled={isSaving} style={styles.saveBtn}>
            {isSaving ? 'Synchronizing...' : 'Save & Sync Brain'}
          </button>
        </div>

        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Company Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              placeholder=""
              required
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Website / Domain</label>
            <input
              type="text"
              name="website"
              value={formData.website || ''}
              onChange={handleChange}
              placeholder=""
              style={styles.input}
            />
          </div>

          <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
            <label style={styles.label}>One-Liner / Value Proposition *</label>
            <input
              type="text"
              name="oneLiner"
              value={formData.oneLiner || ''}
              onChange={handleChange}
              placeholder=""
              required
              style={styles.input}
            />
          </div>

          <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
            <label style={styles.label}>Target Audience & ICP *</label>
            <textarea
              name="audience"
              rows={2}
              value={formData.audience || ''}
              onChange={handleChange}
              placeholder=""
              required
              style={styles.textarea}
            />
          </div>

          <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
            <label style={styles.label}>Core Pain Point / Problem Solved *</label>
            <textarea
              name="problem"
              rows={2}
              value={formData.problem || ''}
              onChange={handleChange}
              placeholder=""
              required
              style={styles.textarea}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Key Competitors & Market Alternatives</label>
            <input
              type="text"
              name="competitors"
              value={formData.competitors || ''}
              onChange={handleChange}
              placeholder=""
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Pricing & Business Model</label>
            <input
              type="text"
              name="pricing"
              value={formData.pricing || ''}
              onChange={handleChange}
              placeholder=""
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Desired Brand Tone of Voice</label>
            <input
              type="text"
              name="tone"
              value={formData.tone || ''}
              onChange={handleChange}
              placeholder=""
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Tone / Phrases to Strictly Avoid</label>
            <input
              type="text"
              name="avoidTone"
              value={formData.avoidTone || ''}
              onChange={handleChange}
              placeholder=""
              style={styles.input}
            />
          </div>

          <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
            <label style={styles.label}>12-Month Primary Milestone / North Star</label>
            <input
              type="text"
              name="goal"
              value={formData.goal || ''}
              onChange={handleChange}
              placeholder=""
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.formFooterRow}>
          <span style={styles.footerNote}>
            All updates are saved locally and synced to FoundryOS PostgreSQL vector tables.
          </span>
          <button type="submit" disabled={isSaving} style={styles.saveBtn}>
            {isSaving ? 'Synchronizing...' : 'Save & Sync Brain'}
          </button>
        </div>
      </form>
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
  healthBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 28px',
    background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.12) 0%, rgba(56, 189, 248, 0.08) 100%)',
    border: '1px solid rgba(167, 139, 250, 0.3)',
    borderRadius: 'var(--radius-md)',
    gap: '20px',
    flexWrap: 'wrap'
  },
  healthInfo: {
    flex: 1,
    minWidth: '280px'
  },
  healthTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.68rem',
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
    color: '#a78bfa',
    letterSpacing: '0.04em',
    marginBottom: '8px'
  },
  healthTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.35rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: '0 0 4px 0'
  },
  healthDesc: {
    fontSize: '0.84rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.45,
    margin: 0
  },
  completenessBox: {
    width: '220px',
    padding: '16px',
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-sm)'
  },
  completenessTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '8px'
  },
  completenessLabel: {
    fontSize: '0.72rem',
    color: 'var(--text-tertiary)'
  },
  completenessPercent: {
    fontFamily: 'var(--font-mono)',
    fontSize: '1.4rem',
    fontWeight: 700,
    color: '#a78bfa'
  },
  track: {
    width: '100%',
    height: '5px',
    background: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 'var(--radius-pill)',
    overflow: 'hidden',
    marginBottom: '6px'
  },
  fill: {
    height: '100%',
    background: 'linear-gradient(90deg, #a78bfa 0%, #38bdf8 100%)',
    borderRadius: 'var(--radius-pill)',
    transition: 'width 0.4s ease'
  },
  completenessSubtext: {
    fontSize: '0.68rem',
    color: 'var(--text-tertiary)'
  },
  statusBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    borderRadius: 'var(--radius-xs)',
    fontSize: '0.82rem'
  },
  successBanner: {
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#34d399'
  },
  errorBanner: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#f87171'
  },
  card: {
    background: 'var(--glass-bg-card)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-md)',
    padding: '20px',
    boxShadow: 'var(--glass-shadow-sm)'
  },
  cardTitle: {
    fontSize: '0.96rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    margin: '0 0 4px 0'
  },
  cardSubtitle: {
    fontSize: '0.8rem',
    color: 'var(--text-tertiary)',
    margin: 0
  },
  profileRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap'
  },
  presetButtons: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  presetBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-xs)',
    color: 'var(--text-secondary)',
    fontSize: '0.78rem',
    fontWeight: 500,
    cursor: 'pointer'
  },
  presetBtnActive: {
    borderColor: '#a78bfa',
    background: 'rgba(167, 139, 250, 0.12)',
    color: 'var(--text-primary)',
    fontWeight: 600
  },
  presetIndustry: {
    fontSize: '0.64rem',
    padding: '1px 5px',
    borderRadius: 'var(--radius-pill)',
    background: 'rgba(255, 255, 255, 0.08)',
    color: 'var(--text-tertiary)'
  },
  formCard: {
    background: 'var(--glass-bg-card)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-md)',
    padding: '24px',
    boxShadow: 'var(--glass-shadow-sm)'
  },
  formHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    gap: '14px',
    flexWrap: 'wrap'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--text-secondary)'
  },
  input: {
    padding: '9px 12px',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-xs)',
    color: 'var(--text-primary)',
    fontSize: '0.86rem',
    fontFamily: 'inherit',
    outline: 'none'
  },
  textarea: {
    padding: '9px 12px',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-xs)',
    color: 'var(--text-primary)',
    fontSize: '0.86rem',
    fontFamily: 'inherit',
    outline: 'none',
    resize: 'vertical'
  },
  formFooterRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '1px solid var(--glass-border-subtle)',
    flexWrap: 'wrap',
    gap: '12px'
  },
  footerNote: {
    fontSize: '0.74rem',
    color: 'var(--text-tertiary)'
  },
  saveBtn: {
    padding: '9px 20px',
    background: 'var(--accent-primary)',
    border: '1px solid var(--accent-primary)',
    borderRadius: 'var(--radius-xs)',
    color: 'var(--bg-primary)',
    fontSize: '0.82rem',
    fontWeight: 700,
    cursor: 'pointer'
  }
};
