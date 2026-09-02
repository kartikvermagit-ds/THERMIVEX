import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
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

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [22.0, 73.0],
      zoom: 6,
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layersGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (flyToCoords && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([flyToCoords[1], flyToCoords[0]], 14, {
        duration: 1.2
      });
    }
  }, [flyToCoords]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // 1. Render OSM Industrial Facilities Layer (Cyan Polygons)
    if (layersVisible.facilities && facilities) {
      facilities.forEach((fac) => {
        if (fac.geometry.type === 'Polygon') {
          const coords = fac.geometry.coordinates[0].map((pt: [number, number]) => [pt[1], pt[0]]);
          const poly = L.polygon(coords, {
            color: '#06B6D4',
            weight: 1.5,
            fillColor: '#06B6D4',
            fillOpacity: 0.12,
            dashArray: '4, 4'
          });
          poly.bindTooltip(`🏭 ${fac.properties.name}`, { sticky: true });
          group.addLayer(poly);
        }
      });
    }

    // 2. Render 2D Gaussian Plume Cones
    if (layersVisible.plumes) {
      incidents.forEach((inc) => {
        if (inc.properties.plume_geometry && (inc.properties.severity === 'CRITICAL' || inc.properties.risk_score >= 50)) {
          const coords = inc.properties.plume_geometry.coordinates[0].map((pt: [number, number]) => [pt[1], pt[0]]);
          const plumePoly = L.polygon(coords, {
            color: '#EF4444',
            weight: 1,
            fillColor: '#EF4444',
            fillOpacity: 0.22,
            dashArray: '2, 3'
          });
          plumePoly.bindTooltip(`⚠️ Downwind Toxic Hazard Plume (#${inc.properties.id})`, { sticky: true });
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
            color: '#94A3B8',
            weight: 1,
            fillOpacity: 0.05,
            dashArray: '3, 3'
          });
          group.addLayer(footprint);
        }
      });
    }

    // 4. Render Thermal Hotspot Markers
    if (layersVisible.hotspots) {
      incidents.forEach((inc) => {
        const [lon, lat] = inc.geometry.coordinates;
        const isCritical = inc.properties.severity === 'CRITICAL';
        const isRoutine = inc.properties.classification === 'PERSISTENT_OPERATIONAL_SOURCE';

        let markerHtml = '';
        if (isCritical) {
          markerHtml = `
            <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
              <div class="sonar-pulse" style="position: absolute; width: 26px; height: 26px; border-radius: 50%; background: rgba(239, 68, 68, 0.4); border: 2px solid #EF4444;"></div>
              <div style="width: 14px; height: 14px; transform: rotate(45deg); background: #FFF; border: 2px solid #EF4444; box-shadow: 0 0 10px #EF4444;"></div>
            </div>
          `;
        } else if (isRoutine) {
          markerHtml = `
            <div style="position: relative; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;">
              <div style="width: 12px; height: 12px; border-radius: 50%; background: #1E1B4B; border: 2px solid #818CF8; box-shadow: 0 0 6px #818CF8;"></div>
            </div>
          `;
        } else {
          markerHtml = `
            <div style="position: relative; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center;">
              <div style="width: 10px; height: 10px; border-radius: 50%; background: #2E220D; border: 2px solid #F59E0B;"></div>
            </div>
          `;
        }

        const icon = L.divIcon({
          html: markerHtml,
          className: 'custom-leaflet-marker',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const marker = L.marker([lat, lon], { icon });
        marker.on('click', () => onSelectIncident(inc.properties.id));
        marker.bindTooltip(`
          <div style="font-family: monospace; font-size: 11px;">
            <strong>#${inc.properties.id}</strong> | ${inc.properties.facility_name || 'Industrial'}<br/>
            FRP: ${inc.properties.frp_total} MW | Risk: ${inc.properties.risk_score}/100
          </div>
        `, { sticky: true });

        group.addLayer(marker);
      });
    }
  }, [incidents, facilities, selectedIncidentId, layersVisible, onSelectIncident]);

  return (
    <div style={{ position: 'relative', flex: 1, height: '100%', overflow: 'hidden' }}>
      <div ref={mapContainerRef} className="tactical-map" />
    </div>
  );
};
