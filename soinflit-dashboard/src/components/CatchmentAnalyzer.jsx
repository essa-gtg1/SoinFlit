import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CircleMarker, ImageOverlay, Rectangle, TileLayer, Tooltip } from 'react-leaflet'
import { AlertTriangle, ArrowUpRight, Check, Loader2, MapPin, Mountain, MousePointerClick, RotateCcw } from 'lucide-react'
import GlassCard, { CardHeader } from './GlassCard'
import GlassMap, { FlyTo } from './GlassMap'
import { EASE_OUT, liquidSpring } from '../lib/motion'
import { ramp, SCALES } from '../lib/color'
import { analyse, runoffM3 } from '../lib/hydrology'
import { loadDem, STUDY_AREAS } from '../lib/maps'

const BASIN_COLORS = ['0,242,254', '16,185,129', '245,158,11', '167,139,250', '244,114,182', '96,165,250', '148,163,184']
const ROADS = 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}'

// The 8-step workflow from the Oman rain-collection guide. Each step drives a view of the terrain.
const STEPS = [
  { view: 'area', title: 'Define the study area', body: 'Pick a wilayah above. The dashed box is the ~18 km square analysed.' },
  { view: 'elevation', title: 'Download a DEM', body: 'Done live: four zoom-12 SRTM-based terrain tiles (AWS Terrain Tiles) for this box.' },
  { view: 'hillshade', title: 'Open it in GIS', body: 'Inspect the terrain as a hillshade. The same steps run in QGIS on full-resolution tiles.' },
  { view: 'sinks', title: 'Fill sinks', body: 'Priority-flood fill removes pits that break flow routing. Deep fills are natural ponding spots or DEM artefacts.' },
  { view: 'flow', title: 'Flow direction & accumulation', body: 'D8 routes each cell to its steepest neighbour; accumulation traces the wadi network.' },
  { view: 'watershed', title: 'Delineate watersheds', body: 'Cells grouped by the outlet their flow reaches give the catchments.' },
  { view: 'compare', title: 'Compare with roads & known wadis', body: 'Derived channels over imagery and Esri road lines. Cross-check with Oman NSA Geoportal base maps.' },
  { view: 'sites', title: 'Verify in the field', body: 'Visit the candidates and check official rain and flood data before any decision.' },
]

// "Which layer answers which question?" from the guide.
const QUESTIONS = [
  { q: 'Where are the low areas?', layer: 'DEM / NASADEM / SRTM', view: 'elevation', a: 'Elevations that sit low relative to their surroundings.' },
  { q: 'Which way does runoff flow?', layer: 'Flow direction', view: 'direction', a: 'The path water is likely to take given the terrain shape.' },
  { q: 'Where does runoff converge?', layer: 'Flow accumulation', view: 'accumulation', a: 'Channels and cells that receive flow from a larger upslope area.' },
  { q: 'Where are the catchments?', layer: 'Watershed / catchment', view: 'watershed', a: 'The area draining to a given outlet or channel.' },
  { q: 'Where is the surface flatter?', layer: 'Slope', view: 'slope', a: 'Where water may slow down, taking drainage and soil into account.' },
  { q: 'Has the soil become wetter?', layer: 'SMAP soil moisture', satellite: 'smap', a: 'Broad changes in soil moisture. Opens the satellite map.' },
  { q: 'Was rain observed after an event?', layer: 'Worldview / GPM rainfall', satellite: 'gpm', a: 'Review observed rainfall. Opens the satellite map.' },
]

const VIEW_LABEL = {
  area: 'Study area', elevation: 'Elevation', hillshade: 'Hillshade', sinks: 'Filled depressions', direction: 'Flow direction',
  accumulation: 'Flow accumulation', flow: 'Flow direction + derived wadis', watershed: 'Watersheds', slope: 'Slope',
  compare: 'Derived wadis vs roads', sites: 'Candidate collection sites',
}

const withAlpha = (rgb, a) => rgb.replace('rgb(', 'rgba(').replace(')', `,${a})`)

function cellFill(view, h, i) {
  const accT = Math.log(h.acc[i]) / h.maxLog
  switch (view) {
    case 'elevation': return withAlpha(ramp(SCALES.elevation, (h.z[i] - h.zMin) / (h.zMax - h.zMin)), 0.72)
    case 'hillshade': { const v = Math.round(20 + h.shade[i] * 200); return `rgba(${v},${v + 4},${v + 10},0.78)` }
    case 'sinks': return h.fillDepth[i] > 0.5 ? withAlpha(ramp(SCALES.moisture, 0.5 + Math.min(1, h.fillDepth[i] / 10) * 0.5), 0.9) : 'rgba(4,8,20,0.35)'
    case 'direction':
    case 'flow': return 'rgba(4,8,20,0.3)'
    case 'accumulation': return withAlpha(ramp(SCALES.accumulation, accT), Math.max(0, Math.min(0.9, (accT - 0.2) * 1.6)))
    case 'watershed': return `rgba(${BASIN_COLORS[h.basinIndex[i]]},0.42)`
    case 'slope': return withAlpha(ramp(SCALES.slope, Math.min(1, h.slope[i] / 25)), 0.7)
    default: return null
  }
}

// Draws the current view as an image laid over the imagery (one cell = 8 px).
function renderView(h, view) {
  const S = 8
  const c = document.createElement('canvas')
  c.width = h.W * S
  c.height = h.H * S
  const g = c.getContext('2d')
  for (let i = 0; i < h.W * h.H; i++) {
    const f = cellFill(view, h, i)
    if (!f) continue
    g.fillStyle = f
    g.fillRect((i % h.W) * S, ((i / h.W) | 0) * S, S, S)
  }
  const ctr = (i) => [(i % h.W) * S + S / 2, ((i / h.W) | 0) * S + S / 2]
  if (['flow', 'compare', 'sites', 'accumulation'].includes(view)) {
    g.lineCap = 'round'
    g.shadowColor = 'rgba(0,242,254,0.9)'
    g.shadowBlur = 6
    for (let i = 0; i < h.W * h.H; i++) {
      const t = Math.log(h.acc[i]) / h.maxLog
      if (t < 0.5 || h.dir[i] < 0) continue
      const [x1, y1] = ctr(i)
      const [x2, y2] = ctr(h.dir[i])
      g.strokeStyle = `rgba(190,252,255,${0.55 + t * 0.45})`
      g.lineWidth = 0.8 + t * t * 4.5
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke()
    }
    g.shadowBlur = 0
  }
  if (view === 'direction' || view === 'flow') {
    g.strokeStyle = 'rgba(255,255,255,0.75)'
    g.fillStyle = '#fff'
    g.lineWidth = 0.9
    for (let i = 0; i < h.W * h.H; i++) {
      const x = i % h.W, y = (i / h.W) | 0
      const v = h.dirVec[i]
      if (!v || x % 2 || y % 2) continue
      const [cx, cy] = ctr(i)
      const L = Math.hypot(v[0], v[1])
      const ux = v[0] / L, uy = v[1] / L
      g.beginPath(); g.moveTo(cx - ux * 2.5, cy - uy * 2.5); g.lineTo(cx + ux * 3, cy + uy * 3); g.stroke()
      g.beginPath(); g.arc(cx + ux * 3, cy + uy * 3, 1.1, 0, Math.PI * 2); g.fill()
    }
  }
  return c.toDataURL()
}

// Grid cell → lat/lng. Rows are uniform in Web-Mercator space because the DEM came from Mercator tiles.
function cellToLatLng(dem, x, y) {
  const [[south, west], [north, east]] = dem.bounds
  const merc = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))
  const m = merc(north) + ((y + 0.5) / dem.H) * (merc(south) - merc(north))
  return [(360 / Math.PI) * Math.atan(Math.exp(m)) - 90, west + ((x + 0.5) / dem.W) * (east - west)]
}

export default function CatchmentAnalyzer({ sim, onSatellite, index, className = '' }) {
  const [area, setArea] = useState(STUDY_AREAS[0])
  const [attempt, setAttempt] = useState(0)
  const [dem, setDem] = useState(null)
  const [status, setStatus] = useState('loading')
  const [view, setView] = useState('flow')
  const [stepDone, setStepDone] = useState(4)
  const [question, setQuestion] = useState(null)
  const [focusSite, setFocusSite] = useState(null)

  useEffect(() => {
    let alive = true
    setStatus('loading')
    setFocusSite(null)
    loadDem(area.center)
      .then((d) => { if (alive) { setDem(d); setStatus('ready') } })
      .catch(() => { if (alive) setStatus('error') })
    return () => { alive = false }
  }, [area, attempt])

  const h = useMemo(() => (dem ? analyse(dem) : null), [dem])
  const overlay = useMemo(() => (h ? renderView(h, view) : null), [h, view])

  const designRain = sim.rain24h > 5 ? sim.rain24h : 25
  const sites = h
    ? h.sites.map((s) => ({ ...s, volume: runoffM3(s.areaKm2, designRain), latlng: cellToLatLng(dem, s.x, s.y) }))
    : []

  function pickStep(k) {
    setView(STEPS[k].view)
    setStepDone(k)
    setQuestion(null)
    setFocusSite(null)
  }
  function pickQuestion(k) {
    const q = QUESTIONS[k]
    setQuestion(k)
    if (q.satellite) onSatellite(q.satellite)
    else setView(q.view)
  }

  return (
    <GlassCard index={index} glow="emerald" className={`p-5 sm:p-7 ${className}`} aria-labelledby="catch-title">
      <CardHeader
        icon={Mountain}
        tone="text-emerald-300"
        eyebrow="Tier 2 · Rain harvest · Oman"
        title={<span id="catch-title">Rain catchment analyzer</span>}
        right={
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" aria-hidden /> Real SRTM terrain
          </span>
        }
      />
      <p className="max-w-3xl text-sm leading-relaxed text-white/65">
        Finds where rain will run and pool before the storm arrives, so wadi flow can be routed into SoinFlit storage. Real
        SRTM-based elevation for the chosen area is downloaded, then sink filling, D8 flow, accumulation, watersheds and slope
        run in your browser and are drawn over satellite imagery.
      </p>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Study area">
        {STUDY_AREAS.map((a) => (
          <button
            key={a.id}
            type="button"
            aria-pressed={area.id === a.id}
            onClick={() => setArea(a)}
            className={`focus-ring inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 text-left text-xs transition-colors ${
              area.id === a.id ? 'border-emerald-300/50 bg-emerald-400/15 text-white' : 'border-white/15 bg-white/[0.04] text-white/70 hover:text-white'
            }`}
          >
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>
              <span className="font-medium">{a.label}</span>
              <span className="hidden text-white/50 sm:inline"> · {a.sub}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-white" aria-live="polite">
              {status === 'loading' ? 'Downloading SRTM terrain…' : status === 'error' ? 'Terrain unavailable' : VIEW_LABEL[view]}
            </p>
            {h && (
              <p className="font-mono text-[11px] text-white/45">
                {h.W}×{h.H} cells · {Math.round(h.cellM)} m · {Math.round(h.zMin)}–{Math.round(h.zMax)} m · {h.sinkCount} pits
              </p>
            )}
          </div>

          <div className="relative">
            <GlassMap center={area.center} zoom={11} label={`Catchment map of ${area.label}, ${VIEW_LABEL[view]}`} height="h-[340px] sm:h-[440px]">
              {dem && <FlyTo bounds={focusSite ? null : dem.bounds} center={focusSite?.latlng} zoom={14} />}
              {view === 'compare' && <TileLayer url={ROADS} maxNativeZoom={18} maxZoom={18} attribution="Roads © Esri" />}
              {dem && overlay && view !== 'area' && <ImageOverlay url={overlay} bounds={dem.bounds} opacity={1} />}
              {dem && (
                <Rectangle
                  bounds={dem.bounds}
                  pathOptions={{ color: '#ffffff', weight: view === 'area' ? 2.5 : 1, dashArray: '8 6', fill: view === 'area', fillOpacity: 0.06 }}
                />
              )}
              {(view === 'sites' || view === 'sinks' || view === 'compare') && sites.map((s) => (
                <CircleMarker key={s.id} center={s.latlng} radius={9} pathOptions={{ color: '#fff', weight: 2, fillColor: '#F59E0B', fillOpacity: 1 }}>
                  <Tooltip direction="top" offset={[0, -10]} permanent>{s.id}</Tooltip>
                </CircleMarker>
              ))}
            </GlassMap>

            <AnimatePresence>
              {status !== 'ready' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: EASE_OUT }}
                  className="absolute inset-0 z-[600] grid place-items-center rounded-[22px] bg-[#040814]/60 backdrop-blur-sm"
                >
                  {status === 'loading' ? (
                    <p className="flex items-center gap-2 text-sm text-white/80">
                      <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden /> Fetching terrain tiles for {area.label}…
                    </p>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm text-white/80">Could not reach the terrain tile service.</p>
                      <button
                        type="button"
                        onClick={() => setAttempt((n) => n + 1)}
                        className="focus-ring mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 text-xs text-white"
                      >
                        <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Retry
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <p className="mt-2 font-mono text-[10px] text-white/40">
            Elevation: {dem?.source ?? 'AWS Terrain Tiles (SRTM-based)'} · imagery © Esri · scroll the page, drag to pan, +/− to zoom
          </p>

          <div className="mt-5">
            <p className="eyebrow mb-2">Which layer answers which question?</p>
            <div className="flex flex-wrap gap-2">
              {QUESTIONS.map((q, k) => (
                <motion.button
                  key={q.q}
                  type="button"
                  aria-pressed={question === k}
                  onClick={() => pickQuestion(k)}
                  whileTap={{ scale: 0.96 }}
                  transition={liquidSpring}
                  className={`focus-ring inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-3.5 text-left text-xs transition-colors ${
                    question === k ? 'border-emerald-300/50 bg-emerald-400/15 text-white' : 'border-white/15 bg-white/[0.04] text-white/70 hover:text-white'
                  }`}
                >
                  {q.q}
                  {q.satellite && <ArrowUpRight className="h-3.5 w-3.5 opacity-70" aria-hidden />}
                </motion.button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              {question !== null && (
                <motion.p
                  key={question}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: EASE_OUT }}
                  className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white/70"
                  aria-live="polite"
                >
                  <span className="font-medium text-emerald-200">{QUESTIONS[question].layer}:</span> {QUESTIONS[question].a}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <div>
            <p className="eyebrow mb-2 flex items-center gap-1.5"><MousePointerClick className="h-3 w-3" aria-hidden /> Workflow: tap a step</p>
            <ol className="grid gap-1.5">
              {STEPS.map((s, k) => {
                const active = s.view === view && stepDone === k
                const done = k < stepDone
                return (
                  <li key={s.title}>
                    <button
                      type="button"
                      aria-current={active ? 'step' : undefined}
                      onClick={() => pickStep(k)}
                      className={`focus-ring flex min-h-[44px] w-full items-start gap-3 rounded-2xl border px-3 py-2 text-left transition-colors ${
                        active ? 'border-emerald-300/40 bg-emerald-400/10' : 'border-transparent hover:bg-white/[0.05]'
                      }`}
                    >
                      <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border font-mono text-[11px] ${
                        active ? 'border-emerald-300 bg-emerald-400/25 text-white' : done ? 'border-emerald-300/40 text-emerald-200' : 'border-white/20 text-white/50'
                      }`}>
                        {done ? <Check className="h-3 w-3" aria-hidden /> : k + 1}
                      </span>
                      <span className="min-w-0">
                        <span className={`block text-sm font-medium ${active ? 'text-white' : 'text-white/80'}`}>{s.title}</span>
                        {active && <span className="mt-0.5 block text-xs leading-relaxed text-white/60">{s.body}</span>}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </div>

          <div>
            <p className="eyebrow mb-2">Candidate collection sites · {designRain.toFixed(0)} mm {sim.rain24h > 5 ? 'observed' : 'design'} storm</p>
            <ul className="grid gap-2">
              {sites.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => { setView('sites'); setStepDone(7); setFocusSite(s) }}
                    aria-label={`Zoom to site ${s.id}`}
                    className="focus-ring flex min-h-[44px] w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-left transition-colors hover:border-amber-300/30"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-400/20 font-mono text-xs font-semibold text-amber-200">{s.id}</span>
                    <span className="min-w-0 flex-1 text-xs text-white/60">
                      <span className="block text-sm text-white">{s.areaKm2.toFixed(1)} km² catchment</span>
                      slope {s.slope.toFixed(1)}° · {s.elev.toFixed(0)} m{s.pond > 0.5 ? ` · ${s.pond.toFixed(1)} m depression` : ''}
                      <span className="block font-mono text-[10px] text-white/40">{s.latlng[0].toFixed(4)}° N, {s.latlng[1].toFixed(4)}° E</span>
                    </span>
                    <span className="telemetry text-right text-sm text-white">
                      {Math.round(s.volume).toLocaleString()}
                      <span className="block text-[10px] text-white/45">m³ runoff</span>
                    </span>
                  </button>
                </li>
              ))}
              {!sites.length && <li className="text-xs text-white/45">Sites appear once the terrain has loaded.</li>}
            </ul>
            <p className="mt-2 text-[11px] leading-relaxed text-white/40">Runoff = catchment area × rain × C (0.3, arid soil). An indication only.</p>
          </div>

          <p className="flex items-start gap-2 rounded-2xl border border-amber-300/25 bg-amber-400/[0.07] px-3 py-2.5 text-xs leading-relaxed text-amber-100/90">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            A depression does not guarantee water will pool. Rain intensity and duration, soil permeability, drains and dams all
            matter, and ~280 m cells miss small drains and recent earthworks. GIS results are first indications, not a substitute
            for a hydrological study. Consult the competent Omani authorities before any safety, construction or investment decision.
          </p>
        </div>
      </div>
    </GlassCard>
  )
}
