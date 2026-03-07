// ─────────────────────────────────────────────
//  TodayScreen.jsx
//  Morning briefing, block dot strip,
//  expandable block detail.
// ─────────────────────────────────────────────

import { useState, useMemo } from 'https://esm.sh/react@18';
import { STATUS_CONFIG } from '../data/farms.js';

// ── Briefing sentence builder ──────────────────
function buildBriefing(zones, weather) {
  const crits = zones.filter(z => z.status === 'Critical');
  const warns  = zones.filter(z => z.status === 'Action Required');
  const rainDays = (weather?.forecast ?? []).filter(d => d.rain >= 50);
  const rainToday = rainDays[0]?.day === 'Today';

  let sentence = '';
  if (!zones.length) {
    sentence = 'No sensors on this farm yet.';
  } else if (rainToday) {
    sentence = 'Rain today — skip all irrigation.';
  } else if (crits.length && warns.length) {
    sentence = `Water ${crits.map(z => z.name).join(' & ')} today. Schedule ${warns.map(z => z.name).join(', ')} soon.`;
  } else if (crits.length) {
    sentence = `Water ${crits.map(z => z.name).join(' & ')} today.`;
  } else if (warns.length) {
    sentence = `Monitor ${warns.map(z => z.name).join(', ')} — water within 2 days.`;
  } else {
    sentence = 'All blocks healthy. No irrigation needed today.';
  }

  const rainNote = (!rainToday && rainDays[0])
    ? `${rainDays[0].day} shows ${rainDays[0].rain}% rain — consider holding off until after.`
    : null;

  return { sentence, rainNote, isCritical: crits.length > 0, isHealthy: !crits.length && !warns.length };
}

// ── Block dot ─────────────────────────────────
function BlockDot({ zone, selected, onSelect }) {
  const cfg  = STATUS_CONFIG[zone.status];
  const size = selected ? 44 : 38;
  return (
    <div className="dot-wrap" onClick={() => onSelect(selected ? null : zone.id)}>
      <div
        className="dot-circle"
        style={{
          width: size, height: size,
          background: cfg.bar,
          boxShadow: selected
            ? `0 0 0 3px ${cfg.bar}50, 0 2px 8px ${cfg.bar}60`
            : '0 1px 4px rgba(0,0,0,.12)',
        }}>
        {zone.id}
      </div>
      <div className="dot-pct" style={{ color: selected ? cfg.color : undefined }}>
        {zone.moisture}%
      </div>
    </div>
  );
}

// ── Block detail sheet ─────────────────────────
function BlockDetail({ zone }) {
  const cfg = STATUS_CONFIG[zone.status];
  const isCrit = zone.status === 'Critical';

  function handleAction() {
    const msgs = {
      'Critical':        `Irrigation reminder set for ${zone.name}.\nRecommended: 45 min at medium flow.`,
      'Action Required': `${zone.name} scheduled for tomorrow morning.`,
      'Optimal':         `${zone.name} is healthy — no action needed.`,
      'Too Wet':         `Checking drainage for ${zone.name}.`,
    };
    alert(msgs[zone.status]);
  }

  return (
    <div className="detail-sheet fadein">
      {/* Colour stripe */}
      <div style={{ height: 4, background: cfg.bar }} />

      {/* Header */}
      <div className="p-16" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--slate-800)', letterSpacing: '-.3px' }}>
            {zone.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--slate-400)', marginTop: 3 }}>
            {zone.crop} · {zone.depth}cm depth · Last read {zone.lastRead}
          </div>
        </div>
        <span
          className="status-badge"
          style={{ background: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.border}` }}>
          {cfg.label}
        </span>
      </div>

      {/* Moisture */}
      <div className="px-16" style={{ paddingBottom: 14 }}>
        <div className="detail-moisture-big" style={{ color: cfg.color }}>
          {zone.moisture}%
        </div>
        <div className="section-label" style={{ marginTop: 3, marginBottom: 10 }}>Soil Moisture</div>
        <div className="moisture-bar-bg">
          <div className="moisture-bar-fill" style={{ width: `${zone.moisture}%`, background: cfg.bar }} />
        </div>
      </div>

      {/* Metrics */}
      <div className="card-divider" />
      <div className="metric-grid">
        <div className="metric-cell">
          <div className="metric-label">Ground Temp</div>
          <div className="metric-value">{zone.temp}°C</div>
        </div>
        <div className="metric-cell">
          <div className="metric-label">Crop</div>
          <div className="metric-value">{zone.crop}</div>
        </div>
        <div className="metric-cell">
          <div className="metric-label">Sensor Depth</div>
          <div className="metric-value">{zone.depth}cm</div>
        </div>
      </div>

      {/* Action */}
      <div className="p-16">
        <button
          className="action-btn"
          onClick={handleAction}
          style={{
            background: isCrit ? cfg.bar : cfg.bg,
            color: isCrit ? 'white' : cfg.color,
            border: isCrit ? 'none' : `1.5px solid ${cfg.border}`,
            boxShadow: isCrit ? `0 2px 14px ${cfg.bar}50` : 'none',
          }}>
          {cfg.action}
        </button>
      </div>
    </div>
  );
}

// ── Today screen ─────────────────────────────
export function TodayScreen({ zones, weather, summary }) {
  const [selId, setSelId] = useState(null);

  const sorted   = useMemo(() => [...zones].sort((a, b) => a.moisture - b.moisture), [zones]);
  const selZone  = useMemo(() => zones.find(z => z.id === selId), [zones, selId]);
  const briefing = useMemo(() => buildBriefing(zones, weather), [zones, weather]);

  return (
    <div className="screen">
      <div style={{ padding: '14px 14px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── Briefing card ── */}
        <div className="card fadein">
          <div className="p-16">
            <div className="section-label" style={{ marginBottom: 8 }}>
              {new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <div className="briefing-text">
              {briefing.isCritical
                ? <span><span className="urgent">{briefing.sentence.split('.')[0]}.</span>
                    {briefing.sentence.includes('.') && briefing.sentence.split('.').slice(1).join('.')}</span>
                : briefing.isHealthy
                  ? <span className="ok">{briefing.sentence}</span>
                  : <span>{briefing.sentence}</span>
              }
            </div>
            {briefing.rainNote && (
              <div className="rain-note">
                <span style={{ fontSize: 16, flexShrink: 0 }}>🌧️</span>
                <span className="rain-note-text">{briefing.rainNote}</span>
              </div>
            )}
          </div>

          {/* Dot strip */}
          {sorted.length > 0 && (
            <>
              <div className="card-divider" />
              <div className="p-16">
                <div className="section-label" style={{ marginBottom: 12 }}>
                  All blocks — sorted driest first
                </div>
                <div className="dot-strip">
                  {sorted.map(z => (
                    <BlockDot
                      key={z.id}
                      zone={z}
                      selected={selId === z.id}
                      onSelect={setSelId}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Block detail ── */}
        {selZone && <BlockDetail zone={selZone} />}

        {/* ── Summary row ── */}
        {zones.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
            {[
              { label: 'Critical', value: summary.critical.length,       color: '#dc2626', bg: '#fff1f2' },
              { label: 'Monitor',  value: summary.actionRequired.length,  color: '#d97706', bg: '#fffbeb' },
              { label: 'Healthy',  value: summary.optimal.length,         color: '#166534', bg: '#f0fdf4' },
              { label: 'Avg',      value: `${summary.avgMoisture}%`,      color: '#1d4ed8', bg: '#eff6ff' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className="card" style={{ padding: '10px 0', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
