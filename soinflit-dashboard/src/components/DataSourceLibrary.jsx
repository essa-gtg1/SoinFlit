import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, ExternalLink } from 'lucide-react'
import GlassCard, { CardHeader } from './GlassCard'
import { GROUPS, SOURCES } from '../lib/sources'
import { EASE_OUT } from '../lib/motion'

const GROUP_STYLE = {
  core: { label: 'Prototype core', cls: 'border-cyan-300/30 bg-cyan-400/10 text-cyan-200' },
  support: { label: 'Supporting', cls: 'border-white/20 bg-white/[0.06] text-white/70' },
  oman: { label: 'Oman', cls: 'border-emerald-300/30 bg-emerald-400/10 text-emerald-200' },
  tool: { label: 'Tool', cls: 'border-amber-300/30 bg-amber-400/10 text-amber-200' },
}

export default function DataSourceLibrary({ index, className = '' }) {
  const [group, setGroup] = useState('all')
  const list = SOURCES.filter((s) => group === 'all' || s.group === group)

  return (
    <GlassCard index={index} className={`p-5 sm:p-7 ${className}`} aria-labelledby="lib-title">
      <CardHeader icon={BookOpen} eyebrow="Spatial data sources" title={<span id="lib-title">Data source library</span>} />
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <p className="max-w-2xl text-sm leading-relaxed text-white/65">
          The four core NASA datasets drive the prototype. DEM, land cover and climate layers support site selection and
          scale-up, and the Omani national sources anchor the work locally. No single map decides irrigation: the in-field
          sensors do.
        </p>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter sources">
          {GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              aria-pressed={group === g.id}
              onClick={() => setGroup(g.id)}
              className={`focus-ring relative min-h-[44px] rounded-full px-4 text-xs font-medium transition-colors ${
                group === g.id ? 'text-white' : 'text-white/55 hover:text-white'
              }`}
            >
              {group === g.id && (
                <motion.span layoutId="lib-pill" className="absolute inset-0 rounded-full border border-cyan-200/40 bg-cyan-400/15" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
              )}
              <span className="relative">{g.label}</span>
            </button>
          ))}
        </div>
      </div>

      <motion.ul layout className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {list.map((s) => (
            <motion.li
              key={s.id}
              layout
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              className="flex flex-col rounded-[20px] border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{s.name}</p>
                  <p className="text-xs text-white/55">{s.product}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${GROUP_STYLE[s.group].cls}`}>
                  {GROUP_STYLE[s.group].label}
                </span>
              </div>
              <p className="mt-2 font-mono text-[11px] text-cyan-200/80">{s.resolution}</p>
              <p className="mt-2 text-xs leading-relaxed text-white/70">{s.role}</p>
              <p className="mt-2 text-[11px] leading-relaxed text-amber-100/70">⚠ {s.caveat}</p>
              <a
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="focus-ring mt-auto inline-flex min-h-[44px] items-center gap-1.5 self-start rounded-full pt-2 text-xs font-medium text-white/75 underline-offset-4 hover:text-cyan-200 hover:underline"
              >
                Open source <ExternalLink className="h-3 w-3" aria-hidden />
                <span className="sr-only"> for {s.name} (opens in a new tab)</span>
              </a>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </GlassCard>
  )
}
