import React from 'react';
import { Layers, Flame, Wind, Building2, Square } from 'lucide-react';

interface LayerControlProps {
  layers: {
    hotspots: boolean;
    plumes: boolean;
    facilities: boolean;
    footprints: boolean;
  };
  onToggleLayer: (layerName: keyof LayerControlProps['layers']) => void;
}

export const LayerControl: React.FC<LayerControlProps> = ({ layers, onToggleLayer }) => {
  return (
    <div style={{
      position: 'absolute',
      top: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(15, 20, 28, 0.85)',
      backdropFilter: 'blur(8px)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '24px',
      padding: '4px 8px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      zIndex: 400,
      boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 6px', color: 'var(--text-muted)' }}>
        <Layers size={14} />
      </div>

      <button
        onClick={() => onToggleLayer('hotspots')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 10px',
          borderRadius: '16px',
          border: layers.hotspots ? '1px solid var(--threat-critical)' : '1px solid transparent',
          backgroundColor: layers.hotspots ? '#271115' : 'transparent',
          color: layers.hotspots ? 'var(--threat-critical)' : 'var(--text-muted)',
          fontSize: '11px',
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        <Flame size={12} />
        Hotspots
      </button>

      <button
        onClick={() => onToggleLayer('plumes')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 10px',
          borderRadius: '16px',
          border: layers.plumes ? '1px solid var(--threat-high)' : '1px solid transparent',
          backgroundColor: layers.plumes ? '#341D10' : 'transparent',
          color: layers.plumes ? 'var(--threat-high)' : 'var(--text-muted)',
          fontSize: '11px',
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        <Wind size={12} />
        Plume Cones
      </button>

      <button
        onClick={() => onToggleLayer('facilities')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 10px',
          borderRadius: '16px',
          border: layers.facilities ? '1px solid var(--accent-cyan)' : '1px solid transparent',
          backgroundColor: layers.facilities ? '#0F2937' : 'transparent',
          color: layers.facilities ? 'var(--accent-cyan)' : 'var(--text-muted)',
          fontSize: '11px',
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        <Building2 size={12} />
        OSM Industry
      </button>

      <button
        onClick={() => onToggleLayer('footprints')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 10px',
          borderRadius: '16px',
          border: layers.footprints ? '1px solid #94A3B8' : '1px solid transparent',
          backgroundColor: layers.footprints ? '#1E293B' : 'transparent',
          color: layers.footprints ? '#94A3B8' : 'var(--text-muted)',
          fontSize: '11px',
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        <Square size={12} />
        375m Footprint
      </button>
    </div>
  );
};
