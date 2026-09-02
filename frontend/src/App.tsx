import React, { useState, useEffect } from 'react';
import { TopNav } from './components/TopNav';
import { TriageRail } from './components/TriageRail';
import { MapCanvas } from './components/MapCanvas';
import { EvidenceDrawer } from './components/EvidenceDrawer';
import { LayerControl } from './components/LayerControl';
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
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

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
      setFlyToCoords(dossier.coordinates);
    } catch (err) {
      console.error('Failed to load dossier:', err);
    }
  };

  const handleLocateIncident = (coords: [number, number]) => {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <TopNav
        stats={stats}
        scenarios={scenarios}
        onTriggerScenario={handleTriggerScenario}
        onRefresh={loadData}
        isSimulating={isSimulating}
      />

      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        <TriageRail
          incidents={incidents}
          selectedIncidentId={selectedIncidentId}
          onSelectIncident={handleSelectIncident}
          onLocateIncident={handleLocateIncident}
        />

        <div style={{ flex: 1, position: 'relative', height: '100%' }}>
          <LayerControl
            layers={layersVisible}
            onToggleLayer={handleToggleLayer}
          />

          <MapCanvas
            incidents={incidents}
            facilities={facilities}
            selectedIncidentId={selectedIncidentId}
            onSelectIncident={handleSelectIncident}
            flyToCoords={flyToCoords}
            layersVisible={layersVisible}
          />
        </div>

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
