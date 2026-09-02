import React, { useState } from 'react';
import { 
  X, 
  Wind, 
  FileText, 
  Send, 
  CheckCircle2, 
  BarChart3
} from 'lucide-react';
import type { InvestigationDossier } from '../types/incident';
import { dispatchAlert, getDossierPdfUrl } from '../services/api';

interface EvidenceDrawerProps {
  dossier: InvestigationDossier | null;
  onClose: () => void;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({ dossier, onClose }) => {
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);

  if (!dossier) return null;

  const handleDispatch = async () => {
    setIsDispatching(true);
    try {
      await dispatchAlert(dossier.incident_id, "MIDC_EMERGENCY_DISPATCH_DESK");
      setDispatchStatus("DISPATCHED TO LOCAL TENDERS");
      setTimeout(() => setDispatchStatus(null), 5000);
    } catch (err) {
      setDispatchStatus("DISPATCH FAILED");
    } finally {
      setIsDispatching(false);
    }
  };

  const isCritical = dossier.risk_assessment.composite_risk_score >= 70;
  const isRoutine = dossier.ai_classification.label === 'PERSISTENT_OPERATIONAL_SOURCE';

  return (
    <div style={{
      position: 'absolute',
      top: '56px',
      right: 0,
      width: '460px',
      height: 'calc(100vh - 56px)',
      backgroundColor: 'var(--bg-surface)',
      borderLeft: '1px solid var(--border-subtle)',
      boxShadow: '-4px 0 24px rgba(0,0,0,0.6)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'var(--bg-space)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="font-mono" style={{ fontSize: '14px', fontWeight: 700, color: '#FFF' }}>
              INCIDENT #{dossier.incident_id}
            </span>
            <span style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: 700,
              backgroundColor: isCritical ? '#3B1218' : (isRoutine ? '#1E1B4B' : '#2E220D'),
              border: `1px solid ${isCritical ? '#EF4444' : (isRoutine ? '#818CF8' : '#F59E0B')}`,
              color: isCritical ? '#EF4444' : (isRoutine ? '#818CF8' : '#F59E0B')
            }}>
              RISK: {dossier.risk_assessment.composite_risk_score}/100
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Detected: {dossier.timestamp_utc} ({dossier.sensor.satellite} {dossier.sensor.pass_type})
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X size={18} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

        {/* 1. FACILITY IDENTITY & SPATIAL MATCH */}
        <div style={{
          backgroundColor: 'var(--bg-space)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '12px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: '0.05em', marginBottom: '8px' }}>
            1. FACILITY IDENTITY & SPATIAL MATCH
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFF', marginBottom: '6px' }}>
            {dossier.facility_context.name}
          </div>
          <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Relation: <strong style={{ color: 'var(--text-primary)' }}>{dossier.facility_context.spatial_match_level}</strong></span>
            <span>Distance: <strong style={{ color: 'var(--text-primary)' }}>{dossier.facility_context.distance_m}m</strong></span>
          </div>
        </div>

        {/* 2. RADIOMETRICS & ANOMALY SURGE */}
        <div style={{
          backgroundColor: 'var(--bg-space)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '12px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--threat-high)', letterSpacing: '0.05em', marginBottom: '8px' }}>
            2. RADIOMETRICS & ANOMALY SURGE
          </div>
          <div className="font-mono" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
            <div>FRP: <strong style={{ color: '#FFF' }}>{dossier.sensor.frp_mw} MW</strong></div>
            <div>Temp (T4): <strong style={{ color: '#FFF' }}>{dossier.sensor.t4_kelvin} K</strong></div>
            <div>Differential (T4-T5): <strong style={{ color: '#FFF' }}>+{dossier.sensor.temp_diff_kelvin} K</strong></div>
            <div>Anomaly Surge (ΔZ): <strong style={{ color: isCritical ? 'var(--threat-critical)' : '#FFF' }}>+{dossier.temporal_baseline.frp_delta_zscore}σ</strong></div>
            <div>Historical 52w Recurrence: <strong style={{ color: '#FFF' }}>{(dossier.temporal_baseline.persistence_index_52w * 100).toFixed(0)}%</strong></div>
            <div>Classification: <strong style={{ color: 'var(--accent-cyan)' }}>{dossier.ai_classification.label}</strong></div>
          </div>
        </div>

        {/* 3. DOWNWIND ATMOSPHERIC DISPERSION */}
        <div style={{
          backgroundColor: 'var(--bg-space)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#EF4444', letterSpacing: '0.05em', marginBottom: '6px' }}>
            <Wind size={14} />
            <span>3. DOWNWIND ATMOSPHERIC DISPERSION</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Surface Wind: <strong style={{ color: '#FFF' }}>{dossier.plume_dispersion.wind_speed_kmh} km/h</strong> at <strong style={{ color: '#FFF' }}>{dossier.plume_dispersion.wind_bearing_deg}° (WNW)</strong>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--threat-high)' }}>
            ⚠️ {dossier.plume_dispersion.threat_zone}
          </div>
        </div>

        {/* TREESHAP ATTRIBUTIONS */}
        <div style={{
          backgroundColor: 'var(--bg-space)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: '0.05em', marginBottom: '10px' }}>
            <BarChart3 size={14} />
            <span>AI EXPLAINABILITY (TreeSHAP ATTRIBUTION)</span>
          </div>

          {dossier.explainability_tree_shap.map((factor, idx) => (
            <div key={idx} style={{ marginBottom: '8px', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{factor.factor}</span>
                <span className="font-mono" style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{factor.impact}</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                {factor.detail}
              </div>
            </div>
          ))}
        </div>

        {/* SATELLITE VERIFICATION */}
        <div style={{
          backgroundColor: 'var(--bg-space)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '12px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em', marginBottom: '8px' }}>
            SATELLITE VERIFICATION (SENTINEL-2 SWIR FALSE COLOR)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{
              height: '90px',
              backgroundColor: '#0F1A24',
              border: '1px solid #1E293B',
              borderRadius: '4px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              color: 'var(--text-muted)'
            }}>
              <span>PRE-EVENT BASELINE</span>
              <strong style={{ color: 'var(--accent-cyan)', marginTop: '4px' }}>RGB Normal</strong>
            </div>
            <div style={{
              height: '90px',
              backgroundColor: '#271115',
              border: '1px solid #7F1D1D',
              borderRadius: '4px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              color: 'var(--threat-critical)'
            }}>
              <span>POST-EVENT TILE</span>
              <strong style={{ marginTop: '4px' }}>B12-B11 SWIR Thermal</strong>
            </div>
          </div>
        </div>

      </div>

      <div style={{
        padding: '14px 18px',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-space)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {dispatchStatus && (
          <div style={{
            fontSize: '11px',
            color: 'var(--threat-safe)',
            backgroundColor: '#0F291E',
            border: '1px solid var(--threat-safe)',
            padding: '6px 10px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <CheckCircle2 size={14} />
            <span>{dispatchStatus}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleDispatch}
            disabled={isDispatching}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: isCritical ? '#DC2626' : '#2563EB',
              color: '#FFF',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Send size={14} />
            {isDispatching ? 'Transmitting...' : 'Dispatch Emergency Alert'}
          </button>

          <a
            href={getDossierPdfUrl(dossier.incident_id)}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--bg-surface-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '12px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FileText size={14} />
            PDF Dossier
          </a>
        </div>
      </div>
    </div>
  );
};
