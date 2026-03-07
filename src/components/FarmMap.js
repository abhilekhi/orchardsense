// ─────────────────────────────────────────────
//  FarmMap.jsx  –  Leaflet satellite/street map
//  Shows all 3 farm pins always.
//  Zone polygons for whichever farm is active.
// ─────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';
import { FARMS, MAP_COLORS, STATUS_CONFIG } from '../data/farms.js';

const FARM_COLORS = ['#166534', '#1d4ed8', '#b45309'];

export function FarmMap({ zones, farmId, onZoneSelect }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const satLayerRef  = useRef(null);
  const streetLayerRef = useRef(null);
  const zoneLayersRef  = useRef([]);
  const farmMarkersRef = useRef([]);
  const [mapMode, setMapMode] = useState('sat');

  // Initialise map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [49.598422, -119.664789],
      zoom: 15,
      zoomControl: true,
      attributionControl: true,
    });
    map.attributionControl.setPrefix('');

    satLayerRef.current = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 20, attribution: '© ESRI' }
    );
    streetLayerRef.current = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { maxZoom: 19, attribution: '© OpenStreetMap' }
    );
    satLayerRef.current.addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Farm pin markers (all 3, always visible)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    farmMarkersRef.current.forEach(m => map.removeLayer(m));
    farmMarkersRef.current = [];

    FARMS.forEach((farm, i) => {
      const active = i === farmId;
      const icon = L.divIcon({
        className: '',
        html: `<div style="
          font-family: -apple-system, sans-serif;
          font-size: ${active ? 11 : 10}px;
          font-weight: 800;
          padding: ${active ? '5px 12px' : '4px 10px'};
          border-radius: 20px;
          white-space: nowrap;
          box-shadow: 0 2px 10px rgba(0,0,0,.2);
          border: 2px solid white;
          background: ${active ? 'white' : FARM_COLORS[i]};
          color: ${active ? FARM_COLORS[i] : 'white'};
        ">${farm.icon} ${farm.name}</div>`,
        iconAnchor: [0, 0],
      });
      const marker = L.marker([farm.lat, farm.lng], {
        icon,
        zIndexOffset: active ? 1000 : 0,
      }).addTo(map);
      farmMarkersRef.current.push(marker);
    });
  }, [farmId]);

  // Zone polygons for active farm
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    zoneLayersRef.current.forEach(l => map.removeLayer(l));
    zoneLayersRef.current = [];

    if (!zones.length) {
      // Zoom to show all farm pins
      const bounds = L.latLngBounds(FARMS.map(f => [f.lat, f.lng]));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });
      return;
    }

    zones.forEach(zone => {
      const fill   = MAP_COLORS.fill[zone.status]   ?? 'rgba(148,163,184,.35)';
      const stroke = MAP_COLORS.stroke[zone.status] ?? '#94a3b8';
      const cfg    = STATUS_CONFIG[zone.status];

      const poly = L.polygon(zone.coords, {
        fillColor: fill, fillOpacity: 1,
        color: stroke, weight: 2.5, opacity: .95,
      });

      poly.bindPopup(`
        <div style="padding:12px 14px">
          <div style="font-size:14px;font-weight:800;color:#1e293b;margin-bottom:6px">${zone.name}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
            <span style="font-size:11px;color:#64748b">${zone.crop} · ${zone.moisture}%</span>
            <span style="font-size:10px;font-weight:800;padding:3px 9px;border-radius:20px;
              background:${cfg.bg};color:${cfg.color};border:1.5px solid ${cfg.border}">
              ${zone.status}
            </span>
          </div>
        </div>
      `, { maxWidth: 260, closeButton: false });

      poly.on('click', () => onZoneSelect?.(zone.id));
      poly.addTo(map);
      zoneLayersRef.current.push(poly);
    });

    const allCoords = zones.flatMap(z => z.coords);
    map.fitBounds(L.latLngBounds(allCoords), { padding: [32, 32] });
  }, [zones]);

  function switchLayer(mode) {
    const map = mapRef.current;
    if (!map) return;
    setMapMode(mode);
    if (mode === 'sat') {
      map.removeLayer(streetLayerRef.current);
      satLayerRef.current.addTo(map);
    } else {
      map.removeLayer(satLayerRef.current);
      streetLayerRef.current.addTo(map);
    }
    zoneLayersRef.current.forEach(l => l.bringToFront());
  }

  const farm = FARMS[farmId];

  return (
    <div className="map-screen">
      <div ref={containerRef} id="leaflet-map" />

      <div className="map-layer-btns">
        <button
          className={`map-layer-btn${mapMode === 'sat' ? ' active' : ''}`}
          onClick={() => switchLayer('sat')}>🛰 Sat</button>
        <button
          className={`map-layer-btn${mapMode === 'street' ? ' active' : ''}`}
          onClick={() => switchLayer('street')}>🗺 Street</button>
      </div>

      {!zones.length && (
        <div className="map-no-blocks-badge">
          <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 3 }}>
            {farm.icon} {farm.name}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>
            No blocks mapped yet · Upload a KML to add zones
          </div>
        </div>
      )}
    </div>
  );
}
