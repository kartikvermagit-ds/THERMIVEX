import React from 'react';
import pyravexLogoImg from '../assets/pyravex_logo.png';

interface LogoProps {
  size?: number;
  showSubtitle?: boolean;
  showBadge?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const PyravexLogo: React.FC<LogoProps> = ({ 
  size = 48, 
  showBadge = false,
  className = '',
  style = {}
}) => {
  return (
    <div 
      className={`flex items-center select-none ${className}`} 
      style={{ display: 'flex', alignItems: 'center', gap: '10px', userSelect: 'none', ...style }}
    >
      <img
        src={pyravexLogoImg}
        alt="PYRAVEX — Spaceborne Thermal Intelligence"
        style={{
          height: `${size}px`,
          width: 'auto',
          maxHeight: `${size}px`,
          objectFit: 'contain',
          filter: 'drop-shadow(0 0 16px rgba(249, 115, 22, 0.45)) drop-shadow(0 0 5px rgba(56, 189, 248, 0.35))',
          display: 'block'
        }}
        className="transition-transform duration-200 hover:scale-[1.03]"
      />

      {showBadge && (
        <span style={{
          fontSize: '10px',
          fontWeight: 800,
          letterSpacing: '0.08em',
          backgroundColor: 'rgba(56, 189, 248, 0.12)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          color: '#38BDF8',
          padding: '3px 8px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          whiteSpace: 'nowrap'
        }}>
          <span style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            backgroundColor: '#10B981',
            boxShadow: '0 0 6px #10B981'
          }} />
          <span>SIH 2026</span>
        </span>
      )}
    </div>
  );
};

export const ThermivexLogo = PyravexLogo;
