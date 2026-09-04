import React, { useState, useEffect } from 'react';
import { TopNav } from './components/TopNav';
import { TriageRail } from './components/TriageRail';
import { MapCanvas } from './components/MapCanvas';
import { EvidenceDrawer } from './components/EvidenceDrawer';
import { ThermalEventDrawer } from './components/ThermalEventDrawer';
import { LayerControl } from './components/LayerControl';
import { CorridorBar } from './components/CorridorBar';
import { TimelineScrubber } from './components/TimelineScrubber';
import { MapLegend } from './components/MapLegend';
import { SystemGuideModal } from './components/SystemGuideModal';
import { AboutPage } from './components/AboutPage';
import { ClimateSlideStrip } from './components/ClimateSlideStrip';
import type { 
  IncidentFeature, 
  FacilityFeature, 
  ScenarioItem, 
  DashboardStats, 
  InvestigationDossier 
} from './types/incident';
import type { ClimateUpdateItem, ClimateQuickStats } from './types/climate';
import type { ThermalEvent, EventTimelineResponse, LatestClusteringRun } from './types/event';
import { 
  fetchIncidentFeed, 
  fetchFacilities, 
  fetchDashboardStats, 
  fetchScenarios, 
  fetchInvestigationDossier,
  simulateScenario 
} from './services/api';
import { fetchClimateFeed, DEFAULT_CLIMATE_UPDATES } from './services/climateService';
import { 
  fetchThermalEvents, 
  fetchThermalEventDetail, 
  fetchEventTimeline, 
  triggerEventClustering,
  fetchLatestClusteringRun
} from './services/eventsService';

export const App: React.FC = () => {
  const [incidents, setIncidents] = useState<IncidentFeature[]>([]);
  const [facilities, setFacilities] = useState<FacilityFeature[]>([]);
  const [thermalEvents, setThermalEvents] = useState<ThermalEvent[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioItem[]>([]);
  
  const [currentTab, setCurrentTab] = useState<'map' | 'about'>('map');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [activeDossier, setActiveDossier] = useState<InvestigationDossier | null>(null);

  // Phase 2 Thermal Event States
  const [selectedThermalEventId, setSelectedThermalEventId] = useState<string | null>(null);
  const [selectedThermalEvent, setSelectedThermalEvent] = useState<ThermalEvent | null>(null);
  const [eventTimeline, setEventTimeline] = useState<EventTimelineResponse | null>(null);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState<boolean>(false);
  const [isClusteringLoading, setIsClusteringLoading] = useState<boolean>(false);
  const [latestClusteringRun, setLatestClusteringRun] = useState<LatestClusteringRun | null>(null);

  const [flyToCoords, setFlyToCoords] = useState<[number, number] | null>(null);
  const [flyToZoom, setFlyToZoom] = useState<number>(15);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [selectedPassTime, setSelectedPassTime] = useState<string>('all');
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [climateUpdates, setClimateUpdates] = useState<ClimateUpdateItem[]>(DEFAULT_CLIMATE_UPDATES);
  const [climateQuickStats, setClimateQuickStats] = useState<ClimateQuickStats>({
    windSpeedKmh: 16.4,
    windBearing: 'NW (315°)',
    totalEstCo2eFluxTph: 41.8,
    ch4RegionalPpb: 1918,
    maxFRPAnomalyMw: 24.5,
    activePlumesCount: 3,
    glintSuppressionPct: 100
  });

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

      // First beep (880 Hz)
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

      // Second beep (1320 Hz)
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

      // Load synthesized / real-time climate telemetry feed
      const climateRes = await fetchClimateFeed(feedRes.features, statsRes);
      setClimateUpdates(climateRes.updates);
      setClimateQuickStats(climateRes.quickStats);
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
    // Dismiss thermal event drawer if open to avoid panel collisions
    setSelectedThermalEvent(null);
    setSelectedThermalEventId(null);
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
    // Dismiss incident dossier if open
    setSelectedIncidentId(null);
    setActiveDossier(null);

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

  const displayIncidents = incidents.filter((inc) => {
    if (selectedPassTime === 'all') return true;
    return inc.properties.acq_time.startsWith(selectedPassTime.substring(0, 2));
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Top Mission Control Bar with Navigation Tabs & Sound Toggle */}
      <TopNav
        stats={stats}
        scenarios={scenarios}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onTriggerScenario={handleTriggerScenario}
        onRefresh={loadData}
        onOpenGuide={() => setIsGuideOpen(true)}
        isSimulating={isSimulating}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
      />

      {/* Main Content Area */}
      {currentTab === 'about' ? (
        <AboutPage onBackToMap={() => setCurrentTab('map')} />
      ) : (
        <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
          <TriageRail
            incidents={displayIncidents}
            thermalEvents={thermalEvents}
            selectedIncidentId={selectedIncidentId}
            selectedThermalEventId={selectedThermalEventId}
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

          <div style={{ flex: 1, position: 'relative', height: '100%' }}>
            {/* Layer Control Pill Strip */}
            <LayerControl
              layers={layersVisible}
              onToggleLayer={handleToggleLayer}
            />

            {/* Regional Corridor Quick-Jump Bar */}
            <CorridorBar
              onFlyTo={handleFlyToCorridor}
            />

            {/* Main Leaflet/Esri Map */}
            <MapCanvas
              incidents={displayIncidents}
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

            {/* Tactical Map Guide / Legend */}
            <MapLegend />

            {/* Temporal Timeline Scrubber Bar */}
            <TimelineScrubber
              selectedPassTime={selectedPassTime}
              onSelectPassTime={setSelectedPassTime}
            />

            {/* Real-Time Climate & Atmospheric Intelligence Slide Strip */}
            <ClimateSlideStrip
              updates={climateUpdates}
              quickStats={climateQuickStats}
              onFlyToCorridor={handleFlyToCorridor}
            />
          </div>

          {/* Slide-over Thermal Event Intelligence Drawer */}
          {selectedThermalEvent && (
            <ThermalEventDrawer
              event={selectedThermalEvent}
              timeline={eventTimeline}
              isLoadingTimeline={isLoadingTimeline}
              onClose={() => {
                setSelectedThermalEvent(null);
                setSelectedThermalEventId(null);
                setEventTimeline(null);
              }}
              onInspectCorrelatedIncident={(title) => {
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

          {/* Slide-over Evidence Investigation Drawer */}
          {activeDossier && (
            <EvidenceDrawer
              dossier={activeDossier}
              onClose={() => {
                setActiveDossier(null);
                setSelectedIncidentId(null);
              }}
            />
          )}
        </div>
      )}

      {/* How It Works / System Guide Modal */}
      <SystemGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
};

export default App;
