import React, { useState } from 'react';
import { 
  Search, 
  Flame, 
  Sparkles, 
  RefreshCw, 
  ShieldCheck, 
  Navigation
} from 'lucide-react';
import type { IncidentFeature } from '../types/incident';
import type { ThermalEvent, LatestClusteringRun } from '../types/event';

interface TriageRailProps {
  incidents: IncidentFeature[];
  thermalEvents?: ThermalEvent[];
  selectedIncidentId: string | null;
  selectedThermalEventId?: string | null;
  activeTab?: 'incidents' | 'events';
  onTabChange?: (tab: 'incidents' | 'events') => void;
  onSelectIncident: (id: string) => void;
  onSelectThermalEvent?: (id: string) => void;
  onLocateIncident: (coords: [number, number]) => void;
  onLocateThermalEvent?: (coords: [number, number]) => void;
  onTriggerClustering?: () => void;
  isClusteringLoading?: boolean;
  latestClusteringRun?: LatestClusteringRun | null;
}

export const TriageRail: React.FC<TriageRailProps> = ({
  incidents,
  thermalEvents = [],
  selectedIncidentId,
  selectedThermalEventId = null,
  activeTab: externalTab,
  onTabChange,
  onSelectIncident,
  onSelectThermalEvent,
  onLocateIncident,
  onLocateThermalEvent,
  onTriggerClustering,
  isClusteringLoading = false,
  latestClusteringRun = null
}) => {
  const [internalTab, setInternalTab] = useState<'incidents' | 'events'>('incidents');
  const activeTab = externalTab ?? internalTab;

  const handleTabClick = (tab: 'incidents' | 'events') => {
    setInternalTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [eventFilter, setEventFilter] = useState<'ALL' | 'MULTI' | 'HIGH_FRP' | 'SINGLE'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Deduplicate incidents by facility name + date/time
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
    if (filterSeverity === 'CRITICAL' && inc.properties.severity !== 'CRITICAL') return false;
    if (filterSeverity === 'HIGH' && inc.properties.severity !== 'HIGH') return false;
    if (filterSeverity === 'ROUTINE' && inc.properties.classification !== 'PERSISTENT_OPERATIONAL_SOURCE') return false;

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
    <aside className="w-[340px] xl:w-[360px] h-full flex flex-col shrink-0 border-r border-cyan-500/20 bg-[#050b14]/95 z-[400] text-white shadow-[10px_0_30px_rgba(0,0,0,0.7)] overflow-hidden select-none">
      {/* 1. Primary Mode Tabs */}
      <div className="grid grid-cols-2 p-1.5 bg-[#03070f] border-b border-white/[0.08] font-mono text-xs">
        <button
          onClick={() => handleTabClick('incidents')}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md font-bold transition-all ${
            activeTab === 'incidents'
              ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-red-400" />
          <span>INCIDENTS</span>
          <span className="px-1.5 py-0.2 rounded bg-black/50 text-[10px] text-red-300 font-mono font-bold">
            {uniqueIncidents.length.toString().padStart(2, '0')}
          </span>
        </button>

        <button
          onClick={() => handleTabClick('events')}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md font-bold transition-all ${
            activeTab === 'events'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>THERMAL EVENTS</span>
          <span className="px-1.5 py-0.2 rounded bg-black/50 text-[10px] text-amber-300 font-mono font-bold">
            {thermalEvents.length.toString().padStart(2, '0')}
          </span>
        </button>
      </div>

      {/* 2. Tactical Filter & Search Controls */}
      <div className="p-3 border-b border-white/[0.08] bg-[#07111c] space-y-2.5">
        {/* Search Field */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#03070f] border border-white/10 text-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder={activeTab === 'incidents' ? 'Filter by facility, city, or ID...' : 'Filter events by ID or location...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-white placeholder-slate-500 outline-none text-xs font-mono"
          />
        </div>

        {/* Filter Chips */}
        {activeTab === 'incidents' ? (
          <div className="grid grid-cols-4 gap-1.5 font-mono text-[11px]">
            {[
              { id: 'ALL', label: 'All', count: uniqueIncidents.length },
              { id: 'CRITICAL', label: 'Crit', count: uniqueIncidents.filter(i => i.properties.severity === 'CRITICAL').length },
              { id: 'HIGH', label: 'High', count: uniqueIncidents.filter(i => i.properties.severity === 'HIGH').length },
              { id: 'ROUTINE', label: 'Rout', count: uniqueIncidents.filter(i => i.properties.classification === 'PERSISTENT_OPERATIONAL_SOURCE').length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterSeverity(tab.id)}
                className={`py-1 px-1.5 rounded text-center transition-all ${
                  filterSeverity === tab.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'bg-[#03070f] text-slate-400 hover:text-slate-200 border border-white/5'
                }`}
              >
                <span>{tab.label}</span> <span className="opacity-70 font-mono">({tab.count})</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-1.5 font-mono text-[11px]">
              {[
                { id: 'ALL' as const, label: 'All', count: thermalEvents.length },
                { id: 'MULTI' as const, label: 'Multi', count: thermalEvents.filter(e => e.observation_count >= 2).length },
                { id: 'HIGH_FRP' as const, label: '≥50M', count: thermalEvents.filter(e => e.frp_peak_mw >= 50).length },
                { id: 'SINGLE' as const, label: 'Single', count: thermalEvents.filter(e => e.observation_count === 1).length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setEventFilter(tab.id)}
                  className={`py-1 px-1.5 rounded text-center transition-all ${
                    eventFilter === tab.id
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                      : 'bg-[#03070f] text-slate-400 hover:text-slate-200 border border-white/5'
                  }`}
                >
                  <span>{tab.label}</span> <span className="opacity-70 font-mono">({tab.count})</span>
                </button>
              ))}
            </div>

            {onTriggerClustering && (
              <div className="space-y-1">
                <button
                  onClick={onTriggerClustering}
                  disabled={isClusteringLoading}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-amber-950/30 hover:bg-amber-950/60 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-bold transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isClusteringLoading ? 'animate-spin' : ''}`} />
                  <span>{isClusteringLoading ? 'Running Graph Clustering...' : 'Run Spatio-Temporal Graph (750m/60m)'}</span>
                </button>

                {latestClusteringRun && (
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1">
                    <span>Status: <strong className="text-slate-200">{latestClusteringRun.status}</strong></span>
                    <span className={latestClusteringRun.is_stale ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                      {latestClusteringRun.is_stale ? 'STALE' : 'FRESH'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Tactical List Content with Comfortable 90–115px Cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {activeTab === 'incidents' ? (
          filteredIncidents.length === 0 ? (
            <div className="text-center py-16 px-4 text-slate-500 font-sans">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              <div className="text-xs font-semibold text-slate-300">All facilities operating nominal</div>
              <div className="text-[11px] text-slate-500 mt-1">Zero active detections match filter</div>
            </div>
          ) : (
            filteredIncidents.map((inc) => {
              const isSelected = selectedIncidentId === inc.properties.id;
              const isCritical = inc.properties.severity === 'CRITICAL';
              const isHigh = inc.properties.severity === 'HIGH';
              const isRoutine = inc.properties.classification === 'PERSISTENT_OPERATIONAL_SOURCE';

              const stripeColor = isCritical ? '#EF4444' : isHigh ? '#F97316' : isRoutine ? '#818CF8' : '#38BDF8';
              const badgeBg = isCritical ? 'rgba(239, 68, 68, 0.15)' : isHigh ? 'rgba(249, 115, 22, 0.15)' : isRoutine ? 'rgba(129, 140, 248, 0.15)' : 'rgba(56, 189, 248, 0.15)';

              return (
                <div
                  key={inc.properties.id}
                  onClick={() => onSelectIncident(inc.properties.id)}
                  className={`group relative flex overflow-hidden rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#0a182a] border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                      : 'bg-[#07111c] border-white/10 hover:border-white/20 hover:bg-[#0a1622]'
                  }`}
                >
                  {/* Left Severity Stripe Indicator */}
                  <div 
                    className="w-1.5 shrink-0" 
                    style={{ backgroundColor: stripeColor }} 
                  />

                  {/* Card Main Body */}
                  <div className="flex-1 p-3 space-y-1.5">
                    {/* Top Row: Risk Score + ID + Fly button */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span 
                          className="px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider text-[10px] border"
                          style={{ backgroundColor: badgeBg, color: stripeColor, borderColor: stripeColor }}
                        >
                          {inc.properties.risk_score} {inc.properties.severity}
                        </span>
                        <span className="font-mono text-slate-400 font-bold text-[11px]">#{inc.properties.id}</span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLocateIncident(inc.geometry.coordinates as [number, number]);
                        }}
                        className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-cyan-300 transition-colors"
                        title="Locate incident on map"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Facility / Location Title */}
                    <div>
                      <div className="font-sans font-bold text-[13px] text-white leading-snug line-clamp-1">
                        {inc.properties.facility_name || 'Industrial Compound'}
                      </div>
                    </div>

                    {/* Classification */}
                    <div className="text-[11px] text-slate-300 font-semibold uppercase tracking-wide truncate">
                      {inc.properties.classification.replace(/_/g, ' ')}
                    </div>

                    {/* Telemetry Row */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-white/[0.06] pt-1.5">
                      <div>
                        FRP <strong className="text-amber-400 font-bold">{inc.properties.frp_total} MW</strong>
                      </div>
                      <div>
                        ΔZ <strong className={inc.properties.frp_delta_zscore > 3 ? 'text-red-400 font-bold' : 'text-slate-200'}>+{inc.properties.frp_delta_zscore}σ</strong>
                      </div>
                      <div className="text-cyan-300 uppercase font-bold">
                        {inc.properties.daynight === 'N' ? 'NIGHT' : 'DAY'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )
        ) : (
          /* THERMAL EVENTS QUEUE */
          filteredEvents.length === 0 ? (
            <div className="text-center py-16 px-4 text-slate-500 font-sans">
              <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-80" />
              <div className="text-xs font-semibold text-slate-300">No thermal event clusters</div>
              <div className="text-[11px] text-slate-500 mt-1">Run clustering to aggregate sensor passes</div>
            </div>
          ) : (
            filteredEvents.map((ev) => {
              const isSelected = selectedThermalEventId === ev.id;
              const isHighFrp = ev.frp_peak_mw >= 50;
              const isMulti = ev.observation_count >= 2;

              const statusColor = isHighFrp ? '#EF4444' : isMulti ? '#F59E0B' : '#06B6D4';

              return (
                <div
                  key={ev.id}
                  onClick={() => onSelectThermalEvent && onSelectThermalEvent(ev.id)}
                  className={`group relative flex overflow-hidden rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#151208] border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                      : 'bg-[#07111c] border-white/10 hover:border-white/20 hover:bg-[#0a1622]'
                  }`}
                >
                  {/* Left Severity Stripe Indicator */}
                  <div 
                    className="w-1.5 shrink-0" 
                    style={{ backgroundColor: statusColor }} 
                  />

                  {/* Card Main Body */}
                  <div className="flex-1 p-3 space-y-1.5">
                    {/* Top Row: Event ID + Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-bold font-mono text-[11px]">#{ev.id}</span>
                        <span 
                          className="px-1.5 py-0.2 rounded font-mono font-bold uppercase text-[10px] border"
                          style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: statusColor, borderColor: statusColor }}
                        >
                          {ev.status}
                        </span>
                      </div>

                      {onLocateThermalEvent && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onLocateThermalEvent([ev.centroid_longitude, ev.centroid_latitude]);
                          }}
                          className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-amber-300 transition-colors"
                          title="Locate event on map"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Title */}
                    <div className="font-sans font-bold text-[13px] text-white leading-snug line-clamp-1">
                      {ev.title}
                    </div>

                    {/* Observation Count & Spatial Extent */}
                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                      <span>{ev.observation_count} Member Detections</span>
                      <span className="text-cyan-300 font-mono">{ev.spatial_extent_km2} km² Extent</span>
                    </div>

                    {/* Peak FRP */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-white/[0.06] pt-1.5">
                      <div>
                        PEAK: <strong className="text-amber-400 font-bold">{ev.frp_peak_mw} MW</strong>
                      </div>
                      <div>
                        TEMP: <strong className="text-slate-200">{ev.max_brightness_kelvin} K</strong>
                      </div>
                    </div>
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

export default TriageRail;
