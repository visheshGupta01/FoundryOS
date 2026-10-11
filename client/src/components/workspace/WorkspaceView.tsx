import React, { useRef, useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { QuickLaunchCards } from './QuickLaunchCards';
import { MessageItem } from './MessageItem';
import { ChatInput } from './ChatInput';

export const WorkspaceView: React.FC = () => {
  const { messages, isExecuting, selectedAgentId, employees, brainData } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasMessages = messages.length > 0;
  const founderName = brainData?.name || 'Founder';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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
            <p style={styles.heroSubtext}>What can we do for you?</p>

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
            <ExecutionStepper
              employeeName={employeeName}
              isLightweight={selectedAgentId === 'foundryos-assistant'}
            />
          )}
        </div>
      </div>

      <QuickLaunchCards layout="inline" />
      <ChatInput />
    </div>
  );
};

const ExecutionStepper: React.FC<{ employeeName: string; isLightweight?: boolean }> = ({ employeeName, isLightweight }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = isLightweight ? [
    { tag: 'OPTIMIZER', label: 'Bypassing heavy model pipeline — routing to lightweight agent' },
    { tag: 'BRAIN:LOOKUP', label: 'Resolving company context & memory cache' },
    { tag: 'SYNTHESIS', label: 'Formulating direct response' }
  ] : [
    { tag: 'MCP:BRAIN', label: 'Ingesting company brain memory vectors & active ICP context' },
    { tag: 'AGENT:ROUTE', label: `Dispatching execution to ${employeeName}` },
    { tag: 'MCP:INTEL', label: 'Executing real-time market search & competitor benchmarking' },
    { tag: 'SCHEMA:VALIDATE', label: 'Synthesizing verified strategic brief & deliverable' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, isLightweight ? 450 : 1100);
    return () => clearInterval(timer);
  }, [steps.length, isLightweight]);

  return (
    <div style={stepperStyles.container}>
      <div style={stepperStyles.header}>
        <div style={stepperStyles.headerLeft}>
          <span style={stepperStyles.runtimeTag}>{isLightweight ? 'LIGHTWEIGHT RUNTIME' : 'MCP RUNTIME'}</span>
          <span style={stepperStyles.headerText}>
            {isLightweight ? 'Normal Agent executing fast-path' : `${employeeName} executing strategy pipeline`}
          </span>
        </div>
        <div style={stepperStyles.spinner} />
      </div>

      <div style={stepperStyles.stepList}>
        {steps.map((s, idx) => {
          const isDone = idx < currentStep;
          const isCurrent = idx === currentStep;
          return (
            <div
              key={idx}
              style={{
                ...stepperStyles.stepItem,
                opacity: isDone || isCurrent ? 1 : 0.3
              }}
            >
              <span style={{
                ...stepperStyles.stepTag,
                color: isCurrent ? 'var(--text-primary)' : 'var(--text-tertiary)',
                borderColor: isCurrent ? 'var(--glass-border-specular)' : 'var(--glass-border-subtle)'
              }}>
                {s.tag}
              </span>
              <span
                style={{
                  ...stepperStyles.stepLabel,
                  color: isCurrent ? 'var(--text-primary)' : (isDone ? 'var(--text-secondary)' : 'var(--text-tertiary)'),
                  fontWeight: isCurrent ? 500 : 400
                }}
              >
                {s.label}
              </span>
              {isDone && <span style={stepperStyles.checkMark}>✓</span>}
              {isCurrent && <span style={stepperStyles.activeDot} />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const stepperStyles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '860px',
    margin: '0 auto 16px auto',
    width: '100%',
    padding: '14px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    background: 'var(--glass-bg-card)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-sm)',
    boxSizing: 'border-box'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '8px',
    borderBottom: '1px solid var(--glass-border-subtle)'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  runtimeTag: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.66rem',
    fontWeight: 600,
    letterSpacing: '0.06em',
    padding: '2px 6px',
    background: 'var(--glass-bg-surface)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-xs)',
    color: 'var(--text-secondary)'
  },
  headerText: {
    fontSize: '0.8rem',
    fontWeight: 500,
    color: 'var(--text-primary)'
  },
  stepList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  stepItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '0.78rem',
    transition: 'opacity 0.2s ease'
  },
  stepTag: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.64rem',
    padding: '1px 5px',
    borderRadius: 'var(--radius-xs)',
    border: '1px solid transparent',
    background: 'var(--glass-bg-surface)'
  },
  stepLabel: {
    flex: 1,
    lineHeight: '1.4'
  },
  checkMark: {
    color: 'var(--text-secondary)',
    fontWeight: 600,
    fontSize: '0.75rem',
    fontFamily: 'var(--font-mono)'
  },
  activeDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--text-primary)'
  },
  spinner: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    border: '2px solid var(--glass-border-subtle)',
    borderTopColor: 'var(--text-primary)',
    animation: 'spin 0.7s linear infinite'
  }
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
    top: '38%',
    left: '50%',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(167, 139, 250, 0.12) 0%, rgba(56, 189, 248, 0.06) 50%, transparent 70%)',
    animation: 'gradientOrb 6s ease-in-out infinite',
    filter: 'blur(60px)'
  },
  orbSecondary: {
    position: 'absolute',
    top: '55%',
    left: '45%',
    width: '350px',
    height: '350px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(52, 211, 153, 0.08) 0%, rgba(251, 191, 36, 0.04) 50%, transparent 70%)',
    animation: 'gradientOrb 8s ease-in-out 2s infinite',
    filter: 'blur(50px)'
  },
  landingContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: '680px',
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
    marginBottom: '32px',
    textAlign: 'center',
    animation: 'subtextFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both'
  },
  inputDock: {
    width: '100%',
    animation: 'inputDock 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both'
  },
  cardsArea: {
    width: '100%',
    animation: 'cardCascade 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both'
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

