const lerp = (a, b, t) => a + (b - a) * t

export function ramp(stops, t) {
  t = Math.min(1, Math.max(0, t))
  const seg = (stops.length - 1) * t
  const i = Math.min(stops.length - 2, Math.floor(seg))
  const f = seg - i
  const [a, b] = [stops[i], stops[i + 1]]
  return `rgb(${Math.round(lerp(a[0], b[0], f))},${Math.round(lerp(a[1], b[1], f))},${Math.round(lerp(a[2], b[2], f))})`
}

export const SCALES = {
  moisture: [[18, 22, 48], [14, 80, 130], [0, 190, 230], [190, 252, 255]],
  rain: [[14, 20, 40], [40, 70, 160], [80, 140, 255], [200, 235, 255]],
  heat: [[20, 60, 140], [16, 185, 129], [245, 158, 11], [220, 50, 40]],
  ndvi: [[90, 62, 38], [150, 120, 60], [52, 160, 90], [16, 220, 140]],
  turbidity: [[0, 242, 254], [80, 170, 170], [200, 150, 70], [245, 158, 11]],
  elevation: [[20, 70, 70], [120, 130, 80], [170, 130, 85], [235, 225, 210]],
  slope: [[10, 40, 60], [0, 180, 200], [245, 158, 11], [230, 60, 50]],
  accumulation: [[10, 16, 32], [20, 60, 120], [0, 200, 240], [220, 255, 255]],
}
