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
  let best = null, bestDistance = Infinity
  // Enumerate the finite road grid, allowing a safe alternative if traffic blocks the nearest point.
  for (const road of ROAD_POSITIONS) for (let along = -320; along <= 320; along += 5) {
    for (const axis of ['z', 'x']) {
      const px = axis === 'z' ? road : along, pz = axis === 'z' ? along : road
      if (ROAD_OBSTACLES.some(o => Math.abs(px-o.x) < o.halfX && Math.abs(pz-o.z) < o.halfZ)) continue
      if (traffic.some(v => Math.abs(px-v.x) < (v.halfX ?? 4) && Math.abs(pz-v.z) < (v.halfZ ?? 6))) continue
      const d = (px-x)**2 + (pz-z)**2
      if (d < bestDistance) { bestDistance = d; best = { x:px, z:pz, heading:axis === 'z' ? 0 : Math.PI/2, speed:0 } }
    }
  }
  return best
}

export function mapPoint(x, z, size = 1000) {
  return { x:(x / (ROAD_END * 2) + .5) * size, y:(.5 - z / (ROAD_END * 2)) * size }
}
