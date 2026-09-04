import os
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import logger
from app.db.session import engine, Base, SessionLocal
from app.db.models import IndustrialFacility, IncidentEvent
from app.api.v1 import incidents, facilities, pipeline, alerts, reports, climate, firms

def seed_database_if_empty():
    db = SessionLocal()
    try:
        # 1. Seed Industrial Facilities
        if db.query(IndustrialFacility).count() == 0:
            facilities_path = os.path.join(settings.DATA_DIR, "seed_facilities.json")
            if os.path.exists(facilities_path):
                with open(facilities_path, "r", encoding="utf-8") as f:
                    fac_data = json.load(f)
                for item in fac_data:
                    fac = IndustrialFacility(
                        osm_id=item["osm_id"],
                        name=item["name"],
                        landuse=item.get("landuse", "industrial"),
                        industrial_type=item.get("industrial_type", "general"),
                        hazard_tier=item.get("hazard_tier", 3),
                        latitude=item["latitude"],
                        longitude=item["longitude"],
                        geometry_geojson=item.get("geometry_geojson")
                    )
                    db.add(fac)
                db.commit()
                logger.info(f"Seeded {len(fac_data)} industrial facilities from seed_facilities.json.")

        # 2. Seed Initial Demonstration Incidents if empty
        if db.query(IncidentEvent).count() == 0:
            scenarios_path = os.path.join(settings.DATA_DIR, "seed_scenarios.json")
            if os.path.exists(scenarios_path):
                with open(scenarios_path, "r", encoding="utf-8") as f:
                    scenarios = json.load(f)
                from app.api.v1.pipeline import process_single_hotspot, HotspotInput
                for sc in scenarios:
                    h_in = HotspotInput(**sc["hotspot"])
                    inc = process_single_hotspot(h_in, db)
                    db.add(inc)
                db.commit()
                logger.info(f"Seeded {len(scenarios)} initial demonstration incidents.")

        # 3. Seed Initial Demo FIRMS Observations if empty
        from app.services.firms_service import seed_demo_firms_data_if_empty
        seed_demo_firms_data_if_empty(db)
    except Exception as e:
        logger.error(f"Error during database initialization/seeding: {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing THERMIVEX Database & Geospatial Engine...")
    Base.metadata.create_all(bind=engine)
    seed_database_if_empty()
    logger.info("THERMIVEX Engine Ready.")
    yield
    logger.info("Shutting down THERMIVEX Engine.")

app = FastAPI(
    title="THERMIVEX: Industrial Fire Intelligence API",
    version="1.0.0",
    description="Mission-Critical Geospatial & Remote Sensing AI Engine for Industrial Fire Detection and Persistent Thermal Source Intelligence (SIH 2026).",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router Mounting
app.include_router(incidents.router, prefix=settings.API_V1_STR)
app.include_router(facilities.router, prefix=settings.API_V1_STR)
app.include_router(pipeline.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(climate.router, prefix=settings.API_V1_STR)
app.include_router(firms.router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "HEALTHY",
        "service": "THERMIVEX Geospatial Engine",
        "version": "1.0.0",
        "mission": "Smart India Hackathon 2026"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
