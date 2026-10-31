# SoinFlit · Smart Soil Hydration

NASA Space Apps Challenge 2026 (Oman) mission dashboard. It fuses NASA satellite data (SMAP, GPM IMERG, MODIS) with
ESP32 ground sensors, atmospheric water harvesting, flood/rain storage and nano-filtration.

- Live satellite layers from NASA GIBS and real SRTM-based terrain for the Oman rain-catchment analysis
- Field telemetry (tank, soil probes, battery, valves) is **simulated** for the demo

The app lives in [`soinflit-dashboard/`](soinflit-dashboard/). See its README for structure and data notes.

```bash
cd soinflit-dashboard
npm install
npm run dev
```

Every push to `main` builds and deploys the site to GitHub Pages (`.github/workflows/deploy.yml`).
