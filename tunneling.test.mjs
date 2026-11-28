import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PLAYER_VEHICLES } from './src/game/config/playerVehicles.js'
import { TRAFFIC } from './src/game/config/trafficConfig.js'
import { DIFFICULTY } from './src/game/config/difficultyConfig.js'
import { trafficDeltaZ } from './src/game/traffic/trafficSimulation.js'

// Match TrafficManager's strict, discrete z-overlap and its capped traffic step.
test('aligned traffic cannot cross the player undetected at maximum speed', () => {
  for (const player of PLAYER_VEHICLES) for (const traffic of TRAFFIC.types) {
    for (const direction of [-1, 1]) for (const dt of [1 / 20, 1 / 30, 1 / 60]) {
      const speed = direction < 0 ? DIFFICULTY.traffic.oncomingSpeedMax : DIFFICULTY.traffic.sameDirectionSpeedMin
      const delta = trafficDeltaZ(player.topSpeedKmh, { speed, direction }, dt)
      const halfSum = (player.length + traffic.length) / 2
      // For every starting phase, traversal is safe only when one step is
      // strictly smaller than the entire overlap interval.
      assert.ok(Math.abs(delta) < 2 * halfSum, `${player.type}/${traffic.id} direction=${direction} dt=${dt}: step=${Math.abs(delta)} interval=${2 * halfSum}`)
      if (delta !== 0) for (let phase = 0; phase < 100; phase++) {
        let z = Math.sign(delta) * (-halfSum - Math.abs(delta) * (1 + phase / 100))
        let hit = false
        while (Math.sign(delta) * z <= halfSum) {
          z += delta
          if (Math.abs(z) < halfSum) hit = true
        }
        assert.ok(hit, `${player.type}/${traffic.id} crossed at phase ${phase}`)
      }
    }
  }
})

// Known limitation: FreeRoamTraffic moves decorative meshes without player collision checks.
test.skip('free-roam traffic detects collisions with the player', () => {
  assert.fail('free-roam traffic collision handling is not implemented')
})
