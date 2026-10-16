import React from 'react';
import { useApp } from '../../context/AppContext';

export const AgentSelectorBar: React.FC = () => {
  const { selectedAgentId, setSelectedAgentId } = useApp();

  const agents = [
    { id: 'auto', label: 'Auto Route', icon: '✨' },
    { id: 'market-research-analyst', label: 'Market Analyst', icon: '🔍' },
    { id: 'competitor-analyst', label: 'Competitor Teardown', icon: '⚔️' },
    { id: 'chief-marketing-strategist', label: 'Positioning & Brand', icon: '🎯' },
    { id: 'gtm-funnel-strategist', label: 'GTM Funnel', icon: '📈' },
    { id: 'foundryos-assistant', label: 'FoundryOS Assistant', icon: '⚡' },
    { id: 'multi-agent', label: 'Multi-Agent Team', icon: '👥' }
  ];

  return (
    <div style={styles.container}>
      <div style={styles.segmentedBar}>
        {agents.map(agent => {
          const isSelected = selectedAgentId === agent.id;
          return (
            <button
              key={agent.id}
              onClick={() => setSelectedAgentId(agent.id)}
              className="dashboard-card-interactive"
              style={{
                ...styles.agentBtn,
                ...(isSelected ? styles.agentBtnSelected : {})
              }}
            >
              <span>{agent.icon}</span>
              <span>{agent.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    padding: '12px 0',
    width: '100%',
    zIndex: 5
  },
  segmentedBar: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '5px',
    background: 'rgba(16, 16, 20, 0.85)',
    backdropFilter: 'var(--glass-blur)',
    WebkitBackdropFilter: 'var(--glass-blur)',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    borderRadius: 'var(--radius-pill)',
    boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.15), 0 8px 24px rgba(0, 0, 0, 0.5)',
    maxWidth: '100%',
    overflowX: 'auto'
  },
  agentBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 15px',
    background: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-pill)',
    fontSize: '0.8rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    whiteSpace: 'nowrap'
  },
  agentBtnSelected: {
    background: '#ffffff',
    color: '#000000',
    fontWeight: 600,
    boxShadow: '0 2px 12px rgba(255, 255, 255, 0.25)'
  }
};
