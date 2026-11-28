// Finite, distance-parameterised centreline in local metres; no invented looping.
export function createRealRoute(points) {
  if (!Array.isArray(points) || points.length < 2) throw new Error('Route needs at least two points')
  const nodes = points.map(point => {
    if (!point || ![point.x, point.y, point.z].every(Number.isFinite)) throw new Error('Route coordinates must be finite')
    return { x: point.x, y: point.y, z: point.z, distance: 0 }
  })
  for (let i = 1; i < nodes.length; i++) {
    const a = nodes[i - 1], b = nodes[i]
    const length = Math.hypot(b.x - a.x, b.z - a.z)
    if (length < 1e-6) throw new Error('Route contains duplicate horizontal points')
    b.distance = a.distance + length
  }
  const length = nodes.at(-1).distance
  function sample(distance) {
    if (!Number.isFinite(distance)) throw new Error('Distance must be finite')
    const d = Math.max(0, Math.min(length, distance))
    let low = 1, high = nodes.length - 1
    while (low < high) {
      const middle = Math.floor((low + high) / 2)
      if (nodes[middle].distance < d) low = middle + 1
      else high = middle
    }
    const a = nodes[low - 1], b = nodes[low], span = b.distance - a.distance
    const t = (d - a.distance) / span
    return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, y: a.y + (b.y - a.y) * t,
      heading: Math.atan2(b.x - a.x, b.z - a.z), pitch: Math.atan2(b.y - a.y, span) }
  }
  function relative(originDistance, targetDistance) {
    const origin = sample(originDistance), target = sample(targetDistance)
    const dx = target.x - origin.x, dz = target.z - origin.z
    const c = Math.cos(origin.heading), s = Math.sin(origin.heading)
    return { x: dx * c - dz * s, z: dx * s + dz * c, y: target.y - origin.y,
      heading: Math.atan2(Math.sin(target.heading - origin.heading), Math.cos(target.heading - origin.heading)), pitch: target.pitch }
  }
  return { length, sample, relative }
}
