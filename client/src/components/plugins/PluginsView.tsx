import React from 'react';
import { useApp } from '../../context/AppContext';
import { Icons } from '../common/Icons';

export const PluginsView: React.FC = () => {
  const { mcpServers } = useApp();

  const fallbackServers = [
    { id: 'mcp-market-intel', name: 'Market Intelligence MCP Server', description: 'Real-time web search via DuckDuckGo, Exa neural search, and tech trend monitoring.', toolsCount: 4, transport: 'in-memory', status: 'connected' },
    { id: 'mcp-seo-audit', name: 'SEO & Competitor Audit MCP Server', description: 'Algorithmic search positioning audits, keyword difficulty scoring, and pricing teardowns.', toolsCount: 3, transport: 'in-memory', status: 'connected' },
    { id: 'mcp-growth-gtm', name: 'Growth & GTM Analytics MCP Server', description: 'CAC/LTV unit economic modeling, SaaS funnel benchmarks, and value proposition evaluation.', toolsCount: 3, transport: 'in-memory', status: 'connected' },
    { id: 'mcp-brain-memory', name: 'Foundry Brain Memory MCP Server', description: 'Semantic vector context querying and autonomous long-term guideline proposal.', toolsCount: 2, transport: 'in-memory', status: 'connected' },
    { id: 'mcp-doc-archive', name: 'Document Archive & PDF Generation MCP Server', description: 'PDF report generation, vault document search, and export engine.', toolsCount: 2, transport: 'in-memory', status: 'connected' }
  ];

  const displayServers = mcpServers.length > 0 ? mcpServers : fallbackServers;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Plugins & Model Context Protocol (MCP)</h1>
        <p style={styles.subtitle}>
          Standardized tool interfaces connecting FoundryOS AI agents to real-time search, competitor analytics, SaaS unit economics, and long-term company brain memory.
        </p>
      </div>

      {/* Connected MCP Servers Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Connected MCP Servers (Active)</h2>
        <div style={styles.serverGrid}>
          {displayServers.map(server => (
            <div key={server.id} style={styles.serverCard}>
              <div style={styles.serverTop}>
                <div style={styles.serverIcon}>
                  <Icons.Plugins size={20} />
                </div>
                <div style={styles.serverMeta}>
                  <h3 style={styles.serverName}>{server.name}</h3>
                  <span style={styles.serverId}>{server.id}</span>
                </div>
                <span style={styles.statusPill}>● {server.status}</span>
              </div>
              <p style={styles.serverDesc}>{server.description}</p>
              <div style={styles.serverFooter}>
                <span style={styles.toolCount}>
                  <Icons.Wrench size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }} />
                  {server.toolsCount} Tools Registered
                </span>
                <span style={styles.transportTag}>{server.transport}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '30px 40px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    overflowY: 'auto',
    height: 'calc(100vh - 60px)'
  },
  header: {
    marginBottom: '28px'
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '2rem',
    fontWeight: 700,
    letterSpacing: '-0.03em',
    color: 'var(--text-primary)',
    marginBottom: '8px'
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.96rem',
    lineHeight: '1.5'
  },
  section: {
    marginBottom: '32px'
  },
  sectionTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.15rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '14px'
  },
  serverGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
    gap: '16px'
  },
  serverCard: {
    background: 'var(--glass-bg-card)',
    backdropFilter: 'var(--glass-blur)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px',
    boxShadow: 'var(--glass-inner-light), var(--glass-shadow-sm)',
    display: 'flex',
    flexDirection: 'column'
  },
  serverTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px'
  },
  serverIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-primary)'
  },
  serverMeta: {
    flex: 1
  },
  serverName: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.92rem',
    fontWeight: 600,
    color: 'var(--text-primary)'
  },
  serverId: {
    fontSize: '0.7rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-tertiary)'
  },
  statusPill: {
    fontSize: '0.66rem',
    fontWeight: 600,
    padding: '2px 7px',
    borderRadius: 'var(--radius-xs)',
    background: 'rgba(16, 185, 129, 0.08)',
    color: '#10b981',
    border: '1px solid rgba(16, 185, 129, 0.2)'
  },
  serverDesc: {
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.45',
    flex: 1,
    marginBottom: '14px'
  },
  serverFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '10px',
    borderTop: '1px solid var(--glass-border-subtle)',
    fontSize: '0.72rem'
  },
  toolCount: {
    color: 'var(--text-secondary)',
    fontWeight: 500
  },
  transportTag: {
    padding: '2px 6px',
    background: 'var(--glass-bg-surface)',
    borderRadius: 'var(--radius-xs)',
    color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-mono)'
  }
};
