import React from 'react';
import { useApp } from '../../context/AppContext';
import { Icons } from '../common/Icons';
import { logout } from '../../services/auth.service';
export const Header: React.FC = () => {
  const {
    activeView,
    setActiveView,
    creditStatus,
    clearMessages,
    connectedIntegrationsCount,
    demoProfiles,
    activeProfileId,
    applyDemoProfile,
    setIsOnboardingOpen
  } = useApp();

  const viewTitles: Record<string, string> = {
    chat: '',
    approvals: 'Approvals & Governance',
    'recent-chats': 'Recent Chats & Sessions',
    employees: 'AI Agents & Specialists',
    brain: 'Company Brain Context',
    archive: 'Document Vault & Archive',
    integrations: 'Integrations & Workspace Tools',
    'token-analytics': 'Token & Credit Intelligence',
    plugins: 'Plugins & Tools'
  };

  const remainingCredits = creditStatus ? creditStatus.remainingCredits : 100;
  const maxCredits = creditStatus ? creditStatus.maxDailyCredits : 100;
  const totalConnected = connectedIntegrationsCount || 0;

  return (
    <header style={styles.header} data-tour="header">
      {/* Title & Live Status */}
      {viewTitles[activeView] ? (
        <div style={styles.titleGroup}>
          <div style={styles.liveIndicator}>
            <div style={styles.livePulse} />
            <div style={styles.liveCore} />
          </div>
          <span style={styles.viewTitle}>{viewTitles[activeView]}</span>
        </div>
      ) : (
        <div style={styles.titleGroup} />
      )}

      {/* Action Controls & Pills */}
      <div style={styles.actionGroup}>
        {/* Unified Integrations Status Chip */}
        <button
          onClick={() => setActiveView('integrations')}
          style={{
            ...styles.integrationChip,
            borderColor: totalConnected > 0 ? 'rgba(16, 185, 129, 0.35)' : 'var(--border-subtle)',
            background: totalConnected > 0 ? 'rgba(16, 185, 129, 0.08)' : 'var(--glass-bg-card)',
            color: totalConnected > 0 ? '#34d399' : 'var(--text-secondary)'
          }}
          title="Manage workspace integrations and API keys"
        >
          <Icons.Link size={13} />
          <span>{totalConnected > 0 ? `${totalConnected} Connected` : 'Connect Tools'}</span>
        </button>

        {/* Demo Startup Profile Switcher */}
        {demoProfiles.length > 0 && (
          <div style={styles.profileSwitcher} title="Switch active Demo Startup Context">
            <Icons.Brain size={13} style={{ color: '#818cf8', flexShrink: 0 }} />
            <select
              value={activeProfileId}
              onChange={(e) => applyDemoProfile(e.target.value)}
              style={styles.profileSelect}
            >
              {demoProfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.industry.split(' ')[0]})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Credit System Pill */}
        <div
          style={styles.creditPill}
          title={`Daily Allowance: ${maxCredits} Credits (80,000 Tokens) • 1 Credit = 800 Tokens • Resets daily at midnight UTC`}
        >
          <Icons.Zap size={14} style={{ color: '#818cf8' }} />
          <span style={styles.creditValue}>{remainingCredits}/{maxCredits} Credits</span>
          <span style={styles.creditSubtext}>(1 cr = 800 tok)</span>
        </div>

        {/* Founder Walkthrough Tour Button */}
        <button
          onClick={() => setIsOnboardingOpen(true)}
          style={styles.tourBtn}
          title="Interactive Founder Walkthrough & Value Tour"
        >
          <Icons.Sparkles size={13} style={{ color: 'var(--text-primary)' }} />
          <span>Founder Tour</span>
        </button>

        {/* New Session Button */}
        <button
          onClick={clearMessages}
          style={styles.newChatBtn}
          title="Start Fresh Session"
        >
          <Icons.Plus size={15} />
          <span>New Session</span>
        </button>
        {/* Logout Button */}
        <button
          onClick={() => {
            logout();
            window.location.reload();
          }}
          style={styles.logoutBtn}
          title="Logout"
        >
          <span>Logout</span>
        </button>

      </div>
    </header>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    background: 'var(--glass-bg-header)',
    borderBottom: '1px solid var(--glass-border-subtle)',
    userSelect: 'none',
    zIndex: 9
  },
  titleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  liveIndicator: {
    position: 'relative',
    width: '8px',
    height: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  livePulse: {
    display: 'none'
  },
  liveCore: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#10b981'
  },
  viewTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.92rem',
    fontWeight: 600,
    letterSpacing: '-0.015em',
    color: 'var(--text-primary)'
  },
  actionGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  creditPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '5px 10px',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-xs)',
    fontSize: '0.76rem',
    color: 'var(--text-secondary)',
    cursor: 'help'
  },
  creditIcon: {
    color: 'var(--text-primary)',
    fontSize: '0.82rem'
  },
  creditValue: {
    fontWeight: 600,
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-primary)'
  },
  creditSubtext: {
    color: 'var(--text-tertiary)',
    fontSize: '0.7rem'
  },
  integrationChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-xs)',
    fontSize: '0.74rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all var(--transition-fast)'
  },
  tourBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-xs)',
    color: 'var(--text-primary)',
    fontSize: '0.76rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all var(--transition-fast)'
  },
  newChatBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    background: 'var(--accent-primary)',
    border: '1px solid var(--accent-primary)',
    borderRadius: 'var(--radius-xs)',
    color: 'var(--bg-primary)',
    fontSize: '0.8rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all var(--transition-fast)'
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    background: 'transparent',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-xs)',
    color: 'var(--text-secondary)',
    fontSize: '0.76rem',
    fontWeight: 600,
    cursor: 'pointer'
  },
  profileSwitcher: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 8px',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-xs)'
  },
  profileSelect: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    fontSize: '0.74rem',
    fontWeight: 500,
    outline: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit'
  }

};
