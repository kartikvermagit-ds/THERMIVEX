import json
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import IndustrialFacility
from app.services.osm_service import haversine_distance_meters

router = APIRouter(prefix="/facilities", tags=["Facilities"])

@router.get("")
def get_facilities(
    bbox: Optional[str] = Query(None, description="min_lon,min_lat,max_lon,max_lat"),
    db: Session = Depends(get_db)
):
    """Returns industrial facility boundaries and metadata as GeoJSON FeatureCollection."""
    query = db.query(IndustrialFacility)

    if bbox:
        try:
            min_lon, min_lat, max_lon, max_lat = map(float, bbox.split(","))
            query = query.filter(
                IndustrialFacility.longitude >= min_lon,
                IndustrialFacility.longitude <= max_lon,
                IndustrialFacility.latitude >= min_lat,
                IndustrialFacility.latitude <= max_lat
            )
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid bbox format.")

    facilities = query.all()
    features = []
    for fac in facilities:
        poly_geom = None
        if fac.geometry_geojson:
            try:
                poly_geom = json.loads(fac.geometry_geojson)
            except Exception:
                pass

        if not poly_geom:
            poly_geom = {
                "type": "Point",
                "coordinates": [round(fac.longitude, 5), round(fac.latitude, 5)]
            }

        features.append({
            "type": "Feature",
            "geometry": poly_geom,
            "properties": {
                "id": fac.id,
                "osm_id": fac.osm_id,
                "name": fac.name,
                "landuse": fac.landuse,
                "industrial_type": fac.industrial_type,
                "hazard_tier": fac.hazard_tier,
                "centroid": [round(fac.longitude, 5), round(fac.latitude, 5)]
            }
        })

    return {
        "type": "FeatureCollection",
        "total": len(features),
        "features": features
    }

@router.get("/nearby")
def get_nearby_facilities(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    radius_m: float = Query(2500.0, ge=100.0, le=25000.0),
    db: Session = Depends(get_db)
):
    """Finds all industrial facilities within radius sorted by distance."""
    facilities = db.query(IndustrialFacility).all()
    matches = []

    for fac in facilities:
        dist = haversine_distance_meters(lat, lon, fac.latitude, fac.longitude)
        if dist <= radius_m:
            matches.append({
                "facility_id": fac.id,
                "osm_id": fac.osm_id,
                "name": fac.name,
                "type": fac.industrial_type,
                "hazard_tier": fac.hazard_tier,
                "distance_m": round(dist, 1)
            })

    matches.sort(key=lambda x: x["distance_m"])
    return {
        "search_point": [lon, lat],
        "radius_m": radius_m,
        "matches_count": len(matches),
        "facilities": matches
    }
