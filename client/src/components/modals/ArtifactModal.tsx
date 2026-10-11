import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Icons } from '../common/Icons';

export const ArtifactModal: React.FC = () => {
  const { activeArtifact, isArtifactModalOpen, setIsArtifactModalOpen } = useApp();
  const [copied, setCopied] = useState(false);

  if (!isArtifactModalOpen || !activeArtifact) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeArtifact.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignored
    }
  };

  const handleDownload = () => {
    const blob = new Blob([activeArtifact.content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeArtifact.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={styles.backdrop} onClick={() => setIsArtifactModalOpen(false)}>
      <div style={styles.dialog} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <div style={styles.badgeRow}>
              <span style={styles.badge}>{activeArtifact.type}</span>
              <span style={styles.date}>{activeArtifact.createdAt}</span>
            </div>
            <h2 style={styles.title}>{activeArtifact.title}</h2>
          </div>

          <div style={styles.actionRow}>
            <button onClick={handleCopy} style={styles.actionBtn}>
              {copied ? <Icons.Check size={14} style={{ color: 'var(--apple-success)' }} /> : <Icons.Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button onClick={handleDownload} style={styles.actionBtn}>
              <Icons.Reports size={14} />
              <span>Download .md</span>
            </button>
            <button onClick={() => setIsArtifactModalOpen(false)} style={styles.closeBtn}>
              <Icons.Close size={16} />
            </button>
          </div>
        </div>

        {/* Markdown Content Viewer */}
        <div style={styles.body}>
          <pre style={styles.preContent}>{activeArtifact.content}</pre>
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
    padding: '24px'
  },
  dialog: {
    background: 'var(--glass-bg-modal)',
    border: '1px solid var(--glass-border-specular)',
    borderRadius: 'var(--radius-sm)',
    boxShadow: 'var(--glass-shadow-md)',
    width: '100%',
    maxWidth: '860px',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '20px 24px',
    borderBottom: '1px solid var(--glass-border-subtle)'
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px'
  },
  badge: {
    fontSize: '0.68rem',
    fontWeight: 500,
    padding: '2px 6px',
    borderRadius: 'var(--radius-xs)',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--glass-border-subtle)',
    color: 'var(--text-secondary)'
  },
  date: {
    fontSize: '0.72rem',
    color: 'var(--text-tertiary)'
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.15rem',
    fontWeight: 600,
    color: 'var(--text-primary)'
  },
  actionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '5px 10px',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-xs)',
    color: 'var(--text-secondary)',
    fontSize: '0.76rem',
    fontWeight: 500,
    cursor: 'pointer'
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center'
  },
  body: {
    padding: '28px',
    overflowY: 'auto',
    flex: 1
  },
  preContent: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.92rem',
    lineHeight: '1.65',
    color: 'var(--text-primary)',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  }
};
