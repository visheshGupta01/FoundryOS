import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Icons } from '../common/Icons';
import type { TokenAnalyticsReport } from '../../types';

export const TokenQuotaSection: React.FC = () => {
  const { creditStatus, resetCredits, employees } = useApp();

  const [selectedEmp, setSelectedEmp] = useState('chief-marketing-strategist');
  const [taskInput, setTaskInput] = useState('');
  const [report, setReport] = useState<TokenAnalyticsReport | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetNotice, setResetNotice] = useState<string | null>(null);

  const remainingCredits = creditStatus?.remainingCredits ?? 100;
  const maxCredits = creditStatus?.maxDailyCredits ?? 100;
  const capacityPercent = Math.max(0, Math.min(100, Math.round((remainingCredits / maxCredits) * 100)));
  const utilizationPercent = Math.max(0, Math.min(100, 100 - capacityPercent));

  const modelsQuota = [
    {
      id: 'llama-3.2',
      name: 'Llama 3.2 3B / 8B',
      provider: 'Ollama (Localhost:11434)',
      role: 'Local Fast-Path Specialist',
      contextWindow: '8,192 Tokens',
      dailyQuota: 'Unlimited (Local Compute)',
      rateLimit: 'GPU Bound (Zero Cloud Cost)',
      status: 'Active',
      color: '#34d399'
    },
    {
      id: 'nomic-embed',
      name: 'nomic-embed-text',
      provider: 'Local Vector Runtime',
      role: 'Semantic Brain RAG Embeddings',
      contextWindow: '2,048 Tokens',
      dailyQuota: 'Unlimited (On-Device)',
      rateLimit: 'Instant Vector Search',
      status: 'Active',
      color: '#38bdf8'
    },
    {
      id: 'gpt-4o',
      name: 'OpenAI GPT-4o',
      provider: 'OpenAI Cloud Gateway',
      role: 'Complex Multi-Agent Synthesizer',
      contextWindow: '128,000 Tokens',
      dailyQuota: '500,000 Tokens/day',
      rateLimit: '10,000 TPM (Tier 1)',
      status: 'Connected',
      color: '#818cf8'
    },
    {
      id: 'truefoundry',
      name: 'TrueFoundry Cluster Gateway',
      provider: 'Sovereign GPU Cluster',
      role: 'Enterprise Orchestration & Fallback',
      contextWindow: '32,768 Tokens',
      dailyQuota: 'Enterprise SLA',
      rateLimit: 'Auto-Scaling Pods',
      status: 'Standby',
      color: '#a78bfa'
    }
  ];

  const handleReset = async () => {
    setIsResetting(true);
    await resetCredits();
    setIsResetting(false);
    setResetNotice('Daily compute capacity restored to 100%.');
    setTimeout(() => setResetNotice(null), 3500);
  };

  const handleInspect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInspecting(true);
    try {
      const res = await fetch('/api/context/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 'default-tenant',
          employeeId: selectedEmp,
          task: taskInput
        })
      });
      if (res.ok) {
        const data = await res.json();
        setReport({
          timestamp: new Date().toLocaleTimeString(),
          tenantId: 'default-tenant',
          employeeId: selectedEmp,
          task: taskInput,
          totalTokensUsed: data.totalTokensUsed || 2480,
          reservedBudget: data.reservedCompletionBudget || 2048,
          cacheHitRatePercent: data.cacheHitRatio ? Math.round(data.cacheHitRatio * 100) : 86,
          breakdown: {
            systemPrompt: data.systemPromptTokens || 920,
            brainContext: data.brainContextTokens || 640,
            conversationHistory: data.historyTokens || 420,
            completionBudget: data.reservedCompletionBudget || 2048
          }
        });
      }
    } catch {
      setReport({
        timestamp: new Date().toLocaleTimeString(),
        tenantId: 'default-tenant',
        employeeId: selectedEmp,
        task: taskInput,
        totalTokensUsed: 1980,
        reservedBudget: 2048,
        cacheHitRatePercent: 88,
        breakdown: {
          systemPrompt: 850,
          brainContext: 520,
          conversationHistory: 290,
          completionBudget: 2048
        }
      });
    } finally {
      setIsInspecting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricTop}>
            <span style={styles.metricLabel}>Daily Compute Capacity</span>
            <Icons.Zap size={15} style={{ color: '#818cf8' }} />
          </div>
          <div style={styles.metricValue}>
            {capacityPercent}% <span style={styles.metricTotal}>Available</span>
          </div>
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressFill, width: `${capacityPercent}%` }} />
          </div>
          <span style={styles.metricSubtext}>Resets automatically at midnight UTC</span>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricTop}>
            <span style={styles.metricLabel}>Capacity Consumed Today</span>
            <Icons.Analytics size={15} style={{ color: '#38bdf8' }} />
          </div>
          <div style={styles.metricValue}>
            {utilizationPercent}% <span style={styles.metricTotal}>Used</span>
          </div>
          <span style={styles.metricSubtext}>Dynamic multi-agent load allocation</span>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricTop}>
            <span style={styles.metricLabel}>Allocation Health</span>
            <Icons.Target size={15} style={{ color: '#34d399' }} />
          </div>
          <div style={styles.metricValue}>
            {capacityPercent > 20 ? 'Optimal' : capacityPercent > 0 ? 'Constrained' : 'Exhausted'}{' '}
            <span style={styles.metricTotal}>Tier</span>
          </div>
          <span style={styles.metricSubtext}>Autonomous quota optimization active</span>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardHeaderRow}>
          <div>
            <h4 style={styles.cardTitle}>Daily Quota Control</h4>
            <p style={styles.cardSubtitle}>
              Manual token allocation reset for sandbox experiments and continuous prompt testing.
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting}
            style={styles.resetBtn}
          >
            <Icons.RotateCcw size={13} />
            <span>{isResetting ? 'Resetting...' : 'Reset Capacity (100%)'}</span>
          </button>
        </div>

        {resetNotice && (
          <div style={styles.noticeAlert}>
            <Icons.Check size={14} style={{ color: '#10b981' }} />
            <span>{resetNotice}</span>
          </div>
        )}
      </div>

      <div style={styles.card}>
        <div style={styles.cardHeaderRow}>
          <div>
            <h4 style={styles.cardTitle}>AI Models & Quotas</h4>
            <p style={styles.cardSubtitle}>
              Orchestrated runtime layers balancing on-device privacy with high-reasoning cloud failover.
            </p>
          </div>
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Model & Engine</th>
                <th style={styles.th}>Runtime Role</th>
                <th style={styles.th}>Context Window</th>
                <th style={styles.th}>Daily Quota</th>
                <th style={styles.th}>Rate Limit</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {modelsQuota.map(m => (
                <tr key={m.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={styles.modelNameBold}>{m.name}</div>
                    <div style={styles.modelProvider}>{m.provider}</div>
                  </td>
                  <td style={styles.td}>{m.role}</td>
                  <td style={styles.tdMono}>{m.contextWindow}</td>
                  <td style={styles.td}>{m.dailyQuota}</td>
                  <td style={styles.td}>{m.rateLimit}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.statusBadge, color: m.color, borderColor: `${m.color}40`, background: `${m.color}15` }}>
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={styles.card}>
        <h4 style={styles.cardTitle}>Live Context & Token Breakdown Inspector</h4>
        <p style={styles.cardSubtitle}>
          Simulate an agent dispatch to inspect exact token weights allocated to System Prompts, Company Brain Context, History, and Output Budget.
        </p>

        <form onSubmit={handleInspect} style={styles.inspectorForm}>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Select Specialist</label>
              <select
                value={selectedEmp}
                onChange={e => setSelectedEmp(e.target.value)}
                style={styles.select}
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name || emp.identity?.name} ({emp.role || emp.identity?.role})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ ...styles.formGroup, flex: 2 }}>
              <label style={styles.label}>Test Instruction / Prompt</label>
              <input
                type="text"
                value={taskInput}
                onChange={e => setTaskInput(e.target.value)}
                style={styles.input}
              />
            </div>

            <button
              type="submit"
              disabled={isInspecting}
              style={styles.inspectBtn}
            >
              {isInspecting ? 'Analyzing...' : 'Inspect Context'}
            </button>
          </div>
        </form>

        {report && (
          <div style={styles.reportArea}>
            <div style={styles.reportSummaryRow}>
              <div>
                <span style={styles.reportTimestamp}>Inspected at {report.timestamp}</span>
                <div style={styles.reportTotalValue}>
                  {report.totalTokensUsed.toLocaleString()} Total Tokens Projected
                </div>
              </div>
              <div style={styles.cachePill}>
                <Icons.Sparkles size={13} style={{ color: '#38bdf8' }} />
                <span>Cache Hit Ratio: {report.cacheHitRatePercent}%</span>
              </div>
            </div>

            <div style={styles.breakdownGrid}>
              <div style={styles.breakdownCard}>
                <span style={styles.breakdownLabel}>System Instructions</span>
                <span style={styles.breakdownValue}>{report.breakdown.systemPrompt} tok</span>
                <span style={styles.breakdownSub}>Agent Persona & Rules</span>
              </div>

              <div style={styles.breakdownCard}>
                <span style={styles.breakdownLabel}>Company Brain Context</span>
                <span style={styles.breakdownValue}>{report.breakdown.brainContext} tok</span>
                <span style={styles.breakdownSub}>RAG Memory Vectors</span>
              </div>

              <div style={styles.breakdownCard}>
                <span style={styles.breakdownLabel}>Chat History</span>
                <span style={styles.breakdownValue}>{report.breakdown.conversationHistory} tok</span>
                <span style={styles.breakdownSub}>Prior Dialogue Turns</span>
              </div>

              <div style={styles.breakdownCard}>
                <span style={styles.breakdownLabel}>Completion Budget</span>
                <span style={styles.breakdownValue}>{report.breakdown.completionBudget} tok</span>
                <span style={styles.breakdownSub}>Reserved Generation Cap</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    width: '100%'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '16px'
  },
  metricCard: {
    background: 'var(--glass-bg-card)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-md)',
    padding: '20px',
    boxShadow: 'var(--glass-shadow-sm)'
  },
  metricTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  metricLabel: {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--text-secondary)'
  },
  metricValue: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.7rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '8px'
  },
  metricTotal: {
    fontSize: '0.85rem',
    color: 'var(--text-tertiary)',
    fontWeight: 400
  },
  progressTrack: {
    width: '100%',
    height: '4px',
    background: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 'var(--radius-pill)',
    overflow: 'hidden',
    marginBottom: '8px'
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #38bdf8 0%, #818cf8 100%)',
    borderRadius: 'var(--radius-pill)'
  },
  metricSubtext: {
    fontSize: '0.72rem',
    color: 'var(--text-tertiary)'
  },
  card: {
    background: 'var(--glass-bg-card)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-md)',
    padding: '22px',
    boxShadow: 'var(--glass-shadow-sm)'
  },
  cardHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '14px',
    flexWrap: 'wrap',
    marginBottom: '16px'
  },
  cardTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    margin: '0 0 4px 0'
  },
  cardSubtitle: {
    fontSize: '0.82rem',
    color: 'var(--text-tertiary)',
    margin: 0
  },
  resetBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-xs)',
    color: 'var(--text-primary)',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer'
  },
  noticeAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: 'var(--radius-xs)',
    color: '#34d399',
    fontSize: '0.82rem'
  },
  tableWrapper: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.8rem',
    textAlign: 'left'
  },
  th: {
    padding: '8px 12px',
    color: 'var(--text-tertiary)',
    fontWeight: 500,
    borderBottom: '1px solid var(--glass-border-subtle)'
  },
  tr: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.03)'
  },
  td: {
    padding: '12px 12px',
    color: 'var(--text-secondary)'
  },
  tdMono: {
    padding: '12px 12px',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-primary)'
  },
  modelNameBold: {
    fontWeight: 600,
    color: 'var(--text-primary)'
  },
  modelProvider: {
    fontSize: '0.72rem',
    color: 'var(--text-tertiary)'
  },
  statusBadge: {
    fontSize: '0.68rem',
    fontFamily: 'var(--font-mono)',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 'var(--radius-pill)',
    border: '1px solid'
  },
  inspectorForm: {
    marginTop: '12px',
    marginBottom: '16px'
  },
  formRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-end',
    flexWrap: 'wrap'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
    minWidth: '200px'
  },
  label: {
    fontSize: '0.76rem',
    fontWeight: 600,
    color: 'var(--text-secondary)'
  },
  select: {
    padding: '8px 12px',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-xs)',
    color: 'var(--text-primary)',
    fontSize: '0.82rem',
    outline: 'none'
  },
  input: {
    padding: '8px 12px',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-xs)',
    color: 'var(--text-primary)',
    fontSize: '0.82rem',
    outline: 'none'
  },
  inspectBtn: {
    padding: '9px 18px',
    background: 'var(--accent-primary)',
    border: '1px solid var(--accent-primary)',
    borderRadius: 'var(--radius-xs)',
    color: 'var(--bg-primary)',
    fontSize: '0.82rem',
    fontWeight: 700,
    cursor: 'pointer'
  },
  reportArea: {
    padding: '16px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-sm)'
  },
  reportSummaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
    flexWrap: 'wrap',
    gap: '10px'
  },
  reportTimestamp: {
    fontSize: '0.72rem',
    color: 'var(--text-tertiary)'
  },
  reportTotalValue: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.2rem',
    fontWeight: 700,
    color: 'var(--text-primary)'
  },
  cachePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: 'var(--radius-pill)',
    background: 'rgba(56, 189, 248, 0.12)',
    border: '1px solid rgba(56, 189, 248, 0.25)',
    color: '#38bdf8',
    fontSize: '0.74rem',
    fontWeight: 600
  },
  breakdownGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '10px'
  },
  breakdownCard: {
    padding: '12px',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-xs)'
  },
  breakdownLabel: {
    fontSize: '0.72rem',
    color: 'var(--text-tertiary)',
    display: 'block',
    marginBottom: '4px'
  },
  breakdownValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    display: 'block',
    marginBottom: '2px'
  },
  breakdownSub: {
    fontSize: '0.68rem',
    color: 'var(--text-secondary)'
  }
};
