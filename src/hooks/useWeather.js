// ─────────────────────────────────────────────
//  useWeather.js
//  Fetches Open-Meteo for Summerland BC.
//  Parses: current conditions, 7-day forecast,
//  frost signals, ET balance, GDD accumulation.
//  Hook for NDVI integration left as a stub.
// ─────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { WEATHER_COORDS, GDD_CONFIG } from '../data/farms.js';

// ── WMO weather code → emoji + label ──────────
function wmoIcon(code) {
  if (code === 0)  return { e: '☀️',  l: 'Clear' };
  if (code <= 2)   return { e: '⛅',  l: 'Partly Cloudy' };
  if (code === 3)  return { e: '☁️',  l: 'Overcast' };
  if (code <= 49)  return { e: '🌫️', l: 'Fog' };
  if (code <= 59)  return { e: '🌦️', l: 'Drizzle' };
  if (code <= 69)  return { e: '🌧️', l: 'Rain' };
  if (code <= 79)  return { e: '🌨️', l: 'Snow' };
  if (code <= 82)  return { e: '🌧️', l: 'Showers' };
  if (code <= 86)  return { e: '🌨️', l: 'Snow showers' };
  return { e: '⛈️', l: 'Thunderstorm' };
}

// ── GDD helpers ───────────────────────────────
// Accumulate GDD from daily min/max, base temp
function calcGDDSeries(maxTemps, minTemps, base) {
  return maxTemps.map((mx, i) => Math.max(0, ((mx + minTemps[i]) / 2) - base));
}

function accumulateGDD(series) {
  let acc = 0;
  return series.map(d => { acc += d; return acc; });
}

// Find the current phenological stage for a crop
function getCurrentStage(totalGDD, crop) {
  const stages = GDD_CONFIG[crop]?.stages ?? [];
  let current = stages[0];
  for (const s of stages) {
    if (totalGDD >= s.gdd) current = s;
    else break;
  }
  const nextIdx = stages.indexOf(current) + 1;
  const next = stages[nextIdx] ?? null;
  return { current, next, gddToNext: next ? next.gdd - totalGDD : null };
}

// ── Main fetch ────────────────────────────────
async function fetchWeatherData() {
  const { lat, lng } = WEATHER_COORDS;
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,wind_speed_10m,relative_humidity_2m,weather_code,apparent_temperature,precipitation` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,` +
    `wind_speed_10m_max,weather_code,et0_fao_evapotranspiration,` +
    `precipitation_sum,relative_humidity_2m_max,relative_humidity_2m_min` +
    `&hourly=temperature_2m` +
    `&timezone=America%2FVancouver&forecast_days=7`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  return res.json();
}

function parseWeather(raw) {
  const c  = raw.current;
  const dy = raw.daily;
  const hr = raw.hourly;

  const dayLabel = (t, i) =>
    i === 0 ? 'Today' : new Date(t + 'T12:00').toLocaleDateString('en', { weekday: 'short' });

  // Tonight's low: scan next 18 hourly values
  const tonightLow = Math.round(
    Math.min(...hr.temperature_2m.slice(0, 18).filter(v => v != null))
  );

  // 3-day water balance: rain in minus evaporation out
  const rain3 = dy.precipitation_sum.slice(0, 3).reduce((a, v) => a + (v ?? 0), 0);
  const et3   = dy.et0_fao_evapotranspiration.slice(0, 3).reduce((a, v) => a + (v ?? 0), 0);

  // GDD accumulation over the 7-day window (cherry base 5°C, apple base 5°C)
  // In production this would be cumulative from Jan 1 / bud break
  // For now we show 7-day accumulated + annualised estimate note
  const cherryGDDs = calcGDDSeries(dy.temperature_2m_max, dy.temperature_2m_min, GDD_CONFIG.cherry.base);
  const appleGDDs  = calcGDDSeries(dy.temperature_2m_max, dy.temperature_2m_min, GDD_CONFIG.apple.base);
  const gdd7Cherry = Math.round(cherryGDDs.reduce((a, v) => a + v, 0) * 10) / 10;
  const gdd7Apple  = Math.round(appleGDDs.reduce((a, v) => a + v, 0) * 10) / 10;

  // Estimate season-to-date GDD using day-of-year × average daily GDD
  // (rough — replace with actual Jan 1 historical data when available)
  const doy = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 1)) / 86400000);
  const avgDailyGDD = gdd7Cherry / 7;
  const estimatedSeasonGDD = Math.round(doy * avgDailyGDD);

  const cherryStage = getCurrentStage(estimatedSeasonGDD, 'cherry');
  const appleStage  = getCurrentStage(estimatedSeasonGDD, 'apple');

  return {
    current: {
      temp:      Math.round(c.temperature_2m),
      feelsLike: Math.round(c.apparent_temperature),
      wind:      Math.round(c.wind_speed_10m),
      humidity:  Math.round(c.relative_humidity_2m),
      precip:    c.precipitation ?? 0,
      ...wmoIcon(c.weather_code),
    },
    forecast: dy.time.map((t, i) => ({
      day:    dayLabel(t, i),
      high:   Math.round(dy.temperature_2m_max[i]),
      low:    Math.round(dy.temperature_2m_min[i]),
      rain:   dy.precipitation_probability_max[i],
      rainMm: Math.round((dy.precipitation_sum[i] ?? 0) * 10) / 10,
      wind:   Math.round(dy.wind_speed_10m_max[i]),
      et:     Math.round((dy.et0_fao_evapotranspiration[i] ?? 0) * 10) / 10,
      humMax: Math.round(dy.relative_humidity_2m_max?.[i] ?? 0),
      ...wmoIcon(dy.weather_code[i]),
    })),
    signals: {
      tonightLow,
      rain3:    Math.round(rain3 * 10) / 10,
      et3:      Math.round(et3  * 10) / 10,
      netBalance: Math.round((rain3 - et3) * 10) / 10,
      humidityMax: Math.round(dy.relative_humidity_2m_max?.[0] ?? 0),
      heatToday: Math.round(dy.temperature_2m_max[0]),
    },
    gdd: {
      sevenDayCherry: gdd7Cherry,
      sevenDayApple:  gdd7Apple,
      estimatedSeason: estimatedSeasonGDD,
      cherryStage,
      appleStage,
    },
  };
}

// ── Hook ──────────────────────────────────────
export function useWeather() {
  const [weather, setWeather]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error,   setError]       = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await fetchWeatherData();
      setWeather(parseWeather(raw));
      setLastFetched(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount, refresh every 30 minutes
  useEffect(() => {
    fetch_();
    const interval = setInterval(fetch_, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetch_]);

  return { weather, loading, error, refetch: fetch_, lastFetched };
}

// ── NDVI stub ─────────────────────────────────
// TODO: integrate Sentinel-2 NDVI via Microsoft Planetary Computer STAC API
// Endpoint: https://planetarycomputer.microsoft.com/api/stac/v1/search
// Query: collection=sentinel-2-l2a, bbox from zone polygon bounds, cloud cover < 20%
// Compute: (B08 - B04) / (B08 + B04) averaged over polygon pixels
// Return: ndvi score 0–1 per zone, date of last clear image
export async function fetchNDVI(_zonePolygons) {
  // Not yet implemented
  return null;
}
