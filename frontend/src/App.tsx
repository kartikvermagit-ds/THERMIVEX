import React, { useState, useEffect } from 'react';
import { TopNav } from './components/TopNav';
import { TriageRail } from './components/TriageRail';
import { MapCanvas } from './components/MapCanvas';
import { EventIntelligencePanel } from './components/EventIntelligencePanel';
import { EvidenceDrawer } from './components/EvidenceDrawer';
import { ThermalEventDrawer } from './components/ThermalEventDrawer';
import { BottomTelemetryBar } from './components/BottomTelemetryBar';
import { LayerControl } from './components/LayerControl';
import { CorridorBar } from './components/CorridorBar';
import { MapLegend } from './components/MapLegend';
import { SystemGuideModal } from './components/SystemGuideModal';
import { AboutPage } from './components/AboutPage';
import { NoiseBackgroundDemo } from './components/NoiseBackgroundDemo';
import { Satellite } from 'lucide-react';
import type { 
  IncidentFeature, 
  FacilityFeature, 
  ScenarioItem, 
  DashboardStats, 
  InvestigationDossier 
} from './types/incident';
import type { ThermalEvent, EventTimelineResponse, LatestClusteringRun } from './types/event';
import { 
  fetchIncidentFeed, 
  fetchFacilities, 
  fetchDashboardStats, 
  fetchScenarios, 
  fetchInvestigationDossier,
  simulateScenario,
  dispatchAlert 
} from './services/api';
import { 
  fetchThermalEvents, 
  fetchThermalEventDetail, 
  fetchEventTimeline, 
  triggerEventClustering,
  fetchLatestClusteringRun
} from './services/eventsService';

export const App: React.FC = () => {
  const [showLogin, setShowLogin] = useState<boolean>(true);
  const [incidents, setIncidents] = useState<IncidentFeature[]>([]);
  const [facilities, setFacilities] = useState<FacilityFeature[]>([]);
  const [thermalEvents, setThermalEvents] = useState<ThermalEvent[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioItem[]>([]);
  
  // Navigation & View Mode
  const [currentTab, setCurrentTab] = useState<'map' | 'about' | 'events'>('map');
  const [railTab, setRailTab] = useState<'incidents' | 'events'>('incidents');

  // Selected State
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [activeDossier, setActiveDossier] = useState<InvestigationDossier | null>(null);
  const [showFullDossierModal, setShowFullDossierModal] = useState<boolean>(false);

  // Phase 2 Thermal Event States
  const [selectedThermalEventId, setSelectedThermalEventId] = useState<string | null>(null);
  const [selectedThermalEvent, setSelectedThermalEvent] = useState<ThermalEvent | null>(null);
  const [showThermalDrawer, setShowThermalDrawer] = useState<boolean>(false);
  const [eventTimeline, setEventTimeline] = useState<EventTimelineResponse | null>(null);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState<boolean>(false);
  const [isClusteringLoading, setIsClusteringLoading] = useState<boolean>(false);
  const [latestClusteringRun, setLatestClusteringRun] = useState<LatestClusteringRun | null>(null);

  // Dispatch simulation state
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  const [flyToCoords, setFlyToCoords] = useState<[number, number] | null>(null);
  const [flyToZoom, setFlyToZoom] = useState<number>(15);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const [layersVisible, setLayersVisible] = useState({
    hotspots: true,
    plumes: true,
    facilities: true,
    footprints: true,
    thermalEvents: true,
    rawObservations: true
  });

  const playTacticalAlertChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      gain1.gain.setValueAtTime(0.25, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.12);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.14);
      gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.14);
      osc2.stop(ctx.currentTime + 0.28);
    } catch (e) {
      // Ignored if autoplay blocked
    }
  };

  const loadData = async () => {
    try {
      const [feedRes, facRes, statsRes, scenRes, eventsRes, latestRunRes] = await Promise.all([
        fetchIncidentFeed(0),
        fetchFacilities(),
        fetchDashboardStats(),
        fetchScenarios(),
        fetchThermalEvents({ limit: 100 }).catch(() => ({ total_count: 0, events: [] })),
        fetchLatestClusteringRun().catch(() => ({
          status: 'NO_RUNS_RECORDED',
          stale_after_minutes: 30,
          run_age_seconds: null,
          is_stale: false
        }))
      ]);
      setIncidents(feedRes.features);
      setFacilities(facRes.features);
      setStats(statsRes);
      setScenarios(scenRes);
      setThermalEvents(eventsRes.events || []);
      setLatestClusteringRun(latestRunRes);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectIncident = async (id: string) => {
    setSelectedIncidentId(id);
    setSelectedThermalEvent(null);
    setSelectedThermalEventId(null);
    setShowThermalDrawer(false);
    setEventTimeline(null);

    try {
      const dossier = await fetchInvestigationDossier(id);
      setActiveDossier(dossier);
      setFlyToZoom(15.5);
      setFlyToCoords(dossier.coordinates);
    } catch (err) {
      console.error('Failed to load dossier:', err);
    }
  };

  const handleSelectThermalEvent = async (id: string) => {
    setSelectedThermalEventId(id);
    setSelectedIncidentId(null);
    setActiveDossier(null);
    setShowFullDossierModal(false);

    const localEv = thermalEvents.find(e => e.id === id);
    if (localEv) {
      setSelectedThermalEvent(localEv);
      setFlyToZoom(15);
      setFlyToCoords([localEv.centroid_longitude, localEv.centroid_latitude]);
    }

    setIsLoadingTimeline(true);
    try {
      const [detail, tl] = await Promise.all([
        fetchThermalEventDetail(id),
        fetchEventTimeline(id)
      ]);
      setSelectedThermalEvent(detail);
      setEventTimeline(tl);
    } catch (err) {
      console.error('Failed to load thermal event timeline:', err);
    } finally {
      setIsLoadingTimeline(false);
    }
  };

  const handleTriggerClustering = async () => {
    setIsClusteringLoading(true);
    try {
      await triggerEventClustering({
        spatial_threshold_m: 750.0,
        temporal_threshold_minutes: 60.0,
        algorithm_version: 'STGRAPH-1.0'
      });
      await loadData();
      playTacticalAlertChime();
    } catch (err) {
      console.error('Clustering execution failed:', err);
    } finally {
      setIsClusteringLoading(false);
    }
  };

  const handleSimulateDispatch = async () => {
    if (!selectedIncidentId) return;
    setIsDispatching(true);
    try {
      await dispatchAlert(selectedIncidentId, "MIDC_EMERGENCY_DISPATCH_DESK");
      setDispatchStatus("DISPATCH SIMULATION TRANSMITTED TO LOCAL FOAM TENDERS (SIMULATION LOGGED)");
      setTimeout(() => setDispatchStatus(null), 6000);
      playTacticalAlertChime();
    } catch (err) {
      setDispatchStatus("DISPATCH TRANSMISSION FAILED");
    } finally {
      setIsDispatching(false);
    }
  };

  const handleLocateIncident = (coords: [number, number]) => {
    setFlyToZoom(14.5);
    setFlyToCoords(coords);
  };

  const handleFlyToCorridor = (coords: [number, number], zoom: number = 14) => {
    setFlyToZoom(zoom);
    setFlyToCoords(coords);
  };

  const handleTriggerScenario = async (scenarioId: string) => {
    setIsSimulating(true);
    try {
      const res = await simulateScenario(scenarioId);
      await loadData();
      playTacticalAlertChime();
      if (res.incident_id) {
        handleSelectIncident(res.incident_id);
      }
    } catch (err) {
      console.error('Scenario simulation failed:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleToggleLayer = (layerName: keyof typeof layersVisible) => {
    setLayersVisible((prev) => ({
      ...prev,
      [layerName]: !prev[layerName]
    }));
  };

  const handleTopNavTab = (tab: 'map' | 'about' | 'events') => {
    setCurrentTab(tab);
    if (tab === 'events') {
      setRailTab('events');
      setLayersVisible(prev => ({ ...prev, thermalEvents: true }));
      if (thermalEvents.length > 0 && !selectedThermalEventId) {
        handleSelectThermalEvent(thermalEvents[0].id);
      }
    } else if (tab === 'map') {
      setRailTab('incidents');
    }
  };

  const selectedIncidentFeature = incidents.find(i => i.properties.id === selectedIncidentId) || null;
  const isItemSelected = !!selectedIncidentFeature || !!selectedThermalEvent;

  if (showLogin) {
    return <NoiseBackgroundDemo onContinue={() => setShowLogin(false)} />;
  }

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-[#050b14] text-slate-100 select-none">
      {/* 1. Top Command Header (50px) */}
      <TopNav
        stats={stats}
        scenarios={scenarios}
        currentTab={currentTab}
        onSelectTab={handleTopNavTab}
        onTriggerScenario={handleTriggerScenario}
        onRefresh={loadData}
        onOpenGuide={() => setIsGuideOpen(true)}
        isSimulating={isSimulating}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
      />

      {/* 2. Main Workspace Layout */}
      {currentTab === 'about' ? (
        <AboutPage onBackToMap={() => handleTopNavTab('map')} />
      ) : (
        <div className="flex flex-1 relative overflow-hidden">
          {/* Left Incident / Event Triage Rail (340–360px) */}
          <TriageRail
            incidents={incidents}
            thermalEvents={thermalEvents}
            selectedIncidentId={selectedIncidentId}
            selectedThermalEventId={selectedThermalEventId}
            activeTab={railTab}
            onTabChange={setRailTab}
            onSelectIncident={handleSelectIncident}
            onSelectThermalEvent={handleSelectThermalEvent}
            onLocateIncident={handleLocateIncident}
            onLocateThermalEvent={(coords) => {
              setFlyToZoom(15);
              setFlyToCoords(coords);
            }}
            onTriggerClustering={handleTriggerClustering}
            isClusteringLoading={isClusteringLoading}
            latestClusteringRun={latestClusteringRun}
          />

          {/* Center Map Hero (dominant workspace, flex: 1) */}
          <main className="flex-1 relative h-full">
            {/* Layer Control Pill Strip */}
            <LayerControl
              layers={layersVisible}
              onToggleLayer={handleToggleLayer}
            />

            {/* Regional Corridor Quick-Jump Bar */}
            <CorridorBar
              onFlyTo={handleFlyToCorridor}
            />

            {/* Main Satellite Basemap & Vector Overlays */}
            <MapCanvas
              incidents={incidents}
              facilities={facilities}
              thermalEvents={thermalEvents}
              selectedIncidentId={selectedIncidentId}
              selectedThermalEventId={selectedThermalEventId}
              onSelectIncident={handleSelectIncident}
              onSelectThermalEvent={handleSelectThermalEvent}
              flyToCoords={flyToCoords}
              flyToZoom={flyToZoom}
              layersVisible={layersVisible}
            />

            {/* Floating Map Legend Button (bottom-left) */}
            <MapLegend />

            {/* Subtle Floating Prompt when nothing is selected */}
            {!isItemSelected && (
              <div className="hidden lg:flex absolute top-4 right-4 z-[350] items-center gap-2.5 px-3.5 py-2 rounded-lg bg-[#050b14]/85 border border-cyan-500/25 backdrop-blur-md text-xs font-mono text-slate-300 shadow-xl pointer-events-none">
                <Satellite className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>SELECT AN EVENT OR INCIDENT TO INSPECT INTELLIGENCE</span>
              </div>
            )}

            {/* Right-Side Event Intelligence Panel (Overlay Drawer when selected) */}
            <EventIntelligencePanel
              selectedIncident={selectedIncidentFeature}
              selectedDossier={activeDossier}
              selectedThermalEvent={selectedThermalEvent}
              onClose={() => {
                setSelectedIncidentId(null);
                setActiveDossier(null);
                setSelectedThermalEvent(null);
                setSelectedThermalEventId(null);
              }}
              onOpenFullDossier={() => setShowFullDossierModal(true)}
              onOpenThermalDrawer={() => setShowThermalDrawer(true)}
              onSimulateDispatch={handleSimulateDispatch}
              isDispatching={isDispatching}
              dispatchStatus={dispatchStatus}
            />
          </main>

          {/* Deep Thermal Event Timeline Drawer */}
          {showThermalDrawer && selectedThermalEvent && (
            <ThermalEventDrawer
              event={selectedThermalEvent}
              timeline={eventTimeline}
              isLoadingTimeline={isLoadingTimeline}
              onClose={() => setShowThermalDrawer(false)}
              onInspectCorrelatedIncident={(title) => {
                setShowThermalDrawer(false);
                const matched = incidents.find(i => 
                  title && i.properties.facility_name && (
                    title.toLowerCase().includes(i.properties.facility_name.toLowerCase()) ||
                    i.properties.facility_name.toLowerCase().includes(title.toLowerCase())
                  )
                );
                if (matched) {
                  handleSelectIncident(matched.properties.id);
                } else if (incidents.length > 0) {
                  handleSelectIncident(incidents[0].properties.id);
                }
              }}
            />
          )}

          {/* Deep Evidence Dossier Drawer (TreeSHAP & Gaussian Plume Analysis) */}
          {showFullDossierModal && activeDossier && (
            <EvidenceDrawer
              dossier={activeDossier}
              onClose={() => setShowFullDossierModal(false)}
            />
          )}
        </div>
      )}

      {/* 3. Operational Bottom Telemetry Strip (36px) */}
      <BottomTelemetryBar
        stats={stats}
        totalObservations={incidents.length > 0 ? incidents.length * 31 : 124}
        totalEvents={thermalEvents.length}
      />

      {/* System Guide Modal */}
      <SystemGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
};

export default App;
