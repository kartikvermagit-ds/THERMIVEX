from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator

class FirmsHotspotBase(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0, description="WGS84 latitude between -90 and 90")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="WGS84 longitude between -180 and 180")
    acquisition_date: str = Field(..., description="Acquisition date (YYYY-MM-DD)")
    acquisition_time: str = Field(..., description="Acquisition time (HHMM UTC)")
    satellite: str = Field(..., description="Satellite platform (e.g. NOAA-20, Suomi-NPP, Terra, Aqua)")
    instrument: str = Field(..., description="Sensor instrument (e.g. VIIRS, MODIS)")
    confidence: Optional[str] = Field(None, description="Detection confidence (e.g. nominal, high, low, or numeric)")
    brightness_temperature: float = Field(..., ge=0.0, description="Primary brightness temperature in Kelvin")
    bright_ti5_or_t31: Optional[float] = Field(None, ge=0.0, description="Secondary band brightness temperature in Kelvin")
    frp: float = Field(0.0, ge=0.0, description="Fire Radiative Power in MW")
    day_night: str = Field("N", description="'D' for Day or 'N' for Night")
    source: str = Field("DEMO_DATA", description="Data provenance (e.g. DEMO_DATA, UPLOAD_CSV, NASA_FIRMS_NRT)")
    is_demo: bool = Field(False, description="Flag explicitly designating demo/synthetic test data")
    source_file: Optional[str] = Field(None, description="Original filename if imported from a file")

    @field_validator("day_night")
    @classmethod
    def validate_day_night(cls, v: str) -> str:
        clean = (v or "N").strip().upper()
        return "D" if clean.startswith("D") else "N"

    @field_validator("acquisition_date")
    @classmethod
    def validate_date(cls, v: str) -> str:
        v = v.strip()
        # Accept YYYY-MM-DD or YYYY/MM/DD
        v = v.replace("/", "-")
        return v

    @field_validator("acquisition_time")
    @classmethod
    def validate_time(cls, v: str) -> str:
        clean = str(v).strip().zfill(4)
        if len(clean) > 4:
            clean = clean[:4]
        return clean

class FirmsHotspotResponse(FirmsHotspotBase):
    id: str
    observation_hash: str
    observed_at: datetime
    ingested_at: datetime
    raw_properties: Optional[str] = None

    class Config:
        from_attributes = True

class FirmsHotspotListResponse(BaseModel):
    total_count: int
    hotspots: List[FirmsHotspotResponse]

class FirmsGeoJSONGeometry(BaseModel):
    type: str = "Point"
    coordinates: List[float] # [longitude, latitude]

class FirmsHotspotGeoJSONFeature(BaseModel):
    type: str = "Feature"
    geometry: FirmsGeoJSONGeometry
    properties: Dict[str, Any]

class FirmsHotspotGeoJSONCollection(BaseModel):
    type: str = "FeatureCollection"
    total_count: int
    features: List[FirmsHotspotGeoJSONFeature]

class FirmsIngestSummary(BaseModel):
    records_read: int = 0
    records_inserted: int = 0
    duplicates_skipped: int = 0
    invalid_records: int = 0
    errors: List[str] = []
