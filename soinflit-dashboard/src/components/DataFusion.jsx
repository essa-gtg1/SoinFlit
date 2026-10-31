import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CheckCircle2, Cpu, Orbit, PauseCircle, Play, RotateCcw, Satellite, Send } from 'lucide-react'
import GlassCard, { CardHeader } from './GlassCard'
import SimBadge from './SimBadge'
import { fuse } from '../lib/useSimulation'
import { EASE_IN_OUT, EASE_OUT, liquidSpring } from '../lib/motion'

function Orb({ gradient, x, scale, opacity }) {
  return (
    <motion.div
      className="absolute left-1/2 top-1/2 -ml-[64px] -mt-[64px] h-32 w-32"
      animate={{ x, scale, opacity }}
      transition={{ duration: 1.15, ease: EASE_IN_OUT }}
    >
      {/* Two offset blobs spinning inside the goo filter read as a slowly morphing liquid body. */}
      <div className="anim-spin absolute inset-0">
        <div className={`absolute inset-[6%] translate-x-[6%] rounded-full ${gradient}`} />
      </div>
      <div className="anim-spin-rev absolute inset-0">
        <div className={`absolute inset-[10%] -translate-x-[7%] translate-y-[4%] rounded-full ${gradient}`} />
      </div>
      <div className="absolute inset-[22%] -translate-x-[18%] -translate-y-[20%] rounded-full bg-white/60" />
    </motion.div>
  )
}

function Reading({ label, value, unit }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="text-xs text-white/60">{label}</span>
      <span className="telemetry text-sm text-white">
        {value}
        {unit && <span className="ml-1 text-[11px] text-white/50">{unit}</span>}
      </span>
    </div>
  )
}

export default function DataFusion({ sim, lines, onApply, index, className = '' }) {
  const reduce = useReducedMotion()
  const [phase, setPhase] = useState('idle')
  const [result, setResult] = useState(null)
  const [width, setWidth] = useState(640)
  const stageRef = useRef(null)
  const timer = useRef()

  useLayoutEffect(() => {
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    ro.observe(stageRef.current)
    return () => ro.disconnect()
  }, [])
  useEffect(() => () => clearTimeout(timer.current), [])

  const offset = Math.min(width * 0.3, 210)
  const merging = phase !== 'idle'

  function run() {
    if (phase === 'fusing') return
    setPhase('idle')
    setResult(null)
    clearTimeout(timer.current)
    // Let the orbs settle apart for a beat on re-runs, then merge.
    timer.current = setTimeout(() => {
      setPhase('fusing')
      const snapshot = fuse(sim)
      timer.current = setTimeout(() => {
        setResult(snapshot)
        setPhase('fused')
      }, reduce ? 120 : 1500)
    }, phase === 'fused' && !reduce ? 450 : 0)
  }

  const applied = result?.action !== 'hold' && lines.a && lines.b

  return (
    <GlassCard index={index} className={`p-5 sm:p-7 ${className}`} aria-labelledby="fusion-title">
      <CardHeader
        icon={Orbit}
        eyebrow="Hero · Data Fusion Engine"
        title={<span id="fusion-title">Orbit × ground truth</span>}
        right={<SimBadge />}
      />
      <p className="max-w-2xl text-sm leading-relaxed text-white/65">
        Cross-checks NASA SMAP soil moisture, GPM IMERG rainfall, ECOSTRESS surface temperature and NDVI against ESP32 probes in
        the field. Satellites give the regional picture; the final call rests on the in-field sensors, because SMAP’s coarse grid
        cannot see within a small farm.
      </p>

      <svg width="0" height="0" className="absolute" aria-hidden>
        <filter id="goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="11" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" result="goo" />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </svg>

      <div ref={stageRef} className="relative mt-4 h-[230px] sm:h-[270px]">
        {/* faint orbit guides */}
        <div aria-hidden className="absolute left-1/2 top-1/2 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/10 sm:h-[240px] sm:w-[240px]" />
        <div aria-hidden className="absolute inset-x-[8%] top-1/2 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        <div className="absolute inset-0" style={{ filter: 'url(#goo)' }} aria-hidden>
          <Orb
            gradient="bg-[radial-gradient(circle_at_35%_30%,#7dfcff,#00c6d4_45%,#047857)]"
            x={merging ? 0 : -offset}
            scale={merging ? 0.62 : 1}
            opacity={phase === 'fused' ? 0 : 1}
          />
          <Orb
            gradient="bg-[radial-gradient(circle_at_35%_30%,#fde68a,#f59e0b_40%,#0e7490)]"
            x={merging ? 0 : offset}
            scale={merging ? 0.62 : 1}
            opacity={phase === 'fused' ? 0 : 1}
          />
          <motion.div
            className="absolute left-1/2 top-1/2 -ml-[78px] -mt-[78px] h-[156px] w-[156px] rounded-full bg-[radial-gradient(circle_at_38%_30%,#ffffff,#9ffcff_25%,#00F2FE_55%,#0e7490)]"
            initial={false}
            animate={{ scale: merging ? 1 : 0, opacity: merging ? 1 : 0 }}
            transition={merging ? { ...liquidSpring, delay: reduce ? 0 : 0.7 } : { duration: 0.35, ease: EASE_OUT }}
          />
        </div>

        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -ml-[120px] -mt-[120px] h-[240px] w-[240px] rounded-full bg-cyan-300/30 blur-3xl"
          animate={{ opacity: phase === 'fused' ? 1 : 0, scale: phase === 'fused' ? 1 : 0.6 }}
          transition={{ duration: 0.8, ease: EASE_OUT }}
        />

        {/* side captions travel with their orbs */}
        <motion.div
          className="absolute left-1/2 top-[calc(50%+76px)] -ml-16 w-32 text-center"
          animate={{ x: -offset, opacity: merging ? 0 : 1 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          <p className="eyebrow !text-[10px] !text-cyan-200/80">Satellite</p>
        </motion.div>
        <motion.div
          className="absolute left-1/2 top-[calc(50%+76px)] -ml-16 w-32 text-center"
          animate={{ x: offset, opacity: merging ? 0 : 1 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          <p className="eyebrow !text-[10px] !text-amber-200/80">Ground</p>
        </motion.div>

        <AnimatePresence>
          {phase === 'fused' && result && (
            <motion.div
              key="score"
              className="absolute inset-0 grid place-items-center text-center"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.45, ease: EASE_OUT }}
            >
              <div className="text-[#032027]">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em]">Confidence</p>
                <p className="font-mono text-3xl font-semibold tabular-nums tracking-tight">{result.confidence.toFixed(1)}%</p>
                <p className="text-[11px] font-medium">match</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-start">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="mb-1 flex items-center gap-2 text-xs font-medium text-cyan-200">
            <Satellite className="h-3.5 w-3.5" aria-hidden /> NASA SMAP · ECOSTRESS · GPM
          </p>
          <Reading label="SMAP surface soil moisture" value={sim.smapSurface.toFixed(3)} unit="m³/m³" />
          <Reading label="SMAP root zone" value={sim.smapRoot.toFixed(3)} unit="m³/m³" />
          <Reading label="ECOSTRESS evaporative stress" value={sim.esi.toFixed(2)} unit="ESI" />
          <Reading label="GPM IMERG rain · 24 h" value={sim.rain24h.toFixed(1)} unit="mm" />
        </div>

        <div className="flex flex-col items-center gap-2 sm:pt-6">
          <motion.button
            type="button"
            onClick={run}
            disabled={phase === 'fusing'}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            transition={liquidSpring}
            className="focus-ring relative inline-flex min-h-[48px] items-center gap-2 overflow-hidden rounded-full border border-cyan-200/40 bg-cyan-400/15 px-6 text-sm font-semibold text-white shadow-[0_0_30px_-4px_rgba(0,242,254,0.55),inset_0_1px_0_rgba(255,255,255,0.35)] disabled:cursor-progress disabled:opacity-70"
          >
            {phase === 'fused' ? <RotateCcw className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
            {phase === 'fusing' ? 'Fusing…' : phase === 'fused' ? 'Re-run fusion' : 'Run Data Fusion'}
          </motion.button>
          <p className="max-w-[11rem] text-center text-[11px] leading-snug text-white/45">In-field probes decide · satellites add context</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="mb-1 flex items-center gap-2 text-xs font-medium text-amber-200">
            <Cpu className="h-3.5 w-3.5" aria-hidden /> ESP32 ground probes
          </p>
          <Reading label="Zone A · 15 cm VWC" value={sim.soil.a.toFixed(1)} unit="%" />
          <Reading label="Zone B · 15 cm VWC" value={sim.soil.b.toFixed(1)} unit="%" />
          <Reading label="Soil EC (salinity)" value={sim.ec.a.toFixed(1)} unit="dS/m" />
        </div>
      </div>

      <div aria-live="polite" className="mt-4">
        <AnimatePresence mode="wait">
          {phase === 'fused' && result && (
            <motion.div
              key={result.title + result.confidence}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.45, ease: EASE_OUT }}
              className={`rounded-2xl border p-4 ${
                result.action === 'hold' ? 'border-emerald-300/30 bg-emerald-400/[0.07]' : 'border-cyan-300/30 bg-cyan-400/[0.07]'
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-start gap-3">
                {result.action === 'hold'
                  ? <PauseCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden />
                  : <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" aria-hidden />}
                <div>
                  <p className="eyebrow !text-[10px]">Automated irrigation decision · {result.confidence.toFixed(1)}% match</p>
                  <p className="mt-0.5 text-base font-semibold text-white">
                    {result.title} <span className="font-mono text-sm font-normal text-cyan-200">· {result.detail}</span>
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-white/60">{result.reason}</p>
                </div>
              </div>
              {result.action !== 'hold' && (
                <motion.button
                  type="button"
                  onClick={onApply}
                  disabled={applied}
                  whileTap={{ scale: 0.96 }}
                  transition={liquidSpring}
                  className="focus-ring inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 text-sm font-medium text-white transition-colors hover:bg-white/15 disabled:border-cyan-300/40 disabled:bg-cyan-400/15 disabled:text-cyan-100"
                >
                  <Send className="h-4 w-4" aria-hidden />
                  {applied ? 'Valves A + B open' : 'Send to ESP32 valves'}
                </motion.button>
              )}
              </div>

              <div className="mt-4 border-t border-white/10 pt-3">
                <p className="eyebrow mb-2 !text-[10px]">Evidence stack · weight in decision</p>
                <ul className="grid gap-1.5">
                  {result.evidence.map((e, k) => (
                    <li key={e.id} className="grid grid-cols-[6.5rem_1fr] items-center gap-3 text-xs sm:grid-cols-[7rem_1fr_auto]">
                      <span className={e.id === 'ground' ? 'font-medium text-amber-200' : 'text-white/70'}>{e.label}</span>
                      <span className="relative h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden>
                        <motion.span
                          className={`absolute inset-0 origin-left rounded-full ${e.id === 'ground' ? 'bg-amber-300' : 'bg-cyan-300/80'}`}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: e.weight / 0.6 }}
                          transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.1 + k * 0.06 }}
                        />
                      </span>
                      <span className="col-span-2 font-mono text-[11px] text-white/55 sm:col-span-1 sm:text-right">
                        {e.value} · <span className="text-white/40">{Math.round(e.weight * 100)}% · {e.note}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GlassCard>
  )
}
