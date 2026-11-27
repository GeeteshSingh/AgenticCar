import { tharPrototype } from './tharPrototype.js'
// Relative world coordinates keep long drives near the origin. The same
// environment must be passed by road, vehicles and cameras.
const ROUTE_SHAPES = {
  countryside: { bend: 0.75, elevation: 0.55, stretch: 1.25 },
  kashmir: { bend: 1.1, elevation: 1.7, stretch: 1.1 },
  forest: { bend: 1.15, elevation: 1.65, stretch: 1 },
  desert: { bend: 0.45, elevation: 0.25, stretch: 1.5 },
  coast: { bend: 0.8, elevation: 0.65, stretch: 1.15 },
}
export function sampleRoad(distance, seed = 1, environment = 'countryside') {
  if (environment === 'thar_test') {
    const point = tharPrototype.sample(Math.max(0, Math.min(tharPrototype.length, distance)))
    // Continue procedurally beyond the test segment; never claim this is real geography.
    const extra = Math.max(0, distance - tharPrototype.length)
    const start = Math.min(0, distance)
    const slopeX = Math.tan(point.heading) + (extra ? .12 * Math.sin(extra / 400) : 0)
    const slopeY = Math.tan(point.pitch) + (extra ? .008 * Math.sin(extra / 320) : 0)
    const x = point.x + Math.tan(point.heading) * (extra + start) + 48 * (1 - Math.cos(extra / 400))
    const y = point.y + Math.tan(point.pitch) * (extra + start) + 2.56 * (1 - Math.cos(extra / 320))
    return { x, y, slopeX, slopeY, heading: Math.atan(slopeX), pitch: Math.atan(slopeY) }
  }
  const { bend, elevation, stretch } = ROUTE_SHAPES[environment] || ROUTE_SHAPES.countryside
  const phase = seed * 0.71
  const d = distance / stretch
  const x = bend * (34 * Math.sin(d / 210 + phase) + 12 * Math.sin(d / 91 + phase * 2))
  const y = elevation * (9 * Math.sin(d / 180 + phase) + 3 * Math.sin(d / 79))
  const slopeX = bend / stretch * (34 / 210 * Math.cos(d / 210 + phase) + 12 / 91 * Math.cos(d / 91 + phase * 2))
  const slopeY = elevation / stretch * (9 / 180 * Math.cos(d / 180 + phase) + 3 / 79 * Math.cos(d / 79))
  return { x, y, slopeX, slopeY, heading: Math.atan(slopeX), pitch: Math.atan(slopeY) }
}
export function roadFrame(z, distance = 0, seed = 1, environment = 'countryside') {
  const origin = sampleRoad(distance, seed, environment)
  const point = sampleRoad(distance + z, seed, environment)
  return { ...point, x: point.x - origin.x, y: point.y - origin.y }
}
export function terrainHeight(offset, distance, environment = 'countryside') {
  const edge = Math.max(0, Math.abs(offset) - 10)
  if (environment === 'coast' && offset > 10) return -Math.min(5, edge * 0.1) - 0.15
  if (environment === 'thar_test') return Math.min(edge / 45, 1) * (8 + 7 * Math.sin(distance / 180 + offset / 65) + 4 * Math.sin(offset / 35)) - .15
  if (environment === 'desert') {
    // Broad, low dunes; keep the highway shoulder flat.
    return Math.min(edge / 40, 1) * (4 + 3.5 * Math.sin(distance / 96 + offset / 42) + 2 * Math.sin(offset / 26)) - 0.15
  }
  if (environment === 'countryside') {
    // Plateau farmland: gentle fields beneath isolated basalt outcrops.
    return edge * 0.012 + Math.sin(distance / 155 + offset / 100) * Math.min(edge * 0.025, 3) - 0.15
  }
  const wave = Math.sin(distance / 63 + offset / 43) + Math.sin(distance / 117 - offset / 77)
  return edge * ((environment === 'forest' || environment === 'kashmir') ? 0.08 : 0.035) + wave * Math.min(edge * 0.18, (environment === 'forest' || environment === 'kashmir') ? 36 : 18) - 0.15
}
export const WORLD_PALETTES = {
  countryside: { ground: '#a69b65', shoulder: '#a57b51', foliage: '#647244', hills: '#645d54' },
  kashmir: { ground: '#7b8b78', shoulder: '#898a7b', foliage: '#294f43', hills: '#a5b8bc' },
  forest: { ground: '#5e8554', shoulder: '#987f58', foliage: '#2f6244', hills: '#587b66' },
  thar_test: { ground: '#e0bd80', shoulder: '#bd925e', foliage: '#777b42', hills: '#d5aa72' },
  desert: { ground: '#d8b477', shoulder: '#cba16d', foliage: '#8b8953', hills: '#b99a70' },
  coast: { ground: '#83a66b', shoulder: '#d4c28c', foliage: '#3f7653', hills: '#719383' },
}
