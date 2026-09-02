import math
import json
from typing import Tuple, Dict, Any

def calculate_composite_risk_score(
    frp: float,
    hazard_tier: int, # 1 to 5
    delta_z: float,
    dist_to_facility_m: float,
    classification: str
) -> Tuple[int, str, Dict[str, float]]:
    """
    Computes normalized Composite Risk Score (CRS, 0-100) and Severity Label.
    """
    if classification == "SENSOR_ARTIFACT_OR_GLINT":
        return 5, "LOW", {"s_hazard": 5, "s_facility": 10, "s_anomaly": 0, "s_proximity": 0}

    if classification == "PERSISTENT_OPERATIONAL_SOURCE":
        # Low risk for routine operations unless delta_z shows flare-up
        base_score = 15 + min(20, max(0, int(delta_z * 6)))
        return base_score, "LOW", {"s_hazard": 20, "s_facility": 30, "s_anomaly": 10, "s_proximity": 20}

    # 1. Hazard Severity Score (0-100) based on FRP
    s_hazard = min(100.0, (math.log(1.0 + max(0.0, frp)) / math.log(151.0)) * 100.0)

    # 2. Facility Criticality Score (0-100)
    s_facility = hazard_tier * 20.0 # Tier 1-5 -> 20, 40, 60, 80, 100

    # 3. Anomaly Magnitude Score (0-100)
    if delta_z >= 5.0:
        s_anomaly = 100.0
    elif delta_z <= 0.0:
        s_anomaly = 10.0
    else:
        s_anomaly = 100.0 / (1.0 + math.exp(-(delta_z - 2.5)))

    # 4. Proximity Score (0-100)
    if dist_to_facility_m <= 100.0:
        s_proximity = 100.0
    elif dist_to_facility_m <= 1000.0:
        s_proximity = max(0.0, 100.0 - ((dist_to_facility_m - 100.0) / 9.0))
    else:
        s_proximity = 10.0

    raw_score = (0.30 * s_hazard) + (0.25 * s_facility) + (0.25 * s_anomaly) + (0.20 * s_proximity)
    crs = int(max(0, min(100, round(raw_score))))

    if crs >= 70:
        severity = "CRITICAL"
    elif crs >= 50:
        severity = "HIGH"
    elif crs >= 35:
        severity = "MEDIUM"
    else:
        severity = "LOW"

    return crs, severity, {
        "s_hazard": round(s_hazard, 1),
        "s_facility": round(s_facility, 1),
        "s_anomaly": round(s_anomaly, 1),
        "s_proximity": round(s_proximity, 1)
    }

def generate_gaussian_plume_vector(
    lat: float, 
    lon: float, 
    frp: float,
    wind_speed_kmh: float = 14.5,
    wind_bearing_deg: float = 295.0 # Direction wind is blowing FROM (e.g. 295° WNW)
) -> Tuple[str, Dict[str, Any]]:
    """
    Computes a 2D downwind Gaussian dispersion cone.
    Returns: (GeoJSON Polygon string, metadata dict)
    """
    # Downwind direction is opposite of where wind originates
    downwind_angle_deg = (wind_bearing_deg + 180.0) % 360.0
    downwind_rad = math.radians(downwind_angle_deg)

    # Dispersion length scaled by FRP & wind speed
    dispersion_dist_km = min(4.5, max(0.8, (frp / 25.0) * (wind_speed_kmh / 10.0)))
    spread_angle_rad = math.radians(24.0) # 24° cone divergence

    # Tip point (Incident centroid)
    p0 = [round(lon, 5), round(lat, 5)]

    # Left flank
    angle_left = downwind_rad - spread_angle_rad
    d_lat_l = (dispersion_dist_km / 111.0) * math.cos(angle_left)
    d_lon_l = (dispersion_dist_km / (111.0 * math.cos(math.radians(lat)))) * math.sin(angle_left)
    p1 = [round(lon + d_lon_l, 5), round(lat + d_lat_l, 5)]

    # Center apex
    d_lat_c = (dispersion_dist_km * 1.15 / 111.0) * math.cos(downwind_rad)
    d_lon_c = (dispersion_dist_km * 1.15 / (111.0 * math.cos(math.radians(lat)))) * math.sin(downwind_rad)
    p2 = [round(lon + d_lon_c, 5), round(lat + d_lat_c, 5)]

    # Right flank
    angle_right = downwind_rad + spread_angle_rad
    d_lat_r = (dispersion_dist_km / 111.0) * math.cos(angle_right)
    d_lon_r = (dispersion_dist_km / (111.0 * math.cos(math.radians(lat)))) * math.sin(angle_right)
    p3 = [round(lon + d_lon_r, 5), round(lat + d_lat_r, 5)]

    coordinates = [[p0, p1, p2, p3, p0]]
    plume_geojson = json.dumps({"type": "Polygon", "coordinates": coordinates})

    metadata = {
        "wind_speed_kmh": wind_speed_kmh,
        "wind_bearing_deg": wind_bearing_deg,
        "downwind_angle_deg": round(downwind_angle_deg, 1),
        "dispersion_distance_m": round(dispersion_dist_km * 1000.0, 0),
        "threat_zone": "East-Southeast Corridor (Downwind Sector)"
    }
    return plume_geojson, metadata
