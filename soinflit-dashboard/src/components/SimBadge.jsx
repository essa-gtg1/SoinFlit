export default function SimBadge({ label = 'Simulated', className = '' }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-400/10 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-amber-200 ${className}`}
      title="Mock telemetry: not connected to live NASA or ESP32 data"
    >
      <span className="anim-blink h-1.5 w-1.5 rounded-full bg-amber-300" aria-hidden />
      {label}
    </span>
  )
}
