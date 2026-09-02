import React, { useState, useEffect } from 'react';
import { TopNav } from './components/TopNav';
import { TriageRail } from './components/TriageRail';
import { MapCanvas } from './components/MapCanvas';
import { EvidenceDrawer } from './components/EvidenceDrawer';
import { LayerControl } from './components/LayerControl';
import { CorridorBar } from './components/CorridorBar';
import { TimelineScrubber } from './components/TimelineScrubber';
import { MapLegend } from './components/MapLegend';
import { SystemGuideModal } from './components/SystemGuideModal';
import { AboutPage } from './components/AboutPage';
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
  
  const [currentTab, setCurrentTab] = useState<'map' | 'about'>('map');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [activeDossier, setActiveDossier] = useState<InvestigationDossier | null>(null);
  const [flyToCoords, setFlyToCoords] = useState<[number, number] | null>(null);
  const [flyToZoom, setFlyToZoom] = useState<number>(15);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [selectedPassTime, setSelectedPassTime] = useState<string>('all');
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

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
      {/* Top Mission Control Bar with Navigation Tabs */}
      <TopNav
        stats={stats}
        scenarios={scenarios}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onTriggerScenario={handleTriggerScenario}
        onRefresh={loadData}
        onOpenGuide={() => setIsGuideOpen(true)}
        isSimulating={isSimulating}
      />

      {/* Main Content Area */}
      {currentTab === 'about' ? (
        <AboutPage onBackToMap={() => setCurrentTab('map')} />
      ) : (
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

            {/* Tactical Map Guide / Legend */}
            <MapLegend />

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
