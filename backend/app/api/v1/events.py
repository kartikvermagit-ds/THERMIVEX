import json
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.config import settings
from app.core.logging import logger
from app.db.session import get_db
from app.db.models import ThermalEvent, EventObservationLink, FirmsHotspot, ClusteringRun
from app.schemas.event_schemas import (
    EventClusterRequest,
    EventClusterSummary,
    EventObservationSummary,
    ThermalEventResponse,
    ThermalEventListResponse,
    ThermalEventGeoJSONFeature,
    ThermalEventGeoJSONCollection,
    EventTimelineResponse
)
from app.schemas.firms_schemas import FirmsHotspotResponse
from app.services.clustering_service import (
    run_spatio_temporal_clustering,
    build_event_timeline
)

router = APIRouter(prefix="/events", tags=["Candidate Thermal Events"])

@router.post(
    "/cluster",
    response_model=EventClusterSummary,
    status_code=status.HTTP_200_OK,
    summary="Execute Spatio-Temporal Graph Clustering on Thermal Observations"
)
def cluster_thermal_observations(
    req: EventClusterRequest = EventClusterRequest(),
    db: Session = Depends(get_db)
):
    """
    Executes spatio-temporal graph clustering on FIRMS observations.
    Connects observations within configurable spatial_threshold_m (default 750m)
    and temporal_threshold_minutes (default 60 min).
    Generates deterministic event fingerprints to ensure 100% idempotent updates without duplicates.
    """
    try:
        summary = run_spatio_temporal_clustering(
            db=db,
            spatial_threshold_m=req.spatial_threshold_m,
            temporal_threshold_minutes=req.temporal_threshold_minutes,
            date_filter=req.date,
            start_date=req.start_date,
            end_date=req.end_date,
            is_demo_filter=req.is_demo,
            algorithm_version=req.algorithm_version
        )
        return summary
    except Exception as e:
        logger.error(f"Clustering execution failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete spatio-temporal clustering run."
        )

@router.get(
    "",
    response_model=None,
    summary="Retrieve Persistent Candidate Thermal Events"
)
def get_thermal_events(
    date: Optional[str] = Query(None, description="Acquisition date filter (YYYY-MM-DD)"),
    min_frp: Optional[float] = Query(None, ge=0.0, description="Minimum total cluster FRP in MW"),
    min_observations: Optional[int] = Query(None, ge=1, description="Minimum observation count"),
    status_filter: Optional[str] = Query(None, alias="status", description="Status (CANDIDATE, ACTIVE, CLOSED, SUPPRESSED)"),
    is_demo: Optional[bool] = Query(None, description="Filter demo synthetic events"),
    bbox: Optional[str] = Query(None, description="Bounding box: min_lon,min_lat,max_lon,max_lat"),
    format: str = Query("json", description="Output format: 'json' or 'geojson'"),
    limit: int = Query(50, ge=1, le=500, description="Max events to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    db: Session = Depends(get_db)
):
    """
    Lists Candidate Thermal Events. Supports attribute filtering, bounding box queries,
    and RFC 7946 GeoJSON FeatureCollections.
    """
    query = db.query(ThermalEvent)

    # 1. Date filter
    if date:
        clean_date = date.strip().replace("/", "-")
        query = query.filter(ThermalEvent.first_observed_at >= f"{clean_date} 00:00:00")
        query = query.filter(ThermalEvent.first_observed_at <= f"{clean_date} 23:59:59")

    # 2. Min FRP & Observations
    if min_frp is not None:
        query = query.filter(ThermalEvent.frp_total_mw >= min_frp)
    if min_observations is not None:
        query = query.filter(ThermalEvent.observation_count >= min_observations)

    # 3. Status & Demo Filter
    if status_filter:
        query = query.filter(ThermalEvent.status == status_filter.strip().upper())
    if is_demo is not None:
        query = query.filter(ThermalEvent.is_demo == is_demo)

    # 4. Spatial Bounding Box Filter
    if bbox:
        parts = bbox.split(",")
        if len(parts) != 4:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid bbox format. Expected: min_longitude,min_latitude,max_longitude,max_latitude"
            )
        try:
            min_lon, min_lat, max_lon, max_lat = [float(p.strip()) for p in parts]
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="All bbox coordinates must be numeric floats."
            )

        if not (-180.0 <= min_lon <= 180.0 and -180.0 <= max_lon <= 180.0):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Longitude must be between -180 and 180.")
        if not (-90.0 <= min_lat <= 90.0 and -90.0 <= max_lat <= 90.0):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Latitude must be between -90 and 90.")
        if min_lon >= max_lon:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="min_longitude must be less than max_longitude.")
        if min_lat >= max_lat:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="min_latitude must be less than max_latitude.")

        query = query.filter(
            ThermalEvent.centroid_longitude >= min_lon,
            ThermalEvent.centroid_longitude <= max_lon,
            ThermalEvent.centroid_latitude >= min_lat,
            ThermalEvent.centroid_latitude <= max_lat
        )

    total_count = query.count()
    events = query.order_by(desc(ThermalEvent.first_observed_at), desc(ThermalEvent.frp_total_mw)).offset(offset).limit(limit).all()

    # GeoJSON Format Output
    if format.lower() == "geojson":
        features = []
        for ev in events:
            # Parse convex hull geometry or default to centroid point
            geom = None
            if ev.convex_hull_geojson:
                try:
                    geom = json.loads(ev.convex_hull_geojson)
                except Exception:
                    pass

            if not geom:
                geom = {
                    "type": "Point",
                    "coordinates": [round(ev.centroid_longitude, 5), round(ev.centroid_latitude, 5)]
                }

            feature = {
                "type": "Feature",
                "geometry": geom,
                "properties": {
                    "id": ev.id,
                    "event_fingerprint": ev.event_fingerprint,
                    "title": ev.title,
                    "first_observed_at": ev.first_observed_at.isoformat(),
                    "last_observed_at": ev.last_observed_at.isoformat(),
                    "duration_minutes": ev.duration_minutes,
                    "centroid": [round(ev.centroid_longitude, 5), round(ev.centroid_latitude, 5)],
                    "peak_observation_id": ev.peak_observation_id,
                    "peak_latitude": ev.peak_latitude,
                    "peak_longitude": ev.peak_longitude,
                    "spatial_extent_km2": ev.spatial_extent_km2,
                    "observation_count": ev.observation_count,
                    "frp_total_mw": ev.frp_total_mw,
                    "frp_peak_mw": ev.frp_peak_mw,
                    "frp_mean_mw": ev.frp_mean_mw,
                    "frp_median_mw": ev.frp_median_mw,
                    "max_brightness_kelvin": ev.max_brightness_kelvin,
                    "cluster_confidence": ev.cluster_confidence,
                    "status": ev.status,
                    "is_demo": ev.is_demo,
                    "algorithm_version": ev.clustering_algorithm_version
                }
            }
            features.append(feature)

        return {
            "type": "FeatureCollection",
            "total_count": total_count,
            "features": features
        }

    # Tabular JSON Output
    serialized = []
    for ev in events:
        serialized.append(ThermalEventResponse.model_validate(ev))

    return {
        "total_count": total_count,
        "events": [e.model_dump() for e in serialized]
    }

@router.get(
    "/{event_id}",
    response_model=ThermalEventResponse,
    summary="Retrieve Detailed Candidate Thermal Event by ID"
)
def get_thermal_event_detail(event_id: str, db: Session = Depends(get_db)):
    """
    Returns single thermal event with member observation distance metrics.
    """
    event = db.query(ThermalEvent).filter(ThermalEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Thermal event '{event_id}' not found.")

    links = db.query(EventObservationLink).filter(EventObservationLink.event_id == event.id).all()
    hotspot_ids = [l.hotspot_id for l in links]
    hotspot_map = {h.id: h for h in db.query(FirmsHotspot).filter(FirmsHotspot.id.in_(hotspot_ids)).all()}

    obs_summaries: List[EventObservationSummary] = []
    for l in links:
        h = hotspot_map.get(l.hotspot_id)
        if h:
            obs_summaries.append(EventObservationSummary(
                hotspot_id=h.id,
                latitude=h.latitude,
                longitude=h.longitude,
                observed_at=h.observed_at,
                frp=h.frp,
                brightness_temperature=h.brightness_temperature,
                satellite=h.satellite,
                instrument=h.instrument,
                confidence=h.confidence,
                distance_to_centroid_m=l.distance_to_centroid_m
            ))

    res = ThermalEventResponse.model_validate(event)
    res.observations = obs_summaries
    return res

@router.get(
    "/{event_id}/timeline",
    response_model=EventTimelineResponse,
    summary="Retrieve Chronological Evolution Timeline for Thermal Event"
)
def get_event_timeline(event_id: str, db: Session = Depends(get_db)):
    """
    Returns chronological progression of member satellite observations within the event.
    Tracks escalating FRP, spatial extent growth, and observation stages.
    """
    event = db.query(ThermalEvent).filter(ThermalEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Thermal event '{event_id}' not found.")

    return build_event_timeline(event, db)

@router.get(
    "/{event_id}/observations",
    response_model=List[FirmsHotspotResponse],
    summary="Retrieve Raw FIRMS Hotspots Associated with Event"
)
def get_event_member_observations(event_id: str, db: Session = Depends(get_db)):
    """
    Returns all raw spaceborne FIRMS observations linked to this candidate thermal event.
    Preserves complete provenance without altering source observation data.
    """
    event = db.query(ThermalEvent).filter(ThermalEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Thermal event '{event_id}' not found.")

    links = db.query(EventObservationLink).filter(EventObservationLink.event_id == event.id).all()
    hotspot_ids = [l.hotspot_id for l in links]
    hotspots = db.query(FirmsHotspot).filter(FirmsHotspot.id.in_(hotspot_ids)).order_by(FirmsHotspot.observed_at).all()

    return [FirmsHotspotResponse.model_validate(h) for h in hotspots]

@router.get(
    "/runs/latest",
    summary="Retrieve Latest Clustering Run Metadata"
)
def get_latest_clustering_run(db: Session = Depends(get_db)):
    """
    Returns metadata for the most recent spatio-temporal clustering execution run.
    """
    latest = db.query(ClusteringRun).order_by(desc(ClusteringRun.started_at)).first()
    if not latest:
        return {
            "status": "NO_RUNS_RECORDED",
            "stale_after_minutes": settings.CLUSTER_RUN_STALE_MINUTES,
            "run_age_seconds": None,
            "is_stale": False
        }

    stale_after_minutes = max(1, int(settings.CLUSTER_RUN_STALE_MINUTES))
    ref_time = latest.completed_at or latest.started_at
    run_age_seconds = None
    if ref_time:
        now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
        run_age_seconds = max(0, int((now_utc - ref_time).total_seconds()))

    is_stale = False
    if run_age_seconds is not None:
        is_stale = run_age_seconds > (stale_after_minutes * 60)

    return {
        "id": latest.id,
        "algorithm": latest.algorithm,
        "algorithm_version": latest.algorithm_version,
        "spatial_threshold_m": latest.spatial_threshold_m,
        "temporal_threshold_minutes": latest.temporal_threshold_minutes,
        "observations_considered": latest.observations_considered,
        "events_created": latest.events_created,
        "events_updated": latest.events_updated,
        "started_at": latest.started_at.isoformat() if latest.started_at else None,
        "completed_at": latest.completed_at.isoformat() if latest.completed_at else None,
        "status": latest.status,
        "stale_after_minutes": stale_after_minutes,
        "run_age_seconds": run_age_seconds,
        "is_stale": is_stale
    }
