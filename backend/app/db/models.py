import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.db.session import Base

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
    created_at = Column(DateTime, default=datetime.utcnow)

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
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

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
    dispatched_at = Column(DateTime, default=datetime.utcnow)

    incident = relationship("IncidentEvent", back_populates="alerts")
