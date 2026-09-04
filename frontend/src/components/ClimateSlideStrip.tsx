import React, { useState, useEffect } from 'react';
import { 
  Wind, 
  Flame, 
  MapPin, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Maximize2, 
  X, 
  Activity, 
  Globe, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Minus
} from 'lucide-react';
import type { ClimateUpdateItem, ClimateQuickStats, ClimateCategory } from '../types/climate';

interface ClimateSlideStripProps {
  updates: ClimateUpdateItem[];
  quickStats: ClimateQuickStats;
  onFlyToCorridor: (coords: [number, number], zoom?: number) => void;
}

const CATEGORY_TABS: { key: ClimateCategory; label: string }[] = [
  { key: 'ALL', label: 'All Feeds' },
  { key: 'PLUMES', label: 'Plumes & Dispersion' },
  { key: 'GHG_METHANE', label: 'GHG & Methane' },
  { key: 'AQI_AIR', label: 'AQI & Inversion' },
  { key: 'THERMAL_FRP', label: 'Thermal FRP' },
  { key: 'SATELLITE', label: 'Overpass' }
];

export const ClimateSlideStrip: React.FC<ClimateSlideStripProps> = ({
  updates,
  quickStats,
  onFlyToCorridor
}) => {
  const [activeCategory, setActiveCategory] = useState<ClimateCategory>('ALL');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Filter updates by category
  const filteredUpdates = updates.filter(
    (item) => activeCategory === 'ALL' || item.category === activeCategory
  );

  // Reset index when category changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeCategory]);

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying || isHovered || filteredUpdates.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredUpdates.length);
    }, 5500);

    return () => clearInterval(timer);
  }, [isPlaying, isHovered, filteredUpdates.length]);

  const handleNext = () => {
    if (filteredUpdates.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % filteredUpdates.length);
  };

  const handlePrev = () => {
    if (filteredUpdates.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + filteredUpdates.length) % filteredUpdates.length);
  };

  const currentItem: ClimateUpdateItem | undefined = filteredUpdates[currentIndex] || filteredUpdates[0];

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return { bg: 'rgba(239, 68, 68, 0.18)', border: '#EF4444', text: '#EF4444', label: 'CRITICAL PLUME' };
      case 'ALERT':
        return { bg: 'rgba(249, 115, 22, 0.18)', border: '#F97316', text: '#F97316', label: 'METHANE SURGE' };
      case 'ADVISORY':
        return { bg: 'rgba(245, 158, 11, 0.18)', border: '#F59E0B', text: '#F59E0B', label: 'AQI INVERSION' };
      case 'NOMINAL':
        return { bg: 'rgba(16, 185, 129, 0.18)', border: '#10B981', text: '#10B981', label: 'BASELINE FLARING' };
      default:
        return { bg: 'rgba(129, 140, 248, 0.18)', border: '#818CF8', text: '#818CF8', label: 'SATELLITE PASS' };
    }
  };

  const sev = currentItem ? getSeverityStyle(currentItem.severity) : getSeverityStyle('INFO');

  return (
    <>
      {/* Bottom Docked Slide Strip Bar */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '46px',
          backgroundColor: 'rgba(9, 13, 20, 0.96)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid #1E293B',
          zIndex: 420,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 14px',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.6)',
          userSelect: 'none'
        }}
      >
        {/* Left Section: Live Beacon & Strip Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                position: 'relative',
                display: 'inline-flex',
                width: '8px',
                height: '8px'
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  opacity: 0.75,
                  animation: 'sonar-ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite'
                }}
              />
              <span
                style={{
                  position: 'relative',
                  display: 'inline-flex',
                  borderRadius: '50%',
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#10B981'
                }}
              />
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.07em',
                color: '#E2E8F0',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Activity size={13} color="var(--accent-cyan)" />
              <span>CLIMATE INTELLIGENCE</span>
            </span>
          </div>

          {/* Slide Navigation & Play/Pause */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#131A26',
              borderRadius: '6px',
              border: '1px solid #1E293B',
              padding: '2px'
            }}
          >
            <button
              onClick={handlePrev}
              title="Previous Climate Slide"
              style={{
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '2px 4px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '3px'
              }}
            >
              <ChevronLeft size={13} />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? 'Pause Ticker' : 'Auto-Play Slides'}
              style={{
                background: 'none',
                border: 'none',
                color: isPlaying ? 'var(--accent-cyan)' : '#64748B',
                cursor: 'pointer',
                padding: '2px 5px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {isPlaying ? <Pause size={11} /> : <Play size={11} />}
            </button>

            <button
              onClick={handleNext}
              title="Next Climate Slide"
              style={{
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '2px 4px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '3px'
              }}
            >
              <ChevronRight size={13} />
            </button>

            <span
              style={{
                fontSize: '10px',
                fontFamily: 'monospace',
                color: '#94A3B8',
                padding: '0 6px',
                borderLeft: '1px solid #1E293B'
              }}
            >
              {filteredUpdates.length > 0 ? `${currentIndex + 1}/${filteredUpdates.length}` : '0/0'}
            </span>
          </div>
        </div>

        {/* Center Section: Active Slide Details */}
        {currentItem ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '0 16px',
              minWidth: 0,
              overflow: 'hidden'
            }}
          >
            {/* Severity Badge */}
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                padding: '2px 7px',
                borderRadius: '4px',
                backgroundColor: sev.bg,
                border: `1px solid ${sev.border}`,
                color: sev.text,
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              {sev.label}
            </span>

            {/* Headline */}
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#F8FAFC',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {currentItem.headline}
            </span>

            {/* Key Metric Highlight */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: '#141D2C',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid #233045',
                fontSize: '11px',
                flexShrink: 0
              }}
            >
              <span style={{ color: '#94A3B8', fontSize: '10px' }}>
                {currentItem.primaryMetric.label}:
              </span>
              <strong style={{ color: currentItem.primaryMetric.color || 'var(--accent-cyan)', fontFamily: 'monospace' }}>
                {currentItem.primaryMetric.value}
              </strong>
              {currentItem.primaryMetric.trend === 'up' && <TrendingUp size={11} color="#EF4444" />}
              {currentItem.primaryMetric.trend === 'down' && <TrendingDown size={11} color="#10B981" />}
              {currentItem.primaryMetric.trend === 'stable' && <Minus size={11} color="#94A3B8" />}
            </div>

            {/* Regional Corridor Fly-To Button */}
            <button
              onClick={() => onFlyToCorridor(currentItem.corridorCoords, currentItem.corridorZoom)}
              title={`Fly Map to ${currentItem.corridorName}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: '#1E293B',
                color: '#38BDF8',
                border: '1px solid #334155',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0284C7';
                e.currentTarget.style.color = '#FFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1E293B';
                e.currentTarget.style.color = '#38BDF8';
              }}
            >
              <MapPin size={10} />
              <span>{currentItem.corridorName}</span>
              <span style={{ opacity: 0.6 }}>↗</span>
            </button>

            {/* Quick Wind/Plume snippet */}
            {currentItem.details.windVector && (
              <span
                style={{
                  fontSize: '10px',
                  color: '#64748B',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  flexShrink: 0
                }}
              >
                <Wind size={10} color="#94A3B8" />
                <span>{currentItem.details.windVector}</span>
              </span>
            )}
          </div>
        ) : (
          <div style={{ flex: 1, textAlign: 'center', color: '#64748B', fontSize: '11px' }}>
            No updates in this category
          </div>
        )}

        {/* Right Section: Telemetry Chips & Expand Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Quick Metrics */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '10px',
              color: '#94A3B8',
              fontFamily: 'monospace'
            }}
          >
            <div
              title="Calculated Industrial Carbon Equivalent Combustion Rate"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                backgroundColor: '#101723',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid #1E293B'
              }}
            >
              <Flame size={10} color="#F97316" />
              <span>CO2e: <strong>{quickStats.totalEstCo2eFluxTph} t/h</strong></span>
            </div>

            <div
              title="Copernicus Sentinel-5P TROPOMI Methane Column"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                backgroundColor: '#101723',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid #1E293B'
              }}
            >
              <Globe size={10} color="#06B6D4" />
              <span>CH4: <strong>{quickStats.ch4RegionalPpb} ppb</strong></span>
            </div>

            <div
              title="Downwind Gaussian Plume Dispersion Count"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                backgroundColor: '#101723',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid #1E293B'
              }}
            >
              <Wind size={10} color="#38BDF8" />
              <span>Plumes: <strong>{quickStats.activePlumesCount}</strong></span>
            </div>
          </div>

          {/* Deep-Dive Expand Button */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            title="Open Climate & Environmental Telemetry Deck"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#0369A1',
              color: '#FFF',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#0284C7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#0369A1';
            }}
          >
            <Maximize2 size={11} />
            <span>Telemetry Deck</span>
          </button>
        </div>
      </div>

      {/* Slide-Up Tactical Climate & Atmospheric Telemetry Modal / Drawer */}
      {isDrawerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
          onClick={() => setIsDrawerOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '900px',
              maxWidth: '95vw',
              maxHeight: '85vh',
              backgroundColor: '#0C111A',
              border: '1px solid #233045',
              borderRadius: '12px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #1E293B',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#0F1622'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    backgroundColor: 'rgba(6, 182, 212, 0.15)',
                    border: '1px solid var(--accent-cyan)',
                    borderRadius: '8px',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Activity size={18} color="var(--accent-cyan)" />
                </div>
                <div>
                  <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#F1F5F9', margin: 0, letterSpacing: '0.04em' }}>
                    ATMOSPHERIC & CLIMATE DISPERSION TELEMETRY
                  </h2>
                  <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0 }}>
                    Coupled Spaceborne Radiometry • Gaussian Downwind Plume Modeling • Greenhouse Gas Flux
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsDrawerOpen(false)}
                style={{
                  background: 'none',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#94A3B8',
                  padding: '5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Category Filter Pills in Modal */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                padding: '10px 20px',
                backgroundColor: '#090D14',
                borderBottom: '1px solid #1E293B',
                overflowX: 'auto'
              }}
            >
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveCategory(tab.key)}
                  style={{
                    backgroundColor: activeCategory === tab.key ? 'var(--accent-cyan)' : '#131A26',
                    color: activeCategory === tab.key ? '#000' : '#94A3B8',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Top 4 Real-Time Climate Gauge Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                {/* Gauge 1: Carbon Equivalent Flux */}
                <div
                  style={{
                    backgroundColor: '#111824',
                    border: '1px solid #1E293B',
                    borderRadius: '8px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>INDUSTRIAL CO2e FLUX</span>
                    <Flame size={14} color="#F97316" />
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#F8FAFC', fontFamily: 'monospace' }}>
                    {quickStats.totalEstCo2eFluxTph} <span style={{ fontSize: '12px', color: '#94A3B8' }}>t/hr</span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#10B981' }}>
                    Wooster Radiative Equation (0.295 · MW)
                  </div>
                </div>

                {/* Gauge 2: Sentinel-5P Methane */}
                <div
                  style={{
                    backgroundColor: '#111824',
                    border: '1px solid #1E293B',
                    borderRadius: '8px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>TROPOMI CH4 COLUMN</span>
                    <Globe size={14} color="#06B6D4" />
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#38BDF8', fontFamily: 'monospace' }}>
                    {quickStats.ch4RegionalPpb} <span style={{ fontSize: '12px', color: '#94A3B8' }}>ppb</span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#94A3B8' }}>
                    Baseline Delta: <strong style={{ color: '#F59E0B' }}>+1.1%</strong>
                  </div>
                </div>

                {/* Gauge 3: Meteorological Coupling */}
                <div
                  style={{
                    backgroundColor: '#111824',
                    border: '1px solid #1E293B',
                    borderRadius: '8px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>SURFACE WIND VECTOR</span>
                    <Wind size={14} color="#818CF8" />
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#F8FAFC', fontFamily: 'monospace' }}>
                    {quickStats.windSpeedKmh} <span style={{ fontSize: '12px', color: '#94A3B8' }}>km/h</span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#818CF8' }}>
                    Bearing: {quickStats.windBearing}
                  </div>
                </div>

                {/* Gauge 4: Spatial Glint Gating */}
                <div
                  style={{
                    backgroundColor: '#111824',
                    border: '1px solid #1E293B',
                    borderRadius: '8px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>FALSE GLINT SUPPRESSION</span>
                    <CheckCircle2 size={14} color="#10B981" />
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#10B981', fontFamily: 'monospace' }}>
                    {quickStats.glintSuppressionPct}%
                  </div>
                  <div style={{ fontSize: '10px', color: '#10B981' }}>
                    Agri-biogenic stubble filtered
                  </div>
                </div>
              </div>

              {/* Feed of Detailed Climate & Atmospheric Alerts */}
              <div>
                <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.05em', marginBottom: '10px' }}>
                  REGIONAL CLIMATE & ENVIRONMENTAL IMPACT LOG
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredUpdates.map((item) => {
                    const itemSev = getSeverityStyle(item.severity);
                    return (
                      <div
                        key={item.id}
                        style={{
                          backgroundColor: '#101622',
                          border: '1px solid #1E2837',
                          borderRadius: '8px',
                          padding: '12px 16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          transition: 'border-color 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: itemSev.bg,
                                border: `1px solid ${itemSev.border}`,
                                color: itemSev.text
                              }}
                            >
                              {itemSev.label}
                            </span>
                            <strong style={{ fontSize: '13px', color: '#F8FAFC' }}>
                              {item.headline}
                            </strong>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={() => {
                                onFlyToCorridor(item.corridorCoords, item.corridorZoom);
                                setIsDrawerOpen(false);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                backgroundColor: '#1E293B',
                                color: '#38BDF8',
                                border: '1px solid #334155',
                                borderRadius: '4px',
                                padding: '3px 8px',
                                fontSize: '10px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              <MapPin size={10} />
                              <span>Fly to {item.corridorName}</span>
                            </button>
                            <span style={{ fontSize: '10px', color: '#64748B', fontFamily: 'monospace' }}>
                              {item.timestamp}
                            </span>
                          </div>
                        </div>

                        <p style={{ fontSize: '11px', color: '#CBD5E1', margin: 0, lineHeight: 1.4 }}>
                          {item.details.advisoryText}
                        </p>

                        {/* Detailed Atmospheric Chips */}
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '10px' }}>
                          {item.details.plumeDispersionKm && (
                            <span style={{ backgroundColor: '#141E2D', padding: '2px 8px', borderRadius: '4px', color: '#F97316' }}>
                              Plume Radius: <strong>{item.details.plumeDispersionKm} km</strong>
                            </span>
                          )}
                          {item.details.aqi && (
                            <span style={{ backgroundColor: '#141E2D', padding: '2px 8px', borderRadius: '4px', color: '#F59E0B' }}>
                              Corridor AQI: <strong>{item.details.aqi}</strong>
                            </span>
                          )}
                          {item.details.stabilityClass && (
                            <span style={{ backgroundColor: '#141E2D', padding: '2px 8px', borderRadius: '4px', color: '#818CF8' }}>
                              Stability: <strong>{item.details.stabilityClass}</strong>
                            </span>
                          )}
                          {item.details.inversionHeightM && (
                            <span style={{ backgroundColor: '#141E2D', padding: '2px 8px', borderRadius: '4px', color: '#06B6D4' }}>
                              Inversion Ceiling: <strong>{item.details.inversionHeightM}m</strong>
                            </span>
                          )}
                          <span style={{ color: '#64748B', marginLeft: 'auto' }}>
                            Source: {item.source}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
