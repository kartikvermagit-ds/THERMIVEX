import React, { useState, useEffect } from 'react';
import { Flame, RefreshCw, HelpCircle, Radio, FileText, Download, Map, Info, Bell, BellOff } from 'lucide-react';
import type { DashboardStats, ScenarioItem } from '../types/incident';
import { getSitRepMarkdownUrl, getGeoJsonExportUrl } from '../services/api';

interface TopNavProps {
  stats: DashboardStats | null;
  scenarios: ScenarioItem[];
  currentTab: 'map' | 'about';
  onSelectTab: (tab: 'map' | 'about') => void;
  onTriggerScenario: (scenarioId: string) => void;
  onRefresh: () => void;
  onOpenGuide: () => void;
  isSimulating: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  stats,
  scenarios,
  currentTab,
  onSelectTab,
  onTriggerScenario,
  onRefresh,
  onOpenGuide,
  isSimulating,
  soundEnabled,
  onToggleSound
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
      {/* Brand & Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => onSelectTab('map')}>
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

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '0.08em', color: '#F8FAFC' }}>
              THERMIVEX
            </span>
            <span style={{ fontSize: '10px', color: '#38BDF8', fontWeight: 700, backgroundColor: '#0F2937', padding: '1px 5px', borderRadius: '3px' }}>
              SIH 2026
            </span>
          </div>
        </div>

        {/* View Switcher: Live Map vs About & Science */}
        <div style={{ display: 'flex', gap: '4px', backgroundColor: '#0F141C', padding: '3px', borderRadius: '5px', border: '1px solid #1E2633' }}>
          <button
            onClick={() => onSelectTab('map')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: currentTab === 'map' ? '#161F2E' : 'transparent',
              color: currentTab === 'map' ? '#38BDF8' : '#94A3B8',
              fontWeight: 700,
              fontSize: '11px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Map size={12} />
            <span>Tactical Map</span>
          </button>

          <button
            onClick={() => onSelectTab('about')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: currentTab === 'about' ? '#161F2E' : 'transparent',
              color: currentTab === 'about' ? '#38BDF8' : '#94A3B8',
              fontWeight: 700,
              fontSize: '11px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Info size={12} />
            <span>About & Science</span>
          </button>
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
          <span className="font-mono" style={{ fontSize: '10px' }}>VIIRS/MODIS: CONNECTED</span>
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

      {/* Action Controls & Export Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Audible Siren Alert Toggle */}
        <button
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute Tactical Siren Audio' : 'Enable Tactical Siren Audio'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: '#141A24',
            border: soundEnabled ? '1px solid #38BDF8' : '1px solid #232B3B',
            color: soundEnabled ? '#38BDF8' : '#64748B',
            padding: '5px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            cursor: 'pointer',
            transition: 'all 0.1s ease'
          }}
        >
          {soundEnabled ? <Bell size={13} /> : <BellOff size={13} />}
        </button>

        <a
          href={getSitRepMarkdownUrl()}
          download="THERMIVEX_National_SitRep.md"
          title="Export 24-Hour Situation Report"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: '#141A24',
            border: '1px solid #232B3B',
            color: '#94A3B8',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'all 0.1s ease'
          }}
        >
          <FileText size={12} color="#38BDF8" />
          <span>SitRep</span>
        </a>

        <a
          href={getGeoJsonExportUrl()}
          download="thermivex_incidents.geojson"
          title="Export GeoJSON for QGIS / ArcGIS"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: '#141A24',
            border: '1px solid #232B3B',
            color: '#94A3B8',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'all 0.1s ease'
          }}
        >
          <Download size={12} color="#10B981" />
          <span>GeoJSON</span>
        </a>

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
        >
          <HelpCircle size={12} />
          <span>Guide</span>
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
