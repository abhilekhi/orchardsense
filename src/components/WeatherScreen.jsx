export default function WeatherScreen({ weather, loading, error, refetch }) {

  if (error) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🌐</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Weather unavailable</div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16, lineHeight: 1.6 }}>
          Works on GitHub Pages — blocked in some preview environments.
        </div>
        <button onClick={refetch} style={{
          padding: '9px 22px', borderRadius: 10, background: '#f0fdf4',
          color: '#166534', border: '1.5px solid #bbf7d0',
          fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}>↺ Retry</button>
      </div>
    </div>
  )

  if (loading || !weather) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#94a3b8' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🌤️</div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Loading weather…</div>
      </div>
    </div>
  )

  const { current, forecast, signals } = weather
  if (!current || !forecast || !signals) return null
  const { tonightLow, rain3, et3, netBalance, humidityMax, heatToday } = signals
  const frostAlert = tonightLow <= 0
  const frostWarn  = tonightLow <= 2 && !frostAlert
  const heatStress = heatToday >= 30
  const diseaseRisk = humidityMax >= 85 && current.temp >= 15

  const signalData = [
    {
      icon: frostAlert ? '🚨' : frostWarn ? '🌡️' : '🌙',
      label: "Tonight's Low",
      value: `${tonightLow}°C`,
      sub: frostAlert ? 'FROST — protect blossoms' : frostWarn ? 'Near-frost tonight' : 'No frost risk',
      state: frostAlert ? 'alert' : frostWarn ? 'warn' : 'ok',
    },
    {
      icon: netBalance < -3 ? '💦' : netBalance < 0 ? '🌿' : '🌧️',
      label: '3-Day Water Balance',
      value: `${netBalance > 0 ? '+' : ''}${netBalance}mm`,
      sub: `${rain3}mm rain − ${et3}mm ET`,
      state: netBalance < -3 ? 'alert' : netBalance < 0 ? 'warn' : 'ok',
    },
    {
      icon: heatStress ? '🔥' : '☀️',
      label: 'Heat Today',
      value: `${heatToday}°C`,
      sub: heatStress ? 'Moisture depletes faster' : 'Normal depletion',
      state: heatStress ? 'warn' : 'ok',
    },
    {
      icon: diseaseRisk ? '⚠️' : '🍃',
      label: 'Disease Pressure',
      value: `${humidityMax}% RH`,
      sub: diseaseRisk ? 'Brown rot / scab risk' : 'Within safe range',
      state: diseaseRisk ? 'warn' : 'ok',
    },
  ]

  const stateColors = {
    alert: { bg: '#fff1f2', val: '#dc2626' },
    warn:  { bg: '#fffdf5', val: '#d97706' },
    ok:    { bg: '#f0fdf4', val: '#166534' },
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '14px 14px 100px' }}>

      {/* Current */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16,
        marginBottom: 12, overflow: 'hidden' }}>
        <div style={{ padding: '8px 14px', background: '#f8fafc',
          borderBottom: '1px solid #f1f5f9', fontSize: 10, fontWeight: 800,
          color: '#94a3b8', letterSpacing: 1.2, textTransform: 'uppercase' }}>
          Summerland BC · Live
        </div>
        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 44, lineHeight: 1 }}>{current.e}</span>
          <div>
            <div style={{ fontSize: 40, fontWeight: 800, color: '#1e293b', letterSpacing: -1.5, lineHeight: 1 }}>
              {current.temp}°C
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3, lineHeight: 1.7 }}>
              Feels {current.feelsLike}°C · {current.humidity}% humidity · {current.wind} km/h
            </div>
          </div>
        </div>
        {/* Signal grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#f1f5f9' }}>
          {signalData.map(({ icon, label, value, sub, state }) => (
            <div key={label} style={{ background: stateColors[state].bg, padding: '12px 14px' }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: stateColors[state].val, letterSpacing: -.3 }}>{value}</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 3, lineHeight: 1.4 }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 7-day forecast */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '8px 14px', background: '#f8fafc',
          borderBottom: '1px solid #f1f5f9', fontSize: 10, fontWeight: 800,
          color: '#94a3b8', letterSpacing: 1.2, textTransform: 'uppercase' }}>
          7-Day Forecast
        </div>
        <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {forecast.map((d, i) => {
            const rain  = d.rain >= 50
            const frost = d.low <= 2
            return (
              <div key={i} style={{
                flex: '0 0 64px', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 3, padding: '12px 4px',
                borderRight: '1px solid #f1f5f9',
                background: rain ? '#f0f7ff' : frost ? '#f5f3ff' : 'white',
              }}>
                <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1,
                  color: rain ? '#1d4ed8' : frost ? '#7c3aed' : '#94a3b8' }}>{d.day}</div>
                <div style={{ fontSize: 20 }}>{d.e}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>{d.high}°</div>
                <div style={{ fontSize: 11, color: frost ? '#7c3aed' : '#94a3b8', fontWeight: frost ? 700 : 400 }}>{d.low}°</div>
                {rain && <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 6, background: '#dbeafe', color: '#1d4ed8' }}>{d.rain}%</span>}
                {frost && !rain && <span style={{ fontSize: 9 }}>❄️</span>}
                {d.et > 0 && <span style={{ fontSize: 8, color: '#94a3b8' }}>{d.et}mm</span>}
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
