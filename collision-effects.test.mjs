import assert from 'node:assert/strict'
import { playImpact } from './src/game/audio/impact.js'
let peak = 0
const node = () => ({ connect(next) { return next }, disconnect() {} })
const context = { state: 'running', currentTime: 0, destination: {},
  createBufferSource: () => ({ ...node(), start() {}, stop() {} }),
  createBiquadFilter: () => ({ ...node(), frequency: {} }),
  createGain: () => ({ ...node(), gain: { setValueAtTime(v) { peak = v }, exponentialRampToValueAtTime() {} } }),
}
playImpact(context, {}, 'severe', 1, 40)
const quiet = peak
playImpact(context, {}, 'severe', 1, 160)
assert.ok(peak > quiet, 'impact volume increases with relative speed')
assert.ok(peak <= .8, 'impact volume stays bounded')
console.log('Impact audio scales with relative speed and stays bounded')
