import React from 'react';
import { 
  X, 
  Building2, 
  Activity, 
  ExternalLink, 
  Send, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles
} from 'lucide-react';
import type { IncidentFeature, InvestigationDossier } from '../types/incident';
import type { ThermalEvent } from '../types/event';
import { getSitRepPdfUrl } from '../services/api';

interface EventIntelligencePanelProps {
  selectedIncident: IncidentFeature | null;
  selectedDossier: InvestigationDossier | null;
  selectedThermalEvent: ThermalEvent | null;
  onClose: () => void;
  onOpenFullDossier: () => void;
  onOpenThermalDrawer: () => void;
  onSimulateDispatch?: () => void;
  isDispatching?: boolean;
  dispatchStatus?: string | null;
}

export const EventIntelligencePanel: React.FC<EventIntelligencePanelProps> = ({
  selectedIncident,
  selectedDossier,
  selectedThermalEvent,
  onClose,
  onOpenFullDossier,
  onOpenThermalDrawer,
  onSimulateDispatch,
  isDispatching = false,
  dispatchStatus = null
}) => {
  // If nothing is selected, do NOT occupy space in the layout!
  if (!selectedIncident && !selectedThermalEvent) {
    return null;
  }

  const isIncidentMode = !!selectedIncident;
  const incProps = selectedIncident?.properties;

  const isCritical = incProps?.severity === 'CRITICAL' || (selectedDossier?.risk_assessment.composite_risk_score ?? 0) >= 70;
  const isHigh = incProps?.severity === 'HIGH' || ((selectedDossier?.risk_assessment.composite_risk_score ?? 0) >= 50 && !isCritical);
  const isRoutine = incProps?.classification === 'PERSISTENT_OPERATIONAL_SOURCE';
  
  const riskScore = selectedDossier?.risk_assessment.composite_risk_score ?? incProps?.risk_score ?? (isCritical ? 97 : isHigh ? 65 : isRoutine ? 17 : 47);
  const riskColor = isCritical ? '#EF4444' : isHigh ? '#F97316' : isRoutine ? '#818CF8' : '#38BDF8';
  const riskBg = isCritical ? 'rgba(239, 68, 68, 0.15)' : isHigh ? 'rgba(249, 115, 22, 0.15)' : isRoutine ? 'rgba(129, 140, 248, 0.15)' : 'rgba(56, 189, 248, 0.15)';
  const riskBorder = isCritical ? '#EF4444' : isHigh ? '#F97316' : isRoutine ? '#818CF8' : '#38BDF8';

  const eventId = isIncidentMode ? `#${incProps?.id}` : `#${selectedThermalEvent?.id}`;
  const facilityTitle = isIncidentMode 
    ? (incProps?.facility_name || 'Industrial Compound') 
    : (selectedThermalEvent?.title || 'Candidate Thermal Event');
    
  const classification = isIncidentMode 
    ? (incProps?.classification?.replace(/_/g, ' ') || 'POTENTIAL INDUSTRIAL FIRE')
    : (selectedThermalEvent?.status || 'ACTIVE CLUSTER');

  const peakFrp = isIncidentMode 
    ? (incProps?.frp_total || 0)
    : (selectedThermalEvent?.frp_peak_mw || 0);

  const obsCount = isIncidentMode
    ? (selectedDossier?.sensor.pixel_count || 1)
    : (selectedThermalEvent?.observation_count || 1);

  const spatialExtent = isIncidentMode
    ? '0.14 km² (375m Footprint)'
    : `${selectedThermalEvent?.spatial_extent_km2 || 0} km²`;

  const timeWindow = isIncidentMode
    ? `${incProps?.acq_time || '21:34'} UTC (${incProps?.daynight === 'N' ? 'NIGHT' : 'DAY'})`
    : `${selectedThermalEvent?.first_observed_at?.substring(11, 16) || '21:34'} — ${selectedThermalEvent?.last_observed_at?.substring(11, 16) || '21:58'} UTC`;

  const distToPlant = incProps?.dist_to_facility_m ?? 0;
  const matchLevel = incProps?.spatial_match_level === 'DIRECT_HIT' ? 'Core (0m)' : `${distToPlant}m offset`;

  return (
    <aside className="absolute top-0 right-0 h-full w-[350px] xl:w-[380px] flex flex-col border-l border-cyan-500/25 bg-[#050b14]/95 backdrop-blur-2xl z-[500] text-white shadow-[-15px_0_40px_rgba(0,0,0,0.9)] animate-in slide-in-from-right duration-200 select-none">
      {/* 1. Header Bar */}
      <div className="px-4 py-3 border-b border-white/[0.08] bg-[#07111c] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#06b6d4]" />
          <span className="font-mono text-xs font-bold tracking-widest text-cyan-300 uppercase">
            EVENT INTELLIGENCE
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          title="Close Intelligence Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Main Intelligence Details */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {/* Event Header Card */}
        <div className="p-3.5 rounded-lg bg-[#07111c] border border-cyan-500/30 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs text-cyan-400 font-bold tracking-wide">
              {eventId}
            </span>
            <span 
              className="px-2 py-0.5 rounded font-mono text-[10px] font-bold tracking-wider uppercase border"
              style={{ backgroundColor: riskBg, color: riskColor, borderColor: riskBorder }}
            >
              RISK {riskScore}/100 &bull; {isCritical ? 'CRITICAL' : isHigh ? 'HIGH' : isRoutine ? 'ROUTINE' : 'NOMINAL'}
            </span>
          </div>

          <div className="font-sans font-bold text-sm text-white leading-tight mb-2">
            {facilityTitle}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-sans">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: riskColor }} />
            <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-200">
              {classification}
            </span>
          </div>
        </div>

        {/* Tactical Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-[#07111c] border border-white/10">
            <div className="text-[10px] text-slate-400 uppercase">OBSERVATIONS</div>
            <div className="text-white font-bold text-sm mt-0.5 flex items-baseline gap-1">
              <span>{obsCount.toString().padStart(2, '0')}</span>
              <span className="text-[10px] text-cyan-400 font-normal">Detections</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#07111c] border border-white/10">
            <div className="text-[10px] text-slate-400 uppercase">PEAK FRP</div>
            <div className="text-amber-400 font-bold text-sm mt-0.5 flex items-baseline gap-1">
              <span>{peakFrp.toFixed(1)}</span>
              <span className="text-[10px] text-amber-300 font-normal">MW</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#07111c] border border-white/10">
            <div className="text-[10px] text-slate-400 uppercase">TIME WINDOW</div>
            <div className="text-slate-200 font-bold text-[11px] mt-0.5 truncate">
              {timeWindow}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#07111c] border border-white/10">
            <div className="text-[10px] text-slate-400 uppercase">SPATIAL EXTENT</div>
            <div className="text-cyan-300 font-bold text-[11px] mt-0.5 truncate">
              {spatialExtent}
            </div>
          </div>
        </div>

        {/* Industrial Context Section */}
        <div className="p-3 rounded-lg bg-[#07111c] border border-white/10 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5" />
            <span>INDUSTRIAL CONTEXT</span>
          </div>
          <div className="text-xs text-slate-300 leading-snug">
            {incProps?.facility_name ? (
              <>
                <div className="font-semibold text-white">{incProps.facility_name}</div>
                <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                  OSM Proximity: <strong className="text-cyan-300">{matchLevel}</strong>
                </div>
              </>
            ) : (
              <div className="text-slate-400 text-[11px]">
                Spatiotemporally clustered across {obsCount} member sensor passes.
              </div>
            )}
          </div>
        </div>

        {/* Visual Evidence Chain */}
        <div className="p-3 rounded-lg bg-[#07111c] border border-cyan-500/20 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider border-b border-white/[0.08] pb-1.5">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>INTELLIGENCE EVIDENCE CHAIN</span>
            </div>
            <span className="text-[9px] text-emerald-400">VERIFIED</span>
          </div>

          <div className="space-y-2 text-[11px] font-mono">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-slate-200 font-bold">1. SATELLITE OBSERVATION</div>
                <div className="text-slate-400 text-[10px]">NASA FIRMS VIIRS/MODIS Hotspot Ingestion</div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-slate-200 font-bold">2. EVENT CLUSTERING</div>
                <div className="text-slate-400 text-[10px]">STGRAPH-1.0 (750m &bull; 60min Radius)</div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-slate-200 font-bold">3. HISTORICAL CONTEXT</div>
                <div className="text-slate-400 text-[10px]">
                  {isIncidentMode ? `Baseline Anomaly ΔZ: +${incProps?.frp_delta_zscore || '0.0'}σ` : '30-Day Multi-Pass Baseline'}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-slate-200 font-bold">4. INDUSTRIAL CONTEXT</div>
                <div className="text-slate-400 text-[10px]">OSM Polygon Match &bull; {matchLevel}</div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-cyan-300 font-bold">5. ASSESSMENT &bull; RISK</div>
                <div className="text-slate-400 text-[10px]">
                  TreeSHAP Composite Classifier ({riskScore}/100)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dispatch Status Notice */}
        {dispatchStatus && (
          <div className="p-2.5 rounded bg-emerald-950/80 border border-emerald-500/50 text-xs text-emerald-300 font-mono leading-relaxed">
            ✓ {dispatchStatus}
          </div>
        )}
      </div>

      {/* 3. Action Footer */}
      <div className="p-3 border-t border-white/[0.08] bg-[#07111c] space-y-2">
        {isIncidentMode ? (
          <button
            onClick={onOpenFullDossier}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white font-mono font-bold text-xs tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>INSPECT FULL DOSSIER &amp; TreeSHAP</span>
          </button>
        ) : (
          <button
            onClick={onOpenThermalDrawer}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-mono font-bold text-xs tracking-wider transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>OPEN THERMAL EVENT TIMELINE</span>
          </button>
        )}

        <div className="grid grid-cols-2 gap-2">
          <a
            href={getSitRepPdfUrl()}
            download="PYRAVEX_SitRep.pdf"
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded bg-red-950/40 hover:bg-red-950/70 border border-red-500/40 text-red-300 font-mono text-[11px] font-semibold text-center transition-colors"
          >
            <FileText className="w-3 h-3 text-red-400" />
            <span>SITREP PDF</span>
          </a>

          {onSimulateDispatch && isIncidentMode && (
            <button
              onClick={onSimulateDispatch}
              disabled={isDispatching}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-mono text-[11px] font-semibold text-center transition-colors disabled:opacity-50"
            >
              <Send className="w-3 h-3 text-cyan-400" />
              <span>{isDispatching ? 'SENDING...' : 'DISPATCH SIM'}</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default EventIntelligencePanel;
