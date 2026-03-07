import { useState, useEffect, useCallback } from 'react'
import { WEATHER_COORDS } from '../data/farms.js'

function wmoIcon(code) {
  if (code === 0)  return { e: '☀️', l: 'Clear' }
  if (code <= 2)   return { e: '⛅', l: 'Partly Cloudy' }
  if (code === 3)  return { e: '☁️', l: 'Overcast' }
  if (code <= 49)  return { e: '🌫️', l: 'Fog' }
  if (code <= 59)  return { e: '🌦️', l: 'Drizzle' }
  if (code <= 69)  return { e: '🌧️', l: 'Rain' }
  if (code <= 79)  return { e: '🌨️', l: 'Snow' }
  if (code <= 82)  return { e: '🌧️', l: 'Showers' }
  if (code <= 86)  return { e: '🌨️', l: 'Snow showers' }
  return { e: '⛈️', l: 'Thunderstorm' }
}

async function fetchWeatherData() {
  const { lat, lng } = WEATHER_COORDS
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,wind_speed_10m,relative_humidity_2m,weather_code,apparent_temperature,precipitation` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,` +
    `wind_speed_10m_max,weather_code,et0_fao_evapotranspiration,` +
    `precipitation_sum,relative_humidity_2m_max,relative_humidity_2m_min` +
    `&hourly=temperature_2m` +
    `&timezone=America%2FVancouver&forecast_days=7`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`)
  return res.json()
}

function parseWeather(raw) {
  const c  = raw.current
  const dy = raw.daily
  const hr = raw.hourly

  const dayLabel = (t, i) =>
    i === 0 ? 'Today' : new Date(t + 'T12:00').toLocaleDateString('en', { weekday: 'short' })

  const tonightLow = Math.round(Math.min(...hr.temperature_2m.slice(0, 18).filter(v => v != null)))
  const rain3 = dy.precipitation_sum.slice(0, 3).reduce((a, v) => a + (v ?? 0), 0)
  const et3   = dy.et0_fao_evapotranspiration.slice(0, 3).reduce((a, v) => a + (v ?? 0), 0)

  return {
    current: {
      temp:      Math.round(c.temperature_2m),
      feelsLike: Math.round(c.apparent_temperature),
      wind:      Math.round(c.wind_speed_10m),
      humidity:  Math.round(c.relative_humidity_2m),
      ...wmoIcon(c.weather_code),
    },
    forecast: dy.time.map((t, i) => ({
      day:    dayLabel(t, i),
      high:   Math.round(dy.temperature_2m_max[i]),
      low:    Math.round(dy.temperature_2m_min[i]),
      rain:   dy.precipitation_probability_max[i],
      rainMm: Math.round((dy.precipitation_sum[i] ?? 0) * 10) / 10,
      et:     Math.round((dy.et0_fao_evapotranspiration[i] ?? 0) * 10) / 10,
      humMax: Math.round(dy.relative_humidity_2m_max?.[i] ?? 0),
      ...wmoIcon(dy.weather_code[i]),
    })),
    signals: {
      tonightLow,
      rain3:      Math.round(rain3 * 10) / 10,
      et3:        Math.round(et3  * 10) / 10,
      netBalance: Math.round((rain3 - et3) * 10) / 10,
      humidityMax: Math.round(dy.relative_humidity_2m_max?.[0] ?? 0),
      heatToday:  Math.round(dy.temperature_2m_max[0]),
    },
  }
}

export function useWeather() {
  const [weather,     setWeather]     = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [lastFetched, setLastFetched] = useState(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const raw = await fetchWeatherData()
      setWeather(parseWeather(raw))
      setLastFetched(new Date())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
    const id = setInterval(refetch, 30 * 60 * 1000)
    return () => clearInterval(id)
  }, [refetch])

  return { weather, loading, error, refetch, lastFetched }
}
