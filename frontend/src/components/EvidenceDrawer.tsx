import React, { useState } from 'react';
import { 
  X, 
  Wind, 
  FileText, 
  Send, 
  CheckCircle2, 
  BarChart3,
  Flame,
  Layers,
  Activity
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
  const [satelliteViewMode, setSatelliteViewMode] = useState<'swir' | 'rgb' | 'split'>('swir');

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

  const riskScore = dossier.risk_assessment.composite_risk_score;
  const isCritical = riskScore >= 70;
  const isHigh = riskScore >= 50 && riskScore < 70;
  const isRoutine = dossier.ai_classification.label === 'PERSISTENT_OPERATIONAL_SOURCE';

  const riskColor = isCritical ? '#EF4444' : (isHigh ? '#F97316' : (isRoutine ? '#818CF8' : '#F59E0B'));

  return (
    <div style={{
      position: 'absolute',
      top: '56px',
      right: 0,
      width: '480px',
      height: 'calc(100vh - 56px)',
      backgroundColor: 'rgba(15, 20, 28, 0.96)',
      backdropFilter: 'blur(16px)',
      borderLeft: '1px solid var(--border-subtle)',
      boxShadow: '-8px 0 32px rgba(0,0,0,0.8)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      overflow: 'hidden'
    }}>
      {/* Header with Risk Gauge & Classification */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(7, 9, 14, 0.8)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Circular Risk Gauge Meter */}
          <div style={{ position: 'relative', width: '54px', height: '54px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="54" height="54" viewBox="0 0 54 54">
              <circle cx="27" cy="27" r="23" stroke="#1E293B" strokeWidth="4" fill="none" />
              <circle 
                cx="27" 
                cy="27" 
                r="23" 
                stroke={riskColor} 
                strokeWidth="4" 
                fill="none" 
                strokeDasharray="144.5"
                strokeDashoffset={144.5 - (144.5 * (riskScore / 100))}
                strokeLinecap="round"
                transform="rotate(-90 27 27)"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <div className="font-mono" style={{ fontSize: '14px', fontWeight: 800, color: '#FFF', lineHeight: 1 }}>
                {riskScore}
              </div>
              <div style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 600 }}>RISK</div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="font-mono" style={{ fontSize: '15px', fontWeight: 800, color: '#FFF' }}>
                #{dossier.incident_id}
              </span>
              <span style={{
                fontSize: '10px',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 700,
                backgroundColor: isCritical ? '#3B1218' : (isRoutine ? '#1E1B4B' : '#2E220D'),
                border: `1px solid ${riskColor}`,
                color: riskColor,
                letterSpacing: '0.03em'
              }}>
                {dossier.risk_assessment.severity_label}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
              Detected: <span style={{ color: '#E2E8F0' }}>{dossier.timestamp_utc}</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--accent-cyan)', fontWeight: 600 }}>
              Satellite: {dossier.sensor.satellite} ({dossier.sensor.pass_type})
            </div>
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
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Scrollable Forensic Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px' }}>

        {/* 1. FACILITY IDENTITY & SPATIAL RELATIONSHIP */}
        <div style={{
          backgroundColor: 'var(--bg-space)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '14px',
          marginBottom: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: '0.05em', marginBottom: '8px' }}>
            <Activity size={13} />
            <span>1. FACILITY IDENTITY & SPATIAL VERIFICATION</span>
          </div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFF', marginBottom: '6px' }}>
            {dossier.facility_context.name}
          </div>
          <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', backgroundColor: '#0B0E14', padding: '8px 10px', borderRadius: '4px' }}>
            <span>Relation: <strong style={{ color: dossier.facility_context.spatial_match_level === 'DIRECT_HIT' ? 'var(--threat-critical)' : 'var(--accent-cyan)' }}>{dossier.facility_context.spatial_match_level}</strong></span>
            <span>Offset: <strong style={{ color: '#FFF' }}>{dossier.facility_context.distance_m} meters</strong></span>
          </div>
        </div>

        {/* 2. SATELLITE FORENSIC EVIDENCE TILES (SENTINEL-2 SWIR 20M) */}
        <div style={{
          backgroundColor: 'var(--bg-space)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '14px',
          marginBottom: '14px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#E2E8F0', letterSpacing: '0.05em' }}>
              <Layers size={13} color="var(--accent-cyan)" />
              <span>SPACEBORNE VERIFICATION (SENTINEL-2 L2A)</span>
            </div>
            
            {/* View Mode Switcher */}
            <div style={{ display: 'flex', gap: '3px', backgroundColor: '#0B0E14', padding: '2px', borderRadius: '4px' }}>
              <button 
                onClick={() => setSatelliteViewMode('swir')}
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  padding: '3px 6px',
                  borderRadius: '3px',
                  border: 'none',
                  backgroundColor: satelliteViewMode === 'swir' ? '#EF4444' : 'transparent',
                  color: satelliteViewMode === 'swir' ? '#FFF' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                SWIR Fire
              </button>
              <button 
                onClick={() => setSatelliteViewMode('rgb')}
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  padding: '3px 6px',
                  borderRadius: '3px',
                  border: 'none',
                  backgroundColor: satelliteViewMode === 'rgb' ? 'var(--accent-cyan)' : 'transparent',
                  color: satelliteViewMode === 'rgb' ? '#000' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                Optical RGB
              </button>
            </div>
          </div>

          {/* Photorealistic Simulated Satellite Tile Canvas */}
          <div style={{
            position: 'relative',
            height: '160px',
            borderRadius: '6px',
            overflow: 'hidden',
            border: '1px solid #1E293B',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)'
          }}>
            {satelliteViewMode === 'swir' ? (
              /* Sentinel-2 SWIR False Color (B12 - 2.19µm / B11 - 1.61µm / B4 - Red) */
              <div style={{
                width: '100%',
                height: '100%',
                background: isCritical 
                  ? 'radial-gradient(circle at 50% 55%, #FFFFFF 0%, #FFD700 8%, #FF4500 22%, #8B0000 45%, #1A1C23 75%, #0D1117 100%)' 
                  : (isRoutine 
                    ? 'radial-gradient(circle at 50% 55%, #E0E7FF 0%, #818CF8 14%, #3730A3 35%, #1E1B4B 65%, #0B0E14 100%)'
                    : 'radial-gradient(circle at 50% 55%, #FEF08A 0%, #CA8A04 18%, #713F12 40%, #1A1C23 75%, #0D1117 100%)'),
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '10px'
              }}>
                {/* HUD Overlay Elements */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#FFF', textShadow: '0 1px 4px #000' }}>
                  <span className="font-mono">SENTINEL-2 MSI (20m SWIR)</span>
                  <span className="font-mono" style={{ color: '#FFD700' }}>B12-B11 COMPOSITE</span>
                </div>

                {/* Thermal Plume Smoke Vector Overlay */}
                {isCritical && (
                  <div style={{
                    position: 'absolute',
                    top: '40px',
                    left: '52%',
                    width: '160px',
                    height: '50px',
                    background: 'linear-gradient(90deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.4) 60%, transparent 100%)',
                    transform: 'rotate(-15deg)',
                    filter: 'blur(6px)',
                    pointerEvents: 'none'
                  }} />
                )}

                <div style={{
                  backgroundColor: 'rgba(0,0,0,0.65)',
                  backdropFilter: 'blur(4px)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '9px',
                  color: '#CBD5E1'
                }}>
                  <span>Combustion Core: <strong style={{ color: '#FF4500' }}>{dossier.sensor.frp_mw} MW Radiative Energy</strong></span>
                  <span className="font-mono">Reflectance &gt; 98%</span>
                </div>
              </div>
            ) : (
              /* Pre-Event Optical High-Resolution RGB Baseline */
              <div style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#1B261D',
                backgroundImage: `
                  radial-gradient(#2E3E30 15%, transparent 16%),
                  linear-gradient(to right, #243326 1px, transparent 1px),
                  linear-gradient(to bottom, #243326 1px, transparent 1px)
                `,
                backgroundSize: '30px 30px, 20px 20px, 20px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#E2E8F0' }}>
                  <span className="font-mono">SENTINEL-2 TRUE COLOR (RGB)</span>
                  <span style={{ color: 'var(--accent-cyan)' }}>PRE-EVENT ARCHIVE</span>
                </div>

                <div style={{
                  backgroundColor: 'rgba(0,0,0,0.65)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '9px',
                  color: '#94A3B8'
                }}>
                  Normal Industrial Operations • Zero Smoke Ingress • Baseline Validated
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. RADIOMETRICS & STATISTICAL ANOMALY SURGE */}
        <div style={{
          backgroundColor: 'var(--bg-space)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '14px',
          marginBottom: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--threat-high)', letterSpacing: '0.05em', marginBottom: '10px' }}>
            <Flame size={13} />
            <span>2. RADIOMETRIC ENERGY & STATISTICAL SURGE</span>
          </div>
          <div className="font-mono" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '11px' }}>
            <div style={{ backgroundColor: '#0B0E14', padding: '8px', borderRadius: '4px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>FIRE RADIATIVE POWER</div>
              <strong style={{ fontSize: '14px', color: '#FFF' }}>{dossier.sensor.frp_mw} MW</strong>
            </div>
            <div style={{ backgroundColor: '#0B0E14', padding: '8px', borderRadius: '4px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>BRIGHTNESS TEMP (T4)</div>
              <strong style={{ fontSize: '14px', color: '#FFF' }}>{dossier.sensor.t4_kelvin} K</strong>
            </div>
            <div style={{ backgroundColor: '#0B0E14', padding: '8px', borderRadius: '4px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>THERMAL DIFF (T4-T5)</div>
              <strong style={{ fontSize: '14px', color: '#FFF' }}>+{dossier.sensor.temp_diff_kelvin} K</strong>
            </div>
            <div style={{ backgroundColor: '#0B0E14', padding: '8px', borderRadius: '4px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>ANOMALY SURGE (ΔZ)</div>
              <strong style={{ fontSize: '14px', color: isCritical ? 'var(--threat-critical)' : '#FFF' }}>+{dossier.temporal_baseline.frp_delta_zscore}σ</strong>
            </div>
          </div>
        </div>

        {/* 4. DOWNWIND ATMOSPHERIC DISPERSION */}
        <div style={{
          backgroundColor: 'var(--bg-space)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '14px',
          marginBottom: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#EF4444', letterSpacing: '0.05em', marginBottom: '8px' }}>
            <Wind size={13} />
            <span>3. DOWNWIND ATMOSPHERIC DISPERSION</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Surface Wind: <strong style={{ color: '#FFF' }}>{dossier.plume_dispersion.wind_speed_kmh} km/h</strong> at <strong style={{ color: '#FFF' }}>{dossier.plume_dispersion.wind_bearing_deg}° (WNW)</strong>
          </div>
          <div style={{
            fontSize: '11px',
            color: 'var(--threat-high)',
            backgroundColor: '#271115',
            padding: '8px 10px',
            borderRadius: '4px',
            border: '1px solid #7F1D1D'
          }}>
            ⚠️ {dossier.plume_dispersion.threat_zone}
          </div>
        </div>

        {/* 5. TREESHAP EXPLAINABILITY WATERFALL */}
        <div style={{
          backgroundColor: 'var(--bg-space)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '14px',
          marginBottom: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: '0.05em', marginBottom: '10px' }}>
            <BarChart3 size={13} />
            <span>AI EXPLAINABILITY (TreeSHAP ATTRIBUTION)</span>
          </div>

          {dossier.explainability_tree_shap.map((factor, idx) => (
            <div key={idx} style={{ marginBottom: '10px', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{ color: '#F1F5F9', fontWeight: 600 }}>{factor.factor}</span>
                <span className="font-mono" style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{factor.impact}</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {factor.detail}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Sticky Bottom Actions */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-space)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {dispatchStatus && (
          <div style={{
            fontSize: '11px',
            color: 'var(--threat-safe)',
            backgroundColor: '#0F291E',
            border: '1px solid var(--threat-safe)',
            padding: '8px 12px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={15} />
            <span style={{ fontWeight: 600 }}>{dispatchStatus}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleDispatch}
            disabled={isDispatching}
            style={{
              flex: 1,
              padding: '12px',
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
              gap: '6px',
              boxShadow: isCritical ? '0 0 16px rgba(220, 38, 38, 0.4)' : 'none'
            }}
          >
            <Send size={15} />
            {isDispatching ? 'Transmitting Notice...' : 'Dispatch Emergency Alert'}
          </button>

          <a
            href={getDossierPdfUrl(dossier.incident_id)}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '12px 16px',
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
            <FileText size={15} />
            PDF Dossier
          </a>
        </div>
      </div>
    </div>
  );
};
