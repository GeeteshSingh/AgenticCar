// Pure-logic test for spawn safety. Run with Node's custom resolver that
// maps the @/ alias to src/. Usage:
//   node --experimental-loader ./alias-loader.mjs src/../spawn-safety.test.mjs
// (or just run via `node spawn-safety.test.mjs` after aliasing in loader)
import { isSpawnSafe, buildLaneOccupancy, pickSafeLane } from '@/game/traffic/spawnSafety'
import { trySpawnVehicle, spawnInterval, maxActiveVehicles } from '@/game/traffic/trafficSpawner'
import { TRAFFIC } from '@/game/config/trafficConfig'

let fail = 0
const assert = (cond, msg) => { if (!cond) { console.log('FAIL:', msg); fail++ } }

// 1) Never spawn on top of player
const playerOcc = buildLaneOccupancy([{ lane: 0, z: 0, length: 4 }])
assert(!isSpawnSafe({ lane: 0, candidateZ: 0, length: 4, laneOccupancy: playerOcc, playerZ: 0 }), 'reject spawn on player z')

// 2) Respects min gap
const occ2 = buildLaneOccupancy([{ lane: 1, z: 150, length: 4 }])
assert(!isSpawnSafe({ lane: 1, candidateZ: 150, length: 4, laneOccupancy: occ2 }), 'reject overlapping gap')
assert(isSpawnSafe({ lane: 1, candidateZ: 110, length: 4, laneOccupancy: occ2 }), 'allow far gap')

// 3) Escape-lane: filling the last free lane when 3/4 are occupied in a band
//    would create an impassable wall -> must be rejected, so pickSafeLane
//    returns -1 (degrades gracefully to "skip spawn this cycle").
const blocked = buildLaneOccupancy([
  { lane: 0, z: 180, length: 4 }, { lane: 1, z: 180, length: 4 }, { lane: 2, z: 180, length: 4 },
])
const safe = pickSafeLane({ candidateZ: 180, length: 4, laneOccupancy: blocked, playerZ: 0 })
assert(safe === -1, 'must NOT spawn into last free lane (would wall), got ' + safe)

// 3b) With only 2 lanes blocked in a band, a free lane should be pickable.
const twoBlocked = buildLaneOccupancy([
  { lane: 0, z: 180, length: 4 }, { lane: 1, z: 180, length: 4 },
])
const safe2 = pickSafeLane({ candidateZ: 180, length: 4, laneOccupancy: twoBlocked, playerZ: 0 })
assert(safe2 === 2 || safe2 === 3, 'should pick a free lane (2 or 3), got ' + safe2)

// 4) All lanes blocked -> -1
const allBlocked = buildLaneOccupancy([
  { lane: 0, z: 180, length: 4 }, { lane: 1, z: 180, length: 4 }, { lane: 2, z: 180, length: 4 }, { lane: 3, z: 180, length: 4 },
])
const none = pickSafeLane({ candidateZ: 180, length: 4, laneOccupancy: allBlocked, playerZ: 0 })
assert(none === -1, 'reject all-blocked, got ' + none)

// 5) Spawner should never emit an unsafe vehicle across many samples
let violations = 0
let lastOcc = buildLaneOccupancy([])
for (let i = 0; i < 3000; i++) {
  const v = trySpawnVehicle({ activeVehicles: [], t: Math.random(), playerZ: 0 })
  if (!v) continue
  if (!isSpawnSafe({ lane: v.lane, candidateZ: v.z, length: v.length, laneOccupancy: lastOcc, playerZ: 0 })) violations++
}
assert(violations === 0, 'spawner produced ' + violations + ' unsafe spawns')

// 6) Difficulty scaling
assert(maxActiveVehicles(1) > maxActiveVehicles(0), 'maxActive grows with difficulty')
assert(spawnInterval(1) < spawnInterval(0), 'interval shrinks with difficulty')

// 7) Pool cap
assert(TRAFFIC.poolSize >= maxActiveVehicles(1), 'poolSize covers max active')

console.log(fail === 0 ? 'ALL SPAWN-SAFETY TESTS PASSED' : fail + ' SPAWN-SAFETY TESTS FAILED')
process.exit(fail === 0 ? 0 : 1)
