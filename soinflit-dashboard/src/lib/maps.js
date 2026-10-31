// Real map sources. NASA GIBS serves the satellite products as Web-Mercator tiles (CORS-enabled),
// Esri World Imagery is the photo basemap, and the AWS Terrain Tiles (terrarium encoding, built
// largely from SRTM) give real elevation values for the catchment analysis.

export const FIELD_CENTER = [23.0, 57.0]

export const STUDY_AREAS = [
  { id: 'field', label: 'SoinFlit field', sub: 'Ad Dakhiliyah · 23.0° N 57.0° E', center: [23.0, 57.0] },
  { id: 'nizwa', label: 'Nizwa', sub: 'Hajar foothills', center: [22.93, 57.53] },
  { id: 'ibri', label: 'Ibri', sub: 'Adh Dhahirah plain', center: [23.23, 56.51] },
  { id: 'suwayq', label: 'As Suwayq', sub: 'Al Batinah coast', center: [23.85, 57.44] },
]

export const BASEMAP = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  attribution: 'Imagery © Esri, Maxar, Earthstar Geographics',
  maxNativeZoom: 18,
}

export const LABELS = {
  url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/Reference_Labels_15m/default/default/GoogleMapsCompatible_Level13/{z}/{y}/{x}.png',
  maxNativeZoom: 13,
}

const gibs = (layer, time, tms, ext) =>
  `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer}/default/${time}/GoogleMapsCompatible_Level${tms}/{z}/{y}/{x}.${ext}`

const GIBS_ATTR = 'NASA GIBS / Earthdata'

// Legend colours are sampled from the official GIBS colormaps (v1.3) for each product.
export const MAP_LAYERS = [
  {
    id: 'smap', tab: 'SMAP', title: 'Soil moisture', group: 'core', zoom: 7,
    modes: [
      { id: 'surface', label: 'Surface 0–5 cm', url: gibs('SMAP_L4_Analyzed_Surface_Soil_Moisture', 'default', 6, 'png'), native: 6, when: 'Latest daily (L4 analysed)', res: '9 km' },
      { id: 'deep', label: 'Root zone 0–100 cm', url: gibs('SMAP_L4_Analyzed_Root_Zone_Soil_Moisture', 'default', 6, 'png'), native: 6, when: 'Latest daily (L4 analysed)', res: '9 km' },
    ],
    legend: { kind: 'ramp', unit: 'm³/m³', stops: [['#fff600', '0.1'], ['#53a900', '0.2'], ['#00c78f', '0.3'], ['#00a0ff', '0.4'], ['#0000db', '0.5'], ['#060664', '0.6']] },
  },
  {
    id: 'gpm', tab: 'GPM', title: 'Rainfall', group: 'core', zoom: 6,
    modes: [
      { id: 'shaheen', label: 'Cyclone Shaheen · 3 Oct 2021', url: gibs('IMERG_Precipitation_Rate', '2021-10-03', 6, 'png'), native: 6, when: 'Daily IMERG, 2021-10-03', center: [23.6, 57.4] },
      { id: 'latest', label: 'Latest day', url: gibs('IMERG_Precipitation_Rate', 'default', 6, 'png'), native: 6, when: 'Latest daily IMERG' },
    ],
    legend: { kind: 'steps', unit: 'mm/h', stops: [['#86e0ee', '0.2'], ['#56c600', '0.5'], ['#4963ca', '1.3'], ['#ff6c1f', '3.4'], ['#720fdd', '8.4'], ['#9c0000', '20'], ['#3a0330', '≥53']] },
  },
  {
    id: 'ecostress', tab: 'LST', title: 'Land surface temperature', group: 'core', zoom: 8,
    modes: [{ id: 'lst', label: 'MODIS Terra LST · 8-day day', url: gibs('MODIS_Terra_L3_Land_Surface_Temp_8Day_Day', 'default', 7, 'png'), native: 7, when: 'Latest 8-day composite', res: '1 km' }],
    note: 'ECOSTRESS (~70 m) is not published on GIBS; MODIS LST shows the same variable at 1 km. Pull ECOSTRESS tiles via NASA AppEEARS.',
    legend: { kind: 'ramp', unit: '°C', stops: [['#21ffb3', '−10'], ['#a4ff00', '12'], ['#ffdc00', '34'], ['#ff6d00', '55'], ['#ff0100', '77']] },
  },
  {
    id: 'ndvi', tab: 'NDVI', title: 'Vegetation index', group: 'core', zoom: 10,
    modes: [{ id: 'ndvi', label: 'MODIS Terra NDVI · 16-day', url: gibs('MODIS_Terra_L3_NDVI_16Day', 'default', 9, 'png'), native: 9, when: 'Latest 16-day composite' }],
    legend: { kind: 'ramp', unit: '', stops: [['#dfcec2', '0.1'], ['#b09b8a', '0.2'], ['#965a47', '0.3'], ['#78ad01', '0.45'], ['#3e8a01', '0.6'], ['#086701', '0.8']] },
  },
  {
    id: 'dem', tab: 'DEM', title: 'Elevation & terrain', group: 'support', zoom: 10,
    modes: [{ id: 'relief', label: 'ASTER GDEM shaded relief', url: gibs('ASTER_GDEM_Color_Shaded_Relief', 'default', 12, 'jpg'), native: 12, when: 'Static global DEM', res: '~30 m ASTER GDEM' }],
    note: 'GIBS serves ASTER GDEM relief. The catchment analyzer below uses SRTM-based elevation values.',
    legend: { kind: 'ramp', unit: 'relative elevation', stops: [['#3f6e3f', 'low'], ['#b7b16f', ''], ['#c68f55', ''], ['#f2ede4', 'high']] },
  },
  {
    id: 'landcover', tab: 'Land cover', title: 'Land cover classes', group: 'support', zoom: 9,
    modes: [{ id: 'igbp', label: 'MODIS IGBP · 2024', url: gibs('MODIS_Combined_L3_IGBP_Land_Cover_Type_Annual', 'default', 8, 'png'), native: 8, when: 'Annual, 2024' }],
    legend: { kind: 'classes', stops: [['#bfbfbd', 'Barren'], ['#f5deb3', 'Open shrublands'], ['#faef73', 'Croplands'], ['#999356', 'Crop/natural mosaic'], ['#ff0000', 'Urban'], ['#86cae3', 'Water']] },
  },
]

export const GIBS_ATTRIBUTION = GIBS_ATTR

// ---- Real DEM from AWS Terrain Tiles (terrarium PNG: elevation = R·256 + G + B/256 − 32768) ----

const TERRARIUM = (z, x, y) => `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`
const tile2lon = (x, z) => (x / 2 ** z) * 360 - 180
const tile2lat = (y, z) => {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** z
  return (180 / Math.PI) * Math.atan(Math.sinh(n))
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Tile failed: ${src}`))
    img.src = src
  })
}

// Loads a 2×2 block of zoom-12 tiles (~18 km square in Oman) around a point and averages it to a grid.
export async function loadDem([lat, lon], { z = 12, grid = 64 } = {}) {
  const n = 2 ** z
  const latR = (lat * Math.PI) / 180
  const xt = ((lon + 180) / 360) * n
  const yt = ((1 - Math.asinh(Math.tan(latR)) / Math.PI) / 2) * n
  const x0 = Math.floor(xt - 0.5)
  const y0 = Math.floor(yt - 0.5)

  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const imgs = await Promise.all(
    [[0, 0], [1, 0], [0, 1], [1, 1]].map(([dx, dy]) => loadImage(TERRARIUM(z, x0 + dx, y0 + dy)).then((img) => ({ img, dx, dy }))),
  )
  for (const { img, dx, dy } of imgs) ctx.drawImage(img, dx * 256, dy * 256)
  const px = ctx.getImageData(0, 0, 512, 512).data

  const step = 512 / grid
  const zArr = new Float32Array(grid * grid)
  for (let gy = 0; gy < grid; gy++) {
    for (let gx = 0; gx < grid; gx++) {
      let sum = 0, cnt = 0
      for (let yy = gy * step; yy < (gy + 1) * step; yy++) {
        for (let xx = gx * step; xx < (gx + 1) * step; xx++) {
          const o = (yy * 512 + xx) * 4
          sum += px[o] * 256 + px[o + 1] + px[o + 2] / 256 - 32768
          cnt++
        }
      }
      zArr[gy * grid + gx] = sum / cnt
    }
  }

  return {
    z: zArr,
    W: grid,
    H: grid,
    cellM: ((156543.03392 * Math.cos(latR)) / n) * step,
    bounds: [[tile2lat(y0 + 2, z), tile2lon(x0, z)], [tile2lat(y0, z), tile2lon(x0 + 2, z)]],
    source: 'AWS Terrain Tiles (SRTM-based), zoom 12',
  }
}
