export interface IncidentProperties {
  id: string;
  acq_date: string;
  acq_time: string;
  satellite: string;
  daynight: string;
  frp_total: number;
  bright_ti4_max: number;
  bright_ti5_min: number;
  temp_differential: number;
  classification: string;
  confidence: number;
  risk_score: number;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  facility_name: string | null;
  dist_to_facility_m: number;
  spatial_match_level: "DIRECT_HIT" | "PERIMETER" | "VICINITY" | "NONE";
  persistence_index: number;
  frp_delta_zscore: number;
  footprint_geometry?: any;
  plume_geometry?: any;
}

export interface IncidentFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lon, lat]
  };
  properties: IncidentProperties;
}

export interface IncidentFeedResponse {
  type: "FeatureCollection";
  total_count: number;
  features: IncidentFeature[];
}

export interface SHAPFactor {
  factor: string;
  impact: string;
  detail: string;
}

export interface InvestigationDossier {
  incident_id: string;
  timestamp_utc: string;
  coordinates: [number, number];
  sensor: {
    satellite: string;
    pass_type: string;
    frp_mw: number;
    t4_kelvin: number;
    t5_kelvin: number;
    temp_diff_kelvin: number;
    pixel_count: number;
  };
  facility_context: {
    name: string;
    distance_m: number;
    spatial_match_level: string;
  };
  temporal_baseline: {
    baseline_mean_mw?: number;
    persistence_index_52w: number;
    frp_delta_zscore: number;
    recurrence_classification: string;
  };
  ai_classification: {
    label: string;
    confidence: number;
  };
  risk_assessment: {
    composite_risk_score: number;
    severity_label: string;
  };
  plume_dispersion: {
    geometry?: any;
    wind_speed_kmh: number;
    wind_bearing_deg: number;
    threat_zone: string;
  };
  explainability_tree_shap: SHAPFactor[];
  historical_30d_series?: { day: number; frp: number; is_current?: boolean }[];
  nearby_infrastructure?: { icon: string; label: string; distance: string; note: string }[];
  recommendation?: string;
  why_flagged_audit?: {
    overall_suspicion: string;
    checkpoints: { label: string; status: boolean; detail: string }[];
  };
}

export interface FacilityFeature {
  type: "Feature";
  geometry: {
    type: "Polygon" | "Point";
    coordinates: any;
  };
  properties: {
    id: number;
    osm_id: string;
    name: string;
    landuse: string;
    industrial_type: string;
    hazard_tier: number;
    centroid: [number, number];
  };
}

export interface ScenarioItem {
  scenario_id: string;
  title: string;
  description: string;
  expected_classification: string;
  expected_risk_tier: string;
  expected_risk_score: number;
}

export interface DashboardStats {
  total_active_events: number;
  critical_disasters: number;
  high_anomalies: number;
  routine_flaring: number;
  suppressed_false_positives: number;
}
