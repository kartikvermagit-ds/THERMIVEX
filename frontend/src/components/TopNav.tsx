import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  HelpCircle, 
  Radio, 
  FileText, 
  Download, 
  Map, 
  Info, 
  Bell, 
  BellOff,
  Sparkles,
  ChevronDown,
  Zap
} from 'lucide-react';
import { PyravexLogo } from './PyravexLogo';
import type { DashboardStats, ScenarioItem } from '../types/incident';
import { getSitRepMarkdownUrl, getSitRepPdfUrl, getGeoJsonExportUrl } from '../services/api';

interface TopNavProps {
  stats: DashboardStats | null;
  scenarios: ScenarioItem[];
  currentTab: 'map' | 'about' | 'events';
  onSelectTab: (tab: 'map' | 'about' | 'events') => void;
  onTriggerScenario: (scenarioId: string) => void;
  onRefresh: () => void;
  onOpenGuide: () => void;
  isSimulating: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  stats: _stats,
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
  const [isOpsOpen, setIsOpsOpen] = useState<boolean>(false);

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
    <header className="relative z-[500] h-16 bg-[#030a14]/95 border-b border-cyan-500/25 backdrop-blur-xl px-5 flex items-center justify-between text-white select-none">
      {/* 1. Left: Brand & Navigation */}
      <div className="flex items-center gap-7">
        <div 
          className="cursor-pointer flex items-center gap-3 transition-opacity hover:opacity-90"
          onClick={() => onSelectTab('map')}
        >
          <PyravexLogo size={48} showBadge={false} />
        </div>

        {/* Primary View Switcher Tabs */}
        <nav className="flex items-center gap-1.5 bg-[#040e1c] p-1.5 rounded-xl border border-white/10 font-mono text-sm">
          <button
            onClick={() => onSelectTab('map')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all text-xs sm:text-sm ${
              currentTab === 'map'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_14px_rgba(6,182,212,0.25)]'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Map className="w-4 h-4 text-cyan-400" />
            <span>TACTICAL MAP</span>
          </button>

          <button
            onClick={() => onSelectTab('events')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all text-xs sm:text-sm ${
              currentTab === 'events'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_14px_rgba(245,158,11,0.25)]'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>THERMAL EVENTS</span>
          </button>

          <button
            onClick={() => onSelectTab('about')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all text-xs sm:text-sm ${
              currentTab === 'about'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_14px_rgba(6,182,212,0.25)]'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Info className="w-4 h-4 text-cyan-400" />
            <span>ABOUT &amp; SCIENCE</span>
          </button>
        </nav>
      </div>

      {/* 2. Right: Satellite Link, Status & Operations Group */}
      <div className="flex items-center gap-3.5 font-mono text-sm">
        {/* Live Satellite Stream Telemetry */}
        <div className="hidden xl:flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#040e1c] border border-white/10 text-xs text-slate-300">
          <Radio className="w-4 h-4 text-cyan-400" />
          <span>DATA LINK: <strong className="text-cyan-300">VIIRS &bull; MODIS</strong></span>
          <span className="text-white/20">|</span>
          <span className="text-slate-400 font-semibold">NASA FIRMS</span>
        </div>

        {/* System Online Badge */}
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#040e1c] border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.18)]">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          </span>
          <span className="text-xs font-bold tracking-widest text-emerald-300 uppercase">
            SYSTEM ONLINE
          </span>
        </div>

        {/* Tactical Siren Audio Toggle */}
        <button
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute Tactical Audio Alarm' : 'Enable Tactical Audio Alarm'}
          className={`p-2 rounded-xl border transition-all ${
            soundEnabled 
              ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.25)]' 
              : 'bg-[#040e1c] border-white/10 text-slate-500 hover:text-slate-300'
          }`}
        >
          {soundEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
        </button>

        {/* Operations Dropdown / Button Group */}
        <div className="relative">
          <button
            onClick={() => setIsOpsOpen(!isOpsOpen)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#040e1c] hover:bg-[#071529] border border-cyan-500/40 text-cyan-300 text-xs sm:text-sm font-bold transition-all shadow-[0_0_12px_rgba(6,182,212,0.2)]"
          >
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>OPERATIONS</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpsOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Operations Menu Overlay */}
          {isOpsOpen && (
            <div 
              className="absolute right-0 top-full mt-2 w-72 p-2.5 rounded-2xl bg-[#030a14]/95 border border-cyan-500/30 backdrop-blur-2xl shadow-2xl space-y-2 z-[600]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-2.5 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-white/[0.08]">
                EXPORT SITREPS &amp; GEODATA
              </div>

              <a
                href={getSitRepPdfUrl()}
                download="PYRAVEX_SitRep.pdf"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-950/40 border border-transparent hover:border-red-500/40 text-red-300 text-xs sm:text-sm font-semibold transition-colors"
                onClick={() => setIsOpsOpen(false)}
              >
                <FileText className="w-4 h-4 text-red-400 shrink-0" />
                <span>SitRep PDF (Tactical)</span>
              </a>

              <a
                href={getSitRepMarkdownUrl()}
                download="PYRAVEX_SitRep.md"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-cyan-950/40 border border-transparent hover:border-cyan-500/40 text-slate-200 text-xs sm:text-sm font-semibold transition-colors"
                onClick={() => setIsOpsOpen(false)}
              >
                <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>SitRep Markdown</span>
              </a>

              <a
                href={getGeoJsonExportUrl()}
                download="pyravex_incidents.geojson"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-950/40 border border-transparent hover:border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-semibold transition-colors"
                onClick={() => setIsOpsOpen(false)}
              >
                <Download className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>GeoJSON Export (QGIS/GIS)</span>
              </a>

              <div className="px-2.5 pt-2 pb-1 text-xs font-bold text-slate-400 uppercase tracking-wider border-t border-white/[0.08]">
                SCENARIOS &amp; SIMULATION
              </div>

              <select
                className="w-full bg-[#020712] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500/50 cursor-pointer font-sans"
                onChange={(e) => {
                  if (e.target.value) {
                    onTriggerScenario(e.target.value);
                    e.target.value = '';
                    setIsOpsOpen(false);
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

              <button
                onClick={() => {
                  onOpenGuide();
                  setIsOpsOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-slate-300 text-xs sm:text-sm transition-colors font-sans font-medium"
              >
                <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>System Guide &amp; Protocol</span>
              </button>
            </div>
          )}
        </div>

        {/* Refresh Feed */}
        <button
          onClick={onRefresh}
          title="Refresh Feed"
          className="p-2 rounded-xl bg-[#040e1c] hover:bg-[#071529] border border-white/10 text-slate-300 hover:text-cyan-300 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* UTC Clock */}
        <div className="hidden lg:block px-3.5 py-2 rounded-xl bg-[#040e1c] border border-white/10 text-cyan-300 font-bold text-xs">
          {timeStr}
        </div>
      </div>
    </header>
  );
};

export default TopNav;
