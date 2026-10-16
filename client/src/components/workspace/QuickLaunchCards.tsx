import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Icons } from '../common/Icons';

interface QuickLaunchProps {
  layout?: 'landing' | 'inline';
}

export const QuickLaunchCards: React.FC<QuickLaunchProps> = ({ layout = 'landing' }) => {
  const { executeAgentRun, setSelectedAgentId, demoProfiles, activeProfileId, messages } = useApp();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const defaultSuggestions = [
    {
      agentId: 'multi-agent',
      text: 'Run 360° Multi-Agent Launch Teardown across all 4 specialists',
      prompt: 'Execute a collaborative multi-agent teardown: evaluate market demand, expose competitor weaknesses, refine core positioning, and design the GTM funnel.'
    },
    {
      agentId: 'market-research-analyst',
      text: 'Run a market intelligence audit on emerging opportunities',
      prompt: 'Analyze macro market trends, TAM expansion opportunities, and customer pain points for our product.'
    },
    {
      agentId: 'competitor-analyst',
      text: 'Tear down competitor pricing, features, and weak spots',
      prompt: 'Perform competitive intelligence audit across direct and indirect competitors, feature matrices, and pricing moves.'
    },
    {
      agentId: 'chief-marketing-strategist',
      text: 'Craft our brand positioning and value proposition',
      prompt: 'Formulate comprehensive company positioning statement and strategic pillars enforcing brand tone rules.'
    }
  ];

  const currentProfile = demoProfiles.find(p => p.id === activeProfileId);
  const profileSuggestions = currentProfile?.quickPrompts
    ? currentProfile.quickPrompts.map(qp => ({
        agentId: qp.agentId,
        text: qp.label,
        prompt: qp.prompt
      }))
    : defaultSuggestions;

  const latestAiMessage = [...messages].reverse().find(m => !m.isUser && m.suggestions && m.suggestions.length > 0);
  const activeSuggestions = (layout === 'inline' && latestAiMessage?.suggestions && latestAiMessage.suggestions.length > 0)
    ? latestAiMessage.suggestions.map(s => ({
        agentId: s.agentId || 'multi-agent',
        text: s.label,
        prompt: s.prompt
      }))
    : profileSuggestions;

  const handleClick = (agentId: string, prompt: string) => {
    setSelectedAgentId(agentId);
    executeAgentRun(prompt, agentId);
  };

  if (layout === 'inline') {
    return (
      <div style={inlineStyles.wrapper}>
        <div style={inlineStyles.label}>
          <Icons.Sparkles size={11} />
          <span>Next Steps</span>
        </div>
        <div style={inlineStyles.row}>
          {activeSuggestions.slice(0, 3).map((s, i) => (
            <button
              key={i}
              className="interactive-hover-lift"
              onClick={() => handleClick(s.agentId, s.prompt)}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                ...inlineStyles.chip,
                ...(hoveredIdx === i ? inlineStyles.chipHover : {})
              }}
            >
              <span style={inlineStyles.chipText}>
                {s.text.length > 38 ? s.text.slice(0, 38) + '…' : s.text}
              </span>
              <Icons.ArrowRight size={10} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={landingStyles.container}>
      {activeSuggestions.map((s, i) => (
        <button
          key={i}
          className="dashboard-card-interactive"
          onClick={() => handleClick(s.agentId, s.prompt)}
          onMouseEnter={() => setHoveredIdx(i)}
          onMouseLeave={() => setHoveredIdx(null)}
          style={{
            ...landingStyles.card,
            ...(hoveredIdx === i ? landingStyles.cardHover : {}),
            animation: `cardCascade 0.45s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.1}s both`
          }}
        >
          <div
            style={{
              ...landingStyles.iconPill,
              animation: `sparkleFloat 3s ease-in-out ${i * 0.5}s infinite`
            }}
          >
            <Icons.Sparkles size={13} style={{ color: 'var(--text-secondary)' }} />
          </div>
          <span style={landingStyles.text}>{s.text}</span>
          <Icons.ArrowRight
            size={13}
            style={{
              ...landingStyles.arrow,
              ...(hoveredIdx === i ? landingStyles.arrowHover : {})
            }}
          />
        </button>
      ))}
    </div>
  );
};

const landingStyles: Record<string, React.CSSProperties> = {
  container: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    width: '100%',
    maxWidth: '720px',
    marginTop: '20px'
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    background: 'var(--glass-bg-card)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    textAlign: 'left'
  },
  cardHover: {
    background: 'var(--glass-bg-card-hover)',
    borderColor: 'var(--glass-border-specular)',
    transform: 'translateY(-1px)',
    boxShadow: 'var(--glass-shadow-sm)'
  },
  iconPill: {
    width: '28px',
    height: '28px',
    borderRadius: 'var(--radius-xs)',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--glass-border-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  arrow: {
    color: 'var(--text-tertiary)',
    flexShrink: 0,
    transition: 'all var(--transition-fast)',
    marginLeft: 'auto',
    transform: 'translateX(0)'
  },
  arrowHover: {
    color: 'var(--text-primary)',
    transform: 'translateX(2px)'
  },
  text: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.82rem',
    fontWeight: 500,
    color: 'var(--text-primary)',
    lineHeight: '1.4'
  }
};

const inlineStyles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '0 24px 12px 24px',
    maxWidth: '960px',
    margin: '0 auto',
    width: '100%',
    animation: 'fadeSlideUp 0.25s var(--ease-apple)'
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.68rem',
    fontWeight: 600,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em'
  },
  row: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-pill)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    color: 'var(--text-secondary)',
    fontSize: '0.76rem',
    fontFamily: 'var(--font-body)',
    fontWeight: 400
  },
  chipHover: {
    background: 'var(--glass-bg-card-hover)',
    borderColor: 'var(--border-hover)',
    color: 'var(--text-primary)'
  },
  chipText: {
    whiteSpace: 'nowrap'
  }
};
