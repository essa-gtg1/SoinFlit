import { motion } from 'framer-motion'
import { Droplet, MapPin, Radio, Sun } from 'lucide-react'
import { FIELD } from '../lib/useSimulation'
import { EASE_OUT } from '../lib/motion'
import SimBadge from './SimBadge'

function BatteryRing({ pct }) {
  const r = 17
  const circ = 2 * Math.PI * r
  const fillY = 40 - (pct / 100) * 32 - 4
  return (
    <div className="relative h-11 w-11 shrink-0" role="img" aria-label={`Battery ${pct.toFixed(0)} percent`}>
      <span className="anim-pulse-ring absolute inset-0 rounded-full border-2 border-amber-400/70" aria-hidden />
      <svg viewBox="0 0 40 40" className="relative h-11 w-11 -rotate-90" aria-hidden>
        <defs>
          <clipPath id="batt-clip">
            <circle cx="20" cy="20" r="13" />
          </clipPath>
          <linearGradient id="batt-liquid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FCD34D" />
            <stop offset="1" stopColor="#B45309" />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
        <circle
          cx="20" cy="20" r={r} fill="none" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
          style={{ filter: 'drop-shadow(0 0 4px rgba(245,158,11,0.9))', transition: 'stroke-dashoffset 1s cubic-bezier(.22,1,.36,1)' }}
        />
        {/* liquid fill, drawn in un-rotated space */}
        <g transform="rotate(90 20 20)" clipPath="url(#batt-clip)">
          <rect x="0" y="0" width="40" height="40" fill="rgba(245,158,11,0.08)" />
          <g style={{ transform: `translateY(${fillY}px)`, transition: 'transform 1s cubic-bezier(.22,1,.36,1)' }}>
            <path className="anim-wave" d="M-80 4 Q-70 0 -60 4 T-40 4 T-20 4 T0 4 T20 4 T40 4 T60 4 L60 60 L-80 60Z" fill="url(#batt-liquid)" opacity="0.9" />
          </g>
        </g>
      </svg>
    </div>
  )
}

function Divider() {
  return <span aria-hidden className="hidden h-8 w-px bg-white/10 xl:block" />
}

export default function StatusBar({ sim }) {
  const netZero = sim.solarW >= sim.loadW
  return (
    <header className="px-4 pt-4 sm:px-6 xl:sticky xl:top-4 xl:z-40">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        className="glass mx-auto grid max-w-7xl grid-cols-2 items-center gap-x-4 gap-y-3 !rounded-[28px] px-4 py-3 sm:grid-cols-3 xl:flex xl:!rounded-full xl:px-6 xl:py-2.5"
      >
        <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-3 xl:col-span-1 xl:mr-auto">
          <a href="#top" className="focus-ring flex min-h-[44px] items-center gap-2.5 rounded-full pr-2">
            <span className="relative grid h-9 w-9 place-items-center rounded-full bg-cyan-400/15 shadow-[0_0_24px_rgba(0,242,254,0.45)]">
              <Droplet className="h-[18px] w-[18px] text-cyan-300" aria-hidden />
            </span>
            <span className="leading-tight">
              <span className="block text-[15px] font-semibold tracking-tight">SoinFlit</span>
              <span className="block text-[11px] text-white/55">Smart Soil Hydration</span>
            </span>
          </a>
          <SimBadge className="xl:hidden" label="Simulated telemetry" />
        </div>

        <div className="flex items-center gap-2.5">
          <MapPin className="h-4 w-4 shrink-0 text-cyan-300" aria-hidden />
          <div className="leading-tight">
            <p className="telemetry text-[13px] text-white">Lat {FIELD.lat.toFixed(0)}° N · Lon {FIELD.lon.toFixed(0)}° E</p>
            <p className="text-[11px] text-white/55">Field node GPS · {FIELD.region}</p>
          </div>
        </div>
        <Divider />

        <div className="flex items-center gap-2.5">
          <BatteryRing pct={sim.battery} />
          <div className="leading-tight">
            <p className="telemetry-amber text-[13px] text-amber-100">{sim.battery.toFixed(1)}%</p>
            <p className="text-[11px] text-white/55">Solar low-power IoT</p>
          </div>
        </div>
        <Divider />

        <div className="flex items-center gap-2.5">
          <Sun className="h-4 w-4 shrink-0 text-amber-300" aria-hidden />
          <div className="leading-tight">
            <p className="font-mono text-[13px] tabular-nums text-white">
              +{sim.solarW.toFixed(1)} W <span className="text-white/40">/</span> −{sim.loadW.toFixed(1)} W
            </p>
            <p className={`text-[11px] ${netZero ? 'text-emerald-300' : 'text-amber-300'}`}>
              {netZero ? 'Net-zero · surplus charging' : 'Drawing from battery'}
            </p>
          </div>
        </div>
        <Divider />

        <div className="flex items-center gap-2.5">
          <span className="relative grid h-4 w-4 shrink-0 place-items-center">
            <span className="anim-pulse-ring absolute inset-0 rounded-full bg-emerald-400/40" aria-hidden />
            <Radio className="relative h-4 w-4 text-emerald-300" aria-hidden />
          </span>
          <div className="leading-tight">
            <p className="font-mono text-[13px] tabular-nums text-white">
              ESP32 mesh {sim.nodesOnline}/{sim.nodesTotal}
            </p>
            <p className="text-[11px] text-white/55">Online · {sim.rssi} dBm</p>
          </div>
        </div>

        <SimBadge className="hidden xl:ml-2 xl:inline-flex" />
      </motion.div>
    </header>
  )
}
