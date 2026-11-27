import assert from 'node:assert/strict'
import { sampleRoad, roadFrame, terrainHeight } from './src/game/world/roadProfile.js'
for (const distance of [0, 47.99, 48, 1000, 1000000]) {
  const frame = roadFrame(0, distance)
  assert.equal(frame.x, 0)
  assert.equal(frame.y, 0)
  for (const z of [-48, 0, 48, 720]) {
    const absolute = sampleRoad(distance + z)
    const origin = sampleRoad(distance)
    const point = roadFrame(z, distance)
    assert.equal(point.x, absolute.x - origin.x)
    assert.equal(point.y, absolute.y - origin.y)
    assert(Number.isFinite(point.heading) && Number.isFinite(point.pitch))
  }
  // Recycling changes local z but preserves the absolute world sample.
  const before = roadFrame(48, distance)
  const after = roadFrame(0, distance + 48)
  const delta = sampleRoad(distance + 48).x - sampleRoad(distance).x
  assert(Math.abs(before.x - after.x - delta) < 1e-9)
  const p = sampleRoad(distance)
  const next = sampleRoad(distance + 0.001)
  assert(Math.abs((next.x - p.x) / 0.001 - p.slopeX) < 0.001)
  assert(Math.abs((next.y - p.y) / 0.001 - p.slopeY) < 0.001)
}
assert.deepEqual(sampleRoad(1200, 3), sampleRoad(1200, 3))
assert.notDeepEqual(sampleRoad(1200, 3), sampleRoad(1200, 4))
assert(terrainHeight(100, 500, 'coast') < 0)
assert(Number.isFinite(terrainHeight(-300, 1e8, 'desert')))
console.log('World profile: deterministic, finite, smooth, relative-origin and recycling contracts passed')
