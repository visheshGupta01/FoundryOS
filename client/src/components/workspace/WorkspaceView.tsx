import React, { useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { QuickLaunchCards } from './QuickLaunchCards';
import { MessageItem } from './MessageItem';
import { ChatInput } from './ChatInput';
import { ExecutionBlob } from './ExecutionBlob';

export const WorkspaceView: React.FC = () => {
  const { messages, isExecuting, selectedAgentId, employees, brainData } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasMessages = messages.length > 0;
  const founderName = brainData?.name || 'Founder';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isExecuting]);

  const activeEmployee = employees.find(e => (e.identity?.id || e.id) === selectedAgentId);
  const employeeName = (activeEmployee ? (activeEmployee.identity?.name || activeEmployee.name) : null) || (selectedAgentId === 'auto' ? 'Autonomous Specialist Team' : 'Specialist Agent');

  if (!hasMessages) {
    return (
      <div style={styles.container}>
        <div style={styles.landingWrapper}>
          {/* Animated gradient orb backdrop */}
          <div style={styles.orbContainer}>
            <div style={styles.orbPrimary} />
            <div style={styles.orbSecondary} />
          </div>

          <div style={styles.landingContent}>
            <h1 style={styles.heroTitle}>
              Welcome{founderName !== 'Founder' ? `, ${founderName}` : ' Founder'},
            </h1>
            <p style={styles.heroSubtext}>What can your autonomous team execute for you today?</p>

            <div style={styles.inputDock}>
              <ChatInput />
            </div>

            <div style={styles.cardsArea}>
              <QuickLaunchCards layout="landing" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div ref={scrollRef} style={styles.scrollArea}>
        <div style={styles.messagesList}>
          {messages.map(msg => (
            <MessageItem key={msg.id} message={msg} />
          ))}

          {isExecuting && (
            <ExecutionBlob
              employeeName={employeeName}
              selectedAgentId={selectedAgentId}
              activeEmployee={activeEmployee}
            />
          )}
        </div>
      </div>

      <QuickLaunchCards layout="inline" />
      <ChatInput />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 56px)',
    width: '100%',
    position: 'relative'
  },
  landingWrapper: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 24px 60px 24px',
    position: 'relative',
    overflow: 'hidden'
  },
  orbContainer: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
    zIndex: 0
  },
  orbPrimary: {
    position: 'absolute',
    top: '35%',
    left: '48%',
    width: '520px',
    height: '520px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(167, 139, 250, 0.16) 0%, rgba(56, 189, 248, 0.08) 45%, transparent 70%)',
    animation: 'orbFloatA 14s ease-in-out infinite',
    filter: 'blur(70px)'
  },
  orbSecondary: {
    position: 'absolute',
    top: '52%',
    left: '42%',
    width: '420px',
    height: '420px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(52, 211, 153, 0.12) 0%, rgba(56, 189, 248, 0.06) 50%, transparent 70%)',
    animation: 'orbFloatB 18s ease-in-out 1.5s infinite',
    filter: 'blur(60px)'
  },
  landingContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: '720px',
    position: 'relative',
    zIndex: 1
  },
  heroTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '2.4rem',
    fontWeight: 700,
    letterSpacing: '-0.03em',
    color: 'var(--text-primary)',
    marginBottom: '8px',
    textAlign: 'center',
    animation: 'heroReveal 0.7s cubic-bezier(0.16, 1, 0.3, 1) both'
  },
  heroSubtext: {
    fontSize: '0.96rem',
    color: 'var(--text-tertiary)',
    lineHeight: '1.5',
    marginBottom: '20px',
    textAlign: 'center',
    animation: 'subtextFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both'
  },
  inputDock: {
    width: '100%',
    animation: 'inputDock 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both'
  },
  cardsArea: {
    width: '100%',
    animation: 'cardCascade 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.55s both'
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    paddingBottom: '20px'
  },
  messagesList: {
    display: 'flex',
    flexDirection: 'column',
    padding: '16px 0',
    flex: 1
  },
  loadingCard: {
    maxWidth: '860px',
    margin: '0 auto 16px auto',
    width: '100%',
    padding: '14px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'var(--glass-bg-card)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    fontSize: '0.82rem'
  },
  loadingPulse: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--text-primary)'
  },
  loadingText: {
    color: 'var(--text-primary)'
  }
};

