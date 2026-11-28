export const FREE_ROAM_LIMIT = 760
export const FREE_ROAM_PLACES = [
  { name: 'Chai stop', x: 28, z: 4 },
  { name: 'Desert fuel stop', x: -28, z: 164 },
  { name: 'Roadside dhaba', x: 188, z: 4 },
  { name: 'Desert Market', x: 188, z: 164 },
]
export function nearbyFreeRoamPlace(x, z, speed) {
  return Math.abs(speed) < 5 ? FREE_ROAM_PLACES.find(place => Math.hypot(x - place.x, z - place.z) < 18)?.name || '' : ''
}

// Small arcade free-roam simulation, independent from the endless highway.
export function stepFreeRoam(state, input, dt) {
  const step = Math.max(0, Math.min(.05, dt))
  const throttle = input.accelerate > 0, brake = input.brake > 0
  let speed = state.speed
  if (throttle) speed += 28 * step
  else if (brake) speed -= (speed > 1 ? 55 : 20) * step
  else speed *= Math.exp(-1.2 * step)
  speed = Math.max(-18, Math.min(90, speed))
  if (Math.abs(speed) < .12 && !throttle && !brake) speed = 0
  const steer = Math.max(-1, Math.min(1, input.steer || 0))
  const heading = state.heading - steer * Math.min(Math.abs(speed) / 12, 1) * Math.sign(speed) * 1.15 * step
  const x = state.x + Math.sin(heading) * speed / 3.6 * step
  const z = state.z + Math.cos(heading) * speed / 3.6 * step
  return { speed: Math.abs(x) > FREE_ROAM_LIMIT || Math.abs(z) > FREE_ROAM_LIMIT ? 0 : speed, heading,
    x: Math.max(-FREE_ROAM_LIMIT, Math.min(FREE_ROAM_LIMIT, x)), z: Math.max(-FREE_ROAM_LIMIT, Math.min(FREE_ROAM_LIMIT, z)) }
}
