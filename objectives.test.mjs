import { createObjectiveManager } from '@/game/objectives/ObjectiveManager'
import { evaluateObjective, OBJECTIVE_TYPE } from '@/game/objectives/objectiveDefinitions'
import { ENDLESS_CHALLENGES } from '@/game/objectives/missionDefinitions'

let fail = 0
const assert = (cond, msg) => { if (!cond) { console.log('FAIL:', msg); fail++ } }

// Evaluate every initial objective type against a stats blob.
const evaluators = {
  [OBJECTIVE_TYPE.DISTANCE]: { target: 2000, stats: { distanceMeters: 1000 } },
  [OBJECTIVE_TYPE.SURVIVAL_TIME]: { target: 60, stats: { survivalTime: 30 } },
  [OBJECTIVE_TYPE.SCORE]: { target: 10000, stats: { score: 5000 } },
  [OBJECTIVE_TYPE.OVERTAKES]: { target: 10, stats: { overtakes: 5 } },
  [OBJECTIVE_TYPE.NEAR_MISSES]: { target: 5, stats: { nearMisses: 3 } },
  [OBJECTIVE_TYPE.MAINTAIN_SPEED]: { target: 30, stats: { maintainSpeedSeconds: 15 } },
  [OBJECTIVE_TYPE.COLLISION_FREE]: { target: 60, stats: { collisionFreeSeconds: 30 } },
  [OBJECTIVE_TYPE.MINIMUM_INTEGRITY]: { target: 50, stats: { integrity: 25 } },
}
for (const type of Object.values(OBJECTIVE_TYPE)) {
  const { target, stats } = evaluators[type]
  const def = { id: 'x', type, title: 't', description: 'd', target }
  const obj = { ...def, index: 0, progress: 0, completed: false }
  const r = evaluateObjective(obj, stats)
  assert(r.progress > 0 && r.progress < 1, `${type} partial progress`)
}
// MINIMUM_INTEGRITY at/above target reports done
assert(
  evaluateObjective({ type: OBJECTIVE_TYPE.MINIMUM_INTEGRITY, target: 50 }, { integrity: 50 }).done,
  'MINIMUM_INTEGRITY done at threshold'
)
// progress clamped to 0..1
assert(evaluateObjective({ type: OBJECTIVE_TYPE.DISTANCE, target: 2000 }, { distanceMeters: 9999 }).progress === 1,
  'progress clamped to 1')

// Mission mode: objectives progress in strict sequence.
const mgr = createObjectiveManager({ mode: 'mission' })
assert(mgr.state.stages.length === 5, 'mission has 5 stages')
// First active stage before any completion.
let snap = mgr.snapshot()
assert(snap.active.id === 'dist-2km', 'first stage active')
// Reaching the stage completes it and advances to the next stage.
const firstRes = mgr.update({ distanceMeters: 2000, survivalTime: 0, score: 0, speedKmh: 0, integrity: 100, overtakes: 0, nearMisses: 0, collisions: 0, topSpeed: 0 }, 0.1)
assert(firstRes.rewardDelta === 1000, 'first stage rewards 1000')
snap = mgr.snapshot()
assert(snap.completedCount === 1, 'completedCount advances after first done')
assert(snap.active && snap.active.id === 'overtake-10', 'advances to second stage')
// Sustained objectives (MAINTAIN_SPEED, COLLISION_FREE) require time to
// accumulate; drive many frames with healthy stats to finish the mission.
let reward = firstRes.rewardDelta
for (let i = 0; i < 800; i++) {
  const res = mgr.update(
    { distanceMeters: 99999, survivalTime: 99999, score: 99999, speedKmh: 140, integrity: 100, overtakes: 99, nearMisses: 99, collisions: 0, topSpeed: 160 },
    0.1,
  )
  reward += res.rewardDelta
}
assert(mgr.state.missionComplete === true, 'mission completes all stages')
assert(reward > 0, 'mission rewards accumulate')

// Endless mode: one rotating optional challenge; failing never ends the run.
const em = createObjectiveManager({ mode: 'endless' })
assert(em.state.challenge && em.state.challenge.id === ENDLESS_CHALLENGES[0].id, 'endless starts on first challenge')
// Completing a challenge (caller then rotates) never ends the run. The
// ObjectiveManager exposes rotateChallenge for the caller; update() only
// marks the challenge done and awards its reward once.
const firstId = em.state.challenge.id
const emRes = em.update({ distanceMeters: 0, survivalTime: 0, score: 0, speedKmh: 0, integrity: 100, overtakes: 0, nearMisses: 5, collisions: 0, topSpeed: 0 }, 0.1)
assert(emRes.rewardDelta === ENDLESS_CHALLENGES[0].reward && em.state.challengeDone, 'challenge completed + rewarded')
em.rotateChallenge()
assert(em.state.challenge.id !== firstId, 'challenge rotates after completion')
assert(em.state.missionComplete === false, 'endless never reports mission complete')
// Rewards are added once per challenge completion.
const e2 = createObjectiveManager({ mode: 'endless' })
let er = e2.update({ distanceMeters: 0, survivalTime: 0, score: 0, speedKmh: 0, integrity: 100, overtakes: 0, nearMisses: 5, collisions: 0, topSpeed: 0 }, 0.1)
assert(er.rewardDelta === ENDLESS_CHALLENGES[0].reward, 'endless reward awarded once')
let er2 = e2.update({ distanceMeters: 0, survivalTime: 0, score: 0, speedKmh: 0, integrity: 100, overtakes: 0, nearMisses: 5, collisions: 0, topSpeed: 0 }, 0.1)
assert(er2.rewardDelta === 0, 'no repeat reward before rotation')

// Reward-once semantics in mission mode: a completed stage does not re-reward.
const once = createObjectiveManager({ mode: 'mission' })
let prev = once.update({ distanceMeters: 2000, survivalTime: 0, score: 0, speedKmh: 0, integrity: 100, overtakes: 0, nearMisses: 0, collisions: 0, topSpeed: 0 }, 0.1)
assert(prev.rewardDelta === 1000, 'first reward 1000')
let rep = once.update({ distanceMeters: 2000, survivalTime: 0, score: 0, speedKmh: 0, integrity: 100, overtakes: 0, nearMisses: 0, collisions: 0, topSpeed: 0 }, 0.1)
assert(rep.rewardDelta === 0, 'no repeat reward for same stage')

console.log(fail === 0 ? 'ALL OBJECTIVE TESTS PASSED' : fail + ' OBJECTIVE TESTS FAILED')
process.exit(fail === 0 ? 0 : 1)
