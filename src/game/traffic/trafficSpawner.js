// Traffic spawner. Decides WHAT to spawn and with what parameters based on
// difficulty, then asks spawnSafety whether the spawn is fair. Pure-ish:
// uses a provided RNG-free Math.random (acceptable) and reads config.

import { TRAFFIC, laneCenterX } from '@/game/config/trafficConfig'
import { DIFFICULTY, lerp } from '@/game/config/difficultyConfig'
import { pickSafeLane, buildLaneOccupancy } from '@/game/traffic/spawnSafety'

let spawnCounter = 0
export function resetSpawnCounter() {
  spawnCounter = 0
}

function pickType() {
  return TRAFFIC.types[Math.floor(Math.random() * TRAFFIC.types.length)]
}

function pickSpeed(direction, t) {
  const tr = DIFFICULTY.traffic
  if (direction > 0) {
    // same direction: slower than player, range grows with difficulty
    const maxSpeed = lerp(tr.sameDirectionSpeedMaxT0, tr.sameDirectionSpeedMaxT1, t)
    return tr.sameDirectionSpeedMin + Math.random() * (maxSpeed - tr.sameDirectionSpeedMin)
  }
  // oncoming: approaches head-on; speed grows with difficulty
  const maxSpeed = lerp(tr.oncomingSpeedMin, tr.oncomingSpeedMax, t)
  return tr.oncomingSpeedMax - Math.random() * (maxSpeed - tr.oncomingSpeedMin)
}

// Try to spawn one vehicle. Returns a vehicle spec, or null if unsafe.
// activeVehicles: array of live vehicle states (for occupancy).
// t: normalized difficulty 0..1. playerZ: number (default 0).
export function trySpawnVehicle({ activeVehicles, t, playerZ = 0 }) {
  const laneOccupancy = buildLaneOccupancy(activeVehicles)
  const type = pickType()
  const direction = TRAFFIC.laneDirections[Math.floor(Math.random() * TRAFFIC.laneDirections.length)] ?? 1
  const candidateZ = TRAFFIC.spawnDistance

  const lane = pickSafeLane({ candidateZ, length: type.length, laneOccupancy, playerZ })
  if (lane < 0) return null

  const speed = pickSpeed(direction, t)
  spawnCounter++
  return {
    id: `traffic-${spawnCounter}`,
    lane,
    direction,
    type: type.id,
    color: type.color,
    width: type.width,
    length: type.length,
    height: type.height,
    z: candidateZ,
    speed, // km/h in its own direction
  }
}

// Current spawn interval (seconds) given difficulty t.
export function spawnInterval(t) {
  return lerp(DIFFICULTY.traffic.baseSpawnInterval, DIFFICULTY.traffic.minSpawnInterval, t)
}

// Max active vehicles allowed given difficulty t.
export function maxActiveVehicles(t) {
  return Math.round(lerp(DIFFICULTY.traffic.maxActiveVehiclesT0, DIFFICULTY.traffic.maxActiveVehiclesT1, t))
}
