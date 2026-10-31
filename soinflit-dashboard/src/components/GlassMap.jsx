import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import { BASEMAP } from '../lib/maps'
import { liquidSpring } from '../lib/motion'

// Leaflet's container is keyboard-focusable (arrow keys pan, +/− zoom); give it a name for screen readers.
function MapA11y({ label }) {
  const map = useMap()
  useEffect(() => {
    const el = map.getContainer()
    el.setAttribute('role', 'region')
    el.setAttribute('aria-label', `${label}. Use arrow keys to pan, plus and minus to zoom.`)
  }, [map, label])
  return null
}

// Fly to a new view whenever `center`/`zoom` change after mount.
export function FlyTo({ center, zoom, bounds }) {
  const map = useMap()
  const reduce = useReducedMotion()
  const key = bounds ? bounds.flat().join(',') : `${center}|${zoom}`
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { animate: !reduce, padding: [8, 8] })
    else if (center) map.flyTo(center, zoom, { animate: !reduce, duration: 0.9 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return null
}

// Real slippy map in a liquid-glass frame. At rest it leans back in 3D; on pointer or keyboard focus it
// springs flat so pans, zooms and clicks land exactly where the user aims.
export default function GlassMap({ center, zoom, label, children, className = '', height = 'h-[320px] sm:h-[380px]' }) {
  const reduce = useReducedMotion()
  const [engaged, setEngaged] = useState(false)

  return (
    <div
      className={`[perspective:1200px] ${className}`}
      onPointerEnter={() => setEngaged(true)}
      onPointerLeave={() => setEngaged(false)}
      onFocusCapture={() => setEngaged(true)}
      onBlurCapture={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setEngaged(false) }}
    >
      <motion.div
        initial={false}
        animate={{ rotateX: engaged || reduce ? 0 : 12, scale: engaged ? 1 : 0.985 }}
        transition={liquidSpring}
        style={{ transformOrigin: '50% 100%' }}
        className="relative isolate overflow-hidden rounded-[22px] border border-white/15 bg-[#06101f] shadow-[0_30px_60px_-30px_rgba(0,242,254,0.4)]"
      >
        <MapContainer
          center={center}
          zoom={zoom}
          className={`glass-map w-full ${height}`}
          scrollWheelZoom={false}
          zoomSnap={0.25}
          zoomAnimation={!reduce}
          fadeAnimation={!reduce}
          markerZoomAnimation={!reduce}
          worldCopyJump
        >
          <MapA11y label={label} />
          <TileLayer url={BASEMAP.url} attribution={BASEMAP.attribution} maxNativeZoom={BASEMAP.maxNativeZoom} maxZoom={18} />
          {children}
        </MapContainer>
        <div className="pointer-events-none absolute inset-0 z-[500] rounded-[22px] bg-[linear-gradient(135deg,rgba(255,255,255,0.16),transparent_30%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]" />
      </motion.div>
    </div>
  )
}
