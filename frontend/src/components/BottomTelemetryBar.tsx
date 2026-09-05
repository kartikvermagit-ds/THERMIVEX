import React, { useState, useEffect } from 'react';
import { Satellite, Database, Clock } from 'lucide-react';
import type { DashboardStats } from '../types/incident';

interface BottomTelemetryBarProps {
  stats: DashboardStats | null;
  totalObservations?: number;
  totalEvents?: number;
  lastUpdateUtc?: string;
}

export const BottomTelemetryBar: React.FC<BottomTelemetryBarProps> = ({
  stats,
  totalObservations = 124,
  totalEvents = 13,
  lastUpdateUtc
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toISOString().replace('T', ' ').substring(11, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const criticalCount = stats?.critical_disasters ?? 4;
  const routineCount = stats?.routine_flaring ?? 2;
  const suppressedCount = stats?.suppressed_false_positives ?? 1;

  return (
    <footer className="relative z-30 h-11 bg-[#020712]/95 border-t border-cyan-500/25 backdrop-blur-md px-5 flex items-center justify-between text-xs font-mono select-none text-slate-300">
      {/* Left Telemetry Group */}
      <div className="flex items-center gap-5">
        {/* Live Feed Indicator */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.15)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_6px_#34d399]" />
          </span>
          <span className="font-extrabold tracking-wider text-xs">LIVE FEED</span>
        </div>

        {/* NASA FIRMS Link Tag */}
        <div className="hidden sm:flex items-center gap-2 text-slate-300 text-xs">
          <Satellite className="w-3.5 h-3.5 text-cyan-400" />
          <span>FIRMS NRT</span>
          <span className="text-white/20">|</span>
          <span className="text-cyan-300 font-bold">POLAR CONSTELLATION</span>
        </div>

        {/* Counts */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">OBSERVATIONS:</span>
            <strong className="text-white font-bold">{totalObservations}</strong>
          </div>

          <div className="hidden md:flex items-center gap-1.5">
            <span className="text-slate-400">ACTIVE EVENTS:</span>
            <strong className="text-amber-400 font-bold">{totalEvents}</strong>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">CRITICAL:</span>
            <strong className="text-red-400 font-bold">{criticalCount.toString().padStart(2, '0')}</strong>
          </div>

          <div className="hidden lg:flex items-center gap-1.5">
            <span className="text-slate-400">ROUTINE:</span>
            <strong className="text-indigo-300 font-bold">{routineCount.toString().padStart(2, '0')}</strong>
          </div>

          <div className="hidden xl:flex items-center gap-1.5">
            <span className="text-slate-400">SUPPRESSED:</span>
            <strong className="text-emerald-400 font-bold">{suppressedCount.toString().padStart(2, '0')}</strong>
          </div>
        </div>
      </div>

      {/* Right Telemetry Group */}
      <div className="flex items-center gap-5 text-xs">
        <div className="hidden md:flex items-center gap-2 text-slate-300">
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span>SOURCE: <strong className="text-slate-100">VIIRS (375m) &bull; MODIS (1km)</strong></span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#040e1c] border border-white/10 text-cyan-300 font-bold">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{lastUpdateUtc ? `${lastUpdateUtc} UTC` : timeStr}</span>
        </div>
      </div>
    </footer>
  );
};

export default BottomTelemetryBar;
