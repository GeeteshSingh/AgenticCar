// Overtake detection. A vehicle counts as "cleanly overtaken" only when:
//  1. It was a same-direction vehicle initially ahead of the player.
//  2. The player passes it (player z-surrogate x/lane crossing / relative z).
//  3. No collision occurred with it during the pass.
//  4. It hasn't already been counted.
//
// Pure logic: operates on pooled vehicle refs + player state. Returns events
// to emit; does not mutate score or UI.

export function createOvertakeDetector() {
  const tracked = new Map() // vehicleId -> { passed: bool, collided: bool }

  // Register a same-direction vehicle that is currently ahead of the player.
  function registerAhead(vehicle) {
    if (!tracked.has(vehicle.id)) {
      tracked.set(vehicle.id, { passed: false, collided: false })
    }
  }

  // Mark a vehicle collided so its overtake won't be credited.
  function markCollided(vehicleId) {
    const t = tracked.get(vehicleId)
    if (t) t.collided = true
  }

  // Called each frame with the player and active vehicle list. playerZ is
  // fixed at ~0 in this design; "ahead" means vehicle.z > 0, and "passed"
  // means it has moved to z < 0 (behind). Returns array of overtaken ids.
  function detect(playerZ, vehicles) {
    const overtaken = []
    const seen = new Set()
    for (const v of vehicles) {
      if (v.direction < 0) continue // only same-direction overtakes
      seen.add(v.id)
      const t = tracked.get(v.id) || { passed: false, collided: false }
      if (!t.credited && !t.passed && v.z < playerZ) {
        // just crossed behind the player
        if (!t.collided) {
          t.credited = true
          overtaken.push(v.id)
        }
      }
      tracked.set(v.id, t)
    }
    // Prune vehicles no longer present
    for (const id of [...tracked.keys()]) {
      if (!seen.has(id)) {
        const t = tracked.get(id)
        if (t && t.credited) tracked.delete(id)
      }
    }
    return overtaken
  }

  function reset() {
    tracked.clear()
  }

  return { registerAhead, markCollided, detect, reset }
}
