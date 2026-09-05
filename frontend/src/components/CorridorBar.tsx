import React from 'react';
import { MapPin } from 'lucide-react';

interface CorridorBarProps {
  onFlyTo: (coords: [number, number], zoom?: number) => void;
}

const CORRIDORS = [
  { name: 'All India', coords: [78.9, 22.5] as [number, number], zoom: 5 },
  { name: 'Dahej PCPIR', coords: [72.5831, 21.6842] as [number, number], zoom: 14.5 },
  { name: 'Jamnagar Refinery', coords: [69.8324, 22.3412] as [number, number], zoom: 14.5 },
  { name: 'Manesar Corridor', coords: [76.9248, 28.3614] as [number, number], zoom: 14 },
  { name: 'Ludhiana Belt', coords: [75.9124, 30.8712] as [number, number], zoom: 13.5 },
  { name: 'Mumbai Chembur', coords: [72.8941, 19.0125] as [number, number], zoom: 14 }
];

export const CorridorBar: React.FC<CorridorBarProps> = ({ onFlyTo }) => {
  return (
    <div style={{
      position: 'absolute',
      top: '64px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(15, 20, 28, 0.92)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(56, 189, 248, 0.25)',
      borderRadius: '24px',
      padding: '4px 10px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      zIndex: 400,
      boxShadow: '0 6px 20px rgba(0,0,0,0.55)'
    }}>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: '4px', fontWeight: 600 }}>
        <MapPin size={13} color="var(--accent-cyan)" />
        <span>Corridor:</span>
      </span>

      {CORRIDORS.map((c) => (
        <button
          key={c.name}
          onClick={() => onFlyTo(c.coords, c.zoom)}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '14px',
            color: 'var(--text-secondary)',
            fontSize: '11.5px',
            fontWeight: 600,
            padding: '4px 10px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1E293B';
            e.currentTarget.style.color = '#FFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
};
