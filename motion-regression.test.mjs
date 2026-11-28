import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PLAYER_VEHICLES } from './src/game/config/playerVehicles.js'
import { stepFreeRoam, FREE_ROAM_LIMIT } from './src/game/world/freeRoamMotion.js'

const start = () => ({ x: 0, z: 0, heading: 0, speed: 0 })
test('every vehicle accelerates within its cap and reaches 95% within 40 seconds', () => {
  for (const [index, v] of PLAYER_VEHICLES.entries()) {
    let s = start(), elapsed = 0
    for (; elapsed < 40 && s.speed < v.topSpeedKmh * .95; elapsed += 1 / 60) {
      s = stepFreeRoam({ ...s, x: 0, z: 0 }, { accelerate: 1 }, 1 / 60, index)
      assert.ok(Number.isFinite(s.speed) && s.speed >= 0 && s.speed <= v.topSpeedKmh)
    }
    assert.ok(s.speed >= v.topSpeedKmh * .95, `${v.type} never reaches 95%`)
  }
})
test('stationary steering does not move and bounds return the player', () => {
  const stopped = stepFreeRoam(start(), { steer: 1 }, 1 / 60)
  assert.equal(stopped.x, 0); assert.equal(stopped.z, 0)
  const edge = stepFreeRoam({ x: FREE_ROAM_LIMIT, z: 0, speed: 150, heading: Math.PI / 2 }, { accelerate: 1 }, .05)
  assert.equal(edge.x, FREE_ROAM_LIMIT); assert.equal(edge.speed, 0)
})
test('free-roam distance and speed remain close across frame intervals', () => {
  const simulate = dt => {
    let s = start()
    for (let t = 0; t < Math.round(5 / dt); t++) s = stepFreeRoam(s, { accelerate: 1 }, dt)
    return s
  }
  const ref = simulate(1 / 60)
  for (const dt of [1 / 20, 1 / 30, 1 / 144]) {
    const s = simulate(dt)
    assert.ok(Math.abs(s.speed - ref.speed) < .1)
    assert.ok(Math.abs(s.z - ref.z) < 1, `distance differs at dt=${dt}`)
  }
})
