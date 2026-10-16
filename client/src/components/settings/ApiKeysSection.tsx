import React, { useState, useEffect } from 'react';
import { Icons } from '../common/Icons';

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  tenantId: string;
  permissions: 'full_access' | 'read_only' | 'restricted';
  expiresAt: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

export const ApiKeysSection: React.FC = () => {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPermissions, setNewKeyPermissions] = useState<'full_access' | 'read_only' | 'restricted'>('full_access');
  const [newKeyExpiry, setNewKeyExpiry] = useState<number | null>(null);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/v1/apikeys?tenantId=default-tenant');
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } catch {
      // Ignored
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    try {
      const res = await fetch('/api/v1/apikeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName,
          tenantId: 'default-tenant',
          permissions: newKeyPermissions,
          expiryDays: newKeyExpiry
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCreatedSecret(data.rawSecretKey);
        fetchKeys();
      }
    } catch {
      // Ignored
    }
  };

  const handleRevokeKey = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/apikeys/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setKeys(prev => prev.filter(k => k.id !== id));
      }
    } catch {
      // Ignored
    }
  };

  const handleCopySecret = async () => {
    if (!createdSecret) return;
    await navigator.clipboard.writeText(createdSecret);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const curlSnippet = `curl -X POST http://localhost:3000/api/v1/run \\
  -H "Authorization: Bearer ${createdSecret || 'fos_live_your_secret_key'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "task": "Execute 360° launch teardown",
    "employeeId": "multi-agent",
    "tenantId": "default-tenant"
  }'`;

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div style={styles.headerTextGroup}>
          <h2 style={styles.title}>API Keys</h2>
          <p style={styles.subtitle}>
            Manage secret API keys to authenticate programmatic requests to FoundryOS agents and Company Brain.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setCreatedSecret(null);
            setNewKeyName('');
            setIsModalOpen(true);
          }}
          style={styles.createBtn}
        >
          <Icons.Plus size={14} />
          <span>Create New Key</span>
        </button>
      </div>

      {/* Keys Table Card */}
      <div style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <div style={{ flex: 2 }}>NAME</div>
          <div style={{ flex: 2 }}>KEY TOKEN</div>
          <div style={{ flex: 1.5 }}>PERMISSIONS</div>
          <div style={{ flex: 1.5 }}>CREATED</div>
          <div style={{ flex: 1.2 }}>LAST USED</div>
          <div style={{ width: '60px', textAlign: 'right' }}>ACTION</div>
        </div>

        {isLoading ? (
          <div style={styles.emptyRow}>Loading API keys...</div>
        ) : keys.length === 0 ? (
          <div style={styles.emptyRow}>No API keys found. Create your first secret key above.</div>
        ) : (
          keys.map(k => (
            <div key={k.id} style={styles.tableRow}>
              <div style={{ flex: 2, fontWeight: 500, color: '#f4f4f5' }}>{k.name}</div>
              <div style={{ flex: 2, fontFamily: 'monospace', fontSize: '0.78rem', color: '#38bdf8' }}>
                {k.keyPrefix}
              </div>
              <div style={{ flex: 1.5 }}>
                <span style={styles.permissionBadge}>
                  {k.permissions === 'full_access' ? 'Full Access' : k.permissions === 'read_only' ? 'Read Only' : 'Restricted'}
                </span>
              </div>
              <div style={{ flex: 1.5, fontSize: '0.76rem', color: '#71717a' }}>
                {new Date(k.createdAt).toLocaleDateString()}
              </div>
              <div style={{ flex: 1.2, fontSize: '0.76rem', color: '#71717a' }}>
                {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : 'Never'}
              </div>
              <div style={{ width: '60px', textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={() => handleRevokeKey(k.id)}
                  style={styles.revokeBtn}
                  title="Revoke API key"
                >
                  Revoke
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quickstart API Documentation */}
      <div style={styles.apiQuickstartCard}>
        <div style={styles.quickstartHeader}>
          <div style={styles.quickstartTitleWrap}>
            <Icons.Code size={15} style={{ color: '#818cf8' }} />
            <span style={styles.quickstartTitle}>Programmatic Agent Execution</span>
          </div>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(curlSnippet);
              setCopiedCurl(true);
              setTimeout(() => setCopiedCurl(false), 2000);
            }}
            style={styles.copyCurlBtn}
          >
            {copiedCurl ? <Icons.Check size={12} style={{ color: '#34d399' }} /> : <Icons.Copy size={12} />}
            <span>{copiedCurl ? 'Copied cURL' : 'Copy cURL'}</span>
          </button>
        </div>
        <pre style={styles.codeSnippet}>{curlSnippet}</pre>
      </div>

      {/* Create Key Modal */}
      {isModalOpen && (
        <div style={styles.modalBackdrop} onClick={() => setIsModalOpen(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitle}>
                {createdSecret ? 'Secret Key Created' : 'Create New API Key'}
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                ✕
              </button>
            </div>

            {createdSecret ? (
              <div style={styles.secretRevealBox}>
                <div style={styles.warningBanner}>
                  <Icons.AlertCircle size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
                  <span>
                    Save this key now! For security reasons, you will not be able to view this secret again.
                  </span>
                </div>

                <div style={styles.secretKeyRow}>
                  <input
                    type="text"
                    readOnly
                    value={createdSecret}
                    style={styles.secretInput}
                  />
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    style={styles.copySecretBtn}
                  >
                    {copiedKey ? <Icons.Check size={13} style={{ color: '#ffffff' }} /> : <Icons.Copy size={13} />}
                    <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={styles.doneBtn}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateKey} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Key Name</label>
                  <input
                    type="text"
                    required
                    value={newKeyName}
                    onChange={e => setNewKeyName(e.target.value)}
                    style={styles.input}
                    autoFocus
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Permissions</label>
                  <select
                    value={newKeyPermissions}
                    onChange={e => setNewKeyPermissions(e.target.value as any)}
                    style={styles.select}
                  >
                    <option value="full_access">Full Access (Agent Execution & Memory)</option>
                    <option value="read_only">Read-Only (Knowledge Search & Audit)</option>
                    <option value="restricted">Restricted (Sandboxed Runs Only)</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Expiration</label>
                  <select
                    value={newKeyExpiry === null ? 'never' : String(newKeyExpiry)}
                    onChange={e => setNewKeyExpiry(e.target.value === 'never' ? null : Number(e.target.value))}
                    style={styles.select}
                  >
                    <option value="never">Never expire</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                    <option value="365">1 year</option>
                  </select>
                </div>

                <div style={styles.formActions}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={styles.submitBtn}
                    disabled={!newKeyName.trim()}
                  >
                    Create Secret Key
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
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
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px'
  },
  headerTextGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
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
  createBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    background: 'var(--text-primary)',
    border: 'none',
    borderRadius: '6px',
    color: 'var(--bg-primary)',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.18s ease'
  },
  tableCard: {
    background: 'var(--glass-bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '10px',
    overflow: 'hidden'
  },
  tableHeader: {
    display: 'flex',
    padding: '12px 18px',
    background: 'var(--glass-bg-sidebar)',
    borderBottom: '1px solid var(--border-subtle)',
    fontSize: '0.70rem',
    fontWeight: 600,
    color: 'var(--text-tertiary)',
    letterSpacing: '0.04em'
  },
  tableRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 18px',
    borderBottom: '1px solid var(--border-subtle)',
    fontSize: '0.82rem',
    color: 'var(--text-primary)'
  },
  emptyRow: {
    padding: '32px 18px',
    textAlign: 'center',
    fontSize: '0.82rem',
    color: 'var(--text-tertiary)'
  },
  permissionBadge: {
    fontSize: '0.70rem',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '12px',
    background: 'var(--glass-bg-surface)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-subtle)'
  },
  revokeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-tertiary)',
    fontSize: '0.74rem',
    cursor: 'pointer',
    padding: '4px 6px'
  },
  apiQuickstartCard: {
    background: 'var(--glass-bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '10px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  quickstartHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  quickstartTitleWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  quickstartTitle: {
    fontSize: '0.84rem',
    fontWeight: 600,
    color: 'var(--text-primary)'
  },
  copyCurlBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '5px',
    color: 'var(--text-secondary)',
    padding: '4px 10px',
    fontSize: '0.72rem',
    cursor: 'pointer'
  },
  codeSnippet: {
    margin: 0,
    padding: '12px 14px',
    background: 'var(--glass-bg-input)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '6px',
    fontFamily: 'monospace',
    fontSize: '0.78rem',
    color: 'var(--text-primary)',
    overflowX: 'auto',
    lineHeight: 1.5
  },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  },
  modalContent: {
    width: '460px',
    background: 'var(--glass-bg-modal)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: 'var(--glass-shadow-md)'
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '18px'
  },
  modalTitle: {
    fontSize: '1.05rem',
    fontWeight: 600,
    color: 'var(--text-primary)'
  },
  modalCloseBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '1rem'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '0.78rem',
    fontWeight: 500,
    color: 'var(--text-secondary)'
  },
  input: {
    background: 'var(--glass-bg-input)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '6px',
    padding: '8px 12px',
    color: 'var(--text-primary)',
    fontSize: '0.84rem',
    outline: 'none'
  },
  select: {
    background: 'var(--glass-bg-input)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '6px',
    padding: '8px 12px',
    color: 'var(--text-primary)',
    fontSize: '0.84rem',
    outline: 'none'
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '10px'
  },
  cancelBtn: {
    padding: '7px 14px',
    borderRadius: '6px',
    border: '1px solid var(--border-subtle)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: '0.80rem',
    cursor: 'pointer'
  },
  submitBtn: {
    padding: '7px 16px',
    borderRadius: '6px',
    border: 'none',
    background: 'var(--text-primary)',
    color: 'var(--bg-primary)',
    fontSize: '0.80rem',
    fontWeight: 600,
    cursor: 'pointer'
  },
  secretRevealBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  warningBanner: {
    display: 'flex',
    gap: '8px',
    padding: '10px 12px',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '6px',
    fontSize: '0.76rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.4
  },
  secretKeyRow: {
    display: 'flex',
    gap: '6px'
  },
  secretInput: {
    flex: 1,
    background: 'var(--glass-bg-input)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '6px',
    padding: '8px 12px',
    fontFamily: 'monospace',
    fontSize: '0.82rem',
    color: 'var(--text-primary)',
    outline: 'none'
  },
  copySecretBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '8px 14px',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '6px',
    color: 'var(--text-primary)',
    fontSize: '0.78rem',
    fontWeight: 500,
    cursor: 'pointer'
  },
  doneBtn: {
    padding: '7px 18px',
    background: 'var(--text-primary)',
    border: 'none',
    borderRadius: '6px',
    color: 'var(--bg-primary)',
    fontSize: '0.80rem',
    fontWeight: 600,
    cursor: 'pointer'
  }
};
