import React from 'react';
import { 
  X, 
  Flame, 
  Satellite, 
  Clock, 
  Maximize2, 
  ShieldAlert, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Radio
} from 'lucide-react';
import type { ThermalEvent, EventTimelineResponse, EventTimelineItem } from '../types/event';

interface ThermalEventDrawerProps {
  event: ThermalEvent | null;
  timeline: EventTimelineResponse | null;
  isLoadingTimeline?: boolean;
  onClose: () => void;
  onInspectCorrelatedIncident?: (facilityName?: string) => void;
}

export const ThermalEventDrawer: React.FC<ThermalEventDrawerProps> = ({
  event,
  timeline,
  isLoadingTimeline = false,
  onClose,
  onInspectCorrelatedIncident
}) => {
  if (!event) return null;

  // Parse cluster quality metadata safely
  let qualityMeta: any = {};
  if (event.cluster_quality) {
    try {
      qualityMeta = JSON.parse(event.cluster_quality);
    } catch (e) {
      qualityMeta = {};
    }
  }

  const platforms: string[] = qualityMeta.platforms || [];
  const compactness: string = qualityMeta.spatial_compactness || (event.spatial_extent_km2 <= 0.4 ? 'HIGH' : 'MEDIUM');
  const coherence: string = qualityMeta.temporal_coherence || (event.duration_minutes <= 45 ? 'HIGH' : 'MEDIUM');
  const multiPlatform: boolean = qualityMeta.multi_platform_support ?? (platforms.length >= 2);

  // Formatting helpers
  const formatTimeUTC = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }) + ' UTC';
    } catch {
      return isoStr;
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'ESCALATING': return '#EF4444';
      case 'FORMING': return '#F59E0B';
      case 'PERSISTING': return '#818CF8';
      case 'COOLING': return '#06B6D4';
      case 'INITIAL': return '#10B981';
      default: return '#94A3B8';
    }
  };

  const timelineItems: EventTimelineItem[] = timeline?.timeline || [];

  return (
    <div style={{
      position: 'absolute',
      top: '52px',
      right: 0,
      width: '520px',
      height: 'calc(100vh - 52px)',
      backgroundColor: '#090D14',
      borderLeft: '1px solid #1E2633',
      boxShadow: '-12px 0 40px rgba(0,0,0,0.85)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      overflow: 'hidden'
    }}>
      {/* 1. Header Bar */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid #1E2633',
        backgroundColor: '#0C1017',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid #F59E0B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#F59E0B'
          }}>
            <Flame size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', color: '#F59E0B' }}>
                SPATIO-TEMPORAL THERMAL EVENT
              </span>
              <span style={{
                fontSize: '9px',
                padding: '1px 6px',
                borderRadius: '4px',
                backgroundColor: event.is_demo ? '#1F2937' : '#042F2E',
                color: event.is_demo ? '#9CA3AF' : '#14B8A6',
                border: '1px solid #374151',
                fontFamily: 'monospace'
              }}>
                {event.is_demo ? 'SYNTHETIC DEMO' : 'NASA FIRMS NRT'}
              </span>
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.01em', fontFamily: 'monospace' }}>
              {event.id}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#64748B',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#F8FAFC')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
        >
          <X size={18} />
        </button>
      </div>

      {/* 2. Scrollable Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Event Status Banner */}
        <div style={{
          backgroundColor: '#0F1623',
          border: '1px solid #1E293B',
          borderRadius: '8px',
          padding: '12px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B', display: 'inline-block', boxShadow: '0 0 8px #F59E0B' }}></span>
              <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em', color: '#F59E0B' }}>
                {event.status === 'CANDIDATE' ? 'ACTIVE CANDIDATE EVENT' : event.status}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#CBD5E1', fontWeight: 600 }}>
              {event.title}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: '#64748B' }}>FINGERPRINT</div>
            <div style={{ fontSize: '10px', color: '#94A3B8', fontFamily: 'monospace' }}>
              {event.event_fingerprint.substring(0, 10)}...
            </div>
          </div>
        </div>

        {/* Core Metrics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px'
        }}>
          <div style={{ backgroundColor: '#0C1017', border: '1px solid #1E2633', borderRadius: '8px', padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748B', fontSize: '10px', fontWeight: 700, marginBottom: '4px' }}>
              <Radio size={12} />
              <span>OBSERVATIONS</span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#F8FAFC', fontFamily: 'monospace' }}>
              {event.observation_count}
            </div>
            <div style={{ fontSize: '9px', color: '#64748B' }}>Spaceborne detections</div>
          </div>

          <div style={{ backgroundColor: '#0C1017', border: '1px solid #1E2633', borderRadius: '8px', padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748B', fontSize: '10px', fontWeight: 700, marginBottom: '4px' }}>
              <Clock size={12} />
              <span>DURATION</span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#F8FAFC', fontFamily: 'monospace' }}>
              {Math.round(event.duration_minutes)} <span style={{ fontSize: '11px', fontWeight: 500, color: '#94A3B8' }}>min</span>
            </div>
            <div style={{ fontSize: '9px', color: '#64748B' }}>Temporal persistence</div>
          </div>

          <div style={{ backgroundColor: '#0C1017', border: '1px solid #1E2633', borderRadius: '8px', padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#F59E0B', fontSize: '10px', fontWeight: 700, marginBottom: '4px' }}>
              <Flame size={12} />
              <span>PEAK FRP</span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#F59E0B', fontFamily: 'monospace' }}>
              {event.frp_peak_mw} <span style={{ fontSize: '11px', fontWeight: 500, color: '#FCD34D' }}>MW</span>
            </div>
            <div style={{ fontSize: '9px', color: '#64748B' }}>Max radiative power</div>
          </div>

          <div style={{ backgroundColor: '#0C1017', border: '1px solid #1E2633', borderRadius: '8px', padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748B', fontSize: '10px', fontWeight: 700, marginBottom: '4px' }}>
              <TrendingUp size={12} />
              <span>TOTAL FRP</span>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#CBD5E1', fontFamily: 'monospace' }}>
              {event.frp_total_mw} <span style={{ fontSize: '10px', fontWeight: 500 }}>MW</span>
            </div>
            <div style={{ fontSize: '9px', color: '#64748B' }}>Mean: {event.frp_mean_mw} MW</div>
          </div>

          <div style={{ gridColumn: 'span 2', backgroundColor: '#0C1017', border: '1px solid #1E2633', borderRadius: '8px', padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#38BDF8', fontSize: '10px', fontWeight: 700, marginBottom: '4px' }}>
              <Maximize2 size={12} />
              <span>OBSERVATION SPATIAL EXTENT</span>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#38BDF8', fontFamily: 'monospace' }}>
              {event.spatial_extent_km2 > 0 ? `${event.spatial_extent_km2} km²` : 'Point Detection (0.0 km²)'}
            </div>
            <div style={{ fontSize: '9px', color: '#94A3B8' }}>
              Equidistant metric convex hull spread (not ground fire footprint)
            </div>
          </div>
        </div>

        {/* Satellite Support & Sensor Evidence */}
        <div style={{ backgroundColor: '#0C1017', border: '1px solid #1E2633', borderRadius: '8px', padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Satellite size={14} style={{ color: '#06B6D4' }} />
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', color: '#06B6D4' }}>
              SATELLITE & SENSOR EVIDENCE
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
            {platforms.length > 0 ? (
              platforms.map((p, idx) => (
                <span key={idx} style={{
                  backgroundColor: '#0F2937',
                  border: '1px solid #06B6D4',
                  color: '#38BDF8',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600
                }}>
                  {p}
                </span>
              ))
            ) : (
              <span style={{ backgroundColor: '#1E293B', color: '#CBD5E1', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                VIIRS · NOAA-20 / Suomi-NPP
              </span>
            )}

            {multiPlatform && (
              <span style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10B981',
                color: '#34D399',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <CheckCircle2 size={12} />
                Multi-Platform Corroboration
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px', color: '#94A3B8' }}>
            <div>Peak Sensor Brightness: <strong style={{ color: '#F8FAFC' }}>{event.max_brightness_kelvin} K</strong></div>
            <div>Algorithm: <strong style={{ color: '#38BDF8', fontFamily: 'monospace' }}>{event.clustering_algorithm_version}</strong></div>
            <div>First Observed: <strong style={{ color: '#CBD5E1' }}>{formatTimeUTC(event.first_observed_at)}</strong></div>
            <div>Last Observed: <strong style={{ color: '#CBD5E1' }}>{formatTimeUTC(event.last_observed_at)}</strong></div>
          </div>
        </div>

        {/* Chronological Event Evolution Timeline */}
        <div style={{ backgroundColor: '#0C1017', border: '1px solid #1E2633', borderRadius: '8px', padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} style={{ color: '#F59E0B' }} />
              <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', color: '#F59E0B' }}>
                CHRONOLOGICAL EVOLUTION TIMELINE
              </span>
            </div>
            <span style={{ fontSize: '10px', color: '#64748B', fontFamily: 'monospace' }}>
              {timelineItems.length} STEPS
            </span>
          </div>

          {isLoadingTimeline ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#64748B', fontSize: '11px' }}>
              Reconstructing spatio-temporal observation trajectory...
            </div>
          ) : timelineItems.length === 0 ? (
            <div style={{ padding: '12px', textAlign: 'center', color: '#64748B', fontSize: '11px' }}>
              Single snapshot observation at {formatTimeUTC(event.first_observed_at)}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {timelineItems.map((item, idx) => {
                const isPeak = item.frp === event.frp_peak_mw;
                const stageColor = getStageColor(item.stage);

                return (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: isPeak ? 'rgba(245, 158, 11, 0.08)' : '#080C13',
                    border: isPeak ? '1px solid #F59E0B' : '1px solid #141A24',
                    fontSize: '11px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontFamily: 'monospace',
                        fontSize: '10px',
                        color: '#64748B',
                        width: '18px'
                      }}>
                        #{item.step}
                      </span>
                      <span style={{ fontFamily: 'monospace', color: '#E2E8F0', fontWeight: 700 }}>
                        {formatTimeUTC(item.observed_at)}
                      </span>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: '3px',
                        backgroundColor: `${stageColor}20`,
                        color: stageColor,
                        border: `1px solid ${stageColor}`
                      }}>
                        {item.stage}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'monospace' }}>
                      <span style={{ color: '#94A3B8', fontSize: '10px' }}>
                        {item.satellite}
                      </span>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 800, color: isPeak ? '#F59E0B' : '#F8FAFC' }}>
                          {item.frp} MW
                        </span>
                        {isPeak && (
                          <span style={{ fontSize: '9px', color: '#F59E0B', marginLeft: '4px', fontWeight: 800 }}>
                            ← PEAK
                          </span>
                        )}
                      </div>

                      {item.frp_delta_percent !== null && item.frp_delta_percent !== undefined && item.step > 1 && (
                        <span style={{
                          fontSize: '10px',
                          color: item.frp_delta_percent >= 0 ? '#EF4444' : '#10B981',
                          fontWeight: 700
                        }}>
                          {item.frp_delta_percent >= 0 ? `↑ ${item.frp_delta_percent}%` : `↓ ${Math.abs(item.frp_delta_percent)}%`}
                        </span>
                      )}

                      {item.time_since_previous_minutes !== null && item.time_since_previous_minutes !== undefined && (
                        <span style={{ fontSize: '9px', color: '#64748B' }}>
                          +{Math.round(item.time_since_previous_minutes)}m
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cluster Quality & Coherence */}
        <div style={{
          backgroundColor: '#0C1017',
          border: '1px solid #1E2633',
          borderRadius: '8px',
          padding: '12px 14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <ShieldAlert size={14} style={{ color: '#818CF8' }} />
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', color: '#818CF8' }}>
              CLUSTER QUALITY & COHERENCE
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '12px', fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', backgroundColor: '#06090E', borderRadius: '4px' }}>
              <span style={{ color: '#64748B' }}>Spatial Compactness:</span>
              <strong style={{ color: compactness === 'HIGH' ? '#10B981' : '#F59E0B' }}>{compactness}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', backgroundColor: '#06090E', borderRadius: '4px' }}>
              <span style={{ color: '#64748B' }}>Temporal Coherence:</span>
              <strong style={{ color: coherence === 'HIGH' ? '#10B981' : '#F59E0B' }}>{coherence}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', backgroundColor: '#06090E', borderRadius: '4px' }}>
              <span style={{ color: '#64748B' }}>Multi-Platform Support:</span>
              <strong style={{ color: multiPlatform ? '#10B981' : '#94A3B8' }}>{multiPlatform ? 'YES' : 'NO'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', backgroundColor: '#06090E', borderRadius: '4px' }}>
              <span style={{ color: '#64748B' }}>Cluster Coherence:</span>
              <strong style={{ color: '#818CF8' }}>{event.cluster_confidence} / 100</strong>
            </div>
          </div>

          {/* Scientific Disclaimer */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '6px',
            padding: '8px 10px',
            fontSize: '10px',
            lineHeight: '1.4',
            color: '#FDE68A'
          }}>
            <AlertCircle size={14} style={{ color: '#F59E0B', flexShrink: 0, marginTop: '1px' }} />
            <span>
              <strong>Scientific Notice:</strong> Cluster Coherence score reflects sensor spatial-temporal cohesion only. It is <strong>NOT</strong> confirmed fire probability or blast risk.
            </span>
          </div>
        </div>

        {/* Spatial Coordinates & Tangent Origin */}
        <div style={{
          backgroundColor: '#06090E',
          border: '1px solid #141A24',
          borderRadius: '6px',
          padding: '10px 12px',
          fontSize: '11px',
          color: '#64748B',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div>FRP-Weighted Centroid:</div>
            <strong style={{ color: '#CBD5E1', fontFamily: 'monospace' }}>
              {event.centroid_latitude.toFixed(4)}° N, {event.centroid_longitude.toFixed(4)}° E
            </strong>
          </div>
          {event.peak_latitude && event.peak_longitude && (
            <div style={{ textAlign: 'right' }}>
              <div>Physical Peak Coordinate:</div>
              <strong style={{ color: '#F59E0B', fontFamily: 'monospace' }}>
                {event.peak_latitude.toFixed(4)}° N, {event.peak_longitude.toFixed(4)}° E
              </strong>
            </div>
          )}
        </div>

        {/* Bridge Action: Inspect Correlated Incident Dossier */}
        {onInspectCorrelatedIncident && (
          <button
            onClick={() => onInspectCorrelatedIncident(event.title)}
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              border: '1px solid #06B6D4',
              backgroundColor: '#0F2937',
              color: '#38BDF8',
              fontWeight: 700,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#164E63')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0F2937')}
          >
            <span>Inspect Correlated Incident Dossier (TreeSHAP & Blast Zone)</span>
            <ExternalLink size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
