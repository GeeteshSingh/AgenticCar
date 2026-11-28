import assert from 'node:assert/strict'
import { clearSavedData, SAVED_DATA_KEYS } from './src/stores/clearSavedData.js'
const data = new Map([...SAVED_DATA_KEYS.map(key => [key, 'saved']), ['unrelated', 'keep']])
clearSavedData({ removeItem: key => data.delete(key) })
assert.deepEqual([...data.keys()], ['unrelated'])
assert.throws(() => clearSavedData({ removeItem: () => { throw new Error('blocked') } }), /blocked/)
console.log('Clear saved data removes only application keys')
