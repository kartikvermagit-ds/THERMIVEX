import React, { useState, useEffect } from 'react';
import { Flame, Satellite, RefreshCw } from 'lucide-react';
import type { DashboardStats, ScenarioItem } from '../types/incident';

interface TopNavProps {
  stats: DashboardStats | null;
  scenarios: ScenarioItem[];
  onTriggerScenario: (scenarioId: string) => void;
  onRefresh: () => void;
  isSimulating: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  stats,
  scenarios,
  onTriggerScenario,
  onRefresh,
  isSimulating
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header style={{
      height: '56px',
      backgroundColor: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '6px',
          backgroundColor: '#1E293B',
          border: '1px solid var(--accent-cyan)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Flame size={18} color="var(--threat-critical)" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '0.05em', color: '#FFF' }}>
              THERMIVEX
            </span>
            <span style={{
              fontSize: '10px',
              padding: '1px 6px',
              borderRadius: '4px',
              backgroundColor: '#0F2937',
              color: 'var(--accent-cyan)',
              border: '1px solid var(--accent-cyan)',
              fontWeight: 600
            }}>
              SIH 2026 TACTICAL
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Industrial Fire & Persistent Thermal Source Intelligence
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11px',
          color: 'var(--text-secondary)',
          backgroundColor: 'var(--bg-space)',
          padding: '4px 10px',
          borderRadius: '4px',
          border: '1px solid var(--border-subtle)'
        }}>
          <Satellite size={14} color="var(--threat-safe)" />
          <span>VIIRS/MODIS NRT:</span>
          <span style={{ color: 'var(--threat-safe)', fontWeight: 600 }}>SYNCED</span>
        </div>

        {stats && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{
              padding: '3px 8px',
              borderRadius: '4px',
              backgroundColor: '#271115',
              border: '1px solid var(--threat-critical)',
              fontSize: '11px',
              color: 'var(--threat-critical)',
              fontWeight: 600
            }}>
              CRITICAL: {stats.critical_disasters}
            </div>
            <div style={{
              padding: '3px 8px',
              borderRadius: '4px',
              backgroundColor: '#1E1B4B',
              border: '1px solid var(--threat-routine)',
              fontSize: '11px',
              color: 'var(--threat-routine)',
              fontWeight: 600
            }}>
              ROUTINE BASELINE: {stats.routine_flaring}
            </div>
            <div style={{
              padding: '3px 8px',
              borderRadius: '4px',
              backgroundColor: '#0F1F18',
              border: '1px solid var(--threat-safe)',
              fontSize: '11px',
              color: 'var(--threat-safe)',
              fontWeight: 600
            }}>
              SUPPRESSED: {stats.suppressed_false_positives}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>DEMO SCENARIO:</span>
          <select 
            style={{
              backgroundColor: 'var(--bg-space)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-active)',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
            onChange={(e) => {
              if (e.target.value) {
                onTriggerScenario(e.target.value);
                e.target.value = '';
              }
            }}
            disabled={isSimulating}
          >
            <option value="">⚡ Trigger Demonstration Event...</option>
            {scenarios.map((sc) => (
              <option key={sc.scenario_id} value={sc.scenario_id}>
                {sc.title} ({sc.expected_risk_tier})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onRefresh}
          title="Refresh Feed"
          style={{
            background: 'none',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            padding: '6px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <RefreshCw size={14} />
        </button>

        <div className="font-mono" style={{
          fontSize: '11px',
          color: 'var(--accent-cyan)',
          backgroundColor: 'var(--bg-space)',
          padding: '4px 8px',
          borderRadius: '4px',
          border: '1px solid var(--border-subtle)'
        }}>
          {timeStr}
        </div>
      </div>
    </header>
  );
};
