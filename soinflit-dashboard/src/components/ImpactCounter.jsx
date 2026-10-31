import { useEffect, useRef } from 'react'
import { animate, useInView, useReducedMotion } from 'framer-motion'
import { Droplets, Leaf } from 'lucide-react'
import GlassCard from './GlassCard'
import SimBadge from './SimBadge'

function Counter({ value, decimals = 0 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const reduce = useReducedMotion()
  const shown = useRef(0)
  const fmt = (v) => v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

  useEffect(() => {
    if (!inView || !ref.current) return
    if (reduce) {
      shown.current = value
      ref.current.textContent = fmt(value)
      return
    }
    // First reveal counts up from zero; later live updates glide from the last shown value.
    const controls = animate(shown.current, value, {
      duration: shown.current === 0 ? 2.2 : 1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        shown.current = v
        if (ref.current) ref.current.textContent = fmt(v)
      },
    })
    return () => controls.stop()
  }, [value, inView, reduce])

  return <span ref={ref}>0</span>
}

function ImpactCard({ icon: Icon, tone, glow, label, value, unit, decimals, note, index }) {
  return (
    <GlassCard index={index} glow={glow} className="p-5" aria-label={label}>
      <div className="flex items-center justify-between gap-2">
        <span className={`grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] ${tone}`}>
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <SimBadge label="Projected · sim" />
      </div>
      <p className="mt-4 text-sm text-white/65">{label}</p>
      <p className="telemetry mt-1 text-[32px] font-semibold leading-none tracking-tight text-white sm:text-4xl">
        <Counter value={value} decimals={decimals} />
        <span className="ml-1.5 text-base font-normal text-white/55">{unit}</span>
      </p>
      <p className="mt-2 text-xs leading-relaxed text-white/45">{note}</p>
    </GlassCard>
  )
}

export default function ImpactCounter({ sim, index = 0 }) {
  return (
    <>
      <ImpactCard
        index={index}
        icon={Droplets}
        tone="text-cyan-300"
        glow="cyan"
        label="Liters of Water Saved"
        value={Math.round(sim.litersSaved)}
        unit="L"
        note="Versus flood irrigation, across the pilot network. Rises live while any drip line runs."
      />
      <ImpactCard
        index={index + 1}
        icon={Leaf}
        tone="text-emerald-300"
        glow="emerald"
        label="Hectares Restored"
        value={sim.hectares}
        decimals={1}
        unit="ha"
        note="Saline or degraded soil brought back inside its moisture and EC targets."
      />
    </>
  )
}
