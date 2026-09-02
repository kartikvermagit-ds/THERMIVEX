# THERMIVEX: AI-Based Industrial Fire & Persistent Thermal Source Intelligence Platform

[![SIH 2026](https://img.shields.io/badge/SIH-2026-orange.svg)](https://sih.gov.in/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![PostGIS](https://img.shields.io/badge/Geospatial-PostGIS-336791.svg)](https://postgis.net/)
[![React](https://img.shields.io/badge/Frontend-React_19_+_Leaflet-61DAFB.svg)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Smart India Hackathon (SIH 2026)**  
> **Problem Statement:** AI-Based Detection and Classification of Industrial Fires and Persistent Thermal Sources using NASA FIRMS, OSM & Satellite Data  
> **Repository:** [kartikvermagit-ds/THERMIVEX](https://github.com/kartikvermagit-ds/THERMIVEX.git)

---

## 1. Executive Summary

Spaceborne sensors (VIIRS, MODIS) detect thousands of thermal anomalies across India daily. However, standard NASA FIRMS output provides only raw coordinates without semantic context—it cannot tell whether a 375 m pixel detection is an accidental chemical explosion, a routinely operating refinery flare stack, legal crop burning, or solar glint off a metal roof.

**THERMIVEX** (*Thermal & Industrial Anomaly Verification and Explainability Engine*) solves alert fatigue and emergency latency by combining:
1. **NASA FIRMS Near-Real-Time (NRT) Satellite Streams** (VIIRS 375m & MODIS 1km)
2. **OpenStreetMap (OSM) Semantic Industrial Geometries & Hazard Ontologies**
3. **The Thermal History Registry (THR)**: 36-month local baseline tracking persistence ($PI$) and FRP anomaly surge ($\Delta Z_{\text{FRP}}$)
4. **Two-Tier Decision Engine**: Deterministic physical safety gating + Calibrated Multi-Class Classifier
5. **TreeSHAP Explainable AI (XAI)**: Quantifying exact feature attributions for disaster commanders
6. **2D Gaussian Plume Dispersion Modeling**: Real-time downwind toxic hazard cones
7. **Automated Incident Dossier Engine**: One-click generation of tactical PDF briefing cards

---

## 2. Key Architecture & Data Flow

```
 [ SATELLITE PASS (VIIRS / MODIS) ]
                 │
                 ▼
 [ NASA FIRMS NRT INGESTION WORKER ] ──────► Deduplication & Scan-Track Footprint (375m)
                 │
                 ▼
 [ POSTGIS SPATIAL JOIN ENGINE ] ──────────► OSM Industrial Geometries (Direct Hit / Perimeter)
                 │
                 ▼
 [ TEMPORAL PERSISTENCE ENGINE ] ──────────► 36-Month Thermal Baseline (PI & FRP Delta Z-Score)
                 │
                 ▼
 [ TWO-TIER DECISION & ML ENGINE ] ────────► Accidental Fire vs. Routine Flaring vs. False Positive
                 │
                 ▼
 [ COMPOSITE RISK SCORING (0-100) ] ───────► Multi-Factor Index + 2D Gaussian Plume Cone
                 │
                 ▼
 [ FASTAPI ASYNC SERVICE LAYER ] ──────────► RESTful GeoJSON Feed + WebSocket Dispatch
                 │
                 ▼
 [ MISSION-CONTROL GIS WORKBENCH ] ────────► Triage Rail, 2.5D Buildings, TreeSHAP & PDF Dossier
```

---

## 3. The 4 Operational Classes

| Class | Semantic Meaning | Color Symbology | Example Case |
| :--- | :--- | :--- | :--- |
| **ACCIDENTAL_INDUSTRIAL_FIRE** | Critical emergency requiring immediate foam tender dispatch. | 🔴 Pulsing Red Diamond (`#EF4444`) | Dahej PCPIR chemical storage blast ($\Delta Z = +6.8\sigma$) |
| **PERSISTENT_OPERATIONAL_SOURCE** | Routine operational heat; suppressed from emergency alerts. | 🟣 Slate Purple Circle (`#818CF8`) | Jamnagar Refinery flaring stack ($PI = 0.94$, normal FRP) |
| **NON_INDUSTRIAL_AGRICULTURAL** | Rural crop stubble or forest fire outside industrial boundary. | 🟤 Muted Amber Triangle (`#F59E0B`) | Punjab agricultural residue burning 650m outside factory |
| **SENSOR_ARTIFACT_OR_GLINT** | Solar reflection off corrugated metal roof or hot asphalt. | ⚪ Dim Grey Ring (`#64748B`) | Midday daytime low-differential thermal artifact |

---

## 4. Project Directory Structure

```
THERMIVEX/
├── backend/
│   ├── app/
│   │   ├── api/v1/
│   │   │   ├── incidents.py       # GeoJSON live feed & investigation dossier
│   │   │   ├── facilities.py      # OSM industrial polygons & KNN search
│   │   │   ├── pipeline.py        # Stream ingestion & demo scenario simulation
│   │   │   ├── alerts.py          # Emergency notification webhook dispatch
│   │   │   └── reports.py         # Automated incident briefing PDF / JSON
│   │   ├── core/
│   │   │   ├── config.py          # App settings & environment variables
│   │   │   └── logging.py         # Structured mission-control logger
│   │   ├── db/
│   │   │   ├── session.py         # Dual-mode engine (PostgreSQL/PostGIS + SQLite)
│   │   │   └── models.py          # SQLAlchemy ORM models
│   │   ├── services/
│   │   │   ├── firms_service.py   # NASA FIRMS API parser & client
│   │   │   ├── osm_service.py     # Haversine distance, buffers & footprint polygons
│   │   │   ├── persistence_service.py # 36-mo baseline, PI & Delta Z-Score
│   │   │   ├── ml_service.py      # Two-Tier classifier & TreeSHAP XAI
│   │   │   └── risk_service.py    # Composite Risk Score & Gaussian plume vector
│   │   ├── data/
│   │   │   ├── seed_facilities.json # Real industrial clusters (Dahej, Jamnagar, Manesar)
│   │   │   └── seed_scenarios.json  # SIH Grand Finale demonstration scenarios
│   │   └── main.py                # FastAPI application root & lifespan
│   ├── test_backend.py            # Integration test suite
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── TopNav.tsx         # Ingestion status, UTC clock, scenario trigger
│   │   │   ├── TriageRail.tsx     # Hick's Law Top-3 critical alert queue
│   │   │   ├── MapCanvas.tsx      # Tactical Leaflet GIS canvas with plume cones
│   │   │   ├── EvidenceDrawer.tsx # Deep-dive telemetry, TreeSHAP & PDF export
│   │   │   └── LayerControl.tsx   # Persistent floating layer pill strip
│   │   ├── types/
│   │   │   └── incident.ts        # GeoJSON & Telemetry TypeScript interfaces
│   │   ├── services/
│   │   │   └── api.ts             # Typed REST client
│   │   ├── App.tsx                # Master mission-control dashboard
│   │   ├── index.css              # Dark tactical design tokens & radar animations
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docker-compose.yml             # Full-stack containerized deployment
└── README.md
```

---

## 5. Quickstart Guide

### Option A: One-Command Docker Deployment (Recommended)

```bash
git clone https://github.com/kartikvermagit-ds/THERMIVEX.git
cd THERMIVEX
docker compose up --build
```
* **Frontend Dashboard:** `http://localhost:3000`
* **FastAPI Backend Swagger Docs:** `http://localhost:8000/docs`
* **PostGIS Database:** `localhost:5432`

---

### Option B: Local Development (Zero-Dependency SQLite Mode)

#### 1. Start Backend:
```bash
cd backend
py -m pip install -r requirements.txt
py -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Start Frontend:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 6. SIH Grand Finale Demonstration Sequence (4 Minutes)

During jury evaluation, use the built-in **"DEMO SCENARIO"** dropdown in the top bar:

1. **Act 1: The Baseline State (Eliminating Alert Fatigue):**
   - Click `Jamnagar Refinery Stack #12: Routine Operational Heat`.
   - The map highlights the refinery in purple ring symbology.
   - Explain to the jury: *"Our Thermal History Registry detects an active 52-week recurrence index of 0.94 with normal operational variance ($\Delta Z \approx 0$). The system suppresses this from the emergency queue, eliminating alert fatigue."*

2. **Act 2: Agricultural False Positive Suppression:**
   - Click `Ludhiana Corridor: Agricultural Stubble Fire Near Industrial Fence`.
   - The map displays an amber marker 650m outside the factory perimeter.
   - Explain: *"High-energy crop burning occurs 650m away from the industrial boundary. The two-tier filter categorizes it as agricultural, preventing emergency dispatch waste."*

3. **Act 3: Critical Chemical Explosion Injection:**
   - Click `Dahej PCPIR: Critical Chemical Tank Explosion & Conflagration`.
   - The UI immediately triggers a pulsing red sonar ping reticle with Risk Score 94/100 (`CRITICAL`).
   - The map automatically projects the 2D Gaussian wind plume downwind towards residential sectors.
   - Explain: *"An unprecedented 86.4 MW blast inside a Tier-5 bulk oil terminal triggers a +6.8 sigma surge. The system calculates downwind toxic plume dispersion in milliseconds."*

4. **Act 4: One-Click Incident Dossier Generation:**
   - Click `PDF Dossier` in the Evidence Drawer.
   - An emergency tactical briefing card downloads instantly with full TreeSHAP attributions and responder recommendations.

---

## 7. License & Credits

Built for the **Smart India Hackathon 2026** by Team THERMIVEX.  
Open-source released under the **MIT License**. OpenStreetMap data is licensed under the **Open Database License (ODbL)**. NASA FIRMS data is distributed under the **NASA Earth Science Data Policy**.
