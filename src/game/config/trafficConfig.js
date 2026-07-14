// Traffic configuration: vehicle archetypes, lane direction assignment, and
// spawn distances. Pure data; tuning only here (no magic numbers in logic).

export const TRAFFIC = {
  // How far ahead (meters, +z) vehicles spawn and how far behind (-z) they
  // despawn. Keep within the visible world.
  spawnDistance: 180,
  despawnDistance: -40,

  // Pool size caps simultaneous traffic regardless of difficulty.
  poolSize: 24,

  // Relative z-velocity (toward player) = playerSpeed +/- trafficSpeed.
  // Defined by lane direction below; see TrafficManager.

  // Vehicle archetypes (primitive meshes). width/length in meters.
  types: [
    { id: 'sedan', color: '#ef4444', width: 2.0, length: 4.4, height: 1.4 },
    { id: 'truck', color: '#f59e0b', width: 2.4, length: 7.5, height: 2.6 },
    { id: 'van', color: '#a855f7', width: 2.2, length: 5.2, height: 2.0 },
    { id: 'sport', color: '#22c55e', width: 1.9, length: 4.0, height: 1.2 },
  ],

  // Lane directions. length must match WORLD.laneCount (4).
  //  +1 = same direction as player (player overtakes, slower)
  //  -1 = oncoming (approaches player head-on)
  laneDirections: [1, 1, -1, -1],

  // Min gap (meters in z) required between consecutive same-lane vehicles.
  minGap: 16,
}

// Resolve a lane's world-x center from WORLD config (kept here to avoid
// importing geometry into pure logic modules).
import { WORLD } from '@/game/config/gameConfig'
export function laneCenterX(laneIndex) {
  return -WORLD.roadWidth / 2 + (laneIndex + 0.5) * (WORLD.roadWidth / WORLD.laneCount)
}
