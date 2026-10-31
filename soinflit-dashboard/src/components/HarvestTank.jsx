import { motion } from 'framer-motion'
import { CloudRain, Filter, Wind } from 'lucide-react'
import GlassCard, { CardHeader } from './GlassCard'
import SimBadge from './SimBadge'
import Toggle from './Toggle'
import { TANK_CAPACITY_L } from '../lib/useSimulation'

const TOP = 34
const DEPTH = 282
const wave = (() => {
  let d = 'M -80 6'
  for (let x = -80; x < 220; x += 40) d += x === -80 ? ' Q -60 0 -40 6' : ` T ${x + 40} 6`
  return d + ' L 220 420 L -80 420 Z'
})()

const BUBBLES = [
  { x: 40, r: 2.2, dur: 3.4, delay: 0 },
  { x: 58, r: 1.5, dur: 2.6, delay: 0.8 },
  { x: 72, r: 2.8, dur: 3.9, delay: 1.6 },
  { x: 88, r: 1.8, dur: 2.9, delay: 0.4 },
  { x: 100, r: 2.4, dur: 3.6, delay: 2.1 },
  { x: 50, r: 1.2, dur: 2.2, delay: 1.2 },
  { x: 82, r: 1.4, dur: 2.4, delay: 2.6 },
  { x: 64, r: 2, dur: 3.1, delay: 0.2 },
]
const DRIPS = [36, 54, 70, 86, 104]

function Stat({ label, value, unit, tone = 'telemetry' }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <p className="text-[11px] text-white/55">{label}</p>
      <p className={`${tone} text-base text-white`}>
        {value}
        <span className="ml-1 text-[11px] text-white/50">{unit}</span>
      </p>
    </div>
  )
}

export default function HarvestTank({ sim, harvester, filtration, setHarvester, setFiltration, index, className = '' }) {
  const liquidTop = TOP + (1 - sim.level) * DEPTH
  // 0 = murky source water, 1 = nano-filtered irrigation grade
  const clarity = Math.min(1, Math.max(0, (34.2 - sim.ntu) / 33.6))
  const safe = sim.ntu < 5

  return (
    <GlassCard index={index} glow="cyan" className={`p-5 ${className}`} aria-labelledby="tank-title">
      <CardHeader
        icon={CloudRain}
        eyebrow="Tier 2–3 · Harvest & purify"
        title={<span id="tank-title">Harvest tank</span>}
        right={<SimBadge label="Sim" />}
      />

      <div className="flex items-stretch gap-4">
        <svg
          viewBox="0 0 140 330"
          className="h-[300px] w-[128px] shrink-0 overflow-visible"
          role="img"
          aria-label={`Tank ${Math.round(sim.level * 100)} percent full, turbidity ${sim.ntu.toFixed(1)} NTU`}
        >
          <defs>
            <clipPath id="tank-clip">
              <rect x="24" y="34" width="92" height="282" rx="20" />
            </clipPath>
            <linearGradient id="murky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#c08a3e" stopOpacity="0.85" />
              <stop offset="0.55" stopColor="#5b6b7d" stopOpacity="0.9" />
              <stop offset="1" stopColor="#24395a" />
            </linearGradient>
            <linearGradient id="clear" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#a5fbff" />
              <stop offset="0.4" stopColor="#00F2FE" stopOpacity="0.85" />
              <stop offset="1" stopColor="#0369a1" />
            </linearGradient>
            <linearGradient id="glass-sheen" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
              <stop offset="0.25" stopColor="#fff" stopOpacity="0.02" />
              <stop offset="1" stopColor="#fff" stopOpacity="0.06" />
            </linearGradient>
            <pattern id="mesh" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(0,242,254,0.6)" strokeWidth="1" />
            </pattern>
          </defs>

          {/* superhydrophobic condenser panel */}
          <rect x="18" y="4" width="104" height="18" rx="9" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.2)" />
          <rect x="22" y="8" width="96" height="10" rx="5" fill="url(#mesh)" opacity={harvester ? 1 : 0.25} style={{ transition: 'opacity .6s' }} />

          {/* glass body */}
          <rect x="20" y="30" width="100" height="290" rx="24" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />

          <g clipPath="url(#tank-clip)">
            <motion.g initial={false} animate={{ y: liquidTop - 6 }} transition={{ type: 'spring', stiffness: 40, damping: 16 }}>
              <path className="anim-wave-slow" d={wave} fill="url(#murky)" opacity="0.55" />
              <g transform="translate(-20 3)"><path className="anim-wave" d={wave} fill="url(#murky)" /></g>
              <motion.g initial={false} animate={{ opacity: clarity }} transition={{ duration: 1.1 }}>
                <path className="anim-wave-slow" d={wave} fill="url(#clear)" opacity="0.6" />
                <g transform="translate(-20 3)"><path className="anim-wave" d={wave} fill="url(#clear)" /></g>
              </motion.g>
            </motion.g>

            {filtration && BUBBLES.map((b, i) => (
              <circle
                key={i}
                cx={b.x}
                cy={312}
                r={b.r}
                fill="rgba(220,255,255,0.85)"
                className="anim-bubble motion-reduce:hidden"
                style={{ '--rise': `${Math.max(0, 312 - liquidTop - 8)}px`, '--dur': `${b.dur}s`, animationDelay: `${b.delay}s`, transformBox: 'fill-box', transformOrigin: 'center', opacity: 0 }}
              />
            ))}
          </g>

          {harvester && DRIPS.map((x, i) => (
            <path
              key={x}
              d={`M ${x} 24 q 3 5 0 7 q -3 -2 0 -7z`}
              fill="#9ffcff"
              className="anim-drip motion-reduce:hidden"
              style={{ '--fall': `${Math.max(8, liquidTop - 26)}px`, '--dur': `${1.4 + (i % 3) * 0.35}s`, animationDelay: `${i * 0.33}s`, opacity: 0 }}
            />
          ))}

          {/* sheen + graduations */}
          <rect x="20" y="30" width="100" height="290" rx="24" fill="url(#glass-sheen)" pointerEvents="none" />
          {[0.25, 0.5, 0.75].map((f) => (
            <g key={f}>
              <line x1="108" x2="116" y1={TOP + (1 - f) * DEPTH} y2={TOP + (1 - f) * DEPTH} stroke="rgba(255,255,255,0.4)" />
              <text x="128" y={TOP + (1 - f) * DEPTH + 3} fontSize="8" fill="rgba(255,255,255,0.5)" fontFamily="JetBrains Mono">
                {f * 100}
              </text>
            </g>
          ))}
        </svg>

        <div className="grid min-w-0 flex-1 content-start gap-2">
          <Stat label="Level" value={(sim.level * 100).toFixed(0)} unit="%" />
          <Stat label="Stored" value={Math.round(sim.level * TANK_CAPACITY_L).toLocaleString()} unit="L" />
          <Stat label="Turbidity" value={sim.ntu.toFixed(1)} unit="NTU" tone={safe ? 'telemetry' : 'telemetry-amber'} />
          <Stat label="Air-to-water" value={sim.yieldLph.toFixed(1)} unit="L/h" />
          <p className={`rounded-full px-2.5 py-1 text-center text-[11px] font-medium ${safe ? 'bg-cyan-400/15 text-cyan-200' : 'bg-amber-400/15 text-amber-200'}`}>
            {safe ? 'Irrigation-grade' : 'Untreated · hold'}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-1 border-t border-white/10 pt-3">
        <Toggle
          checked={harvester}
          onChange={setHarvester}
          icon={Wind}
          label="Space-Grade Superhydrophobic Harvester"
          description="Condenses humidity on satellite-insulation nanomaterial"
        />
        <Toggle
          checked={filtration}
          onChange={setFiltration}
          icon={Filter}
          label="Nano-Filtration"
          description="Nano filters + sensor-gated sterilisation"
        />
      </div>
    </GlassCard>
  )
}
