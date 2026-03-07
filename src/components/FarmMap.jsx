import { useEffect } from 'react'
import { MapContainer, TileLayer, Polygon, Popup, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { FARMS, STATUS } from '../data/farms.js'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function FarmMarker({ farm, active }) {
  const color = active ? '#166534' : '#64748b'
  const icon = L.divIcon({
    className: '',
    html: `<div style="font-family:-apple-system,sans-serif;font-size:11px;font-weight:800;padding:5px 12px;border-radius:20px;white-space:nowrap;box-shadow:0 2px 10px rgba(0,0,0,.2);border:2px solid white;background:${active ? 'white' : color};color:${active ? color : 'white'}">${farm.icon} ${farm.name}</div>`,
    iconAnchor: [0, 0],
  })
  return <Marker position={[farm.lat, farm.lng]} icon={icon} zIndexOffset={active ? 1000 : 0} />
}

function FitBounds({ zones, farmId }) {
  const map = useMap()
  useEffect(() => {
    if (zones.length) {
      const all = zones.flatMap(z => z.coords)
      map.fitBounds(L.latLngBounds(all), { padding: [32, 32] })
    } else {
      map.fitBounds(L.latLngBounds(FARMS.map(f => [f.lat, f.lng])), { padding: [60, 60], maxZoom: 13 })
    }
  }, [zones, farmId])
  return null
}

export default function FarmMap({ zones, farmId }) {
  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <MapContainer
        center={[49.598422, -119.664789]}
        zoom={15}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={20}
          attribution="© ESRI"
        />
        <FitBounds zones={zones} farmId={farmId} />
        {FARMS.map((farm, i) => (
          <FarmMarker key={farm.id} farm={farm} active={i === farmId} />
        ))}
        {zones.map(zone => {
          const s = STATUS[zone.status]
          return (
            <Polygon key={zone.id} positions={zone.coords}
              pathOptions={{ fillColor: s.mapFill, fillOpacity: 1, color: s.mapStroke, weight: 2.5, opacity: 0.95 }}>
              <Popup closeButton={false} maxWidth={220}>
                <div style={{ padding: '12px 14px', fontFamily: '-apple-system,sans-serif' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', marginBottom: 6 }}>{zone.name} · {zone.crop}</div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>{zone.moisture}% moisture · {zone.temp}°C</div>
                  <div style={{ marginTop: 8, fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 20, display: 'inline-block', background: s.bg, color: s.color, border: `1.5px solid ${s.border}` }}>{zone.status}</div>
                </div>
              </Popup>
            </Polygon>
          )
        })}
      </MapContainer>
      {!zones.length && (
        <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 500, background: 'white', borderRadius: 14, padding: '12px 20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,.08)', textAlign: 'center', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>{FARMS[farmId]?.icon} {FARMS[farmId]?.name}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>No blocks mapped yet</div>
        </div>
      )}
    </div>
  )
}
