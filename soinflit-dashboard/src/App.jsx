import { useEffect, useState } from 'react'
import { MotionConfig, motion, useReducedMotion } from 'framer-motion'
import { Info } from 'lucide-react'
import Background from './components/Background'
import StatusBar from './components/StatusBar'
import DataFusion from './components/DataFusion'
import ImpactCounter from './components/ImpactCounter'
import HarvestTank from './components/HarvestTank'
import ValveController from './components/ValveController'
import SoilProbes from './components/SoilProbes'
import SatelliteMap from './components/SatelliteMap'
import NasaPowerPanel from './components/NasaPowerPanel'
import CatchmentAnalyzer from './components/CatchmentAnalyzer'
import DataSourceLibrary from './components/DataSourceLibrary'
import { useSimulation } from './lib/useSimulation'
import { EASE_OUT } from './lib/motion'

const TIERS = [
  ['01', 'NASA intelligence layer', 'SMAP · GPM IMERG · ECOSTRESS · NDVI'],
  ['02', 'Flood & rain harvesting', 'SRTM DEM · flow accumulation · wadi storage'],
  ['03', 'Smart filtration', 'Nano filters · sensor-gated sterilisation'],
  ['04', 'IoT & hardware', 'ESP32 valves, pumps & mesh'],
]

const NAV = [
  ['fusion', 'Data fusion'],
  ['water', 'Water system'],
  ['satellite', 'Satellite layers'],
  ['catchment', 'Rain catchment'],
  ['sources', 'Data sources'],
]

export default function App() {
  const [harvester, setHarvester] = useState(true)
  const [filtration, setFiltration] = useState(false)
  const [lines, setLines] = useState({ a: false, b: false, sub: false })
  const [stormRequested, setStormRequested] = useState(false)
  const [satLayer, setSatLayer] = useState('smap')
  const reduce = useReducedMotion()
  const sim = useSimulation({ harvester, filtration, lines, stormRequested })
  const setLine = (k, v) => setLines((l) => ({ ...l, [k]: v }))
  const tankLow = sim.level <= 0.07

  // The simulation latches a storm request on its next tick; clear it once the storm starts.
  useEffect(() => {
    if (stormRequested && sim.stormTicks > 0) setStormRequested(false)
  }, [stormRequested, sim.stormTicks])

  function showSatellite(layer) {
    setSatLayer(layer)
    document.getElementById('satellite')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <MotionConfig reducedMotion="user">
      <Background />
      <a href="#main" className="focus-ring sr-only z-50 rounded-full bg-white px-4 py-2 text-sm text-black focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:inline-flex focus:min-h-[44px] focus:items-center">
        Skip to dashboard
      </a>
      <div id="top" />
      <StatusBar sim={sim} />

      <main id="main" className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:pt-12">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.1 }}
          className="mb-8 grid gap-5 lg:mb-10 lg:grid-cols-[1.4fr_1fr] lg:items-end"
        >
          <div>
            <p className="eyebrow !text-cyan-200/80">NASA Space Apps 2026 · Adapting Farms with NASA Data</p>
            <h1 className="mt-3 text-[34px] font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl">
              Every drop,{' '}
              <span className="bg-gradient-to-r from-[#00F2FE] via-[#5eead4] to-[#F59E0B] bg-clip-text text-transparent">
                verified from orbit.
              </span>
            </h1>
          </div>
          <div>
            <p className="text-[15px] leading-relaxed text-white/65">
              SoinFlit fuses NASA satellite data with ESP32 ground probes to decide when a field in Oman gets water. It
              harvests that water from desert air and flash floods, purifies it with space-grade nanomaterials and runs
              the whole station on solar.
            </p>
            <p className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-300/25 bg-amber-400/[0.07] px-3 py-2 text-xs leading-relaxed text-amber-100/90">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              Demo mode: every reading on this page is simulated. No live satellite granules or sensor feeds are connected.
            </p>
          </div>
          <nav aria-label="Dashboard sections" className="lg:col-span-2">
            <ul className="flex flex-wrap gap-2">
              {NAV.map(([id, label]) => (
                <li key={id}>
                  <a href={`#${id}`} className="focus-ring inline-flex min-h-[44px] items-center rounded-full border border-white/15 bg-white/[0.04] px-4 text-xs font-medium text-white/70 backdrop-blur transition-colors hover:border-cyan-200/40 hover:text-white">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </motion.section>

        <div className="grid gap-6 lg:grid-cols-12 [&>[id]]:scroll-mt-6 xl:[&>[id]]:scroll-mt-28">
          <div id="fusion" className="col-span-full -mb-6 h-0" aria-hidden />
          <DataFusion
            index={1}
            sim={sim}
            lines={lines}
            onApply={() => setLines((l) => ({ ...l, a: true, b: true }))}
            className="lg:col-span-8"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-1">
            <ImpactCounter sim={sim} index={2} />
          </div>

          <div id="water" className="col-span-full -mb-6 h-0" aria-hidden />
          <HarvestTank
            index={3}
            sim={sim}
            harvester={harvester}
            filtration={filtration}
            setHarvester={setHarvester}
            setFiltration={setFiltration}
            className="lg:col-span-4 xl:col-span-3"
          />
          <ValveController index={4} lines={lines} setLine={setLine} tankLow={tankLow} className="lg:col-span-5 xl:col-span-6" />
          <SoilProbes index={5} sim={sim} lines={lines} className="lg:col-span-3" />

          <div id="satellite" className="col-span-full -mb-6 h-0" aria-hidden />
          <SatelliteMap index={6} sim={sim} layerId={satLayer} setLayerId={setSatLayer} className="lg:col-span-7 xl:col-span-8" />
          <NasaPowerPanel index={7} sim={sim} onStorm={() => setStormRequested(true)} className="lg:col-span-5 xl:col-span-4" />

          <div id="catchment" className="col-span-full -mb-6 h-0" aria-hidden />
          <CatchmentAnalyzer index={8} sim={sim} onSatellite={showSatellite} className="lg:col-span-12" />

          <div id="sources" className="col-span-full -mb-6 h-0" aria-hidden />
          <DataSourceLibrary index={9} className="lg:col-span-12" />
        </div>

        <footer className="mt-12 border-t border-white/10 pt-8">
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {TIERS.map(([n, title, sub]) => (
              <li key={n} className="glass !rounded-2xl px-4 py-3">
                <p className="font-mono text-[11px] text-cyan-300">TIER {n}</p>
                <p className="text-sm font-medium text-white">{title}</p>
                <p className="text-xs text-white/50">{sub}</p>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-col gap-3 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
            <p>SoinFlit · Smart Soil Hydration · NASA Space Apps Challenge 2026, Oman. Prototype dashboard with simulated telemetry.</p>
            <nav aria-label="NASA data sources" className="flex flex-wrap gap-x-1">
              {[
                ['Earthdata Search', 'https://search.earthdata.nasa.gov'],
                ['NASA POWER', 'https://power.larc.nasa.gov'],
                ['Worldview', 'https://worldview.earthdata.nasa.gov'],
                ['Oman NSA Geoportal', 'https://nsaomangeoportal.gov.om/'],
              ].map(([label, href]) => (
                <a key={href} href={href} target="_blank" rel="noreferrer" className="focus-ring inline-flex min-h-[44px] items-center rounded-full px-2.5 text-white/60 underline-offset-4 hover:text-cyan-200 hover:underline">
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </footer>
      </main>
    </MotionConfig>
  )
}
