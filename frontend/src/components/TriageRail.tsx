import React, { useState } from 'react';
import { Search, Navigation, AlertTriangle, ShieldCheck, Flame, ChevronRight, Sparkles, RefreshCw } from 'lucide-react';
import type { IncidentFeature } from '../types/incident';
import type { ThermalEvent } from '../types/event';

interface TriageRailProps {
  incidents: IncidentFeature[];
  thermalEvents?: ThermalEvent[];
  selectedIncidentId: string | null;
  selectedThermalEventId?: string | null;
  onSelectIncident: (id: string) => void;
  onSelectThermalEvent?: (id: string) => void;
  onLocateIncident: (coords: [number, number]) => void;
  onLocateThermalEvent?: (coords: [number, number]) => void;
  onTriggerClustering?: () => void;
  isClusteringLoading?: boolean;
}

export const TriageRail: React.FC<TriageRailProps> = ({
  incidents,
  thermalEvents = [],
  selectedIncidentId,
  selectedThermalEventId = null,
  onSelectIncident,
  onSelectThermalEvent,
  onLocateIncident,
  onLocateThermalEvent,
  onTriggerClustering,
  isClusteringLoading = false
}) => {
  const [activeTab, setActiveTab] = useState<'incidents' | 'events'>('incidents');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [eventFilter, setEventFilter] = useState<'ALL' | 'MULTI' | 'HIGH_FRP' | 'SINGLE'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Deduplicate by facility name + date/time so duplicate scenario triggers don't clutter the queue
  const uniqueIncidents: IncidentFeature[] = [];
  const seenKeys = new Set<string>();

  for (const inc of incidents) {
    const key = `${inc.properties.facility_name}_${inc.properties.acq_time}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueIncidents.push(inc);
    }
  }

  const filteredIncidents = uniqueIncidents.filter((inc) => {
    // Severity filter
    if (filterSeverity === 'CRITICAL' && inc.properties.severity !== 'CRITICAL') return false;
    if (filterSeverity === 'HIGH' && inc.properties.severity !== 'HIGH') return false;
    if (filterSeverity === 'ROUTINE' && inc.properties.classification !== 'PERSISTENT_OPERATIONAL_SOURCE') return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (inc.properties.facility_name || '').toLowerCase();
      const id = inc.properties.id.toLowerCase();
      const cls = inc.properties.classification.toLowerCase();
      return name.includes(q) || id.includes(q) || cls.includes(q);
    }
    return true;
  });

  const filteredEvents = thermalEvents.filter((ev) => {
    if (eventFilter === 'MULTI' && ev.observation_count < 2) return false;
    if (eventFilter === 'HIGH_FRP' && ev.frp_peak_mw < 50.0) return false;
    if (eventFilter === 'SINGLE' && ev.observation_count !== 1) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const id = ev.id.toLowerCase();
      const title = ev.title.toLowerCase();
      const status = ev.status.toLowerCase();
      return id.includes(q) || title.includes(q) || status.includes(q);
    }
    return true;
  });

  return (
    <aside style={{
      width: '380px',
      height: 'calc(100vh - 56px)',
      backgroundColor: '#0C1017',
      borderRight: '1px solid #1E2633',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      zIndex: 500
    }}>
      {/* Primary Rail Mode Tabs: Incidents vs Thermal Events */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #1E2633',
        backgroundColor: '#070A0F'
      }}>
        <button
          onClick={() => setActiveTab('incidents')}
          style={{
            flex: 1,
            padding: '10px 8px',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.04em',
            border: 'none',
            borderBottom: activeTab === 'incidents' ? '2px solid #EF4444' : '2px solid transparent',
            backgroundColor: activeTab === 'incidents' ? '#0C1017' : 'transparent',
            color: activeTab === 'incidents' ? '#F8FAFC' : '#64748B',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease'
          }}
        >
          <Flame size={13} color={activeTab === 'incidents' ? '#EF4444' : '#64748B'} />
          <span>INCIDENTS</span>
          <span style={{
            fontSize: '9px',
            padding: '1px 5px',
            borderRadius: '10px',
            backgroundColor: '#1E2633',
            color: '#CBD5E1',
            fontFamily: 'monospace'
          }}>
            {filteredIncidents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          style={{
            flex: 1,
            padding: '10px 8px',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.04em',
            border: 'none',
            borderBottom: activeTab === 'events' ? '2px solid #F59E0B' : '2px solid transparent',
            backgroundColor: activeTab === 'events' ? '#0C1017' : 'transparent',
            color: activeTab === 'events' ? '#F59E0B' : '#64748B',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease'
          }}
        >
          <Sparkles size={13} color={activeTab === 'events' ? '#F59E0B' : '#64748B'} />
          <span>THERMAL EVENTS</span>
          <span style={{
            fontSize: '9px',
            padding: '1px 5px',
            borderRadius: '10px',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            color: '#F59E0B',
            fontFamily: 'monospace',
            fontWeight: 700
          }}>
            {thermalEvents.length}
          </span>
        </button>
      </div>

      {/* Header & Controls */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #1E2633', backgroundColor: '#090D14' }}>
        {/* Search Field */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#141A24',
          border: '1px solid #232B3B',
          borderRadius: '5px',
          padding: '6px 10px',
          marginBottom: '8px'
        }}>
          <Search size={13} color="#64748B" />
          <input
            type="text"
            placeholder={activeTab === 'incidents' ? "Filter by facility, city, or ID..." : "Filter events by ID, location, or status..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'none',
              border: 'none',
              color: '#F1F5F9',
              fontSize: '11px',
              outline: 'none',
              width: '100%'
            }}
          />
        </div>

        {activeTab === 'incidents' ? (
          /* Incident Severity Filter Tabs */
          <div style={{ display: 'flex', gap: '4px' }}>
            {[
              { id: 'ALL', label: 'All', count: uniqueIncidents.length },
              { id: 'CRITICAL', label: 'Critical', count: uniqueIncidents.filter(i => i.properties.severity === 'CRITICAL').length },
              { id: 'HIGH', label: 'High', count: uniqueIncidents.filter(i => i.properties.severity === 'HIGH').length },
              { id: 'ROUTINE', label: 'Routine', count: uniqueIncidents.filter(i => i.properties.classification === 'PERSISTENT_OPERATIONAL_SOURCE').length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterSeverity(tab.id)}
                style={{
                  flex: 1,
                  padding: '5px 2px',
                  fontSize: '10px',
                  fontWeight: 600,
                  borderRadius: '4px',
                  border: filterSeverity === tab.id ? '1px solid #38BDF8' : '1px solid transparent',
                  backgroundColor: filterSeverity === tab.id ? '#0E2538' : '#141A24',
                  color: filterSeverity === tab.id ? '#38BDF8' : '#94A3B8',
                  cursor: 'pointer',
                  transition: 'all 0.1s ease',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                <span>{tab.label}</span>
                <span style={{ fontSize: '9px', opacity: 0.75, fontFamily: 'monospace' }}>({tab.count})</span>
              </button>
            ))}
          </div>
        ) : (
          /* Thermal Event Filter Chips & Cluster Action */
          <div>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
              {[
                { id: 'ALL' as const, label: 'All', count: thermalEvents.length },
                { id: 'MULTI' as const, label: 'Multi-Obs', count: thermalEvents.filter(e => e.observation_count >= 2).length },
                { id: 'HIGH_FRP' as const, label: '≥50MW', count: thermalEvents.filter(e => e.frp_peak_mw >= 50).length },
                { id: 'SINGLE' as const, label: 'Single', count: thermalEvents.filter(e => e.observation_count === 1).length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setEventFilter(tab.id)}
                  style={{
                    flex: 1,
                    padding: '4px 2px',
                    fontSize: '10px',
                    fontWeight: 600,
                    borderRadius: '4px',
                    border: eventFilter === tab.id ? '1px solid #F59E0B' : '1px solid transparent',
                    backgroundColor: eventFilter === tab.id ? 'rgba(245, 158, 11, 0.15)' : '#141A24',
                    color: eventFilter === tab.id ? '#FCD34D' : '#94A3B8',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '2px'
                  }}
                >
                  <span>{tab.label}</span>
                  <span style={{ fontSize: '9px', opacity: 0.75, fontFamily: 'monospace' }}>({tab.count})</span>
                </button>
              ))}
            </div>

            {onTriggerClustering && (
              <button
                onClick={onTriggerClustering}
                disabled={isClusteringLoading}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  border: '1px solid #F59E0B',
                  backgroundColor: isClusteringLoading ? '#1A140B' : 'rgba(245, 158, 11, 0.12)',
                  color: '#F59E0B',
                  fontSize: '10px',
                  fontWeight: 700,
                  cursor: isClusteringLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <RefreshCw size={11} className={isClusteringLoading ? 'spin' : ''} />
                <span>{isClusteringLoading ? 'Running Graph Clustering...' : 'Run Spatio-Temporal Clustering (750m/60m)'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main List View */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {activeTab === 'incidents' ? (
          /* INCIDENTS QUEUE */
          filteredIncidents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
              <ShieldCheck size={32} color="#10B981" style={{ margin: '0 auto 8px', opacity: 0.8 }} />
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#94A3B8' }}>
                All facilities operating within baseline.
              </div>
              <div style={{ fontSize: '10px', color: '#64748B', marginTop: '4px' }}>
                Zero active alerts matching this filter.
              </div>
            </div>
          ) : (
            filteredIncidents.map((inc) => {
              const isSelected = selectedIncidentId === inc.properties.id;
              const isCritical = inc.properties.severity === 'CRITICAL';
              const isHigh = inc.properties.severity === 'HIGH';
              const isRoutine = inc.properties.classification === 'PERSISTENT_OPERATIONAL_SOURCE';

              const stripeColor = isCritical ? '#EF4444' : isHigh ? '#F97316' : isRoutine ? '#818CF8' : '#EAB308';

              return (
                <div
                  key={inc.properties.id}
                  onClick={() => onSelectIncident(inc.properties.id)}
                  style={{
                    backgroundColor: isSelected ? '#161F2E' : '#0F141C',
                    border: isSelected ? '1px solid #0284C7' : '1px solid #1C2330',
                    borderLeft: `3px solid ${stripeColor}`,
                    borderRadius: '4px',
                    padding: '11px 12px',
                    marginBottom: '6px',
                    cursor: 'pointer',
                    transition: 'background-color 0.12s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="font-mono" style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8' }}>
                        {inc.properties.id}
                      </span>
                      <span style={{ fontSize: '10px', color: '#64748B' }}>
                        • {inc.properties.acq_time} UTC
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '3px',
                        backgroundColor: isCritical ? '#2D1216' : isRoutine ? '#1A1B30' : '#2A1D0D',
                        color: stripeColor,
                        letterSpacing: '0.02em',
                        fontFamily: 'monospace'
                      }}>
                        RISK {inc.properties.risk_score}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLocateIncident(inc.geometry.coordinates);
                        }}
                        title="Center Map"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#64748B',
                          padding: '2px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Navigation size={11} />
                      </button>
                    </div>
                  </div>

                  <div style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: isSelected ? '#FFF' : '#E2E8F0',
                    marginBottom: '6px',
                    lineHeight: 1.3
                  }}>
                    {inc.properties.facility_name || 'Unidentified Compound'}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', marginBottom: '8px' }}>
                    <span style={{
                      color: isCritical ? '#F87171' : isRoutine ? '#A5B4FC' : '#FBBF24',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      fontWeight: 500
                    }}>
                      {isCritical ? <Flame size={10} /> : isRoutine ? <ShieldCheck size={10} /> : <AlertTriangle size={10} />}
                      {inc.properties.classification.replace(/_/g, ' ')}
                    </span>
                    <span style={{ color: '#475569' }}>|</span>
                    <span style={{ color: '#94A3B8' }}>
                      {inc.properties.spatial_match_level === 'DIRECT_HIT' ? 'Core (0m)' : `${inc.properties.dist_to_facility_m}m offset`}
                    </span>
                  </div>

                  <div className="font-mono" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '10px',
                    backgroundColor: '#090D14',
                    padding: '4px 8px',
                    borderRadius: '3px',
                    color: '#64748B'
                  }}>
                    <span>FRP: <strong style={{ color: '#CBD5E1' }}>{inc.properties.frp_total} MW</strong></span>
                    <span>ΔZ: <strong style={{ color: inc.properties.frp_delta_zscore > 3 ? '#F87171' : '#CBD5E1' }}>+{inc.properties.frp_delta_zscore}σ</strong></span>
                    <span>Pass: <strong style={{ color: '#38BDF8' }}>{inc.properties.daynight === 'N' ? 'NIGHT' : 'DAY'}</strong></span>
                    <ChevronRight size={12} color={isSelected ? '#38BDF8' : '#334155'} />
                  </div>
                </div>
              );
            })
          )
        ) : (
          /* THERMAL EVENTS QUEUE */
          filteredEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
              <Sparkles size={32} color="#F59E0B" style={{ margin: '0 auto 8px', opacity: 0.8 }} />
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#CBD5E1' }}>
                No thermal events found.
              </div>
              <div style={{ fontSize: '10px', color: '#64748B', marginTop: '4px' }}>
                Run graph clustering to synthesize candidate events from FIRMS observations.
              </div>
            </div>
          ) : (
            filteredEvents.map((ev) => {
              const isSelected = selectedThermalEventId === ev.id;
              const isMultiObs = ev.observation_count >= 2;
              const isHighFrp = ev.frp_peak_mw >= 50.0;

              return (
                <div
                  key={ev.id}
                  onClick={() => onSelectThermalEvent && onSelectThermalEvent(ev.id)}
                  style={{
                    backgroundColor: isSelected ? '#1A180E' : '#0F141C',
                    border: isSelected ? '1px solid #F59E0B' : '1px solid #1C2330',
                    borderLeft: `3px solid ${isHighFrp ? '#F59E0B' : '#06B6D4'}`,
                    borderRadius: '4px',
                    padding: '11px 12px',
                    marginBottom: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                    position: 'relative'
                  }}
                >
                  {/* Row 1: Event ID, Observations & Status Pill */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="font-mono" style={{ fontSize: '11px', fontWeight: 700, color: '#FCD34D' }}>
                        {ev.id}
                      </span>
                      <span style={{
                        fontSize: '9px',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        backgroundColor: isMultiObs ? 'rgba(6,182,212,0.15)' : '#1F2937',
                        color: isMultiObs ? '#38BDF8' : '#94A3B8',
                        fontFamily: 'monospace'
                      }}>
                        {ev.observation_count} obs
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: '3px',
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        color: '#F59E0B',
                        fontFamily: 'monospace'
                      }}>
                        {ev.status}
                      </span>

                      {onLocateThermalEvent && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onLocateThermalEvent([ev.centroid_longitude, ev.centroid_latitude]);
                          }}
                          title="Locate Event Centroid"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#64748B',
                            padding: '2px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <Navigation size={11} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Title / Context */}
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: isSelected ? '#FFF' : '#E2E8F0',
                    marginBottom: '6px',
                    lineHeight: 1.3
                  }}>
                    {ev.title}
                  </div>

                  {/* Row 3: Extent & Duration */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#94A3B8', marginBottom: '6px' }}>
                    <span>Spatial Extent: <strong style={{ color: '#38BDF8' }}>{ev.spatial_extent_km2 > 0 ? `${ev.spatial_extent_km2} km²` : 'Point'}</strong></span>
                    <span style={{ color: '#475569' }}>|</span>
                    <span>Duration: <strong style={{ color: '#CBD5E1' }}>{Math.round(ev.duration_minutes)} min</strong></span>
                  </div>

                  {/* Row 4: Radiometrics Strip */}
                  <div className="font-mono" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '10px',
                    backgroundColor: '#090D14',
                    padding: '4px 8px',
                    borderRadius: '3px',
                    color: '#64748B'
                  }}>
                    <span>Peak: <strong style={{ color: '#F59E0B' }}>{ev.frp_peak_mw} MW</strong></span>
                    <span>Total: <strong style={{ color: '#CBD5E1' }}>{ev.frp_total_mw} MW</strong></span>
                    <span>Coherence: <strong style={{ color: '#818CF8' }}>{ev.cluster_confidence}%</strong></span>
                    <ChevronRight size={12} color={isSelected ? '#F59E0B' : '#334155'} />
                  </div>
                </div>
              );
            })
          )
        )}
      </div>
    </aside>
  );
};
