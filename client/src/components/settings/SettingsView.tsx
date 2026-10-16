import React from 'react';
import { useApp } from '../../context/AppContext';
import { GeneralSection } from './GeneralSection';
import { ApiKeysSection } from './ApiKeysSection';
import { AccountSection } from './AccountSection';
import { BrainSection } from './BrainSection';
import { TokenQuotaSection } from './TokenQuotaSection';
import { BillingSection } from './BillingSection';
import type { SettingsSectionType } from '../../types';

interface SidebarItem {
  id: SettingsSectionType;
  label: string;
}

export const SettingsView: React.FC = () => {
  const { settingsSection, setSettingsSection } = useApp();

  const settingsNavItems: SidebarItem[] = [
    { id: 'general', label: 'General' },
    { id: 'apikeys', label: 'API Keys' },
    { id: 'brain', label: 'Company Brain' },
    { id: 'tokens', label: 'Models & Quotas' },
    { id: 'billing', label: 'Billing' },
    { id: 'account', label: 'Account' }
  ];

  return (
    <div style={styles.viewContainer}>
      <div style={styles.bodyLayout}>
        {/* Left Navigation Sidebar */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarGroupTitle}>SETTINGS</div>
          <div style={styles.navStack}>
            {settingsNavItems.map(item => {
              const isActive = settingsSection === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSettingsSection(item.id)}
                  style={{
                    ...styles.navItem,
                    ...(isActive ? styles.navItemActive : {})
                  }}
                >
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Content Pane */}
        <div style={styles.mainContentPane}>
          {settingsSection === 'general' && <GeneralSection />}
          {settingsSection === 'apikeys' && <ApiKeysSection />}
          {settingsSection === 'brain' && <BrainSection />}
          {settingsSection === 'tokens' && <TokenQuotaSection />}
          {settingsSection === 'billing' && <BillingSection />}
          {settingsSection === 'account' && <AccountSection />}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  viewContainer: {
    height: 'calc(100vh - 56px)',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--glass-bg-base)',
    overflow: 'hidden'
  },
  bodyLayout: {
    flex: 1,
    display: 'flex',
    height: '100%',
    overflow: 'hidden'
  },
  sidebar: {
    width: '210px',
    background: 'var(--glass-bg-sidebar)',
    borderRight: '1px solid var(--border-subtle)',
    padding: '28px 12px',
    flexShrink: 0,
    overflowY: 'auto'
  },
  sidebarGroupTitle: {
    fontSize: '0.68rem',
    fontWeight: 600,
    color: 'var(--text-tertiary)',
    padding: '0 10px 10px 10px',
    letterSpacing: '0.06em'
  },
  navStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px'
  },
  navItem: {
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '0.84rem',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    fontWeight: 400
  },
  navItemActive: {
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    fontWeight: 600,
    border: '1px solid var(--border-subtle)'
  },
  mainContentPane: {
    flex: 1,
    overflowY: 'auto',
    padding: '36px 48px',
    background: 'var(--glass-bg-base)'
  }
};
