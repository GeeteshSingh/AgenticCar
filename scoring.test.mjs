import { SCORE, distancePoints, overtakePoints, nearMissPoints, multiplierForDistance } from '@/game/scoring/scoringRules'
import { createOvertakeDetector } from '@/game/scoring/overtakeDetector'
import { createNearMissDetector } from '@/game/scoring/nearMissDetector'
import { createScoringManager } from '@/game/scoring/ScoringManager'

let fail = 0
const assert = (cond, msg) => { if (!cond) { console.log('FAIL:', msg); fail++ } }

// scoringRules math
assert(distancePoints(10) === 10, 'distance points = meters * 1')
assert(overtakePoints(2) === SCORE.cleanOvertake * 2, 'overtake scaled by mult')
const nm = nearMissPoints({ relativeSpeed: SCORE.nearMissMaxRelativeSpeed, multiplier: 1 })
assert(nm === SCORE.nearMissBase + SCORE.nearMissMaxBonus, 'near miss max = base+bonus, got ' + nm)
const nmLow = nearMissPoints({ relativeSpeed: SCORE.nearMissMinRelativeSpeed, multiplier: 1 })
assert(nmLow === SCORE.nearMissBase, 'near miss min = base, got ' + nmLow)
assert(multiplierForDistance(0) === 1, 'mult starts at 1')
assert(multiplierForDistance(SCORE.multiplierStepMeters) === 1 + SCORE.multiplierStepSize, 'mult steps up')
assert(multiplierForDistance(1e9) === SCORE.multiplierMax, 'mult capped')

// Overtake detector: counts a same-direction car once when it passes behind
const od = createOvertakeDetector()
const sameAhead = { id: 't1', direction: 1, z: 20 }
od.registerAhead(sameAhead)
assert(od.detect(0, [sameAhead]).length === 0, 'ahead not yet overtaken')
const passed = od.detect(0, [{ id: 't1', direction: 1, z: -5 }])
assert(passed.length === 1 && passed[0] === 't1', 'counts once when behind')
assert(od.detect(0, [{ id: 't1', direction: 1, z: -5 }]).length === 0, 'not double counted')
// collided vehicle is NOT credited
const od2 = createOvertakeDetector()
od2.registerAhead({ id: 'c1', direction: 1, z: 10 })
od2.markCollided('c1')
assert(od2.detect(0, [{ id: 'c1', direction: 1, z: -5 }]).length === 0, 'collided not credited')
// oncoming never counts as overtake
const od3 = createOvertakeDetector()
assert(od3.detect(0, [{ id: 'o1', direction: -1, z: -5 }]).length === 0, 'oncoming not overtake')

// Near-miss detector: awards once per vehicle, requires speed + proximity
const nd = createNearMissDetector()
const v = { id: 'n1', x: 0.5, z: 0, direction: -1, speed: 120 } // player also at x~0
const m1 = nd.detect({ playerX: 0, vehicles: [v], playerSpeed: 100 })
assert(m1.length === 1 && m1[0].vehicleId === 'n1', 'near miss awarded')
assert(nd.detect({ playerX: 0, vehicles: [v], playerSpeed: 100 }).length === 0, 'not double awarded')
// too slow -> skipped
const nd2 = createNearMissDetector()
assert(nd2.detect({ playerX: 0, vehicles: [{ id: 's', x: 0.5, z: 0, direction: 1, speed: 10 }], playerSpeed: 10 }).length === 0, 'too slow skipped')
// too far laterally -> no miss
const nd3 = createNearMissDetector()
assert(nd3.detect({ playerX: 0, vehicles: [{ id: 'f', x: 5, z: 0, direction: -1, speed: 120 }], playerSpeed: 100 }).length === 0, 'too far skipped')

// Scoring manager integration
const sm = createScoringManager()
sm.addDistance(100, 60)
const before = sm.state.score
sm.addOvertake()
sm.addNearMiss({ relativeSpeed: 120 })
assert(sm.state.overtakes === 1 && sm.state.nearMisses === 1, 'counters increment')
assert(sm.state.score > before, 'score increases with awards')
sm.onCollision()
assert(sm.state.collisions === 1 && sm.state.multiplier === 1, 'collision resets multiplier')
assert(sm.state.score >= 0, 'score non-negative')
// distance grows multiplier over time
const sm2 = createScoringManager()
for (let i = 0; i < 20; i++) sm2.addDistance(SCORE.multiplierStepMeters, 50)
assert(sm2.state.multiplier > 1, 'multiplier grows with collision-free distance')

console.log(fail === 0 ? 'ALL SCORING TESTS PASSED' : fail + ' SCORING TESTS FAILED')
process.exit(fail === 0 ? 0 : 1)
