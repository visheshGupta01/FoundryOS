import React, { useState } from 'react';
import type { Message } from '../../types';
import { useApp } from '../../context/AppContext';
import { Icons } from '../common/Icons';
import { formatAgentOutputToMarkdown } from '../../utils/formatOutput';
import { MarkdownRenderer } from '../common/MarkdownRenderer';

export const MessageItem: React.FC<{ message: Message }> = ({ message }) => {
  const { setActiveArtifact, setIsArtifactModalOpen, resolveHitlApproval, generatePdfDeliverable, executeAgentRun } = useApp();
  const [copied, setCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Record<number, boolean>>({});
  const [isResolvingHitl, setIsResolvingHitl] = useState(false);

  const markdownString = typeof message.content === 'string'
    ? message.content
    : formatAgentOutputToMarkdown(message.content);

  const isAssistant = !message.isUser;

  const tokens = React.useMemo(() => {
    if (!markdownString) return [];
    return markdownString.match(/(\S+|\s+)/g) || [markdownString];
  }, [markdownString]);

  const [isTyping, setIsTyping] = useState(() => Boolean(isAssistant && message.isStreaming));
  const [tokenIndex, setTokenIndex] = useState(() => (isAssistant && message.isStreaming ? 0 : tokens.length));

  React.useEffect(() => {
    if (!isTyping) return;
    if (tokenIndex >= tokens.length) {
      setIsTyping(false);
      return;
    }

    const remaining = tokens.length - tokenIndex;
    const step = tokens.length > 250
      ? Math.max(2, Math.ceil(remaining / 28))
      : 1;

    const currentToken = tokens[tokenIndex] || '';
    const hasPunctuation = /[.,!?;:\n]/.test(currentToken);
    const delay = hasPunctuation ? 24 : 12;

    const timer = setTimeout(() => {
      setTokenIndex(prev => Math.min(prev + step, tokens.length));
    }, delay);

    return () => clearTimeout(timer);
  }, [tokenIndex, isTyping, tokens]);

  const handleSkipTyping = () => {
    setTokenIndex(tokens.length);
    setIsTyping(false);
  };

  const displayedContent = isTyping ? tokens.slice(0, tokenIndex).join('') : markdownString;
  const [selectedOptionId, setSelectedOptionId] = useState<string>(() => {
    const opts = message.pendingApproval?.options;
    if (opts && opts.length > 0) {
      const rec = opts.find(o => o.recommended);
      return rec ? rec.id : opts[0].id;
    }
    return 'custom';
  });
  const [customAnswerText, setCustomAnswerText] = useState('');

  const toggleTool = (idx: number) => {
    setExpandedTools(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleCopy = async () => {
    try {
      const textToCopy = typeof message.content === 'string'
        ? message.content
        : formatAgentOutputToMarkdown(message.content);
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignored
    }
  };

  const handleHitlDecision = async (decision: 'approve' | 'reject') => {
    if (!message.pendingApproval) return;
    setIsResolvingHitl(true);
    try {
      const opts = message.pendingApproval.options || [];
      const chosenOpt = opts.find(o => o.id === selectedOptionId);
      const isCustom = selectedOptionId === 'custom' || (!chosenOpt && customAnswerText.trim().length > 0);
      const chosenLabel = isCustom
        ? (customAnswerText.trim() || 'Custom Founder Strategy')
        : (chosenOpt ? chosenOpt.label : undefined);
      const customVal = isCustom ? customAnswerText.trim() : undefined;
      const commentVal = isCustom ? customAnswerText.trim() : undefined;

      await resolveHitlApproval(
        message.pendingApproval.approvalId,
        decision,
        commentVal,
        selectedOptionId,
        customVal,
        chosenLabel,
        false
      );
    } finally {
      setIsResolvingHitl(false);
    }
  };



  const renderAvatarIcon = () => {
    if (message.isUser) {
      return <Icons.User size={16} />;
    }
    const avatar = String(message.avatar || '').toUpperCase();
    const sender = String(message.sender || '').toLowerCase();

    if (avatar === 'MR' || sender.includes('market') || sender.includes('maya')) {
      return <Icons.Search size={16} style={{ color: '#38bdf8' }} />;
    }
    if (avatar === 'CI' || sender.includes('competitor') || sender.includes('julian')) {
      return <Icons.Shield size={16} style={{ color: '#f87171' }} />;
    }
    if (avatar === 'CS' || sender.includes('strategist') || sender.includes('sarah')) {
      return <Icons.Target size={16} style={{ color: '#a78bfa' }} />;
    }
    if (avatar === 'FS' || sender.includes('funnel') || sender.includes('marcus')) {
      return <Icons.TrendingUp size={16} style={{ color: '#34d399' }} />;
    }
    if (avatar === 'SYS' || sender.includes('guardrail')) {
      return <Icons.AlertCircle size={16} style={{ color: '#f59e0b' }} />;
    }
    if (avatar === 'NA' || message.isLightweight) {
      return <Icons.Zap size={16} style={{ color: '#eab308' }} />;
    }
    return <Icons.Bot size={16} style={{ color: 'var(--text-primary)' }} />;
  };

  if (message.isUser) {
    return (
      <div className="message-user-animate" style={styles.userRow}>
        <div style={styles.userPill}>
          <div style={styles.userContent}>{displayedContent}</div>
          <span style={styles.userTime}>{message.timestamp}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="gemini-turn-animate" style={styles.geminiTurnContainer}>
      {/* Gemini Editorial Top Header */}
      <div style={styles.geminiHeader}>
        <div style={styles.geminiIdentity}>
          <div style={styles.geminiAvatarPill}>
            {renderAvatarIcon()}
          </div>
          <div style={styles.geminiMetaGroup}>
            <div style={styles.geminiNameRow}>
              <span style={styles.geminiSenderName}>{message.sender}</span>
              <span style={styles.geminiSparkleBadge}>✦ FoundryOS</span>
              {message.isLightweight && (
                <span style={styles.lightweightBadge}>
                  <Icons.Zap size={10} style={{ marginRight: 3 }} />
                  FAST-PATH
                </span>
              )}
            </div>
            <span style={styles.geminiTimestamp}>{message.timestamp}</span>
          </div>
        </div>

        <div style={styles.geminiActionRow}>
          <button
            type="button"
            onClick={async () => {
              setIsExportingPdf(true);
              await generatePdfDeliverable(
                `${message.sender} Strategy Deliverable`,
                markdownString,
                `Strategic brief formulated by ${message.sender}`
              );
              setIsExportingPdf(false);
            }}
            className="interactive-hover-lift"
            style={styles.geminiExportBtn}
            title="Download formatted PDF deliverable"
            disabled={isExportingPdf}
          >
            <Icons.FileText size={12} />
            <span>{isExportingPdf ? 'Exporting...' : 'Export PDF'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="interactive-hover-lift"
            style={styles.geminiCopyBtn}
            title="Copy response"
          >
            {copied ? <Icons.Check size={13} style={{ color: '#34d399' }} /> : <Icons.Copy size={13} />}
          </button>
        </div>
      </div>

      <div style={styles.geminiContentBody}>
        {/* Tool Call Disclosure Chips */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div style={styles.toolCallsDeck}>
            {message.toolCalls.map((tool, idx) => {
              const isExpanded = !!expandedTools[idx];
              const isFailed = tool.success === false;
              const payload = tool.output !== undefined
                ? tool.output
                : (tool.result !== undefined ? tool.result : null);
              const isMcp = tool.toolName.startsWith('mcp:') || tool.toolName.includes('_mcp_');
              const latencyText = tool.durationMs !== undefined ? `${tool.durationMs}ms` : 'Live';

              return (
                <div key={idx} style={{ ...styles.toolCard, ...(isFailed ? { borderColor: 'rgba(239, 68, 68, 0.4)' } : {}) }}>
                  <div onClick={() => toggleTool(idx)} className="interactive-hover-lift" style={styles.toolHeader}>
                    <span style={{ ...styles.mcpBadge, ...(isMcp ? {} : { background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }) }}>
                      {isMcp ? 'MCP' : 'REALTIME TOOL'}
                    </span>
                    <span style={styles.toolName}><strong>{tool.toolName}</strong></span>
                    <span style={styles.toolStatus}>
                      <span style={{ ...styles.toolStatusDot, ...(isFailed ? { background: '#ef4444' } : {}) }} />
                      <span>{isFailed ? 'Degraded' : latencyText}</span>
                    </span>
                    <span style={styles.toolToggle}>{isExpanded ? '▲ Hide' : '▼ Inspect'}</span>
                  </div>

                  {isExpanded && (
                    <div className="tool-accordion-animate" style={styles.toolBody}>
                      <div style={styles.toolSubheader}>Parameters</div>
                      <pre style={styles.jsonPre}>
                        {JSON.stringify(tool.input ?? {}, null, 2)}
                      </pre>
                      <div style={styles.toolSubheader}>Output Payload</div>
                      <pre style={styles.jsonPre}>
                        {payload !== null && payload !== undefined
                          ? (typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2))
                          : JSON.stringify({ status: 'completed', message: 'Executed with positive status' }, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Body Content Formatted with Rich Markdown Renderer & Typewriter Animation */}
        <div style={styles.contentBody}>
          <MarkdownRenderer content={displayedContent} />
          {isTyping && (
            <div style={styles.typingControlRow}>
              <span className="streaming-caret" />
              <button
                type="button"
                onClick={handleSkipTyping}
                className="interactive-hover-lift"
                style={styles.skipTypingBtn}
                title="Display full response immediately"
              >
                <Icons.Zap size={11} style={{ color: '#38bdf8' }} />
                <span>Instant view</span>
              </button>
            </div>
          )}
        </div>

        {/* Interactive Human-In-The-Loop Steering Card */}
        {message.pendingApproval && (
          <div style={{
            ...styles.hitlCard,
            ...(message.pendingApproval.status === 'approved' ? styles.hitlCardApproved : {}),
            ...(message.pendingApproval.status === 'rejected' ? styles.hitlCardRejected : {})
          }}>
            <div style={styles.hitlHeaderRow}>
              <div style={styles.hitlTitleWrap}>
                <Icons.Shield size={16} style={{ color: message.pendingApproval.status === 'approved' ? '#34d399' : message.pendingApproval.status === 'rejected' ? '#f87171' : '#fbbf24' }} />
                <span style={styles.hitlHeaderTitle}>Human-In-The-Loop Steering Gate</span>
              </div>
              <span style={{
                ...styles.hitlBadge,
                ...(message.pendingApproval.status === 'approved' ? styles.hitlBadgeApproved : {}),
                ...(message.pendingApproval.status === 'rejected' ? styles.hitlBadgeRejected : {})
              }}>
                {message.pendingApproval.status === 'approved' ? '✓ Directive Confirmed' : message.pendingApproval.status === 'rejected' ? '✕ Re-Planning' : '⚡ Founder Choice Required'}
              </span>
            </div>

            <div style={styles.hitlSubject}>{message.pendingApproval.title}</div>
            <div style={styles.hitlDescription}>{message.pendingApproval.description}</div>

            {message.pendingApproval.status === 'pending' && (
              <div style={styles.hitlInteractiveArea}>
                <div style={styles.hitlPromptLabel}>
                  <Icons.Target size={13} style={{ color: '#818cf8' }} />
                  <span>Select a strategic direction or specify your own answer:</span>
                </div>

                <div style={styles.optionsGrid}>
                  {(message.pendingApproval.options || [
                    { id: 'opt-plg', label: 'PLG & Self-Serve Growth', description: 'Focus on frictionless self-serve onboarding, interactive demo, and organic developer virality.', recommended: true },
                    { id: 'opt-abm', label: 'Enterprise ABM & Strategic Governance', description: 'Target high-contract enterprise accounts with custom ROI benchmarks and strategic governance.', badge: 'Enterprise' },
                    { id: 'opt-disruptive', label: 'Category Disruption & Agency Alternative', description: 'High-contrast challenger narrative contrasting manual agencies with autonomous execution.', badge: 'Disruptive' }
                  ]).map((opt) => {
                    const isSelected = selectedOptionId === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setSelectedOptionId(opt.id)}
                        style={{
                          ...styles.optionCard,
                          ...(isSelected ? styles.optionCardActive : {})
                        }}
                      >
                        <div style={styles.optionHeader}>
                          <div style={{
                            ...styles.radioCircle,
                            ...(isSelected ? styles.radioCircleActive : {})
                          }}>
                            {isSelected && <div style={styles.radioDot} />}
                          </div>
                          <span style={styles.optionLabel}>{opt.label}</span>
                          {opt.recommended && <span style={styles.recommendedBadge}>RECOMMENDED</span>}
                          {opt.badge && !opt.recommended && <span style={styles.optionBadge}>{opt.badge}</span>}
                        </div>
                        <p style={styles.optionDescription}>{opt.description}</p>
                      </div>
                    );
                  })}

                  {/* 4th Option: Tell Your Own Answer */}
                  <div
                    onClick={() => setSelectedOptionId('custom')}
                    style={{
                      ...styles.optionCard,
                      ...(selectedOptionId === 'custom' ? styles.optionCardActive : {})
                    }}
                  >
                    <div style={styles.optionHeader}>
                      <div style={{
                        ...styles.radioCircle,
                        ...(selectedOptionId === 'custom' ? styles.radioCircleActive : {})
                      }}>
                        {selectedOptionId === 'custom' && <div style={styles.radioDot} />}
                      </div>
                      <span style={styles.optionLabel}>✍️ Tell your own answer</span>
                      <span style={styles.customBadge}>CUSTOM INPUT</span>
                    </div>
                    <p style={styles.optionDescription}>
                      Define your own direction, tactical constraints, or unique angles for the plan.
                    </p>

                    {selectedOptionId === 'custom' && (
                      <div style={styles.customInputWrapper} onClick={(e) => e.stopPropagation()}>
                        <textarea
                          rows={2}
                          placeholder=""
                          value={customAnswerText}
                          onChange={(e) => setCustomAnswerText(e.target.value)}
                          style={styles.customTextarea}
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div style={styles.hitlBtnGroup}>
                  <button
                    type="button"
                    disabled={isResolvingHitl}
                    onClick={() => handleHitlDecision('reject')}
                    style={styles.hitlRejectBtn}
                    title="Reject this plan and prompt the agent to synthesize fresh alternatives"
                  >
                    ✕ Reject & Try New Things
                  </button>
                  <button
                    type="button"
                    disabled={isResolvingHitl || (selectedOptionId === 'custom' && !customAnswerText.trim())}
                    onClick={() => handleHitlDecision('approve')}
                    style={{
                      ...styles.hitlApproveBtn,
                      opacity: (selectedOptionId === 'custom' && !customAnswerText.trim()) ? 0.6 : 1
                    }}
                  >
                    {isResolvingHitl ? 'Building Plan...' : '✓ Confirm & Build Plan →'}
                  </button>
                </div>
              </div>
            )}

            {message.pendingApproval.status === 'approved' && (
              <div style={styles.hitlResolvedText}>
                ✓ Founder Direction Selected: <strong>{message.pendingApproval.customAnswer ? `"${message.pendingApproval.customAnswer}"` : (message.pendingApproval.decisionComment || 'Strategic Directive Approved')}</strong> • Plan synthesized and committed to execution
              </div>
            )}

            {message.pendingApproval.status === 'rejected' && (
              <div style={styles.hitlRejectedText}>
                ✕ Plan Direction Declined by Founder • Re-evaluating objectives with alternative strategies
              </div>
            )}
          </div>
        )}

        {/* Generated Artifacts Pill / Card */}
        {message.artifacts && message.artifacts.length > 0 && (
          <div style={styles.artifactsContainer}>
            <div style={styles.artifactSectionTitle}>
              <Icons.FileText size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
              Generated Customer Deliverables:
            </div>
            {message.artifacts.map((art, aIdx) => (
              <div
                key={aIdx}
                onClick={() => {
                  setActiveArtifact(art);
                  setIsArtifactModalOpen(true);
                }}
                style={styles.artifactPill}
              >
                <Icons.Reports size={14} style={{ color: '#ffffff' }} />
                <span style={styles.artifactTitle}>{art.title}</span>
                <span style={styles.artifactTag}>{art.type}</span>
                <span style={styles.artifactAction}>Preview →</span>
              </div>
            ))}
          </div>
        )}

        {/* Dynamic AI Suggested Next Steps */}
        {!message.isUser && message.suggestions && message.suggestions.length > 0 && (
          <div style={styles.suggestionsContainer}>
            <div style={styles.suggestionsHeader}>
              <Icons.Sparkles size={13} style={{ color: '#818cf8' }} />
              <span>Suggested Next Actions:</span>
            </div>
            <div style={styles.suggestionsGrid}>
              {message.suggestions.map((sug, sIdx) => (
                <button
                  key={sIdx}
                  type="button"
                  className="interactive-hover-lift"
                  onClick={() => executeAgentRun(sug.prompt, sug.agentId)}
                  style={styles.suggestionChip}
                >
                  <span style={styles.suggestionText}>{sug.label}</span>
                  <Icons.ArrowRight size={12} style={styles.suggestionArrow} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div style={styles.geminiTurnDivider} />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  userRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    width: '100%',
    maxWidth: '920px',
    margin: '0 auto 18px auto',
    padding: '0 20px',
    animation: 'fadeSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
  },
  userPill: {
    background: 'rgba(255, 255, 255, 0.07)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '22px',
    padding: '11px 20px',
    maxWidth: '78%',
    color: 'var(--text-primary)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.2)'
  },
  userContent: {
    fontSize: '0.94rem',
    lineHeight: '1.55',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    color: '#f4f4f5'
  },
  userTime: {
    fontSize: '0.68rem',
    color: 'var(--text-muted)'
  },
  geminiTurnContainer: {
    width: '100%',
    maxWidth: '920px',
    margin: '0 auto 28px auto',
    padding: '0 20px',
    display: 'flex',
    flexDirection: 'column',
    animation: 'fadeSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
  },
  geminiHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '14px',
    gap: '12px'
  },
  geminiIdentity: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  geminiAvatarPill: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 14px rgba(129, 140, 248, 0.16)'
  },
  geminiMetaGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  geminiNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  geminiSenderName: {
    fontSize: '0.92rem',
    fontWeight: 600,
    color: '#ffffff',
    letterSpacing: '-0.01em'
  },
  geminiSparkleBadge: {
    fontSize: '0.68rem',
    fontWeight: 600,
    color: '#818cf8',
    background: 'rgba(129, 140, 248, 0.1)',
    border: '1px solid rgba(129, 140, 248, 0.22)',
    borderRadius: '12px',
    padding: '1px 8px'
  },
  geminiTimestamp: {
    fontSize: '0.70rem',
    color: 'var(--text-muted)'
  },
  geminiActionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  geminiExportBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 10px',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 'var(--radius-xs)',
    color: 'var(--text-secondary)',
    fontSize: '0.72rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all var(--transition-fast)'
  },
  geminiCopyBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
    padding: '5px',
    borderRadius: 'var(--radius-xs)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  geminiContentBody: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  geminiContentCanvas: {
    fontSize: '0.95rem',
    lineHeight: '1.75',
    color: 'var(--text-primary)',
    wordBreak: 'break-word'
  },
  geminiTurnDivider: {
    marginTop: '26px',
    height: '1px',
    width: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08) 20%, rgba(255, 255, 255, 0.08) 80%, transparent)'
  },
  contentBody: {
    fontSize: '0.95rem',
    lineHeight: '1.75',
    color: 'var(--text-primary)',
    wordBreak: 'break-word'
  },
  lightweightBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '4px',
    color: '#e4e4e7',
    fontSize: '0.64rem',
    fontWeight: 700,
    letterSpacing: '0.04em',
    padding: '2px 6px',
    fontFamily: 'monospace'
  },
  timestamp: {
    fontSize: '0.7rem',
    color: 'var(--text-tertiary)',
    flex: 1
  },
  exportPdfBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 9px',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-xs)',
    color: 'var(--text-secondary)',
    fontSize: '0.72rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all var(--transition-fast)'
  },
  copyBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: 'var(--radius-xs)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  typingControlRow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '6px'
  },
  skipTypingBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: 'var(--radius-pill)',
    background: 'rgba(56, 189, 248, 0.1)',
    border: '1px solid rgba(56, 189, 248, 0.25)',
    color: '#38bdf8',
    fontSize: '0.68rem',
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)'
  },
  paragraph: {
    marginBottom: '8px'
  },
  h2: {
    fontSize: '1.15rem',
    fontWeight: 700,
    marginTop: '16px',
    marginBottom: '8px',
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em'
  },
  h3: {
    fontSize: '1rem',
    fontWeight: 600,
    marginTop: '12px',
    marginBottom: '6px',
    color: 'var(--text-primary)',
    letterSpacing: '-0.015em'
  },
  h4: {
    fontSize: '0.9rem',
    fontWeight: 600,
    marginTop: '10px',
    marginBottom: '4px',
    color: 'var(--text-primary)'
  },
  listItem: {
    marginLeft: '20px',
    marginBottom: '4px'
  },
  toolCallsDeck: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '12px'
  },
  toolCard: {
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-xs)',
    overflow: 'hidden'
  },
  toolHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 10px',
    cursor: 'pointer',
    fontSize: '0.76rem',
    background: 'rgba(255, 255, 255, 0.01)'
  },
  mcpBadge: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.62rem',
    fontWeight: 700,
    padding: '1px 5px',
    borderRadius: 'var(--radius-xs)',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid var(--glass-border-subtle)',
    color: 'var(--text-primary)'
  },
  toolName: {
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-primary)',
    flex: 1
  },
  toolStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '0.7rem',
    color: 'var(--text-secondary)'
  },
  toolStatusDot: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    background: '#10b981'
  },
  toolToggle: {
    color: 'var(--text-tertiary)',
    fontSize: '0.7rem',
    fontWeight: 500
  },
  toolBody: {
    padding: '10px 12px',
    background: '#09090b',
    borderTop: '1px solid var(--glass-border-subtle)'
  },
  toolSubheader: {
    fontSize: '0.68rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-tertiary)',
    marginBottom: '4px'
  },
  jsonPre: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.7rem',
    color: 'var(--text-secondary)',
    background: 'transparent',
    padding: '6px',
    borderRadius: 'var(--radius-xs)',
    border: '1px solid var(--glass-border-subtle)',
    overflowX: 'auto',
    marginBottom: '8px'
  },
  artifactsContainer: {
    marginTop: '14px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
  },
  artifactSectionTitle: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: '8px'
  },
  artifactPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
  },
  artifactTitle: {
    fontSize: '0.84rem',
    fontWeight: 600,
    color: '#ffffff',
    flex: 1
  },
  artifactTag: {
    fontSize: '0.68rem',
    padding: '2px 8px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    borderRadius: 'var(--radius-pill)',
    fontWeight: 600
  },
  artifactAction: {
    fontSize: '0.76rem',
    fontWeight: 600,
    color: '#ffffff'
  },
  tokenMetricsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '12px',
    paddingTop: '10px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    fontSize: '0.72rem',
    fontFamily: 'var(--font-mono)'
  },
  creditMetric: {
    color: '#ffffff',
    fontWeight: 600
  },
  tokenMetric: {
    color: 'var(--text-tertiary)'
  },
  ratioMetric: {
    color: 'var(--text-quaternary)',
    fontSize: '0.68rem'
  },
  hitlCard: {
    margin: '14px 0 6px 0',
    padding: '12px 14px',
    background: 'rgba(245, 158, 11, 0.05)',
    border: '1px solid rgba(245, 158, 11, 0.25)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--glass-shadow-sm)'
  },
  hitlCardApproved: {
    background: 'rgba(34, 197, 94, 0.05)',
    border: '1px solid rgba(34, 197, 94, 0.25)'
  },
  hitlCardRejected: {
    background: 'rgba(239, 68, 68, 0.05)',
    border: '1px solid rgba(239, 68, 68, 0.2)'
  },
  hitlHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  hitlTitleWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  hitlHeaderTitle: {
    fontSize: '0.78rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: 'var(--text-primary)'
  },
  hitlBadge: {
    fontSize: '0.7rem',
    padding: '2px 8px',
    borderRadius: 'var(--radius-pill)',
    fontWeight: 600,
    background: 'rgba(245, 158, 11, 0.15)',
    color: '#f59e0b'
  },
  hitlBadgeApproved: {
    background: 'rgba(34, 197, 94, 0.15)',
    color: '#22c55e'
  },
  hitlBadgeRejected: {
    background: 'rgba(239, 68, 68, 0.15)',
    color: '#ef4444'
  },
  hitlSubject: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#ffffff',
    marginBottom: '4px'
  },
  hitlDescription: {
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
    marginBottom: '10px',
    lineHeight: 1.45
  },
  hitlInteractiveArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '10px'
  },
  hitlPromptLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-primary)'
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '8px'
  },
  optionCard: {
    padding: '10px 12px',
    background: 'var(--glass-bg-card)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)'
  },
  optionCardActive: {
    background: 'rgba(99, 102, 241, 0.08)',
    borderColor: 'rgba(99, 102, 241, 0.45)',
    boxShadow: '0 0 16px rgba(99, 102, 241, 0.12)'
  },
  optionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px'
  },
  radioCircle: {
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    border: '1.5px solid var(--border-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  radioCircleActive: {
    borderColor: '#818cf8'
  },
  radioDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#818cf8'
  },
  optionLabel: {
    fontSize: '0.84rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    flex: 1
  },
  recommendedBadge: {
    fontSize: '0.62rem',
    fontWeight: 700,
    letterSpacing: '0.04em',
    padding: '2px 6px',
    borderRadius: 'var(--radius-pill)',
    background: 'rgba(16, 185, 129, 0.12)',
    color: '#34d399',
    border: '1px solid rgba(16, 185, 129, 0.25)'
  },
  optionBadge: {
    fontSize: '0.62rem',
    fontWeight: 600,
    padding: '2px 6px',
    borderRadius: 'var(--radius-pill)',
    background: 'rgba(129, 140, 248, 0.1)',
    color: '#818cf8',
    border: '1px solid rgba(129, 140, 248, 0.2)'
  },
  customBadge: {
    fontSize: '0.62rem',
    fontWeight: 600,
    padding: '2px 6px',
    borderRadius: 'var(--radius-pill)',
    background: 'rgba(245, 158, 11, 0.1)',
    color: '#f59e0b',
    border: '1px solid rgba(245, 158, 11, 0.2)'
  },
  optionDescription: {
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
    margin: 0,
    paddingLeft: '22px'
  },
  customInputWrapper: {
    marginTop: '8px',
    paddingLeft: '22px'
  },
  customTextarea: {
    width: '100%',
    padding: '8px 10px',
    background: 'var(--glass-bg-input)',
    border: '1px solid var(--border-active)',
    borderRadius: 'var(--radius-xs)',
    color: 'var(--text-primary)',
    fontSize: '0.8rem',
    fontFamily: 'inherit',
    resize: 'vertical',
    outline: 'none',
    boxSizing: 'border-box'
  },
  hitlBtnGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '6px'
  },
  hitlRejectBtn: {
    padding: '7px 14px',
    fontSize: '0.78rem',
    fontWeight: 500,
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-xs)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)'
  },
  hitlApproveBtn: {
    padding: '7px 16px',
    fontSize: '0.8rem',
    fontWeight: 700,
    background: 'var(--accent-primary)',
    border: '1px solid var(--accent-primary)',
    borderRadius: 'var(--radius-xs)',
    color: 'var(--bg-primary)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)'
  },
  hitlResolvedText: {
    fontSize: '0.82rem',
    color: '#34d399',
    fontWeight: 500,
    marginTop: '6px',
    lineHeight: 1.45
  },
  hitlRejectedText: {
    fontSize: '0.82rem',
    color: '#f87171',
    fontWeight: 500,
    marginTop: '6px',
    lineHeight: 1.45
  },
  suggestionsContainer: {
    marginTop: '12px',
    padding: '10px 14px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.07)',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  suggestionsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.74rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--text-muted)'
  },
  suggestionsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  suggestionChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    color: 'var(--text-primary)',
    fontSize: '0.78rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.18s ease',
    textAlign: 'left'
  },
  suggestionText: {
    lineHeight: 1.2
  },
  suggestionArrow: {
    color: '#818cf8',
    flexShrink: 0,
    transition: 'transform 0.15s ease'
  }
};
