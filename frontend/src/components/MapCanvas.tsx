import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Satellite, Moon } from 'lucide-react';
import type { IncidentFeature, FacilityFeature } from '../types/incident';

interface MapCanvasProps {
  incidents: IncidentFeature[];
  facilities: FacilityFeature[];
  selectedIncidentId: string | null;
  onSelectIncident: (id: string) => void;
  flyToCoords: [number, number] | null;
  layersVisible: {
    hotspots: boolean;
    plumes: boolean;
    facilities: boolean;
    footprints: boolean;
  };
}

export const MapCanvas: React.FC<MapCanvasProps> = ({
  incidents,
  facilities,
  selectedIncidentId,
  onSelectIncident,
  flyToCoords,
  layersVisible
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const baseTilesRef = useRef<L.TileLayer | null>(null);
  const labelsTilesRef = useRef<L.TileLayer | null>(null);

  const [basemapMode, setBasemapMode] = useState<'satellite' | 'dark'>('satellite');

  // Initialize Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered on India's Western/National industrial belt
    const map = L.map(mapContainerRef.current, {
      center: [22.2, 73.2],
      zoom: 6,
      zoomControl: false,
      attributionControl: false
    });

    // High-Resolution Satellite Photorealistic Basemap (Esri World Imagery) - No watermarks!
    const satelliteTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Esri, Maxar, Earthstar Geographics'
    });

    // Crisp Reference Labels Layer for roads, cities, and borders
    const labelsTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      opacity: 0.85
    });

    satelliteTile.addTo(map);
    labelsTile.addTo(map);
    baseTilesRef.current = satelliteTile;
    labelsTilesRef.current = labelsTile;

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layersGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Basemap Switcher (Satellite vs Tactical Dark)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseTilesRef.current) map.removeLayer(baseTilesRef.current);
    if (labelsTilesRef.current) map.removeLayer(labelsTilesRef.current);

    if (basemapMode === 'satellite') {
      const sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19
      }).addTo(map);

      const labels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        opacity: 0.85
      }).addTo(map);

      baseTilesRef.current = sat;
      labelsTilesRef.current = labels;
    } else {
      // Clean Dark Tactical Map (Esri Dark Canvas - 100% watermark free!)
      const dark = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19
      }).addTo(map);

      const labels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        opacity: 0.9
      }).addTo(map);

      baseTilesRef.current = dark;
      labelsTilesRef.current = labels;
    }
  }, [basemapMode]);

  // Handle camera fly-to target coordinates
  useEffect(() => {
    if (flyToCoords && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([flyToCoords[1], flyToCoords[0]], 15, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  }, [flyToCoords]);

  // Render Vector Layers & Dynamic Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // 1. Render OSM Industrial Facilities Layer (Glowing Cyan Polygons)
    if (layersVisible.facilities && facilities) {
      facilities.forEach((fac) => {
        if (fac.geometry.type === 'Polygon') {
          const coords = fac.geometry.coordinates[0].map((pt: [number, number]) => [pt[1], pt[0]]);
          const poly = L.polygon(coords, {
            color: '#06B6D4',
            weight: 2,
            fillColor: '#06B6D4',
            fillOpacity: 0.18,
            dashArray: '5, 5'
          });
          poly.bindTooltip(`
            <div style="font-family: inherit; font-size: 11px; padding: 2px;">
              <strong style="color: #06B6D4;">🏭 ${fac.properties.name}</strong><br/>
              <span style="color: #94A3B8;">Type: ${fac.properties.industrial_type} | Hazard: Tier-${fac.properties.hazard_tier}</span>
            </div>
          `, { sticky: true });
          group.addLayer(poly);
        }
      });
    }

    // 2. Render 2D Gaussian Plume Cones (Downwind Toxic Hazard Envelope)
    if (layersVisible.plumes) {
      incidents.forEach((inc) => {
        if (inc.properties.plume_geometry && (inc.properties.severity === 'CRITICAL' || inc.properties.risk_score >= 50)) {
          const coords = inc.properties.plume_geometry.coordinates[0].map((pt: [number, number]) => [pt[1], pt[0]]);
          const plumePoly = L.polygon(coords, {
            color: '#EF4444',
            weight: 1.5,
            fillColor: '#EF4444',
            fillOpacity: 0.28,
            dashArray: '4, 4'
          });
          plumePoly.bindTooltip(`
            <div style="font-family: monospace; font-size: 11px;">
              <strong style="color: #EF4444;">⚠️ DOWNWIND TOXIC PLUME CONE</strong><br/>
              Incident: #${inc.properties.id} | Trajectory: WNW -> ESE
            </div>
          `, { sticky: true });
          group.addLayer(plumePoly);
        }
      });
    }

    // 3. Render 375m True Sensor Footprint Rectangles
    if (layersVisible.footprints) {
      incidents.forEach((inc) => {
        if (inc.properties.footprint_geometry) {
          const coords = inc.properties.footprint_geometry.coordinates[0].map((pt: [number, number]) => [pt[1], pt[0]]);
          const footprint = L.polygon(coords, {
            color: '#E2E8F0',
            weight: 1.5,
            fillColor: '#FFFFFF',
            fillOpacity: 0.08,
            dashArray: '3, 4'
          });
          group.addLayer(footprint);
        }
      });
    }

    // 4. Render Tactical Thermal Hotspot Markers
    if (layersVisible.hotspots) {
      incidents.forEach((inc) => {
        const [lon, lat] = inc.geometry.coordinates;
        const isSelected = selectedIncidentId === inc.properties.id;
        const isCritical = inc.properties.severity === 'CRITICAL';
        const isRoutine = inc.properties.classification === 'PERSISTENT_OPERATIONAL_SOURCE';

        let markerHtml = '';
        if (isCritical) {
          markerHtml = `
            <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
              <div class="sonar-pulse" style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: rgba(239, 68, 68, 0.45); border: 2px solid #EF4444;"></div>
              ${isSelected ? '<div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; border: 2px dashed #00F0FF; animation: spin 4s linear infinite;"></div>' : ''}
              <div style="width: 16px; height: 16px; transform: rotate(45deg); background: #FFF; border: 2px solid #EF4444; box-shadow: 0 0 16px #EF4444; z-index: 2;"></div>
            </div>
          `;
        } else if (isRoutine) {
          markerHtml = `
            <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
              ${isSelected ? '<div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; border: 2px solid #00F0FF;"></div>' : ''}
              <div style="width: 14px; height: 14px; border-radius: 50%; background: #1E1B4B; border: 2px solid #818CF8; box-shadow: 0 0 10px #818CF8;"></div>
            </div>
          `;
        } else {
          markerHtml = `
            <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
              ${isSelected ? '<div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; border: 2px solid #00F0FF;"></div>' : ''}
              <div style="width: 12px; height: 12px; border-radius: 50%; background: #2E220D; border: 2px solid #F59E0B; box-shadow: 0 0 6px #F59E0B;"></div>
            </div>
          `;
        }

        const icon = L.divIcon({
          html: markerHtml,
          className: 'custom-leaflet-marker',
          iconSize: [34, 34],
          iconAnchor: [17, 17]
        });

        const marker = L.marker([lat, lon], { icon, zIndexOffset: isSelected ? 1000 : (isCritical ? 500 : 100) });
        marker.on('click', () => onSelectIncident(inc.properties.id));
        marker.bindTooltip(`
          <div style="font-family: inherit; font-size: 11px; line-height: 1.4; padding: 4px;">
            <div style="display: flex; justify-content: space-between; gap: 8px; margin-bottom: 2px;">
              <strong style="color: ${isCritical ? '#EF4444' : (isRoutine ? '#818CF8' : '#F59E0B')};">#${inc.properties.id}</strong>
              <span style="font-weight: 700;">${inc.properties.risk_score}/100</span>
            </div>
            <div style="color: #F8FAFC; font-weight: 600;">${inc.properties.facility_name || 'Industrial Facility'}</div>
            <div style="color: #94A3B8; font-family: monospace; font-size: 10px;">
              FRP: ${inc.properties.frp_total} MW | ΔZ: +${inc.properties.frp_delta_zscore}σ | ${inc.properties.daynight === 'N' ? 'NIGHT' : 'DAY'}
            </div>
          </div>
        `, { sticky: true });

        group.addLayer(marker);
      });
    }
  }, [incidents, facilities, selectedIncidentId, layersVisible, onSelectIncident]);

  return (
    <div style={{ position: 'relative', flex: 1, height: '100%', overflow: 'hidden' }}>
      <div ref={mapContainerRef} className="tactical-map" />

      {/* Photorealistic Satellite vs Tactical Dark Basemap Switcher */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '20px',
        backgroundColor: 'rgba(15, 20, 28, 0.9)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '8px',
        padding: '4px',
        display: 'flex',
        gap: '4px',
        zIndex: 400,
        boxShadow: '0 4px 20px rgba(0,0,0,0.6)'
      }}>
        <button
          onClick={() => setBasemapMode('satellite')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: basemapMode === 'satellite' ? '#0F2937' : 'transparent',
            color: basemapMode === 'satellite' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '11px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Satellite size={14} />
          <span>Photorealistic Satellite</span>
        </button>

        <button
          onClick={() => setBasemapMode('dark')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: basemapMode === 'dark' ? '#1E293B' : 'transparent',
            color: basemapMode === 'dark' ? '#FFF' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '11px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Moon size={14} />
          <span>Tactical Dark</span>
        </button>
      </div>
    </div>
  );
};
