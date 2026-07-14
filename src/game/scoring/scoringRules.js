// All scoring tuning lives here (no magic numbers in logic/components).
// Values are read by the scoring manager, detectors, and HUD.

export const SCORE = {
  // Distance: points per meter traveled (continuous base score).
  pointsPerMeter: 1,

  // Clean overtake (same-direction vehicle passed, no collision).
  cleanOvertake: 100,

  // Near miss: base + speed-scaled bonus up to a cap.
  nearMissBase: 250,
  nearMissMaxBonus: 250, // -> up to 500 at high relative speed
  nearMissMinRelativeSpeed: 30, // km/h below this doesn't qualify
  nearMissMaxRelativeSpeed: 120, // at/above this = full bonus

  // Multiplier: grows with continuous collision-free driving, resets on crash.
  multiplierStepMeters: 500, // every N meters adds a step
  multiplierMax: 5,
  multiplierStepSize: 0.5, // +0.5 per step (1, 1.5, 2, ...)

  // Collision reward reset.
  resetMultiplierOnCollision: true,
  collisionPenaltyPoints: 0, // integrity loss handled separately; no score add
}

// Compute distance points for a meter delta.
export function distancePoints(meters) {
  return meters * SCORE.pointsPerMeter
}

// Compute clean-overtake points (with current multiplier applied).
export function overtakePoints(multiplier) {
  return Math.round(SCORE.cleanOvertake * (multiplier || 1))
}

// Compute near-miss points: base + bonus scaled by relative speed, times mult.
export function nearMissPoints({ relativeSpeed, multiplier }) {
  const span = SCORE.nearMissMaxRelativeSpeed - SCORE.nearMissMinRelativeSpeed
  const t = Math.max(0, Math.min(1, (relativeSpeed - SCORE.nearMissMinRelativeSpeed) / span))
  const raw = SCORE.nearMissBase + SCORE.nearMissMaxBonus * t
  return Math.round(raw * (multiplier || 1))
}

// Given total collision-free distance, return the current multiplier step.
export function multiplierForDistance(collisionFreeMeters) {
  const steps = Math.floor(collisionFreeMeters / SCORE.multiplierStepMeters)
  return Math.min(SCORE.multiplierMax, 1 + steps * SCORE.multiplierStepSize)
}
