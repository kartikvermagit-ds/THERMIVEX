export interface FirmsHotspotObservation {
  id: string;
  observation_hash: string;
  latitude: number;
  longitude: number;
  acquisition_date: string;
  acquisition_time: string;
  observed_at: string;
  satellite: string;
  instrument: string;
  confidence?: string | null;
  brightness_temperature: number;
  bright_ti5_or_t31?: number | null;
  frp: number;
  day_night: "D" | "N";
  source: string;
  is_demo: boolean;
  source_file?: string | null;
  ingested_at: string;
  raw_properties?: string | null;
}

export interface FirmsHotspotListResponse {
  total_count: number;
  hotspots: FirmsHotspotObservation[];
}

export interface FirmsHotspotGeoJSONFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: FirmsHotspotObservation;
}

export interface FirmsHotspotGeoJSONCollection {
  type: "FeatureCollection";
  total_count: number;
  features: FirmsHotspotGeoJSONFeature[];
}

export interface FirmsIngestSummary {
  records_read: number;
  records_inserted: number;
  duplicates_skipped: number;
  invalid_records: number;
  errors: string[];
}

export interface FirmsHotspotFilterParams {
  date?: string;
  satellite?: string;
  instrument?: string;
  min_frp?: number;
  day_night?: "D" | "N";
  source?: string;
  is_demo?: boolean;
  bbox?: string; // min_lon,min_lat,max_lon,max_lat
  limit?: number;
  offset?: number;
}
