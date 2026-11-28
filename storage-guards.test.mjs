import { test } from 'node:test'
import assert from 'node:assert/strict'

test('settings and radio recover safely from unreadable and invalid storage', async () => {
  const cases = [null, '{broken', 'null', '[]', '42', '{"quality":"bad","vehicle":-9,"favorites":"bad","unknown":1}']
  for (const [i, value] of cases.entries()) {
    globalThis.localStorage = { getItem: () => value, setItem: () => {} }
    const { useSettingsStore } = await import(`./src/stores/useSettingsStore.js?test=${i}`)
    const { useRadioStore } = await import(`./src/stores/useRadioStore.js?test=${i}`)
    assert.equal(useSettingsStore.getState().quality, 'medium')
    assert.equal(useSettingsStore.getState().vehicle, 0)
    assert.deepEqual(useRadioStore.getState().favorites, [])
    assert.equal(useSettingsStore.getState().unknown, undefined)
  }
  globalThis.localStorage = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') } }
  const { useSettingsStore } = await import('./src/stores/useSettingsStore.js?test=blocked')
  const { useRadioStore } = await import('./src/stores/useRadioStore.js?test=blocked')
  assert.equal(useSettingsStore.getState().quality, 'medium')
  assert.deepEqual(useRadioStore.getState().favorites, [])
  useSettingsStore.getState().setSetting('quality', 'low')
  assert.match(useSettingsStore.getState().persistenceError, /could not be saved/)
  useRadioStore.getState().setVolume(.4)
  assert.match(useRadioStore.getState().persistenceError, /could not be saved/)
})
