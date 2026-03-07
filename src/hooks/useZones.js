// ─────────────────────────────────────────────
//  useZones.js
//  Manages zone moisture state.
//  Simulates sensor drift until real sensors
//  are wired in via the Google Sheets pipeline.
// ─────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'https://esm.sh/react@18';
import { FARMS } from '../data/farms.js';

function deriveStatus(moisture) {
  if (moisture >= 80) return 'Too Wet';
  if (moisture >= 55) return 'Optimal';
  if (moisture >= 35) return 'Action Required';
  return 'Critical';
}

// TODO: replace simulation with real sensor fetch
// Pipeline: Raspberry Pi → Google Sheets → fetch below
// async function fetchSensorData(sheetId) {
//   const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A:F?key=${API_KEY}`;
//   const res = await fetch(url);
//   const { values } = await res.json();
//   return values.map(row => ({ id: row[0], moisture: parseFloat(row[1]), temp: parseFloat(row[2]), ts: row[3] }));
// }

export function useZones(farmId) {
  const [zones, setZones] = useState(() =>
    FARMS[farmId].zones.map(z => ({ ...z }))
  );

  // Reset when farm changes
  useEffect(() => {
    setZones(FARMS[farmId].zones.map(z => ({ ...z })));
  }, [farmId]);

  // Simulate gradual sensor drift (15s intervals)
  // Remove this block once real sensors are connected
  useEffect(() => {
    if (!FARMS[farmId].zones.length) return;
    const interval = setInterval(() => {
      setZones(prev => prev.map(z => {
        if (Math.random() > 0.82) {
          const m = Math.max(10, Math.min(92, z.moisture + Math.round((Math.random() - 0.52) * 2)));
          return { ...z, moisture: m, status: deriveStatus(m) };
        }
        return z;
      }));
    }, 15000);
    return () => clearInterval(interval);
  }, [farmId]);

  const refreshZones = useCallback(() => {
    setZones(prev => prev.map(z => {
      if (Math.random() > 0.4) {
        const m = Math.max(10, Math.min(92, z.moisture + Math.round((Math.random() - 0.52) * 3)));
        return { ...z, moisture: m, status: deriveStatus(m) };
      }
      return z;
    }));
  }, []);

  const critical       = zones.filter(z => z.status === 'Critical');
  const actionRequired = zones.filter(z => z.status === 'Action Required');
  const optimal        = zones.filter(z => z.status === 'Optimal');
  const tooWet         = zones.filter(z => z.status === 'Too Wet');
  const avgMoisture    = zones.length
    ? Math.round(zones.reduce((s, z) => s + z.moisture, 0) / zones.length)
    : null;

  return {
    zones,
    refreshZones,
    summary: { critical, actionRequired, optimal, tooWet, avgMoisture },
  };
}
