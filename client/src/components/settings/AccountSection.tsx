import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Icons } from '../common/Icons';
import { logout } from '../../services/auth.service';

export const AccountSection: React.FC = () => {
  const { theme, toggleTheme, brainData, setBrainData } = useApp();

  const [name, setName] = useState<string>(() => {
    return localStorage.getItem('foundry_user_name') || brainData.name || '';
  });
  const [email, setEmail] = useState<string>(() => {
    return localStorage.getItem('foundry_user_email') || '';
  });
  const [role, setRole] = useState<string>('');
  const [company, setCompany] = useState<string>(brainData.name || '');
  const [isCopiedToken, setIsCopiedToken] = useState(false);
  const [isCopiedKey, setIsCopiedKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const mockApiKey = 'fos_live_948f2b3c109e4a81b7e0d42189ac35';
  const token = localStorage.getItem('foundry_token') || 'foundry-founder-session';

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('foundry_user_name', name);
    localStorage.setItem('foundry_user_email', email);
    setBrainData(prev => ({ ...prev, name: company }));
    setSaveStatus('Account profile saved successfully.');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const copyToClipboard = async (text: string, isKey: boolean) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isKey) {
        setIsCopiedKey(true);
        setTimeout(() => setIsCopiedKey(false), 2000);
      } else {
        setIsCopiedToken(true);
        setTimeout(() => setIsCopiedToken(false), 2000);
      }
    } catch {
      // fallback
    }
  };

  const getInitials = (n: string) => {
    return n.trim().split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() || 'FO';
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.avatarLarge}>
            {getInitials(name)}
          </div>
          <div style={styles.headerInfo}>
            <h3 style={styles.userName}>{name}</h3>
            <span style={styles.userRole}>{role} • {company}</span>
            <span style={styles.emailBadge}>{email}</span>
          </div>
          <button
            type="button"
            onClick={async () => {
              await logout();
            }}
            style={styles.logoutBtn}
            title="Terminate session and sign out"
          >
            Log Out
          </button>
        </div>

        {saveStatus && (
          <div style={styles.saveAlert}>
            <Icons.Check size={14} style={{ color: '#10b981' }} />
            <span>{saveStatus}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} style={styles.formGrid}>
          <div style={styles.fieldCol}>
            <label style={styles.label}>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              style={styles.input}
              placeholder=""
            />
          </div>

          <div style={styles.fieldCol}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={styles.input}
              placeholder=""
            />
          </div>

          <div style={styles.fieldCol}>
            <label style={styles.label}>Founder Title / Role</label>
            <input
              type="text"
              value={role}
              onChange={e => setRole(e.target.value)}
              style={styles.input}
              placeholder=""
            />
          </div>

          <div style={styles.fieldCol}>
            <label style={styles.label}>Primary Company Name</label>
            <input
              type="text"
              value={company}
              onChange={e => setCompany(e.target.value)}
              style={styles.input}
              placeholder=""
            />
          </div>

          <div style={styles.btnRow}>
            <button type="submit" style={styles.saveBtn}>
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>

      <div style={styles.card}>
        <h4 style={styles.sectionTitle}>API Credentials & Security</h4>
        <p style={styles.sectionDesc}>
          Access FoundryOS agentic pipelines programmatically via sovereign REST & MCP gateways.
        </p>

        <div style={styles.credentialRow}>
          <div style={styles.credInfo}>
            <div style={styles.credLabelRow}>
              <Icons.Key size={14} style={{ color: '#818cf8' }} />
              <span style={styles.credTitle}>Personal Access API Key</span>
              <span style={styles.statusTag}>Live Key</span>
            </div>
            <div style={styles.keyBox}>
              <code>{showKey ? mockApiKey : 'fos_live_••••••••••••••••••••••••35'}</code>
            </div>
          </div>
          <div style={styles.credActions}>
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              style={styles.credBtn}
            >
              {showKey ? <Icons.EyeOff size={14} /> : <Icons.Eye size={14} />}
              <span>{showKey ? 'Hide' : 'Reveal'}</span>
            </button>
            <button
              type="button"
              onClick={() => copyToClipboard(mockApiKey, true)}
              style={styles.credBtn}
            >
              {isCopiedKey ? <Icons.Check size={14} style={{ color: '#10b981' }} /> : <Icons.Copy size={14} />}
              <span>{isCopiedKey ? 'Copied' : 'Copy Key'}</span>
            </button>
          </div>
        </div>

        <div style={styles.credentialRow}>
          <div style={styles.credInfo}>
            <div style={styles.credLabelRow}>
              <Icons.Lock size={14} style={{ color: '#38bdf8' }} />
              <span style={styles.credTitle}>Active Session Bearer Token</span>
            </div>
            <div style={styles.keyBox}>
              <code>{token.slice(0, 16)}••••••••••••••••</code>
            </div>
          </div>
          <div style={styles.credActions}>
            <button
              type="button"
              onClick={() => copyToClipboard(token, false)}
              style={styles.credBtn}
            >
              {isCopiedToken ? <Icons.Check size={14} style={{ color: '#10b981' }} /> : <Icons.Copy size={14} />}
              <span>{isCopiedToken ? 'Copied' : 'Copy Token'}</span>
            </button>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h4 style={styles.sectionTitle}>Display & Preferences</h4>
        <div style={styles.prefRow}>
          <div>
            <div style={styles.prefTitle}>Theme Interface</div>
            <div style={styles.prefDesc}>Switch between deep dark mode and crisp high-contrast light mode</div>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            style={styles.themeToggleBtn}
          >
            {theme === 'dark' ? <Icons.Moon size={14} /> : <Icons.Sun size={14} />}
            <span style={{ textTransform: 'capitalize' }}>{theme} Mode</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    width: '100%'
  },
  card: {
    background: 'var(--glass-bg-card)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-md)',
    padding: '24px',
    boxShadow: 'var(--glass-shadow-sm)'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
    paddingBottom: '20px',
    borderBottom: '1px solid var(--glass-border-subtle)',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  avatarLarge: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.85) 0%, rgba(56, 189, 248, 0.85) 100%)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.4rem',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)',
    flexShrink: 0
  },
  headerInfo: {
    flex: 1
  },
  userName: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.2rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: '0 0 4px 0'
  },
  userRole: {
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
    display: 'block',
    marginBottom: '6px'
  },
  emailBadge: {
    fontSize: '0.74rem',
    fontFamily: 'var(--font-mono)',
    padding: '2px 8px',
    borderRadius: 'var(--radius-pill)',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--glass-border-subtle)',
    color: 'var(--text-tertiary)'
  },
  logoutBtn: {
    padding: '7px 14px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    borderRadius: 'var(--radius-xs)',
    color: '#f87171',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer'
  },
  saveAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: 'var(--radius-xs)',
    color: '#34d399',
    fontSize: '0.82rem',
    marginBottom: '16px'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px'
  },
  fieldCol: {
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
  btnRow: {
    gridColumn: '1 / -1',
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '6px'
  },
  saveBtn: {
    padding: '8px 18px',
    background: 'var(--accent-primary)',
    border: '1px solid var(--accent-primary)',
    borderRadius: 'var(--radius-xs)',
    color: 'var(--bg-primary)',
    fontSize: '0.82rem',
    fontWeight: 700,
    cursor: 'pointer'
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    margin: '0 0 6px 0'
  },
  sectionDesc: {
    fontSize: '0.82rem',
    color: 'var(--text-tertiary)',
    lineHeight: 1.45,
    margin: '0 0 16px 0'
  },
  credentialRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 14px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-xs)',
    marginBottom: '12px',
    gap: '12px',
    flexWrap: 'wrap'
  },
  credInfo: {
    flex: 1,
    minWidth: '240px'
  },
  credLabelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px'
  },
  credTitle: {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--text-primary)'
  },
  statusTag: {
    fontSize: '0.62rem',
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
    padding: '1px 6px',
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    color: '#34d399',
    borderRadius: 'var(--radius-pill)'
  },
  keyBox: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.78rem',
    color: 'var(--text-tertiary)'
  },
  credActions: {
    display: 'flex',
    gap: '8px'
  },
  credBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-xs)',
    color: 'var(--text-secondary)',
    fontSize: '0.76rem',
    fontWeight: 500,
    cursor: 'pointer'
  },
  prefRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '8px',
    gap: '16px'
  },
  prefTitle: {
    fontSize: '0.86rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '2px'
  },
  prefDesc: {
    fontSize: '0.78rem',
    color: 'var(--text-tertiary)'
  },
  themeToggleBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-xs)',
    color: 'var(--text-primary)',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer'
  }
};
