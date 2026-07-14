// Spawn-safety system. Before activating a traffic vehicle, ensure the spawn
// does not create an unavoidable wall or block every useful lane.
//
// Rules:
//  - Never spawn on top of the player (keep clear of player z/area).
//  - Preserve at least one "escape" lane: do not allow N-1 lanes (or all
//    lanes) to become simultaneously occupied in a tight z-band.
//  - Respect per-lane minimum gap so consecutive cars don't overlap.
//
// Pure functions — operate on plain lane/occupancy data, no React/three.

import { TRAFFIC } from '@/game/config/trafficConfig'
import { WORLD } from '@/game/config/gameConfig'

// laneOccupancy: Map laneIndex -> [{ z, length }] sorted by z (desc = ahead).
// candidateZ: z position where we want to place a vehicle of given length.
// playerZ: current player z (default 0).
export function isSpawnSafe({ lane, candidateZ, length, laneOccupancy, playerZ = 0 }) {
  // 1) Never spawn on top of the player.
  if (Math.abs(candidateZ - playerZ) < length + 6) return false

  // 2) Respect minimum gap with nearest existing vehicles in this lane.
  const occ = laneOccupancy[lane] || []
  for (const v of occ) {
    const nearestEdgeGap = Math.abs(candidateZ - v.z) - (length + v.length) / 2
    if (nearestEdgeGap < TRAFFIC.minGap) return false
  }

  // 3) Escape-lane check: count OTHER lanes (not the candidate) that are
  //    blocked in a tight z-band around candidateZ. If every other lane is
  //    blocked, there is no escape route — refuse so we never create a wall.
  let othersBlocked = 0
  const otherLanes = WORLD.laneCount - 1
  const band = TRAFFIC.minGap + length
  for (let l = 0; l < WORLD.laneCount; l++) {
    if (l === lane) continue
    const lo = laneOccupancy[l] || []
    for (const v of lo) {
      if (Math.abs(v.z - candidateZ) < band) {
        othersBlocked++
        break
      }
    }
  }
  if (othersBlocked >= otherLanes) return false

  return true
}

// Build laneOccupancy from active vehicle list.
export function buildLaneOccupancy(vehicles) {
  const occ = {}
  for (const v of vehicles) {
    if (!occ[v.lane]) occ[v.lane] = []
    occ[v.lane].push({ z: v.z, length: v.length })
  }
  return occ
}

// Choose the safest lane to spawn in, given prospective candidates.
// Returns a lane index that passes isSpawnSafe, or -1 if none.
export function pickSafeLane({ candidateZ, length, laneOccupancy, playerZ = 0 }) {
  const order = shuffleLanes()
  for (const lane of order) {
    if (isSpawnSafe({ lane, candidateZ, length, laneOccupancy, playerZ })) {
      return lane
    }
  }
  return -1
}

function shuffleLanes() {
  const arr = Array.from({ length: WORLD.laneCount }, (_, i) => i)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
