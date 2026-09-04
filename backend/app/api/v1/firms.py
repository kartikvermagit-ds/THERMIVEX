import os
import json
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.core.config import settings
from app.core.logging import logger
from app.db.session import get_db
from app.db.models import FirmsHotspot
from app.schemas.firms_schemas import (
    FirmsHotspotResponse,
    FirmsHotspotListResponse,
    FirmsHotspotGeoJSONCollection,
    FirmsHotspotGeoJSONFeature,
    FirmsGeoJSONGeometry,
    FirmsIngestSummary
)
from app.services.firms_service import (
    parse_firms_csv,
    parse_firms_geojson,
    ingest_firms_records,
    seed_demo_firms_data_if_empty
)

router = APIRouter(prefix="/firms", tags=["NASA FIRMS Observations"])

@router.get(
    "/hotspots",
    response_model=None,
    summary="Retrieve Normalized Spaceborne Thermal Hotspot Observations"
)
def get_firms_hotspots(
    date: Optional[str] = Query(None, description="Acquisition date filter (YYYY-MM-DD)"),
    satellite: Optional[str] = Query(None, description="Satellite platform (e.g. NOAA-20, Suomi-NPP, Terra, Aqua)"),
    instrument: Optional[str] = Query(None, description="Instrument filter (e.g. VIIRS, MODIS)"),
    min_frp: Optional[float] = Query(None, ge=0.0, description="Minimum Fire Radiative Power (MW) threshold"),
    day_night: Optional[str] = Query(None, description="'D' for Day, 'N' for Night"),
    source: Optional[str] = Query(None, description="Provenance filter (e.g. DEMO_DATA, UPLOAD_CSV, NASA_FIRMS_NRT)"),
    is_demo: Optional[bool] = Query(None, description="Filter for synthetic demo observations"),
    bbox: Optional[str] = Query(
        None,
        description="Bounding box: min_longitude,min_latitude,max_longitude,max_latitude (e.g. 72.0,20.0,73.0,21.0)"
    ),
    format: str = Query("json", description="Output format: 'json' or 'geojson'"),
    limit: int = Query(100, ge=1, le=500, description="Max records to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    db: Session = Depends(get_db)
):
    """
    Returns normalized spaceborne thermal anomaly observations from the firms_hotspots table.
    Supports attribute filtering, WGS84 bounding box queries, and RFC 7946 GeoJSON output.
    """
    query = db.query(FirmsHotspot)

    # 1. Date Filter
    if date:
        clean_date = date.strip().replace("/", "-")
        query = query.filter(FirmsHotspot.acquisition_date == clean_date)

    # 2. Satellite & Instrument Filters
    if satellite:
        query = query.filter(func.upper(FirmsHotspot.satellite) == satellite.strip().upper())
    if instrument:
        query = query.filter(func.upper(FirmsHotspot.instrument) == instrument.strip().upper())

    # 3. Minimum FRP
    if min_frp is not None:
        query = query.filter(FirmsHotspot.frp >= min_frp)

    # 4. Day / Night Filter
    if day_night:
        clean_dn = "D" if day_night.strip().upper().startswith("D") else "N"
        query = query.filter(FirmsHotspot.day_night == clean_dn)

    # 5. Provenance & Demo Flag
    if source:
        query = query.filter(FirmsHotspot.source == source.strip())
    if is_demo is not None:
        query = query.filter(FirmsHotspot.is_demo == is_demo)

    # 6. Spatial Bounding Box Filter (min_longitude,min_latitude,max_longitude,max_latitude)
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
                detail="Invalid bbox values. All coordinates must be numeric floats."
            )

        # Coordinate boundary validations
        if not (-180.0 <= min_lon <= 180.0 and -180.0 <= max_lon <= 180.0):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Longitude values must be between -180 and 180."
            )
        if not (-90.0 <= min_lat <= 90.0 and -90.0 <= max_lat <= 90.0):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Latitude values must be between -90 and 90."
            )
        if min_lon >= max_lon:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid bbox longitude order: min_longitude ({min_lon}) must be strictly less than max_longitude ({max_lon})."
            )
        if min_lat >= max_lat:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid bbox latitude order: min_latitude ({min_lat}) must be strictly less than max_latitude ({max_lat})."
            )

        query = query.filter(
            FirmsHotspot.longitude >= min_lon,
            FirmsHotspot.longitude <= max_lon,
            FirmsHotspot.latitude >= min_lat,
            FirmsHotspot.latitude <= max_lat
        )

    total_count = query.count()
    records = query.order_by(desc(FirmsHotspot.observed_at), desc(FirmsHotspot.frp)).offset(offset).limit(limit).all()

    # GeoJSON Format Output
    if format.lower() == "geojson":
        features = []
        for r in records:
            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    # RFC 7946: coordinate order is [longitude, latitude]
                    "coordinates": [round(r.longitude, 5), round(r.latitude, 5)]
                },
                "properties": {
                    "id": r.id,
                    "observation_hash": r.observation_hash,
                    "latitude": r.latitude,
                    "longitude": r.longitude,
                    "acquisition_date": r.acquisition_date,
                    "acquisition_time": r.acquisition_time,
                    "observed_at": r.observed_at.isoformat() if r.observed_at else None,
                    "satellite": r.satellite,
                    "instrument": r.instrument,
                    "confidence": r.confidence,
                    "brightness_temperature": r.brightness_temperature,
                    "bright_ti5_or_t31": r.bright_ti5_or_t31,
                    "frp": r.frp,
                    "day_night": r.day_night,
                    "source": r.source,
                    "is_demo": r.is_demo,
                    "source_file": r.source_file,
                    "ingested_at": r.ingested_at.isoformat() if r.ingested_at else None
                }
            }
            features.append(feature)

        return {
            "type": "FeatureCollection",
            "total_count": total_count,
            "features": features
        }

    # Standard Tabular JSON Output
    serialized_hotspots = [FirmsHotspotResponse.model_validate(r) for r in records]
    return {
        "total_count": total_count,
        "hotspots": [h.model_dump() for h in serialized_hotspots]
    }

@router.post(
    "/import/file",
    response_model=FirmsIngestSummary,
    status_code=status.HTTP_200_OK,
    summary="Import FIRMS Observations from CSV or GeoJSON File"
)
async def import_firms_file(
    file: UploadFile = File(..., description="NASA FIRMS CSV or GeoJSON file (.csv, .geojson, .json)"),
    source_label: Optional[str] = Form("UPLOAD_FILE", description="Provenance label for ingested records"),
    is_demo_flag: Optional[bool] = Form(False, description="Flag explicitly designating demo/test data"),
    db: Session = Depends(get_db)
):
    """
    Safely ingests FIRMS observations from an uploaded file.
    Validates file format, size limits, coordinates, and rejects duplicates using SHA-256 fingerprints.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a valid filename."
        )

    filename_lower = file.filename.lower()
    allowed_extensions = (".csv", ".geojson", ".json")
    if not any(filename_lower.endswith(ext) for ext in allowed_extensions):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{file.filename}'. Allowed formats: .csv, .geojson, .json"
        )

    # Read content with upload size check
    try:
        content_bytes = await file.read()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to read uploaded file."
        )

    if len(content_bytes) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed upload size ({settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)} MB)."
        )

    if len(content_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )

    try:
        text_content = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file could not be decoded as UTF-8 text."
        )

    # Parse by extension
    records = []
    parse_errors = []

    if filename_lower.endswith(".csv"):
        records, parse_errors = parse_firms_csv(text_content)
        default_source = source_label or "UPLOAD_CSV"
    else:
        try:
            geojson_data = json.loads(text_content)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Malformed GeoJSON: File contains invalid JSON syntax."
            )
        records, parse_errors = parse_firms_geojson(geojson_data)
        default_source = source_label or "UPLOAD_GEOJSON"

    if not records and parse_errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to extract valid observations from {file.filename}: {'; '.join(parse_errors[:5])}"
        )

    # Ingest validated records with deduplication
    summary = ingest_firms_records(
        db=db,
        records=records,
        source=default_source,
        is_demo=bool(is_demo_flag),
        source_file=file.filename
    )

    # Append any parsing errors to summary
    summary.invalid_records += len(parse_errors)
    summary.errors.extend(parse_errors[:20]) # Cap to avoid huge response payloads

    return summary

@router.post(
    "/import/demo",
    response_model=FirmsIngestSummary,
    status_code=status.HTTP_200_OK,
    summary="Import Standardized Synthetic Demo FIRMS Dataset"
)
def import_demo_data(db: Session = Depends(get_db)):
    """
    Imports the standardized synthetic demo FIRMS dataset for testing.
    All records are clearly labeled with source='DEMO_DATA' and is_demo=True.
    Idempotent and deduplication-safe.
    """
    demo_csv_path = os.path.join(settings.DATA_DIR, "demo_firms_hotspots.csv")
    if not os.path.exists(demo_csv_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Demo dataset file not found at {demo_csv_path}"
        )

    with open(demo_csv_path, "r", encoding="utf-8") as f:
        csv_text = f.read()

    records, parse_errors = parse_firms_csv(csv_text)
    summary = ingest_firms_records(
        db=db,
        records=records,
        source="DEMO_DATA",
        is_demo=True,
        source_file="demo_firms_hotspots.csv"
    )
    summary.invalid_records += len(parse_errors)
    summary.errors.extend(parse_errors)
    return summary
