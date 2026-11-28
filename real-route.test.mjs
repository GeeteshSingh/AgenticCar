import assert from 'node:assert/strict'
import { createRealRoute } from './src/game/world/realRoute.js'
const route = createRealRoute([{x:0,z:0,y:2},{x:0,z:100,y:12},{x:100,z:100,y:22},{x:0,z:100,y:32}])
assert.equal(route.length,300)
assert.deepEqual(route.sample(50), {x:0,z:50,y:7,heading:0,pitch:Math.atan(.1)})
const turn = route.relative(50,150)
assert.ok(Math.abs(turn.x-50)<1e-9 && Math.abs(turn.z-50)<1e-9)
const hairpin = route.relative(150,250)
assert.ok(Math.abs(hairpin.x)<1e-9 && Math.abs(hairpin.z)<1e-9)
assert.ok(Math.abs(Math.abs(hairpin.heading)-Math.PI)<1e-9)
assert.equal(route.sample(-100).z,0)
assert.equal(route.sample(999).x,0)
assert.throws(()=>createRealRoute([{x:0,z:0,y:0},{x:0,z:0,y:1}]),/duplicate/i)
assert.throws(()=>createRealRoute([{x:0,z:NaN,y:0},{x:1,z:1,y:0}]),/finite/i)
console.log('Real route interpolation, local turns, hairpin and bounds passed')

const { tharPrototype } = await import('./src/game/world/tharPrototype.js')
assert.ok(tharPrototype.length > 3000 && tharPrototype.length < 3050)

const { sampleRoad } = await import('./src/game/world/roadProfile.js')
const end = tharPrototype.length
for (const distance of [end - .001, end, end + .001, end + 1000, end + 100000]) {
  const p = sampleRoad(distance, 1, 'thar_test')
  assert.ok(Object.values(p).every(Number.isFinite))
}
assert.ok(Math.abs(sampleRoad(end + .001, 1, 'thar_test').x - sampleRoad(end, 1, 'thar_test').x) < .01)
assert.notEqual(sampleRoad(end + 1000, 1, 'thar_test').x, sampleRoad(end, 1, 'thar_test').x)
