// Smooth deterministic road profile in absolute travelled metres. Relative
// coordinates keep the player near the origin even during very long drives.
export function sampleRoad(distance, seed = 1) {
  const phase = seed * 0.71
  const x = 34 * Math.sin(distance / 210 + phase) + 12 * Math.sin(distance / 91 + phase * 2)
  const y = 9 * Math.sin(distance / 180 + phase) + 3 * Math.sin(distance / 79)
  const slopeX = 34 / 210 * Math.cos(distance / 210 + phase) + 12 / 91 * Math.cos(distance / 91 + phase * 2)
  const slopeY = 9 / 180 * Math.cos(distance / 180 + phase) + 3 / 79 * Math.cos(distance / 79)
  return { x, y, slopeX, slopeY, heading: Math.atan(slopeX), pitch: Math.atan(slopeY) }
}

export function roadFrame(z, distance = 0, seed = 1) {
  const origin = sampleRoad(distance, seed)
  const point = sampleRoad(distance + z, seed)
  return { ...point, x: point.x - origin.x, y: point.y - origin.y }
}

export function terrainHeight(offset, distance, environment = 'countryside') {
  const edge = Math.max(0, Math.abs(offset) - 10)
  if (environment === 'coast' && offset > 10) return -Math.min(5, edge * 0.1)
  const wave = Math.sin(distance / 63 + offset / 43) + Math.sin(distance / 117 - offset / 77)
  return edge * 0.035 + wave * Math.min(edge * 0.14, environment === 'desert' ? 14 : 24) - 0.15
}

export const WORLD_PALETTES = {
  countryside: { ground: '#8b9b60', shoulder: '#a2a17b', foliage: '#315e3f', hills: '#6e8967' },
  forest: { ground: '#526e4b', shoulder: '#8d9071', foliage: '#244d3d', hills: '#466c59' },
  desert: { ground: '#c6aa7c', shoulder: '#d4bd91', foliage: '#76774d', hills: '#b59775' },
  coast: { ground: '#a9b986', shoulder: '#c8c3a0', foliage: '#426e53', hills: '#75958a' },
}
