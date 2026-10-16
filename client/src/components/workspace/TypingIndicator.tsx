import React, { useState, useEffect } from 'react';
import { Icons } from '../common/Icons';
import type { Employee } from '../../types';

interface TypingIndicatorProps {
  employeeName: string;
  selectedAgentId: string;
  activeEmployee?: Employee;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  employeeName,
  selectedAgentId,
  activeEmployee
}) => {
  const [phaseIndex, setPhaseIndex] = useState(0);

  const statusPhases = selectedAgentId === 'foundryos-assistant'
    ? [
        'Resolving company brain memory cache...',
        'Synthesizing direct executive guidance...',
        'Formulating fast-path response...'
      ]
    : [
        'Querying active Company Brain memory vectors...',
        `Dispatching strategic pipeline to ${employeeName}...`,
        'Benchmarking ICP market intelligence and positioning...',
        'Formulating verified strategic deliverable...'
      ];

  useEffect(() => {
    const timer = setInterval(() => {
      setPhaseIndex(prev => (prev + 1) % statusPhases.length);
    }, 1800);
    return () => clearInterval(timer);
  }, [statusPhases.length]);

  const renderAvatarIcon = () => {
    const id = selectedAgentId.toLowerCase();
    if (id.includes('market') || id.includes('maya')) {
      return <Icons.Search size={16} style={{ color: '#38bdf8' }} />;
    }
    if (id.includes('competitor') || id.includes('julian')) {
      return <Icons.Shield size={16} style={{ color: '#f87171' }} />;
    }
    if (id.includes('strategist') || id.includes('sarah')) {
      return <Icons.Target size={16} style={{ color: '#a78bfa' }} />;
    }
    if (id.includes('funnel') || id.includes('marcus')) {
      return <Icons.TrendingUp size={16} style={{ color: '#34d399' }} />;
    }
    if (id === 'foundryos-assistant') {
      return <Icons.Zap size={16} style={{ color: '#eab308' }} />;
    }
    return <Icons.Bot size={16} style={{ color: 'var(--text-primary)' }} />;
  };

  const roleTitle = activeEmployee?.role || (activeEmployee?.identity?.role) || (selectedAgentId === 'auto' ? 'Autonomous Specialist Team' : 'AI Specialist');

  return (
    <div style={styles.container} className="message-bubble-animate">
      <div style={styles.avatarWrap}>
        <div style={styles.avatarGlow} />
        <div style={styles.avatar}>
          {renderAvatarIcon()}
        </div>
      </div>

      <div style={styles.contentCard}>
        <div style={styles.headerRow}>
          <span style={styles.agentName}>{employeeName}</span>
          <span style={styles.roleBadge}>{roleTitle}</span>
          <span style={styles.activeTag}>GENERATING RESPONSE</span>
        </div>

        <div style={styles.bodyRow}>
          <div style={styles.waveDots}>
            <span style={{ ...styles.dot, animation: 'typingWave 1.3s infinite ease-in-out', animationDelay: '0ms' }} />
            <span style={{ ...styles.dot, animation: 'typingWave 1.3s infinite ease-in-out', animationDelay: '200ms' }} />
            <span style={{ ...styles.dot, animation: 'typingWave 1.3s infinite ease-in-out', animationDelay: '400ms' }} />
          </div>
          <span style={styles.statusText}>{statusPhases[phaseIndex]}</span>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    gap: '12px',
    maxWidth: '860px',
    width: '100%',
    margin: '0 auto 12px auto',
    padding: '0 4px',
    boxSizing: 'border-box'
  },
  avatarWrap: {
    position: 'relative',
    width: '34px',
    height: '34px',
    flexShrink: 0
  },
  avatarGlow: {
    position: 'absolute',
    inset: '-2px',
    borderRadius: 'var(--radius-sm)',
    background: 'radial-gradient(circle, rgba(56, 189, 248, 0.45) 0%, transparent 70%)',
    filter: 'blur(4px)',
    animation: 'pulseSubtle 1.8s infinite ease-in-out'
  },
  avatar: {
    position: 'relative',
    width: '34px',
    height: '34px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--glass-bg-card)',
    border: '1px solid rgba(56, 189, 248, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)'
  },
  contentCard: {
    flex: 1,
    background: 'var(--glass-bg-card)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-sm)',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    boxShadow: 'var(--glass-shadow-sm)'
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap'
  },
  agentName: {
    fontSize: '0.84rem',
    fontWeight: 600,
    color: 'var(--text-primary)'
  },
  roleBadge: {
    fontSize: '0.66rem',
    fontWeight: 500,
    fontFamily: 'var(--font-mono)',
    padding: '1px 6px',
    borderRadius: 'var(--radius-xs)',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--glass-border-subtle)',
    color: 'var(--text-secondary)'
  },
  activeTag: {
    fontSize: '0.62rem',
    fontWeight: 600,
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.06em',
    padding: '1px 6px',
    borderRadius: 'var(--radius-pill)',
    background: 'rgba(56, 189, 248, 0.12)',
    border: '1px solid rgba(56, 189, 248, 0.28)',
    color: '#38bdf8',
    marginLeft: 'auto'
  },
  bodyRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  waveDots: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px'
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#38bdf8',
    display: 'inline-block'
  },
  statusText: {
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    fontStyle: 'italic'
  }
};
