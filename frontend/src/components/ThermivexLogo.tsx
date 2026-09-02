import React from 'react';

interface LogoProps {
  size?: number;
  showSubtitle?: boolean;
}

export const ThermivexLogo: React.FC<LogoProps> = ({ size = 32, showSubtitle = true }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', userSelect: 'none' }}>
      {/* Precision Aerospace Thermal Reticle SVG */}
      <div style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.4))'
      }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Aerospace Cyan Reticle Gradient */}
            <linearGradient id="reticleGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>

            {/* Radiant Thermal Flame Gradient */}
            <linearGradient id="flameGrad" x1="18" y1="6" x2="18" y2="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="35%" stopColor="#F97316" />
              <stop offset="85%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#7F1D1D" />
            </linearGradient>

            {/* Inner High-Heat White Plasma Core */}
            <linearGradient id="corePlasma" x1="18" y1="14" x2="18" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="60%" stopColor="#FEF08A" />
              <stop offset="100%" stopColor="#F97316" />
            </linearGradient>
          </defs>

          {/* Outer Tactical Reticle Frame */}
          <circle
            cx="18"
            cy="18"
            r="16.5"
            stroke="url(#reticleGrad)"
            strokeWidth="1.2"
            strokeOpacity="0.8"
            strokeDasharray="4 2.5"
          />

          {/* Precision Sensor Crosshair Ticks */}
          <line x1="18" y1="0.5" x2="18" y2="4" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="18" y1="32" x2="18" y2="35.5" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="0.5" y1="18" x2="4" y2="18" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="32" y1="18" x2="35.5" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" />

          {/* Inner Geodesic Target Ring */}
          <circle
            cx="18"
            cy="18"
            r="12.5"
            stroke="#1E293B"
            strokeWidth="1"
          />

          {/* Stylized Spaceborne Thermal Apex Flame */}
          <path
            d="M18 5.5 C19.5 10 24.5 13.5 25 18.5 C25.5 23.5 22 27.5 18 29.5 C14 27.5 10.5 23.5 11 18.5 C11.5 13.5 16.5 10 18 5.5 Z"
            fill="url(#flameGrad)"
            stroke="#DC2626"
            strokeWidth="0.8"
          />

          {/* Intense Thermal Combustion Core (White/Yellow Plasma) */}
          <path
            d="M18 13.5 C18.8 16 21.5 18 21.8 21 C22 24 20 26 18 27 C16 26 14 24 14.2 21 C14.5 18 17.2 16 18 13.5 Z"
            fill="url(#corePlasma)"
          />

          {/* Apex Vector Point */}
          <circle cx="18" cy="18" r="1.2" fill="#FFFFFF" />
        </svg>
      </div>

      {/* Typography & Brand Identity */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', lineHeight: 1 }}>
          <span style={{
            fontSize: '15px',
            fontWeight: 900,
            letterSpacing: '0.12em',
            color: '#FFFFFF',
            fontFamily: "'Inter', -apple-system, sans-serif"
          }}>
            THERMI<span style={{
              color: '#38BDF8',
              textShadow: '0 0 12px rgba(56, 189, 248, 0.6)'
            }}>VEX</span>
          </span>

          <span style={{
            fontSize: '9px',
            fontWeight: 800,
            letterSpacing: '0.06em',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            color: '#38BDF8',
            padding: '2px 6px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '3px'
          }}>
            <span style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              boxShadow: '0 0 6px #10B981'
            }} />
            <span>SIH 2026</span>
          </span>
        </div>

        {showSubtitle && (
          <span style={{
            fontSize: '8.5px',
            fontWeight: 700,
            letterSpacing: '0.18em',
            color: '#64748B',
            marginTop: '3px',
            fontFamily: 'monospace'
          }}>
            SPACEBORNE THERMAL CAD
          </span>
        )}
      </div>
    </div>
  );
};
