import assert from 'node:assert/strict'
import { shouldPreventGameKey } from './src/game/input/keyPolicy.js'
import { shouldShowTouchControls } from './src/game/input/inputMode.js'
assert.equal(shouldShowTouchControls({coarse:true,fine:false,requested:false}), true)
assert.equal(shouldShowTouchControls({coarse:true,fine:true,requested:false}), false)
assert.equal(shouldShowTouchControls({coarse:true,fine:true,requested:true}), true)
const event = code => ({ code, ctrlKey:false, metaKey:false, altKey:false, isComposing:false })
for (const code of ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyW','KeyA','KeyS','KeyD','KeyH','KeyC','KeyP','KeyM','KeyR','Digit1','Digit9']) {
  assert.equal(shouldPreventGameKey(event(code), true), true, code)
  assert.equal(shouldPreventGameKey(event(code), false), false, code)
}
for (const code of ['Tab','F5','F11']) assert.equal(shouldPreventGameKey(event(code), true), false)
for (const modifier of ['ctrlKey','metaKey','altKey','isComposing']) assert.equal(shouldPreventGameKey({...event('KeyR'), [modifier]:true}, true), false)
console.log('Game keyboard policy and browser shortcuts passed')
