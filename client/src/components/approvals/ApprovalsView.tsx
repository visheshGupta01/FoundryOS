import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Icons } from '../common/Icons';
import type { HitlApprovalDetail } from '../../types';

export const ApprovalsView: React.FC = () => {
  const { approvals, resolveHitlApproval, pendingApprovalsCount } = useApp();
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const filteredApprovals = approvals.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const handleDecision = async (id: string, decision: 'approve' | 'reject') => {
    setResolvingId(id);
    const item = approvals.find(a => a.id === id);
    const selectedOptId = selectedOptions[id] || (item?.options && item.options.length > 0 ? (item.options.find(o => o.recommended)?.id || item.options[0].id) : 'custom');
    const isCustom = selectedOptId === 'custom';
    const customText = customAnswers[id]?.trim() || undefined;
    const chosenOpt = item?.options?.find(o => o.id === selectedOptId);
    const chosenLabel = isCustom ? (customText || 'Custom Direction') : chosenOpt?.label;
    const comment = isCustom ? customText : undefined;

    await resolveHitlApproval(
      id,
      decision,
      comment,
      selectedOptId,
      customText,
      chosenLabel,
      false
    );
    setResolvingId(null);
  };

  const getActionBadge = (actionType: string) => {
    switch (actionType) {
      case 'commit_brand_positioning':
        return { label: 'Brand Positioning', color: '#818cf8', bg: 'rgba(99, 102, 241, 0.12)' };
      case 'broadcast_slack':
        return { label: 'Slack Broadcast', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)' };
      case 'sync_google_drive':
        return { label: 'Google Drive Sync', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)' };
      case 'validate_proposed_learning':
        return { label: 'Institutional Memory', color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)' };
      case 'publish_campaign_offer':
        return { label: 'GTM Offer Launch', color: '#f472b6', bg: 'rgba(244, 114, 182, 0.12)' };
      default:
        return { label: actionType.replace(/_/g, ' '), color: '#cbd5e1', bg: 'rgba(255, 255, 255, 0.08)' };
    }
  };

  return (
    <div style={styles.container}>
      {/* Top Banner */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.titleRow}>
            <div style={styles.shieldIconPill}>
              <Icons.Shield size={18} style={{ color: '#818cf8' }} />
            </div>
            <div>
              <h1 style={styles.title}>Action Approvals & Steering</h1>
              <p style={styles.subtitle}>
                Review proposals, select strategic directions, or provide custom instructions before actions are executed.
              </p>
            </div>
          </div>
        </div>

        {/* Status Counters */}
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{pendingApprovalsCount}</span>
            <span style={{ ...styles.statLabel, color: pendingApprovalsCount > 0 ? '#fbbf24' : 'var(--text-tertiary)' }}>
              Pending Review
            </span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{approvals.filter(a => a.status === 'approved').length}</span>
            <span style={{ ...styles.statLabel, color: '#34d399' }}>Approved</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{approvals.length}</span>
            <span style={styles.statLabel}>Total Logs</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={styles.filterBar}>
        <div style={styles.tabGroup}>
          <button
            onClick={() => setFilter('pending')}
            style={{
              ...styles.tabBtn,
              ...(filter === 'pending' ? styles.tabBtnActive : {})
            }}
          >
            <span>Pending Review</span>
            {pendingApprovalsCount > 0 && (
              <span className="amber-pulse" style={styles.amberBadge}>{pendingApprovalsCount}</span>
            )}
          </button>
          <button
            onClick={() => setFilter('approved')}
            style={{
              ...styles.tabBtn,
              ...(filter === 'approved' ? styles.tabBtnActive : {})
            }}
          >
            <span>Approved History</span>
          </button>
          <button
            onClick={() => setFilter('rejected')}
            style={{
              ...styles.tabBtn,
              ...(filter === 'rejected' ? styles.tabBtnActive : {})
            }}
          >
            <span>Rejected</span>
          </button>
          <button
            onClick={() => setFilter('all')}
            style={{
              ...styles.tabBtn,
              ...(filter === 'all' ? styles.tabBtnActive : {})
            }}
          >
            <span>All Requests</span>
          </button>
        </div>
      </div>

      {/* Main Content List */}
      <div style={styles.contentList}>
        {filteredApprovals.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIconPill}>
              <Icons.Sparkles size={24} style={{ color: '#818cf8' }} />
            </div>
            <h3 style={styles.emptyTitle}>
              {filter === 'pending'
                ? 'All Clear, Founder!'
                : `No ${filter} approvals found`}
            </h3>
            <p style={styles.emptySubtext}>
              {filter === 'pending'
                ? 'Every high-stakes AI action has been reviewed. When an autonomous employee proposes a brand update, external message, or offer publish, it will appear here.'
                : 'No approval actions match the selected filter category.'}
            </p>
          </div>
        ) : (
          filteredApprovals.map((item: HitlApprovalDetail) => {
            const badge = getActionBadge(item.actionType);
            const isPending = item.status === 'pending';
            const isResolving = resolvingId === item.id;

            return (
              <div
                key={item.id}
                style={{
                  ...styles.card,
                  borderColor: isPending ? 'rgba(99, 102, 241, 0.35)' : 'var(--glass-border-subtle)',
                  boxShadow: isPending ? '0 8px 32px rgba(99, 102, 241, 0.12)' : 'none'
                }}
              >
                {/* Card Top Row */}
                <div style={styles.cardHeader}>
                  <div style={styles.cardHeaderLeft}>
                    <div
                      style={{
                        ...styles.actionPill,
                        color: badge.color,
                        background: badge.bg,
                        borderColor: `${badge.color}33`
                      }}
                    >
                      {badge.label}
                    </div>
                    <span style={styles.agentTag}>Proposed by {item.employeeName}</span>
                  </div>

                  <div style={styles.cardHeaderRight}>
                    <span
                      style={{
                        ...styles.statusPill,
                        ...(item.status === 'pending' ? styles.statusPending : {}),
                        ...(item.status === 'approved' ? styles.statusApproved : {}),
                        ...(item.status === 'rejected' ? styles.statusRejected : {})
                      }}
                    >
                      {item.status.toUpperCase()}
                    </span>
                    <span style={styles.timeTag}>
                      {new Date(item.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <h3 style={styles.cardTitle}>{item.title}</h3>
                <p style={styles.cardDesc}>{item.description}</p>

                {/* Payload Inspector */}
                <div style={styles.payloadBox}>
                  <div style={styles.payloadHeader}>
                    <Icons.FileText size={12} style={{ color: 'var(--text-tertiary)' }} />
                    <span>Proposed Payload & Execution Parameters</span>
                  </div>
                  <pre style={styles.payloadPre}>
                    {JSON.stringify(item.payload, null, 2)}
                  </pre>
                </div>

                {/* Decision Result (if already decided) */}
                {item.resolvedAt && (
                  <div style={styles.resolvedBox}>
                    <div style={styles.resolvedHeader}>
                      <span style={{ color: item.status === 'approved' ? '#34d399' : '#f87171' }}>
                        Decided by {item.resolvedBy || 'founder'} at{' '}
                        {new Date(item.resolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {item.decisionComment && (
                      <p style={styles.resolvedComment}>
                        <strong>Founder Note:</strong> "{item.decisionComment}"
                      </p>
                    )}
                    {item.executionResult && (
                      <pre style={styles.executionPre}>
                        {JSON.stringify(item.executionResult, null, 2)}
                      </pre>
                    )}
                  </div>
                )}

                {/* Actions (if pending) */}
                {isPending && (
                  <div style={styles.cardActions}>
                    <div style={styles.optionsPromptLabel}>
                      <Icons.Target size={13} style={{ color: '#818cf8' }} />
                      <span>Select a strategic direction or specify your custom thesis:</span>
                    </div>

                    <div style={styles.approvalsOptionsGrid}>
                      {(item.options || [
                        { id: 'opt-plg', label: 'PLG & Self-Serve Growth', description: 'Focus on frictionless self-serve onboarding, interactive demo, and organic developer virality.', recommended: true },
                        { id: 'opt-abm', label: 'Enterprise ABM & Strategic Governance', description: 'Target high-contract enterprise accounts with custom ROI benchmarks and strategic governance.', badge: 'Enterprise' },
                        { id: 'opt-disruptive', label: 'Category Disruption & Agency Alternative', description: 'High-contrast challenger narrative contrasting manual agencies with autonomous execution.', badge: 'Disruptive' }
                      ]).map((opt) => {
                        const curSelected = selectedOptions[item.id] || (item.options?.find(o => o.recommended)?.id || item.options?.[0]?.id || 'opt-plg');
                        const isSelected = curSelected === opt.id;
                        return (
                          <div
                            key={opt.id}
                            onClick={() => setSelectedOptions(prev => ({ ...prev, [item.id]: opt.id }))}
                            style={{
                              ...styles.approvalsOptionCard,
                              ...(isSelected ? styles.approvalsOptionCardActive : {})
                            }}
                          >
                            <div style={styles.approvalsOptionHeader}>
                              <div style={{
                                ...styles.radioCircle,
                                ...(isSelected ? styles.radioCircleActive : {})
                              }}>
                                {isSelected && <div style={styles.radioDot} />}
                              </div>
                              <span style={styles.approvalsOptionLabel}>{opt.label}</span>
                              {opt.recommended && <span style={styles.recommendedBadge}>RECOMMENDED</span>}
                              {opt.badge && !opt.recommended && <span style={styles.optionBadge}>{opt.badge}</span>}
                            </div>
                            <p style={styles.approvalsOptionDesc}>{opt.description}</p>
                          </div>
                        );
                      })}

                      {/* 4th Option: Tell Your Own Answer */}
                      {(() => {
                        const isCustom = (selectedOptions[item.id] === 'custom');
                        return (
                          <div
                            onClick={() => setSelectedOptions(prev => ({ ...prev, [item.id]: 'custom' }))}
                            style={{
                              ...styles.approvalsOptionCard,
                              ...(isCustom ? styles.approvalsOptionCardActive : {})
                            }}
                          >
                            <div style={styles.approvalsOptionHeader}>
                              <div style={{
                                ...styles.radioCircle,
                                ...(isCustom ? styles.radioCircleActive : {})
                              }}>
                                {isCustom && <div style={styles.radioDot} />}
                              </div>
                              <span style={styles.approvalsOptionLabel}>✍️ Tell your own answer</span>
                              <span style={styles.customBadge}>CUSTOM INPUT</span>
                            </div>
                            <p style={styles.approvalsOptionDesc}>
                              Specify custom direction or distinct requirements for this proposal.
                            </p>

                            {isCustom && (
                              <div style={styles.customInputArea} onClick={e => e.stopPropagation()}>
                                <textarea
                                  rows={2}
                                  placeholder=""
                                  value={customAnswers[item.id] || ''}
                                  onChange={e => setCustomAnswers(prev => ({ ...prev, [item.id]: e.target.value }))}
                                  style={styles.customTextarea}
                                  autoFocus
                                />
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    <div style={styles.btnRow}>
                      <button
                        onClick={() => handleDecision(item.id, 'reject')}
                        disabled={isResolving}
                        style={styles.rejectBtn}
                        title="Decline this plan and prompt the AI employee to try new things"
                      >
                        <Icons.Close size={13} />
                        <span>Reject & Try New Things</span>
                      </button>

                      <button
                        onClick={() => handleDecision(item.id, 'approve')}
                        disabled={isResolving || (selectedOptions[item.id] === 'custom' && !customAnswers[item.id]?.trim())}
                        style={{
                          ...styles.approveBtn,
                          opacity: (selectedOptions[item.id] === 'custom' && !customAnswers[item.id]?.trim()) ? 0.6 : 1
                        }}
                      >
                        <Icons.Check size={14} />
                        <span>{isResolving ? 'Committing...' : 'Confirm & Commit Plan'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    overflowY: 'auto',
    padding: '28px 36px 60px 36px',
    maxWidth: '1100px',
    margin: '0 auto',
    boxSizing: 'border-box'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '24px',
    marginBottom: '28px',
    flexWrap: 'wrap'
  },
  headerLeft: {
    flex: 1,
    minWidth: '320px'
  },
  titleRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px'
  },
  shieldIconPill: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    background: 'rgba(99, 102, 241, 0.12)',
    border: '1px solid rgba(99, 102, 241, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.45rem',
    fontWeight: 700,
    color: '#ffffff',
    margin: '0 0 6px 0',
    letterSpacing: '-0.02em'
  },
  subtitle: {
    fontSize: '0.84rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.55',
    margin: 0,
    maxWidth: '620px'
  },
  statsRow: {
    display: 'flex',
    gap: '12px'
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 18px',
    background: 'var(--glass-bg-card)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-md)',
    minWidth: '85px'
  },
  statNumber: {
    fontSize: '1.35rem',
    fontWeight: 800,
    fontFamily: 'var(--font-display)',
    color: '#ffffff',
    lineHeight: '1.2'
  },
  statLabel: {
    fontSize: '0.68rem',
    fontWeight: 600,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginTop: '3px'
  },
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '16px',
    borderBottom: '1px solid var(--glass-border-subtle)',
    marginBottom: '20px'
  },
  tabGroup: {
    display: 'flex',
    gap: '8px'
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: 'var(--radius-pill)',
    border: '1px solid transparent',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: '0.82rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all var(--transition-fast)'
  },
  tabBtnActive: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
    color: '#ffffff',
    fontWeight: 600
  },
  amberBadge: {
    padding: '1px 7px',
    borderRadius: '10px',
    background: 'rgba(245, 158, 11, 0.2)',
    color: '#fbbf24',
    border: '1px solid rgba(245, 158, 11, 0.4)',
    fontSize: '0.68rem',
    fontWeight: 700
  },
  contentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  card: {
    background: 'var(--glass-bg-card)',
    backdropFilter: 'var(--glass-blur)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-lg)',
    padding: '22px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    transition: 'all var(--transition-fast)'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  cardHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  actionPill: {
    fontSize: '0.72rem',
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: '6px',
    border: '1px solid transparent',
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
  },
  agentTag: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    fontWeight: 500
  },
  statusPill: {
    fontSize: '0.68rem',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '4px',
    letterSpacing: '0.05em'
  },
  statusPending: {
    background: 'rgba(245, 158, 11, 0.15)',
    color: '#fbbf24',
    border: '1px solid rgba(245, 158, 11, 0.3)'
  },
  statusApproved: {
    background: 'rgba(16, 185, 129, 0.15)',
    color: '#34d399',
    border: '1px solid rgba(16, 185, 129, 0.3)'
  },
  statusRejected: {
    background: 'rgba(239, 68, 68, 0.15)',
    color: '#f87171',
    border: '1px solid rgba(239, 68, 68, 0.3)'
  },
  timeTag: {
    fontSize: '0.74rem',
    color: 'var(--text-tertiary)'
  },
  cardTitle: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: '#ffffff',
    margin: 0
  },
  cardDesc: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.55',
    margin: 0
  },
  payloadBox: {
    background: 'rgba(0, 0, 0, 0.28)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '8px',
    padding: '12px 14px',
    marginTop: '4px'
  },
  payloadHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.7rem',
    fontWeight: 600,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '8px'
  },
  payloadPre: {
    margin: 0,
    fontFamily: 'monospace',
    fontSize: '0.76rem',
    color: '#cbd5e1',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    maxHeight: '160px',
    overflowY: 'auto'
  },
  resolvedBox: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.07)',
    borderRadius: '8px',
    padding: '12px 14px',
    marginTop: '4px'
  },
  resolvedHeader: {
    fontSize: '0.76rem',
    fontWeight: 600,
    marginBottom: '4px'
  },
  resolvedComment: {
    fontSize: '0.82rem',
    color: '#ffffff',
    margin: '4px 0 8px 0',
    fontStyle: 'italic'
  },
  executionPre: {
    margin: 0,
    fontFamily: 'monospace',
    fontSize: '0.72rem',
    color: '#94a3b8',
    whiteSpace: 'pre-wrap'
  },
  cardActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '8px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)'
  },
  optionsPromptLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--text-primary)'
  },
  approvalsOptionsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '8px'
  },
  approvalsOptionCard: {
    padding: '10px 14px',
    background: 'var(--glass-bg-card)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)'
  },
  approvalsOptionCardActive: {
    background: 'rgba(99, 102, 241, 0.08)',
    borderColor: 'rgba(99, 102, 241, 0.45)',
    boxShadow: '0 0 16px rgba(99, 102, 241, 0.12)'
  },
  approvalsOptionHeader: {
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
  approvalsOptionLabel: {
    fontSize: '0.86rem',
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
  approvalsOptionDesc: {
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
    margin: 0,
    paddingLeft: '22px'
  },
  customInputArea: {
    marginTop: '8px',
    paddingLeft: '22px'
  },
  customTextarea: {
    width: '100%',
    padding: '8px 12px',
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
  btnRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px'
  },
  rejectBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 18px',
    borderRadius: '8px',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    background: 'rgba(239, 68, 68, 0.08)',
    color: '#f87171',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all var(--transition-fast)'
  },
  approveBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 18px',
    borderRadius: 'var(--radius-xs)',
    border: '1px solid #ffffff',
    background: '#ffffff',
    color: '#09090b',
    fontSize: '0.8rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all var(--transition-fast)'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 24px',
    textAlign: 'center',
    background: 'var(--glass-bg-card)',
    borderRadius: 'var(--radius-lg)',
    border: '1px dashed var(--glass-border-subtle)'
  },
  emptyIconPill: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    background: 'rgba(99, 102, 241, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px'
  },
  emptyTitle: {
    fontSize: '1.15rem',
    fontWeight: 700,
    color: '#ffffff',
    margin: '0 0 8px 0'
  },
  emptySubtext: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    maxWidth: '460px',
    lineHeight: '1.6',
    margin: 0
  }
};
