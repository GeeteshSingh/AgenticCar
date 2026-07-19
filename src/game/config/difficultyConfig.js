// Difficulty maps a normalized 0..1 value to traffic/visual tuning.
// It is consumed by later phases (traffic, scoring, environment). Kept
// config-only here so Phase 2 has a stable, typed source for difficulty.

export const DIFFICULTY = {
  // Normalized difficulty ramps with distance/time; clamp to [0,1].
  // phaseLengthMeters: distance over which difficulty goes 0 -> 1.
  rampMeters: 6000,
  rampSeconds: 240,

  // Traffic tuning interpolated by difficulty t in [0,1]
  traffic: {
    baseSpawnInterval: 1.6, // seconds between groups at t=0
    minSpawnInterval: 0.7, // at t=1
    sameDirectionSpeedMin: 60,
    sameDirectionSpeedMaxT0: 100,
    sameDirectionSpeedMaxT1: 140,
    oncomingSpeedMin: 70,
    oncomingSpeedMax: 150,
    maxActiveVehiclesT0: 6,
    maxActiveVehiclesT1: 20,
    safeGapMeters: 14,
  },

  // Score multiplier bonus from difficulty
  scoreMultiplierBonusT1: 0.5,
}

export function lerp(a, b, t) {
  return a + (b - a) * Math.min(1, Math.max(0, t))
}

// Compute normalized difficulty from distance + time (whichever is further).
export function difficultyFromProgress(distanceMeters, survivalSeconds) {
  const dDist = distanceMeters / DIFFICULTY.rampMeters
  const dTime = survivalSeconds / DIFFICULTY.rampSeconds
  return Math.min(1, Math.max(dDist, dTime))
}
