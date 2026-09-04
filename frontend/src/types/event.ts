export type ThermalEventStatus = 'CANDIDATE' | 'ACTIVE' | 'CLOSED' | 'SUPPRESSED';

export type EventTimelineStage =
  | 'INITIAL'
  | 'FORMING'
  | 'PERSISTING'
  | 'ESCALATING'
  | 'COOLING'
  | 'CLOSED';

export interface EventObservationSummary {
  hotspot_id: string;
  latitude: number;
  longitude: number;
  observed_at: string;
  frp: number;
  brightness_temperature: number;
  satellite: string;
  instrument: string;
  confidence?: string | null;
  distance_to_centroid_m: number;
}

export interface ThermalEvent {
  id: string;
  event_fingerprint: string;
  title: string;
  first_observed_at: string;
  last_observed_at: string;
  duration_minutes: number;
  centroid_latitude: number;
  centroid_longitude: number;
  peak_observation_id?: string | null;
  peak_latitude?: number | null;
  peak_longitude?: number | null;
  convex_hull_geojson?: string | null;
  bounding_box_geojson?: string | null;
  spatial_extent_km2: number;
  observation_count: number;
  frp_total_mw: number;
  frp_peak_mw: number;
  frp_mean_mw: number;
  frp_median_mw: number;
  max_brightness_kelvin: number;
  cluster_confidence: number;
  cluster_quality?: string | null;
  status: ThermalEventStatus;
  is_demo: boolean;
  clustering_algorithm_version: string;
  clustering_run_id?: string | null;
  created_at: string;
  updated_at: string;
  observations?: EventObservationSummary[];
}

export interface ThermalEventListResponse {
  total_count: number;
  events: ThermalEvent[];
}

export interface ThermalEventGeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: string;
    coordinates: any;
  };
  properties: Record<string, any>;
}

export interface ThermalEventGeoJSONCollection {
  type: 'FeatureCollection';
  total_count: number;
  features: ThermalEventGeoJSONFeature[];
}

export interface EventTimelineItem {
  step: number;
  observed_at: string;
  hotspot_id: string;
  cumulative_observation_count: number;
  cumulative_frp_total_mw: number;
  current_frp_peak_mw: number;
  previous_frp_peak_mw?: number | null;
  frp_delta_percent?: number | null;
  time_since_previous_minutes?: number | null;
  spatial_extent_km2: number;
  spatial_extent_delta_km2?: number | null;
  new_observations: number;
  stage: EventTimelineStage;
  satellite: string;
  instrument: string;
  latitude: number;
  longitude: number;
  frp: number;
  cluster_confidence?: number | null;
}

export interface EventTimelineResponse {
  event_id: string;
  first_observed_at: string;
  last_observed_at: string;
  total_observations: number;
  timeline: EventTimelineItem[];
}

export interface EventClusterRequest {
  spatial_threshold_m?: number;
  temporal_threshold_minutes?: number;
  date?: string;
  start_date?: string;
  end_date?: string;
  is_demo?: boolean;
  algorithm_version?: string;
}

export interface EventClusterSummary {
  run_id: string;
  algorithm: string;
  algorithm_version: string;
  spatial_threshold_m: number;
  temporal_threshold_minutes: number;
  observations_considered: number;
  events_created: number;
  events_updated: number;
  observations_unclustered: number;
  events_suppressed: number;
  duration_seconds: number;
  status: string;
}

export interface LatestClusteringRun {
  id?: string;
  algorithm?: string;
  algorithm_version?: string;
  spatial_threshold_m?: number;
  temporal_threshold_minutes?: number;
  observations_considered?: number;
  events_created?: number;
  events_updated?: number;
  started_at?: string | null;
  completed_at?: string | null;
  status: string;
  stale_after_minutes: number;
  run_age_seconds: number | null;
  is_stale: boolean;
}
