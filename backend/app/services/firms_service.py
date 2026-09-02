import csv
import io
import httpx
from typing import List, Dict, Any
from app.core.config import settings
from app.core.logging import logger

def parse_firms_csv(csv_text: str) -> List[Dict[str, Any]]:
    """Parses NASA FIRMS NRT CSV format into structured hotspot records."""
    records = []
    reader = csv.DictReader(io.StringIO(csv_text.strip()))
    for row in reader:
        try:
            record = {
                "latitude": float(row.get("latitude", 0.0)),
                "longitude": float(row.get("longitude", 0.0)),
                "bright_ti4": float(row.get("bright_ti4", row.get("brightness", 300.0))),
                "bright_ti5": float(row.get("bright_ti5", row.get("bright_t31", 290.0))),
                "frp": float(row.get("frp", 1.0)),
                "acq_date": row.get("acq_date", "2026-03-15"),
                "acq_time": row.get("acq_time", "1200"),
                "satellite": row.get("satellite", "NOAA-20"),
                "daynight": row.get("daynight", "N"),
                "confidence": row.get("confidence", "nominal")
            }
            records.append(record)
        except Exception as e:
            logger.warning(f"Skipping malformed FIRMS row: {row} - Error: {e}")
    return records

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
                return parse_firms_csv(response.text)
            else:
                logger.error(f"NASA FIRMS API returned error status: {response.status_code}")
                return []
    except Exception as e:
        logger.error(f"Failed to fetch live FIRMS stream: {e}")
        return []
