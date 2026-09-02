import React, { useState } from 'react';
import { Search, Navigation, AlertTriangle, ShieldCheck, Flame, ChevronRight } from 'lucide-react';
import type { IncidentFeature } from '../types/incident';

interface TriageRailProps {
  incidents: IncidentFeature[];
  selectedIncidentId: string | null;
  onSelectIncident: (id: string) => void;
  onLocateIncident: (coords: [number, number]) => void;
}

export const TriageRail: React.FC<TriageRailProps> = ({
  incidents,
  selectedIncidentId,
  onSelectIncident,
  onLocateIncident
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
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
      {/* Search & Header Bar */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #1E2633', backgroundColor: '#090D14' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', color: '#94A3B8' }}>
              INCIDENT QUEUE
            </span>
            <span style={{
              fontSize: '10px',
              backgroundColor: '#1E2633',
              color: '#CBD5E1',
              padding: '1px 6px',
              borderRadius: '10px',
              fontWeight: 700
            }}>
              {filteredIncidents.length}
            </span>
          </div>

          <span style={{ fontSize: '10px', color: '#64748B', fontFamily: 'monospace' }}>
            NRT TELEMETRY
          </span>
        </div>

        {/* Tactical Search Field */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#141A24',
          border: '1px solid #232B3B',
          borderRadius: '5px',
          padding: '6px 10px',
          marginBottom: '10px'
        }}>
          <Search size={13} color="#64748B" />
          <input
            type="text"
            placeholder="Filter by facility, city, or ID..."
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

        {/* Severity Filter Tabs with Dynamic Counters */}
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
      </div>

      {/* Incident List View */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {filteredIncidents.length === 0 ? (
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
                {/* Row 1: Incident ID, Time & Severity Pill */}
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

                {/* Row 2: Facility Name */}
                <div style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: isSelected ? '#FFF' : '#E2E8F0',
                  marginBottom: '6px',
                  lineHeight: 1.3
                }}>
                  {inc.properties.facility_name || 'Unidentified Compound'}
                </div>

                {/* Row 3: Tactical Classification & Proximity */}
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

                {/* Row 4: Telemetry Metrics Strip */}
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
        )}
      </div>
    </aside>
  );
};
