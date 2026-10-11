import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Icons } from './Icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('FoundryOS UI encountered uncaught render error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={styles.errorContainer}>
          <div style={styles.card}>
            <div style={styles.icon}>
              <Icons.AlertCircle size={38} style={{ color: '#ffffff' }} />
            </div>
            <h2 style={styles.title}>Workspace Display Error</h2>
            <p style={styles.desc}>
              An unexpected render issue was safely intercepted. Your conversation and session data remain intact.
            </p>
            <div style={styles.details}>
              <code>{this.state.error?.message || 'Component failed to render.'}</code>
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
                window.location.reload();
              }}
              style={styles.retryBtn}
            >
              Refresh Workspace
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles: Record<string, React.CSSProperties> = {
  errorContainer: {
    height: '100vh',
    width: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#000000',
    color: '#ffffff',
    padding: '20px'
  },
  card: {
    background: 'rgba(18, 18, 22, 0.95)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '24px',
    padding: '36px',
    maxWidth: '520px',
    textAlign: 'center',
    boxShadow: '0 16px 44px rgba(0, 0, 0, 0.8)'
  },
  icon: {
    fontSize: '2.5rem',
    marginBottom: '16px'
  },
  title: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    fontSize: '1.4rem',
    fontWeight: 700,
    marginBottom: '10px'
  },
  desc: {
    fontSize: '0.88rem',
    color: '#a1a1aa',
    lineHeight: '1.5',
    marginBottom: '20px'
  },
  details: {
    padding: '10px 14px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    fontFamily: 'monospace',
    fontSize: '0.78rem',
    color: '#f87171',
    wordBreak: 'break-word',
    marginBottom: '24px',
    textAlign: 'left'
  },
  retryBtn: {
    padding: '11px 26px',
    background: '#ffffff',
    color: '#000000',
    border: 'none',
    borderRadius: '9999px',
    fontWeight: 600,
    fontSize: '0.86rem',
    cursor: 'pointer'
  }
};
