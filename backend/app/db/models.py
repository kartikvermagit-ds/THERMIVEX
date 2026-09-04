import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.session import Base

def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)

class IndustrialFacility(Base):
    __tablename__ = "industrial_facilities"

    id = Column(Integer, primary_key=True, index=True)
    osm_id = Column(String(64), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False, default="Unidentified Industrial Facility")
    landuse = Column(String(64), default="industrial")
    industrial_type = Column(String(64), default="general")
    hazard_tier = Column(Integer, default=3) # 1 (Low) to 5 (Ultra Hazardous)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    geometry_geojson = Column(Text, nullable=True) # GeoJSON string for polygon/multipolygon
    created_at = Column(DateTime, default=utc_now)

    incidents = relationship("IncidentEvent", back_populates="facility")

class IncidentEvent(Base):
    __tablename__ = "incident_events"

    id = Column(String(64), primary_key=True, default=lambda: f"TX-{uuid.uuid4().hex[:8].upper()}")
    acq_date = Column(String(16), nullable=False, index=True)
    acq_time = Column(String(8), nullable=False)
    satellite = Column(String(32), default="NOAA-20")
    daynight = Column(String(4), default="N") # 'D' or 'N'
    
    # Radiometrics
    frp_total = Column(Float, nullable=False)
    bright_ti4_max = Column(Float, nullable=False)
    bright_ti5_min = Column(Float, nullable=False)
    temp_differential = Column(Float, nullable=False) # T4 - T5
    pixel_count = Column(Integer, default=1)
    
    # Facility matching
    facility_id = Column(Integer, ForeignKey("industrial_facilities.id"), nullable=True)
    facility_name = Column(String(255), nullable=True)
    dist_to_facility_m = Column(Float, default=9999.0)
    spatial_match_level = Column(String(32), default="NONE") # DIRECT_HIT, PERIMETER, VICINITY, NONE
    
    # Temporal Baseline
    persistence_index = Column(Float, default=0.0) # 0.0 to 1.0
    frp_delta_zscore = Column(Float, default=0.0)
    
    # Classification & Risk
    classification = Column(String(64), nullable=False)
    classification_confidence = Column(Float, default=0.90)
    risk_score = Column(Integer, nullable=False, index=True) # 0 to 100
    severity_label = Column(String(16), nullable=False, index=True) # CRITICAL, HIGH, MEDIUM, LOW
    
    # Spatial Point & Geometry
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    footprint_geojson = Column(Text, nullable=True)
    plume_geojson = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=utc_now, index=True)

    facility = relationship("IndustrialFacility", back_populates="incidents")
    alerts = relationship("AlertDispatch", back_populates="incident")

class AlertDispatch(Base):
    __tablename__ = "alert_dispatches"

    id = Column(String(64), primary_key=True, default=lambda: f"ALT-{uuid.uuid4().hex[:6].upper()}")
    incident_id = Column(String(64), ForeignKey("incident_events.id"), nullable=False)
    alert_tier = Column(String(16), nullable=False) # CRITICAL_RED, AMBER_WARNING
    channel = Column(String(32), default="TELEGRAM_BOT") # TELEGRAM_BOT, SMS, ERSS_CAD
    recipient = Column(String(128), default="EOC_DISPATCH_DESK")
    dispatch_status = Column(String(32), default="DELIVERED")
    payload_snapshot = Column(Text, nullable=True)
    dispatched_at = Column(DateTime, default=utc_now)

    incident = relationship("IncidentEvent", back_populates="alerts")

class FirmsHotspot(Base):
    __tablename__ = "firms_hotspots"

    id = Column(String(64), primary_key=True, default=lambda: f"FIRM-{uuid.uuid4().hex[:10].upper()}")
    observation_hash = Column(String(64), unique=True, index=True, nullable=False)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    acquisition_date = Column(String(16), nullable=False, index=True) # YYYY-MM-DD
    acquisition_time = Column(String(8), nullable=False)              # HHMM UTC
    observed_at = Column(DateTime, nullable=False, index=True)        # UTC timestamp
    satellite = Column(String(32), nullable=False, index=True)        # Normalized string
    instrument = Column(String(32), nullable=False, index=True)       # VIIRS, MODIS, etc.
    confidence = Column(String(32), nullable=True)                    # nominal, high, low, or numeric
    brightness_temperature = Column(Float, nullable=False)            # Primary band Kelvin (bright_ti4 / brightness)
    bright_ti5_or_t31 = Column(Float, nullable=True)                  # Secondary band Kelvin (bright_ti5 / bright_t31)
    frp = Column(Float, nullable=False, default=0.0)                  # Fire Radiative Power in MW
    day_night = Column(String(4), nullable=False, default="N")        # 'D' or 'N'
    source = Column(String(32), nullable=False, default="DEMO_DATA", index=True) # DEMO_DATA, UPLOAD_CSV, UPLOAD_GEOJSON, NASA_FIRMS_NRT
    is_demo = Column(Boolean, nullable=False, default=False, index=True)
    source_file = Column(String(255), nullable=True)
    raw_properties = Column(Text, nullable=True)                      # JSON string of raw sensor attributes
    ingested_at = Column(DateTime, default=utc_now, nullable=False)

    event_links = relationship("EventObservationLink", back_populates="hotspot", cascade="all, delete-orphan")

class ClusteringRun(Base):
    __tablename__ = "clustering_runs"

    id = Column(String(64), primary_key=True)
    algorithm = Column(String(64), default="SPATIO_TEMPORAL_GRAPH", nullable=False)
    algorithm_version = Column(String(32), default="STGRAPH-1.0", nullable=False)
    spatial_threshold_m = Column(Float, default=750.0, nullable=False)
    temporal_threshold_minutes = Column(Float, default=60.0, nullable=False)
    observations_considered = Column(Integer, default=0, nullable=False)
    events_created = Column(Integer, default=0, nullable=False)
    events_updated = Column(Integer, default=0, nullable=False)
    started_at = Column(DateTime, default=utc_now, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    status = Column(String(32), default="SUCCESS", nullable=False)

    events = relationship("ThermalEvent", back_populates="clustering_run")

class ThermalEvent(Base):
    __tablename__ = "thermal_events"

    id = Column(String(64), primary_key=True)
    event_fingerprint = Column(String(64), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    first_observed_at = Column(DateTime, nullable=False, index=True)
    last_observed_at = Column(DateTime, nullable=False, index=True)
    duration_minutes = Column(Float, default=0.0)
    centroid_latitude = Column(Float, nullable=False, index=True)
    centroid_longitude = Column(Float, nullable=False, index=True)
    peak_observation_id = Column(String(64), nullable=True)
    peak_latitude = Column(Float, nullable=True)
    peak_longitude = Column(Float, nullable=True)
    convex_hull_geojson = Column(Text, nullable=True)
    bounding_box_geojson = Column(Text, nullable=True)
    spatial_extent_km2 = Column(Float, default=0.0)
    observation_count = Column(Integer, default=1, index=True)
    frp_total_mw = Column(Float, default=0.0, index=True)
    frp_peak_mw = Column(Float, default=0.0)
    frp_mean_mw = Column(Float, default=0.0)
    frp_median_mw = Column(Float, default=0.0)
    max_brightness_kelvin = Column(Float, default=0.0)
    cluster_confidence = Column(Float, default=50.0) # Cluster Quality/Coherence (0-100), NOT fire confidence
    cluster_quality = Column(Text, nullable=True)    # JSON metadata on compactness, coherence, multi-platform
    status = Column(String(32), default="CANDIDATE", index=True) # CANDIDATE, ACTIVE, CLOSED, SUPPRESSED
    is_demo = Column(Boolean, default=False, index=True)
    clustering_algorithm_version = Column(String(32), default="STGRAPH-1.0")
    clustering_run_id = Column(String(64), ForeignKey("clustering_runs.id"), nullable=True, index=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    clustering_run = relationship("ClusteringRun", back_populates="events")
    observation_links = relationship("EventObservationLink", back_populates="event", cascade="all, delete-orphan")

class EventObservationLink(Base):
    __tablename__ = "event_observations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String(64), ForeignKey("thermal_events.id", ondelete="CASCADE"), nullable=False, index=True)
    hotspot_id = Column(String(64), ForeignKey("firms_hotspots.id", ondelete="CASCADE"), nullable=False, index=True)
    distance_to_centroid_m = Column(Float, default=0.0)
    observed_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    event = relationship("ThermalEvent", back_populates="observation_links")
    hotspot = relationship("FirmsHotspot", back_populates="event_links")

    __table_args__ = (
        UniqueConstraint("event_id", "hotspot_id", name="uq_event_hotspot"),
    )

