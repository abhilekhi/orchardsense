import { useEffect, useRef, useState } from 'react'
import { FARMS, STATUS } from '../data/farms.js'

const FARM_COLORS = ['#166534', '#1d4ed8', '#b45309']

export default function FarmMap({ zones, farmId }) {
  const ref  = useRef(null)
  const mapRef = useRef(null)
  const satRef = useRef(null)
  const streetRef = useRef(null)
  const zoneLayersRef  = useRef([])
  const farmMarkersRef = useRef([])
  const [mode, setMode] = useState('sat')

  useEffect(() => {
    if (!ref.current || mapRef.current) return
    const map = window.L.map(ref.current, {
      center: [49.598422, -119.664789], zoom: 15,
      zoomControl: true, attributionControl: true,
    })
    map.attributionControl.setPrefix('')
    satRef.current = window.L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 20, attribution: '© ESRI' }
    )
    streetRef.current = window.L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { maxZoom: 19, attribution: '© OpenStreetMap' }
    )
    satRef.current.addTo(map)
    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [])

  // Farm pins
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    farmMarkersRef.current.forEach(m => map.removeLayer(m))
    farmMarkersRef.current = []
    FARMS.forEach((farm, i) => {
      const active = i === farmId
      const icon = window.L.divIcon({
        className: '',
        html: `<div style="font-family:-apple-system,sans-serif;font-size:${active?11:10}px;font-weight:800;padding:${active?'5px 12px':'4px 10px'};border-radius:20px;white-space:nowrap;box-shadow:0 2px 10px rgba(0,0,0,.2);border:2px solid white;background:${active?'white':FARM_COLORS[i]};color:${active?FARM_COLORS[i]:'white'}">${farm.icon} ${farm.name}</div>`,
        iconAnchor: [0, 0],
      })
      farmMarkersRef.current.push(
        window.L.marker([farm.lat, farm.lng], { icon, zIndexOffset: active ? 1000 : 0 }).addTo(map)
      )
    })
  }, [farmId])

  // Zone polygons
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    zoneLayersRef.current.forEach(l => map.removeLayer(l))
    zoneLayersRef.current = []
    if (!zones.length) {
      map.fitBounds(window.L.latLngBounds(FARMS.map(f => [f.lat, f.lng])), { padding: [60,60], maxZoom: 13 })
      return
    }
    zones.forEach(zone => {
      const s = STATUS[zone.status]
      const poly = window.L.polygon(zone.coords, {
        fillColor: s.mapFill, fillOpacity: 1,
        color: s.mapStroke, weight: 2.5, opacity: .95,
      })
      poly.bindPopup(`
        <div style="padding:12px 14px;font-family:-apple-system,sans-serif">
          <div style="font-size:14px;font-weight:800;color:#1e293b;margin-bottom:6px">${zone.name} · ${zone.crop}</div>
          <div style="font-size:13px;color:#64748b">${zone.moisture}% moisture · ${zone.temp}°C</div>
          <div style="margin-top:8px;font-size:11px;font-weight:800;padding:3px 9px;border-radius:20px;display:inline-block;background:${s.bg};color:${s.color};border:1.5px solid ${s.border}">${zone.status}</div>
        </div>
      `, { maxWidth: 220, closeButton: false })
      poly.addTo(map)
      zoneLayersRef.current.push(poly)
    })
    map.fitBounds(window.L.latLngBounds(zones.flatMap(z => z.coords)), { padding: [32,32] })
  }, [zones])

  function switchLayer(m) {
    const map = mapRef.current
    if (!map) return
    setMode(m)
    if (m === 'sat') { map.removeLayer(streetRef.current); satRef.current.addTo(map) }
    else { map.removeLayer(satRef.current); streetRef.current.addTo(map) }
    zoneLayersRef.current.forEach(l => l.bringToFront())
  }

  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <div ref={ref} style={{ width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 500, display: 'flex', gap: 5 }}>
        {['sat','street'].map(m => (
          <button key={m} onClick={() => switchLayer(m)} style={{
            background: mode === m ? '#f0fdf4' : 'white',
            border: `1.5px solid ${mode === m ? '#bbf7d0' : '#e2e8f0'}`,
            color: mode === m ? '#166534' : '#64748b',
            borderRadius: 8, padding: '6px 11px', fontSize: 10, fontWeight: 800,
            boxShadow: '0 1px 3px rgba(0,0,0,.06)', cursor: 'pointer',
          }}>
            {m === 'sat' ? '🛰 Sat' : '🗺 Street'}
          </button>
        ))}
      </div>
      {!zones.length && (
        <div style={{
          position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          zIndex: 500, background: 'white', borderRadius: 14, padding: '12px 20px',
          border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,.08)',
          textAlign: 'center', whiteSpace: 'nowrap',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>
            {FARMS[farmId].icon} {FARMS[farmId].name}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
            No blocks mapped yet
          </div>
        </div>
      )}
    </div>
  )
}
