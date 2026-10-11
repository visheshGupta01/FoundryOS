import React from 'react';
import { useApp } from '../../context/AppContext';
import { BRAIN_LOGO_BASE64 } from './brainLogoData';

export interface BrainLogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const BrainLogo: React.FC<BrainLogoProps> = ({ size = 26, className, style }) => {
  const { theme } = useApp();
  const height = Math.round(size * 1.15);
  const isLight = theme === 'light';

  return (
    <div
      className={`brain-logo-container ${className || ''}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${size}px`,
        height: `${height}px`,
        position: 'relative',
        flexShrink: 0,
        ...style
      }}
    >
      <img
        src={BRAIN_LOGO_BASE64}
        alt="Brain Logo"
        className="brain-logo-img"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          filter: isLight
            ? 'brightness(0.12) drop-shadow(0 0 3px rgba(99, 102, 241, 0.35))'
            : 'drop-shadow(0 0 8px rgba(129, 140, 248, 0.65)) brightness(1.2)',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          userSelect: 'none',
          pointerEvents: 'none'
        }}
      />
    </div>
  );
};
