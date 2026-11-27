import { KMH_TO_MS } from '@/game/config/vehicleConfig'

// Read from the same controller state ref used for lateral position.
export function readPlayerSpeed(state) {
  return Number.isFinite(state?.speed) ? state.speed : 0
}

// Limit catch-up after tab suspension so cars cannot jump across the player.
export function trafficStep(dt) {
  return Number.isFinite(dt) ? Math.min(1 / 30, Math.max(0, dt)) : 0
}

export function trafficDeltaZ(playerSpeed, vehicle, dt) {
  return -(playerSpeed - vehicle.speed * vehicle.direction) * KMH_TO_MS * trafficStep(dt)
}
