import { motion } from 'framer-motion'
import { CloudLightning, CloudSun, Droplet, Sun, Thermometer, Umbrella, Waves } from 'lucide-react'
import GlassCard, { CardHeader } from './GlassCard'
import SimBadge from './SimBadge'
import { floodThreat } from '../lib/useSimulation'
import { liquidSpring } from '../lib/motion'

const REQUEST =
  'power.larc.nasa.gov/api/temporal/daily/point?parameters=PRECTOTCORR,RH2M,T2M,ALLSKY_SFC_SW_DWN&community=AG&longitude=57&latitude=23&format=JSON'

const THREAT_STYLE = {
  emerald: { bar: 'bg-emerald-400', text: 'text-emerald-200', ring: 'border-emerald-300/30 bg-emerald-400/[0.07]' },
  amber: { bar: 'bg-amber-400', text: 'text-amber-200', ring: 'border-amber-300/40 bg-amber-400/10' },
  red: { bar: 'bg-red-400', text: 'text-red-200', ring: 'border-red-300/40 bg-red-500/10' },
}

function Row({ icon: Icon, code, label, value, unit }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
      <Icon className="h-4 w-4 shrink-0 text-cyan-300" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[11px] text-white/45">{code}</p>
        <p className="text-sm text-white/80">{label}</p>
      </div>
      <p className="telemetry shrink-0 text-lg text-white">
        {value}
        <span className="ml-1 text-xs text-white/50">{unit}</span>
      </p>
    </div>
  )
}

export default function NasaPowerPanel({ sim, onStorm, index, className = '' }) {
  const threat = floodThreat(sim)
  const t = THREAT_STYLE[threat.tone]
  const storming = sim.stormTicks > 0

  return (
    <GlassCard index={index} glow="amber" className={`flex flex-col p-5 sm:p-6 ${className}`} aria-labelledby="power-title">
      <CardHeader
        icon={CloudSun}
        tone="text-amber-300"
        eyebrow="NASA POWER · GPM · Oman FFG"
        title={<span id="power-title">Climate & flood watch</span>}
        right={<SimBadge label="Mock JSON" />}
      />
      <div className="grid gap-2">
        <Row icon={Thermometer} code="T2M" label="Air temperature at 2 m" value={sim.t2m.toFixed(1)} unit="°C" />
        <Row icon={Droplet} code="RH2M" label="Relative humidity at 2 m" value={sim.rh2m} unit="%" />
        <Row icon={Sun} code="ALLSKY_SFC_SW_DWN" label="Solar radiation" value={sim.solarRad.toFixed(1)} unit="kWh/m²/d" />
        <Row icon={Umbrella} code="PRECTOTCORR · IMERG" label="Rain, last 24 h" value={sim.rain24h.toFixed(1)} unit="mm" />
        <Row icon={Waves} code="WADI-FLOW" label="Flood channel → storage" value={sim.floodInflowLpm.toFixed(0)} unit="L/min" />
      </div>

      <div className={`mt-4 rounded-2xl border p-3.5 transition-colors duration-500 ${t.ring}`} aria-live="polite">
        <div className="flex items-center justify-between gap-2">
          <p className="eyebrow !text-[10px]">Flash-flood guidance · FFG-style</p>
          <p className={`font-mono text-xs font-semibold uppercase tracking-wider ${t.text}`}>{threat.level}</p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10" aria-hidden>
          <motion.div
            className={`h-full w-full origin-left rounded-full ${t.bar}`}
            initial={false}
            animate={{ scaleX: Math.min(1, threat.ratio) || 0.02 }}
            transition={{ type: 'spring', stiffness: 80, damping: 18 }}
          />
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-white/55">
          Rain rate <span className="font-mono text-white/80">{sim.rainRate.toFixed(1)} mm/h</span> against a{' '}
          <span className="font-mono text-white/80">{threat.threshold.toFixed(0)} mm/h</span> threshold that drops as soil saturates.
          Official warnings come from Oman Meteorology.
        </p>
      </div>

      <motion.button
        type="button"
        onClick={onStorm}
        disabled={storming}
        whileTap={{ scale: 0.96 }}
        transition={liquidSpring}
        className="focus-ring mt-3 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-sky-300/40 bg-sky-400/15 px-5 text-sm font-semibold text-white shadow-[0_0_24px_-6px_rgba(96,165,250,0.7)] transition-opacity disabled:cursor-progress disabled:opacity-60"
      >
        <CloudLightning className="h-4 w-4" aria-hidden />
        {storming ? `Storm in progress · ${Math.ceil(sim.stormTicks * 1.2)} s` : 'Simulate storm event'}
      </motion.button>

      <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-black/20 p-3">
        <p className="eyebrow mb-1 !text-[10px]">Pipeline · request shape</p>
        <code className="block break-all font-mono text-[11px] leading-relaxed text-cyan-100/80">{REQUEST}</code>
        <p className="mt-2 text-[11px] leading-relaxed text-white/45">
          NASA Earthdata / POWER JSON → cloud backend → SoinFlit app & ESP32 controller. Values shown are mocked in the same shape.
        </p>
      </div>
    </GlassCard>
  )
}
