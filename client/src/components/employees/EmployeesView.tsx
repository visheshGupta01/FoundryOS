import React from 'react';
import { useApp } from '../../context/AppContext';
import { Icons } from '../common/Icons';

export const EmployeesView: React.FC = () => {
  const { employees, setSelectedAgentId, setActiveView } = useApp();

  const renderEmployeeIcon = (id: string, size = 20) => {
    switch (id) {
      case 'market-research-analyst':
        return <Icons.Search size={size} style={{ color: '#38bdf8' }} />;
      case 'competitor-analyst':
        return <Icons.Shield size={size} style={{ color: '#f87171' }} />;
      case 'chief-marketing-strategist':
        return <Icons.Target size={size} style={{ color: '#a78bfa' }} />;
      case 'gtm-funnel-strategist':
        return <Icons.TrendingUp size={size} style={{ color: '#34d399' }} />;
      case 'multi-agent':
        return <Icons.Users size={size} style={{ color: '#fbbf24' }} />;
      default:
        return <Icons.Bot size={size} style={{ color: 'var(--text-primary)' }} />;
    }
  };

  const fallbackEmployees = [
    {
      identity: {
        id: 'market-research-analyst',
        name: 'Maya Lin',
        title: 'Senior Market Intelligence Specialist',
        avatar: 'MR'
      },
      systemPrompt: 'Audits industry verticals, identifies untapped TAM, tracks emerging search queries, and validates buyer willingness to pay.',
      specialties: ['TAM/SAM/SOM Modeling', 'Customer Problem Space Validation', 'Macro Tech Trends (HackerNews / Reddit)', 'Search Intent Mapping']
    },
    {
      identity: {
        id: 'competitor-analyst',
        name: 'Julian Vance',
        title: 'Lead Competitive Intelligence Officer',
        avatar: 'CI'
      },
      systemPrompt: 'Dissects competitor feature releases, reverse engineers pricing tiers, and flags strategic vulnerabilities in rival moats.',
      specialties: ['Competitor Feature Matrix Teardown', 'Pricing Strategy Comparison', 'Competitor Weakness Exploitation', 'G2 / Review Sentiment Audits']
    },
    {
      identity: {
        id: 'chief-marketing-strategist',
        name: 'Sarah Sterling',
        title: 'VP of Brand & GTM Strategy',
        avatar: 'CS'
      },
      systemPrompt: 'Architects brand positioning statements, enforces voice principles, and governs messaging consistency across all deliverables.',
      specialties: ['Brand Positioning Frameworks', 'Core Value Proposition Definition', 'Brand Tone Governance', 'Strategic Messaging Pillars']
    },
    {
      identity: {
        id: 'gtm-funnel-strategist',
        name: 'Marcus Brody',
        title: 'Principal Funnel Architect',
        avatar: 'FS'
      },
      systemPrompt: 'Designs high-converting TOFU awareness, MOFU qualification, and BOFU customer acquisition funnels calibrated to startup CAC/LTV.',
      specialties: ['Full-Funnel GTM Architecture', 'CAC & LTV Unit Economics', 'Conversion Rate Optimization', 'Outbound Strategy Playbooks']
    }
  ];

interface NormalizedEmployee {
  id: string;
  name: string;
  title: string;
  avatar: string;
  specialties: string[];
  description: string;
}

  const rawEmployees: any[] = employees && employees.length > 0 ? employees : fallbackEmployees;

  const normalizedEmployees: NormalizedEmployee[] = rawEmployees.map((emp: any, index: number) => {
    const id = emp.identity?.id || emp.id || `agent-${index}`;
    const name = emp.identity?.name || emp.name || 'Specialist Agent';
    const title = emp.identity?.title || emp.role || 'Specialist Agent';
    const avatar = emp.identity?.avatar || emp.avatar || name.slice(0, 2).toUpperCase();
    const specialties: string[] = (emp.specialties && emp.specialties.length > 0)
      ? emp.specialties
      : (emp.responsibilities || ['Strategy', 'Execution', 'Analysis']);
    const description = emp.description || (emp.systemPrompt
      ? emp.systemPrompt.split('\n')[0].replace(/^You are the /, '')
      : 'Autonomous specialist equipped with institutional brain context and real-time execution playbooks.');

    return {
      id,
      name,
      title,
      avatar,
      specialties,
      description
    };
  });

  const handleStartChat = (id: string) => {
    setSelectedAgentId(id);
    setActiveView('chat');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.badge}>
          <span style={styles.badgeDot} />
          <span>AUTONOMOUS SPECIALISTS</span>
        </div>
        <h1 style={styles.title}>AI Agents & Specialists</h1>
        <p style={styles.subtitle}>
          Your coordinated AI specialist team. Each specialist commands dedicated tools, context-window memory, and specialized execution playbooks.
        </p>
      </div>

      <div style={styles.grid}>
        {normalizedEmployees.map(emp => (
          <div key={emp.id} style={styles.card}>
            <div style={styles.cardTop}>
              <div style={styles.avatar}>
                {renderEmployeeIcon(emp.id, 20)}
              </div>
              <div style={styles.info}>
                <h3 style={styles.name}>{emp.name}</h3>
                <span style={styles.role}>{emp.title}</span>
              </div>
              <span style={styles.statusBadge}>Active</span>
            </div>

            <p style={styles.desc}>{emp.description}</p>

            <div style={styles.capabilitiesArea}>
              <span style={styles.respHeader}>Core Capabilities:</span>
              <div style={styles.tagDeck}>
                {emp.specialties.map((spec, sIdx) => (
                  <span key={sIdx} style={styles.tag}>{spec}</span>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleStartChat(emp.id)}
              style={styles.chatBtn}
            >
              Consult {emp.name.split(' ')[0]} →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '36px 40px',
    maxWidth: '1240px',
    margin: '0 auto',
    width: '100%',
    overflowY: 'auto',
    height: 'calc(100vh - 60px)',
    animation: 'fadeSlideUp 0.35s var(--ease-apple)'
  },
  header: {
    marginBottom: '36px'
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-pill)',
    fontSize: '0.72rem',
    fontWeight: 600,
    letterSpacing: '0.05em',
    color: 'var(--text-secondary)',
    marginBottom: '14px'
  },
  badgeDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--accent-primary)'
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '2.3rem',
    fontWeight: 700,
    letterSpacing: '-0.035em',
    color: 'var(--text-primary)',
    marginBottom: '8px'
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.96rem',
    lineHeight: '1.6',
    maxWidth: '720px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '24px'
  },
  card: {
    background: 'var(--glass-bg-card)',
    backdropFilter: 'var(--glass-blur)',
    WebkitBackdropFilter: 'var(--glass-blur)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)',
    padding: '28px',
    boxShadow: 'var(--glass-shadow-sm)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all var(--transition-smooth)',
    cursor: 'default'
  },
  cardTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '18px'
  },
  avatar: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--border-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  info: {
    flex: 1
  },
  name: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.05rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
    marginBottom: '2px'
  },
  role: {
    fontSize: '0.76rem',
    color: 'var(--text-secondary)',
    fontWeight: 500
  },
  statusBadge: {
    fontSize: '0.66rem',
    fontWeight: 500,
    padding: '2px 7px',
    borderRadius: 'var(--radius-xs)',
    background: 'var(--glass-bg-surface)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--glass-border-subtle)',
    letterSpacing: '0.04em'
  },
  desc: {
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    marginBottom: '16px'
  },
  capabilitiesArea: {
    marginBottom: '18px',
    flex: 1
  },
  respHeader: {
    fontSize: '0.68rem',
    fontWeight: 600,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    display: 'block',
    marginBottom: '8px'
  },
  tagDeck: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px'
  },
  tag: {
    fontSize: '0.72rem',
    padding: '3px 8px',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-xs)',
    color: 'var(--text-secondary)',
    transition: 'all var(--transition-fast)'
  },
  chatBtn: {
    width: '100%',
    padding: '9px 14px',
    borderRadius: 'var(--radius-xs)',
    background: 'var(--accent-primary)',
    border: '1px solid var(--accent-primary)',
    color: 'var(--bg-primary)',
    fontWeight: 700,
    fontSize: '0.82rem',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)'
  }
};
