import assert from 'node:assert/strict'
import { engineMix, trafficMix, soundProfile } from './src/game/audio/drivingMix.js'
const idle = engineMix(0, .12, 'playing', 'suv')
assert.ok(idle.frequency >= 80, 'idle fundamental is audible on ordinary speakers')
assert.ok(idle.gain >= .015, 'saved low volume has useful idle output')
assert.ok(engineMix(120, .12, 'playing', 'suv').frequency > idle.frequency)
assert.equal(engineMix(100, 1, 'paused', 'suv').gain, 0)
assert.equal(engineMix(100, 0, 'playing', 'suv').gain, 0)
assert.equal(engineMix(20, 1, 'playing', 'cycle').gain, 0, 'bicycle has no motor')
const vehicles = [{active:true,x:3,z:5,speed:80,direction:-1}, {active:true,x:-3,z:15,speed:50,direction:1}, {active:false,x:0,z:0,speed:80}, {active:true,x:0,z:500,speed:80}]
const nearby = trafficMix(vehicles, 0, 80, .5, 'playing')
assert.equal(nearby.length, 2)
assert.ok(nearby[0].gain > nearby[1].gain)
assert.ok(nearby[0].pan < 0 && nearby[1].pan > 0)
assert.deepEqual(trafficMix(vehicles, 0, 80, .5, 'paused'), [])
assert.ok(trafficMix(Array(30).fill(vehicles[0]),0,80,1,'playing').length <= 3)
console.log('Engine audibility, pause/mute, bicycle and bounded spatial traffic tests passed')

const types = ['suv','truck','cycle','hatch','sedan','auto','bike','bus','pickup']
assert.equal(new Set(types.map(type => soundProfile(type).horn.join(','))).size, 9)
assert.equal(new Set(types.filter(type => type !== 'cycle').map(type => engineMix(60, 1, 'playing', type).frequency)).size, 8)
