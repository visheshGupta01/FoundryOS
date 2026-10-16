import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Icons } from '../common/Icons';

export const RecentChatsView: React.FC = () => {
  const { recentChats, loadChatSession, deleteChatSession, setActiveView } = useApp();
  const [filterType, setFilterType] = useState<'all' | 'specific' | 'auto'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = recentChats.filter(chat => {
    // 1. Agent specificity filter
    if (filterType === 'specific' && !chat.isAgentSpecific) return false;
    if (filterType === 'auto' && chat.isAgentSpecific) return false;

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = chat.title.toLowerCase().includes(q);
      const matchAgent = chat.agentName.toLowerCase().includes(q);
      const matchPreview = chat.lastMessagePreview.toLowerCase().includes(q);
      return matchTitle || matchAgent || matchPreview;
    }

    return true;
  });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Recent Chats & Sessions</h1>
          <p style={styles.subtitle}>
            Review and resume past strategic sessions. Filter by specialist agent execution or autonomous auto-routed discussions.
          </p>
        </div>

        <button onClick={() => setActiveView('chat')} style={styles.newChatBtn}>
          <Icons.Plus size={16} />
          <span>Start New Chat</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={styles.filterBar}>
        <div style={styles.segmentedControl}>
          <button
            onClick={() => setFilterType('all')}
            style={{
              ...styles.filterBtn,
              ...(filterType === 'all' ? styles.filterBtnActive : {})
            }}
          >
            All Chats ({recentChats.length})
          </button>
          <button
            onClick={() => setFilterType('specific')}
            style={{
              ...styles.filterBtn,
              ...(filterType === 'specific' ? styles.filterBtnActive : {})
            }}
          >
            <Icons.Target size={13} />
            <span>Agent Specific ({recentChats.filter(c => c.isAgentSpecific).length})</span>
          </button>
          <button
            onClick={() => setFilterType('auto')}
            style={{
              ...styles.filterBtn,
              ...(filterType === 'auto' ? styles.filterBtnActive : {})
            }}
          >
            <Icons.Sparkles size={13} />
            <span>Auto Route ({recentChats.filter(c => !c.isAgentSpecific).length})</span>
          </button>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder=""
          style={styles.searchInput}
        />
      </div>

      {/* Chats Grid */}
      {recentChats.length === 0 ? (
        <div style={styles.emptyCard}>
          <div style={styles.emptyIcon}>
            <Icons.MessageSquare size={36} />
          </div>
          <h3 style={styles.emptyTitle}>No Recent Chats Yet</h3>
          <p style={styles.emptyDesc}>
            Your past discussions, market analyses, and positioning playbooks will automatically be saved and indexed here.
          </p>
          <button onClick={() => setActiveView('chat')} style={styles.startBtn}>
            Launch Chat Workspace →
          </button>
        </div>
      ) : filteredChats.length === 0 ? (
        <div style={styles.emptyCard}>
          <h3 style={styles.emptyTitle}>No Matching Chats</h3>
          <p style={styles.emptyDesc}>
            No chat sessions match your active filter criteria. Try selecting "All Chats" or clearing your search query.
          </p>
          <button onClick={() => { setFilterType('all'); setSearchQuery(''); }} style={styles.startBtn}>
            Reset Filters
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredChats.map(chat => (
            <div key={chat.id} style={styles.chatCard}>
              <div style={styles.cardHeader}>
                <div style={styles.agentTag}>
                  {chat.isAgentSpecific ? <Icons.Target size={13} /> : <Icons.Sparkles size={13} />}
                  <span>{chat.isAgentSpecific ? 'Specialist:' : 'Routed:'}</span>
                  <strong>{chat.agentName}</strong>
                </div>
                <span style={styles.timeTag}>{chat.createdAt}</span>
              </div>

              <h3 style={styles.chatTitle}>{chat.title}</h3>
              <p style={styles.chatPreview}>{chat.lastMessagePreview}</p>

              <div style={styles.cardFooter}>
                <span style={styles.msgCount}>
                  <Icons.MessageSquare size={13} />
                  <span>{chat.messageCount} messages</span>
                </span>
                <div style={styles.cardActions}>
                  <button
                    onClick={() => deleteChatSession(chat.id)}
                    style={styles.deleteBtn}
                    title="Delete chat session"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => loadChatSession(chat.id)}
                    style={styles.resumeBtn}
                  >
                    Continue Chat →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '28px',
    gap: '20px'
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '2.2rem',
    fontWeight: 700,
    letterSpacing: '-0.035em',
    color: '#ffffff',
    marginBottom: '8px'
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.96rem',
    lineHeight: '1.55',
    maxWidth: '680px'
  },
  newChatBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 16px',
    background: '#ffffff',
    border: '1px solid #ffffff',
    borderRadius: 'var(--radius-xs)',
    color: '#09090b',
    fontSize: '0.8rem',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all var(--transition-fast)'
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '28px',
    flexWrap: 'wrap'
  },
  segmentedControl: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
    padding: '0',
    background: 'transparent'
  },
  filterBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '5px 12px',
    background: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-xs)',
    color: 'var(--text-tertiary)',
    fontSize: '0.78rem',
    fontWeight: 400,
    cursor: 'pointer',
    transition: 'color var(--transition-fast)'
  },
  filterBtnActive: {
    background: 'transparent',
    color: 'var(--text-primary)',
    fontWeight: 600
  },
  searchInput: {
    background: 'var(--glass-bg-input)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-xs)',
    padding: '6px 14px',
    color: 'var(--text-primary)',
    fontSize: '0.8rem',
    outline: 'none',
    minWidth: '240px'
  },
  emptyCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    textAlign: 'center',
    background: 'var(--glass-bg-card)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-sm)'
  },
  emptyIcon: {
    fontSize: '2rem',
    marginBottom: '12px',
    color: 'var(--text-tertiary)'
  },
  emptyTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.15rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '6px'
  },
  emptyDesc: {
    color: 'var(--text-secondary)',
    fontSize: '0.86rem',
    maxWidth: '440px',
    lineHeight: '1.5',
    marginBottom: '20px'
  },
  startBtn: {
    padding: '8px 18px',
    background: '#ffffff',
    border: '1px solid #ffffff',
    borderRadius: 'var(--radius-xs)',
    color: '#09090b',
    fontWeight: 700,
    fontSize: '0.82rem',
    cursor: 'pointer'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '20px'
  },
  chatCard: {
    background: 'rgba(16, 16, 20, 0.85)',
    backdropFilter: 'var(--glass-blur)',
    WebkitBackdropFilter: 'var(--glass-blur)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: 'var(--radius-lg)',
    padding: '22px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.15), 0 8px 24px rgba(0, 0, 0, 0.5)',
    transition: 'all var(--transition-smooth)'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  agentTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.74rem',
    color: 'var(--text-secondary)'
  },
  timeTag: {
    fontSize: '0.7rem',
    color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-mono)'
  },
  chatTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.05rem',
    fontWeight: 600,
    color: '#ffffff',
    marginBottom: '8px',
    lineHeight: '1.4'
  },
  chatPreview: {
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    flex: 1,
    marginBottom: '18px'
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)'
  },
  msgCount: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.72rem',
    color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-mono)'
  },
  cardActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  deleteBtn: {
    background: 'transparent',
    border: 'none',
    color: '#a1a1aa',
    fontSize: '0.74rem',
    cursor: 'pointer',
    padding: '4px 8px'
  },
  resumeBtn: {
    padding: '6px 14px',
    background: '#ffffff',
    border: 'none',
    borderRadius: 'var(--radius-pill)',
    color: '#000000',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer'
  }
};
