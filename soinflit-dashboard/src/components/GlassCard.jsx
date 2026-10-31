import { motion } from 'framer-motion'
import { enter, liquidSpring } from '../lib/motion'

const glows = {
  cyan: 'shadow-[inset_0_0_0_1px_rgba(0,242,254,0.45),0_0_40px_-8px_rgba(0,242,254,0.35)]',
  emerald: 'shadow-[inset_0_0_0_1px_rgba(16,185,129,0.5),0_0_40px_-8px_rgba(5,150,105,0.4)]',
  amber: 'shadow-[inset_0_0_0_1px_rgba(245,158,11,0.5),0_0_40px_-8px_rgba(245,158,11,0.35)]',
}

// Hover feels like touching a liquid surface: a spring-y swell plus a border glow that fades in.
export default function GlassCard({ as = 'section', glow = 'cyan', index = 0, className = '', children, ...rest }) {
  const Comp = motion[as]
  return (
    <Comp
      variants={enter}
      initial="hidden"
      animate="show"
      custom={index}
      whileHover={{ scale: 1.008, y: -2 }}
      transition={liquidSpring}
      className={`glass group ${className}`}
      {...rest}
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100 ${glows[glow]}`}
      />
      <div className="relative z-[1] h-full">{children}</div>
    </Comp>
  )
}

export function CardHeader({ icon: Icon, eyebrow, title, right, tone = 'text-cyan-300' }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] shadow-inner">
            <Icon className={`h-5 w-5 ${tone}`} aria-hidden />
          </span>
        )}
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2 className="text-base leading-snug font-semibold tracking-tight text-white sm:text-lg">{title}</h2>
        </div>
      </div>
      {right}
    </div>
  )
}
