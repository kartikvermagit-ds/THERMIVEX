import React from 'react';
import { 
  Satellite, 
  Building2, 
  ShieldCheck, 
  Wind, 
  BarChart3, 
  FileText, 
  ExternalLink, 
  Code,
  AlertTriangle,
  ArrowRight,
  Database
} from 'lucide-react';
import { ThermivexLogo } from './ThermivexLogo';

interface AboutPageProps {
  onBackToMap: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onBackToMap }) => {
  return (
    <div style={{
      flex: 1,
      height: 'calc(100vh - 52px)',
      backgroundColor: '#07090E',
      color: '#F1F5F9',
      overflowY: 'auto',
      padding: '40px 60px'
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* HERO SECTION */}
        <div style={{
          backgroundColor: '#0C1017',
          border: '1px solid #1E2633',
          borderRadius: '8px',
          padding: '36px 40px',
          marginBottom: '32px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0,0,0,0.6)'
        }}>
          <div style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '260px',
            height: '260px',
            background: 'radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: '4px',
              backgroundColor: '#0F2937',
              border: '1px solid #38BDF8',
              color: '#38BDF8',
              letterSpacing: '0.05em'
            }}>
              SMART INDIA HACKATHON 2026
            </span>
            <span style={{ fontSize: '12px', color: '#64748B' }}>•</span>
            <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>
              PROBLEM STATEMENT SIH26162
            </span>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <ThermivexLogo size={42} showSubtitle={false} />
          </div>

          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#FFF', marginBottom: '12px', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
            Spaceborne Industrial Fire & Thermal Intelligence Platform
          </h1>

          <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: 1.6, maxWidth: '850px', marginBottom: '24px' }}>
            An operational AI and geospatial intelligence system that couples NASA FIRMS thermal radiometry, OpenStreetMap industrial infrastructure boundaries, 36 months of thermal persistence baselines, and atmospheric dispersion modeling to detect, classify, and explain catastrophic industrial blazes while eliminating alert fatigue from routine refinery flaring.
          </p>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={onBackToMap}
              style={{
                backgroundColor: '#38BDF8',
                color: '#000',
                border: 'none',
                borderRadius: '5px',
                padding: '10px 20px',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>Launch Tactical Map</span>
              <ArrowRight size={14} />
            </button>

            <a
              href="https://github.com/kartikvermagit-ds/THERMIVEX"
              target="_blank"
              rel="noreferrer"
              style={{
                backgroundColor: '#141A24',
                color: '#CBD5E1',
                border: '1px solid #232B3B',
                borderRadius: '5px',
                padding: '10px 18px',
                fontWeight: 600,
                fontSize: '12px',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Code size={15} />
              <span>GitHub Repository</span>
            </a>

            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              style={{
                backgroundColor: '#141A24',
                color: '#CBD5E1',
                border: '1px solid #232B3B',
                borderRadius: '5px',
                padding: '10px 18px',
                fontWeight: 600,
                fontSize: '12px',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <ExternalLink size={14} />
              <span>FastAPI Swagger Docs</span>
            </a>
          </div>
        </div>

        {/* THE CORE PROBLEM VS SOLUTION */}
        <div style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFF', marginBottom: '14px' }}>
            The Core Crisis: Alert Fatigue in Satellite Disaster Response
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Standard NASA FIRMS */}
            <div style={{
              backgroundColor: '#0F141C',
              border: '1px solid #2A181C',
              borderLeft: '4px solid #EF4444',
              borderRadius: '6px',
              padding: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#F87171', fontWeight: 700, fontSize: '14px' }}>
                <AlertTriangle size={18} />
                <span>Traditional Satellite Fire Detection</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, fontSize: '12px', color: '#94A3B8', display: 'flex', flexDirection: 'column', gap: '10px', lineHeight: 1.5 }}>
                <li>❌ <strong>Zero Semantic Context:</strong> Raw latitude/longitude points cannot tell if a 375m hotspot is an accidental factory blast or routine refinery chimney flaring.</li>
                <li>❌ <strong>Endless False Alarms:</strong> Jamnagar, Panoli, and Dahej refineries trigger emergency sirens 365 days a year, causing responders to ignore alerts.</li>
                <li>❌ <strong>No Plume Trajectory:</strong> Cannot predict which residential zones will be impacted by toxic downwind smoke.</li>
                <li>❌ <strong>Agricultural Confusion:</strong> Crop stubble burning in an adjacent farm 800m away gets falsely flagged as a structural factory fire.</li>
              </ul>
            </div>

            {/* THERMIVEX Solution */}
            <div style={{
              backgroundColor: '#0F141C',
              border: '1px solid #142820',
              borderLeft: '4px solid #10B981',
              borderRadius: '6px',
              padding: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#34D399', fontWeight: 700, fontSize: '14px' }}>
                <ShieldCheck size={18} />
                <span>The THERMIVEX Solution</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, fontSize: '12px', color: '#94A3B8', display: 'flex', flexDirection: 'column', gap: '10px', lineHeight: 1.5 }}>
                <li>✅ <strong>36-Month Thermal Baseline:</strong> Compares active heat against rolling facility history (ΔZ FRP Anomaly Surge) to auto-suppress routine flares (PI ≥ 0.90).</li>
                <li>✅ <strong>OpenStreetMap Geofencing:</strong> Differentiates core storage tank direct hits from boundary and rural stubble burns.</li>
                <li>✅ <strong>2D Gaussian Plume Dispersion:</strong> Real-time atmospheric coupling (Open-Meteo wind vectors) models downwind toxic smoke envelopes.</li>
                <li>✅ <strong>Explainable AI (TreeSHAP):</strong> Mathematical feature attributions explain why an alert was raised to incident commanders.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 6 KEY TECHNOLOGICAL PILLARS */}
        <div style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFF', marginBottom: '16px' }}>
            System Architecture & Key Technical Pillars
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {/* 1 */}
            <div style={{ backgroundColor: '#0C1017', border: '1px solid #1E2633', borderRadius: '6px', padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38BDF8', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                <Satellite size={16} />
                <span>Spaceborne Radiometry</span>
              </div>
              <p style={{ fontSize: '11px', color: '#94A3B8', lineHeight: 1.5 }}>
                Ingests VIIRS (375m on NOAA-20 and Suomi-NPP) and MODIS (1km on Terra/Aqua) middle-infrared (3.9µm) brightness temperatures and Fire Radiative Power (FRP).
              </p>
            </div>

            {/* 2 */}
            <div style={{ backgroundColor: '#0C1017', border: '1px solid #1E2633', borderRadius: '6px', padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F97316', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                <Building2 size={16} />
                <span>OSM Geofencing</span>
              </div>
              <p style={{ fontSize: '11px', color: '#94A3B8', lineHeight: 1.5 }}>
                Extracts registered industrial compounds, storage tank yards, and chemical facilities. Evaluates spatial relationships: Direct Hit (0m), Perimeter (&lt;350m), or Rural Offset (&gt;500m).
              </p>
            </div>

            {/* 3 */}
            <div style={{ backgroundColor: '#0C1017', border: '1px solid #1E2633', borderRadius: '6px', padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818CF8', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                <Database size={16} />
                <span>Thermal History Registry</span>
              </div>
              <p style={{ fontSize: '11px', color: '#94A3B8', lineHeight: 1.5 }}>
                Maintains a 36-month rolling baseline per facility centroid. Calculates the Persistence Index (PI) and FRP Anomaly Surge Z-score (ΔZ) to mathematically prove anomalous fires.
              </p>
            </div>

            {/* 4 */}
            <div style={{ backgroundColor: '#0C1017', border: '1px solid #1E2633', borderRadius: '6px', padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#EF4444', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                <Wind size={16} />
                <span>Gaussian Plume Dispersion</span>
              </div>
              <p style={{ fontSize: '11px', color: '#94A3B8', lineHeight: 1.5 }}>
                Couples surface wind speed and bearing from Open-Meteo to generate 2D Gaussian downwind toxic plume dispersion polygons, defining the evacuation corridor.
              </p>
            </div>

            {/* 5 */}
            <div style={{ backgroundColor: '#0C1017', border: '1px solid #1E2633', borderRadius: '6px', padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34D399', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                <BarChart3 size={16} />
                <span>TreeSHAP Explainability</span>
              </div>
              <p style={{ fontSize: '11px', color: '#94A3B8', lineHeight: 1.5 }}>
                Applies game-theoretic Shapley values to tabulate exact feature attributions for disaster commanders, making the AI completely auditable in legal and administrative reviews.
              </p>
            </div>

            {/* 6 */}
            <div style={{ backgroundColor: '#0C1017', border: '1px solid #1E2633', borderRadius: '6px', padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#EAB308', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                <FileText size={16} />
                <span>Automated Reporting</span>
              </div>
              <p style={{ fontSize: '11px', color: '#94A3B8', lineHeight: 1.5 }}>
                Generates one-click tactical PDF incident dossiers, National Situational Reports (SitReps), and RFC 7946 GeoJSON vector packages compatible with QGIS and ArcGIS Pro.
              </p>
            </div>
          </div>
        </div>

        {/* MATHEMATICAL FORMULATIONS */}
        <div style={{
          backgroundColor: '#0C1017',
          border: '1px solid #1E2633',
          borderRadius: '8px',
          padding: '24px 28px',
          marginBottom: '36px'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#FFF', marginBottom: '14px' }}>
            Mathematical Formulations
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', fontSize: '12px' }}>
            <div>
              <strong style={{ color: '#38BDF8' }}>1. FRP Anomaly Surge Z-Score:</strong>
              <div className="font-mono" style={{ backgroundColor: '#05070B', padding: '10px 14px', borderRadius: '4px', margin: '8px 0', color: '#CBD5E1', border: '1px solid #141A24' }}>
                ΔZ = (FRP_observed - μ_historical) / (σ_historical + ε)
              </div>
              <p style={{ color: '#94A3B8', lineHeight: 1.5 }}>
                Computes standard deviations above facility historical baseline. Values exceeding +3.0σ trigger emergency review; values above +5.0σ confirm a critical disaster.
              </p>
            </div>

            <div>
              <strong style={{ color: '#38BDF8' }}>2. Composite Risk Score (CRS: 0–100):</strong>
              <div className="font-mono" style={{ backgroundColor: '#05070B', padding: '10px 14px', borderRadius: '4px', margin: '8px 0', color: '#CBD5E1', border: '1px solid #141A24' }}>
                CRS = 0.30·S_hazard + 0.25·S_facility + 0.25·S_anomaly + 0.20·S_proximity
              </div>
              <p style={{ color: '#94A3B8', lineHeight: 1.5 }}>
                Integrates logarithmic radiative heat power, plant hazard tier (1–5), non-linear anomaly multiplier, and geodesic distance decay to boundary.
              </p>
            </div>
          </div>
        </div>

        {/* TEAM & CREDITS */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          backgroundColor: '#0C1017',
          border: '1px solid #1E2633',
          borderRadius: '6px'
        }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFF' }}>
              Team THERMIVEX — Smart India Hackathon 2026
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
              Built with FastAPI, PostGIS, React 19, Leaflet, and Esri World Imagery. Released under the MIT License.
            </div>
          </div>

          <button
            onClick={onBackToMap}
            style={{
              backgroundColor: '#0F2937',
              border: '1px solid #38BDF8',
              color: '#38BDF8',
              borderRadius: '4px',
              padding: '8px 16px',
              fontWeight: 700,
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            ← Return to Live Monitoring Map
          </button>
        </div>

      </div>
    </div>
  );
};
