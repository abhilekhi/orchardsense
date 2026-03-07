// ─────────────────────────────────────────────
//  App.jsx  –  root component
//  Bottom tab nav: Map / Today / Weather
//  Farm pill selector in header
// ─────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { FARMS } from './data/farms.js';
import { useWeather } from './hooks/useWeather.js';
import { useZones }  from './hooks/useZones.js';
import { FarmMap }       from './components/FarmMap.js';
import { TodayScreen }   from './components/TodayScreen.js';
import { WeatherScreen } from './components/WeatherScreen.js';

// ── Logo ──────────────────────────────────────
function Logo() {
  return (
    <svg width="30" height="30" viewBox="0 0 64 64" style={{ flexShrink: 0 }}>
      <rect width="64" height="64" rx="14" fill="#166534"/>
      <path d="M32 52C32 52 16 42 16 28C16 20.27 23.16 14 32 14C40.84 14 48 20.27 48 28C48 42 32 52 32 52Z" fill="#86efac"/>
      <path d="M32 52L32 22" stroke="#166534" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M32 38C30 34 26 30 22 27" stroke="#166534" strokeWidth="2" strokeLinecap="round" opacity=".7"/>
      <path d="M32 30C34 26 38 23 41 21" stroke="#166534" strokeWidth="2" strokeLinecap="round" opacity=".7"/>
    </svg>
  );
}

// ── Sync button ───────────────────────────────
function SyncBtn({ syncing, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 34, height: 34, borderRadius: 10,
        background: 'var(--slate-50)', border: '1.5px solid var(--slate-200)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
      <svg
        className={syncing ? 'spin' : ''}
        width="15" height="15" viewBox="0 0 24 24"
        fill="none" stroke="#166534" strokeWidth="2.3" strokeLinecap="round">
        <polyline points="23 4 23 10 17 10"/>
        <polyline points="1 20 1 14 7 14"/>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
      </svg>
    </button>
  );
}

// ── Tab bar ───────────────────────────────────
const TABS = [
  { id: 'map',     label: 'Map',     emoji: '🗺️' },
  { id: 'today',   label: 'Today',   emoji: '🌱' },
  { id: 'weather', label: 'Weather', emoji: '🌤️' },
];

function TabBar({ active, onSelect, criticalCount }) {
  return (
    <div className="tab-bar">
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`tab-item${active === tab.id ? ' active' : ''}`}
          onClick={() => onSelect(tab.id)}>
          <div className="tab-icon">
            {tab.emoji}
            {tab.id === 'today' && criticalCount > 0 && (
              <span className="tab-badge">{criticalCount}</span>
            )}
          </div>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── Farm pill badge helper ─────────────────────
function farmBadge(farm) {
  if (!farm.zones.length) return null;
  const crits = farm.zones.filter(z => z.status === 'Critical').length;
  const warns  = farm.zones.filter(z => z.status === 'Action Required').length;
  if (crits) return crits;
  if (warns) return `${warns}⚠`;
  return null;
}

// ── Root app ──────────────────────────────────
export default function App() {
  const [tab, setTab]     = useState('today');
  const [farmId, setFarmId] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [time, setTime]   = useState(new Date());

  const { weather, loading: wLoading, error: wError, refetch, lastFetched } = useWeather();
  const { zones, refreshZones, summary } = useZones(farmId);

  // Clock tick
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  async function handleSync() {
    setSyncing(true);
    refreshZones();
    await refetch();
    setSyncing(false);
  }

  const critCount = summary.critical.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo />
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--slate-800)', letterSpacing: '-.2px', lineHeight: 1.2 }}>
              Lekhi Farm
            </div>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: '#10b981', letterSpacing: '.5px' }}>
              Monitoring
            </div>
          </div>
        </div>

        {/* Farm pills */}
        <div className="farm-pills" style={{ flex: 1, margin: '0 12px', justifyContent: 'center' }}>
          {FARMS.map((farm, i) => {
            const badge = farmBadge(farm);
            return (
              <button
                key={farm.id}
                className={`farm-pill${farmId === i ? ' active' : ''}`}
                onClick={() => setFarmId(i)}>
                <span>{farm.icon}</span>
                <span>{farm.name}</span>
                {badge && farmId === i && (
                  <span className="farm-pill-badge">{badge}</span>
                )}
              </button>
            );
          })}
        </div>

        <SyncBtn syncing={syncing} onClick={handleSync} />
      </header>

      {/* ── Screen content ── */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>

        {/* Map is always mounted to preserve map state, show/hide with CSS */}
        <div style={{ display: tab === 'map' ? 'flex' : 'none', flexDirection: 'column', height: '100%' }}>
          <FarmMap
            zones={zones}
            farmId={farmId}
            onZoneSelect={() => {}}
          />
        </div>

        {tab === 'today' && (
          <TodayScreen
            zones={zones}
            weather={weather}
            summary={summary}
          />
        )}

        {tab === 'weather' && (
          <WeatherScreen
            weather={weather}
            loading={wLoading}
            error={wError}
            refetch={refetch}
          />
        )}
      </div>

      {/* ── Bottom tab bar ── */}
      <TabBar active={tab} onSelect={setTab} criticalCount={critCount} />

    </div>
  );
}
