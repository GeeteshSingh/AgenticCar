import assert from 'node:assert/strict'
import { nearestSafeRoadPoint, ROAD_OBSTACLES, ROAD_POSITIONS, mapPoint, createRespawnCooldown } from './src/game/world/roadGrid.js'
import { FREE_ROAM_PLACES } from './src/game/world/freeRoamMotion.js'

for (const [x,z] of [[28,4],[0,0],[1e6,-1e6],[-28,164]]) {
  const p = nearestSafeRoadPoint(x,z, [{x:0,z:0,halfX:4,halfZ:7}])
  assert.ok(p && (ROAD_POSITIONS.includes(p.x) || ROAD_POSITIONS.includes(p.z)))
  assert.ok(p.heading === 0 || p.heading === Math.PI/2)
  assert.equal(p.speed, 0)
  assert.ok(!ROAD_OBSTACLES.some(o => Math.abs(p.x-o.x)<o.halfX && Math.abs(p.z-o.z)<o.halfZ))
  assert.ok(!(Math.abs(p.x)<4 && Math.abs(p.z)<7))
}
assert.equal(nearestSafeRoadPoint(NaN,0), null)
const cooldown = createRespawnCooldown()
assert.ok(cooldown.ready()); cooldown.activate(); assert.ok(!cooldown.ready())
cooldown.tick(2.9); assert.ok(!cooldown.ready()); cooldown.tick(.1); assert.ok(cooldown.ready())
assert.deepEqual(mapPoint(0,0), {x:500,y:500})
assert.ok(mapPoint(0,100).y < 500)
assert.deepEqual(FREE_ROAM_PLACES.map(x=>x.name), ['Chai stop','Desert fuel stop','Roadside dhaba','Desert Market'])
console.log('Respawn clearance, cooldown and map coordinates passed')
