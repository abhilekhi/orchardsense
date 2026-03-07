import { useState } from 'react'
import { FARMS } from './data/farms.js'
import { useWeather } from './hooks/useWeather.js'
import { useZones }   from './hooks/useZones.js'
import FarmMap        from './components/FarmMap.jsx'
import TodayScreen    from './components/TodayScreen.jsx'
import WeatherScreen  from './components/WeatherScreen.jsx'

export default function App() {
  const [tab,    setTab]    = useState('today')
  const [farmId, setFarmId] = useState(0)
  const [syncing,setSyncing]= useState(false)

  const { weather, loading: wLoad, error: wErr, refetch } = useWeather()
  const { zones, refresh, summary } = useZones(farmId)

  console.log('RENDER', { tab, farmId, zonesLen: zones?.length, weather: !!weather, summary })

  async function handleSync() {
    setSyncing(true)
    refresh()
    await refetch()
    setSyncing(false)
  }

  const critCount = (summary?.critical ?? []).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh',
      overflow: 'hidden', background: '#f0f2f0' }}>

      <header style={{
        height: 56, background: 'white', borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', flexShrink: 0, zIndex: 30,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9, background: '#166534',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, flexShrink: 0,
          }}>🌱</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>Lekhi Farm</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#10b981', letterSpacing: .5 }}>Monitoring</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, overflow: 'hidden', flex: 1, margin: '0 10px', justifyContent: 'center' }}>
          {(FARMS ?? []).map((farm, i) => (
            <button key={farm.id} onClick={() => setFarmId(i)} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '5px 10px', borderRadius: 30,
              border: `1.5px solid ${farmId === i ? '#166534' : '#e2e8f0'}`,
              background: farmId === i ? '#166534' : 'white',
              color: farmId === i ? 'white' : '#64748b',
              fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer',
              flexShrink: 0, WebkitTapHighlightColor: 'transparent',
            }}>
              <span>{farm.icon}</span>
              <span>{farm.name}</span>
              {farmId === i && critCount > 0 && (
                <span style={{ background: '#dc2626', color: 'white', borderRadius: 10,
                  fontSize: 9, fontWeight: 800, padding: '1px 5px' }}>{critCount}</span>
              )}
            </button>
          ))}
        </div>

        <button onClick={handleSync} style={{
          width: 34, height: 34, borderRadius: 10, background: '#f8fafc',
          border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24"
            fill="none" stroke="#166534" strokeWidth="2.3" strokeLinecap="round">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
        </button>
      </header>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: tab === 'map' ? 'flex' : 'none', flex: 1, flexDirection: 'column' }}>
          <FarmMap zones={zones ?? []} farmId={farmId} />
        </div>
        {tab === 'today' && (
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', overflow: 'hidden' }}>
            <TodayScreen zones={zones ?? []} weather={weather} />
          </div>
        )}
        {tab === 'weather' && (
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', overflow: 'hidden' }}>
            <WeatherScreen weather={weather} loading={wLoad} error={wErr} refetch={refetch} />
          </div>
        )}
      </div>

      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: `calc(68px + env(safe-area-inset-bottom, 0px))`,
        background: 'white', borderTop: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'flex-start', paddingTop: 8,
        zIndex: 40,
      }}>
        {[
          { id: 'map',     emoji: '🗺️', label: 'Map'     },
          { id: 'today',   emoji: '🌱',  label: 'Today'   },
          { id: 'weather', emoji: '🌤️', label: 'Weather' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 3, padding: '6px 4px', cursor: 'pointer', background: 'none',
            border: 'none', WebkitTapHighlightColor: 'transparent',
          }}>
            <div style={{ fontSize: 22, lineHeight: 1, position: 'relative' }}>
              {t.emoji}
              {t.id === 'today' && critCount > 0 && (
                <span style={{
                  position: 'absolute', top: -3, right: -6,
                  width: 14, height: 14, background: '#dc2626', color: 'white',
                  borderRadius: '50%', fontSize: 8, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid white',
                }}>{critCount}</span>
              )}
            </div>
            <span style={{
              fontSize: 9.5, fontWeight: 700, letterSpacing: .3,
              color: tab === t.id ? '#166534' : '#94a3b8',
            }}>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
