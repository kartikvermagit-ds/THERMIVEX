import React from 'react';
import { Layers, Flame, Wind, Building2, Square, Sparkles, Disc } from 'lucide-react';

interface LayerControlProps {
  layers: {
    hotspots: boolean;
    plumes: boolean;
    facilities: boolean;
    footprints: boolean;
    thermalEvents?: boolean;
    rawObservations?: boolean;
  };
  onToggleLayer: (layerName: keyof LayerControlProps['layers']) => void;
}

export const LayerControl: React.FC<LayerControlProps> = ({ layers, onToggleLayer }) => {
  return (
    <div style={{
      position: 'absolute',
      top: '18px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(15, 20, 28, 0.94)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(56, 189, 248, 0.25)',
      borderRadius: '28px',
      padding: '5px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      zIndex: 400,
      boxShadow: '0 6px 24px rgba(0,0,0,0.65)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px', color: 'var(--text-muted)' }}>
        <Layers size={16} />
      </div>

      <button
        onClick={() => onToggleLayer('thermalEvents')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 12px',
          borderRadius: '16px',
          border: layers.thermalEvents !== false ? '1px solid #F59E0B' : '1px solid transparent',
          backgroundColor: layers.thermalEvents !== false ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
          color: layers.thermalEvents !== false ? '#FBBF24' : 'var(--text-muted)',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer'
        }}
      >
        <Sparkles size={14} />
        Thermal Events
      </button>

      <button
        onClick={() => onToggleLayer('rawObservations')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 12px',
          borderRadius: '16px',
          border: layers.rawObservations !== false ? '1px solid #FCD34D' : '1px solid transparent',
          backgroundColor: layers.rawObservations !== false ? 'rgba(253, 230, 138, 0.16)' : 'transparent',
          color: layers.rawObservations !== false ? '#FDE68A' : 'var(--text-muted)',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer'
        }}
      >
        <Disc size={14} />
        Sensor Dots
      </button>

      <button
        onClick={() => onToggleLayer('hotspots')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 12px',
          borderRadius: '16px',
          border: layers.hotspots ? '1px solid var(--threat-critical)' : '1px solid transparent',
          backgroundColor: layers.hotspots ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
          color: layers.hotspots ? '#F87171' : 'var(--text-muted)',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer'
        }}
      >
        <Flame size={14} />
        Hotspots
      </button>

      <button
        onClick={() => onToggleLayer('plumes')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 12px',
          borderRadius: '16px',
          border: layers.plumes ? '1px solid var(--threat-high)' : '1px solid transparent',
          backgroundColor: layers.plumes ? 'rgba(249, 115, 22, 0.2)' : 'transparent',
          color: layers.plumes ? '#FB923C' : 'var(--text-muted)',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer'
        }}
      >
        <Wind size={14} />
        Plume Cones
      </button>

      <button
        onClick={() => onToggleLayer('facilities')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 12px',
          borderRadius: '16px',
          border: layers.facilities ? '1px solid var(--accent-cyan)' : '1px solid transparent',
          backgroundColor: layers.facilities ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
          color: layers.facilities ? '#38BDF8' : 'var(--text-muted)',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer'
        }}
      >
        <Building2 size={14} />
        OSM Industry
      </button>

      <button
        onClick={() => onToggleLayer('footprints')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 12px',
          borderRadius: '16px',
          border: layers.footprints ? '1px solid #94A3B8' : '1px solid transparent',
          backgroundColor: layers.footprints ? 'rgba(148, 163, 184, 0.2)' : 'transparent',
          color: layers.footprints ? '#CBD5E1' : 'var(--text-muted)',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer'
        }}
      >
        <Square size={14} />
        375m Footprint
      </button>
    </div>
  );
};
