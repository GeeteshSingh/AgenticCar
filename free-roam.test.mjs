import assert from 'node:assert/strict'
import { stepFreeRoam, FREE_ROAM_LIMIT, nearbyFreeRoamPlace } from './src/game/world/freeRoamMotion.js'
let s = {x: 0, z: 0, speed: 0, heading: 0}
for (let i=0; i<100; i++) s = stepFreeRoam(s, {accelerate:1,steer:0}, .05)
assert.ok(s.z > 10 && s.speed > 0)
const before = s.heading
for (let i=0; i<50; i++) s = stepFreeRoam(s, {accelerate:1,steer:-1}, .05)
assert.ok(s.heading > before && Math.abs(s.x) > 1, 'steering changes heading and position')
s = {x:0,z:0,speed:0,heading:0}
for (let i=0; i<30; i++) s = stepFreeRoam(s, {brake:1,steer:0}, .05)
assert.ok(s.speed < 0 && s.z < 0, 'reverse moves backwards')
s = {x:0,z:0,speed:15,heading:0}
for (let i=0; i<300; i++) s = stepFreeRoam(s, {}, .05)
assert.equal(s.speed,0, 'releasing controls stops the vehicle')
console.log('Free roam forward, steering, reverse and stopping passed')

assert.equal(nearbyFreeRoamPlace(28,4,0),'Chai stop')
assert.equal(nearbyFreeRoamPlace(-28,164,0),'Desert fuel stop')
assert.equal(nearbyFreeRoamPlace(188,4,8),'')
const edge = stepFreeRoam({x:FREE_ROAM_LIMIT,z:0,speed:90,heading:Math.PI/2},{accelerate:1},.05)
assert.equal(edge.x, FREE_ROAM_LIMIT)
assert.equal(edge.speed, 0)
assert.equal(nearbyFreeRoamPlace(188, 164, 0), 'Desert Market')
assert.equal(nearbyFreeRoamPlace(188, 164, 6), '', 'shop prompt only appears when stopped')
assert.equal(nearbyFreeRoamPlace(300, 164, 0), '', 'shop prompt requires proximity')

for (const [index, cap] of [[0,150],[1,100],[2,30],[3,150],[4,160],[5,60],[6,110],[7,100],[9,400]]) {
 let vehicle = {x:0,z:0,speed:0,heading:0}
 for (let i=0;i<10000;i++) { vehicle = stepFreeRoam(vehicle,{accelerate:1},.05,index); vehicle.x=0; vehicle.z=0 }
 assert.equal(vehicle.speed, cap, `vehicle ${index} reaches its configured cap`)
}
let bicycle = {x:0,z:0,speed:0,heading:0}, car = {...bicycle}
for(let i=0;i<120;i++) { bicycle=stepFreeRoam(bicycle,{accelerate:1},.05,2); car=stepFreeRoam(car,{accelerate:1},.05,3); bicycle.z=car.z=0 }
assert.ok(bicycle.speed < 30 && car.speed === 150, 'bicycle reaches its cap later than car')
