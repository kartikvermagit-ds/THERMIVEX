import React, { useState } from 'react';
import { Eye, Navigation, CheckCircle2 } from 'lucide-react';
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

  const filteredIncidents = incidents.filter((inc) => {
    if (filterSeverity === 'ALL') return true;
    if (filterSeverity === 'CRITICAL') return inc.properties.severity === 'CRITICAL';
    if (filterSeverity === 'HIGH') return inc.properties.severity === 'HIGH';
    if (filterSeverity === 'ROUTINE') return inc.properties.classification === 'PERSISTENT_OPERATIONAL_SOURCE';
    return true;
  });

  const getSeverityBadge = (sev: string, score: number) => {
    if (sev === 'CRITICAL') {
      return { bg: '#3B1218', border: '#EF4444', text: '#EF4444', label: `CRITICAL ${score}` };
    }
    if (sev === 'HIGH') {
      return { bg: '#341D10', border: '#F97316', text: '#F97316', label: `HIGH ${score}` };
    }
    if (sev === 'MEDIUM') {
      return { bg: '#2E220D', border: '#F59E0B', text: '#F59E0B', label: `MED ${score}` };
    }
    return { bg: '#181C30', border: '#818CF8', text: '#818CF8', label: `ROUTINE ${score}` };
  };

  return (
    <aside style={{
      width: '400px',
      height: 'calc(100vh - 56px)',
      backgroundColor: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      zIndex: 500
    }}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'rgba(7, 9, 14, 0.7)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', color: '#FFF' }}>
            INCIDENT TRIAGE QUEUE ({filteredIncidents.length})
          </span>
          <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 600 }}>
            Ranked by Risk Score
          </span>
        </div>

        {/* Severity Filter Chips */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'ALL', label: 'All Events' },
            { id: 'CRITICAL', label: 'Critical (Red)' },
            { id: 'HIGH', label: 'High (Orange)' },
            { id: 'ROUTINE', label: 'Routine (Purple)' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterSeverity(tab.id)}
              style={{
                flex: 1,
                padding: '6px 0',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '6px',
                border: filterSeverity === tab.id ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                backgroundColor: filterSeverity === tab.id ? '#0F2937' : 'var(--bg-space)',
                color: filterSeverity === tab.id ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Incident Cards List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {filteredIncidents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={36} color="var(--threat-safe)" style={{ margin: '0 auto 10px' }} />
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              No incidents match the active filter.
            </div>
          </div>
        ) : (
          filteredIncidents.map((inc) => {
            const isSelected = selectedIncidentId === inc.properties.id;
            const badge = getSeverityBadge(inc.properties.severity, inc.properties.risk_score);
            const isCritical = inc.properties.severity === 'CRITICAL';

            return (
              <div
                key={inc.properties.id}
                onClick={() => onSelectIncident(inc.properties.id)}
                style={{
                  backgroundColor: isSelected ? '#131B26' : 'var(--bg-space)',
                  border: isSelected 
                    ? '1.5px solid var(--accent-cyan)' 
                    : isCritical 
                      ? '1px solid #7F1D1D' 
                      : '1px solid var(--border-subtle)',
                  boxShadow: isSelected ? '0 0 16px rgba(6, 182, 212, 0.2)' : 'none',
                  borderRadius: '8px',
                  padding: '14px',
                  marginBottom: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                {/* ID, Timestamp & Risk Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="font-mono" style={{ fontSize: '12px', fontWeight: 800, color: '#FFF' }}>
                      #{inc.properties.id}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {inc.properties.acq_time} UTC
                    </span>
                  </div>

                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: badge.bg,
                    border: `1px solid ${badge.border}`,
                    color: badge.text,
                    letterSpacing: '0.02em'
                  }}>
                    {badge.label}
                  </span>
                </div>

                {/* Facility Name */}
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC', marginBottom: '8px', lineHeight: 1.3 }}>
                  {inc.properties.facility_name || 'Unidentified Facility'}
                </div>

                {/* Proximity & Classification Badges */}
                <div style={{ display: 'flex', gap: '6px', fontSize: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <span style={{
                    color: inc.properties.spatial_match_level === 'DIRECT_HIT' ? 'var(--threat-critical)' : 'var(--accent-cyan)',
                    backgroundColor: '#0F1A24',
                    border: '1px solid #1E293B',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    fontWeight: 700
                  }}>
                    {inc.properties.spatial_match_level} ({inc.properties.dist_to_facility_m}m)
                  </span>
                  <span style={{
                    color: inc.properties.classification === 'PERSISTENT_OPERATIONAL_SOURCE' ? 'var(--threat-routine)' : 'var(--text-secondary)',
                    backgroundColor: '#161925',
                    border: '1px solid #1E293B',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    fontWeight: 600
                  }}>
                    {inc.properties.classification.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Telemetry Strip */}
                <div className="font-mono" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  borderTop: '1px solid #1E293B',
                  paddingTop: '8px',
                  marginBottom: '10px'
                }}>
                  <span>FRP: <strong style={{ color: '#FFF' }}>{inc.properties.frp_total} MW</strong></span>
                  <span>ΔZ: <strong style={{ color: inc.properties.frp_delta_zscore > 3 ? 'var(--threat-critical)' : '#FFF' }}>+{inc.properties.frp_delta_zscore}σ</strong></span>
                  <span>Pass: <strong style={{ color: 'var(--accent-cyan)' }}>{inc.properties.daynight === 'N' ? 'NIGHT' : 'DAY'}</strong></span>
                </div>

                {/* Action Controls */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectIncident(inc.properties.id);
                    }}
                    style={{
                      flex: 1,
                      padding: '7px 0',
                      fontSize: '11px',
                      fontWeight: 700,
                      borderRadius: '5px',
                      border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid #1E293B',
                      backgroundColor: isSelected ? 'var(--accent-cyan)' : '#0F2937',
                      color: isSelected ? '#000' : '#FFF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Eye size={13} />
                    Investigate
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLocateIncident(inc.geometry.coordinates);
                    }}
                    title="Center on Map"
                    style={{
                      padding: '7px 12px',
                      fontSize: '11px',
                      borderRadius: '5px',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-space)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Navigation size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
