import React, { useState, useEffect } from 'react';
import { Flame, RefreshCw, HelpCircle, Radio } from 'lucide-react';
import type { DashboardStats, ScenarioItem } from '../types/incident';

interface TopNavProps {
  stats: DashboardStats | null;
  scenarios: ScenarioItem[];
  onTriggerScenario: (scenarioId: string) => void;
  onRefresh: () => void;
  onOpenGuide: () => void;
  isSimulating: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  stats,
  scenarios,
  onTriggerScenario,
  onRefresh,
  onOpenGuide,
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
      height: '52px',
      backgroundColor: '#090D14',
      borderBottom: '1px solid #1E2633',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      zIndex: 1000
    }}>
      {/* Brand & System Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '4px',
          backgroundColor: '#161F2E',
          border: '1px solid #0284C7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Flame size={15} color="#F87171" />
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '0.08em', color: '#F8FAFC' }}>
            THERMIVEX
          </span>
          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>
            Geospatial Industrial Fire & Thermal Anomaly Platform
          </span>
        </div>
      </div>

      {/* Sensor Stream Telemetry & Triage Counts */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11px',
          color: '#94A3B8',
          backgroundColor: '#0F141C',
          padding: '3px 8px',
          borderRadius: '4px',
          border: '1px solid #1E2633'
        }}>
          <Radio size={12} color="#10B981" />
          <span className="font-mono" style={{ fontSize: '10px' }}>VIIRS/MODIS NRT: CONNECTED</span>
        </div>

        {stats && (
          <div style={{ display: 'flex', gap: '6px' }}>
            <div style={{
              padding: '2px 8px',
              borderRadius: '3px',
              backgroundColor: '#1C1215',
              border: '1px solid #7F1D1D',
              fontSize: '11px',
              color: '#F87171',
              fontWeight: 600
            }}>
              CRITICAL: {stats.critical_disasters}
            </div>
            <div style={{
              padding: '2px 8px',
              borderRadius: '3px',
              backgroundColor: '#14142B',
              border: '1px solid #3730A3',
              fontSize: '11px',
              color: '#A5B4FC',
              fontWeight: 600
            }}>
              ROUTINE: {stats.routine_flaring}
            </div>
            <div style={{
              padding: '2px 8px',
              borderRadius: '3px',
              backgroundColor: '#0F1A14',
              border: '1px solid #065F46',
              fontSize: '11px',
              color: '#34D399',
              fontWeight: 600
            }}>
              SUPPRESSED: {stats.suppressed_false_positives}
            </div>
          </div>
        )}
      </div>

      {/* Action Controls & Clock */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={onOpenGuide}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            backgroundColor: '#141A24',
            border: '1px solid #232B3B',
            color: '#94A3B8',
            padding: '4px 9px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.1s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#FFF';
            e.currentTarget.style.borderColor = '#38BDF8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94A3B8';
            e.currentTarget.style.borderColor = '#232B3B';
          }}
        >
          <HelpCircle size={12} />
          <span>System Guide</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <select 
            style={{
              backgroundColor: '#141A24',
              color: '#E2E8F0',
              border: '1px solid #232B3B',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer',
              outline: 'none'
            }}
            onChange={(e) => {
              if (e.target.value) {
                onTriggerScenario(e.target.value);
                e.target.value = '';
              }
            }}
            disabled={isSimulating}
          >
            <option value="">⚡ Test Scenarios...</option>
            {scenarios.map((sc) => (
              <option key={sc.scenario_id} value={sc.scenario_id}>
                {sc.title}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onRefresh}
          title="Refresh Feed"
          style={{
            background: '#141A24',
            border: '1px solid #232B3B',
            color: '#94A3B8',
            padding: '5px 7px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <RefreshCw size={12} />
        </button>

        <div className="font-mono" style={{
          fontSize: '11px',
          color: '#38BDF8',
          backgroundColor: '#0F141C',
          padding: '4px 8px',
          borderRadius: '4px',
          border: '1px solid #1E2633'
        }}>
          {timeStr}
        </div>
      </div>
    </header>
  );
};
