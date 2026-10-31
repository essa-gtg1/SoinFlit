import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CircleMarker, TileLayer, Tooltip } from 'react-leaflet'
import { AlertTriangle, ExternalLink, Info, Layers } from 'lucide-react'
import GlassCard, { CardHeader } from './GlassCard'
import GlassMap, { FlyTo } from './GlassMap'
import { EASE_OUT } from '../lib/motion'
import { FIELD_CENTER, GIBS_ATTRIBUTION, LABELS, MAP_LAYERS } from '../lib/maps'
import { sourceById } from '../lib/sources'

export const LAYERS = MAP_LAYERS

function Legend({ legend }) {
  if (legend.kind === 'classes') {
    return (
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-white/70">
        {legend.stops.map(([c, l]) => (
          <li key={l} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: c }} aria-hidden /> {l}
          </li>
        ))}
      </ul>
    )
  }
  const stepped = legend.kind === 'steps'
  return (
    <div>
      <div
        className="flex h-2.5 overflow-hidden rounded-full"
        style={stepped ? undefined : { background: `linear-gradient(90deg, ${legend.stops.map(([c]) => c).join(',')})` }}
        aria-hidden
      >
        {stepped && legend.stops.map(([c]) => <span key={c} className="h-full flex-1" style={{ background: c }} />)}
      </div>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-white/55">
        {legend.stops.map(([c, l], i) => <span key={c + i}>{l}</span>)}
      </div>
      <p className="mt-0.5 text-right font-mono text-[10px] text-white/40">{legend.unit}</p>
    </div>
  )
}

export default function SatelliteMap({ layerId, setLayerId, index, className = '' }) {
  const [modeIds, setModeIds] = useState({ smap: 'surface', gpm: 'shaheen', ecostress: 'lst', ndvi: 'ndvi', dem: 'relief', landcover: 'igbp' })
  const [opacity, setOpacity] = useState(0.75)
  const [labels, setLabels] = useState(true)
  const tabRefs = useRef([])
  const layer = LAYERS.find((l) => l.id === layerId)
  const mode = layer.modes.find((m) => m.id === modeIds[layerId])
  const src = sourceById[layer.id]

  function onTabKey(e, i) {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!dir) return
    e.preventDefault()
    const next = (i + dir + LAYERS.length) % LAYERS.length
    setLayerId(LAYERS[next].id)
    tabRefs.current[next]?.focus()
  }

  return (
    <GlassCard index={index} className={`p-5 sm:p-6 ${className}`} aria-labelledby="map-title">
      <CardHeader
        icon={Layers}
        eyebrow="Tier 1 · NASA layers"
        title={<span id="map-title">Satellite layer switcher</span>}
        right={
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" aria-hidden /> Live NASA GIBS
          </span>
        }
      />

      <div role="tablist" aria-label="Satellite layer" className="relative mb-3 grid grid-cols-3 gap-1 rounded-[22px] border border-white/10 bg-white/[0.04] p-1 sm:grid-cols-6 sm:rounded-full">
        {LAYERS.map((l, i) => {
          const active = l.id === layerId
          return (
            <button
              key={l.id}
              ref={(el) => (tabRefs.current[i] = el)}
              role="tab"
              id={`tab-${l.id}`}
              aria-selected={active}
              aria-controls="map-panel"
              tabIndex={active ? 0 : -1}
              onClick={() => setLayerId(l.id)}
              onKeyDown={(e) => onTabKey(e, i)}
              className="focus-ring relative min-h-[44px] rounded-full px-2 text-xs font-semibold tracking-wide"
            >
              {active && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-full border border-cyan-200/40 bg-cyan-400/15 shadow-[0_0_20px_-4px_rgba(0,242,254,0.6)]"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className={`relative inline-flex items-center gap-1.5 whitespace-nowrap ${active ? 'text-white' : 'text-white/55'}`}>
                <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${l.group === 'core' ? 'bg-cyan-300' : 'bg-white/35'}`} />
                {l.tab}
              </span>
            </button>
          )
        })}
      </div>
      <p className="mb-3 flex items-center gap-3 text-[11px] text-white/45">
        <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300" aria-hidden /> Prototype core</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-white/35" aria-hidden /> Supporting layer</span>
      </p>

      <div id="map-panel" role="tabpanel" aria-labelledby={`tab-${layerId}`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-white/70">
            <span className="font-medium text-white">{layer.title}</span> · {mode.label}
          </p>
          {layer.modes.length > 1 && (
            <div className="flex flex-wrap gap-1" role="group" aria-label={`${layer.tab} product`}>
              {layer.modes.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={m.id === mode.id}
                  onClick={() => setModeIds((s) => ({ ...s, [layerId]: m.id }))}
                  className={`focus-ring min-h-[44px] rounded-full border px-3 text-xs transition-colors ${
                    m.id === mode.id ? 'border-cyan-200/40 bg-white/10 text-white' : 'border-white/10 text-white/55 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
          <div className="min-w-0">
            <GlassMap center={FIELD_CENTER} zoom={layer.zoom} label={`${layer.title} map, ${mode.label}`}>
              <FlyTo center={mode.center || FIELD_CENTER} zoom={layer.zoom} />
              <TileLayer
                key={mode.url}
                url={mode.url}
                attribution={GIBS_ATTRIBUTION}
                maxNativeZoom={mode.native}
                maxZoom={18}
                opacity={opacity}
              />
              {labels && <TileLayer url={LABELS.url} maxNativeZoom={LABELS.maxNativeZoom} maxZoom={18} />}
              <CircleMarker center={FIELD_CENTER} radius={7} pathOptions={{ color: '#fff', weight: 2, fillColor: '#00F2FE', fillOpacity: 1 }}>
                <Tooltip direction="top" offset={[0, -8]} permanent>SoinFlit field</Tooltip>
              </CircleMarker>
            </GlassMap>

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
              <label className="flex min-h-[44px] flex-1 items-center gap-3 text-xs text-white/65">
                Layer opacity
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="focus-ring h-11 flex-1 cursor-pointer accent-cyan-300"
                />
                <span className="w-9 text-right font-mono text-white/80">{Math.round(opacity * 100)}%</span>
              </label>
              <button
                type="button"
                role="switch"
                aria-checked={labels}
                onClick={() => setLabels((v) => !v)}
                className={`focus-ring min-h-[44px] rounded-full border px-4 text-xs transition-colors ${labels ? 'border-cyan-200/40 bg-white/10 text-white' : 'border-white/10 text-white/55'}`}
              >
                Place labels {labels ? 'on' : 'off'}
              </button>
            </div>

            <div className="mt-2">
              <Legend legend={layer.legend} />
            </div>
            <p className="mt-2 font-mono text-[10px] text-white/45">
              {mode.when} · {mode.res || src.resolution} · drag to pan, +/− to zoom
            </p>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={layer.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
              className="flex flex-col gap-3 text-sm"
            >
              <div>
                <p className="eyebrow !text-[10px]">What it shows</p>
                <p className="mt-1 leading-relaxed text-white/75">{src.shows}</p>
              </div>
              <div>
                <p className="eyebrow !text-[10px]">Role in SoinFlit</p>
                <p className="mt-1 leading-relaxed text-white/75">{src.role}</p>
              </div>
              {layer.note && (
                <p className="flex items-start gap-2 rounded-2xl border border-cyan-300/25 bg-cyan-400/[0.06] px-3 py-2 text-xs leading-relaxed text-cyan-50/85">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  {layer.note}
                </p>
              )}
              <p className="flex items-start gap-2 rounded-2xl border border-amber-300/25 bg-amber-400/[0.07] px-3 py-2 text-xs leading-relaxed text-amber-100/90">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                {src.caveat}
              </p>
              <a
                href={src.href}
                target="_blank"
                rel="noreferrer"
                className="focus-ring inline-flex min-h-[44px] w-fit items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 text-xs font-medium text-white transition-colors hover:border-cyan-200/40 hover:bg-white/10"
              >
                Open official source <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </GlassCard>
  )
}
