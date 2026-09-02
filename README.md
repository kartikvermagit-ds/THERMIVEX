# THERMIVEX: AI-Based Industrial Fire & Persistent Thermal Source Intelligence Platform

[![SIH 2026](https://img.shields.io/badge/SIH-2026-orange.svg)](https://sih.gov.in/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![PostGIS](https://img.shields.io/badge/Geospatial-PostGIS-336791.svg)](https://postgis.net/)
[![React 19](https://img.shields.io/badge/Frontend-React_19_+_Vite-61DAFB.svg)](https://react.dev/)
[![Leaflet](https://img.shields.io/badge/GIS-Leaflet_+_Esri_Satellite-199900.svg)](https://leafletjs.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Smart India Hackathon (SIH 2026) — Grand Finale Platform**  
> **Problem Statement (SIH26162):** AI-Based Detection and Classification of Industrial Fires and Persistent Thermal Sources using NASA FIRMS, OSM & Satellite Data  
> **GitHub Repository:** [kartikvermagit-ds/THERMIVEX](https://github.com/kartikvermagit-ds/THERMIVEX.git)

---

## 1. What is THERMIVEX? (In Simple Terms)

Every single day, spaceborne satellite radiometers (VIIRS on NOAA-20/Suomi-NPP, and MODIS on Terra/Aqua) detect thousands of heat points (thermal anomalies) across the Indian subcontinent. 

However, standard satellite feeds provide only raw GPS coordinates without semantic context: **a regular refinery flare stack, a catastrophic chemical factory explosion, and a farmer burning crop stubble look like the exact same red dot.** 

When every thermal source triggers an emergency alarm, disaster authorities suffer from **Alert Fatigue** and cannot prioritize real life-threatening disasters.

**THERMIVEX** solves this crisis by combining spaceborne thermal radiometry, OpenStreetMap infrastructure geometries, 36 months of historical baseline tracking, and explainable machine learning:

| Feature | Standard NASA FIRMS Feed | THERMIVEX Platform |
| :--- | :--- | :--- |
| **Alert Fatigue** | ❌ Lights up red on every refinery chimney daily | ✅ **Auto-suppresses routine flares** via 36-month baseline ($PI \ge 0.90$) |
| **Spatial Precision** | ❌ 375m unreferenced coordinate point | ✅ **Geofenced to plant boundaries** (Direct Hit vs. Perimeter Offset) |
| **Agricultural Glint** | ❌ Stubble burning triggers false industrial alert | ✅ **Calculates geodesic offset distance line** (e.g., 1,210m outside fence) |
| **Toxic Plume Modeling** | ❌ None (no meteorological coupling) | ✅ **2D Gaussian smoke plume dispersion cone** showing downwind threat |
| **Explainability** | ❌ Black-box / None | ✅ **TreeSHAP feature attributions** showing exact physical drivers |
| **Emergency Dispatch** | ❌ None | ✅ **One-click fire tender dispatch** & instant tactical **PDF briefing dossiers** |
| **GIS Portability** | ❌ CSV download | ✅ **RFC 7946 GeoJSON export** for QGIS, ArcGIS Pro & Google Earth |

---

## 2. End-to-End System Architecture

```
                       [ SPACEBORNE SENSORS ]
             VIIRS (375m) • MODIS (1km) • Sentinel-2 (20m)
                                │
                                ▼
               [ NASA FIRMS NRT INGESTION LAYER ]
          Deduplication, 375m Scan-Track Diamond Generation
                                │
                                ▼
               [ POSTGIS SPATIAL GEOFENCING ENGINE ]
          OSM Industrial Polygons • Hazard Tier (1-5) • Buffers
                                │
                                ▼
             [ 36-MONTH THERMAL HISTORY REGISTRY (THR) ]
          Recurrence Index (PI) • FRP Anomaly Surge (ΔZ-Score)
                                │
                                ▼
               [ TWO-TIER MACHINE LEARNING ENGINE ]
     Tier 1: Physical Boundary & Glint Gating ──► Tier 2: XGBoost Classifier
                                │
                                ▼
               [ COMPOSITE RISK & ATMOSPHERIC ENGINE ]
         Risk Score (0-100) • Open-Meteo Wind Coupling • Gaussian Plume
                                │
       ┌────────────────────────┴────────────────────────┐
       ▼                                                 ▼
[ FASTAPI SERVICE LAYER ]                      [ TACTICAL MISSION-CONTROL ]
• GeoJSON Live Feed                            • 1m Esri Satellite Basemap
• Automated PDF Incident Dossier               • CAD Triage Rail & Live Filters
• National SitRep Generator (MD)               • Geodesic Offset Vectors
• Webhook Emergency Dispatch                   • Sentinel-2 SWIR Swipe Slider
```

---

## 3. The 4 Operational Classifications

| Class | Symbology | Tactical Meaning | Real-World Example |
| :--- | :--- | :--- | :--- |
| **`ACCIDENTAL_INDUSTRIAL_FIRE`** | 🔴 **Pulsing Red Diamond** | Catastrophic blaze or explosion inside hazardous material inventory; triggers immediate emergency foam tenders. | **Dahej PCPIR Chemical Terminal #4:** 86.4 MW blast, $\Delta Z = +6.91\sigma$ unprecedented surge, Risk **97/100**. |
| **`PERSISTENT_OPERATIONAL_SOURCE`** | 🟣 **Slate Purple Ring** | Routine operational heat source (refinery flaring stack, blast furnace, cement kiln); auto-suppressed to avoid alert fatigue. | **Reliance Jamnagar Complex (Stack 12):** 94% weekly recurrence over 3 years, $\Delta Z = +0.34\sigma$, Risk **17/100**. |
| **`NON_INDUSTRIAL_AGRICULTURAL`** | 🟡 **Amber Ring & Vector** | Biomass or crop residue burning occurring outside the industrial fence line. | **Ludhiana Focal Point Belt:** Stubble burning 1,210.4m outside perimeter; distance vector drawn on map, Risk **47/100**. |
| **`SENSOR_ARTIFACT_OR_GLINT`** | ⚪ **Muted Gray Ring** | Solar glint off metal roofs or high diurnal road temperatures; filtered out by nighttime and differential checks. | High midday brightness without thermal differential $(T_4 - T_5 < 5\,\text{K})$. |

---

## 4. Scientific Formulations & Mathematics

### A. FRP Anomaly Surge Score ($\Delta Z_{\text{FRP}}$)
To distinguish routine heat from an active disaster, the system computes the statistical standard score above the plant's 36-month baseline:
$$\Delta Z_{\text{FRP}} = \frac{\text{FRP}_{\text{observed}} - \mu_{\text{historical}}}{\sigma_{\text{historical}} + \epsilon}$$
* A routine flare at Jamnagar has $\text{FRP} \approx \mu \implies \Delta Z \approx 0\sigma$ (Safe).
* An explosion at Dahej surges to $+6.91\sigma$ (99.9999% statistical anomaly $\implies$ Emergency).

### B. Composite Risk Score (CRS: 0–100)
$$\text{CRS} = \left(0.30 \cdot S_{\text{hazard}}\right) + \left(0.25 \cdot S_{\text{facility}}\right) + \left(0.25 \cdot S_{\text{anomaly}}\right) + \left(0.20 \cdot S_{\text{proximity}}\right)$$
* $S_{\text{hazard}} = \min\left(100, \frac{\ln(1 + \text{FRP})}{\ln(151)} \times 100\right)$ (Logarithmic radiative power)
* $S_{\text{facility}} = \text{Hazard Tier} \times 20$ (Tier 1–5 chemical classification)
* $S_{\text{anomaly}} = \frac{100}{1 + \exp(-(\Delta Z - 2.5))}$ (Sigmoidal anomaly multiplier)
* $S_{\text{proximity}} = 100 - \left(\frac{\text{Distance}}{9}\right)$ (Geodesic decay to boundary)

### C. 2D Gaussian Downwind Plume Dispersion
Couples surface wind vectors from meteorological feeds to determine downwind toxic smoke envelopes:
$$C(x, y) = \frac{Q}{\pi u \sigma_y \sigma_z} \exp\left(-\frac{y^2}{2\sigma_y^2}\right)$$
* $u$ = Wind velocity (km/h) at bearing $\theta$
* $Q \propto \text{FRP}$ (Emission rate proportional to radiative combustion energy)
* Cone extends $0.8\text{ km} - 4.5\text{ km}$ downwind with a $24^\circ$ divergence angle.

---

## 5. Quickstart Guide (Single Master Command)

### The 1-Command Launch (Backend + Frontend):

From the project root:
```bash
npm install
npm run dev
```

This single command automatically:
1. Detects your active Python environment (`py` on Windows, or `python3`/`python` on Linux/macOS)
2. Starts the **FastAPI Geospatial Engine** at `http://localhost:8000` (Swagger docs at `http://localhost:8000/docs`)
3. Starts the **Tactical Mission-Control Console** at `http://localhost:5173`
4. Automatically hot-reloads on any code modifications

---

### Option B: Full-Stack Docker Deployment

```bash
docker compose up --build
```
* **Frontend Web Console:** `http://localhost:3000`
* **FastAPI Backend REST API:** `http://localhost:8000/docs`
* **PostGIS Geospatial Database:** `localhost:5432`

---

## 6. How Does the System Work Without API Keys?

1. **Photorealistic 1-Meter Satellite Basemap:**  
   Powered by **Esri World Imagery (ArcGIS Online)**. Esri provides high-resolution spaceborne tiles open for web viewers without requiring proprietary API tokens or generating watermarks.
2. **Thermal Hotspots & Industrial Baseline:**  
   Includes a built-in validated seed database of authentic NOAA-20 / Suomi-NPP VIIRS passes over real Indian industrial complexes (**Dahej PCPIR, Jamnagar Refinery, IMT Manesar, Ludhiana, Panoli, Chembur**).
3. **Adding a Live NASA FIRMS MAP_KEY (Optional):**  
   To stream live continuous NASA data, obtain a free 32-character key from the [NASA FIRMS Portal](https://firms.modaps.eosdis.nasa.gov/api/map_key/) and add it to `backend/.env`:
   ```env
   NASA_FIRMS_MAP_KEY="your_32_char_nasa_key"
   ```

---

## 7. SIH Grand Finale 4-Minute Presentation Sequence

Use the **"Test Scenarios..."** dropdown in the top bar to run a live demonstration in front of the jury:

### Step 1: Prove Alert Fatigue Elimination (Jamnagar Refinery)
- Click **`Jamnagar Refinery: Routine Operational Heat`**.
- The camera flies to the world's largest refining complex.
- Symbology turns **Purple Routine** (Risk 17/100).
- Explain to jury: *"Our 36-month baseline proves this stack operates 94% of the year. Normal systems trigger sirens every day; THERMIVEX auto-suppresses it."*

### Step 2: Prove Agricultural False Positive Filtering (Ludhiana)
- Click **`Ludhiana Focal Point: Agricultural Residue Burning`**.
- The camera flies to Punjab. An amber ring appears with an **amber dashed geodesic vector line**.
- The on-map measurement reads: `Offset: 1,210.4m (Outside Industrial Perimeter)`.
- Explain: *"Crop stubble burning is occurring outside the factory perimeter. THERMIVEX isolates the offset and prevents dispatch waste."*

### Step 3: Trigger a Critical Disaster (Dahej Explosion)
- Click **`Dahej PCPIR: Critical Chemical Tank Explosion`**.
- An 86.4 MW blast surges to $+6.91\sigma$. Risk jumps to **97/100 (CRITICAL)**.
- The map draws an active **Red Sonar Pulse** and projects the **2D Gaussian Downwind Toxic Plume Cone** towards downwind residential sectors.

### Step 4: Open Forensic Audit & Sentinel-2 Swipe Inspection
- Click the Dahej incident card to slide open the **Evidence Drawer**.
- **Drag the interactive swipe slider** across the satellite chip:
  - Left: Pre-Event Optical RGB Baseline (normal factory layout).
  - Right: Post-Event Sentinel-2 SWIR False Color (saturated 2.19µm thermal combustion core).
- Show the **TreeSHAP Attribution Waterfall** proving why AI made this decision.

### Step 5: One-Click Dispatch & SitRep Export
- Click **`Dispatch Emergency Alert`** (simulates authenticated CAD webhook).
- Click **`PDF Dossier`** (downloads printable incident command dossier).
- Click **`SitRep`** in the top bar (downloads automated National Situation Report for the District Magistrate).
- Click **`GeoJSON`** (exports standard GIS vectors for QGIS / ArcGIS Pro).

---

## 8. Complete REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | System health check and database connectivity status |
| `GET` | `/api/v1/incidents/feed` | Real-time GeoJSON FeatureCollection of all thermal clusters |
| `GET` | `/api/v1/incidents/export/geojson` | **Download RFC 7946 GeoJSON dataset** for QGIS / ArcGIS Pro |
| `GET` | `/api/v1/incidents/{id}/investigate` | Full forensic investigation dossier with TreeSHAP attributions |
| `GET` | `/api/v1/incidents/stats` | Macro incident statistics (Critical, Routine, Suppressed counts) |
| `GET` | `/api/v1/facilities` | GeoJSON polygons of registered OSM industrial facilities |
| `GET` | `/api/v1/facilities/nearby` | K-Nearest Neighbor (KNN) spatial search around GPS coordinates |
| `POST`| `/api/v1/pipeline/simulate/{id}` | Injects simulated live disaster scenarios for evaluation |
| `POST`| `/api/v1/alerts/dispatch` | Transmits emergency notification webhooks to fire stations |
| `GET` | `/api/v1/reports/dossier/{id}/pdf` | Generates and streams printable tactical briefing PDF |
| `GET` | `/api/v1/reports/sitrep/summary` | Aggregated 24-hour National Situational Report (JSON) |
| `GET` | `/api/v1/reports/sitrep/markdown` | **Download formal National SitRep Markdown document** |

---

## 9. Project Directory Layout

```
THERMIVEX/
├── backend/
│   ├── app/
│   │   ├── api/v1/
│   │   │   ├── incidents.py        # GeoJSON feed & QGIS export
│   │   │   ├── facilities.py       # OSM polygons & KNN search
│   │   │   ├── pipeline.py         # Stream ingestion & scenario simulation
│   │   │   ├── alerts.py           # Dispatch notifications
│   │   │   └── reports.py          # PDF dossier & SitRep generator
│   │   ├── core/                   # App configuration & logging
│   │   ├── db/                     # Dual-mode PostgreSQL/PostGIS & SQLite
│   │   ├── services/
│   │   │   ├── firms_service.py    # NASA FIRMS NRT API parser
│   │   │   ├── osm_service.py      # Spatial joins & 375m footprints
│   │   │   ├── persistence_service.py # 36-month baseline & Delta Z
│   │   │   ├── ml_service.py       # Two-Tier classifier & TreeSHAP
│   │   │   └── risk_service.py     # Composite Risk & Gaussian plume
│   │   ├── data/                   # Seed industrial facilities & scenarios
│   │   └── main.py                 # FastAPI application root
│   ├── requirements.txt
│   ├── Dockerfile
│   └── test_backend.py             # Full backend integration test suite
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── TopNav.tsx          # Macro metrics, SitRep & GeoJSON export
│   │   │   ├── TriageRail.tsx      # CAD incident queue with live search
│   │   │   ├── MapCanvas.tsx       # Leaflet GIS canvas with plume & geodesic line
│   │   │   ├── EvidenceDrawer.tsx  # Dual-band swipe slider & TreeSHAP
│   │   │   ├── CorridorBar.tsx     # Quick-jump to industrial hubs
│   │   │   ├── TimelineScrubber.tsx # Temporal playback of satellite overpasses
│   │   │   ├── MapLegend.tsx       # Collapsible on-map tactical guide
│   │   │   └── SystemGuideModal.tsx # 4-step onboarding explainer modal
│   │   ├── services/api.ts         # Typed REST client
│   │   ├── types/incident.ts       # TypeScript interfaces
│   │   ├── App.tsx                 # Master mission-control dashboard
│   │   └── index.css               # Clean slate tactical tokens
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── scripts/
│   └── start-backend.js            # Cross-platform Python launcher
├── package.json                    # Root script orchestrator (concurrently)
├── docker-compose.yml              # Multi-container production stack
└── README.md                       # Master system documentation
```

---

## 10. License & Acknowledgments

* **License:** Released under the [MIT License](LICENSE).
* **Smart India Hackathon 2026:** Developed by Team THERMIVEX for Problem Statement **SIH26162**.
* **Data Sources:** NASA FIRMS (distributed under NASA Earth Science Open Data Policy), OpenStreetMap contributors (ODbL), and Esri World Imagery.
