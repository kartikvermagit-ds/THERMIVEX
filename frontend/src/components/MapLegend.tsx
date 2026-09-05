import React, { useState } from 'react';
import { Info, X } from 'lucide-react';

export const MapLegend: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div className="absolute bottom-12 left-4 z-[400] font-mono text-xs select-none">
      {/* 1. Floating Compact Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#030a14]/85 hover:bg-[#071529]/95 border border-cyan-500/30 text-cyan-300 font-bold backdrop-blur-md shadow-xl transition-all hover:shadow-[0_0_15px_rgba(6,182,212,0.25)]"
        >
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>MAP LEGEND</span>
        </button>
      )}

      {/* 2. Glass HUD Legend Modal/Popover */}
      {isOpen && (
        <div className="w-72 p-3.5 rounded-xl bg-[#030a14]/90 border border-cyan-500/30 backdrop-blur-xl shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-[11px] tracking-wider uppercase">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>TACTICAL MAP LEGEND</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 text-[11px]">
            {/* Accidental Industrial Fire */}
            <div className="flex items-start gap-2.5">
              <div className="w-3.5 h-3.5 rotate-45 bg-white border-2 border-red-500 shadow-[0_0_8px_#ef4444] shrink-0 mt-0.5" />
              <div>
                <strong className="text-red-400">Potential Industrial Fire</strong>
                <div className="text-[10px] text-slate-400 font-sans">FRP spike inside plant, zero historical heat</div>
              </div>
            </div>

            {/* Routine Persistent Heat */}
            <div className="flex items-start gap-2.5">
              <div className="w-3.5 h-3.5 rounded-full bg-indigo-950 border-2 border-indigo-400 shadow-[0_0_6px_#818cf8] shrink-0 mt-0.5" />
              <div>
                <strong className="text-indigo-300">Persistent Thermal Source</strong>
                <div className="text-[10px] text-slate-400 font-sans">Flaring stack/kiln with baseline history</div>
              </div>
            </div>

            {/* Non-Industrial / Agricultural */}
            <div className="flex items-start gap-2.5">
              <div className="w-3.5 h-3.5 rounded-full bg-amber-950 border-2 border-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-400">Non-Industrial / Agricultural</strong>
                <div className="text-[10px] text-slate-400 font-sans">Crop stubble fire outside boundary (&gt;500m)</div>
              </div>
            </div>

            <div className="border-t border-white/[0.08] pt-2 space-y-2">
              {/* Event Spatial Extent */}
              <div className="flex items-start gap-2.5">
                <div className="w-4 h-3 border border-dashed border-amber-400 bg-amber-500/20 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-300 text-[10px]">Observation Spatial Extent</strong>
                  <div className="text-[9px] text-slate-400 font-sans">Convex hull multi-pass spread (km²)</div>
                </div>
              </div>

              {/* Peak FRP */}
              <div className="flex items-start gap-2.5">
                <div className="w-3 h-3 rotate-45 bg-yellow-200 border border-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-yellow-200 text-[10px]">Peak FRP Observation</strong>
                  <div className="text-[9px] text-slate-400 font-sans">Highest radiative intensity point</div>
                </div>
              </div>

              {/* OSM Industrial Facility */}
              <div className="flex items-start gap-2.5">
                <div className="w-4 h-2.5 border border-cyan-400 bg-cyan-500/20 shrink-0 mt-0.5" />
                <span className="text-[10px] text-slate-300">
                  <strong className="text-cyan-300">Cyan Box:</strong> OSM Industrial Facility
                </span>
              </div>

              {/* Estimated Downwind Screening Zone */}
              <div className="flex items-start gap-2.5">
                <div className="w-4 h-2.5 border border-dashed border-red-500 bg-red-500/20 shrink-0 mt-0.5" />
                <span className="text-[10px] text-slate-300">
                  <strong className="text-red-400">Red Envelope:</strong> Estimated Downwind Screening Zone
                </span>
              </div>

              {/* VIIRS 375m Sensor Footprint */}
              <div className="flex items-start gap-2.5">
                <div className="w-4 h-2.5 border border-dashed border-slate-300 bg-white/10 shrink-0 mt-0.5" />
                <span className="text-[10px] text-slate-300">
                  <strong className="text-slate-200">White Box:</strong> 375m VIIRS Ground Footprint
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapLegend;
