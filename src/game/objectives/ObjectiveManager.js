import { buildObjective, evaluateObjective } from '@/game/objectives/objectiveDefinitions'
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

  // Update sustained timers from current stats.
  function tickSustained(stats, dt) {
    const aboveSpeed = stats.speedKmh >= 120
    state.maintainSpeedSeconds = aboveSpeed ? state.maintainSpeedSeconds + dt : 0

    // collision-free timer resets whenever a collision happened since last tick
    if (stats.collisions > (state._lastCollisions || 0)) {
      state.collisionFreeSeconds = 0
    }
    state._lastCollisions = stats.collisions
    state.collisionFreeSeconds += dt
  }

  // Returns { completed: [{id,reward}], allDone, rewardDelta }
  function update(stats, dt) {
    tickSustained(stats, dt)

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
        const { progress, done } = evaluateObjective(built, enriched)
        state._chProgress = progress
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
  function rotateChallenge() {
    if (mode !== 'endless') return
    state.challengeIndex = (state.challengeIndex + 1) % ENDLESS_CHALLENGES.length
    state.challenge = { ...ENDLESS_CHALLENGES[state.challengeIndex] }
    state.challengeDone = false
    state._chProgress = 0
  }

  function reset() {
    const fresh = createObjectiveManager({ mode })
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
            progress: state._chProgress || 0,
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
