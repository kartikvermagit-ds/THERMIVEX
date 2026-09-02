import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

export const MapLegend: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <div style={{
      position: 'absolute',
      bottom: '72px',
      left: '20px',
      backgroundColor: 'rgba(15, 20, 28, 0.92)',
      backdropFilter: 'blur(10px)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '8px',
      padding: isExpanded ? '12px 14px' : '6px 10px',
      zIndex: 400,
      boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
      fontSize: '11px',
      color: '#E2E8F0',
      minWidth: isExpanded ? '240px' : 'auto',
      transition: 'all 0.2s ease'
    }}>
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          cursor: 'pointer',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
          <Info size={13} />
          <span>TACTICAL MAP GUIDE</span>
        </div>
        {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </div>

      {isExpanded && (
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', transform: 'rotate(45deg)', background: '#FFF', border: '2px solid #EF4444', boxShadow: '0 0 6px #EF4444' }} />
            <div>
              <strong style={{ color: '#EF4444' }}>Accidental Industrial Fire</strong>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>FRP spike inside plant, zero historical heat</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#1E1B4B', border: '2px solid #818CF8', boxShadow: '0 0 6px #818CF8' }} />
            <div>
              <strong style={{ color: '#818CF8' }}>Routine Persistent Heat</strong>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Flaring stack/kiln with weekly baseline</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#2E220D', border: '2px solid #F59E0B' }} />
            <div>
              <strong style={{ color: '#F59E0B' }}>Non-Industrial / Agricultural</strong>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Crop stubble fire outside boundary (&gt;500m)</div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #1E293B', paddingTop: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '14px', height: '8px', border: '1.5px dashed #06B6D4', backgroundColor: 'rgba(6,182,212,0.15)' }} />
              <span style={{ fontSize: '10px' }}><strong>Cyan Box:</strong> OSM Industrial Facility</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '14px', height: '8px', border: '1px solid #EF4444', backgroundColor: 'rgba(239,68,68,0.25)' }} />
              <span style={{ fontSize: '10px' }}><strong>Red Cone:</strong> Downwind Toxic Hazard Plume</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '14px', height: '8px', border: '1.5px dashed #94A3B8', backgroundColor: 'rgba(255,255,255,0.05)' }} />
              <span style={{ fontSize: '10px' }}><strong>White Box:</strong> 375m VIIRS Ground Pixel</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
