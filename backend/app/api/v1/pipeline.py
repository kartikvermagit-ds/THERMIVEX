import os
import json
import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import logger
from app.db.session import get_db
from app.db.models import IncidentEvent, IndustrialFacility
from app.services.osm_service import find_nearest_facility, generate_sensor_footprint_geojson
from app.services.persistence_service import get_thermal_persistence_baseline
from app.services.ml_service import classify_thermal_event
from app.services.risk_service import calculate_composite_risk_score, generate_gaussian_plume_vector

router = APIRouter(prefix="/pipeline", tags=["Pipeline"])

class HotspotInput(BaseModel):
    latitude: float
    longitude: float
    bright_ti4: float
    bright_ti5: float
    frp: float
    acq_date: str = "2026-03-15"
    acq_time: str = "2134"
    daynight: str = "N"
    satellite: str = "NOAA-20"

class BatchIngestionPayload(BaseModel):
    hotspots: List[HotspotInput]

def process_single_hotspot(h: HotspotInput, db: Session) -> IncidentEvent:
    facilities = db.query(IndustrialFacility).all()
    
    # 1. Spatial Matching
    matched_fac, dist_m, match_level = find_nearest_facility(h.latitude, h.longitude, facilities)
    fac_id = matched_fac.id if matched_fac else None
    fac_name = matched_fac.name if matched_fac else "Unidentified Area"
    hazard_tier = matched_fac.hazard_tier if matched_fac else 2

    # 2. Persistence Analysis
    pi, delta_z = get_thermal_persistence_baseline(h.latitude, h.longitude, h.frp, fac_name)

    # 3. ML Classification
    pred_class, conf, _ = classify_thermal_event(
        frp=h.frp,
        bright_ti4=h.bright_ti4,
        bright_ti5=h.bright_ti5,
        dist_to_facility_m=dist_m,
        persistence_index=pi,
        delta_z=delta_z,
        daynight=h.daynight,
        hazard_tier=hazard_tier
    )

    # 4. Risk & Plume Computation
    risk_score, severity, _ = calculate_composite_risk_score(
        frp=h.frp,
        hazard_tier=hazard_tier,
        delta_z=delta_z,
        dist_to_facility_m=dist_m,
        classification=pred_class
    )

    footprint_geojson = generate_sensor_footprint_geojson(h.latitude, h.longitude)
    plume_geojson = None
    if pred_class == "ACCIDENTAL_INDUSTRIAL_FIRE" or risk_score >= 50:
        plume_geojson, _ = generate_gaussian_plume_vector(h.latitude, h.longitude, h.frp)

    incident = IncidentEvent(
        id=f"TX-{uuid.uuid4().hex[:6].upper()}",
        acq_date=h.acq_date,
        acq_time=h.acq_time,
        satellite=h.satellite,
        daynight=h.daynight,
        frp_total=h.frp,
        bright_ti4_max=h.bright_ti4,
        bright_ti5_min=h.bright_ti5,
        temp_differential=round(h.bright_ti4 - h.bright_ti5, 2),
        pixel_count=1,
        facility_id=fac_id,
        facility_name=fac_name,
        dist_to_facility_m=dist_m,
        spatial_match_level=match_level,
        persistence_index=pi,
        frp_delta_zscore=delta_z,
        classification=pred_class,
        classification_confidence=conf,
        risk_score=risk_score,
        severity_label=severity,
        latitude=h.latitude,
        longitude=h.longitude,
        footprint_geojson=footprint_geojson,
        plume_geojson=plume_geojson
    )
    return incident

@router.post("/ingest-and-process", status_code=status.HTTP_201_CREATED)
def ingest_and_process(payload: BatchIngestionPayload, db: Session = Depends(get_db)):
    """Ingests, classifies, and risk-scores incoming hotspot batches."""
    if not payload.hotspots:
        raise HTTPException(status_code=400, detail="Hotspot array is empty.")

    created_ids = []
    for h in payload.hotspots:
        inc = process_single_hotspot(h, db)
        db.add(inc)
        created_ids.append(inc.id)

    db.commit()
    return {
        "status": "SUCCESS",
        "processed_count": len(created_ids),
        "created_incident_ids": created_ids
    }

@router.get("/scenarios")
def list_scenarios():
    """Returns available SIH Grand Finale demonstration scenarios."""
    scenarios_path = os.path.join(settings.DATA_DIR, "seed_scenarios.json")
    if os.path.exists(scenarios_path):
        with open(scenarios_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

@router.post("/simulate/{scenario_id}", status_code=status.HTTP_201_CREATED)
def simulate_scenario(scenario_id: str, db: Session = Depends(get_db)):
    """Injects a specific scenario into the database for live demonstration."""
    scenarios_path = os.path.join(settings.DATA_DIR, "seed_scenarios.json")
    if not os.path.exists(scenarios_path):
        raise HTTPException(status_code=500, detail="Scenarios file missing.")

    with open(scenarios_path, "r", encoding="utf-8") as f:
        scenarios = json.load(f)

    target_scenario = next((s for s in scenarios if s["scenario_id"] == scenario_id), None)
    if not target_scenario:
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_id}' not found.")

    h_data = target_scenario["hotspot"]
    h_input = HotspotInput(**h_data)

    inc = process_single_hotspot(h_input, db)
    db.add(inc)
    db.commit()
    db.refresh(inc)

    return {
        "status": "SIMULATED",
        "scenario_title": target_scenario["title"],
        "incident_id": inc.id,
        "classification": inc.classification,
        "risk_score": inc.risk_score,
        "severity": inc.severity_label,
        "facility": inc.facility_name,
        "coordinates": [inc.longitude, inc.latitude]
    }
