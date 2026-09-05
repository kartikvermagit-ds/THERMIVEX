---
name: PYRAVEX Tactical Aerospace UI
colors:
  surface: '#07090e'
  surface-dim: '#05070a'
  surface-bright: '#18202c'
  surface-container-lowest: '#030508'
  surface-container-low: '#07090e'
  surface-container: '#0f141c'
  surface-container-high: '#141c27'
  surface-container-highest: '#1c2636'
  on-surface: '#f1f5f9'
  on-surface-variant: '#94a3b8'
  inverse-surface: '#f8fafc'
  inverse-on-surface: '#0f172a'
  outline: '#232e3e'
  outline-variant: '#1a2332'
  surface-tint: '#06b6d4'
  primary: '#06b6d4'
  on-primary: '#03171d'
  primary-container: '#0891b2'
  on-primary-container: '#e0f2fe'
  secondary: '#3b82f6'
  on-secondary: '#ffffff'
  secondary-container: '#1d4ed8'
  on-secondary-container: '#dbeafe'
  tertiary: '#818cf8'
  on-tertiary: '#ffffff'
  tertiary-container: '#4338ca'
  on-tertiary-container: '#e0e7ff'
  error: '#ef4444'
  on-error: '#ffffff'
  error-container: '#7f1d1d'
  on-error-container: '#fee2e2'
  warning: '#f59e0b'
  on-warning: '#ffffff'
  warning-container: '#78350f'
  on-warning-container: '#fef3c7'
  success: '#10b981'
  on-success: '#ffffff'
  background: '#07090e'
  on-background: '#f1f5f9'
  threat-critical: '#ef4444'
  threat-high: '#f97316'
  threat-medium: '#f59e0b'
  threat-routine: '#818cf8'
  threat-safe: '#10b981'
typography:
  display-xl:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 52px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-md:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-sm:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 16px
  telemetry-mono:
    fontFamily: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.04em
  label-caps:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.12em
rounded:
  none: 0px
  xs: 2px
  sm: 4px
  md: 6px
  lg: 8px
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
---

# PYRAVEX Design System Specification

## 1. Executive Summary & Creative North Star
**Creative North Star: "Orbital Overwatch & Tactical Emergency Command"**

PYRAVEX is an aerospace-grade, mission-critical dashboard designed for national disaster response authorities (NDMA, State Fire Services, Industrial Safety Directorates). The platform transforms raw, unreferenced thermal anomalies from NASA FIRMS satellites into actionable, geofenced tactical intelligence.

The visual signature is **Precision Tactical Dark Mode**:
* **Zero Visual Clutter:** In life-and-death industrial explosions, cognitive overhead must be zero. Every millisecond counts.
* **Luminescent Alert Accents:** The deep obsidian canvas stays muted so that emergency heat signatures, plume dispersions, and risk surges instantly command user focus.
* **Engineered Rectilinear Geometry:** Minimal border radiuses (2px–4px) evoke specialized military CAD systems and industrial flight decks.

---

## 2. Color Palette & Semantic Hierarchy

### A. Surface Architecture (Obsidian & Void Layers)
Depth is established through dark surface luminosity steps rather than drop shadows:

| Token | Hex | Role | Usage |
| :--- | :--- | :--- | :--- |
| `surface-dim` | `#05070A` | Deep Void | Leaflet satellite map background, canvas canvas boundaries |
| `surface` / `--bg-space` | `#07090E` | Main Ground | Viewport root background, navigation container base |
| `surface-container` / `--bg-surface` | `#0F141C` | Primary Panels | CAD Triage Rail, Layer Control box, Top Bar, Drawer panels |
| `surface-container-high` | `#141C27` | Sub-Containers | Card items, table headers, inactive action buttons |
| `surface-bright` / `--bg-surface-elevated` | `#18202C` | Raised States | Hovered incident rows, expanded SHAP factor containers |
| `outline` / `--border-subtle` | `#232E3E` | Tactical Partition | 1px precision boundary between all command panels |
| `outline-active` / `--border-active` | `#3B82F6` | Selection Glow | Selected active incident focus ring, active filter pill |

### B. Threat & Classification Spectrum
Specific hex codes are mapped directly to operational fire classifications:

| Classification | Hex Code | Tactical Meaning & Symbology |
| :--- | :--- | :--- |
| **`ACCIDENTAL_INDUSTRIAL_FIRE`** | `#EF4444` (Critical Red) | **Pulsing Diamond (🔴)** — High radiative blast inside hazardous materials; triggers immediate foam dispatch. |
| **`PERSISTENT_OPERATIONAL_SOURCE`** | `#818CF8` (Routine Indigo) | **Solid Purple Ring (🟣)** — Known flaring chimney/kiln confirmed by 36-month baseline; auto-suppressed. |
| **`NON_INDUSTRIAL_AGRICULTURAL`** | `#F59E0B` (Amber Warning) | **Amber Ring & Offset Line (🟡)** — Stubble/crop fire outside industrial boundary; displays distance vector. |
| **`SENSOR_ARTIFACT_OR_GLINT`** | `#64748B` (Muted Slate) | **Muted Gray Dot (⚪)** — Solar metal roof glint or diurnal road warming; suppressed from triage rail. |
| **`SAFE / CONTROLLED`** | `#10B981` (Emerald Green) | **Status Pill (🟢)** — Normal background readings, resolved incidents, verified safe facilities. |

### C. Telemetry Accents
* **Cyan Radar Glow (`#06B6D4`):** Satellite scan-track diamonds, time-scrubber head, active meteorological wind vectors.
* **High Anomaly Surge (`#F97316`):** $\Delta Z \ge +3.0\sigma$ FRP statistical anomalies.

---

## 3. Geospatial Symbology & Map Design

The Leaflet GIS Canvas runs on top of a 1-meter high-resolution **Esri World Imagery** satellite basemap coupled with real-time vector overlays:

```
[ Active Thermal Diamond: Pulsing Crimson #EF4444 ]
                      │
           (Wind Bearing: 245° WSW)
                      │
                      ▼
┌──────────────────────────────────────────────────────────┐
│  2D Gaussian Toxic Plume Dispersion Cone                 │
│  • Inner Core: 80% opacity crimson (Immediate Threat)    │
│  • Outer Feather: 20% gradient fade (Evacuation Buffer)  │
└──────────────────────────────────────────────────────────┘
                      │
          (Geodesic Distance Line)
                      │
                      ▼
[ Factory Perimeter Polygon: OSM Hazard Tier 1 (Petrochemical) ]
```

1. **Active Hotspot Diamonds:**
   - 375m VIIRS scan-track representation rendered as a rotated diamond.
   - Accidental industrial fires feature a continuous CSS `@keyframes sonar-pulse` expanding up to $2.4\times$ diameter with fading opacity.
2. **2D Gaussian Plume Dispersion Cone:**
   - Dynamically oriented downwind using Open-Meteo real-time wind speed and bearing.
   - Visualizes chemical smoke dispersal over nearby residential settlements.
3. **Geodesic Offset Vectors:**
   - In agricultural fires, a dotted amber line connects the satellite detection coordinate to the nearest industrial facility perimeter (e.g., `1,210.4m outside fence`), immediately debunking false factory explosion rumors.
4. **Tactical Square Tooltips:**
   - Custom square dark tooltips (`rgba(9, 13, 19, 0.97)`) with 12px backdrop blur and monospaced telemetry readouts.

---

## 4. Typography & Information Hierarchy

* **Primary Interface Font:** Modern San-Serif system stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter`).
* **Telemetry & Numeric Font:** Monospaced (`ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New"`).
  - All numerical telemetry (FRP in MW, GPS coordinates, Z-scores, wind knots, risk ratings) MUST render in monospaced font to avoid optical jitter during real-time streaming updates.

### Hierarchy Scale:
* **Metric Readouts (`display-xl` - 48px / Bold Mono):** Composite Risk Score (`97`), Peak FRP (`86.4 MW`).
* **Section Headers (`headline-md` - 20px / SemiBold):** Panel titles, incident identifiers (`TX-EE691A`).
* **Metadata Labels (`label-caps` - 10px / 700 / Uppercase / `letterSpacing: 0.12em`):** Status flags (`CRITICAL HAZARD`, `DIRECT HIT`, `VIIRS-NPP`).
* **Body / Descriptions (`body-md` - 13px / 400):** Triage summaries, chemical inventory reports.

---

## 5. Component Architecture & Specifications

### A. Top Navigation Bar (`TopNav.tsx`)
* **Height:** 56px fixed header.
* **Left Section:** PYRAVEX Vector Logo with pulsing status dot (`LIVE SATELLITE FEED`).
* **Center Section:** Quick-filter tabs (`ALL INCIDENTS`, `CRITICAL (90+)`, `UNRESOLVED DISPATCHES`).
* **Right Section:** Universal timekeeper (UTC + IST toggle), active satellite pass status, and National SitRep export trigger.

### B. CAD Triage Rail (`TriageRail.tsx`)
* **Width:** 380px fixed-width left rail.
* **Card Design:**
  - 1px border (`--border-subtle`). On select: 1px active cyan/blue border + subtle left accent bar (4px width).
  - Top row: Classification pill + Relative time badge (`3m ago`).
  - Middle row: Facility Name + Facility Hazard Tier badge (Tier 1 Petrochem to Tier 5 Light Industrial).
  - Bottom row: Risk Gauge (0–100 numerical badge colored by risk tier) + FRP reading (`MW`) + Geofence status (`Direct Hit` vs `+1.2km Outside`).

### C. Evidence & TreeSHAP Investigation Drawer (`EvidenceDrawer.tsx`)
* **Position:** Slides in from right (480px width) when an incident is selected.
* **Sections:**
  1. **Telemetry Header:** High-impact Risk score badge + Instant Emergency Foam Dispatch button.
  2. **TreeSHAP Explainability Waterfall:** Horizontal diverging contribution bars (e.g., $+32.1$ FRP Anomaly, $+24.0$ Petrochem Tier, $-12.4$ Baseline Persistence). Green indicates suppression; red indicates danger escalation.
  3. **36-Month Historical Baseline Graph:** Time-series curve displaying $\mu \pm 2\sigma$ normal variance band contrasted against the active anomaly surge.
  4. **Tactical Actions:** One-click automated PDF incident dossier download + GeoJSON RFC 7946 export.

### D. Climate & Plume SlideStrip (`ClimateSlideStrip.tsx`)
* **Position:** Bottom dockable strip.
* **Contents:** Real-time Open-Meteo atmospheric telemetry:
  - Compass wind rose with live directional bearing and velocity ($km/h$).
  - Estimated $CO_2e$ and $CH_4$ methane flux anomaly meters.
  - Active plume tracking count.

---

## 6. Elevation, Borders & Glassmorphism Rules

1. **The 1px Border Doctrine:**
   - Drop shadows are avoided on dark tactical interfaces to prevent muddy UI appearance.
   - All spatial separation is achieved using `1px solid var(--border-subtle)` (`#232E3E`).
2. **Backdrop Blurs:**
   - Floating panels (legend, layer toggles, tooltips) use `backdrop-filter: blur(12px)` combined with `rgba(15, 20, 28, 0.88)` backgrounds to allow map context to bleed through subtly.
3. **Focus & Selection Luminescence:**
   - Interactive components highlight with a soft cyan outer glow:
     ```css
     box-shadow: 0 0 12px rgba(6, 182, 212, 0.35);
     border-color: #06B6D4;
     ```

---

## 7. Accessibility & Human Factors

* **Color-Blind Safe Redundancy:** No state relies solely on hue. Critical alerts always pair color with text tags (`CRITICAL`), distinctive shapes (Diamonds vs Rings vs Vectors), and icon markers.
* **WCAG AAA Contrast:** All textual elements maintain a minimum contrast ratio of `7:1` against their respective dark backgrounds.
* **Low-Latency Keyboard Navigation:**
  - <kbd>↑</kbd> / <kbd>↓</kbd> navigates the CAD triage queue.
  - <kbd>Space</kbd> zooms map to the selected incident.
  - <kbd>Esc</kbd> closes investigation drawers.
