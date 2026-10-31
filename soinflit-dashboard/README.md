# SoinFlit · Smart Soil Hydration dashboard

NASA Space Apps Challenge 2026 (Oman). This is the mission dashboard for SoinFlit. It fuses NASA SMAP, ECOSTRESS and MODIS
data with ESP32 ground probes, atmospheric water harvesting, flood/rain storage and nano-filtration.

> **All telemetry is simulated.** `src/lib/useSimulation.js` generates plausible values for the field at 23° N, 57° E.
> No live NASA granules or sensor feeds are connected. Replace `tick` with real NASA POWER / Earthdata fetches
> and ESP32 MQTT/HTTP readings to go live.

## Run

```bash
npm install
npm run dev
```

Then open http://localhost:5173. `npm run build` produces a static bundle in `dist/`.

## Stack

React 18 · Vite 5 · Tailwind CSS 3 · Framer Motion 11 · Lucide icons · Leaflet 1.9 / react-leaflet 4

## Structure

| File | Widget |
|---|---|
| `components/StatusBar.jsx` | Floating glass pill: GPS, solar battery ring, net-zero power, ESP32 mesh |
| `components/DataFusion.jsx` | Hero: SMAP/ECOSTRESS orb + ESP32 orb merge (SVG goo filter) → confidence + irrigation decision |
| `components/HarvestTank.jsx` | Glass tank with SVG waves, superhydrophobic harvester + nano-filtration toggles, bubbles |
| `components/ValveController.jsx` | ESP32 valves/pump with droplets flowing through translucent pipes, tank → soil |
| `components/SoilProbes.jsx` | Capacitive probe columns per zone with 22–28% VWC target band |
| `components/SatelliteMap.jsx` | Real NASA GIBS layers on a 3D-tilted glass Leaflet map, with opacity, labels, official legends, role, caveat and source link |
| `components/GlassMap.jsx` | Leaflet map in a liquid-glass frame: tilts at rest, springs flat on touch/focus |
| `lib/maps.js` | GIBS layer config, basemap, Omani study areas and the real-DEM loader |
| `components/NasaPowerPanel.jsx` | Climate & flood watch: NASA POWER (T2M, RH2M, PRECTOTCORR, ALLSKY_SFC_SW_DWN), storm simulator, FFG-style flash-flood threat |
| `components/CatchmentAnalyzer.jsx` | Oman rain-catchment analyzer on real SRTM terrain: 4 study areas, the 8-step workflow, question→layer guide, ranked sites with coordinates |
| `components/DataSourceLibrary.jsx` | Every NASA, USGS and Omani source from the project documents, filterable |
| `lib/hydrology.js` | Priority-flood sink fill, D8 flow direction, flow accumulation, watersheds, slope, site ranking |
| `lib/sources.js` | Source catalogue shared by the map and the library |
| `components/ImpactCounter.jsx` | Animated litres-saved and hectares-restored counters |
| `components/GlassCard.jsx`, `Toggle.jsx`, `SimBadge.jsx`, `Background.jsx` | Liquid-glass system pieces |

## Data notes

- The irrigation decision weights in-field ESP32 probes at 60%. SMAP (20%), GPM rain credit (10%), ECOSTRESS and NDVI (5% each)
  add context. As the data-source guide stresses, no single satellite map decides irrigation.
- **Real maps.** The satellite layer switcher streams live NASA GIBS tiles (SMAP L4 surface/root-zone soil moisture, GPM IMERG
  daily rain including Cyclone Shaheen on 3 Oct 2021, MODIS LST, MODIS NDVI, ASTER GDEM relief, MODIS IGBP land cover)
  over Esri World Imagery. Legend colours come from the official GIBS colormaps. ECOSTRESS is not on GIBS, so MODIS LST stands in.
- **Real terrain.** The catchment analyzer downloads SRTM-based elevation (AWS Terrain Tiles, zoom 12) for the chosen Omani
  study area and runs priority-flood fill, D8 flow, accumulation, watersheds and slope in the browser. Results are first
  indications; verify in the field and with Omani authorities (Oman Meteorology FFG, NSA Geoportal).
- The maps need an internet connection. Field telemetry (tank, probes, battery, storm) is still simulated.

## Motion & accessibility

- Looping motion is defined only inside `@media (prefers-reduced-motion: no-preference)`. Framer Motion runs with
  `reducedMotion="user"`, so reduced-motion users get instant state changes and static, readable visuals.
- Animations use transform and opacity only. Entrances use ease-out and touch feedback uses springs.
- Every control is a native button (switches use `role="switch"`, and the map uses an arrow-key tablist) with a visible focus ring
  and a hit area of at least 44 px.
