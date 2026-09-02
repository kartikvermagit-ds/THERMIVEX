import json
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.session import get_db
from app.db.models import IncidentEvent, IndustrialFacility
from app.services.ml_service import generate_shap_attributions

router = APIRouter(prefix="/incidents", tags=["Incidents"])

@router.get("/feed")
def get_incident_feed(
    bbox: Optional[str] = Query(None, description="min_lon,min_lat,max_lon,max_lat"),
    min_risk: int = Query(0, ge=0, le=100),
    severity: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Returns real-time GeoJSON FeatureCollection of clustered and classified fire incidents."""
    query = db.query(IncidentEvent).filter(IncidentEvent.risk_score >= min_risk)

    if severity:
        query = query.filter(IncidentEvent.severity_label == severity)

    if bbox:
        try:
            min_lon, min_lat, max_lon, max_lat = map(float, bbox.split(","))
            query = query.filter(
                IncidentEvent.longitude >= min_lon,
                IncidentEvent.longitude <= max_lon,
                IncidentEvent.latitude >= min_lat,
                IncidentEvent.latitude <= max_lat
            )
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid bbox format. Use min_lon,min_lat,max_lon,max_lat")

    incidents = query.order_by(desc(IncidentEvent.risk_score)).limit(limit).all()

    features = []
    for inc in incidents:
        footprint = None
        if inc.footprint_geojson:
            try:
                footprint = json.loads(inc.footprint_geojson)
            except Exception:
                pass

        plume = None
        if inc.plume_geojson:
            try:
                plume = json.loads(inc.plume_geojson)
            except Exception:
                pass

        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [round(inc.longitude, 5), round(inc.latitude, 5)]
            },
            "properties": {
                "id": inc.id,
                "acq_date": inc.acq_date,
                "acq_time": inc.acq_time,
                "satellite": inc.satellite,
                "daynight": inc.daynight,
                "frp_total": inc.frp_total,
                "bright_ti4_max": inc.bright_ti4_max,
                "bright_ti5_min": inc.bright_ti5_min,
                "temp_differential": inc.temp_differential,
                "classification": inc.classification,
                "confidence": inc.classification_confidence,
                "risk_score": inc.risk_score,
                "severity": inc.severity_label,
                "facility_name": inc.facility_name,
                "dist_to_facility_m": inc.dist_to_facility_m,
                "spatial_match_level": inc.spatial_match_level,
                "persistence_index": inc.persistence_index,
                "frp_delta_zscore": inc.frp_delta_zscore,
                "footprint_geometry": footprint,
                "plume_geometry": plume
            }
        }
        features.append(feature)

    return {
        "type": "FeatureCollection",
        "total_count": len(features),
        "features": features
    }

@router.get("/export/geojson")
def export_incidents_geojson(db: Session = Depends(get_db)):
    """Exports active thermal incidents as an RFC 7946 compliant GeoJSON file for QGIS/ArcGIS Pro."""
    feed = get_incident_feed(bbox=None, min_risk=0, severity=None, limit=500, db=db)
    content = json.dumps(feed, indent=2)
    return Response(
        content=content,
        media_type="application/geo+json",
        headers={"Content-Disposition": "attachment; filename=thermivex_incidents.geojson"}
    )

@router.get("/{incident_id}/investigate")
def get_incident_investigation_dossier(
    incident_id: str,
    db: Session = Depends(get_db)
):
    """Returns deep-dive evidence dossier including TreeSHAP explanation and radiometrics."""
    inc = db.query(IncidentEvent).filter(IncidentEvent.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")

    # Generate TreeSHAP explainability items
    shap_factors = generate_shap_attributions(
        frp=inc.frp_total,
        delta_z=inc.frp_delta_zscore,
        dist_to_facility_m=inc.dist_to_facility_m,
        facility_name=inc.facility_name or "",
        daynight=inc.daynight,
        temp_diff=inc.temp_differential,
        predicted_class=inc.classification
    )

    plume_dict = None
    if inc.plume_geojson:
        try:
            plume_dict = json.loads(inc.plume_geojson)
        except Exception:
            pass

    return {
        "incident_id": inc.id,
        "timestamp_utc": f"{inc.acq_date}T{inc.acq_time[:2]}:{inc.acq_time[2:]}:00Z",
        "coordinates": [round(inc.longitude, 5), round(inc.latitude, 5)],
        "sensor": {
            "satellite": inc.satellite,
            "pass_type": "Night Pass" if inc.daynight == "N" else "Day Pass",
            "frp_mw": inc.frp_total,
            "t4_kelvin": inc.bright_ti4_max,
            "t5_kelvin": inc.bright_ti5_min,
            "temp_diff_kelvin": inc.temp_differential,
            "pixel_count": inc.pixel_count
        },
        "facility_context": {
            "name": inc.facility_name or "Unmapped Industrial Zone",
            "distance_m": inc.dist_to_facility_m,
            "spatial_match_level": inc.spatial_match_level
        },
        "temporal_baseline": {
            "persistence_index_52w": inc.persistence_index,
            "frp_delta_zscore": inc.frp_delta_zscore,
            "recurrence_classification": "Unprecedented Anomaly" if inc.persistence_index < 0.05 else "Routine Periodic Source"
        },
        "ai_classification": {
            "label": inc.classification,
            "confidence": inc.classification_confidence
        },
        "risk_assessment": {
            "composite_risk_score": inc.risk_score,
            "severity_label": inc.severity_label
        },
        "plume_dispersion": {
            "geometry": plume_dict,
            "wind_speed_kmh": 14.5,
            "wind_bearing_deg": 295.0,
            "threat_zone": "East-Southeast Corridor (Residential Buffer: 1,400m)"
        },
        "explainability_tree_shap": shap_factors
    }

@router.get("/stats")
def get_incident_stats(db: Session = Depends(get_db)):
    """Returns aggregate situational telemetry for the dashboard top bar."""
    total = db.query(IncidentEvent).count()
    critical = db.query(IncidentEvent).filter(IncidentEvent.severity_label == "CRITICAL").count()
    high = db.query(IncidentEvent).filter(IncidentEvent.severity_label == "HIGH").count()
    routine = db.query(IncidentEvent).filter(IncidentEvent.classification == "PERSISTENT_OPERATIONAL_SOURCE").count()
    suppressed = db.query(IncidentEvent).filter(IncidentEvent.classification.in_(["NON_INDUSTRIAL_AGRICULTURAL", "SENSOR_ARTIFACT_OR_GLINT"])).count()

    return {
        "total_active_events": total,
        "critical_disasters": critical,
        "high_anomalies": high,
        "routine_flaring": routine,
        "suppressed_false_positives": suppressed
    }
