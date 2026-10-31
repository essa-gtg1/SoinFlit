// Terrain-hydrology steps (priority-flood sink fill, D8 flow direction, flow accumulation, watersheds,
// slope) for any elevation grid. The dashboard feeds it real SRTM-based elevation for a study area in
// Oman (see lib/maps.js loadDem); `syntheticDem` is only the offline fallback.

const D8 = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]]

export function syntheticDem() {
  const W = 40, H = 24
  const z = new Float32Array(W * H)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const base = 380 + x * 1.2 + (H - y) * 9
      const wadiA = 46 * Math.exp(-((y - (4 + x * 0.42 + 2.2 * Math.sin(x / 3.2))) ** 2) / 5)
      const wadiB = 32 * Math.exp(-((y - (13 + x * 0.22 + 1.6 * Math.sin(x / 4.1 + 1))) ** 2) / 4)
      const valley = Math.min(1, wadiA / 46 + wadiB / 32)
      const ridge = (Math.sin(x * 0.35 + y * 0.12) * 14 + Math.cos(x * 0.18 - y * 0.42) * 10) * (1 - valley)
      const bowl1 = 22 * Math.exp(-((x - 9) ** 2 + (y - 18) ** 2) / 4.5)
      const bowl2 = 16 * Math.exp(-((x - 27) ** 2 + (y - 19.5) ** 2) / 3.5)
      z[y * W + x] = base + ridge - wadiA - wadiB - bowl1 - bowl2
    }
  }
  return { z, W, H, cellM: 90, bounds: null, source: 'Synthetic fallback DEM (offline)' }
}

// Priority-flood sink filling (Barnes et al. 2014): raise every pit to its spill level + a tiny gradient.
function fillSinks(z, W, H) {
  const n = W * H
  const filled = Float32Array.from(z)
  const seen = new Uint8Array(n)
  const heap = []
  const push = (i) => {
    heap.push(i)
    let c = heap.length - 1
    while (c > 0) {
      const p = (c - 1) >> 1
      if (filled[heap[p]] <= filled[heap[c]]) break
      ;[heap[p], heap[c]] = [heap[c], heap[p]]
      c = p
    }
  }
  const pop = () => {
    const top = heap[0], last = heap.pop()
    if (heap.length) {
      heap[0] = last
      let c = 0
      for (;;) {
        const l = 2 * c + 1, r = l + 1
        let m = c
        if (l < heap.length && filled[heap[l]] < filled[heap[m]]) m = l
        if (r < heap.length && filled[heap[r]] < filled[heap[m]]) m = r
        if (m === c) break
        ;[heap[m], heap[c]] = [heap[c], heap[m]]
        c = m
      }
    }
    return top
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (x === 0 || y === 0 || x === W - 1 || y === H - 1) { seen[y * W + x] = 1; push(y * W + x) }
  }
  while (heap.length) {
    const i = pop(), x = i % W, y = (i / W) | 0
    for (const [dx, dy] of D8) {
      const nx = x + dx, ny = y + dy
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue
      const j = ny * W + nx
      if (seen[j]) continue
      seen[j] = 1
      filled[j] = Math.max(filled[j], filled[i] + 0.01)
      push(j)
    }
  }
  return filled
}

export function analyse({ z, W, H, cellM }) {
  const CELL_M = cellM
  const filled = fillSinks(z, W, H)
  const n = W * H
  const dir = new Int32Array(n).fill(-2) // downstream cell index, -2 = edge outlet
  const dirVec = new Array(n)
  const slope = new Float32Array(n)
  const isSink = new Uint8Array(n)
  const fillDepth = new Float32Array(n)

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x
      fillDepth[i] = filled[i] - z[i]
      let best = 0, bestJ = -1, bestV = null, rawBest = 0
      for (const [dx, dy] of D8) {
        const nx = x + dx, ny = y + dy
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue
        const j = ny * W + nx
        const dist = Math.hypot(dx, dy) * CELL_M
        const drop = (filled[i] - filled[j]) / dist
        if (drop > best) { best = drop; bestJ = j; bestV = [dx, dy] }
        rawBest = Math.max(rawBest, (z[i] - z[j]) / dist)
      }
      slope[i] = (Math.atan(rawBest) * 180) / Math.PI
      if (rawBest === 0 && !(x === 0 || y === 0 || x === W - 1 || y === H - 1)) isSink[i] = 1
      if (bestJ >= 0) { dir[i] = bestJ; dirVec[i] = bestV }
    }
  }

  // Flow accumulation: visit cells high → low on the filled surface and pass counts downstream.
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => filled[b] - filled[a])
  const acc = new Float32Array(n).fill(1)
  for (const i of order) if (dir[i] >= 0) acc[dir[i]] += acc[i]

  // Watersheds: label each cell by the terminal (sink or edge outlet) its flow path reaches.
  const terminal = new Int32Array(n).fill(-1)
  const find = (i) => {
    const path = []
    let c = i
    while (terminal[c] < 0 && dir[c] >= 0) { path.push(c); c = dir[c] }
    const t = terminal[c] >= 0 ? terminal[c] : c
    terminal[c] = t
    for (const p of path) terminal[p] = t
    return t
  }
  for (let i = 0; i < n; i++) find(i)
  const sizes = {}
  for (let i = 0; i < n; i++) sizes[terminal[i]] = (sizes[terminal[i]] || 0) + 1
  const ranked = Object.entries(sizes).sort((a, b) => b[1] - a[1]).map(([t]) => Number(t))
  const basinIndex = new Int32Array(n)
  for (let i = 0; i < n; i++) basinIndex[i] = Math.min(ranked.indexOf(terminal[i]), 6)

  // Depressions: cells the fill raised by more than 0.5 m, i.e. natural ponding spots (or DEM artefacts).
  const inDepression = new Uint8Array(n)
  for (let i = 0; i < n; i++) inDepression[i] = fillDepth[i] > 0.5 ? 1 : 0

  // Candidate harvest sites: high accumulation on gentle slopes, kept apart from each other.
  const maxLog = Math.log(Math.max(...acc))
  const scored = []
  for (let i = 0; i < n; i++) {
    const x = i % W, y = (i / W) | 0
    if (x < 1 || y < 1 || x > W - 2 || y > H - 2) continue
    const s = (Math.log(acc[i]) / maxLog) * (1 - Math.min(slope[i], 8) / 8) + 0.25 * Math.min(1, fillDepth[i] / 4)
    if (acc[i] > 12) scored.push({ i, x, y, s, slope: slope[i] })
  }
  scored.sort((a, b) => b.s - a.s)
  // Prefer gentle ground; relax the slope limit in steep terrain so three sites are always proposed.
  const sites = []
  const minGap = Math.max(W, H) / 6
  for (const limit of [4.5, 8, 15, 90]) {
    for (const c of scored) {
      if (sites.length === 3) break
      if (c.slope < limit && sites.every((p) => Math.hypot(p.x - c.x, p.y - c.y) > minGap)) sites.push(c)
    }
    if (sites.length === 3) break
  }

  let zMin = Infinity, zMax = -Infinity
  for (const v of z) { zMin = Math.min(zMin, v); zMax = Math.max(zMax, v) }

  // Hillshade from the gradient, sun from the north-west.
  const shade = new Float32Array(n)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const zx = z[y * W + Math.min(W - 1, x + 1)] - z[y * W + Math.max(0, x - 1)]
      const zy = z[Math.min(H - 1, y + 1) * W + x] - z[Math.max(0, y - 1) * W + x]
      shade[y * W + x] = Math.max(0, Math.min(1, 0.55 + ((-zx - zy) / (2 * CELL_M)) * 2.5))
    }
  }

  return {
    W, H, cellM, z, filled, fillDepth, zMin, zMax, dir, dirVec, slope, acc, maxLog, isSink, inDepression, basinIndex, shade,
    sinkCount: isSink.reduce((a, b) => a + b, 0),
    depressionCells: inDepression.reduce((a, b) => a + b, 0),
    basinCount: ranked.length,
    sites: sites.map((s, k) => ({
      ...s,
      id: `S${k + 1}`,
      areaKm2: (acc[s.i] * CELL_M * CELL_M) / 1e6,
      slope: slope[s.i],
      elev: z[s.i],
      pond: fillDepth[s.i],
    })),
  }
}

// Runoff volume (m³) for a storm depth, rational-method style with an arid-soil coefficient.
export const runoffM3 = (areaKm2, rainMm, c = 0.3) => areaKm2 * 1e6 * (rainMm / 1000) * c
