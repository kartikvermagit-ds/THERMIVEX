from typing import Tuple

# Known historical baselines for demonstration corridors
HISTORICAL_REGISTRY = {
    # Reliance Jamnagar: Active flaring baseline (fires almost every week)
    "jamnagar": {"persistence_index": 0.94, "mean_frp": 20.5, "std_frp": 3.8},
    # Dahej Petrochemicals: Strict chemical storage (zero routine flaring)
    "dahej": {"persistence_index": 0.00, "mean_frp": 0.0, "std_frp": 1.0},
    # GIDC Panoli: Intermittent small industrial heat
    "panoli": {"persistence_index": 0.35, "mean_frp": 14.0, "std_frp": 4.5},
    # Manesar: General assembly (very rare heat)
    "manesar": {"persistence_index": 0.02, "mean_frp": 5.0, "std_frp": 2.0},
    # Punjab / Rural agricultural cropland
    "punjab_agri": {"persistence_index": 0.12, "mean_frp": 28.0, "std_frp": 12.0}
}

def get_thermal_persistence_baseline(
    lat: float, 
    lon: float, 
    current_frp: float, 
    facility_name: str = ""
) -> Tuple[float, float]:
    """
    Looks up the historical thermal baseline for the target coordinate/facility.
    Returns: (persistence_index, frp_delta_zscore)
    """
    fac_lower = facility_name.lower() if facility_name else ""

    if "jamnagar" in fac_lower or (abs(lat - 22.34) < 0.1 and abs(lon - 69.83) < 0.1):
        base = HISTORICAL_REGISTRY["jamnagar"]
    elif "dahej" in fac_lower or (abs(lat - 21.68) < 0.1 and abs(lon - 72.58) < 0.1):
        base = HISTORICAL_REGISTRY["dahej"]
    elif "panoli" in fac_lower or (abs(lat - 21.53) < 0.1 and abs(lon - 72.96) < 0.1):
        base = HISTORICAL_REGISTRY["panoli"]
    elif "manesar" in fac_lower or (abs(lat - 28.36) < 0.1 and abs(lon - 76.92) < 0.1):
        base = HISTORICAL_REGISTRY["manesar"]
    elif "ludhiana" in fac_lower or (abs(lat - 30.87) < 0.1 and abs(lon - 75.91) < 0.1):
        base = HISTORICAL_REGISTRY["punjab_agri"]
    else:
        # Default un-baselined coordinate
        base = {"persistence_index": 0.05, "mean_frp": 10.0, "std_frp": 5.0}

    pi = base["persistence_index"]
    
    if pi == 0.0:
        # Unprecedented detection in a non-heating facility
        delta_z = round(current_frp / 12.5, 2)
    else:
        delta_z = round((current_frp - base["mean_frp"]) / (base["std_frp"] + 1e-5), 2)

    return pi, delta_z
