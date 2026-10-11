import React from 'react';
import { useApp } from '../../context/AppContext';
import { Icons } from '../common/Icons';
import { BrainLogo } from '../common/BrainLogo';
import type { ViewType } from '../../types';

export const Sidebar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    theme,
    toggleTheme,
    brainHealth,
    setIsOnboardingOpen,
    setIsSettingsOpen,
    employees,
    mcpServers,
    recentChats,
    archivedDocuments,
    integrationStatus,
    pendingApprovalsCount,
    connectedIntegrationsCount
  } = useApp();

  const connectedCount = connectedIntegrationsCount || ((integrationStatus?.slack.connected ? 1 : 0) + (integrationStatus?.drive.connected ? 1 : 0));

  const navItems: Array<{ id: ViewType; label: string; icon: React.ReactNode; badge?: string; badgeColor?: string }> = [
    { id: 'chat', label: 'Workspace', icon: <Icons.Workspace /> },
    {
      id: 'approvals',
      label: 'Approvals',
      icon: <Icons.Shield />,
      badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount} Pending` : undefined,
      badgeColor: '#fbbf24'
    },
    { id: 'recent-chats', label: 'Recent Chats', icon: <Icons.ChatHistory />, badge: recentChats.length > 0 ? `${recentChats.length}` : undefined },
    { id: 'employees', label: 'AI Employees', icon: <Icons.Employees />, badge: `${employees.length || 5} Active` },
    { id: 'brain', label: 'Company Brain', icon: <Icons.Brain />, badge: `${brainHealth.completenessPercent}%` },
    { id: 'archive', label: 'Document Archive', icon: <Icons.Reports />, badge: `${archivedDocuments.length || 0} Docs` },
    {
      id: 'integrations',
      label: 'Integrations',
      icon: <Icons.Link />,
      badge: connectedCount > 0 ? `${connectedCount} Connected` : 'Setup',
      badgeColor: connectedCount > 0 ? '#34d399' : '#fbbf24'
    },
    { id: 'plugins', label: 'Plugins & Tools', icon: <Icons.Plugins />, badge: `${mcpServers.length || 5} MCP` },
    { id: 'token-analytics', label: 'Token Analytics', icon: <Icons.Analytics />, badge: 'LAB' }
  ];

  return (
    <aside style={styles.sidebar} data-tour="sidebar">
      {/* Brand Header */}
      <div style={styles.brandContainer}>
        <div style={styles.logoRow}>
          <BrainLogo size={22} />
          <span style={styles.brandTitle}>FoundryOS</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={styles.nav}>
        {navItems.map(item => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              data-tour={item.id === 'brain' ? 'brain-btn' : item.id === 'employees' ? 'employees-btn' : undefined}
              onClick={() => setActiveView(item.id)}
              style={{
                ...styles.navBtn,
                ...(isActive ? styles.navBtnActive : {})
              }}
            >
              <span style={{ ...styles.iconWrapper, color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                {item.icon}
              </span>
              <span style={styles.navLabel}>{item.label}</span>
              {item.badge && (
                <span
                  className={item.badgeColor === '#fbbf24' ? 'amber-pulse' : ''}
                  style={{
                    ...styles.navBadge,
                    background: item.badgeColor ? `${item.badgeColor}18` : 'rgba(255, 255, 255, 0.05)',
                    color: item.badgeColor || (isActive ? 'var(--text-primary)' : 'var(--text-tertiary)'),
                    border: `1px solid ${item.badgeColor ? `${item.badgeColor}40` : 'var(--glass-border-subtle)'}`
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={styles.footer}>
        {/* Brain Knowledge Card */}
        <div
          onClick={() => setIsOnboardingOpen(true)}
          style={styles.brainCard}
          title="Click to update company knowledge"
        >
          <div style={styles.brainCardHeader}>
            <span style={styles.brainCardTitle}>Brain Knowledge</span>
            <span style={styles.brainCardPercent}>{brainHealth.completenessPercent}%</span>
          </div>
          <div style={styles.progressTrack}>
            <div
              style={{
                ...styles.progressFill,
                width: `${brainHealth.completenessPercent}%`
              }}
            />
          </div>
          <div style={styles.brainCardFooter}>
            <span>{brainHealth.configuredFields.length}/6 Details Set</span>
            <span style={styles.updateLink}>Edit →</span>
          </div>
        </div>

        {/* Founder Walkthrough Tour Trigger */}
        <button
          onClick={() => setIsOnboardingOpen(true)}
          style={styles.tourBtn}
          title="Replay Founder Walkthrough & Value Tour"
        >
          <Icons.Sparkles size={13} style={{ color: 'var(--text-primary)' }} />
          <span>Founder Tour</span>
        </button>

        {/* Theme and Settings Controls */}
        <div style={styles.controlRow}>
          <button
            onClick={toggleTheme}
            style={styles.controlBtn}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Icons.Moon size={14} /> : <Icons.Sun size={14} />}
            <span style={{ fontSize: '0.78rem', textTransform: 'capitalize' }}>{theme}</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            style={styles.controlBtn}
            title="System Settings"
          >
            <Icons.Settings size={14} />
            <span style={{ fontSize: '0.78rem' }}>Settings</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '260px',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    background: 'var(--glass-bg-sidebar)',
    borderRight: '1px solid var(--glass-border-subtle)',
    padding: '20px 16px',
    userSelect: 'none',
    zIndex: 10
  },
  brandContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
    paddingLeft: '4px'
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  beaconDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#ffffff',
    boxShadow: '0 0 6px rgba(255, 255, 255, 0.4)'
  },
  brandTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.05rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: 'var(--text-primary)'
  },
  brandBadge: {
    fontSize: '0.62rem',
    fontWeight: 600,
    letterSpacing: '0.06em',
    padding: '2px 7px',
    borderRadius: 'var(--radius-xs)',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--glass-border-subtle)',
    color: 'var(--text-tertiary)'
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1
  },
  navBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '9px 12px',
    borderRadius: 'var(--radius-sm)',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.85rem',
    fontWeight: 400,
    cursor: 'pointer',
    transition: 'color var(--transition-fast)',
    textAlign: 'left'
  },
  navBtnActive: {
    background: 'transparent',
    color: 'var(--text-primary)',
    fontWeight: 600
  },
  iconWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color var(--transition-fast)'
  },
  navLabel: {
    flex: 1
  },
  navBadge: {
    fontSize: '0.66rem',
    fontWeight: 500,
    padding: '2px 6px',
    borderRadius: 'var(--radius-xs)',
    fontFamily: 'var(--font-mono)',
    transition: 'all var(--transition-fast)'
  },
  footer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    paddingTop: '16px',
    borderTop: '1px solid var(--glass-border-subtle)'
  },
  brainCard: {
    background: 'var(--glass-bg-card)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-sm)',
    padding: '12px 14px',
    cursor: 'pointer',
    transition: 'border-color var(--transition-fast)'
  },
  brainCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  brainCardTitle: {
    fontSize: '0.76rem',
    fontWeight: 600,
    color: 'var(--text-primary)'
  },
  brainCardPercent: {
    fontSize: '0.78rem',
    fontWeight: 600,
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-secondary)'
  },
  progressTrack: {
    width: '100%',
    height: '3px',
    background: 'var(--border-subtle)',
    borderRadius: 'var(--radius-pill)',
    overflow: 'hidden',
    marginBottom: '8px'
  },
  progressFill: {
    height: '100%',
    background: 'var(--accent-primary)',
    borderRadius: 'var(--radius-pill)',
    transition: 'width 0.3s var(--ease-smooth)'
  },
  brainCardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.7rem',
    color: 'var(--text-tertiary)'
  },
  updateLink: {
    color: 'var(--text-secondary)',
    fontWeight: 500
  },
  controlRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px'
  },
  tourBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px 12px',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-xs)',
    color: 'var(--text-primary)',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    width: '100%',
    boxSizing: 'border-box',
    marginBottom: '8px'
  },
  controlBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '7px 8px',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-xs)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)'
  }
};
