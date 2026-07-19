// Traffic configuration: vehicle archetypes, lane direction assignment, and
// spawn distances. Pure data; tuning only here (no magic numbers in logic).

export const TRAFFIC = {
  // How far ahead (meters, +z) vehicles spawn and how far behind (-z) they
  // despawn. Keep within the visible world. Vehicles spawn at a randomized z
  // within [spawnDistanceMin, spawnDistance] so the spawn-safety escape-lane
  // check does not treat a fresh batch as an unavoidable wall and so the road
  // feels alive instead of cars appearing in a single synchronized line.
  spawnDistance: 220,
  spawnDistanceMin: 130,
  despawnDistance: -50,

  // Pool size caps simultaneous traffic regardless of difficulty.
  poolSize: 28,

  // Relative z-velocity (toward player) = playerSpeed +/- trafficSpeed.
  // Defined by lane direction below; see TrafficManager.

  // Vehicle archetypes (primitive meshes). width/length in meters.
  // Added a 'bus' for more visual variety and larger scoreboard targets.
  types: [
    { id: 'sedan', color: '#ef4444', width: 2.0, length: 4.4, height: 1.4 },
    { id: 'truck', color: '#f59e0b', width: 2.4, length: 7.5, height: 2.6 },
    { id: 'van', color: '#a855f7', width: 2.2, length: 5.2, height: 2.0 },
    { id: 'sport', color: '#22c55e', width: 1.9, length: 4.0, height: 1.2 },
    { id: 'bus', color: '#3b82f6', width: 2.6, length: 9.0, height: 2.8 },
  ],

  // Lane directions. length must match WORLD.laneCount (4).
  //  +1 = same direction as player (player overtakes, slower)
  //  -1 = oncoming (approaches player head-on)
  laneDirections: [1, 1, -1, -1],

  // Min gap (meters in z) required between consecutive same-lane vehicles.
  minGap: 18,

  // Scoreboard-related: points awarded for successfully avoiding/clearing
  // traffic. Used by ScoringManager to keep players engaged.
  clearancePoints: 50,
}

// Resolve a lane's world-x center from WORLD config (kept here to avoid
// importing geometry into pure logic modules).
import { WORLD } from '@/game/config/gameConfig'
export function laneCenterX(laneIndex) {
  return -WORLD.roadWidth / 2 + (laneIndex + 0.5) * (WORLD.roadWidth / WORLD.laneCount)
}
