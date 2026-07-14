// Scoring manager: owns the run-time scoring state (score, stats, multiplier)
// in a ref. Consumes gameplay events emitted by detectors and updates a
// cohesive totals blob. Reads config from scoringRules; emits nothing to UI
// directly — the GameWorld pushes a throttled snapshot to the store.

import { SCORE, distancePoints, overtakePoints, nearMissPoints, multiplierForDistance } from '@/game/scoring/scoringRules'

export function createScoringManager() {
  const state = {
    score: 0,
    distanceMeters: 0,
    collisionFreeMeters: 0,
    multiplier: 1,
    overtakes: 0,
    nearMisses: 0,
    collisions: 0,
    topSpeed: 0,
  }

  function addDistance(meters, topSpeed) {
    state.distanceMeters += meters
    state.collisionFreeMeters += meters
    state.topSpeed = Math.max(state.topSpeed, topSpeed)
    state.multiplier = multiplierForDistance(state.collisionFreeMeters)
    state.score += distancePoints(meters) * state.multiplier
  }

  function addOvertake() {
    state.overtakes += 1
    state.score += overtakePoints(state.multiplier)
  }

  function addNearMiss({ relativeSpeed }) {
    state.nearMisses += 1
    state.score += nearMissPoints({ relativeSpeed, multiplier: state.multiplier })
  }

  function onCollision() {
    state.collisions += 1
    state.collisionFreeMeters = 0
    state.multiplier = 1
  }

  function snapshot() {
    return {
      score: Math.floor(state.score),
      distanceMeters: state.distanceMeters,
      multiplier: state.multiplier,
      overtakes: state.overtakes,
      nearMisses: state.nearMisses,
      collisions: state.collisions,
      topSpeed: state.topSpeed,
    }
  }

  return {
    state,
    addDistance,
    addOvertake,
    addNearMiss,
    onCollision,
    snapshot,
    get score() {
      return Math.floor(state.score)
    },
  }
}
