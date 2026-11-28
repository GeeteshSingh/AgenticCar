import assert from 'node:assert/strict'
import { nearBillboard, BILLBOARD_CLEARANCE } from './src/game/world/billboardClearance.js'
assert.ok(nearBillboard(160) && nearBillboard(560))
assert.equal(nearBillboard(160 + BILLBOARD_CLEARANCE), false)
assert.equal(nearBillboard(-240), false)
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

const environments = ['countryside', 'forest', 'desert', 'coast', 'kashmir']
for (const environment of environments) {
  for (const distance of [0, 48, 431.999, 432, 999999, 1e8]) {
    const road = sampleRoad(distance, 1, environment)
    const next = sampleRoad(distance + .001, 1, environment)
    assert(Math.abs(road.slopeX) < .35, `${environment} road bend remains drivable`)
    assert(Math.abs(road.slopeY) < .16, `${environment} grade remains bounded`)
    assert(Math.abs((next.x - road.x) / .001 - road.slopeX) < .001)
    assert(Math.abs((next.y - road.y) / .001 - road.slopeY) < .001)
    const origin = roadFrame(0, distance, 1, environment)
    assert.equal(origin.x, 0); assert.equal(origin.y, 0)
    const seamFromLeft = roadFrame(48, distance, 1, environment)
    const seamFromRight = roadFrame(0, distance + 48, 1, environment)
    const absoluteDelta = sampleRoad(distance + 48, 1, environment).y - road.y
    assert(Math.abs(seamFromLeft.y - seamFromRight.y - absoluteDelta) < 1e-9)
    for (const offset of [-320, -100, -10, 10, 100, 320]) assert(Number.isFinite(terrainHeight(offset, distance, environment)))
  }
}
assert.notDeepEqual(sampleRoad(500, 1, 'forest'), sampleRoad(500, 1, 'desert'))
assert(terrainHeight(180, 500, 'forest') > terrainHeight(180, 500, 'countryside'))
assert(terrainHeight(200, 500, 'coast') < -3)
console.log('Indian route profiles: bounded slopes, deterministic regional differences and continuous seams passed')
