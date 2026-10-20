import React from 'react';
import { useApp } from '../../context/AppContext';
import { Icons } from '../common/Icons';
import { logout } from '../../services/auth.service';
interface HeaderProps {
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const { clearMessages } = useApp();

  return (
    <header style={styles.header} data-tour="header">
      <div style={styles.headerSpacer} />

      <div style={styles.actionGroup}>

        <button
          onClick={clearMessages}
          className="interactive-hover-lift"
          style={styles.newChatBtn}
          title="Start Fresh Session"
        >
          <Icons.Plus size={15} />
          <span>New Session</span>
        </button>

        <button
          onClick={() => {
            logout();
            onLogout?.();
          }}
          className="interactive-hover-lift"
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
  actionGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
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
  }
};
