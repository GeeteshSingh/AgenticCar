// One clean pass per active encounter: observe same-direction traffic ahead,
// then award only after it crosses behind without a collision.
export function createOvertakeDetector() {
  const tracked = new Map()
  const valid = (vehicle) => vehicle.active && typeof vehicle.id === 'string' && vehicle.id.trim() && vehicle.direction > 0 && Number.isFinite(vehicle.z)

  function registerAhead(vehicle, playerZ = 0) {
    if (valid(vehicle) && !vehicle.hit && vehicle.z > playerZ && !tracked.has(vehicle.id)) {
      tracked.set(vehicle.id, { credited: false, collided: false })
    }
  }

  function markCollided(vehicleId) {
    const encounter = tracked.get(vehicleId)
    if (encounter) encounter.collided = true
  }

  function detect(playerZ, vehicles) {
    const overtaken = []
    const present = new Set()
    for (const vehicle of vehicles) {
      if (!valid(vehicle)) continue
      present.add(vehicle.id)
      if (vehicle.hit) { markCollided(vehicle.id); continue }
      registerAhead(vehicle, playerZ)
      const encounter = tracked.get(vehicle.id)
      if (encounter && !encounter.credited && !encounter.collided && vehicle.z < playerZ) {
        encounter.credited = true
        overtaken.push(vehicle.id)
      }
    }
    // All departed states must go, including collided and never-passed cars.
    for (const id of tracked.keys()) if (!present.has(id)) tracked.delete(id)
    return overtaken
  }

  function reset() { tracked.clear() }
  return { registerAhead, markCollided, detect, reset }
}
