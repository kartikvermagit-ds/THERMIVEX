import type { 
  IncidentFeedResponse, 
  InvestigationDossier, 
  FacilityFeature, 
  ScenarioItem, 
  DashboardStats 
} from '../types/incident';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export async function fetchIncidentFeed(minRisk: number = 0): Promise<IncidentFeedResponse> {
  const res = await fetch(`${API_BASE}/incidents/feed?min_risk=${minRisk}`);
  if (!res.ok) throw new Error(`Feed error: ${res.statusText}`);
  return res.json();
}

export async function fetchInvestigationDossier(incidentId: string): Promise<InvestigationDossier> {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}/investigate`);
  if (!res.ok) throw new Error(`Dossier error: ${res.statusText}`);
  return res.json();
}

export async function fetchFacilities(): Promise<{ type: string; features: FacilityFeature[] }> {
  const res = await fetch(`${API_BASE}/facilities`);
  if (!res.ok) throw new Error(`Facilities error: ${res.statusText}`);
  return res.json();
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/incidents/stats`);
  if (!res.ok) throw new Error(`Stats error: ${res.statusText}`);
  return res.json();
}

export async function fetchScenarios(): Promise<ScenarioItem[]> {
  const res = await fetch(`${API_BASE}/pipeline/scenarios`);
  if (!res.ok) throw new Error(`Scenarios error: ${res.statusText}`);
  return res.json();
}

export async function simulateScenario(scenarioId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/pipeline/simulate/${scenarioId}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error(`Simulate error: ${res.statusText}`);
  return res.json();
}

export async function dispatchAlert(incidentId: string, recipient: string = "MIDC_FIRE_TENDER_01"): Promise<any> {
  const res = await fetch(`${API_BASE}/alerts/dispatch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      incident_id: incidentId,
      recipient: recipient,
      channel: 'TELEGRAM_BOT'
    })
  });
  if (!res.ok) throw new Error(`Dispatch error: ${res.statusText}`);
  return res.json();
}

export function getDossierPdfUrl(incidentId: string): string {
  return `${API_BASE}/reports/dossier/${incidentId}/pdf`;
}

export function getSitRepMarkdownUrl(): string {
  return `${API_BASE}/reports/sitrep/markdown`;
}

export function getGeoJsonExportUrl(): string {
  return `${API_BASE}/incidents/export/geojson`;
}
