import React from 'react';
import type { Employee } from '../../types';

interface ExecutionBlobProps {
  employeeName: string;
  selectedAgentId: string;
  activeEmployee?: Employee;
}

export const ExecutionBlob: React.FC<ExecutionBlobProps> = () => {
  return (
    <div style={styles.container} className="execution-blob-animate">
      <div style={styles.blobWrapper}>
        <div style={styles.glowAura} />
        <div style={styles.morphingBlob}>
          <div style={styles.blobInnerCore} />
        </div>
      </div>
      <div style={styles.metaRow}>
        <span style={styles.shimmerText}>Brain is thinking...</span>
        <span style={styles.pulsePill}>Executing</span>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    maxWidth: '860px',
    width: '100%',
    margin: '12px auto',
    padding: '12px 18px',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(18, 19, 24, 0.65)',
    backdropFilter: 'blur(20px)',
    border: '1px solid var(--glass-border-subtle)',
    boxShadow: 'var(--glass-shadow-sm)',
    boxSizing: 'border-box'
  },
  blobWrapper: {
    position: 'relative',
    width: '38px',
    height: '38px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  glowAura: {
    position: 'absolute',
    inset: '-6px',
    background: 'radial-gradient(circle, rgba(56, 189, 248, 0.45) 0%, rgba(129, 140, 248, 0.35) 45%, transparent 70%)',
    borderRadius: '50%',
    animation: 'fluidBlobGlowPulse 2.8s ease-in-out infinite'
  },
  morphingBlob: {
    position: 'relative',
    width: '32px',
    height: '32px',
    background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 40%, #c084fc 75%, #34d399 100%)',
    animation: 'fluidBlobMorph 7s ease-in-out infinite, fluidBlobDrift 3.5s ease-in-out infinite',
    boxShadow: '0 0 16px rgba(56, 189, 248, 0.5), inset 0 0 8px rgba(255, 255, 255, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  blobInnerCore: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.85)',
    filter: 'blur(2px)',
    animation: 'fluidBlobMorph 5s ease-in-out infinite reverse'
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1
  },
  shimmerText: {
    fontSize: '0.84rem',
    fontWeight: 500,
    background: 'linear-gradient(90deg, #a1a1aa 0%, #ffffff 50%, #a1a1aa 100%)',
    backgroundSize: '200% 100%',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: 'textShimmerWave 2.5s ease-in-out infinite'
  },
  pulsePill: {
    fontSize: '0.62rem',
    fontWeight: 600,
    letterSpacing: '0.05em',
    padding: '2px 8px',
    borderRadius: 'var(--radius-pill)',
    background: 'rgba(56, 189, 248, 0.1)',
    border: '1px solid rgba(56, 189, 248, 0.25)',
    color: '#38bdf8',
    marginLeft: 'auto'
  }
};
