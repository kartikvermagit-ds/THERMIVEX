import type {
  FirmsHotspotListResponse,
  FirmsHotspotGeoJSONCollection,
  FirmsHotspotFilterParams,
  FirmsIngestSummary
} from '../types/firms';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/**
 * Fetches normalized spaceborne thermal hotspot observations as tabular list.
 */
export async function fetchFirmsHotspots(
  filters: FirmsHotspotFilterParams = {}
): Promise<FirmsHotspotListResponse> {
  const params = new URLSearchParams();
  if (filters.date) params.append('date', filters.date);
  if (filters.satellite) params.append('satellite', filters.satellite);
  if (filters.instrument) params.append('instrument', filters.instrument);
  if (filters.min_frp !== undefined) params.append('min_frp', filters.min_frp.toString());
  if (filters.day_night) params.append('day_night', filters.day_night);
  if (filters.source) params.append('source', filters.source);
  if (filters.is_demo !== undefined) params.append('is_demo', filters.is_demo.toString());
  if (filters.bbox) params.append('bbox', filters.bbox);
  if (filters.limit !== undefined) params.append('limit', filters.limit.toString());
  if (filters.offset !== undefined) params.append('offset', filters.offset.toString());

  params.append('format', 'json');

  const res = await fetch(`${API_BASE}/firms/hotspots?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`FIRMS query failed: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetches normalized spaceborne thermal hotspot observations as RFC 7946 GeoJSON.
 */
export async function fetchFirmsHotspotsGeoJSON(
  filters: FirmsHotspotFilterParams = {}
): Promise<FirmsHotspotGeoJSONCollection> {
  const params = new URLSearchParams();
  if (filters.date) params.append('date', filters.date);
  if (filters.satellite) params.append('satellite', filters.satellite);
  if (filters.instrument) params.append('instrument', filters.instrument);
  if (filters.min_frp !== undefined) params.append('min_frp', filters.min_frp.toString());
  if (filters.day_night) params.append('day_night', filters.day_night);
  if (filters.source) params.append('source', filters.source);
  if (filters.is_demo !== undefined) params.append('is_demo', filters.is_demo.toString());
  if (filters.bbox) params.append('bbox', filters.bbox);
  if (filters.limit !== undefined) params.append('limit', filters.limit.toString());
  if (filters.offset !== undefined) params.append('offset', filters.offset.toString());

  params.append('format', 'geojson');

  const res = await fetch(`${API_BASE}/firms/hotspots?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`FIRMS GeoJSON query failed: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Imports FIRMS observations from an uploaded CSV or GeoJSON file.
 */
export async function importFirmsFile(
  file: File,
  sourceLabel: string = 'UPLOAD_FILE',
  isDemo: boolean = false
): Promise<FirmsIngestSummary> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('source_label', sourceLabel);
  formData.append('is_demo_flag', isDemo ? 'true' : 'false');

  const res = await fetch(`${API_BASE}/firms/import/file`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`FIRMS import failed (${res.status}): ${errorBody}`);
  }
  return res.json();
}

/**
 * Explicitly triggers seeding of standardized synthetic demo dataset.
 */
export async function importDemoFirmsData(): Promise<FirmsIngestSummary> {
  const res = await fetch(`${API_BASE}/firms/import/demo`, {
    method: 'POST'
  });
  if (!res.ok) {
    throw new Error(`Demo import failed: ${res.statusText}`);
  }
  return res.json();
}
