// ─────────────────────────────────────────────
//  WeatherScreen.jsx
//  Current conditions, 4 actionable signals,
//  GDD stage + spray timing, 7-day forecast.
// ─────────────────────────────────────────────

import { GDD_CONFIG } from '../data/farms.js';

// ── Skeleton placeholder ───────────────────────
function Skeleton({ h = 20, w = '100%', r = 6 }) {
  return <span className="skeleton" style={{ height: h, width: w, borderRadius: r }} />;
}

// ── Signal cell ───────────────────────────────
function Signal({ icon, label, value, sub, state = 'neutral' }) {
  return (
    <div className={`signal-cell ${state}`}>
      <div className="signal-icon">{icon}</div>
      <div className="signal-label">{label}</div>
      <div className="signal-value">{value}</div>
      <div className="signal-sub">{sub}</div>
    </div>
  );
}

// ── GDD stage panel ───────────────────────────
function GDDPanel({ gdd }) {
  if (!gdd) return null;

  const { cherryStage, appleStage, estimatedSeason, sevenDayCherry, sevenDayApple } = gdd;

  function StageCard({ crop, icon, stage, gdd7 }) {
    const { current, next, gddToNext } = stage;
    const progress = next
      ? Math.min(100, Math.round(((estimatedSeason - current.gdd) / (next.gdd - current.gdd)) * 100))
      : 100;

    return (
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--slate-100)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--slate-800)' }}>{crop}</div>
              <div style={{ fontSize: 10, color: 'var(--slate-400)' }}>~{estimatedSeason} GDD accumulated</div>
            </div>
          </div>
          <div
            className="stage-badge"
            style={{ background: 'var(--green-50)', color: 'var(--green-800)', border: '1px solid var(--green-100)' }}>
            📍 {current.label}
          </div>
        </div>

        {/* Progress to next stage */}
        {next && (
          <div style={{ padding: '10px 14px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--slate-500)' }}>
                → {next.label}
              </span>
              <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--green-800)' }}>
                ~{gddToNext} GDD to go
              </span>
            </div>
            <div className="gdd-progress-bg">
              <div className="gdd-progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Spray alert */}
        {current.spray && (
          <div style={{ padding: '0 14px 12px' }}>
            <div className="spray-alert">
              <span style={{ fontSize: 14, flexShrink: 0 }}>🌿</span>
              <span className="spray-alert-text">{current.spray}</span>
            </div>
          </div>
        )}

        <div style={{ padding: '8px 14px', background: 'var(--slate-50)', borderTop: '1px solid var(--slate-100)' }}>
          <span style={{ fontSize: 10, color: 'var(--slate-400)' }}>
            +{gdd7} GDD accumulated this week
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
        <span style={{ fontSize: 14 }}>🌱</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--slate-700)' }}>
          Crop Development & Spray Timing
        </span>
      </div>
      <StageCard crop="Cherry" icon="🍒" stage={cherryStage} gdd7={sevenDayCherry} />
      <StageCard crop="Apple"  icon="🍎" stage={appleStage}  gdd7={sevenDayApple}  />
      <div style={{ fontSize: 10, color: 'var(--slate-400)', lineHeight: 1.5, padding: '2px 2px' }}>
        GDD = Growing Degree Days. Accumulated heat units that predict development stages.
        Season estimate is approximated from day-of-year — connect a Jan 1 baseline for accuracy.
      </div>
    </div>
  );
}

// ── Main screen ────────────────────────────────
export function WeatherScreen({ weather, loading, error, refetch }) {

  if (error) return (
    <div className="screen">
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="card p-16" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🌐</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--slate-700)', marginBottom: 6 }}>
            Weather unavailable
          </div>
          <div style={{ fontSize: 12, color: 'var(--slate-400)', marginBottom: 14, lineHeight: 1.6 }}>
            Open-Meteo is blocked in this preview. Works fine when the file is opened directly in a browser or on GitHub Pages.
          </div>
          <button
            onClick={refetch}
            style={{
              padding: '8px 20px', borderRadius: 10, background: 'var(--green-50)',
              color: 'var(--green-800)', border: '1.5px solid var(--green-100)',
              fontSize: 12, fontWeight: 800, fontFamily: 'inherit',
            }}>
            ↺ Retry
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div className="screen">
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="card p-16">
          <Skeleton h={14} w={140} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '14px 0' }}>
            <Skeleton h={40} w={40} r="50%" />
            <Skeleton h={38} w={80} />
            <div style={{ flex: 1 }}><Skeleton h={11} /><Skeleton h={11} style={{ marginTop: 6 }} /></div>
          </div>
          <div className="signals-grid">
            {[0,1,2,3].map(i => <div key={i} className="signal-cell"><Skeleton h={80} /></div>)}
          </div>
        </div>
      </div>
    </div>
  );

  const { current, forecast, signals, gdd } = weather;
  const { tonightLow, rain3, et3, netBalance, humidityMax, heatToday } = signals;

  const frostAlert  = tonightLow <= 0;
  const frostWarn   = tonightLow <= 2 && !frostAlert;
  const heatStress  = heatToday >= 30;
  const diseaseRisk = humidityMax >= 85 && current.temp >= 15;

  return (
    <div className="screen">
      <div style={{ padding: '14px 14px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── Current conditions ── */}
        <div className="card fadein">
          <div style={{ padding: '8px 14px 6px', background: 'var(--slate-50)', borderBottom: '1px solid var(--slate-100)' }}>
            <span className="section-label">Summerland BC · Live · Open-Meteo</span>
          </div>
          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 40, lineHeight: 1 }}>{current.e}</span>
            <div>
              <span style={{ fontSize: 36, fontWeight: 800, color: 'var(--slate-800)', letterSpacing: '-1.5px', lineHeight: 1 }}>
                {current.temp}°C
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--slate-400)', lineHeight: 1.8, marginLeft: 4 }}>
              <div>Feels {current.feelsLike}°C · {current.l}</div>
              <div>{current.humidity}% humidity</div>
              <div>{current.wind} km/h wind</div>
            </div>
          </div>

          {/* 4 signals */}
          <div className="signals-grid">
            <Signal
              icon={frostAlert ? '🚨' : frostWarn ? '🌡️' : '🌙'}
              label="Tonight's Low"
              value={`${tonightLow}°C`}
              sub={frostAlert ? 'FROST — protect blossoms now' : frostWarn ? 'Near-frost — monitor overnight' : 'No frost risk'}
              state={frostAlert ? 'alert' : frostWarn ? 'warn' : 'ok'}
            />
            <Signal
              icon={netBalance < -3 ? '💦' : netBalance < 0 ? '🌿' : '🌧️'}
              label="3-Day Water Balance"
              value={`${netBalance > 0 ? '+' : ''}${netBalance}mm`}
              sub={`${rain3}mm rain − ${et3}mm evaporation${netBalance < -3 ? ' · Soil drying fast' : netBalance < 0 ? ' · Slight deficit' : ' · Rain covering losses'}`}
              state={netBalance < -3 ? 'alert' : netBalance < 0 ? 'warn' : 'ok'}
            />
            <Signal
              icon={heatStress ? '🔥' : '☀️'}
              label="Heat Today"
              value={`${heatToday}°C`}
              sub={heatStress ? 'Above 30°C — moisture depletes faster' : heatToday >= 25 ? 'Warm — check critical blocks afternoon' : 'Moderate — normal depletion rate'}
              state={heatStress ? 'warn' : 'neutral'}
            />
            <Signal
              icon={diseaseRisk ? '⚠️' : '🍃'}
              label="Disease Pressure"
              value={`${humidityMax}% RH`}
              sub={diseaseRisk ? 'High humidity + warm — brown rot / scab risk elevated' : 'Humidity within safe range'}
              state={diseaseRisk ? 'warn' : 'ok'}
            />
          </div>

          {/* ET bar */}
          <div style={{ padding: '10px 14px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span className="section-label">Evapotranspiration · 3-day loss</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#d97706' }}>{et3}mm</span>
            </div>
            <div className="et-bar-bg">
              <div className="et-bar-fill" style={{ width: `${Math.min(100, (et3 / 12) * 100)}%` }} />
            </div>
            <div style={{ fontSize: 10, color: 'var(--slate-400)', marginTop: 5 }}>
              Higher in heat &amp; wind · directly drives how fast your blocks dry out
            </div>
          </div>
        </div>

        {/* ── 7-day forecast ── */}
        <div className="card fadein">
          <div style={{ padding: '8px 14px 6px', background: 'var(--slate-50)', borderBottom: '1px solid var(--slate-100)' }}>
            <span className="section-label">7-Day Forecast</span>
          </div>
          <div className="forecast-row">
            {forecast.map((d, i) => {
              const rain  = d.rain >= 50;
              const frost = d.low <= 2;
              return (
                <div key={i} className={`forecast-cell${rain ? ' rain-day' : frost ? ' frost-day' : ''}`}>
                  <div className={`fc-day${rain ? ' rain' : frost ? ' frost' : ''}`}>{d.day}</div>
                  <div className="fc-emoji">{d.e}</div>
                  <div className="fc-high">{d.high}°</div>
                  <div className={`fc-low${frost ? ' frost' : ''}`}>{d.low}°</div>
                  {rain  && <span className="fc-tag" style={{ background: '#dbeafe', color: '#1d4ed8' }}>{d.rain}%</span>}
                  {frost && !rain && <span className="fc-tag" style={{ background: '#ede9fe', color: '#7c3aed' }}>❄</span>}
                  {d.et > 0 && <span style={{ fontSize: 7.5, color: 'var(--slate-400)' }}>{d.et}mm</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── GDD + spray timing ── */}
        <GDDPanel gdd={gdd} />

      </div>
    </div>
  );
}
