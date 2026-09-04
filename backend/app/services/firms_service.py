import os
import csv
import io
import json
import uuid
import hashlib
from datetime import datetime, timezone
import httpx
from typing import List, Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import logger
from app.db.models import FirmsHotspot
from app.schemas.firms_schemas import FirmsIngestSummary

def generate_observation_hash(
    latitude: float,
    longitude: float,
    acquisition_date: str,
    acquisition_time: str,
    satellite: str,
    instrument: str
) -> str:
    """
    Generates a deterministic observation fingerprint / unique key.
    Coordinates are normalized to 5 decimal places (~1.1 meter precision).
    """
    norm_lat = f"{round(float(latitude), 5):.5f}"
    norm_lon = f"{round(float(longitude), 5):.5f}"
    norm_date = acquisition_date.strip().replace("/", "-")
    norm_time = str(acquisition_time).strip().zfill(4)[:4]
    norm_sat = satellite.strip().upper().replace(" ", "-")
    norm_inst = instrument.strip().upper()

    fingerprint = f"{norm_lat}|{norm_lon}|{norm_date}|{norm_time}|{norm_sat}|{norm_inst}"
    return hashlib.sha256(fingerprint.encode("utf-8")).hexdigest()

def parse_observed_at(acquisition_date: str, acquisition_time: str) -> datetime:
    """
    Parses acquisition date and time into a standardized UTC datetime.
    Supports formats: YYYY-MM-DD or YYYY/MM/DD and HHMM.
    """
    norm_date = acquisition_date.strip().replace("/", "-")
    norm_time = str(acquisition_time).strip().zfill(4)[:4]

    try:
        hours = int(norm_time[:2])
        minutes = int(norm_time[2:4])
        # Validate hours and minutes
        if hours > 23:
            hours = 23
        if minutes > 59:
            minutes = 59
        
        parts = [int(p) for p in norm_date.split("-")]
        if len(parts) == 3:
            return datetime(parts[0], parts[1], parts[2], hours, minutes, 0, tzinfo=timezone.utc).replace(tzinfo=None)
    except Exception:
        pass

    try:
        # Fallback to date only
        return datetime.strptime(norm_date, "%Y-%m-%d")
    except Exception:
        return datetime.now(timezone.utc).replace(tzinfo=None)

def normalize_satellite_name(raw_sat: Optional[str]) -> str:
    """Normalizes satellite platform name while avoiding strict rejection."""
    if not raw_sat:
        return "UNKNOWN_SATELLITE"
    val = str(raw_sat).strip().upper()
    if val in ("N", "NOAA20", "NOAA 20", "NOAA-20"):
        return "NOAA-20"
    if val in ("SNPP", "SUOMI-NPP", "SUOMI NPP", "NPP"):
        return "Suomi-NPP"
    if val in ("T", "TERRA"):
        return "Terra"
    if val in ("A", "AQUA"):
        return "Aqua"
    if val in ("1", "NOAA21", "NOAA-21"):
        return "NOAA-21"
    return val

def normalize_instrument_name(raw_inst: Optional[str], raw_row: Dict[str, Any]) -> str:
    """Normalizes instrument name or infers it from sensor-specific columns."""
    if raw_inst and str(raw_inst).strip():
        val = str(raw_inst).strip().upper()
        if "VIIRS" in val:
            return "VIIRS"
        if "MODIS" in val:
            return "MODIS"
        return val
    
    # Infer instrument from sensor-specific channels
    if "bright_ti4" in raw_row or "bright_ti5" in raw_row:
        return "VIIRS"
    if "bright_t31" in raw_row or "brightness" in raw_row:
        return "MODIS"
    return "VIIRS"

def parse_firms_csv(csv_text: str) -> Tuple[List[Dict[str, Any]], List[str]]:
    """
    Parses NASA FIRMS NRT CSV format into normalized hotspot observation records.
    Returns: (valid_records, parsing_errors)
    """
    records = []
    errors = []
    
    lines = [line for line in csv_text.splitlines() if line.strip() and not line.strip().startswith("#")]
    if not lines:
        return [], ["CSV file is empty or contains only comments"]

    reader = csv.DictReader(lines)
    if not reader.fieldnames:
        return [], ["CSV header is missing or empty"]

    fieldnames_lower = {fn.strip().lower(): fn for fn in reader.fieldnames if fn}

    # Verify minimum required spatial columns
    has_lat = "latitude" in fieldnames_lower or "lat" in fieldnames_lower
    has_lon = "longitude" in fieldnames_lower or "lon" in fieldnames_lower
    if not (has_lat and has_lon):
        return [], ["CSV is missing required spatial columns ('latitude', 'longitude')"]

    lat_key = fieldnames_lower.get("latitude") or fieldnames_lower.get("lat")
    lon_key = fieldnames_lower.get("longitude") or fieldnames_lower.get("lon")

    for line_num, row in enumerate(reader, start=2):
        try:
            raw_lat = row.get(lat_key)
            raw_lon = row.get(lon_key)
            if raw_lat is None or raw_lon is None or str(raw_lat).strip() == "" or str(raw_lon).strip() == "":
                errors.append(f"Line {line_num}: Missing coordinates")
                continue

            lat = float(raw_lat)
            lon = float(raw_lon)

            # Validate WGS84 range
            if not (-90.0 <= lat <= 90.0):
                errors.append(f"Line {line_num}: Latitude {lat} out of range [-90, 90]")
                continue
            if not (-180.0 <= lon <= 180.0):
                errors.append(f"Line {line_num}: Longitude {lon} out of range [-180, 180]")
                continue

            # Primary and secondary brightness temperature normalization
            # VIIRS uses bright_ti4 / bright_ti5; MODIS uses brightness / bright_t31
            b_primary = None
            for k in ("bright_ti4", "brightness", "bright_t4", "t4"):
                actual_k = fieldnames_lower.get(k)
                if actual_k and row.get(actual_k):
                    try:
                        b_primary = float(row[actual_k])
                        break
                    except ValueError:
                        pass
            if b_primary is None or b_primary < 0:
                b_primary = 300.0

            b_secondary = None
            for k in ("bright_ti5", "bright_t31", "bright_t5", "t5"):
                actual_k = fieldnames_lower.get(k)
                if actual_k and row.get(actual_k):
                    try:
                        b_secondary = float(row[actual_k])
                        break
                    except ValueError:
                        pass

            # FRP normalization
            frp_val = 0.0
            frp_key = fieldnames_lower.get("frp")
            if frp_key and row.get(frp_key):
                try:
                    frp_val = max(0.0, float(row[frp_key]))
                except ValueError:
                    frp_val = 0.0

            # Acquisition date and time
            date_key = fieldnames_lower.get("acq_date") or fieldnames_lower.get("date")
            acq_date = row.get(date_key, "2026-03-15").strip().replace("/", "-") if date_key else "2026-03-15"

            time_key = fieldnames_lower.get("acq_time") or fieldnames_lower.get("time")
            acq_time = str(row.get(time_key, "1200")).strip().zfill(4)[:4] if time_key else "1200"

            # Satellite & Instrument
            sat_key = fieldnames_lower.get("satellite")
            raw_sat = row.get(sat_key) if sat_key else "NOAA-20"
            satellite = normalize_satellite_name(raw_sat)

            inst_key = fieldnames_lower.get("instrument")
            raw_inst = row.get(inst_key) if inst_key else None
            instrument = normalize_instrument_name(raw_inst, row)

            # Confidence
            conf_key = fieldnames_lower.get("confidence")
            confidence = str(row.get(conf_key, "nominal")).strip().lower() if conf_key and row.get(conf_key) else "nominal"

            # Day/Night
            dn_key = fieldnames_lower.get("daynight") or fieldnames_lower.get("day_night")
            raw_dn = str(row.get(dn_key, "N")).strip().upper() if dn_key and row.get(dn_key) else "N"
            day_night = "D" if raw_dn.startswith("D") else "N"

            record = {
                "latitude": lat,
                "longitude": lon,
                "acquisition_date": acq_date,
                "acquisition_time": acq_time,
                "observed_at": parse_observed_at(acq_date, acq_time),
                "satellite": satellite,
                "instrument": instrument,
                "confidence": confidence,
                "brightness_temperature": b_primary,
                "bright_ti5_or_t31": b_secondary,
                "frp": frp_val,
                "day_night": day_night,
                "raw_properties": json.dumps(row)
            }
            records.append(record)
        except Exception as e:
            errors.append(f"Line {line_num}: Unexpected parsing error ({type(e).__name__})")

    return records, errors

def parse_firms_geojson(geojson_dict: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], List[str]]:
    """
    Parses GeoJSON FeatureCollection into normalized hotspot observation records.
    Returns: (valid_records, parsing_errors)
    """
    records = []
    errors = []

    features = geojson_dict.get("features", [])
    if not isinstance(features, list):
        return [], ["Invalid GeoJSON: 'features' must be a list"]

    for idx, feat in enumerate(features, start=1):
        try:
            geom = feat.get("geometry", {})
            if not geom or geom.get("type") != "Point":
                errors.append(f"Feature {idx}: Geometry must be of type 'Point'")
                continue

            coords = geom.get("coordinates", [])
            if not isinstance(coords, (list, tuple)) or len(coords) < 2:
                errors.append(f"Feature {idx}: Missing [longitude, latitude] coordinates")
                continue

            # Standard GeoJSON coordinate order is [longitude, latitude]
            lon = float(coords[0])
            lat = float(coords[1])

            if not (-90.0 <= lat <= 90.0):
                errors.append(f"Feature {idx}: Latitude {lat} out of range [-90, 90]")
                continue
            if not (-180.0 <= lon <= 180.0):
                errors.append(f"Feature {idx}: Longitude {lon} out of range [-180, 180]")
                continue

            props = feat.get("properties", {}) or {}

            # Brightness temperature
            b_primary = float(props.get("brightness_temperature") or props.get("bright_ti4") or props.get("brightness") or 300.0)
            b_secondary = props.get("bright_ti5_or_t31") or props.get("bright_ti5") or props.get("bright_t31")
            if b_secondary is not None:
                b_secondary = float(b_secondary)

            frp_val = max(0.0, float(props.get("frp") or 0.0))
            acq_date = str(props.get("acquisition_date") or props.get("acq_date") or "2026-03-15").strip().replace("/", "-")
            acq_time = str(props.get("acquisition_time") or props.get("acq_time") or "1200").strip().zfill(4)[:4]

            raw_sat = props.get("satellite", "NOAA-20")
            satellite = normalize_satellite_name(raw_sat)

            raw_inst = props.get("instrument")
            instrument = normalize_instrument_name(raw_inst, props)

            confidence = str(props.get("confidence", "nominal")).strip().lower()
            raw_dn = str(props.get("day_night") or props.get("daynight") or "N").strip().upper()
            day_night = "D" if raw_dn.startswith("D") else "N"

            record = {
                "latitude": lat,
                "longitude": lon,
                "acquisition_date": acq_date,
                "acquisition_time": acq_time,
                "observed_at": parse_observed_at(acq_date, acq_time),
                "satellite": satellite,
                "instrument": instrument,
                "confidence": confidence,
                "brightness_temperature": b_primary,
                "bright_ti5_or_t31": b_secondary,
                "frp": frp_val,
                "day_night": day_night,
                "raw_properties": json.dumps(props)
            }
            records.append(record)
        except Exception as e:
            errors.append(f"Feature {idx}: Unexpected parsing error ({type(e).__name__})")

    return records, errors

def ingest_firms_records(
    db: Session,
    records: List[Dict[str, Any]],
    source: str = "UPLOAD_CSV",
    is_demo: bool = False,
    source_file: Optional[str] = None
) -> FirmsIngestSummary:
    """
    Ingests normalized FIRMS records into the database with explicit deduplication.
    Uses observation_hash (SHA-256 fingerprint) to guarantee zero duplicate observations.
    """
    summary = FirmsIngestSummary(
        records_read=len(records),
        records_inserted=0,
        duplicates_skipped=0,
        invalid_records=0,
        errors=[]
    )

    if not records:
        return summary

    # Extract all candidate hashes in this batch to check existing ones in DB efficiently
    candidate_hashes = []
    record_map = {}
    
    for r in records:
        obs_hash = generate_observation_hash(
            latitude=r["latitude"],
            longitude=r["longitude"],
            acquisition_date=r["acquisition_date"],
            acquisition_time=r["acquisition_time"],
            satellite=r["satellite"],
            instrument=r["instrument"]
        )
        # Check intra-batch duplicate
        if obs_hash in record_map:
            summary.duplicates_skipped += 1
            continue

        r["observation_hash"] = obs_hash
        candidate_hashes.append(obs_hash)
        record_map[obs_hash] = r

    # Query DB for already existing hashes
    existing_hashes = set()
    if candidate_hashes:
        # Query in chunks if candidate_hashes is large
        chunk_size = 900
        for i in range(0, len(candidate_hashes), chunk_size):
            chunk = candidate_hashes[i:i + chunk_size]
            rows = db.query(FirmsHotspot.observation_hash).filter(FirmsHotspot.observation_hash.in_(chunk)).all()
            for row in rows:
                existing_hashes.add(row[0])

    new_entities = []
    for obs_hash, r in record_map.items():
        if obs_hash in existing_hashes:
            summary.duplicates_skipped += 1
            continue

        hotspot_id = f"FIRM-{uuid.uuid4().hex[:10].upper()}"
        entity = FirmsHotspot(
            id=hotspot_id,
            observation_hash=obs_hash,
            latitude=r["latitude"],
            longitude=r["longitude"],
            acquisition_date=r["acquisition_date"],
            acquisition_time=r["acquisition_time"],
            observed_at=r["observed_at"],
            satellite=r["satellite"],
            instrument=r["instrument"],
            confidence=r.get("confidence"),
            brightness_temperature=r["brightness_temperature"],
            bright_ti5_or_t31=r.get("bright_ti5_or_t31"),
            frp=r["frp"],
            day_night=r["day_night"],
            source=source,
            is_demo=is_demo,
            source_file=source_file,
            raw_properties=r.get("raw_properties"),
            ingested_at=datetime.now(timezone.utc).replace(tzinfo=None)
        )
        new_entities.append(entity)

    if new_entities:
        try:
            db.bulk_save_objects(new_entities)
            db.commit()
            summary.records_inserted = len(new_entities)
            logger.info(f"Ingested {summary.records_inserted} new FIRMS hotspots (Source: {source}, Demo: {is_demo}).")
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to commit FIRMS hotspots to database: {e}")
            summary.errors.append("Database commit failed during batch insertion")
            summary.invalid_records += len(new_entities)

    return summary

def seed_demo_firms_data_if_empty(db: Session) -> Optional[FirmsIngestSummary]:
    """
    Seeds standardized synthetic demo FIRMS observations if table is completely empty
    AND settings.ENABLE_DEMO_DATA is True.
    Demo observations are strictly tagged with source='DEMO_DATA' and is_demo=True.
    """
    if not settings.ENABLE_DEMO_DATA:
        logger.info("FIRMS demo data seeding disabled by configuration (ENABLE_DEMO_DATA=False).")
        return None

    count = db.query(FirmsHotspot).count()
    if count > 0:
        logger.info(f"FIRMS hotspot table already contains {count} records; skipping startup demo seeding.")
        return None

    demo_csv_path = os.path.join(settings.DATA_DIR, "demo_firms_hotspots.csv")
    if not os.path.exists(demo_csv_path):
        logger.warning(f"Demo FIRMS CSV file not found at {demo_csv_path}; cannot seed.")
        return None

    try:
        with open(demo_csv_path, "r", encoding="utf-8") as f:
            csv_text = f.read()

        records, errors = parse_firms_csv(csv_text)
        summary = ingest_firms_records(
            db=db,
            records=records,
            source="DEMO_DATA",
            is_demo=True,
            source_file="demo_firms_hotspots.csv"
        )
        logger.info(f"Seeded {summary.records_inserted} synthetic demo FIRMS hotspots from {demo_csv_path}.")
        return summary
    except Exception as e:
        logger.error(f"Error seeding demo FIRMS hotspots: {e}")
        return None

async def fetch_live_firms_hotspots(country_code: str = "IND") -> List[Dict[str, Any]]:
    """
    Fetches real-time satellite fire observations from NASA FIRMS API.
    Falls back gracefully if MAP_KEY is not configured.
    """
    if not settings.NASA_FIRMS_MAP_KEY or settings.NASA_FIRMS_MAP_KEY == "DEMO_KEY":
        logger.info("NASA_FIRMS_MAP_KEY is in DEMO mode; returning pre-loaded sample feeds.")
        return []

    url = f"https://firms.modaps.eosdis.nasa.gov/api/country/csv/{settings.NASA_FIRMS_MAP_KEY}/VIIRS_SNPP_NRT/{country_code}/1"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            if response.status_code == 200:
                records, _ = parse_firms_csv(response.text)
                return records
            else:
                logger.error(f"NASA FIRMS API returned error status: {response.status_code}")
                return []
    except Exception as e:
        logger.error(f"Failed to fetch live FIRMS stream: {e}")
        return []
