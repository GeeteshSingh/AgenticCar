import { test } from 'node:test'
import assert from 'node:assert/strict'
import { TRAFFIC, laneCenterX } from './src/game/config/trafficConfig.js'
import { maxActiveVehicles, trySpawnVehicle } from './src/game/traffic/trafficSpawner.js'
import { trafficDeltaZ } from './src/game/traffic/trafficSimulation.js'

test('seeded standard traffic stays finite, in lanes, and within the pool', () => {
  let seed = 123456
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32)
  let vehicles = []
  for (let tick = 0; tick < 10000; tick++) {
    const t = (tick % 1000) / 999
    vehicles = vehicles.filter(v => v.z >= TRAFFIC.despawnDistance)
    if (vehicles.length < maxActiveVehicles(t)) {
      const v = trySpawnVehicle({ activeVehicles: vehicles, t, random })
      if (v) vehicles.push(v)
    }
    assert.ok(vehicles.length <= TRAFFIC.poolSize)
    for (const v of vehicles) {
      v.z += trafficDeltaZ(120, v, 1 / 60)
      assert.ok(Number.isFinite(v.z) && Number.isFinite(laneCenterX(v.lane)))
      assert.ok(v.lane >= 0 && v.lane < TRAFFIC.laneDirections.length)
    }
  }
})
