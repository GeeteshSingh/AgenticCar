import assert from 'node:assert/strict'
import { emitImpact, subscribeImpact, playImpact } from './src/game/audio/impact.js'
let calls = 0
const unsubscribe = subscribeImpact(value => { assert.equal(value, 'severe'); calls++ })
emitImpact('severe'); unsubscribe(); emitImpact('light')
assert.equal(calls, 1, 'unmount removes impact listener')
let voices = 0, stops = 0, disconnects = 0, peak = 0
const node = () => ({connect(next) { return next }, disconnect() { disconnects++ }})
let source
const context = {
  state: 'running', currentTime: 10, destination: {},
  createBufferSource() { voices++; source = {...node(), start(t) { assert.equal(t, 10) }, stop(t) { assert.equal(t, 10.32); stops++ }}; return source },
  createBiquadFilter() { return {...node(), frequency: {value: 0}} },
  createGain() { return {...node(), gain: {setValueAtTime(v) { peak = v }, exponentialRampToValueAtTime(v, t) { assert.equal(v, .001); assert.equal(t, 10.3) }}} },
}
playImpact(context, {}, 'severe', 0)
playImpact({...context, state: 'suspended'}, {}, 'severe', 1)
playImpact(context, {}, 'unknown', 1)
assert.equal(voices, 0, 'muted, suspended and invalid impacts stay silent')
playImpact(context, {}, 'severe', .5)
assert.equal(voices, 1); assert.equal(stops, 1); assert.equal(peak, .4)
source.onended()
assert.equal(disconnects, 3, 'finished voice disconnects all nodes')
console.log('Impact audio lifecycle, mute and bounded voice tests passed')
