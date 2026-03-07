import { useState, useMemo, useEffect, useRef } from 'react'
import { STATUS, CROP_ICON } from '../data/farms.js'

// ── Mini map showing critical/action blocks highlighted ────
function MiniMap({ zones }) {
  const ref = useRef(null)
  const mapRef = useRef(null)
  const layersRef = useRef([])

  useEffect(() => {
    if (!ref.current || mapRef.current) return
    const map = window.L.map(ref.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
    })
    window.L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 20 }
    ).addTo(map)
    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !zones.length) return
    layersRef.current.forEach(l => map.removeLayer(l))
    layersRef.current = []

    zones.forEach(zone => {
      const s = STATUS[zone.status]
      const poly = window.L.polygon(zone.coords, {
        fillColor: s.mapFill, fillOpacity: 1,
        color: s.mapStroke, weight: 2, opacity: 1,
      }).addTo(map)
      layersRef.current.push(poly)
    })

    const all = zones.flatMap(z => z.coords)
    map.fitBounds(window.L.latLngBounds(all), { padding: [8, 8] })
  }, [zones])

  return (
    <div
      ref={ref}
      style={{ width: '100%', height: 160, borderRadius: 12, overflow: 'hidden' }}
    />
  )
}

// ── Moisture bar ───────────────────────────────────────────
function MoistureBar({ pct, color }) {
  return (
    <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{
        width: `${pct}%`, height: '100%',
        background: color, borderRadius: 99,
        transition: 'width .5s ease',
      }} />
    </div>
  )
}

// ── Single block row in the list ───────────────────────────
function BlockRow({ zone, onSelect, selected }) {
  const s = STATUS[zone.status]
  return (
    <button
      onClick={() => onSelect(selected ? null : zone.id)}
      style={{
        width: '100%', textAlign: 'left', background: selected ? s.bg : 'white',
        border: `1.5px solid ${selected ? s.border : '#f1f5f9'}`,
        borderRadius: 12, padding: '12px 14px',
        cursor: 'pointer', transition: 'all .15s',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Crop icon + name */}
        <span style={{ fontSize: 20, flexShrink: 0 }}>{CROP_ICON[zone.crop]}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>
              {zone.name} · {zone.crop}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 800, padding: '2px 8px',
              borderRadius: 20, background: s.bg, color: s.color,
              border: `1.5px solid ${s.border}`, flexShrink: 0, marginLeft: 8,
            }}>
              {zone.status === 'Action Required' ? 'Monitor' : zone.status}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MoistureBar pct={zone.moisture} color={s.bar} />
            <span style={{ fontSize: 13, fontWeight: 800, color: s.color, flexShrink: 0 }}>
              {zone.moisture}%
            </span>
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      {selected && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${s.border}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
            {[
              { l: 'Ground Temp', v: `${zone.temp}°C` },
              { l: 'Sensor Depth', v: `${zone.depth}cm` },
              { l: 'Last Read', v: zone.lastRead },
            ].map(({ l, v }) => (
              <div key={l} style={{ background: 'white', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>{l}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{v}</div>
              </div>
            ))}
          </div>
          <button
            onClick={e => { e.stopPropagation(); alert(`Action logged for ${zone.name}`) }}
            style={{
              width: '100%', padding: '10px', borderRadius: 10, border: 'none',
              background: zone.status === 'Critical' ? s.bar : s.bg,
              color: zone.status === 'Critical' ? 'white' : s.color,
              fontSize: 12, fontWeight: 800, cursor: 'pointer',
              fontFamily: 'inherit', letterSpacing: .5,
            }}>
            {zone.status === 'Critical' ? '💧 Mark as Irrigated' :
             zone.status === 'Action Required' ? '📅 Schedule Irrigation' :
             zone.status === 'Too Wet' ? '🔍 Check Drainage' : '✓ No Action Needed'}
          </button>
        </div>
      )}
    </button>
  )
}

// ── Main Today screen ──────────────────────────────────────
export default function TodayScreen({ zones, weather }) {
  const [selId, setSelId] = useState(null)

  if (!zones || !Array.isArray(zones)) return null
  const critical       = zones.filter(z => z.status === 'Critical')
  const actionRequired = zones.filter(z => z.status === 'Action Required')
  const sorted         = useMemo(() =>
    [...zones].sort((a, b) => a.moisture - b.moisture), [zones])

  // Rain coming?
  const rainDay = weather?.forecast?.find(d => d.rain >= 50)
  const rainToday = rainDay?.day === 'Today'

  // Build the plain-English action sentence
  const urgentNames = (critical ?? []).map(z => `${z.name} (${z.crop})`)
  const warnNames   = (actionRequired ?? []).map(z => z.name)

  let actionHeadline = ''
  let actionSub = ''
  if (!zones.length) {
    actionHeadline = 'No sensors on this farm yet.'
  } else if (rainToday) {
    actionHeadline = 'Rain today — skip all irrigation.'
    actionSub = 'Check again tomorrow morning.'
  } else if (critical.length) {
    actionHeadline = `Irrigate ${urgentNames.join(' and ')} now.`
    if (actionRequired.length)
      actionSub = `Also schedule ${warnNames.join(', ')} within 2 days.`
    else if (rainDay)
      actionSub = `${rainDay.day} shows ${rainDay.rain}% rain — irrigate before then.`
  } else if (actionRequired.length) {
    actionHeadline = `Schedule irrigation for ${warnNames.join(', ')}.`
    actionSub = 'All cherry and apple blocks are within safe range today.'
  } else {
    actionHeadline = 'All blocks healthy — no irrigation needed.'
    actionSub = 'Check back tomorrow.'
  }

  const isUrgent = critical.length > 0 && !rainToday

  return (
    <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '14px 14px 100px' }}>

      {/* ── Date ── */}
      <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', letterSpacing: 1.5,
        textTransform: 'uppercase', marginBottom: 10 }}>
        {new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
      </div>

      {/* ── Action card ── */}
      <div style={{
        background: isUrgent ? '#fff1f2' : rainToday ? '#eff6ff' : '#f0fdf4',
        border: `2px solid ${isUrgent ? '#fecdd3' : rainToday ? '#bfdbfe' : '#bbf7d0'}`,
        borderRadius: 16, padding: '16px', marginBottom: 12,
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', letterSpacing: 1.2,
          textTransform: 'uppercase', marginBottom: 8 }}>
          {isUrgent ? '🚨 Action Required' : rainToday ? '🌧️ Rain Today' : '✅ Today\'s Status'}
        </div>
        <div style={{
          fontSize: 18, fontWeight: 800, lineHeight: 1.4,
          color: isUrgent ? '#dc2626' : rainToday ? '#1d4ed8' : '#166534',
        }}>
          {actionHeadline}
        </div>
        {actionSub && (
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 6, lineHeight: 1.5 }}>
            {actionSub}
          </div>
        )}
      </div>

      {/* ── Mini map (only when there are blocks) ── */}
      {zones.length > 0 && (
        <div style={{ marginBottom: 12, borderRadius: 16, overflow: 'hidden',
          border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
          <div style={{ padding: '10px 14px 8px', background: 'white',
            borderBottom: '1px solid #f1f5f9', fontSize: 10, fontWeight: 800,
            color: '#94a3b8', letterSpacing: 1.2, textTransform: 'uppercase' }}>
            Field Overview
          </div>
          <MiniMap zones={zones} />
          {/* Legend */}
          <div style={{ padding: '8px 14px', background: 'white', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'Critical', color: '#f43f5e' },
              { label: 'Monitor', color: '#fbbf24' },
              { label: 'Healthy', color: '#10b981' },
            ].map(({ label, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Block list ── */}
      {zones.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8',
            letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 2 }}>
            All Blocks — Driest First
          </div>
          {(sorted ?? []).map(z => (
            <BlockRow
              key={z.id}
              zone={z}
              selected={selId === z.id}
              onSelect={setSelId}
            />
          ))}
        </div>
      )}

    </div>
  )
}
