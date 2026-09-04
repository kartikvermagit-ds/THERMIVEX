import type {
  ThermalEvent,
  ThermalEventListResponse,
  ThermalEventGeoJSONCollection,
  EventTimelineResponse,
  EventClusterRequest,
  EventClusterSummary
} from '../types/event';
import type { FirmsHotspotObservation } from '../types/firms';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/**
 * Triggers spatio-temporal graph clustering on FIRMS observations.
 */
export async function triggerEventClustering(
  params: EventClusterRequest = {}
): Promise<EventClusterSummary> {
  const res = await fetch(`${API_BASE}/events/cluster`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      spatial_threshold_m: params.spatial_threshold_m ?? 750.0,
      temporal_threshold_minutes: params.temporal_threshold_minutes ?? 60.0,
      date: params.date,
      start_date: params.start_date,
      end_date: params.end_date,
      is_demo: params.is_demo,
      algorithm_version: params.algorithm_version ?? 'STGRAPH-1.0'
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Clustering failed (${res.status}): ${errText}`);
  }
  return res.json();
}

/**
 * Lists persistent candidate thermal events.
 */
export async function fetchThermalEvents(filters: {
  date?: string;
  min_frp?: number;
  min_observations?: number;
  status?: string;
  is_demo?: boolean;
  bbox?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<ThermalEventListResponse> {
  const params = new URLSearchParams();
  if (filters.date) params.append('date', filters.date);
  if (filters.min_frp !== undefined) params.append('min_frp', filters.min_frp.toString());
  if (filters.min_observations !== undefined) params.append('min_observations', filters.min_observations.toString());
  if (filters.status) params.append('status', filters.status);
  if (filters.is_demo !== undefined) params.append('is_demo', filters.is_demo.toString());
  if (filters.bbox) params.append('bbox', filters.bbox);
  if (filters.limit !== undefined) params.append('limit', filters.limit.toString());
  if (filters.offset !== undefined) params.append('offset', filters.offset.toString());
  params.append('format', 'json');

  const res = await fetch(`${API_BASE}/events?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch events: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetches events in RFC 7946 GeoJSON format.
 */
export async function fetchThermalEventsGeoJSON(filters: {
  date?: string;
  min_frp?: number;
  bbox?: string;
  status?: string;
  is_demo?: boolean;
} = {}): Promise<ThermalEventGeoJSONCollection> {
  const params = new URLSearchParams();
  if (filters.date) params.append('date', filters.date);
  if (filters.min_frp !== undefined) params.append('min_frp', filters.min_frp.toString());
  if (filters.bbox) params.append('bbox', filters.bbox);
  if (filters.status) params.append('status', filters.status);
  if (filters.is_demo !== undefined) params.append('is_demo', filters.is_demo.toString());
  params.append('format', 'geojson');

  const res = await fetch(`${API_BASE}/events?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch events GeoJSON: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetches detailed thermal event by ID.
 */
export async function fetchThermalEventDetail(eventId: string): Promise<ThermalEvent> {
  const res = await fetch(`${API_BASE}/events/${eventId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch event ${eventId}: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetches chronological evolution timeline of member observations for an event.
 */
export async function fetchEventTimeline(eventId: string): Promise<EventTimelineResponse> {
  const res = await fetch(`${API_BASE}/events/${eventId}/timeline`);
  if (!res.ok) {
    throw new Error(`Failed to fetch timeline for event ${eventId}: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetches raw member FIRMS observations for an event.
 */
export async function fetchEventObservations(eventId: string): Promise<FirmsHotspotObservation[]> {
  const res = await fetch(`${API_BASE}/events/${eventId}/observations`);
  if (!res.ok) {
    throw new Error(`Failed to fetch observations for event ${eventId}: ${res.statusText}`);
  }
  return res.json();
}
