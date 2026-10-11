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
    selectedAgentId,
    setSelectedAgentId,
    mcpServers,
    setActiveView,
    uploadDocumentToArchive
  } = useApp();

  const [inputVal, setInputVal] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isAgentMenuOpen, setIsAgentMenuOpen] = useState(false);
  const [isPluginsMenuOpen, setIsPluginsMenuOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const agentMenuRef = useRef<HTMLDivElement>(null);
  const pluginsMenuRef = useRef<HTMLDivElement>(null);

  const isExhausted = creditStatus?.isExhausted ?? false;

  const agentOptions = [
    { id: 'auto', label: 'Auto Route', desc: 'Dispatches task to specialist or lightweight normal agent if no heavy model is needed', icon: <Icons.Sparkles size={16} /> },
    { id: 'foundryos-assistant', label: 'Normal Agent (Lightweight)', role: 'Lightweight Fast-Path', desc: 'Instant Q&A, company context & 0-credit fast execution', icon: <Icons.Zap size={16} /> },
    { id: 'market-research-analyst', label: 'Maya Lin', role: 'Market Analyst', desc: 'TAM, search volume, market trends', icon: <Icons.Search size={16} /> },
    { id: 'competitor-analyst', label: 'Julian Vance', role: 'Competitor Intelligence', desc: 'Pricing, feature matrices, moats', icon: <Icons.Shield size={16} /> },
    { id: 'chief-marketing-strategist', label: 'Sarah Sterling', role: 'Chief Strategist', desc: 'Positioning statements & value props', icon: <Icons.Target size={16} /> },
    { id: 'gtm-funnel-strategist', label: 'Marcus Brody', role: 'GTM Funnel Architect', desc: 'Funnel stages, TOFU/MOFU/BOFU offers', icon: <Icons.TrendingUp size={16} /> },
    { id: 'multi-agent', label: 'Multi-Agent Team', desc: 'Collaborative run across all 4 specialists', icon: <Icons.Users size={16} /> }
  ];

  const currentAgent = agentOptions.find(a => a.id === selectedAgentId) || agentOptions[0];

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputVal]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (agentMenuRef.current && !agentMenuRef.current.contains(e.target as Node)) {
        setIsAgentMenuOpen(false);
      }
      if (pluginsMenuRef.current && !pluginsMenuRef.current.contains(e.target as Node)) {
        setIsPluginsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isExecuting) return;
    if (isExhausted) {
      setErrorMessage('Daily credit limit reached (100/100). Resets at midnight UTC.');
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
          // Auto-save to Document Archive & index in Semantic Memory
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
        {/* Top Control Bar: Agent Selector & Plugins Pill directly inside Chat Bar */}
        <div style={styles.toolbarRow}>
          {/* Agent Selector Dropdown */}
          <div style={{ position: 'relative' }} ref={agentMenuRef}>
            <button
              type="button"
              onClick={() => {
                setIsAgentMenuOpen(prev => !prev);
                setIsPluginsMenuOpen(false);
              }}
              style={styles.pillButton}
              title="Select Agent for this prompt"
            >
              <span style={styles.pillIconWrap}>{currentAgent.icon}</span>
              <span style={{ fontWeight: 600 }}>{currentAgent.label}</span>
              <Icons.ChevronDown size={12} />
            </button>

            {isAgentMenuOpen && (
              <div style={styles.popoverMenu}>
                <div style={styles.popoverHeader}>Select Specialist Agent</div>
                {agentOptions.map(opt => {
                  const isSelected = opt.id === selectedAgentId;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => {
                        setSelectedAgentId(opt.id);
                        setIsAgentMenuOpen(false);
                      }}
                      style={{
                        ...styles.menuItem,
                        ...(isSelected ? styles.menuItemSelected : {})
                      }}
                    >
                      <span style={styles.menuIconWrap}>{opt.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={styles.itemTitle}>{opt.label}</div>
                        <div style={styles.itemDesc}>{opt.desc}</div>
                      </div>
                      {isSelected && <Icons.Check size={14} />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Plugins & MCP Selector Pill */}
          <div style={{ position: 'relative' }} ref={pluginsMenuRef}>
            <button
              type="button"
              onClick={() => {
                setIsPluginsMenuOpen(prev => !prev);
                setIsAgentMenuOpen(false);
              }}
              style={styles.pillButton}
              title="Connected Plugins & MCP Servers"
            >
              <Icons.Plugins size={14} />
              <span>Plugins: <strong>{mcpServers.length || 7} MCP</strong></span>
              <Icons.ChevronDown size={12} />
            </button>

            {isPluginsMenuOpen && (
              <div style={{ ...styles.popoverMenu, width: '330px' }}>
                <div style={styles.popoverHeader}>Connected Plugins & MCP Suite (7 Servers)</div>
                <div style={styles.mcpList}>
                  <div style={styles.mcpItem}>
                    <span style={styles.mcpDot} />
                    <div style={{ flex: 1 }}>
                      <div style={styles.mcpName}>Slack Third-Party MCP</div>
                      <div style={styles.mcpDesc}>Channel broadcast, alerts & HITL notifications</div>
                    </div>
                  </div>
                  <div style={styles.mcpItem}>
                    <span style={styles.mcpDot} />
                    <div style={{ flex: 1 }}>
                      <div style={styles.mcpName}>Google Drive Third-Party MCP</div>
                      <div style={styles.mcpDesc}>Cloud doc uploads, file sync & search</div>
                    </div>
                  </div>
                  <div style={styles.mcpItem}>
                    <span style={styles.mcpDot} />
                    <div style={{ flex: 1 }}>
                      <div style={styles.mcpName}>Foundry Brain Memory MCP</div>
                      <div style={styles.mcpDesc}>Semantic vector query & autonomous memory</div>
                    </div>
                  </div>
                  <div style={styles.mcpItem}>
                    <span style={styles.mcpDot} />
                    <div style={{ flex: 1 }}>
                      <div style={styles.mcpName}>Document Archive & PDF MCP</div>
                      <div style={styles.mcpDesc}>Report generation, vault sync & PDF export</div>
                    </div>
                  </div>
                  <div style={styles.mcpItem}>
                    <span style={styles.mcpDot} />
                    <div style={{ flex: 1 }}>
                      <div style={styles.mcpName}>Market Intel MCP</div>
                      <div style={styles.mcpDesc}>DuckDuckGo search, tech trends, page fetcher</div>
                    </div>
                  </div>
                  <div style={styles.mcpItem}>
                    <span style={styles.mcpDot} />
                    <div style={{ flex: 1 }}>
                      <div style={styles.mcpName}>SEO & Competitor Audit MCP</div>
                      <div style={styles.mcpDesc}>Keyword suggestion, pricing teardowns</div>
                    </div>
                  </div>
                  <div style={styles.mcpItem}>
                    <span style={styles.mcpDot} />
                    <div style={{ flex: 1 }}>
                      <div style={styles.mcpName}>Growth & GTM Analytics MCP</div>
                      <div style={styles.mcpDesc}>CAC/LTV modeling, funnel benchmarks</div>
                    </div>
                  </div>
                </div>

                <div style={styles.popoverFooter}>
                  <button
                    onClick={() => {
                      setIsPluginsMenuOpen(false);
                      setActiveView('plugins');
                    }}
                    style={styles.openPlaygroundBtn}
                  >
                    Open Plugins Playground →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Attach Document Trigger */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={styles.pillButton}
            title={`Attach up to 5 documents (${attachedFiles.length}/5 attached)`}
          >
            <Icons.Paperclip size={14} />
            <span>Attach {attachedFiles.length > 0 ? `(${attachedFiles.length}/5)` : ''}</span>
          </button>

          {/* Third-Party Integrations Quick Action */}
          <button
            type="button"
            onClick={() => setActiveView('integrations')}
            style={styles.pillButton}
            title="Configure Slack and Google Drive Integrations"
          >
            <Icons.Link size={13} style={{ color: '#818cf8' }} />
            <span>Integrations</span>
          </button>
        </div>

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

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isExhausted
                ? 'Daily credit limit reached (100 credits). Allowance resets at midnight UTC.'
                : `Message ${currentAgent.label} or ask a strategic marketing question...`
            }
            disabled={isExhausted}
            rows={1}
            style={styles.textarea}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={isExecuting || (!inputVal.trim() && attachedFiles.length === 0) || isExhausted}
            style={{
              ...styles.sendBtn,
              opacity: isExecuting || (!inputVal.trim() && attachedFiles.length === 0) || isExhausted ? 0.35 : 1
            }}
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
    padding: '10px 14px',
    boxShadow: 'var(--glass-shadow-sm)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  toolbarRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    paddingBottom: '4px',
    borderBottom: '1px solid var(--glass-border-subtle)',
    flexWrap: 'wrap'
  },
  pillButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 9px',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-xs)',
    color: 'var(--text-secondary)',
    fontSize: '0.74rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all var(--transition-fast)'
  },
  pillIconWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-primary)'
  },
  menuIconWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-primary)',
    flexShrink: 0
  },
  chevron: {
    fontSize: '0.65rem',
    opacity: 0.6
  },
  popoverMenu: {
    position: 'absolute',
    bottom: 'calc(100% + 8px)',
    left: 0,
    width: '290px',
    background: 'var(--glass-bg-modal)',
    border: '1px solid var(--glass-border-specular)',
    borderRadius: 'var(--radius-sm)',
    boxShadow: 'var(--glass-shadow-md)',
    padding: '6px',
    zIndex: 100,
    animation: 'fadeSlideUp 0.18s var(--ease-smooth)'
  },
  popoverHeader: {
    fontSize: '0.68rem',
    fontWeight: 600,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    padding: '6px 8px',
    borderBottom: '1px solid var(--glass-border-subtle)',
    marginBottom: '4px'
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '7px 8px',
    borderRadius: 'var(--radius-xs)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)'
  },
  menuItemSelected: {
    background: 'rgba(255, 255, 255, 0.08)'
  },
  itemTitle: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-primary)'
  },
  itemDesc: {
    fontSize: '0.68rem',
    color: 'var(--text-tertiary)'
  },
  checkIcon: {
    fontSize: '0.78rem',
    color: 'var(--text-primary)',
    fontWeight: 700
  },
  mcpList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '4px 0'
  },
  mcpItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    padding: '6px 8px'
  },
  mcpDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#10b981',
    marginTop: '4px'
  },
  mcpName: {
    fontSize: '0.76rem',
    fontWeight: 600,
    color: 'var(--text-primary)'
  },
  mcpDesc: {
    fontSize: '0.66rem',
    color: 'var(--text-tertiary)'
  },
  popoverFooter: {
    paddingTop: '6px',
    borderTop: '1px solid var(--glass-border-subtle)',
    marginTop: '4px'
  },
  openPlaygroundBtn: {
    width: '100%',
    padding: '6px',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '0.74rem',
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'center'
  },
  formRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '10px'
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
    flexShrink: 0,
    marginBottom: '2px'
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
