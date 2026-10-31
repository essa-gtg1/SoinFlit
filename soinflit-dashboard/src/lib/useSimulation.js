import { useEffect, useRef, useState } from 'react'

// Everything in here is SIMULATED. Starting values are plausible for an arid
// interior-Oman field at 23° N, 57° E, but no live NASA granules or ESP32
// sensors are connected. Swap `tick` for real fetches to go live.

export const TANK_CAPACITY_L = 2400
export const FIELD = { lat: 23.0, lon: 57.0, region: 'Oman' }
export const TICK_MS = 1200

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
const jitter = (v, amount) => v + (Math.random() - 0.5) * amount
const approach = (v, target, rate) => v + (target - v) * rate

const initial = {
  battery: 86.4,
  solarW: 4.7,
  loadW: 0.9,
  level: 0.58,
  ntu: 34.2,
  yieldLph: 0,
  floodInflowLpm: 0,
  soil: { a: 12.6, b: 13.9, sub: 16.8 },
  ec: { a: 3.4, b: 3.1, sub: 2.6 },
  soilTemp: 31.4,
  nodesOnline: 6,
  nodesTotal: 6,
  rssi: -62,
  smapSurface: 0.143,
  smapRoot: 0.191,
  esi: 0.42,
  canopyTemp: 41.6,
  ndvi: 0.34,
  modisNtu: 27.5,
  t2m: 33.8,
  rh2m: 44,
  prec: 0.0,
  solarRad: 6.4,
  rainRate: 0,
  rain24h: 0.2,
  stormTicks: 0,
  litersSaved: 1284630,
  hectares: 312.4,
}

export function useSimulation(controls) {
  const [state, setState] = useState(initial)
  const ctrl = useRef(controls)
  ctrl.current = controls

  useEffect(() => {
    const id = setInterval(() => {
      setState((p) => {
        const c = ctrl.current
        const open = ['a', 'b', 'sub'].filter((k) => c.lines[k])

        // Simulated storm: a GPM-style rain burst that fills the wadi channel and the tank.
        const stormTicks = c.stormRequested && p.stormTicks === 0 ? 24 : Math.max(0, p.stormTicks - 1)
        const storming = stormTicks > 0
        const rainRate = storming ? clamp(jitter(p.rainRate > 0 ? p.rainRate : 22, 6), 12, 38) : approach(p.rainRate, 0, 0.35)
        const rain24h = p.rain24h + rainRate * 0.06
        const floodInflowLpm = storming ? clamp(jitter(rainRate * 9, 30), 80, 360) : approach(p.floodInflowLpm, 0, 0.18)

        const yieldLph = c.harvester ? clamp(jitter(3.2, 0.5), 2.5, 3.9) : 0
        const drain = open.length * 0.006
        const level = clamp(p.level + (c.harvester ? 0.004 : 0) + floodInflowLpm * 0.00006 - drain, 0.06, 0.97)

        const soil = { ...p.soil }
        for (const k of ['a', 'b', 'sub']) {
          soil[k] = c.lines[k] && p.level > 0.07
            ? clamp(soil[k] + (k === 'sub' ? 0.62 : 0.45), 0, 34)
            : clamp(soil[k] - 0.03, 9, 40)
          if (rainRate > 1) soil[k] = clamp(soil[k] + rainRate * 0.012, 0, 38)
        }

        const loadW = 0.9 + (c.lines.sub ? 2.1 : 0) + (c.harvester ? 0.6 : 0) + (c.filtration ? 0.4 : 0)
        const solarW = clamp(jitter(4.7, 0.4), 3.9, 5.4)

        return {
          ...p,
          battery: clamp(p.battery + (solarW - loadW) * 0.02, 5, 100),
          solarW,
          loadW,
          level,
          ntu: approach(p.ntu, c.filtration ? 0.6 : 34.2, 0.16),
          yieldLph,
          soil,
          soilTemp: clamp(jitter(p.soilTemp - open.length * 0.03, 0.12), 27, 34),
          rssi: Math.round(clamp(jitter(p.rssi, 3), -68, -56)),
          smapSurface: clamp(approach(p.smapSurface, storming ? 0.26 : 0.143, storming ? 0.06 : 0.01) + (Math.random() - 0.5) * 0.0015, 0.13, 0.3),
          rainRate,
          rain24h,
          floodInflowLpm,
          stormTicks,
          prec: rain24h,
          solarRad: clamp(jitter(storming ? 2.1 : 6.4, 0.2), 1.5, 7),
          esi: clamp(jitter(p.esi, 0.006), 0.38, 0.46),
          canopyTemp: clamp(jitter(p.canopyTemp, 0.25), 40.4, 42.8),
          t2m: clamp(jitter(p.t2m, 0.2), 32.6, 35.1),
          rh2m: Math.round(clamp(jitter(approach(p.rh2m, storming ? 86 : 44, 0.08), 1.6), 38, 92)),
          litersSaved: p.litersSaved + open.length * Math.round(8 + Math.random() * 5) + (c.harvester ? 1 : 0),
          hectares: p.hectares + (open.length ? 0.003 * open.length : 0),
        }
      })
    }, TICK_MS)
    return () => clearInterval(id)
  }, [])

  return state
}

// Flash-flood-guidance style threat: rain rate against a threshold that shrinks as soil saturates.
export function floodThreat(sim) {
  const saturation = Math.min(1, ((sim.soil.a + sim.soil.b + sim.soil.sub) / 3) / 38)
  const threshold = 8 + 24 * (1 - saturation)
  const ratio = sim.rainRate / threshold
  if (ratio >= 1) return { level: 'Warning', ratio, threshold, tone: 'red' }
  if (ratio >= 0.6) return { level: 'Watch', ratio, threshold, tone: 'amber' }
  return { level: 'Low', ratio, threshold, tone: 'emerald' }
}

// Evidence stack. Satellites give context; the in-field probes decide, as the data-source guide requires.
export const WEIGHTS = { ground: 0.6, smap: 0.2, gpm: 0.1, ecostress: 0.05, ndvi: 0.05 }

export function fuse(sim) {
  const sat = sim.smapSurface * 100
  const ground = (sim.soil.a + sim.soil.b) / 2
  const diff = Math.abs(sat - ground)
  const confidence = clamp(100 - diff * 1.4 - Math.abs(sim.esi - 0.4) * 2, 82, 99.6)
  // Ground 60 : SMAP 20 renormalised to moisture; rain credited separately.
  const fused = (ground * WEIGHTS.ground + sat * WEIGHTS.smap) / (WEIGHTS.ground + WEIGHTS.smap)
  const rainCredit = Math.min(8, sim.rain24h * 0.35)
  const effective = fused + rainCredit
  const target = 24
  const stressed = sim.esi > 0.3 && sim.ndvi < 0.5
  const evidence = [
    { id: 'ground', label: 'ESP32 probes', value: `${ground.toFixed(1)}% VWC`, weight: WEIGHTS.ground, note: 'Decisive · in-field' },
    { id: 'smap', label: 'SMAP', value: `${sim.smapSurface.toFixed(3)} m³/m³`, weight: WEIGHTS.smap, note: 'Regional context' },
    { id: 'gpm', label: 'GPM IMERG', value: `${sim.rain24h.toFixed(1)} mm / 24 h`, weight: WEIGHTS.gpm, note: `+${rainCredit.toFixed(1)}% rain credit` },
    { id: 'ecostress', label: 'ECOSTRESS', value: `ESI ${sim.esi.toFixed(2)} · ${sim.canopyTemp.toFixed(1)} °C`, weight: WEIGHTS.ecostress, note: 'Stress signal' },
    { id: 'ndvi', label: 'NDVI', value: sim.ndvi.toFixed(2), weight: WEIGHTS.ndvi, note: 'Crop condition' },
  ]
  const base = { confidence, sat, ground, fused, effective, rainCredit, evidence }

  if (sim.rainRate > 4) {
    return {
      ...base,
      action: 'hold',
      title: 'Hold: rain in progress',
      detail: `${sim.rainRate.toFixed(0)} mm/h on GPM IMERG`,
      reason: 'Rain is recharging the soil and the wadi channel is routing runoff to storage. Re-evaluate after the event.',
    }
  }
  if (effective < 18 && stressed) {
    const minutes = Math.round((target - effective) * 4.5)
    return {
      ...base,
      action: 'irrigate',
      title: 'Irrigate Zones A + B',
      detail: `${minutes} min drip cycle · ≈${(minutes * 28).toLocaleString()} L`,
      reason: `Probes read ${ground.toFixed(1)}% VWC. With a ${rainCredit.toFixed(1)}% rain credit the root zone sits at ${effective.toFixed(1)}%, below the 18% stress line, and ECOSTRESS ESI ${sim.esi.toFixed(2)} agrees.`,
    }
  }
  if (effective < 22) {
    return {
      ...base,
      action: 'trim',
      title: 'Top-up Zone B',
      detail: '12 min pulse · ≈340 L',
      reason: `Soil is recovering (${effective.toFixed(1)}% effective VWC). A short pulse keeps it inside the 22–28% target band.`,
    }
  }
  return {
    ...base,
    action: 'hold',
    title: 'Hold irrigation',
    detail: 'Field inside target band',
    reason: `Effective moisture ${effective.toFixed(1)}% VWC is on target. Water stays in the tank for the next cycle.`,
  }
}
