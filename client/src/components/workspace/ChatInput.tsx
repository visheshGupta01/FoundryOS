import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Icons } from '../common/Icons';
import { FileUploadArea } from './FileUploadArea';

export const ChatInput: React.FC = () => {
  const {
    executeAgentRun,
    isExecuting,
    attachedFiles,
    addAttachedFile,
    creditStatus,
    uploadDocumentToArchive
  } = useApp();

  const [inputVal, setInputVal] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isExhausted = creditStatus?.isExhausted ?? false;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputVal]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isExecuting) return;
    if (isExhausted) {
      setErrorMessage('Daily compute capacity reached (100% utilized). Allowance resets automatically at midnight UTC.');
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }
    const trimmed = inputVal.trim();
    if (!trimmed && attachedFiles.length === 0) return;

    setInputVal('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await executeAgentRun(trimmed || 'Please review the attached document(s) and provide strategic marketing insights.');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachedFiles.length + files.length > 5) {
      setErrorMessage(`Cannot attach more than 5 files total. You already have ${attachedFiles.length}.`);
      setTimeout(() => setErrorMessage(null), 4000);
      e.target.value = '';
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const text = await file.text();
        const res = addAttachedFile({
          fileName: file.name,
          content: text,
          size: file.size
        });
        if (!res.success && res.error) {
          setErrorMessage(res.error);
          setTimeout(() => setErrorMessage(null), 4000);
        } else {
          uploadDocumentToArchive(file.name, file.name, text).catch(() => {});
          setSuccessToast(`Saved "${file.name}" to Document Vault & Semantic Memory`);
          setTimeout(() => setSuccessToast(null), 3000);
        }
      } catch {
        setErrorMessage(`Could not read file ${file.name}`);
        setTimeout(() => setErrorMessage(null), 4000);
      }
    }
    e.target.value = '';
  };

  return (
    <div style={styles.dockWrapper}>
      {errorMessage && (
        <div style={styles.errorToast}>
          <Icons.AlertCircle size={15} />
          <span>{errorMessage}</span>
        </div>
      )}
      {successToast && (
        <div style={{ ...styles.errorToast, background: 'rgba(34, 197, 94, 0.15)', borderColor: 'rgba(34, 197, 94, 0.3)', color: '#22c55e' }}>
          <Icons.Check size={15} />
          <span>{successToast}</span>
        </div>
      )}

      <div style={styles.dockCard}>
        {/* Multi-File Upload Chips Deck */}
        <FileUploadArea />

        {/* Input Form */}
        <form onSubmit={handleSubmit} style={styles.formRow}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            style={{ display: 'none' }}
          />

          {/* Paperclip Attach Button (Left side) */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="interactive-hover-lift"
            style={styles.attachBtn}
            title={`Attach documents (max 5)${attachedFiles.length > 0 ? ` - ${attachedFiles.length}/5 attached` : ''}`}
          >
            <Icons.Paperclip size={16} />
          </button>

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder=""
            disabled={isExhausted}
            rows={1}
            style={styles.textarea}
          />

          {/* Send Button (Right side) */}
          <button
            type="submit"
            disabled={isExecuting || (!inputVal.trim() && attachedFiles.length === 0) || isExhausted}
            className="interactive-hover-lift"
            style={{
              ...styles.sendBtn,
              opacity: isExecuting || (!inputVal.trim() && attachedFiles.length === 0) || isExhausted ? 0.35 : 1
            }}
            title="Send message"
          >
            {isExecuting ? (
              <span style={styles.spinner} />
            ) : (
              <Icons.Send size={16} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  dockWrapper: {
    padding: '0 24px 24px 24px',
    maxWidth: '960px',
    margin: '0 auto',
    width: '100%',
    position: 'relative',
    animation: 'fadeSlideUp 0.3s var(--ease-apple)'
  },
  errorToast: {
    position: 'absolute',
    top: '-38px',
    left: '24px',
    right: '24px',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    backdropFilter: 'var(--glass-blur)',
    color: '#ffffff',
    padding: '7px 16px',
    borderRadius: 'var(--radius-pill)',
    fontSize: '0.8rem',
    fontWeight: 500,
    display: 'flex',
    justifyContent: 'center',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
  },
  dockCard: {
    maxWidth: '860px',
    margin: '0 auto',
    width: '100%',
    background: 'var(--glass-bg-card)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-md)',
    padding: '8px 12px',
    boxShadow: 'var(--glass-shadow-sm)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  formRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px'
  },
  textarea: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.92rem',
    lineHeight: '1.45',
    resize: 'none',
    padding: '6px 4px',
    maxHeight: '180px'
  },
  attachBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    width: '32px',
    height: '32px',
    borderRadius: 'var(--radius-xs)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    flexShrink: 0,
    marginBottom: '2px'
  },
  sendBtn: {
    background: 'var(--accent-primary)',
    border: 'none',
    color: 'var(--glass-bg-base)',
    width: '32px',
    height: '32px',
    borderRadius: 'var(--radius-xs)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
    transition: 'all var(--transition-fast)',
    flexShrink: 0
  },
  spinner: {
    width: '14px',
    height: '14px',
    border: '2px solid rgba(0, 0, 0, 0.2)',
    borderTopColor: 'var(--glass-bg-base)',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.8s linear infinite'
  }
};
