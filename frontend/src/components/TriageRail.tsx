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
      width: '380px',
      height: 'calc(100vh - 56px)',
      backgroundColor: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      zIndex: 500
    }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-primary)' }}>
            INCIDENT TRIAGE QUEUE ({filteredIncidents.length})
          </span>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            Sorted: Risk Score
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'ALL', label: 'All' },
            { id: 'CRITICAL', label: 'Critical' },
            { id: 'HIGH', label: 'High' },
            { id: 'ROUTINE', label: 'Routine' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterSeverity(tab.id)}
              style={{
                flex: 1,
                padding: '4px 0',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '4px',
                border: filterSeverity === tab.id ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                backgroundColor: filterSeverity === tab.id ? '#0F2937' : 'var(--bg-space)',
                color: filterSeverity === tab.id ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
        {filteredIncidents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={32} color="var(--threat-safe)" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
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
                  backgroundColor: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-space)',
                  border: isSelected 
                    ? '1px solid var(--border-active)' 
                    : isCritical 
                      ? '1px solid #7F1D1D' 
                      : '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="font-mono" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      #{inc.properties.id}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {inc.properties.acq_time} UTC
                    </span>
                  </div>

                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: badge.bg,
                    border: `1px solid ${badge.border}`,
                    color: badge.text
                  }}>
                    {badge.label}
                  </span>
                </div>

                <div style={{ fontSize: '12px', fontWeight: 600, color: '#FFF', marginBottom: '6px' }}>
                  {inc.properties.facility_name || 'Unidentified Facility'}
                </div>

                <div style={{ display: 'flex', gap: '6px', fontSize: '10px', marginBottom: '8px' }}>
                  <span style={{
                    color: inc.properties.spatial_match_level === 'DIRECT_HIT' ? 'var(--threat-critical)' : 'var(--accent-cyan)',
                    backgroundColor: '#0F1A24',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    fontWeight: 600
                  }}>
                    {inc.properties.spatial_match_level} ({inc.properties.dist_to_facility_m}m)
                  </span>
                  <span style={{
                    color: inc.properties.classification === 'PERSISTENT_OPERATIONAL_SOURCE' ? 'var(--threat-routine)' : 'var(--text-secondary)',
                    backgroundColor: '#161925',
                    padding: '1px 5px',
                    borderRadius: '3px'
                  }}>
                    {inc.properties.classification.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="font-mono" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  borderTop: '1px solid #1E293B',
                  paddingTop: '6px',
                  marginBottom: '8px'
                }}>
                  <span>FRP: <strong style={{ color: 'var(--text-primary)' }}>{inc.properties.frp_total} MW</strong></span>
                  <span>ΔZ: <strong style={{ color: inc.properties.frp_delta_zscore > 3 ? 'var(--threat-critical)' : 'var(--text-primary)' }}>+{inc.properties.frp_delta_zscore}σ</strong></span>
                  <span>Pass: <strong style={{ color: 'var(--text-primary)' }}>{inc.properties.daynight === 'N' ? 'NIGHT' : 'DAY'}</strong></span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectIncident(inc.properties.id);
                    }}
                    style={{
                      flex: 1,
                      padding: '5px 0',
                      fontSize: '11px',
                      fontWeight: 600,
                      borderRadius: '4px',
                      border: '1px solid var(--border-active)',
                      backgroundColor: isSelected ? 'var(--border-active)' : '#0F2937',
                      color: '#FFF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <Eye size={12} />
                    Investigate
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLocateIncident(inc.geometry.coordinates);
                    }}
                    title="Locate on Map"
                    style={{
                      padding: '5px 10px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-space)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Navigation size={12} />
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
