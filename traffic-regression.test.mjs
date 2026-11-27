import assert from 'node:assert/strict'
import { trySpawnVehicle } from '@/game/traffic/trafficSpawner'
import { TRAFFIC } from '@/game/config/trafficConfig'
import { DIFFICULTY } from '@/game/config/difficultyConfig'
import { readPlayerSpeed, trafficDeltaZ, trafficStep } from '@/game/traffic/trafficSimulation'
import { assessCollision } from '@/game/collision/collisionSeverity'

function seeded(seed) {
  return () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296)
}
const speed = readPlayerSpeed({ speed: 120, lateralX: 0 })
assert.equal(speed, 120)
assert.equal(readPlayerSpeed({ speed: NaN }), 0)
assert.equal(readPlayerSpeed(undefined), 0)
assert.equal(readPlayerSpeed({ speed: -10 }), -10)
assert.ok(Math.abs(trafficDeltaZ(speed, { speed: 60, direction: 1 }, 1 / 60) + 1 / 3.6) < 1e-9)
assert.ok(trafficDeltaZ(speed, { speed: 60, direction: -1 }, 1 / 60) < trafficDeltaZ(speed, { speed: 60, direction: 1 }, 1 / 60))
assert.ok(trafficDeltaZ(-10, { speed: 0, direction: 1 }, 1 / 60) > 0)
assert.ok(Number.isFinite(assessCollision({ playerSpeed: speed, trafficSpeed: 80, direction: -1 }).damage))
assert.equal(trafficStep(60), 1 / 30)
assert.equal(trafficStep(-1), 0)
assert.equal(trafficStep(NaN), 0)

const random = seeded(42)
const directions = new Set()
for (let i = 0; i < 500; i++) {
  const v = trySpawnVehicle({ activeVehicles: [], t: i % 2, random })
  assert.ok(v)
  assert.equal(v.direction, TRAFFIC.laneDirections[v.lane])
  directions.add(v.direction)
  const tr = DIFFICULTY.traffic
  if (v.direction < 0) {
    assert.ok(v.speed >= tr.oncomingSpeedMin && v.speed <= tr.oncomingSpeedMax)
    if (i % 2 === 0) assert.equal(v.speed, tr.oncomingSpeedMin)
  }
}
assert.deepEqual(directions, new Set([1, -1]))
// The same seed produces the same lane, speed and spawn position.
const a = trySpawnVehicle({ activeVehicles: [], t: 0.5, random: seeded(8) })
const b = trySpawnVehicle({ activeVehicles: [], t: 0.5, random: seeded(8) })
assert.deepEqual({ ...a, id: null }, { ...b, id: null })
console.log('ALL TRAFFIC REGRESSION TESTS PASSED')
