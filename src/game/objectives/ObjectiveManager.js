import { buildObjective, evaluateObjective, OBJECTIVE_TYPE } from '@/game/objectives/objectiveDefinitions'
import { getMission, ENDLESS_CHALLENGES } from '@/game/objectives/missionDefinitions'

// Owns objective progression in a ref. Works in two modes:
//  - mission: sequential stages; run completes when all done or integrity 0.
//  - endless: one rotating optional challenge at a time; failing it does NOT
//    end the run (no failureCondition wired), the next challenge replaces it.
//
// Sustained objectives (MAINTAIN_SPEED, COLLISION_FREE) need a timer that only
// accumulates while the condition holds. We track maintainSpeedSeconds and
// collisionFreeSeconds in the stats snapshot passed into evaluate.

export function createObjectiveManager({ mode }) {
  const state = {
    mode,
    currentStage: 0, // mission index
    stages: [], // built objective objects
    missionComplete: false,
    // endless
    challengeIndex: 0,
    challenge: null,
    challengeDone: false,
    challengeProgress: 0,
    challengeBaseline: {},
    lastStats: {},
    lastCollisions: 0,
    // rewards accumulated this run
    rewardsEarned: 0,
    // sustained-timer accumulators
    maintainSpeedSeconds: 0,
    collisionFreeSeconds: 0,
  }

  if (mode === 'mission') {
    const mission = getMission('campaign_1')
    state.stages = mission.stages.map((d, i) => buildObjective(d, i))
    state.environment = mission.environment
  } else {
    state.challenge = { ...ENDLESS_CHALLENGES[0] }
  }

  // Sustained requirements apply to the active stage, not earlier driving.
  function tickSustained(stats, dt) {
    const type = mode === 'mission'
      ? state.stages[state.currentStage]?.type
      : state.challenge?.type
    const seconds = Number.isFinite(dt) ? Math.max(0, dt) : 0
    state.maintainSpeedSeconds = type === OBJECTIVE_TYPE.MAINTAIN_SPEED && stats.speedKmh >= 120
      ? state.maintainSpeedSeconds + seconds : 0
    const collided = stats.collisions > state.lastCollisions
    state.collisionFreeSeconds = type === OBJECTIVE_TYPE.COLLISION_FREE && !collided
      ? state.collisionFreeSeconds + seconds : 0
    state.lastCollisions = stats.collisions || 0
  }

  function clearTimers() {
    state.maintainSpeedSeconds = 0
    state.collisionFreeSeconds = 0
  }

  // Returns { completed: [{id,reward}], allDone, rewardDelta }
  function update(stats, dt) {
    tickSustained(stats, dt)
    state.lastStats = { ...stats }

    const enriched = {
      ...stats,
      maintainSpeedSeconds: state.maintainSpeedSeconds,
      collisionFreeSeconds: state.collisionFreeSeconds,
    }

    const completedNow = []
    let rewardDelta = 0

    if (mode === 'mission') {
      const stage = state.stages[state.currentStage]
      if (stage && !stage.completed) {
        const { progress, done } = evaluateObjective(stage, enriched)
        stage.progress = progress
        if (done) {
          stage.completed = true
          completedNow.push(stage)
          rewardDelta += stage.reward
          state.rewardsEarned += stage.reward
          state.currentStage += 1
          clearTimers()
          if (state.currentStage >= state.stages.length) state.missionComplete = true
        }
      }
      if (state.missionComplete) {
        return { completed: completedNow, rewardDelta, allDone: true, missionComplete: true }
      }
      return { completed: completedNow, rewardDelta, allDone: false, missionComplete: false }
    } else {
      // endless single rotating challenge
      const ch = state.challenge
      if (ch && !state.challengeDone) {
        const built = buildObjective(ch, 0)
        const relative = { ...enriched }
        // These are monotonically increasing totals. Each optional challenge
        // measures only progress earned after its activation.
        for (const key of ['distanceMeters', 'survivalTime', 'score', 'overtakes', 'nearMisses']) {
          relative[key] = Math.max(0, (stats[key] || 0) - (state.challengeBaseline[key] || 0))
        }
        const { progress, done } = evaluateObjective(built, relative)
        state.challengeProgress = progress
        if (done) {
          state.challengeDone = true
          completedNow.push({ ...built, reward: ch.reward })
          rewardDelta += ch.reward
          state.rewardsEarned += ch.reward
        }
      }
      return { completed: completedNow, rewardDelta, allDone: false, missionComplete: false }
    }
  }

  // Endless: rotate to the next challenge (called after completion or a manual
  // refresh). Does not fail the run.
  function rotateChallenge(stats) {
    if (mode !== 'endless') return
    // The caller normally applies the completion reward before rotating.
    // An explicit snapshot may be supplied; otherwise account for that reward
    // so it cannot become free progress toward a later score challenge.
    state.challengeBaseline = stats ? { ...stats } : {
      ...state.lastStats,
      score: (state.lastStats.score || 0) + (state.challengeDone ? state.challenge.reward : 0),
    }
    clearTimers()
    state.challengeIndex = (state.challengeIndex + 1) % ENDLESS_CHALLENGES.length
    state.challenge = { ...ENDLESS_CHALLENGES[state.challengeIndex] }
    state.challengeDone = false
    state.challengeProgress = 0
  }

  function reset() {
    const fresh = createObjectiveManager({ mode })
    for (const key of Object.keys(state)) delete state[key]
    Object.assign(state, fresh.state)
  }

  function snapshot() {
    if (mode === 'mission') {
      const active = state.stages[state.currentStage]
      return {
        mode,
        missionComplete: state.missionComplete,
        active: active
          ? {
              id: active.id,
              title: active.title,
              description: active.description,
              target: active.target,
              reward: active.reward,
              progress: active.progress,
              type: active.type,
            }
          : null,
        completedCount: state.stages.filter((s) => s.completed).length,
        totalCount: state.stages.length,
        rewardsEarned: state.rewardsEarned,
      }
    }
    return {
      mode,
      missionComplete: false,
      active: state.challenge
        ? {
            id: state.challenge.id,
            title: state.challenge.title,
            description: state.challenge.description,
            target: state.challenge.target,
            reward: state.challenge.reward,
            progress: state.challengeProgress || 0,
            type: state.challenge.type,
            optional: true,
          }
        : null,
      completedCount: 0,
      totalCount: 0,
      rewardsEarned: state.rewardsEarned,
    }
  }

  return { state, update, rotateChallenge, reset, snapshot }
}
