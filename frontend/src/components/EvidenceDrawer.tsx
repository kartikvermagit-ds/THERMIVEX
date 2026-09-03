import React, { useState } from 'react';
import { 
  X, 
  Wind, 
  FileText, 
  Send, 
  CheckCircle2, 
  Flame,
  Layers,
  AlertTriangle,
  Sliders,
  HelpCircle,
  TrendingUp,
  Building2,
  Radio,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { InvestigationDossier } from '../types/incident';
import { dispatchAlert, getDossierPdfUrl } from '../services/api';

interface EvidenceDrawerProps {
  dossier: InvestigationDossier | null;
  onClose: () => void;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({ dossier, onClose }) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'timeline' | 'satellite' | 'facility'>('audit');
  const [showWhyFlagged, setShowWhyFlagged] = useState<boolean>(true);
  const [showAlertModal, setShowAlertModal] = useState<boolean>(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [splitPosition, setSplitPosition] = useState<number>(50);

  if (!dossier) return null;

  const handleSimulateDispatch = async () => {
    setIsDispatching(true);
    try {
      await dispatchAlert(dossier.incident_id, "MIDC_EMERGENCY_DISPATCH_DESK");
      setDispatchStatus("DISPATCH SIMULATION TRANSMITTED TO LOCAL FOAM TENDERS (SIMULATION LOGGED)");
      setTimeout(() => setDispatchStatus(null), 6000);
      setShowAlertModal(false);
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
  const classificationLabel = isCritical 
    ? 'Potential Accidental Industrial Fire' 
    : isRoutine 
      ? 'Routine Persistent Thermal Source' 
      : 'Non-Industrial / Agricultural Burning';

  // Historical Timeline 30-Day Series Data
  const series = dossier.historical_30d_series || [];
  const maxSeriesFrp = Math.max(...series.map(s => s.frp), dossier.sensor.frp_mw, 40);
  const baselineMean = dossier.temporal_baseline.baseline_mean_mw || (isRoutine ? 21.0 : 12.5);

  return (
    <div style={{
      position: 'absolute',
      top: '52px',
      right: 0,
      width: '540px',
      height: 'calc(100vh - 52px)',
      backgroundColor: '#090D14',
      borderLeft: '1px solid #1E2633',
      boxShadow: '-10px 0 40px rgba(0,0,0,0.85)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      overflow: 'hidden'
    }}>
      {/* 1. INCIDENT DETAIL PANEL HEADER */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid #1E2633',
        backgroundColor: '#0C1017',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Circular Risk Score Gauge */}
          <div style={{ position: 'relative', width: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="52" height="52" viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="22" stroke="#1E293B" strokeWidth="4" fill="none" />
              <circle 
                cx="26" 
                cy="26" 
                r="22" 
                stroke={riskColor} 
                strokeWidth="4" 
                fill="none" 
                strokeDasharray="138.2"
                strokeDashoffset={138.2 - (138.2 * (riskScore / 100))}
                strokeLinecap="round"
                transform="rotate(-90 26 26)"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <div className="font-mono" style={{ fontSize: '13px', fontWeight: 800, color: '#FFF', lineHeight: 1 }}>
                {riskScore}
              </div>
              <div style={{ fontSize: '8px', color: '#64748B', fontWeight: 700 }}>/ 100</div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="font-mono" style={{ fontSize: '14px', fontWeight: 900, color: '#FFF' }}>
                INCIDENT #{dossier.incident_id}
              </span>
              <span style={{
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '3px',
                fontWeight: 800,
                backgroundColor: isCritical ? '#2D1216' : (isRoutine ? '#1A1B30' : '#2A1D0D'),
                color: riskColor,
                border: `1px solid ${riskColor}`,
                fontFamily: 'monospace'
              }}>
                {dossier.risk_assessment.severity_label}
              </span>
            </div>

            <div style={{ fontSize: '12px', fontWeight: 700, color: '#F8FAFC', marginTop: '2px' }}>
              🏭 {dossier.facility_context.name}
            </div>

            <div style={{ fontSize: '11px', color: riskColor, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
              <span>●</span>
              <span>{classificationLabel}</span>
              <span style={{ color: '#475569' }}>|</span>
              <span style={{ color: '#94A3B8', fontSize: '10px' }}>Screening Result</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: '#141A24',
            border: '1px solid #232B3B',
            borderRadius: '4px',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '6px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <X size={15} />
        </button>
      </div>

      {/* OPERATIONAL RECOMMENDATION STRIP */}
      <div style={{
        backgroundColor: isCritical ? '#220D12' : isRoutine ? '#0D1424' : '#1F1A0A',
        borderBottom: `1px solid ${isCritical ? '#7F1D1D' : isRoutine ? '#1E293B' : '#78350F'}`,
        padding: '7px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isCritical ? '#F87171' : isRoutine ? '#93C5FD' : '#FBBF24', fontWeight: 700 }}>
          <AlertTriangle size={13} />
          <span>RECOMMENDATION:</span>
          <span style={{ color: '#FFF' }}>
            {dossier.recommendation || (isCritical ? 'GROUND VERIFICATION REQUIRED' : 'MONITOR ONLY')}
          </span>
        </div>

        <span className="font-mono" style={{ color: '#64748B', fontSize: '9px' }}>
          {dossier.timestamp_utc.replace('T', ' ').replace('Z', ' UTC')}
        </span>
      </div>

      {/* QUICK SECTION TAB NAVIGATION */}
      <div style={{
        display: 'flex',
        backgroundColor: '#0C1017',
        borderBottom: '1px solid #1E2633',
        padding: '0 12px'
      }}>
        {[
          { id: 'audit', label: '🔍 AI Evidence & Audit' },
          { id: 'timeline', label: '📈 30-Day History' },
          { id: 'satellite', label: '🛰️ Satellite Imagery' },
          { id: 'facility', label: '🏭 OSM Intelligence' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '9px 12px',
              fontSize: '11px',
              fontWeight: 700,
              color: activeTab === tab.id ? '#38BDF8' : '#94A3B8',
              borderBottom: activeTab === tab.id ? '2px solid #38BDF8' : '2px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* MAIN SCROLLABLE CONTENT BODY */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

        {/* TAB 1: AI EVIDENCE & AUDIT CHECKLIST */}
        {activeTab === 'audit' && (
          <div>
            {/* 2. "WHY WAS THIS FLAGGED?" BUTTON & EXPANDABLE AUDIT */}
            <div style={{
              backgroundColor: '#0F141C',
              border: '1px solid #1E2633',
              borderRadius: '6px',
              marginBottom: '16px',
              overflow: 'hidden'
            }}>
              <div 
                onClick={() => setShowWhyFlagged(!showWhyFlagged)}
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#141A24',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  borderBottom: showWhyFlagged ? '1px solid #1E2633' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38BDF8', fontWeight: 800, fontSize: '11px', letterSpacing: '0.04em' }}>
                  <HelpCircle size={14} />
                  <span>WHY WAS THIS FLAGGED? (AI AUDIT & EXPLAINABILITY)</span>
                </div>
                {showWhyFlagged ? <ChevronUp size={14} color="#64748B" /> : <ChevronDown size={14} color="#64748B" />}
              </div>

              {showWhyFlagged && (
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid #1E2633' }}>
                    <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>OVERALL SCREENING SUSPICION:</span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: isCritical ? '#F87171' : isRoutine ? '#818CF8' : '#FBBF24',
                      backgroundColor: isCritical ? '#2D1216' : '#1A1B30',
                      padding: '2px 8px',
                      borderRadius: '3px',
                      border: `1px solid ${riskColor}`
                    }}>
                      {dossier.why_flagged_audit?.overall_suspicion || (isCritical ? 'HIGH (ACCIDENTAL CANDIDATE)' : 'LOW (ROUTINE)')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(dossier.why_flagged_audit?.checkpoints || [
                      { label: 'High Thermal Intensity', status: isCritical, detail: `Observed ${dossier.sensor.frp_mw} MW (Sector mean: ${baselineMean} MW)` },
                      { label: 'Sudden Baseline Deviation', status: isCritical, detail: `+${dossier.temporal_baseline.frp_delta_zscore}σ surge above 36-month registry` },
                      { label: 'Industrial Facility Correlation', status: true, detail: `${dossier.facility_context.spatial_match_level} (${dossier.facility_context.distance_m}m to boundary)` },
                      { label: 'Abnormal Temporal Activity', status: true, detail: 'Nighttime acquisition excludes diurnal solar roof glint' },
                      { label: 'Satellite Radiometer Confidence', status: true, detail: `High calibrated confidence (${dossier.sensor.satellite} 375m)` },
                      { label: 'Persistent Source Pattern', status: !isRoutine, detail: isRoutine ? 'High recurrence (94%) matching routine operational flaring' : 'Low historical recurrence (<10%) indicating accidental fire' }
                    ]).map((cp, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        fontSize: '11px',
                        backgroundColor: '#090D14',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        border: '1px solid #141A24'
                      }}>
                        <span style={{ color: cp.status ? '#10B981' : '#64748B', fontWeight: 800, marginTop: '1px' }}>
                          {cp.status ? '✓' : '•'}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: '#E2E8F0', fontWeight: 600 }}>{cp.label}</div>
                          <div style={{ color: '#64748B', fontSize: '10px', marginTop: '1px' }}>{cp.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* KEY SATELLITE RADIOMETRICS GRID */}
            <div style={{
              backgroundColor: '#0F141C',
              border: '1px solid #1E2633',
              borderRadius: '6px',
              padding: '12px 14px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: '#F97316', marginBottom: '10px' }}>
                <Flame size={13} />
                <span>SATELLITE EVIDENCE & SENSOR RADIOMETRY</span>
              </div>

              <div className="font-mono" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '11px' }}>
                <div style={{ backgroundColor: '#090D14', padding: '8px', borderRadius: '4px', border: '1px solid #141A24' }}>
                  <div style={{ color: '#64748B', fontSize: '9px' }}>SENSOR / PASS</div>
                  <strong style={{ color: '#FFF', fontSize: '11px' }}>{dossier.sensor.satellite}</strong>
                  <div style={{ color: '#38BDF8', fontSize: '9px', marginTop: '2px' }}>{dossier.sensor.pass_type}</div>
                </div>

                <div style={{ backgroundColor: '#090D14', padding: '8px', borderRadius: '4px', border: '1px solid #141A24' }}>
                  <div style={{ color: '#64748B', fontSize: '9px' }}>CURRENT FRP</div>
                  <strong style={{ color: '#FFF', fontSize: '12px' }}>{dossier.sensor.frp_mw} MW</strong>
                  <div style={{ color: '#94A3B8', fontSize: '9px', marginTop: '2px' }}>Radiative Power</div>
                </div>

                <div style={{ backgroundColor: '#090D14', padding: '8px', borderRadius: '4px', border: '1px solid #141A24' }}>
                  <div style={{ color: '#64748B', fontSize: '9px' }}>ANOMALY (ΔZ)</div>
                  <strong style={{ color: isCritical ? '#F87171' : '#FFF', fontSize: '12px' }}>+{dossier.temporal_baseline.frp_delta_zscore}σ</strong>
                  <div style={{ color: '#94A3B8', fontSize: '9px', marginTop: '2px' }}>Standard Devs</div>
                </div>

                <div style={{ backgroundColor: '#090D14', padding: '8px', borderRadius: '4px', border: '1px solid #141A24' }}>
                  <div style={{ color: '#64748B', fontSize: '9px' }}>BRIGHTNESS T4</div>
                  <strong style={{ color: '#CBD5E1', fontSize: '11px' }}>{dossier.sensor.t4_kelvin} K</strong>
                  <div style={{ color: '#64748B', fontSize: '9px', marginTop: '2px' }}>Middle-IR (3.9µm)</div>
                </div>

                <div style={{ backgroundColor: '#090D14', padding: '8px', borderRadius: '4px', border: '1px solid #141A24' }}>
                  <div style={{ color: '#64748B', fontSize: '9px' }}>THERMAL DIFF (T4-T5)</div>
                  <strong style={{ color: '#CBD5E1', fontSize: '11px' }}>+{dossier.sensor.temp_diff_kelvin} K</strong>
                  <div style={{ color: '#64748B', fontSize: '9px', marginTop: '2px' }}>Combustion vigor</div>
                </div>

                <div style={{ backgroundColor: '#090D14', padding: '8px', borderRadius: '4px', border: '1px solid #141A24' }}>
                  <div style={{ color: '#64748B', fontSize: '9px' }}>CONFIDENCE</div>
                  <strong style={{ color: '#10B981', fontSize: '11px' }}>{dossier.ai_classification.confidence}%</strong>
                  <div style={{ color: '#64748B', fontSize: '9px', marginTop: '2px' }}>Radiometer quality</div>
                </div>
              </div>
            </div>

            {/* 6. ESTIMATED IMPACT ZONE */}
            <div style={{
              backgroundColor: '#0F141C',
              border: '1px solid #1E2633',
              borderRadius: '6px',
              padding: '12px 14px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: '#38BDF8', marginBottom: '8px' }}>
                <Wind size={13} />
                <span>ESTIMATED IMPACT ZONE (ATMOSPHERIC DISPERSION)</span>
              </div>
              <div style={{ fontSize: '11px', color: '#CBD5E1', marginBottom: '6px', lineHeight: 1.4 }}>
                Surface Wind: <strong style={{ color: '#FFF' }}>{dossier.plume_dispersion.wind_speed_kmh} km/h</strong> at bearing <strong style={{ color: '#FFF' }}>{dossier.plume_dispersion.wind_bearing_deg}° (WNW ──► ESE)</strong>
              </div>
              <div style={{
                fontSize: '11px',
                color: '#F87171',
                backgroundColor: '#1A1214',
                padding: '8px 10px',
                borderRadius: '4px',
                border: '1px solid #4A161A',
                lineHeight: 1.4
              }}>
                <div style={{ fontWeight: 700, marginBottom: '2px' }}>
                  ⚠️ {dossier.plume_dispersion.threat_zone}
                </div>
                <div style={{ fontSize: '10px', color: '#94A3B8' }}>
                  Note: Screening model based on spaceborne radiometry and wind vectors. Ground sensors required to confirm exact chemical concentrations.
                </div>
              </div>
            </div>

            {/* TREESHAP FEATURE ATTRIBUTIONS */}
            <div style={{
              backgroundColor: '#0F141C',
              border: '1px solid #1E2633',
              borderRadius: '6px',
              padding: '12px 14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: '#A78BFA', marginBottom: '8px' }}>
                <Radio size={13} />
                <span>TreeSHAP MACHINE LEARNING DECISION FACTORS</span>
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
        )}

        {/* TAB 2: HISTORICAL 30-DAY TIMELINE GRAPH */}
        {activeTab === 'timeline' && (
          <div>
            <div style={{
              backgroundColor: '#0F141C',
              border: '1px solid #1E2633',
              borderRadius: '6px',
              padding: '14px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: '#38BDF8' }}>
                  <TrendingUp size={14} />
                  <span>30-DAY THERMAL RADIATIVE POWER (FRP) HISTORY</span>
                </div>
                <div className="font-mono" style={{ fontSize: '10px', color: '#94A3B8' }}>
                  36-mo Baseline: <strong style={{ color: '#38BDF8' }}>{baselineMean} MW</strong>
                </div>
              </div>

              {/* Visual SVG Timeline Bar/Curve Chart */}
              <div style={{
                position: 'relative',
                height: '180px',
                backgroundColor: '#05070B',
                borderRadius: '4px',
                border: '1px solid #141A24',
                padding: '10px',
                display: 'flex',
                alignItems: 'flex-end',
                gap: '2px',
                overflowX: 'auto'
              }}>
                {/* Horizontal Baseline Guideline */}
                <div style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: `${(baselineMean / maxSeriesFrp) * 150 + 15}px`,
                  borderTop: '1px dashed #38BDF8',
                  pointerEvents: 'none',
                  zIndex: 2,
                  display: 'flex',
                  justifyContent: 'flex-end',
                  paddingRight: '8px'
                }}>
                  <span style={{ fontSize: '9px', color: '#38BDF8', backgroundColor: '#05070B', padding: '0 4px' }}>
                    Historical Baseline ({baselineMean} MW)
                  </span>
                </div>

                {/* Bars for Day 1 to 30 */}
                {series.map((pt) => {
                  const barHeight = Math.max(8, (pt.frp / maxSeriesFrp) * 140);
                  const isToday = pt.day === 30;
                  return (
                    <div 
                      key={pt.day}
                      title={`Day ${pt.day}: ${pt.frp} MW`}
                      style={{
                        flex: 1,
                        height: `${barHeight}px`,
                        backgroundColor: isToday ? (isCritical ? '#EF4444' : '#818CF8') : '#1E293B',
                        borderRadius: '2px 2px 0 0',
                        position: 'relative',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                    >
                      {isToday && (
                        <div style={{
                          position: 'absolute',
                          top: '-20px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: '10px',
                          color: '#EF4444',
                          fontWeight: 800,
                          whiteSpace: 'nowrap'
                        }}>
                          🔥 {pt.frp} MW
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Axis Labels */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#64748B', marginTop: '6px', fontFamily: 'monospace' }}>
                <span>Day 1 (30 Days Ago)</span>
                <span>Day 15</span>
                <span style={{ color: isCritical ? '#F87171' : '#38BDF8', fontWeight: 700 }}>Day 30 (Current Satellite Pass)</span>
              </div>

              <div style={{
                marginTop: '14px',
                padding: '10px',
                backgroundColor: '#141A24',
                borderRadius: '4px',
                borderLeft: `3px solid ${riskColor}`,
                fontSize: '11px',
                color: '#CBD5E1',
                lineHeight: 1.4
              }}>
                <strong>Forensic Conclusion:</strong>{' '}
                {isCritical 
                  ? `Current thermal output (${dossier.sensor.frp_mw} MW) is unprecedentedly elevated (+${dossier.temporal_baseline.frp_delta_zscore}σ) compared to the facility's 36-month baseline (${baselineMean} MW). Confirms accidental combustion surge rather than scheduled operations.`
                  : isRoutine
                    ? `Observed thermal energy matches the 52-week recurring baseline (${baselineMean} MW ± 3 MW) with 94% periodicity. Confirms routine refinery flaring operation.`
                    : `Thermal anomaly detected in rural biomass zone with low historical recurrence. Consistent with seasonal agricultural crop stubble clearing.`}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SATELLITE EVIDENCE VIEW (DUAL-BAND SLIDER) */}
        {activeTab === 'satellite' && (
          <div>
            <div style={{
              backgroundColor: '#0F141C',
              border: '1px solid #1E2633',
              borderRadius: '6px',
              padding: '14px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: '#38BDF8' }}>
                  <Layers size={14} />
                  <span>PRE-EVENT OPTICAL (RGB) vs CURRENT THERMAL (SWIR)</span>
                </div>
                <span style={{ fontSize: '10px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sliders size={11} /> Drag to Compare
                </span>
              </div>

              {/* Swipe Comparison Box */}
              <div style={{
                position: 'relative',
                height: '210px',
                borderRadius: '4px',
                overflow: 'hidden',
                border: '1px solid #1E2633',
                userSelect: 'none'
              }}>
                {/* Background: SWIR False Color Current Thermal Pass */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: isCritical 
                    ? 'radial-gradient(circle at 50% 50%, #FFFFFF 0%, #FFD700 10%, #FF4500 28%, #8B0000 52%, #1A1C23 78%, #0D1117 100%)' 
                    : (isRoutine 
                      ? 'radial-gradient(circle at 50% 50%, #E0E7FF 0%, #818CF8 14%, #3730A3 35%, #1E1B4B 65%, #0B0E14 100%)'
                      : 'radial-gradient(circle at 50% 50%, #FEF08A 0%, #CA8A04 18%, #713F12 40%, #1A1C23 75%, #0D1117 100%)'),
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '10px 14px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '10px', color: '#FFD700', fontWeight: 700 }}>
                    <span className="font-mono">CURRENT: SENTINEL-2 SWIR 2.19µm (🔥 ABNORMAL THERMAL)</span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#FFF', backgroundColor: 'rgba(0,0,0,0.7)', padding: '3px 8px', borderRadius: '3px', alignSelf: 'flex-end' }}>
                    Saturated Hotspot: {dossier.sensor.frp_mw} MW
                  </div>
                </div>

                {/* Foreground: Pre-Event Optical Baseline Layer */}
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
                  boxShadow: '4px 0 16px rgba(0,0,0,0.7)'
                }}>
                  <div style={{ padding: '10px 14px', width: '510px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                    <div style={{ fontSize: '10px', color: '#38BDF8', fontWeight: 700 }}>
                      <span className="font-mono">BEFORE: OPTICAL RGB BASELINE (NORMAL FACILITY)</span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#94A3B8', backgroundColor: 'rgba(0,0,0,0.7)', padding: '3px 8px', borderRadius: '3px', width: 'fit-content' }}>
                      Baseline State (Zero Active Heat)
                    </div>
                  </div>
                </div>

                {/* Drag Slider Range Input */}
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

              <div className="font-mono" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#64748B', marginTop: '8px' }}>
                <span>MSI Spatial Resolution: 20m</span>
                <span>SWIR Band 12: 2.19µm</span>
                <span>Radiometer: VIIRS 375m I-Band</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: OSM FACILITY INTELLIGENCE & INFRASTRUCTURE */}
        {activeTab === 'facility' && (
          <div>
            <div style={{
              backgroundColor: '#0F141C',
              border: '1px solid #1E2633',
              borderRadius: '6px',
              padding: '14px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: '#38BDF8', marginBottom: '10px' }}>
                <Building2 size={14} />
                <span>5. FACILITY INTELLIGENCE (OSM ONTOLOGY & GIS)</span>
              </div>

              <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFF', marginBottom: '4px' }}>
                {dossier.facility_context.name}
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '10px' }}>
                Hazard Classification: <strong style={{ color: '#F87171' }}>Tier-5 (High Volatility Petrochemicals)</strong>
              </div>

              <div className="font-mono" style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#090D14', padding: '8px 12px', borderRadius: '4px', border: '1px solid #141A24', fontSize: '11px', marginBottom: '14px' }}>
                <span>Hotspot Distance: <strong style={{ color: '#FFF' }}>{dossier.facility_context.distance_m} m</strong></span>
                <span>Facility Boundary: <strong style={{ color: dossier.facility_context.spatial_match_level === 'DIRECT_HIT' ? '#EF4444' : '#10B981' }}>{dossier.facility_context.spatial_match_level}</strong></span>
              </div>

              <div style={{ fontSize: '11px', fontWeight: 700, color: '#E2E8F0', marginBottom: '8px' }}>
                NEARBY CRITICAL RECEPTORS & INFRASTRUCTURE:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(dossier.nearby_infrastructure || [
                  { icon: '🏠', label: 'Residential Settlement', distance: '1.2 km', note: 'Downwind evacuation corridor' },
                  { icon: '🛣️', label: 'National Highway Corridor', distance: '650 m', note: 'Major transport corridor' },
                  { icon: '🏭', label: 'Adjacent Industrial Units', distance: '300 m', note: 'Within thermal radiation buffer' },
                  { icon: '🚒', label: 'District Fire Station', distance: '4.8 km', note: 'Estimated response arrival: 8-10 min' }
                ]).map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#090D14',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #141A24',
                    fontSize: '11px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{item.icon}</span>
                      <span style={{ color: '#E2E8F0', fontWeight: 600 }}>{item.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="font-mono" style={{ color: '#38BDF8', fontWeight: 700 }}>{item.distance}</span>
                      <span style={{ color: '#64748B', fontSize: '9px' }}>({item.note})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* STICKY BOTTOM ACTIONS */}
      <div style={{
        padding: '12px 18px',
        borderTop: '1px solid #1E2633',
        backgroundColor: '#0C1017',
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
          {/* 7. GENERATE ALERT SIMULATION BUTTON */}
          <button
            onClick={() => setShowAlertModal(true)}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: isCritical ? '#DC2626' : '#2563EB',
              color: '#FFF',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 800,
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.1s ease'
            }}
          >
            <AlertTriangle size={14} />
            <span>GENERATE ALERT SIMULATION</span>
          </button>

          {/* 8. AUTO-GENERATED TACTICAL REPORT PDF BUTTON */}
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
              fontWeight: 700,
              fontSize: '11px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <FileText size={13} color="#38BDF8" />
            <span>Tactical PDF Dossier</span>
          </a>
        </div>
      </div>

      {/* 7. ALERT SIMULATION MODAL */}
      {showAlertModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            width: '480px',
            backgroundColor: '#0C1017',
            border: '1px solid #7F1D1D',
            borderRadius: '8px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '14px 18px',
              backgroundColor: '#1C0D10',
              borderBottom: '1px solid #7F1D1D',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F87171', fontWeight: 800, fontSize: '13px' }}>
                <AlertTriangle size={16} />
                <span>🚨 INCIDENT ALERT GENERATED (SIMULATION MODE)</span>
              </div>
              <button 
                onClick={() => setShowAlertModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={15} />
              </button>
            </div>

            <div style={{ padding: '18px 20px' }}>
              <div style={{
                backgroundColor: '#080B10',
                padding: '12px 14px',
                borderRadius: '6px',
                border: '1px solid #1E2633',
                marginBottom: '14px',
                fontSize: '11px',
                lineHeight: 1.6
              }}>
                <div><strong>PRIORITY:</strong> <span style={{ color: '#EF4444', fontWeight: 800 }}>CRITICAL (RISK {riskScore}/100)</span></div>
                <div><strong>FACILITY:</strong> <span style={{ color: '#FFF' }}>{dossier.facility_context.name}</span></div>
                <div><strong>COORDINATES:</strong> <span className="font-mono" style={{ color: '#38BDF8' }}>{dossier.coordinates[1]}° N, {dossier.coordinates[0]}° E</span></div>
                <div><strong>FRP OBSERVATION:</strong> <span style={{ color: '#FFF' }}>{dossier.sensor.frp_mw} MW (+{dossier.temporal_baseline.frp_delta_zscore}σ anomaly)</span></div>
              </div>

              <div style={{ fontSize: '11px', fontWeight: 700, color: '#E2E8F0', marginBottom: '6px' }}>
                RECOMMENDED OPERATIONAL ACTIONS:
              </div>
              <ul style={{ fontSize: '11px', color: '#94A3B8', paddingLeft: '18px', lineHeight: 1.6, marginBottom: '16px' }}>
                <li>• Immediate ground verification by industrial safety unit</li>
                <li>• Fire tender readiness & foam response assessment</li>
                <li>• Notification to District Disaster Management Authority (DDMA)</li>
              </ul>

              <div style={{ fontSize: '10px', color: '#64748B', backgroundColor: '#090D14', padding: '6px 10px', borderRadius: '4px', border: '1px solid #141A24', marginBottom: '16px' }}>
                ℹ️ <strong>Hackathon Simulation Mode:</strong> Alert notifications are logged in the platform audit database and not transmitted to public emergency 112/101 dispatchers.
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <a
                  href={getDossierPdfUrl(dossier.incident_id)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    flex: 1,
                    padding: '9px',
                    backgroundColor: '#161F2E',
                    color: '#CBD5E1',
                    border: '1px solid #232B3B',
                    borderRadius: '4px',
                    fontWeight: 700,
                    fontSize: '11px',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px'
                  }}
                >
                  <FileText size={13} color="#38BDF8" />
                  <span>GENERATE PDF</span>
                </a>

                <button
                  onClick={handleSimulateDispatch}
                  disabled={isDispatching}
                  style={{
                    flex: 1,
                    padding: '9px',
                    backgroundColor: '#DC2626',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: 800,
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Send size={13} />
                  <span>{isDispatching ? 'SENDING...' : 'SEND ALERT SIMULATION'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
