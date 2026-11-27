import assert from 'node:assert/strict'
let saved = 'null'
globalThis.localStorage = {getItem: () => saved, setItem: (_, value) => {saved = value}}
const {useSettingsStore: store} = await import('./src/stores/useSettingsStore.js')
assert.equal(store.getState().environment, 'countryside')
store.getState().setSetting('sensitivity', 100)
assert.equal(store.getState().sensitivity, 2)
store.getState().setSetting('environment', 'coast')
assert.equal(JSON.parse(saved).environment, 'coast')
localStorage.setItem = () => {throw new Error('Storage full')}
store.getState().setSetting('quality','low')
assert.equal(store.getState().quality, 'low')
assert.match(store.getState().persistenceError, /could not be saved/)
console.log('Settings restore, bounds, persistence and storage-failure tests passed')
