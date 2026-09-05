import React from 'react';
import { X, Satellite, Building2, Flame, ShieldCheck } from 'lucide-react';

interface SystemGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemGuideModal: React.FC<SystemGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    }}>
      <div style={{
        width: '680px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        boxShadow: '0 16px 48px rgba(0,0,0,0.8)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 22px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(7, 9, 14, 0.8)'
        }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFF' }}>
              PYRAVEX SYSTEM EXPLAINER
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              How spaceborne sensors & AI classify industrial fires vs. routine heat
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* 4-Step Visual Workflow */}
        <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* STEP 1 */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#0F2937',
              border: '1px solid var(--accent-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Satellite size={18} color="var(--accent-cyan)" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFF', marginBottom: '3px' }}>
                1. Spaceborne Satellite Detection (NASA FIRMS NRT)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                VIIRS/MODIS radiometers record middle infrared (3.9 µm) thermal radiation. If brightness temperature surges above dynamic terrestrial thresholds, a 375m hotspot pixel is registered with its Fire Radiative Power (FRP).
              </div>
            </div>
          </div>

          {/* STEP 2 */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#1E293B',
              border: '1px solid #3B82F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Building2 size={18} color="#3B82F6" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFF', marginBottom: '3px' }}>
                2. Semantic Geofencing (OpenStreetMap Infrastructure)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                The hotspot centroid is evaluated against indexed industrial boundaries. A spatial match level is computed: <strong>Direct Hit (0m)</strong>, <strong>Perimeter Buffer (&lt;350m)</strong>, or <strong>Vicinity (&lt;1000m)</strong>.
              </div>
            </div>
          </div>

          {/* STEP 3 */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#2E220D',
              border: '1px solid var(--threat-high)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Flame size={18} color="var(--threat-high)" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFF', marginBottom: '3px' }}>
                3. Historical Baseline & Persistence Index (THR Engine)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                The engine checks 36 months of thermal history. A petrochemical flaring stack shows steady recurrence ($PI \ge 0.90$) and is classified as <strong>Routine Heat</strong>. A sudden new fire with zero history generates a huge statistical surge ($\Delta Z &gt; +5\sigma$) and triggers an <strong>Accidental Fire Alert</strong>.
              </div>
            </div>
          </div>

          {/* STEP 4 */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#271115',
              border: '1px solid var(--threat-critical)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ShieldCheck size={18} color="var(--threat-critical)" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFF', marginBottom: '3px' }}>
                4. Downwind Plume & Explainable Tactical Dossier
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Couples local wind vectors to project toxic smoke dispersion cones. TreeSHAP feature attributions show responders why the alert was raised, with one-click tactical PDF dossier generation.
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 22px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'rgba(7, 9, 14, 0.8)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              backgroundColor: 'var(--accent-cyan)',
              color: '#000',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
