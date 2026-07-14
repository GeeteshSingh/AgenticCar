import { closingSpeed, classifySeverity, damageFor, assessCollision, SEVERITY } from '@/game/collision/collisionSeverity'

let fail = 0
const assert = (cond, msg) => { if (!cond) { console.log('FAIL:', msg); fail++ } }

// Closing speed
assert(closingSpeed({ playerSpeed: 100, trafficSpeed: 0, direction: 1 }) === 100, 'same-dir closing = 100')
assert(closingSpeed({ playerSpeed: 100, trafficSpeed: 80, direction: 1 }) === 20, 'same-dir overtaking closing = 20')
assert(closingSpeed({ playerSpeed: 100, trafficSpeed: 80, direction: -1 }) === 180, 'oncoming closing = 180')

// Severity bands (impactKind front)
assert(classifySeverity({ closingKmh: 10, impactKind: 'front' }) === SEVERITY.LIGHT, '10 -> light')
assert(classifySeverity({ closingKmh: 50, impactKind: 'front' }) === SEVERITY.MODERATE, '50 -> moderate')
assert(classifySeverity({ closingKmh: 120, impactKind: 'front' }) === SEVERITY.SEVERE, '120 -> severe')
assert(classifySeverity({ closingKmh: 50, impactKind: 'side' }) === SEVERITY.LIGHT, 'side stays lighter')

// Damage ranges
const lite = damageFor({ severity: SEVERITY.LIGHT, closingKmh: 10 })
assert(lite >= 5 && lite <= 10, 'light damage in 5-10, got ' + lite)
const mod = damageFor({ severity: SEVERITY.MODERATE, closingKmh: 50 })
assert(mod >= 15 && mod <= 30, 'moderate damage in 15-30, got ' + mod)
const sev = damageFor({ severity: SEVERITY.SEVERE, closingKmh: 150 })
assert(sev >= 50 && sev <= 100, 'severe damage in 50-100, got ' + sev)

// Full assessment monotonic: within the uncapped band, faster = more damage
const a = assessCollision({ playerSpeed: 40, trafficSpeed: 20, direction: -1, impactKind: 'front' })
const b = assessCollision({ playerSpeed: 80, trafficSpeed: 40, direction: -1, impactKind: 'front' })
assert(b.damage > a.damage, 'higher speed -> more damage (uncapped band)')
assert(a.damage <= 100 && b.damage <= 100, 'no single hit exceeds 100 integrity')

// Light same-direction tap at low closing shouldn't be severe
const tap = assessCollision({ playerSpeed: 30, trafficSpeed: 25, direction: 1, impactKind: 'side' })
assert(tap.severity !== SEVERITY.SEVERE, 'gentle overtake tap is not severe')

console.log(fail === 0 ? 'ALL COLLISION TESTS PASSED' : fail + ' COLLISION TESTS FAILED')
process.exit(fail === 0 ? 0 : 1)
