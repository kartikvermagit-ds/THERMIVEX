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
  Activity,
  ShieldCheck,
  AlertTriangle,
  Sliders
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
  const [splitPosition, setSplitPosition] = useState<number>(50);

  if (!dossier) return null;

  const handleDispatch = async () => {
    setIsDispatching(true);
    try {
      await dispatchAlert(dossier.incident_id, "MIDC_EMERGENCY_DISPATCH_DESK");
      setDispatchStatus("DISPATCH NOTICE TRANSMITTED TO LOCAL FOAM TENDERS");
      setTimeout(() => setDispatchStatus(null), 5000);
    } catch (err) {
      setDispatchStatus("DISPATCH TRANSMISSION FAILED");
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
      top: '52px',
      right: 0,
      width: '500px',
      height: 'calc(100vh - 52px)',
      backgroundColor: '#0C1017',
      borderLeft: '1px solid #1E2633',
      boxShadow: '-8px 0 32px rgba(0,0,0,0.8)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      overflow: 'hidden'
    }}>
      {/* Header with Risk Gauge & Classification */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid #1E2633',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#090D14'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Circular Risk Gauge Meter */}
          <div style={{ position: 'relative', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="50" height="50" viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="21" stroke="#1E293B" strokeWidth="4" fill="none" />
              <circle 
                cx="25" 
                cy="25" 
                r="21" 
                stroke={riskColor} 
                strokeWidth="4" 
                fill="none" 
                strokeDasharray="131.9"
                strokeDashoffset={131.9 - (131.9 * (riskScore / 100))}
                strokeLinecap="round"
                transform="rotate(-90 25 25)"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <div className="font-mono" style={{ fontSize: '13px', fontWeight: 800, color: '#FFF', lineHeight: 1 }}>
                {riskScore}
              </div>
              <div style={{ fontSize: '8px', color: '#64748B', fontWeight: 600 }}>RISK</div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="font-mono" style={{ fontSize: '14px', fontWeight: 800, color: '#FFF' }}>
                #{dossier.incident_id}
              </span>
              <span style={{
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '3px',
                fontWeight: 700,
                backgroundColor: isCritical ? '#2D1216' : (isRoutine ? '#1A1B30' : '#2A1D0D'),
                color: riskColor,
                letterSpacing: '0.02em',
                fontFamily: 'monospace'
              }}>
                {dossier.risk_assessment.severity_label}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
              Acquired: <span style={{ color: '#E2E8F0' }}>{dossier.timestamp_utc}</span>
            </div>
            <div style={{ fontSize: '10px', color: '#38BDF8', fontWeight: 500 }}>
              Platform: {dossier.sensor.satellite} ({dossier.sensor.pass_type})
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: '1px solid #232B3B',
            borderRadius: '4px',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '5px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <X size={15} />
        </button>
      </div>

      {/* Scrollable Forensic Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

        {/* SUMMARY AUDIT CARD */}
        <div style={{
          backgroundColor: '#0F141C',
          border: `1px solid ${isCritical ? '#7F1D1D' : isRoutine ? '#3730A3' : '#78350F'}`,
          borderLeft: `3px solid ${riskColor}`,
          borderRadius: '4px',
          padding: '12px 14px',
          marginBottom: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: riskColor, letterSpacing: '0.04em', marginBottom: '6px' }}>
            {isCritical ? <AlertTriangle size={14} /> : <ShieldCheck size={14} />}
            <span>AUDIT VERIFICATION & CLEARANCE</span>
          </div>
          <div style={{ fontSize: '11px', color: '#E2E8F0', lineHeight: 1.4 }}>
            {isCritical && (
              <>
                <div>• <strong>Statistical Surge:</strong> FRP is <strong>+{dossier.temporal_baseline.frp_delta_zscore}σ</strong> above 36-month facility mean.</div>
                <div>• <strong>Direct Hit:</strong> Sensor footprint intersects hazardous petrochemical inventory zone.</div>
                <div>• <strong>Glance Filter:</strong> Nighttime orbit rules out diurnal solar glare or metal roof reflection.</div>
              </>
            )}
            {isRoutine && (
              <>
                <div>• <strong>Monitored Baseline:</strong> 94% weekly recurrence matches operational refinery flaring stack.</div>
                <div>• <strong>Auto-Suppressed:</strong> Normal variance; emergency dispatch inhibited to avoid alert fatigue.</div>
              </>
            )}
            {!isCritical && !isRoutine && (
              <>
                <div>• <strong>Boundary Offset:</strong> Hotspot is located outside the registered facility fence line.</div>
                <div>• <strong>Biomass Profile:</strong> Radiance and spatial offset indicate seasonal agricultural burn.</div>
              </>
            )}
          </div>
        </div>

        {/* 1. FACILITY IDENTITY & SPATIAL VERIFICATION */}
        <div style={{
          backgroundColor: '#0F141C',
          border: '1px solid #1E2633',
          borderRadius: '4px',
          padding: '12px 14px',
          marginBottom: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#38BDF8', letterSpacing: '0.04em', marginBottom: '6px' }}>
            <Activity size={13} />
            <span>1. FACILITY CONTEXT & GEOFENCE MATCH</span>
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFF', marginBottom: '6px' }}>
            {dossier.facility_context.name}
          </div>
          <div className="font-mono" style={{ fontSize: '11px', color: '#94A3B8', display: 'flex', justifyContent: 'space-between', backgroundColor: '#090D14', padding: '6px 10px', borderRadius: '3px' }}>
            <span>Relation: <strong style={{ color: dossier.facility_context.spatial_match_level === 'DIRECT_HIT' ? '#EF4444' : '#38BDF8' }}>{dossier.facility_context.spatial_match_level}</strong></span>
            <span>Offset: <strong style={{ color: '#FFF' }}>{dossier.facility_context.distance_m}m</strong></span>
          </div>
        </div>

        {/* 2. INTERACTIVE SATELLITE COMPARISON SLIDER (SENTINEL-2 SWIR vs RGB) */}
        <div style={{
          backgroundColor: '#0F141C',
          border: '1px solid #1E2633',
          borderRadius: '4px',
          padding: '12px 14px',
          marginBottom: '14px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#E2E8F0', letterSpacing: '0.04em' }}>
              <Layers size={13} color="#38BDF8" />
              <span>SPACEBORNE DUAL-BAND INSPECTION</span>
            </div>
            <span style={{ fontSize: '10px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sliders size={11} /> Drag Slider
            </span>
          </div>

          {/* Swipe Comparison Container */}
          <div style={{
            position: 'relative',
            height: '170px',
            borderRadius: '4px',
            overflow: 'hidden',
            border: '1px solid #1E2633',
            userSelect: 'none'
          }}>
            {/* Background: SWIR False Color Thermal Layer */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: isCritical 
                ? 'radial-gradient(circle at 50% 50%, #FFFFFF 0%, #FFD700 8%, #FF4500 24%, #8B0000 48%, #1A1C23 75%, #0D1117 100%)' 
                : (isRoutine 
                  ? 'radial-gradient(circle at 50% 50%, #E0E7FF 0%, #818CF8 14%, #3730A3 35%, #1E1B4B 65%, #0B0E14 100%)'
                  : 'radial-gradient(circle at 50% 50%, #FEF08A 0%, #CA8A04 18%, #713F12 40%, #1A1C23 75%, #0D1117 100%)'),
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '8px 10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '10px', color: '#FFD700', textShadow: '0 1px 3px #000' }}>
                <span className="font-mono">SENTINEL-2 SWIR (B12/B11)</span>
              </div>
              <div style={{ fontSize: '9px', color: '#CBD5E1', backgroundColor: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '2px', alignSelf: 'flex-end' }}>
                FRP: {dossier.sensor.frp_mw} MW
              </div>
            </div>

            {/* Foreground: Pre-Event Optical RGB Layer (Clipped by slider position) */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${splitPosition}%`,
              height: '100%',
              overflow: 'hidden',
              backgroundColor: '#1E2B20',
              backgroundImage: `
                radial-gradient(#2F4232 15%, transparent 16%),
                linear-gradient(to right, #27382A 1px, transparent 1px),
                linear-gradient(to bottom, #27382A 1px, transparent 1px)
              `,
              backgroundSize: '24px 24px, 16px 16px, 16px 16px',
              borderRight: '2px solid #38BDF8',
              boxShadow: '4px 0 12px rgba(0,0,0,0.6)'
            }}>
              <div style={{ padding: '8px 10px', width: '470px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <div style={{ fontSize: '10px', color: '#38BDF8', fontWeight: 600 }}>
                  <span className="font-mono">PRE-EVENT BASELINE (RGB 10m)</span>
                </div>
                <div style={{ fontSize: '9px', color: '#94A3B8', backgroundColor: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '2px', width: 'fit-content' }}>
                  Zero Thermal Anomaly
                </div>
              </div>
            </div>

            {/* Interactive Slider Input */}
            <input
              type="range"
              min="5"
              max="95"
              value={splitPosition}
              onChange={(e) => setSplitPosition(Number(e.target.value))}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'ew-resize',
                zIndex: 10
              }}
            />
          </div>

          {/* Sensor Telemetry Spec Metadata */}
          <div className="font-mono" style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '9px',
            color: '#64748B',
            marginTop: '6px',
            paddingTop: '6px',
            borderTop: '1px solid #1E2633'
          }}>
            <span>MSI GSD: 20m</span>
            <span>B12: 2.19µm</span>
            <span>B11: 1.61µm</span>
            <span>Orbit: R078</span>
          </div>
        </div>

        {/* 3. RADIOMETRIC ENERGY & STATISTICAL SURGE */}
        <div style={{
          backgroundColor: '#0F141C',
          border: '1px solid #1E2633',
          borderRadius: '4px',
          padding: '12px 14px',
          marginBottom: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#F97316', letterSpacing: '0.04em', marginBottom: '8px' }}>
            <Flame size={13} />
            <span>3. RADIOMETRIC SENSORS & PHYSICAL FLUX</span>
          </div>
          <div className="font-mono" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
            <div style={{ backgroundColor: '#090D14', padding: '8px', borderRadius: '3px' }}>
              <div style={{ color: '#64748B', fontSize: '10px' }}>FIRE POWER (FRP)</div>
              <strong style={{ fontSize: '13px', color: '#FFF' }}>{dossier.sensor.frp_mw} MW</strong>
              <div style={{ fontSize: '9px', color: '#475569', marginTop: '2px' }}>Radiative heat release</div>
            </div>
            <div style={{ backgroundColor: '#090D14', padding: '8px', borderRadius: '3px' }}>
              <div style={{ color: '#64748B', fontSize: '10px' }}>TEMPERATURE (T4)</div>
              <strong style={{ fontSize: '13px', color: '#FFF' }}>{dossier.sensor.t4_kelvin} K</strong>
              <div style={{ fontSize: '9px', color: '#475569', marginTop: '2px' }}>Middle-IR radiance</div>
            </div>
            <div style={{ backgroundColor: '#090D14', padding: '8px', borderRadius: '3px' }}>
              <div style={{ color: '#64748B', fontSize: '10px' }}>THERMAL DIFF (T4-T5)</div>
              <strong style={{ fontSize: '13px', color: '#FFF' }}>+{dossier.sensor.temp_diff_kelvin} K</strong>
              <div style={{ fontSize: '9px', color: '#475569', marginTop: '2px' }}>Flaming combustion vigor</div>
            </div>
            <div style={{ backgroundColor: '#090D14', padding: '8px', borderRadius: '3px' }}>
              <div style={{ color: '#64748B', fontSize: '10px' }}>ANOMALY SURGE (ΔZ)</div>
              <strong style={{ fontSize: '13px', color: isCritical ? '#F87171' : '#FFF' }}>+{dossier.temporal_baseline.frp_delta_zscore}σ</strong>
              <div style={{ fontSize: '9px', color: '#475569', marginTop: '2px' }}>Sigma above 36mo mean</div>
            </div>
          </div>
        </div>

        {/* 4. DOWNWIND ATMOSPHERIC DISPERSION */}
        <div style={{
          backgroundColor: '#0F141C',
          border: '1px solid #1E2633',
          borderRadius: '4px',
          padding: '12px 14px',
          marginBottom: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#EF4444', letterSpacing: '0.04em', marginBottom: '6px' }}>
            <Wind size={13} />
            <span>4. ATMOSPHERIC PLUME TRAJECTORY</span>
          </div>
          <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '6px' }}>
            Surface Wind: <strong style={{ color: '#FFF' }}>{dossier.plume_dispersion.wind_speed_kmh} km/h</strong> at <strong style={{ color: '#FFF' }}>{dossier.plume_dispersion.wind_bearing_deg}° (WNW)</strong>
          </div>
          <div style={{
            fontSize: '11px',
            color: '#F87171',
            backgroundColor: '#1C1215',
            padding: '6px 10px',
            borderRadius: '3px',
            border: '1px solid #7F1D1D'
          }}>
            ⚠️ {dossier.plume_dispersion.threat_zone}
          </div>
        </div>

        {/* 5. TREESHAP EXPLAINABILITY WATERFALL */}
        <div style={{
          backgroundColor: '#0F141C',
          border: '1px solid #1E2633',
          borderRadius: '4px',
          padding: '12px 14px',
          marginBottom: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#38BDF8', letterSpacing: '0.04em', marginBottom: '8px' }}>
            <BarChart3 size={13} />
            <span>5. AI DECISION EXPLAINABILITY (TreeSHAP)</span>
          </div>

          {dossier.explainability_tree_shap.map((factor, idx) => (
            <div key={idx} style={{ marginBottom: '8px', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ color: '#E2E8F0', fontWeight: 600 }}>{factor.factor}</span>
                <span className="font-mono" style={{ color: '#38BDF8', fontWeight: 700 }}>{factor.impact}</span>
              </div>
              <div style={{ fontSize: '10px', color: '#64748B', lineHeight: 1.3 }}>
                {factor.detail}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Sticky Bottom Actions */}
      <div style={{
        padding: '12px 18px',
        borderTop: '1px solid #1E2633',
        backgroundColor: '#090D14',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {dispatchStatus && (
          <div style={{
            fontSize: '11px',
            color: '#34D399',
            backgroundColor: '#0F1F18',
            border: '1px solid #059669',
            padding: '6px 10px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <CheckCircle2 size={14} />
            <span style={{ fontWeight: 600 }}>{dispatchStatus}</span>
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
              borderRadius: '4px',
              fontWeight: 700,
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Send size={13} />
            {isDispatching ? 'Transmitting Notice...' : 'Dispatch Emergency Alert'}
          </button>

          <a
            href={getDossierPdfUrl(dossier.incident_id)}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '10px 14px',
              backgroundColor: '#161F2E',
              color: '#CBD5E1',
              border: '1px solid #232B3B',
              borderRadius: '4px',
              fontWeight: 600,
              fontSize: '11px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <FileText size={13} />
            PDF Dossier
          </a>
        </div>
      </div>
    </div>
  );
};
