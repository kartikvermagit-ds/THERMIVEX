import json
import math
from typing import Optional, Tuple, Dict, Any, List
from app.db.models import IndustrialFacility
from app.core.logging import logger

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two points on Earth in meters."""
    R = 6371000.0 # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0)**2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def find_nearest_facility(
    lat: float, 
    lon: float, 
    facilities: List[IndustrialFacility]
) -> Tuple[Optional[IndustrialFacility], float, str]:
    """
    Finds nearest industrial facility and classifies spatial match level:
    - DIRECT_HIT: <= 120m (within sub-pixel compound center)
    - PERIMETER: <= 350m (captures 375m pixel drift & outer fence)
    - VICINITY: <= 1000m (potential plume/threat zone)
    - NONE: > 1000m
    """
    if not facilities:
        return None, 9999.0, "NONE"

    best_fac = None
    min_dist = float("inf")

    for fac in facilities:
        dist = haversine_distance_meters(lat, lon, fac.latitude, fac.longitude)
        if dist < min_dist:
            min_dist = dist
            best_fac = fac

    if min_dist <= 120.0:
        match_level = "DIRECT_HIT"
    elif min_dist <= 350.0:
        match_level = "PERIMETER"
    elif min_dist <= 1000.0:
        match_level = "VICINITY"
    else:
        match_level = "NONE"

    return best_fac, round(min_dist, 1), match_level

def generate_sensor_footprint_geojson(lat: float, lon: float, scan_km: float = 0.375, track_km: float = 0.375) -> str:
    """Generates a 375m rectangular sensor footprint GeoJSON Polygon."""
    delta_lat = (track_km / 111.0) / 2.0
    delta_lon = (scan_km / (111.0 * math.cos(math.radians(lat)))) / 2.0

    coords = [
        [round(lon - delta_lon, 5), round(lat - delta_lat, 5)],
        [round(lon + delta_lon, 5), round(lat - delta_lat, 5)],
        [round(lon + delta_lon, 5), round(lat + delta_lat, 5)],
        [round(lon - delta_lon, 5), round(lat + delta_lat, 5)],
        [round(lon - delta_lon, 5), round(lat - delta_lat, 5)]
    ]
    return json.dumps({"type": "Polygon", "coordinates": [coords]})
