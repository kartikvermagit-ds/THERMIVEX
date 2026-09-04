from datetime import datetime
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, ConfigDict

# Strict Event Timeline Stage
EventTimelineStageType = Literal[
    "INITIAL",
    "FORMING",
    "PERSISTING",
    "ESCALATING",
    "COOLING",
    "CLOSED"
]

class EventClusterRequest(BaseModel):
    spatial_threshold_m: float = Field(750.0, ge=50.0, le=10000.0, description="Spatial distance threshold in meters")
    temporal_threshold_minutes: float = Field(60.0, ge=5.0, le=1440.0, description="Temporal window threshold in minutes")
    date: Optional[str] = Field(None, description="Optional acquisition date filter (YYYY-MM-DD)")
    start_date: Optional[str] = Field(None, description="Optional start acquisition date (YYYY-MM-DD)")
    end_date: Optional[str] = Field(None, description="Optional end acquisition date (YYYY-MM-DD)")
    is_demo: Optional[bool] = Field(None, description="Filter for demo or production observations")
    algorithm_version: str = Field("STGRAPH-1.0", description="Clustering algorithm version tag")

class EventClusterSummary(BaseModel):
    run_id: str
    algorithm: str
    algorithm_version: str
    spatial_threshold_m: float
    temporal_threshold_minutes: float
    observations_considered: int
    events_created: int
    events_updated: int
    observations_unclustered: int = 0
    events_suppressed: int = 0
    duration_seconds: float
    status: str

class EventObservationSummary(BaseModel):
    hotspot_id: str
    latitude: float
    longitude: float
    observed_at: datetime
    frp: float
    brightness_temperature: float
    satellite: str
    instrument: str
    confidence: Optional[str] = None
    distance_to_centroid_m: float

    model_config = ConfigDict(from_attributes=True)

class ThermalEventResponse(BaseModel):
    id: str
    event_fingerprint: str
    title: str
    first_observed_at: datetime
    last_observed_at: datetime
    duration_minutes: float
    centroid_latitude: float
    centroid_longitude: float
    peak_observation_id: Optional[str] = None
    peak_latitude: Optional[float] = None
    peak_longitude: Optional[float] = None
    convex_hull_geojson: Optional[str] = None
    bounding_box_geojson: Optional[str] = None
    spatial_extent_km2: float
    observation_count: int
    frp_total_mw: float
    frp_peak_mw: float
    frp_mean_mw: float
    frp_median_mw: float
    max_brightness_kelvin: float
    cluster_confidence: float
    cluster_quality: Optional[str] = None
    status: str
    is_demo: bool
    clustering_algorithm_version: str
    clustering_run_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    observations: Optional[List[EventObservationSummary]] = None

    model_config = ConfigDict(from_attributes=True)

class ThermalEventListResponse(BaseModel):
    total_count: int
    events: List[ThermalEventResponse]

class ThermalEventGeoJSONFeature(BaseModel):
    type: str = "Feature"
    geometry: Dict[str, Any]
    properties: Dict[str, Any]

class ThermalEventGeoJSONCollection(BaseModel):
    type: str = "FeatureCollection"
    total_count: int
    features: List[ThermalEventGeoJSONFeature]

class EventTimelineItem(BaseModel):
    step: int
    observed_at: datetime
    hotspot_id: str
    cumulative_observation_count: int
    cumulative_frp_total_mw: float
    current_frp_peak_mw: float
    previous_frp_peak_mw: Optional[float] = None
    frp_delta_percent: Optional[float] = None
    time_since_previous_minutes: Optional[float] = None
    spatial_extent_km2: float
    spatial_extent_delta_km2: Optional[float] = None
    new_observations: int
    stage: EventTimelineStageType
    satellite: str
    instrument: str
    latitude: float
    longitude: float
    frp: float
    cluster_confidence: Optional[float] = None

class EventTimelineResponse(BaseModel):
    event_id: str
    first_observed_at: datetime
    last_observed_at: datetime
    total_observations: int
    timeline: List[EventTimelineItem]
