import React from 'react';
import { useApp } from '../../context/AppContext';
import { Icons } from '../common/Icons';

export const FileUploadArea: React.FC = () => {
  const { attachedFiles, removeAttachedFile } = useApp();

  if (attachedFiles.length === 0) return null;

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <span style={styles.countBadge}>
          <Icons.Paperclip size={13} />
          <span>{attachedFiles.length}/5 Files Attached (Max 5)</span>
        </span>
      </div>
      <div style={styles.chipDeck}>
        {attachedFiles.map((file, idx) => (
          <div key={idx} style={styles.chip}>
            <Icons.Paperclip size={13} style={{ color: 'var(--apple-accent)', flexShrink: 0 }} />
            <span style={styles.fileName} title={file.fileName}>
              {file.fileName}
            </span>
            {file.size && <span style={styles.fileSize}>{formatSize(file.size)}</span>}
            <button
              onClick={() => removeAttachedFile(idx)}
              style={styles.removeBtn}
              title="Remove file"
            >
              <Icons.Close size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '8px 16px',
    marginBottom: '8px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 'var(--radius-md)',
    border: '1px dashed var(--glass-border-specular)'
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px'
  },
  countBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.72rem',
    fontWeight: 600,
    fontFamily: 'var(--font-mono)',
    color: 'var(--apple-accent)'
  },
  chipDeck: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px'
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    background: 'var(--glass-bg-card)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-pill)',
    fontSize: '0.75rem',
    color: 'var(--text-primary)',
    maxWidth: '220px',
    boxShadow: 'var(--glass-shadow-sm)'
  },
  fileName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontWeight: 500
  },
  fileSize: {
    fontSize: '0.68rem',
    color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-mono)'
  },
  removeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: '2px',
    borderRadius: '50%',
    transition: 'color var(--transition-fast)'
  }
};
