import { useState, useEffect, useCallback } from 'react'
import { FARMS } from '../data/farms.js'

function deriveStatus(m) {
  if (m >= 80) return 'Too Wet'
  if (m >= 55) return 'Optimal'
  if (m >= 35) return 'Action Required'
  return 'Critical'
}

export function useZones(farmId) {
  const safeZones = () => (FARMS[farmId]?.zones ?? []).map(z => ({ ...z }))
  const [zones, setZones] = useState(safeZones)

  useEffect(() => { setZones(safeZones()) }, [farmId])

  useEffect(() => {
    if (!FARMS[farmId]?.zones?.length) return
    const id = setInterval(() => {
      setZones(prev => (prev ?? []).map(z => {
        if (Math.random() > 0.82) {
          const m = Math.max(10, Math.min(92, z.moisture + Math.round((Math.random() - 0.52) * 2)))
          return { ...z, moisture: m, status: deriveStatus(m) }
        }
        return z
      }))
    }, 15000)
    return () => clearInterval(id)
  }, [farmId])

  const refresh = useCallback(() => {
    setZones(prev => (prev ?? []).map(z => {
      const m = Math.max(10, Math.min(92, z.moisture + Math.round((Math.random() - 0.52) * 3)))
      return { ...z, moisture: m, status: deriveStatus(m) }
    }))
  }, [])

  const zones_safe = zones ?? []
  const critical       = zones_safe.filter(z => z.status === 'Critical')
  const actionRequired = zones_safe.filter(z => z.status === 'Action Required')
  const optimal        = zones_safe.filter(z => z.status === 'Optimal')
  const avgMoisture    = zones_safe.length
    ? Math.round(zones_safe.reduce((s, z) => s + z.moisture, 0) / zones_safe.length)
    : null

  return { zones: zones_safe, refresh, summary: { critical, actionRequired, optimal, avgMoisture } }
}
