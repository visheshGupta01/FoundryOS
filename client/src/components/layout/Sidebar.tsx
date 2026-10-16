import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Icons } from '../common/Icons';
import { BrainLogo } from '../common/BrainLogo';
import type { ViewType, ChatSession } from '../../types';

interface RecentChatItemProps {
  chat: ChatSession;
  isActive: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

const RecentChatItem: React.FC<RecentChatItemProps> = ({
  chat,
  isActive,
  onSelect,
  onDelete
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
      style={{
        ...styles.recentItem,
        ...(isActive ? styles.recentItemActive : {}),
        ...(hovered && !isActive ? styles.recentItemHover : {})
      }}
      title={chat.title}
    >
      <span
        style={{
          ...styles.recentItemText,
          ...(isActive ? styles.recentItemTextActive : {}),
          ...(hovered && !isActive ? styles.recentItemTextHover : {})
        }}
      >
        {chat.title}
      </span>
      {hovered && (
        <button
          onClick={onDelete}
          style={styles.deleteChatBtn}
          title="Delete chat"
        >
          <Icons.Trash size={12} />
        </button>
      )}
    </div>
  );
};

export const Sidebar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    theme,
    toggleTheme,
    brainHealth,
    setSettingsSection,
    pendingApprovalsCount,
    recentChats,
    currentSessionId,
    loadChatSession,
    deleteChatSession,
    clearMessages
  } = useApp();

  const navItems: Array<{ id: ViewType; label: string; icon: React.ReactNode; badge?: string; badgeColor?: string }> = [
    { id: 'chat', label: 'Workspace', icon: <Icons.Workspace /> },
    {
      id: 'approvals',
      label: 'Approvals',
      icon: <Icons.Shield />,
      badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount} Pending` : undefined,
      badgeColor: 'var(--text-secondary)'
    },
    { id: 'employees', label: 'AI Employees', icon: <Icons.Employees /> },
    { id: 'archive', label: 'Document Archive', icon: <Icons.Reports /> },
    { id: 'integrations', label: 'Integrations', icon: <Icons.Link /> },
    { id: 'plugins', label: 'Plugins & Tools', icon: <Icons.Plugins /> }
  ];

  return (
    <aside style={styles.sidebar} data-tour="sidebar">
      <div
        style={{ ...styles.brandContainer, cursor: 'pointer' }}
        onClick={() => setActiveView('chat')}
        title="FoundryOS Workspace Dashboard"
      >
        <div style={styles.logoRow}>
          <BrainLogo size={22} />
          <span style={styles.brandTitle}>FoundryOS</span>
        </div>
      </div>

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

      <div style={styles.recentsSection}>
        <div style={styles.recentsHeaderRow}>
          <span style={styles.recentsHeader}>Recents</span>
          <button
            onClick={() => {
              clearMessages();
              setActiveView('chat');
            }}
            style={styles.newChatBtn}
            title="Start new chat"
          >
            <Icons.Plus size={13} />
          </button>
        </div>

        <div style={styles.recentsList}>
          {recentChats.length === 0 ? (
            <div style={styles.emptyRecents}>No recent chats</div>
          ) : (
            recentChats.map(chat => (
              <RecentChatItem
                key={chat.id}
                chat={chat}
                isActive={currentSessionId === chat.id && activeView === 'chat'}
                onSelect={() => loadChatSession(chat.id)}
                onDelete={e => {
                  e.stopPropagation();
                  deleteChatSession(chat.id);
                }}
              />
            ))
          )}
        </div>
      </div>

      <div style={styles.footer}>
        <div
          onClick={() => {
            setSettingsSection('brain');
            setActiveView('settings');
          }}
          className="interactive-hover-lift"
          style={styles.brainCard}
          title="Company Brain Intelligence: Aggregated from positioning anchors, uploaded docs, sessions, and connected tools. Click to tune."
        >
          {/* Header Row: Icon + Title + Status Dot + Percentage Pill */}
          <div style={styles.brainCardHeader}>
            <div style={styles.brainTitleRow}>
              <div style={styles.brainIconGlow}>
                <Icons.Brain size={13} style={{ color: 'var(--text-secondary)' }} />
              </div>
              <span style={styles.brainCardTitle}>Company Brain</span>
              <span style={styles.statusDot} />
            </div>
            <div style={styles.brainPercentPill}>
              {brainHealth.completenessPercent}%
            </div>
          </div>

          {/* Minimalist Monochrome Progress Bar */}
          <div style={styles.progressTrack}>
            <div
              style={{
                ...styles.progressFill,
                width: `${Math.max(4, brainHealth.completenessPercent)}%`
              }}
            />
          </div>

          {/* Stage Level & Total Signals */}
          <div style={styles.brainCardFooter}>
            <span style={styles.levelBadge}>{brainHealth.levelLabel || 'Emerging Base'}</span>
            <span style={styles.signalsCounter}>
              {brainHealth.totalSignals || 0} Signals
            </span>
          </div>

          {/* Holistic Live Metric Badges */}
          <div style={styles.metricsRow}>
            <span style={styles.metricChip} title={`${brainHealth.anchorsCount || 0} positioning anchors defined`}>
              {brainHealth.anchorsCount || 0} Anchors
            </span>
            <span style={styles.metricChip} title={`${brainHealth.docCount || 0} documents in knowledge vault`}>
              {brainHealth.docCount || 0} Docs
            </span>
            <span style={styles.metricChip} title={`${brainHealth.memoryCount || 0} active sessions & learnings`}>
              {brainHealth.memoryCount || 0} Sessions
            </span>
            <span style={styles.tuneLink}>
              Tune →
            </span>
          </div>
        </div>

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
            onClick={() => setActiveView('settings')}
            style={{
              ...styles.controlBtn,
              ...(activeView === 'settings' ? { borderColor: 'var(--accent-primary)', color: 'var(--text-primary)' } : {})
            }}
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
    background: 'var(--glass-bg-sidebar)',
    borderRight: '1px solid var(--glass-border-subtle)',
    padding: '16px 14px',
    userSelect: 'none',
    zIndex: 10,
    overflow: 'hidden'
  },
  brandContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
    paddingLeft: '4px',
    flexShrink: 0
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  brandTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.05rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: 'var(--text-primary)'
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flexShrink: 0,
    marginBottom: '12px'
  },
  navBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '8px 10px',
    borderRadius: 'var(--radius-sm)',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.84rem',
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
  recentsSection: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    borderTop: '1px solid var(--glass-border-subtle)',
    paddingTop: '12px',
    marginBottom: '12px'
  },
  recentsHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 8px 8px 8px',
    flexShrink: 0
  },
  recentsHeader: {
    fontSize: '0.8rem',
    fontWeight: 500,
    color: 'var(--text-tertiary)',
    letterSpacing: '0.01em'
  },
  newChatBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '22px',
    height: '22px',
    borderRadius: 'var(--radius-xs)',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)'
  },
  recentsList: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    paddingRight: '2px'
  },
  recentItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '7px 8px',
    borderRadius: 'var(--radius-xs)',
    cursor: 'pointer',
    background: 'transparent',
    transition: 'background var(--transition-fast), color var(--transition-fast)',
    gap: '8px'
  },
  recentItemHover: {
    background: 'rgba(255, 255, 255, 0.05)'
  },
  recentItemActive: {
    background: 'rgba(255, 255, 255, 0.09)'
  },
  recentItemText: {
    fontSize: '0.84rem',
    fontWeight: 400,
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flex: 1,
    lineHeight: '1.3'
  },
  recentItemTextHover: {
    color: 'var(--text-primary)'
  },
  recentItemTextActive: {
    color: 'var(--text-primary)',
    fontWeight: 500
  },
  deleteChatBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    borderRadius: '4px',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
    flexShrink: 0,
    padding: 0
  },
  emptyRecents: {
    fontSize: '0.78rem',
    color: 'var(--text-tertiary)',
    padding: '8px 10px',
    fontStyle: 'italic'
  },
  footer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    paddingTop: '12px',
    borderTop: '1px solid var(--glass-border-subtle)',
    flexShrink: 0
  },
  brainCard: {
    background: 'var(--glass-bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '10px',
    padding: '11px 13px',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
    boxShadow: 'var(--glass-shadow-sm)'
  },
  brainCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  brainTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  brainIconGlow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    borderRadius: '6px',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--border-subtle)'
  },
  brainCardTitle: {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    letterSpacing: '-0.01em'
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    display: 'inline-block',
    background: 'var(--text-tertiary)'
  },
  brainPercentPill: {
    fontSize: '0.72rem',
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
    padding: '2px 7px',
    borderRadius: '12px',
    background: 'var(--glass-bg-surface)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-subtle)'
  },
  progressTrack: {
    width: '100%',
    height: '4px',
    background: 'var(--glass-bg-surface)',
    borderRadius: '999px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    background: 'var(--text-primary)',
    borderRadius: '999px',
    transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
  },
  brainCardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.68rem'
  },
  levelBadge: {
    color: 'var(--text-secondary)',
    fontWeight: 500,
    fontSize: '0.68rem'
  },
  signalsCounter: {
    color: 'var(--text-tertiary)',
    fontSize: '0.66rem',
    fontFamily: 'var(--font-mono)'
  },
  metricsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '4px',
    paddingTop: '5px',
    borderTop: '1px solid var(--border-subtle)'
  },
  metricChip: {
    fontSize: '0.65rem',
    padding: '2px 6px',
    background: 'var(--glass-bg-surface)',
    borderRadius: '4px',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono)',
    border: '1px solid var(--border-subtle)'
  },
  tuneLink: {
    fontSize: '0.68rem',
    color: 'var(--text-primary)',
    fontWeight: 600,
    marginLeft: 'auto'
  },
  controlRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px'
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
