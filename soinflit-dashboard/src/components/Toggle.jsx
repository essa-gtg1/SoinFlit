import { motion } from 'framer-motion'
import { knobSpring } from '../lib/motion'

const tones = {
  cyan: { fill: 'bg-cyan-400/30', ring: 'border-cyan-300/60', knob: 'shadow-[0_0_14px_rgba(0,242,254,0.85)]', icon: 'text-cyan-300' },
  emerald: { fill: 'bg-emerald-400/30', ring: 'border-emerald-300/60', knob: 'shadow-[0_0_14px_rgba(16,185,129,0.85)]', icon: 'text-emerald-300' },
  amber: { fill: 'bg-amber-400/30', ring: 'border-amber-300/60', knob: 'shadow-[0_0_14px_rgba(245,158,11,0.85)]', icon: 'text-amber-300' },
}

// Tactile liquid-glass switch. The whole row is the hit target (≥44px) and a real role="switch".
export default function Toggle({ checked, onChange, label, description, icon: Icon, tone = 'cyan', disabled = false }) {
  const t = tones[tone]
  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      whileTap={{ scale: 0.97 }}
      transition={knobSpring}
      className="focus-ring group/t flex min-h-[48px] w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-left transition-colors duration-200 hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {Icon && (
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.05]">
          <Icon className={`h-[18px] w-[18px] transition-opacity duration-300 ${t.icon} ${checked ? 'opacity-100' : 'opacity-50'}`} aria-hidden />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium leading-snug text-white">{label}</span>
        {description && <span className="block text-xs leading-snug text-white/55">{description}</span>}
      </span>
      <span
        aria-hidden
        className={`relative flex h-7 w-[52px] shrink-0 items-center rounded-full border bg-white/[0.06] shadow-inner transition-colors duration-300 ${checked ? t.ring : 'border-white/15'}`}
      >
        <span className={`absolute inset-0 rounded-full transition-opacity duration-300 ${t.fill} ${checked ? 'opacity-100' : 'opacity-0'}`} />
        <motion.span
          layout
          transition={knobSpring}
          className={`relative mx-[3px] h-[20px] w-[20px] rounded-full bg-[radial-gradient(circle_at_35%_30%,#ffffff,#cfe9ff_45%,#7aa6c9)] ${checked ? `ml-auto ${t.knob}` : ''}`}
        />
      </span>
    </motion.button>
  )
}
