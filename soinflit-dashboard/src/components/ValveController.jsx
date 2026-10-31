import { CircuitBoard, Cylinder, Gauge, Sprout, Waves } from 'lucide-react'
import GlassCard, { CardHeader } from './GlassCard'
import SimBadge from './SimBadge'
import Toggle from './Toggle'

const LANES = [
  { key: 'a', label: 'Valve V1 · Drip Zone A', description: 'Gravity-fed from tank · 28 L/min', icon: Waves, speed: 2.6, drops: 5 },
  { key: 'b', label: 'Valve V2 · Drip Zone B', description: 'Gravity-fed from tank · 28 L/min', icon: Waves, speed: 2.6, drops: 5 },
  { key: 'sub', label: 'Pump P1 · Sub-surface line', description: 'Solar booster, pressurised root feed', icon: Gauge, speed: 1.1, drops: 7 },
]

// A translucent pipe. Droplets ride a full-width track that translates 0 → 100%,
// so movement stays on transform and opacity at any pipe length.
export function Pipe({ active, speed = 2.4, drops = 5, className = '' }) {
  return (
    <div className={`relative h-3.5 overflow-hidden rounded-full border border-white/15 bg-white/[0.04] shadow-inner ${className}`} aria-hidden>
      <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400/10 via-cyan-300/35 to-cyan-400/10 transition-opacity duration-700 ${active ? 'opacity-100' : 'opacity-0'}`} />
      <div className="absolute inset-x-1 top-[2px] h-px rounded-full bg-white/30" />
      {active && Array.from({ length: drops }).map((_, i) => (
        <span
          key={i}
          className="anim-flow absolute inset-y-0 left-0 w-full opacity-0 motion-reduce:hidden"
          style={{ '--dur': `${speed}s`, animationDelay: `${(-speed / drops) * i}s` }}
        >
          <span className="absolute left-[-10px] top-1/2 h-2 w-2.5 -translate-y-1/2 rounded-full bg-cyan-200 shadow-[0_0_8px_2px_rgba(0,242,254,0.85)]" />
        </span>
      ))}
    </div>
  )
}

export default function ValveController({ lines, setLine, tankLow, index, className = '' }) {
  const anyOpen = lines.a || lines.b || lines.sub
  return (
    <GlassCard index={index} className={`relative p-5 ${className}`} aria-labelledby="valve-title">
      {/* inter-card pipe stubs (desktop row only): tank → controller → soil */}
      <div className="absolute -left-6 top-1/2 hidden w-6 lg:block"><Pipe active={anyOpen} className="!rounded-none" /></div>
      <div className="absolute -right-6 top-1/2 hidden w-6 lg:block"><Pipe active={anyOpen} className="!rounded-none" /></div>

      <CardHeader
        icon={CircuitBoard}
        eyebrow="Tier 4 · ESP32 actuation"
        title={<span id="valve-title">Valve & pump controller</span>}
        right={<SimBadge label="Sim" />}
      />

      <div className="mb-3 flex items-center justify-between text-[11px] text-white/55">
        <span className="flex items-center gap-1.5"><Cylinder className="h-3.5 w-3.5 text-cyan-300" aria-hidden /> Harvest tank</span>
        <span className="font-mono">GPIO · 3 channels</span>
        <span className="flex items-center gap-1.5">Soil probes <Sprout className="h-3.5 w-3.5 text-emerald-300" aria-hidden /></span>
      </div>

      <ul className="grid gap-3">
        {LANES.map((lane) => (
          <li key={lane.key} className="rounded-2xl border border-white/10 bg-white/[0.025] p-2">
            <Toggle
              checked={lines[lane.key]}
              onChange={(v) => setLine(lane.key, v)}
              icon={lane.icon}
              tone={lane.key === 'sub' ? 'emerald' : 'cyan'}
              label={lane.label}
              description={lane.description}
            />
            <div className="flex items-center gap-2 px-2.5 pb-1.5 pt-1">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-cyan-300/50 bg-cyan-400/20" aria-hidden />
              <Pipe active={lines[lane.key] && !tankLow} speed={lane.speed} drops={lane.drops} className="flex-1" />
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full border transition-colors duration-500 ${lines[lane.key] ? 'border-emerald-300/70 bg-emerald-400/50' : 'border-white/20 bg-white/5'}`} aria-hidden />
              <span className={`w-14 text-right font-mono text-[11px] ${lines[lane.key] ? 'text-cyan-200' : 'text-white/40'}`}>
                {lines[lane.key] ? (tankLow ? 'DRY' : 'FLOW') : 'CLOSED'}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-white/45" aria-live="polite">
        {tankLow
          ? 'Tank below 8%: flow is paused until the harvester refills it.'
          : anyOpen
            ? 'Watering. Soil probes update every 1.2 s.'
            : 'All lines closed. Run Data Fusion for a recommendation.'}
      </p>
    </GlassCard>
  )
}
