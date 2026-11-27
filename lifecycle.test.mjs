import assert from 'node:assert/strict'
import { useGameStore as store } from '@/stores/useGameStore'
store.getState().startRun('endless')
store.getState().beginPlaying()
store.getState().updateStats({score: 321, distanceMeters: 90, integrity: 42, topSpeed: 180})
store.getState().pause()
store.getState().resume()
assert.equal(store.getState().score, 321)
assert.equal(store.getState().integrity, 42)
store.getState().finishRun({score: 400, survivalTime: 12.4, topSpeed: 190, collisions: 3, integrity: 0})
assert.equal(store.getState().survivalTime, 12.4)
assert.equal(store.getState().collisions, 3)
assert.equal(store.getState().topSpeed, 190)
assert.equal(store.getState().phase, 'results')
store.getState().startRun('mission')
assert.equal(store.getState().score, 0)
assert.equal(store.getState().integrity, 100)
console.log('Lifecycle and terminal snapshot tests passed')
store.setState({cameraMode: 'chase'})
for (const expected of ['hood', 'interior', 'chase']) {
  store.getState().toggleCameraMode()
  assert.equal(store.getState().cameraMode, expected)
}
