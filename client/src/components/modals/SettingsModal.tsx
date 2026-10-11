import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Icons } from '../common/Icons';

export const SettingsModal: React.FC = () => {
  const { isSettingsOpen, setIsSettingsOpen, resetCredits, creditStatus, setActiveView } = useApp();
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  if (!isSettingsOpen) return null;

  const handleResetCredits = async () => {
    setResetting(true);
    await resetCredits();
    setResetting(false);
    setResetMessage('Credits restored to 100/100 (80,000 tokens).');
    setTimeout(() => setResetMessage(null), 3500);
  };

  return (
    <div style={styles.backdrop} onClick={() => setIsSettingsOpen(false)}>
      <div style={styles.dialog} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>System Settings & Diagnostics</h2>
            <p style={styles.subtitle}>Runtime orchestration and credit quota controls</p>
          </div>
          <button onClick={() => setIsSettingsOpen(false)} style={styles.closeBtn}>
            <Icons.Close size={16} />
          </button>
        </div>

        <div style={styles.body}>
          {/* Credit Quota Section */}
          <div style={styles.card}>
            <div style={styles.cardTop}>
              <div>
                <h3 style={styles.cardTitle}>Daily Credit Quota</h3>
                <span style={styles.cardDesc}>
                  Limits daily token usage to 100 credits (80,000 tokens). Resets at midnight UTC.
                </span>
              </div>
              <button
                onClick={handleResetCredits}
                disabled={resetting}
                style={styles.resetBtn}
              >
                {resetting ? (
                  'Resetting...'
                ) : (
                  <>
                    <Icons.Zap size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                    Reset Credits (100)
                  </>
                )}
              </button>
            </div>
            {resetMessage && <span style={styles.resetSuccess}>{resetMessage}</span>}
            <div style={styles.statLine}>
              <span>Current Status:</span>
              <strong>{creditStatus?.remainingCredits ?? 100} / 100 Credits ({creditStatus?.tokensUsedToday ?? 0} tokens used today)</strong>
            </div>
          </div>

          {/* Model Gateway */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>LLM Engine & Routing</h3>
            <span style={styles.cardDesc}>
              Intelligent routing between OpenAI GPT (primary), Ollama local instances (fallback), and TrueFoundry gateway.
            </span>
            <div style={styles.infoRow}>
              <span>Primary Engine:</span>
              <span style={styles.tag}>OpenAI GPT-4o-mini / GPT-4o</span>
            </div>
            <div style={styles.infoRow}>
              <span>Fallback Engine:</span>
              <span style={styles.tag}>Ollama (localhost:11434)</span>
            </div>
            <div style={styles.infoRow}>
              <span>Active Port:</span>
              <span style={styles.tag}>http://localhost:3000</span>
            </div>
          </div>

          {/* MCP Integration */}
          <div style={styles.card}>
            <div style={styles.cardTop}>
              <div>
                <h3 style={styles.cardTitle}>Third-Party Integrations (Slack & Google Drive)</h3>
                <span style={styles.cardDesc}>
                  Zero-secret architecture: Connect your private Slack Bot Token and Google Drive OAuth credentials.
                </span>
              </div>
              <button
                onClick={() => {
                  setIsSettingsOpen(false);
                  setActiveView('integrations');
                }}
                style={styles.manageBtn}
              >
                Manage Integrations →
              </button>
            </div>
            <div style={styles.infoRow}>
              <span>Protocol Version:</span>
              <span style={styles.tag}>@modelcontextprotocol/sdk v1.30</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'var(--glass-blur)',
    WebkitBackdropFilter: 'var(--glass-blur)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    padding: '20px'
  },
  dialog: {
    background: 'var(--glass-bg-modal)',
    border: '1px solid var(--glass-border-specular)',
    borderRadius: 'var(--radius-sm)',
    boxShadow: 'var(--glass-shadow-md)',
    width: '100%',
    maxWidth: '560px',
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '20px 24px',
    borderBottom: '1px solid var(--glass-border-subtle)'
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.15rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '4px'
  },
  subtitle: {
    fontSize: '0.82rem',
    color: 'var(--text-secondary)'
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
    padding: '6px'
  },
  body: {
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  card: {
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-xs)',
    padding: '14px'
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '10px'
  },
  cardTitle: {
    fontSize: '0.88rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '4px'
  },
  cardDesc: {
    fontSize: '0.76rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.4'
  },
  resetBtn: {
    padding: '6px 12px',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-xs)',
    color: 'var(--text-primary)',
    fontSize: '0.74rem',
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all var(--transition-fast)'
  },
  resetSuccess: {
    display: 'block',
    fontSize: '0.74rem',
    color: 'var(--apple-success)',
    fontWeight: 500,
    marginBottom: '8px'
  },
  statLine: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.76rem',
    color: 'var(--text-tertiary)',
    paddingTop: '8px',
    borderTop: '1px solid var(--glass-border-subtle)'
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    marginTop: '8px'
  },
  tag: {
    padding: '2px 8px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 'var(--radius-xs)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    color: 'var(--text-primary)'
  }
};
