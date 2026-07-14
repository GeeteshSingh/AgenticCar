// Near-miss detection. A near miss occurs when:
//  1. The player passes within a configured safe threshold laterally.
//  2. No collision occurs.
//  3. Relative speed exceeds a configured minimum.
//  4. The same encounter has not already been rewarded.
//
// Pure logic on pooled vehicle refs + player state. Emits NEAR_MISS events
// with relativeSpeed + distance; does NOT touch score/UI/audio directly.

export const NEAR_MISS = {
  lateralThreshold: 2.6, // meters: within this x-gap of a vehicle edge
  zBand: 3.0, // meters: must be alongside (small |z|) to qualify
  minRelativeSpeed: 30, // km/h
}

export function createNearMissDetector() {
  const seen = new Map() // vehicleId -> 'awarded' | 'skipped'

  // playerX: lateral position; playerZ fixed ~0. relativeSpeed in km/h.
  // Returns list of { vehicleId, relativeSpeed, distance } for new near misses.
  function detect({ playerX, vehicles, playerSpeed }) {
    const misses = []
    const present = new Set()
    for (const v of vehicles) {
      if (Math.abs(v.x - playerX) > NEAR_MISS.lateralThreshold) continue
      if (Math.abs(v.z) > NEAR_MISS.zBand) continue
      present.add(v.id)
      if (seen.has(v.id)) continue
      const rel = Math.abs(
        playerSpeed - (v.direction < 0 ? -v.speed : v.speed),
      )
      if (rel < NEAR_MISS.minRelativeSpeed) {
        // not fast enough — skip but remember so we don't re-check forever
        seen.set(v.id, 'skipped')
        continue
      }
      seen.set(v.id, 'awarded')
      misses.push({
        vehicleId: v.id,
        relativeSpeed: rel,
        distance: Math.abs(playerX - v.x),
      })
    }
    // prune gone vehicles
    for (const id of [...seen.keys()]) if (!present.has(id)) seen.delete(id)
    return misses
  }

  function reset() {
    seen.clear()
  }

  return { detect, reset }
}
