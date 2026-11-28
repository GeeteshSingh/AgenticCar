export const ROAD_POSITIONS = [-320, -160, 0, 160, 320]
export const ROAD_END = 326
export const mapPlayer = { x:0, z:-55, heading:0 }
// Buildings include their roof overhangs, expanded by the player's safety margin.
export const ROAD_OBSTACLES = [
  { x: 28, z: 4, halfX: 7, halfZ: 6 },
  { x: -28, z: 164, halfX: 8, halfZ: 7 },
  { x: 188, z: 4, halfX: 8, halfZ: 7 },
  { x: 188, z: 164, halfX: 9, halfZ: 8 },
]

export function nearestSafeRoadPoint(x, z, traffic = []) {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return null
  const clamp = v => Math.max(-ROAD_END, Math.min(ROAD_END, v))
  const distanceToGrid = Math.min(...ROAD_POSITIONS.flatMap(r => [Math.hypot(x-r, z-clamp(z)), Math.hypot(x-clamp(x), z-r)]))
  // Beyond the grid, find the nearest safe point to the initial spawn instead.
  if (distanceToGrid > 150) { x = 0; z = -55 }
  let best = null, bestDistance = Infinity
  const blockers = [...ROAD_OBSTACLES, ...traffic.map(v => ({x:v.x,z:v.z,halfX:v.halfX ?? 4,halfZ:v.halfZ ?? 6}))]
  for (const road of ROAD_POSITIONS) {
    for (const axis of ['z', 'x']) {
      const candidates = [clamp(axis === 'z' ? z : x), -ROAD_END, ROAD_END]
      for (const o of blockers) {
        if (axis === 'z' ? Math.abs(road-o.x) < o.halfX : Math.abs(road-o.z) < o.halfZ) {
          const center = axis === 'z' ? o.z : o.x, half = axis === 'z' ? o.halfZ : o.halfX
          candidates.push(clamp(center-half), clamp(center+half))
        }
      }
      for (const along of candidates) {
        const px = axis === 'z' ? road : along, pz = axis === 'z' ? along : road
        if (blockers.some(o => Math.abs(px-o.x) < o.halfX && Math.abs(pz-o.z) < o.halfZ)) continue
        const d = (px-x)**2 + (pz-z)**2
        if (d < bestDistance) { bestDistance = d; best = { x:px, z:pz, heading:axis === 'z' ? 0 : Math.PI/2, speed:0 } }
      }
    }
  }
  return best
}

export function mapPoint(x, z, size = 1000) {
  return { x:(x / (ROAD_END * 2) + .5) * size, y:(.5 - z / (ROAD_END * 2)) * size }
}

export function createRespawnCooldown() {
  let remaining = 0
  return { ready: () => remaining <= 1e-9, activate: () => { remaining = 3 }, tick: dt => { remaining = Math.max(0, remaining - Math.max(0, dt)) } }
}
