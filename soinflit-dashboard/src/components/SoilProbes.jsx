import { motion } from 'framer-motion'
import { Sprout } from 'lucide-react'
import GlassCard, { CardHeader } from './GlassCard'
import SimBadge from './SimBadge'

const MAX = 40
const ZONES = [
  { key: 'a', name: 'Zone A', depth: '15 cm' },
  { key: 'b', name: 'Zone B', depth: '15 cm' },
  { key: 'sub', name: 'Root', depth: '35 cm' },
]

function status(v) {
  if (v < 18) return { label: 'Dry', cls: 'text-amber-200 bg-amber-400/15' }
  if (v <= 28) return { label: 'Optimal', cls: 'text-emerald-200 bg-emerald-400/15' }
  return { label: 'Wet', cls: 'text-cyan-200 bg-cyan-400/15' }
}

export default function SoilProbes({ sim, lines, index, className = '' }) {
  return (
    <GlassCard index={index} glow="emerald" className={`p-5 ${className}`} aria-labelledby="soil-title">
      <CardHeader
        icon={Sprout}
        tone="text-emerald-300"
        eyebrow="Ground truth"
        title={<span id="soil-title">Soil probes</span>}
        right={<SimBadge label="Sim" />}
      />

      <div className="grid grid-cols-3 gap-3">
        {ZONES.map((z) => {
          const v = sim.soil[z.key]
          const s = status(v)
          return (
            <div key={z.key} className="flex flex-col items-center gap-2">
              <div
                className="relative h-40 w-full max-w-[64px] overflow-hidden rounded-[18px] border border-white/15 bg-[linear-gradient(180deg,rgba(120,85,50,0.15),rgba(80,55,30,0.35))] shadow-inner"
                role="meter"
                aria-valuemin={0}
                aria-valuemax={MAX}
                aria-valuenow={Number(v.toFixed(1))}
                aria-label={`${z.name} volumetric water content`}
              >
                {/* 22–28% target band */}
                <div className="absolute inset-x-0 border-y border-dashed border-emerald-300/40 bg-emerald-400/[0.07]" style={{ bottom: `${(22 / MAX) * 100}%`, height: `${(6 / MAX) * 100}%` }} aria-hidden />
                <motion.div
                  className="absolute inset-x-0 bottom-0 h-full origin-bottom bg-gradient-to-t from-cyan-600/70 via-cyan-400/50 to-cyan-200/70"
                  initial={false}
                  animate={{ scaleY: v / MAX }}
                  transition={{ type: 'spring', stiffness: 60, damping: 18 }}
                  aria-hidden
                />
                {lines[z.key] && <span className="anim-blink absolute inset-x-2 top-2 h-1 rounded-full bg-cyan-200/80 motion-reduce:opacity-80" aria-hidden />}
              </div>
              <p className="telemetry text-sm">{v.toFixed(1)}<span className="text-[10px] text-white/50">%</span></p>
              <p className="-mt-1.5 text-center text-[11px] leading-tight text-white/55">{z.name}<br />{z.depth}</p>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${s.cls}`}>{s.label}</span>
            </div>
          )
        })}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-3 text-xs">
        <div>
          <dt className="text-white/50">Soil temp</dt>
          <dd className="telemetry text-sm">{sim.soilTemp.toFixed(1)} °C</dd>
        </div>
        <div>
          <dt className="text-white/50">EC · salinity</dt>
          <dd className="telemetry-amber text-sm">{sim.ec.a.toFixed(1)} dS/m</dd>
        </div>
      </dl>
      <p className="mt-2 text-[11px] text-white/40">Dashed band = 22–28% VWC target</p>
    </GlassCard>
  )
}
