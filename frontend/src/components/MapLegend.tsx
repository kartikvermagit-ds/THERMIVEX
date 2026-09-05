import React, { useState } from 'react';
import { Info, X } from 'lucide-react';

export const MapLegend: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div className="absolute bottom-14 left-5 z-[400] font-mono text-xs select-none">
      {/* 1. Floating Compact Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#030a14]/90 hover:bg-[#071529]/95 border border-cyan-500/40 text-cyan-300 font-bold backdrop-blur-md shadow-xl transition-all hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] text-xs"
        >
          <Info className="w-4 h-4 text-cyan-400" />
          <span>MAP LEGEND</span>
        </button>
      )}

      {/* 2. Glass HUD Legend Modal/Popover */}
      {isOpen && (
        <div className="w-80 p-4 rounded-2xl bg-[#030a14]/95 border border-cyan-500/40 backdrop-blur-xl shadow-2xl space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs tracking-wider uppercase">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>TACTICAL MAP LEGEND</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {/* Accidental Industrial Fire */}
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rotate-45 bg-white border-2 border-red-500 shadow-[0_0_8px_#ef4444] shrink-0 mt-0.5" />
              <div>
                <strong className="text-red-400 text-xs">Potential Industrial Fire</strong>
                <div className="text-[11px] text-slate-400 font-sans">FRP spike inside plant, zero historical heat</div>
              </div>
            </div>

            {/* Routine Persistent Heat */}
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded-full bg-indigo-950 border-2 border-indigo-400 shadow-[0_0_6px_#818cf8] shrink-0 mt-0.5" />
              <div>
                <strong className="text-indigo-300 text-xs">Persistent Thermal Source</strong>
                <div className="text-[11px] text-slate-400 font-sans">Flaring stack/kiln with baseline history</div>
              </div>
            </div>

            {/* Non-Industrial / Agricultural */}
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded-full bg-amber-950 border-2 border-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-400 text-xs">Non-Industrial / Agricultural</strong>
                <div className="text-[11px] text-slate-400 font-sans">Crop stubble fire outside boundary (&gt;500m)</div>
              </div>
            </div>

            <div className="border-t border-white/[0.08] pt-2.5 space-y-2.5">
              {/* Event Spatial Extent */}
              <div className="flex items-start gap-3">
                <div className="w-4 h-3.5 border border-dashed border-amber-400 bg-amber-500/20 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-300 text-xs">Observation Spatial Extent</strong>
                  <div className="text-[11px] text-slate-400 font-sans">Convex hull multi-pass spread (km²)</div>
                </div>
              </div>

              {/* Peak FRP */}
              <div className="flex items-start gap-3">
                <div className="w-3.5 h-3.5 rotate-45 bg-yellow-200 border border-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-yellow-200 text-xs">Peak FRP Observation</strong>
                  <div className="text-[11px] text-slate-400 font-sans">Highest radiative intensity point</div>
                </div>
              </div>

              {/* OSM Industrial Facility */}
              <div className="flex items-start gap-3">
                <div className="w-4 h-3 border border-cyan-400 bg-cyan-500/20 shrink-0 mt-0.5" />
                <span className="text-[11px] text-slate-300">
                  <strong className="text-cyan-300 text-xs">Cyan Box:</strong> OSM Industrial Facility
                </span>
              </div>

              {/* Estimated Downwind Screening Zone */}
              <div className="flex items-start gap-3">
                <div className="w-4 h-3 border border-dashed border-red-500 bg-red-500/20 shrink-0 mt-0.5" />
                <span className="text-[11px] text-slate-300">
                  <strong className="text-red-400 text-xs">Red Envelope:</strong> Estimated Downwind Screening Zone
                </span>
              </div>

              {/* VIIRS 375m Sensor Footprint */}
              <div className="flex items-start gap-3">
                <div className="w-4 h-3 border border-dashed border-slate-300 bg-white/10 shrink-0 mt-0.5" />
                <span className="text-[11px] text-slate-300">
                  <strong className="text-slate-200 text-xs">White Box:</strong> 375m VIIRS Ground Footprint
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
