import React, { useState, useEffect } from 'react';
import { TopNav } from './components/TopNav';
import { TriageRail } from './components/TriageRail';
import { MapCanvas } from './components/MapCanvas';
import { EvidenceDrawer } from './components/EvidenceDrawer';
import { LayerControl } from './components/LayerControl';
import { CorridorBar } from './components/CorridorBar';
import { TimelineScrubber } from './components/TimelineScrubber';
import type { 
  IncidentFeature, 
  FacilityFeature, 
  ScenarioItem, 
  DashboardStats, 
  InvestigationDossier 
} from './types/incident';
import { 
  fetchIncidentFeed, 
  fetchFacilities, 
  fetchDashboardStats, 
  fetchScenarios, 
  fetchInvestigationDossier,
  simulateScenario 
} from './services/api';

export const App: React.FC = () => {
  const [incidents, setIncidents] = useState<IncidentFeature[]>([]);
  const [facilities, setFacilities] = useState<FacilityFeature[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioItem[]>([]);
  
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [activeDossier, setActiveDossier] = useState<InvestigationDossier | null>(null);
  const [flyToCoords, setFlyToCoords] = useState<[number, number] | null>(null);
  const [flyToZoom, setFlyToZoom] = useState<number>(15);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [selectedPassTime, setSelectedPassTime] = useState<string>('all');

  const [layersVisible, setLayersVisible] = useState({
    hotspots: true,
    plumes: true,
    facilities: true,
    footprints: true
  });

  const loadData = async () => {
    try {
      const [feedRes, facRes, statsRes, scenRes] = await Promise.all([
        fetchIncidentFeed(0),
        fetchFacilities(),
        fetchDashboardStats(),
        fetchScenarios()
      ]);
      setIncidents(feedRes.features);
      setFacilities(facRes.features);
      setStats(statsRes);
      setScenarios(scenRes);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Handle selecting an incident to investigate (Zooms directly to tactical scale)
  const handleSelectIncident = async (id: string) => {
    setSelectedIncidentId(id);
    try {
      const dossier = await fetchInvestigationDossier(id);
      setActiveDossier(dossier);
      setFlyToZoom(15.5);
      setFlyToCoords(dossier.coordinates);
    } catch (err) {
      console.error('Failed to load dossier:', err);
    }
  };

  // Handle locating an incident without opening drawer
  const handleLocateIncident = (coords: [number, number]) => {
    setFlyToZoom(14.5);
    setFlyToCoords(coords);
  };

  // Quick jump to regional industrial corridors
  const handleFlyToCorridor = (coords: [number, number], zoom: number = 14) => {
    setFlyToZoom(zoom);
    setFlyToCoords(coords);
  };

  // Trigger SIH demonstration scenario
  const handleTriggerScenario = async (scenarioId: string) => {
    setIsSimulating(true);
    try {
      const res = await simulateScenario(scenarioId);
      await loadData();
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

  // Filter incidents if timeline scrubber is locked to a specific satellite overpass
  const displayIncidents = incidents.filter((inc) => {
    if (selectedPassTime === 'all') return true;
    return inc.properties.acq_time.startsWith(selectedPassTime.substring(0, 2));
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Top Mission Control Bar */}
      <TopNav
        stats={stats}
        scenarios={scenarios}
        onTriggerScenario={handleTriggerScenario}
        onRefresh={loadData}
        isSimulating={isSimulating}
      />

      {/* Main Workspace: Triage Rail + Map Canvas */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        <TriageRail
          incidents={displayIncidents}
          selectedIncidentId={selectedIncidentId}
          onSelectIncident={handleSelectIncident}
          onLocateIncident={handleLocateIncident}
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
            selectedIncidentId={selectedIncidentId}
            onSelectIncident={handleSelectIncident}
            flyToCoords={flyToCoords}
            flyToZoom={flyToZoom}
            layersVisible={layersVisible}
          />

          {/* Temporal Timeline Scrubber Bar */}
          <TimelineScrubber
            selectedPassTime={selectedPassTime}
            onSelectPassTime={setSelectedPassTime}
          />
        </div>

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
    </div>
  );
};

export default App;
