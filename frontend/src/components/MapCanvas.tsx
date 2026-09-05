import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Satellite, Moon, Crosshair, Compass } from 'lucide-react';
import type { IncidentFeature, FacilityFeature } from '../types/incident';
import type { ThermalEvent } from '../types/event';

interface MapCanvasProps {
  incidents: IncidentFeature[];
  facilities: FacilityFeature[];
  thermalEvents?: ThermalEvent[];
  selectedIncidentId: string | null;
  selectedThermalEventId?: string | null;
  onSelectIncident: (id: string) => void;
  onSelectThermalEvent?: (id: string) => void;
  flyToCoords: [number, number] | null;
  flyToZoom?: number;
  layersVisible: {
    hotspots: boolean;
    plumes: boolean;
    facilities: boolean;
    footprints: boolean;
    thermalEvents?: boolean;
    rawObservations?: boolean;
  };
}

export const MapCanvas: React.FC<MapCanvasProps> = ({
  incidents,
  facilities,
  thermalEvents = [],
  selectedIncidentId,
  selectedThermalEventId = null,
  onSelectIncident,
  onSelectThermalEvent,
  flyToCoords,
  flyToZoom = 15,
  layersVisible
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const baseTilesRef = useRef<L.TileLayer | null>(null);
  const labelsTilesRef = useRef<L.TileLayer | null>(null);

  const [basemapMode, setBasemapMode] = useState<'satellite' | 'dark'>('satellite');
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>(null);
  const lastMouseMoveRef = useRef<number>(0);

  // Initialize Map with High-Performance Canvas & Smooth Navigation
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered specifically on India (Lat: 22.0, Lng: 77.5, Zoom: 5)
    const map = L.map(mapContainerRef.current, {
      center: [22.0, 77.5],
      zoom: 5,
      minZoom: 4,
      maxZoom: 19,
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true,
      zoomAnimation: true,
      zoomAnimationThreshold: 8,
      fadeAnimation: true,
      markerZoomAnimation: true,
      wheelDebounceTime: 80,
      wheelPxPerZoomLevel: 120
    });

    // High-Resolution Satellite Basemap (Esri World Imagery)
    const satelliteTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      updateWhenZooming: false,
      updateWhenIdle: true,
      keepBuffer: 6,
      attribution: 'Esri, Maxar, Earthstar Geographics'
    });

    // High-Contrast Reference Labels Layer
    const labelsTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      updateWhenZooming: false,
      updateWhenIdle: true,
      keepBuffer: 6,
      opacity: 0.85
    });

    satelliteTile.addTo(map);
    labelsTile.addTo(map);
    baseTilesRef.current = satelliteTile;
    labelsTilesRef.current = labelsTile;

    // Tactical Metric Scale Bar
    L.control.scale({ imperial: false, position: 'bottomright' }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Throttled Cursor Coordinates HUD
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      const now = Date.now();
      if (now - lastMouseMoveRef.current > 100) {
        lastMouseMoveRef.current = now;
        setCursorCoords({
          lat: Number(e.latlng.lat.toFixed(4)),
          lng: Number(e.latlng.lng.toFixed(4))
        });
      }
    });

    const layerGroup = L.layerGroup().addTo(map);
    layersGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Basemap Switcher (Satellite vs Dark)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseTilesRef.current) map.removeLayer(baseTilesRef.current);
    if (labelsTilesRef.current) map.removeLayer(labelsTilesRef.current);

    if (basemapMode === 'satellite') {
      const sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        updateWhenZooming: false,
        updateWhenIdle: true,
        keepBuffer: 6
      }).addTo(map);

      const labels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        updateWhenZooming: false,
        updateWhenIdle: true,
        keepBuffer: 6,
        opacity: 0.85
      }).addTo(map);

      baseTilesRef.current = sat;
      labelsTilesRef.current = labels;
    } else {
      const dark = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        updateWhenZooming: false,
        updateWhenIdle: true,
        keepBuffer: 6
      }).addTo(map);

      const labels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        updateWhenZooming: false,
        updateWhenIdle: true,
        keepBuffer: 6,
        opacity: 0.85
      }).addTo(map);

      baseTilesRef.current = dark;
      labelsTilesRef.current = labels;
    }
  }, [basemapMode]);

  // Handle Smooth Programmatic Fly-To Transitions
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !flyToCoords) return;

    map.flyTo([flyToCoords[1], flyToCoords[0]], flyToZoom, {
      animate: true,
      duration: 1.4,
      easeLinearity: 0.25
    });
  }, [flyToCoords, flyToZoom]);

  // Render Operational Layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // 1. Render OSM Industrial Facilities (Polygons & Cyan Facility Markers)
    if (layersVisible.facilities && facilities) {
      facilities.forEach((fac) => {
        if (fac.geometry.type === 'Polygon') {
          const coords = fac.geometry.coordinates[0].map((pt: [number, number]) => [pt[1], pt[0]]);
          const poly = L.polygon(coords, {
            color: '#06B6D4',
            weight: 1.5,
            fillColor: '#06B6D4',
            fillOpacity: 0.12,
            dashArray: '3, 4'
          });

          poly.bindTooltip(`
            <div style="font-family: inherit; font-size: 11px; line-height: 1.4;">
              <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 3px;">
                <span style="font-size: 13px;">🏭</span>
                <strong style="color: #38BDF8; font-size: 12px;">${fac.properties.name}</strong>
              </div>
              <div style="color: #CBD5E1; margin-bottom: 2px;">
                Type: <strong>${fac.properties.industrial_type}</strong>
              </div>
              <div style="display: flex; gap: 6px; font-size: 10px; color: #94A3B8;">
                <span>Hazard Classification: <strong style="color: #F87171;">Tier-${fac.properties.hazard_tier}</strong></span>
              </div>
            </div>
          `, { className: 'tactical-tooltip', sticky: true });
          group.addLayer(poly);

          // Centroid factory icon
          const avgLon = fac.geometry.coordinates[0].reduce((sum: number, p: [number, number]) => sum + p[0], 0) / fac.geometry.coordinates[0].length;
          const avgLat = fac.geometry.coordinates[0].reduce((sum: number, p: [number, number]) => sum + p[1], 0) / fac.geometry.coordinates[0].length;
          
          const facIcon = L.divIcon({
            html: `
              <div style="width: 18px; height: 18px; border-radius: 4px; background: rgba(6,182,212,0.2); border: 1px solid #06B6D4; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #38BDF8;">
                🏭
              </div>
            `,
            className: 'custom-leaflet-marker',
            iconSize: [18, 18],
            iconAnchor: [9, 9]
          });
          const facMarker = L.marker([avgLat, avgLon], { icon: facIcon, zIndexOffset: 200 });
          group.addLayer(facMarker);
        }
      });
    }

    // 2. Render 2D Gaussian Estimated Downwind Screening Zone Envelopes
    if (layersVisible.plumes) {
      incidents.forEach((inc) => {
        if (inc.properties.plume_geometry && (inc.properties.severity === 'CRITICAL' || inc.properties.risk_score >= 50)) {
          const coords = inc.properties.plume_geometry.coordinates[0].map((pt: [number, number]) => [pt[1], pt[0]]);
          const plumePoly = L.polygon(coords, {
            color: '#EF4444',
            weight: 1.5,
            fillColor: '#EF4444',
            fillOpacity: 0.25,
            dashArray: '4, 4'
          });
          plumePoly.bindTooltip(`
            <div style="font-family: inherit; font-size: 11px; line-height: 1.4;">
              <div style="display: flex; align-items: center; gap: 5px; color: #F87171; font-weight: 800; margin-bottom: 4px;">
                <span>⚠️</span>
                <span>ESTIMATED DOWNWIND SCREENING ZONE</span>
              </div>
              <div style="color: #E2E8F0; margin-bottom: 2px;">
                Target Incident: <strong>#${inc.properties.id}</strong>
              </div>
              <div style="color: #94A3B8; font-size: 10px;">
                Trajectory: <strong>WNW ──► ESE</strong> (Bearing 115°)
              </div>
              <div style="color: #F87171; font-size: 10px; margin-top: 3px; font-weight: 600;">
                Downwind Screening Extent: ~1,400 meters
              </div>
            </div>
          `, { className: 'tactical-tooltip', sticky: true });
          group.addLayer(plumePoly);
        }
      });
    }

    // 2b. Render 800m NFPA/ERG Emergency Blast Isolation Perimeter Circle for Critical Incidents
    incidents.forEach((inc) => {
      if (inc.properties.severity === 'CRITICAL') {
        const [lon, lat] = inc.geometry.coordinates;
        const blastCircle = L.circle([lat, lon], {
          radius: 800,
          color: '#F97316',
          weight: 1.5,
          dashArray: '5, 6',
          fillColor: '#F97316',
          fillOpacity: 0.05
        });
        blastCircle.bindTooltip(`
          <div style="font-family: inherit; font-size: 11px; line-height: 1.3;">
            <strong style="color: #F97316;">🚨 ERG Guide 128: 800m Isolation Radius</strong><br/>
            <span style="color: #CBD5E1;">Immediate evacuation zone around volatile storage tanks</span>
          </div>
        `, { className: 'tactical-tooltip', sticky: true });
        group.addLayer(blastCircle);
      }
    });

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
          footprint.bindTooltip(`
            <div style="font-family: inherit; font-size: 10px;">
              <strong style="color: #E2E8F0;">VIIRS 375m Ground Pixel Footprint</strong><br/>
              <span style="color: #94A3B8;">Spatial scan-track diamond oriented to satellite orbit</span>
            </div>
          `, { className: 'tactical-tooltip', sticky: true });
          group.addLayer(footprint);
        }
      });
    }

    // 4. Render Geodesic Distance Vector Line for Selected Incident (if offset from plant)
    const selectedInc = incidents.find(i => i.properties.id === selectedIncidentId);
    if (selectedInc && selectedInc.properties.dist_to_facility_m > 0 && facilities) {
      const matchedFac = facilities.find(f => f.properties.name === selectedInc.properties.facility_name);
      if (matchedFac && matchedFac.geometry.type === 'Polygon') {
        const ring = matchedFac.geometry.coordinates[0];
        const avgLon = ring.reduce((sum: number, p: [number, number]) => sum + p[0], 0) / ring.length;
        const avgLat = ring.reduce((sum: number, p: [number, number]) => sum + p[1], 0) / ring.length;
        const [incLon, incLat] = selectedInc.geometry.coordinates;

        const offsetLine = L.polyline([[avgLat, avgLon], [incLat, incLon]], {
          color: '#38BDF8',
          weight: 2,
          dashArray: '4, 6'
        });

        offsetLine.bindTooltip(`
          <div style="font-family: monospace; font-size: 11px; color: #38BDF8;">
            📏 Proximity: ${selectedInc.properties.dist_to_facility_m}m to ${matchedFac.properties.name}
          </div>
        `, { className: 'tactical-tooltip', permanent: true, direction: 'center' });

        group.addLayer(offsetLine);
      }
    }

    // 5. Render Tactical Live Thermal Hotspot Markers
    if (layersVisible.hotspots) {
      incidents.forEach((inc) => {
        const [lon, lat] = inc.geometry.coordinates;
        const isSelected = selectedIncidentId === inc.properties.id;
        const isCritical = inc.properties.severity === 'CRITICAL';
        const isHigh = inc.properties.severity === 'HIGH';
        const isRoutine = inc.properties.classification === 'PERSISTENT_OPERATIONAL_SOURCE';

        let markerHtml = '';
        if (isCritical) {
          markerHtml = `
            <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
              <div class="sonar-pulse" style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(239, 68, 68, 0.45); border: 2px solid #EF4444;"></div>
              ${isSelected ? '<div style="position: absolute; width: 46px; height: 46px; border-radius: 50%; border: 2px dashed #00F0FF;"></div>' : ''}
              <div style="width: 16px; height: 16px; transform: rotate(45deg); background: #FFF; border: 2px solid #EF4444; box-shadow: 0 0 16px #EF4444; z-index: 2;"></div>
            </div>
          `;
        } else if (isRoutine) {
          markerHtml = `
            <div style="position: relative; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
              ${isSelected ? '<div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; border: 2px solid #00F0FF;"></div>' : ''}
              <div style="width: 14px; height: 14px; border-radius: 50%; background: #1E1B4B; border: 2px solid #818CF8; box-shadow: 0 0 10px #818CF8;"></div>
            </div>
          `;
        } else {
          markerHtml = `
            <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
              ${isSelected ? '<div style="position: absolute; width: 30px; height: 30px; border-radius: 50%; border: 2px solid #00F0FF;"></div>' : ''}
              <div style="width: 12px; height: 12px; border-radius: 50%; background: #2E220D; border: 2px solid #F59E0B; box-shadow: 0 0 6px #F59E0B;"></div>
            </div>
          `;
        }

        const icon = L.divIcon({
          html: markerHtml,
          className: 'custom-leaflet-marker',
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        const marker = L.marker([lat, lon], { icon, zIndexOffset: isSelected ? 1000 : (isCritical ? 500 : 100) });
        marker.on('click', () => onSelectIncident(inc.properties.id));

        const badgeColor = isCritical ? '#EF4444' : isHigh ? '#F97316' : isRoutine ? '#818CF8' : '#F59E0B';
        const badgeBg = isCritical ? '#2D1216' : isRoutine ? '#1A1B30' : '#2A1D0D';

        marker.bindTooltip(`
          <div style="font-family: inherit; font-size: 11px; line-height: 1.4; width: 250px;">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 6px; border-bottom: 1px solid #1E2633; padding-bottom: 5px;">
              <span class="font-mono" style="font-weight: 800; color: #FFF; font-size: 12px;">
                #${inc.properties.id}
              </span>
              <span style="background-color: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeColor}; font-weight: 800; font-size: 10px; padding: 1px 6px; border-radius: 3px; font-family: monospace;">
                ${inc.properties.severity} ${inc.properties.risk_score}/100
              </span>
            </div>

            <div style="color: #F8FAFC; font-weight: 700; font-size: 12px; margin-bottom: 6px; line-height: 1.3;">
              ${inc.properties.facility_name || 'Industrial Compound'}
            </div>

            <div style="display: flex; align-items: center; gap: 6px; font-size: 10px; margin-bottom: 8px;">
              <span style="color: ${badgeColor}; font-weight: 600;">
                ● ${inc.properties.classification.replace(/_/g, ' ')}
              </span>
              <span style="color: #475569;">|</span>
              <span style="color: #94A3B8;">
                ${inc.properties.spatial_match_level === 'DIRECT_HIT' ? 'Core (0m)' : `${inc.properties.dist_to_facility_m}m offset`}
              </span>
            </div>

            <div class="font-mono" style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px 8px; background-color: #05070B; padding: 6px 8px; border-radius: 3px; border: 1px solid #141A24; font-size: 10px; margin-bottom: 6px;">
              <div>FRP: <strong style="color: #FFF;">${inc.properties.frp_total} MW</strong></div>
              <div>Anomaly: <strong style="color: ${inc.properties.frp_delta_zscore > 3 ? '#F87171' : '#FFF'};">+${inc.properties.frp_delta_zscore}σ</strong></div>
              <div>Temp: <strong style="color: #CBD5E1;">${inc.properties.bright_ti4_max} K</strong></div>
              <div>Pass: <strong style="color: #38BDF8;">${inc.properties.satellite}</strong></div>
            </div>

            <div style="color: #38BDF8; font-size: 9px; font-weight: 600; text-align: right;">
              👉 Click marker to inspect intelligence
            </div>
          </div>
        `, { 
          className: 'tactical-tooltip', 
          sticky: true,
          direction: 'top',
          offset: [0, -10]
        });

        group.addLayer(marker);
      });
    }

    // 6. Render Spatio-Temporal Candidate Thermal Events (Hulls, Trajectory, Peaks, Centroids)
    if (layersVisible.thermalEvents !== false && thermalEvents && thermalEvents.length > 0) {
      thermalEvents.forEach((ev) => {
        const isEvSelected = selectedThermalEventId === ev.id;

        // 6a. Render Event Spatial Extent (Convex Hull Geometry)
        if (ev.convex_hull_geojson) {
          try {
            const geom = JSON.parse(ev.convex_hull_geojson);
            if (geom.type === 'Polygon' && geom.coordinates && geom.coordinates[0]) {
              const latlngs = geom.coordinates[0].map((pt: [number, number]) => [pt[1], pt[0]]);
              const hullPoly = L.polygon(latlngs, {
                color: isEvSelected ? '#00F0FF' : '#F59E0B',
                weight: isEvSelected ? 2.5 : 1.5,
                fillColor: '#F59E0B',
                fillOpacity: isEvSelected ? 0.24 : 0.12,
                dashArray: isEvSelected ? undefined : '5, 5'
              });

              hullPoly.bindTooltip(`
                <div style="font-family: inherit; font-size: 11px; line-height: 1.4;">
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px; border-bottom: 1px solid #1E293B; padding-bottom: 4px;">
                    <strong style="color: #F59E0B; font-family: monospace;">${ev.id}</strong>
                    <span style="font-size: 9px; background: rgba(245,158,11,0.2); color: #FCD34D; padding: 1px 5px; border-radius: 3px; font-weight: 700;">
                      ${ev.status}
                    </span>
                  </div>
                  <div style="color: #E2E8F0; font-weight: 600; margin-bottom: 2px;">${ev.title}</div>
                  <div style="color: #94A3B8; font-size: 10px;">
                    Observation Spatial Extent: <strong style="color: #38BDF8;">${ev.spatial_extent_km2} km²</strong>
                  </div>
                  <div style="color: #94A3B8; font-size: 10px;">
                    Observations: <strong>${ev.observation_count}</strong> | Peak: <strong style="color: #F59E0B;">${ev.frp_peak_mw} MW</strong>
                  </div>
                </div>
              `, { className: 'tactical-tooltip', sticky: true });

              if (onSelectThermalEvent) {
                hullPoly.on('click', () => onSelectThermalEvent(ev.id));
              }
              group.addLayer(hullPoly);
            }
          } catch (e) {
            // Skip unparseable geojson
          }
        }

        // 6b. Trajectory line connecting member observations when selected
        if (isEvSelected && ev.observations && ev.observations.length > 1) {
          const sortedObs = [...ev.observations].sort((a, b) => 
            new Date(a.observed_at || '').getTime() - new Date(b.observed_at || '').getTime()
          );
          const trajPoints = sortedObs.map(o => [o.latitude, o.longitude] as [number, number]);
          const trajLine = L.polyline(trajPoints, {
            color: '#38BDF8',
            weight: 2,
            dashArray: '4, 4',
            opacity: 0.8
          });
          trajLine.bindTooltip(`
            <div style="font-family: monospace; font-size: 10px; color: #38BDF8;">
              🛰️ Member Detection Sequence (${ev.observations.length} Passes)
            </div>
          `, { className: 'tactical-tooltip', sticky: true });
          group.addLayer(trajLine);
        }

        // 6c. Render Peak Observation Diamond Marker
        if (ev.peak_latitude && ev.peak_longitude) {
          const peakIcon = L.divIcon({
            html: `
              <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: rgba(245, 158, 11, 0.35); filter: blur(2px);"></div>
                ${isEvSelected ? '<div style="position: absolute; width: 36px; height: 36px; border: 2px dashed #00F0FF; border-radius: 50%;"></div>' : ''}
                <div style="width: 14px; height: 14px; transform: rotate(45deg); background: #FEF08A; border: 2px solid #F59E0B; box-shadow: 0 0 12px #F59E0B; z-index: 5;"></div>
              </div>
            `,
            className: 'custom-leaflet-marker',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          });

          const peakMarker = L.marker([ev.peak_latitude, ev.peak_longitude], {
            icon: peakIcon,
            zIndexOffset: isEvSelected ? 1200 : 800
          });

          peakMarker.bindTooltip(`
            <div style="font-family: inherit; font-size: 11px; line-height: 1.4;">
              <div style="color: #FCD34D; font-weight: 800; font-size: 11px; margin-bottom: 2px;">
                ◇ PEAK FRP OBSERVATION (${ev.frp_peak_mw} MW)
              </div>
              <div style="color: #CBD5E1; font-size: 10px;">
                Event: <span style="font-family: monospace;">#${ev.id}</span>
              </div>
              <div style="color: #94A3B8; font-size: 10px;">
                Max Temp: <strong>${ev.max_brightness_kelvin} K</strong>
              </div>
            </div>
          `, { className: 'tactical-tooltip', sticky: true });

          if (onSelectThermalEvent) {
            peakMarker.on('click', () => onSelectThermalEvent(ev.id));
          }
          group.addLayer(peakMarker);
        }

        // 6d. Render FRP-Weighted Centroid Crosshair Marker
        const centroidIcon = L.divIcon({
          html: `
            <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background: #06B6D4; border: 1.5px solid #E0F2FE; box-shadow: 0 0 6px #06B6D4;"></div>
            </div>
          `,
          className: 'custom-leaflet-marker',
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });

        const centroidMarker = L.marker([ev.centroid_latitude, ev.centroid_longitude], {
          icon: centroidIcon,
          zIndexOffset: isEvSelected ? 1100 : 700
        });

        centroidMarker.bindTooltip(`
          <div style="font-family: inherit; font-size: 10px;">
            <strong style="color: #38BDF8;">FRP-Weighted Centroid</strong><br/>
            <span style="color: #94A3B8;">Event: ${ev.id}</span>
          </div>
        `, { className: 'tactical-tooltip', sticky: true });

        if (onSelectThermalEvent) {
          centroidMarker.on('click', () => onSelectThermalEvent(ev.id));
        }
        group.addLayer(centroidMarker);

        // 6e. Render Individual Member Satellite Observation Dots
        if (layersVisible.rawObservations !== false && ev.observations) {
          ev.observations.forEach((obs) => {
            const dotIcon = L.divIcon({
              html: `
                <div style="width: 7px; height: 7px; border-radius: 50%; background: #FCD34D; border: 1px solid #F59E0B; box-shadow: 0 0 4px #F59E0B; cursor: pointer;"></div>
              `,
              className: 'custom-leaflet-marker',
              iconSize: [7, 7],
              iconAnchor: [3.5, 3.5]
            });

            const dotMarker = L.marker([obs.latitude, obs.longitude], {
              icon: dotIcon,
              zIndexOffset: 600
            });

            dotMarker.bindTooltip(`
              <div style="font-family: monospace; font-size: 10px; line-height: 1.3;">
                <strong style="color: #FEF08A;">${obs.satellite} · ${obs.instrument}</strong><br/>
                <span>FRP: ${obs.frp} MW | Temp: ${obs.brightness_temperature} K</span><br/>
                <span style="color: #94A3B8;">Dist to Centroid: ${Math.round(obs.distance_to_centroid_m)}m</span>
              </div>
            `, { className: 'tactical-tooltip', sticky: true });

            if (onSelectThermalEvent) {
              dotMarker.on('click', () => onSelectThermalEvent(ev.id));
            }
            group.addLayer(dotMarker);
          });
        }
      });
    }
  }, [incidents, facilities, thermalEvents, selectedIncidentId, selectedThermalEventId, layersVisible, onSelectIncident, onSelectThermalEvent]);

  return (
    <div className="relative flex-1 h-full overflow-hidden select-none">
      {/* 1. Leaflet Base Canvas */}
      <div ref={mapContainerRef} className="tactical-map w-full h-full" />

      {/* 2. Map Viewport Dark Edge Gradient (integrates UI seamlessly) */}
      <div 
        className="absolute inset-0 pointer-events-none z-[300]"
        style={{
          boxShadow: 'inset 0 0 60px 20px rgba(1, 4, 10, 0.75)'
        }}
      />

      {/* 3. Photorealistic Satellite vs Tactical Dark Basemap Switcher */}
      <div className="absolute bottom-14 right-24 bg-[#030a14]/90 backdrop-blur-md border border-cyan-500/30 rounded-xl p-1.5 flex gap-1.5 z-[400] shadow-xl font-mono text-xs">
        <button
          onClick={() => setBasemapMode('satellite')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg font-bold transition-all ${
            basemapMode === 'satellite'
              ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <Satellite className="w-4 h-4" />
          <span>SATELLITE</span>
        </button>

        <button
          onClick={() => setBasemapMode('dark')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg font-bold transition-all ${
            basemapMode === 'dark'
              ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <Moon className="w-4 h-4" />
          <span>DARK</span>
        </button>
      </div>

      {/* 4. Tactical Compass HUD */}
      <div className="absolute top-24 right-5 bg-[#030a14]/90 backdrop-blur-md border border-cyan-500/30 rounded-xl px-3.5 py-2 flex items-center gap-2.5 text-xs font-mono text-slate-300 z-[400] shadow-xl">
        <Compass className="w-4 h-4 text-cyan-400" />
        <span className="font-bold tracking-wider">NORTH 000°</span>
      </div>

      {/* 5. Real-time Cursor Coordinates HUD */}
      {cursorCoords && (
        <div className="absolute bottom-14 right-72 bg-[#030a14]/90 backdrop-blur-md border border-cyan-500/30 rounded-xl px-3.5 py-2 flex items-center gap-2.5 text-xs font-mono text-slate-300 z-[400] shadow-xl">
          <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            {cursorCoords.lat > 0 ? `${cursorCoords.lat}° N` : `${Math.abs(cursorCoords.lat)}° S`}, {' '}
            {cursorCoords.lng > 0 ? `${cursorCoords.lng}° E` : `${Math.abs(cursorCoords.lng)}° W`}
          </span>
          <span className="text-white/20">|</span>
          <span className="text-slate-400 font-semibold">WGS84</span>
        </div>
      )}
    </div>
  );
};

export default MapCanvas;
