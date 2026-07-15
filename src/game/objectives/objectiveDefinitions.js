// Objective type definitions. Each objective is evaluated against the live
// run stats each throttled tick. Pure data + a small evaluate function.

export const OBJECTIVE_TYPE = {
  DISTANCE: 'DISTANCE',
  SURVIVAL_TIME: 'SURVIVAL_TIME',
  SCORE: 'SCORE',
  OVERTAKES: 'OVERTAKES',
  NEAR_MISSES: 'NEAR_MISSES',
  MAINTAIN_SPEED: 'MAINTAIN_SPEED',
  COLLISION_FREE: 'COLLISION_FREE',
  MINIMUM_INTEGRITY: 'MINIMUM_INTEGRITY',
}

// progress: returns 0..1 given current run stats + objective.
// stats shape: { distanceMeters, survivalTime, score, overtakes, nearMisses,
//                collisions, integrity, topSpeed, speedKmh }
export const OBJECTIVE_EVALUATORS = {
  [OBJECTIVE_TYPE.DISTANCE]: (stats, obj) => stats.distanceMeters / obj.target,
  [OBJECTIVE_TYPE.SURVIVAL_TIME]: (stats, obj) => stats.survivalTime / obj.target,
  [OBJECTIVE_TYPE.SCORE]: (stats, obj) => stats.score / obj.target,
  [OBJECTIVE_TYPE.OVERTAKES]: (stats, obj) => stats.overtakes / obj.target,
  [OBJECTIVE_TYPE.NEAR_MISSES]: (stats, obj) => stats.nearMisses / obj.target,
  [OBJECTIVE_TYPE.MAINTAIN_SPEED]: (stats, obj) =>
    // Sustained speed over a window: tracked via consecutive maintain timer.
    (stats.maintainSpeedSeconds || 0) / obj.target,
  [OBJECTIVE_TYPE.COLLISION_FREE]: (stats, obj) =>
    // Must avoid collisions for a duration; use sustained no-collision timer.
    (stats.collisionFreeSeconds || 0) / obj.target,
  [OBJECTIVE_TYPE.MINIMUM_INTEGRITY]: (stats, obj) =>
    stats.integrity >= obj.target ? 1 : stats.integrity / obj.target,
}

export function buildObjective(def, index) {
  return {
    id: def.id,
    type: def.type,
    title: def.title,
    description: def.description,
    target: def.target,
    reward: def.reward,
    failureCondition: def.failureCondition ?? null,
    index,
    progress: 0,
    completed: false,
  }
}

// Evaluate one objective against stats -> { progress (0..1), done }
export function evaluateObjective(objective, stats) {
  const fn = OBJECTIVE_EVALUATORS[objective.type]
  if (!fn) return { progress: 0, done: false }
  const progress = Math.max(0, Math.min(1, fn(stats, objective)))
  return { progress, done: progress >= 1 }
}
