import assert from 'node:assert/strict'
import { formatLiveStats, loadLiveStats } from './src/config/liveStats.js'
import { createPresence, recordStart, PRESENCE_MS, HEARTBEAT_MIN_MS, DEDUPE_MS } from './worker/liveStatsLogic.js'
assert.equal(formatLiveStats(null), null)
assert.equal(formatLiveStats({online:-1,total:0}), null)
assert.equal(formatLiveStats({online:2,total:99}), 'Be one of the first drivers')
assert.equal(formatLiveStats({online:3,total:100}), '3 online · 100 driving sessions started')
assert.equal(formatLiveStats({online:123456,total:100000}), '1,23,456 online · 1,00,000 driving sessions started')
assert.equal(formatLiveStats({online:NaN,total:10}), null)
assert.equal(await loadLiveStats(async () => { throw new Error('offline') }), null)
assert.equal(await loadLiveStats(async () => ({ok:false})), null)
assert.equal(await loadLiveStats(async () => ({ok:true,headers:{get:()=> 'text/html'}})), null)
const presence = createPresence(), id = '12345678-1234-4234-8234-123456789abc'
assert.equal(presence.beat(id, 0), true)
assert.equal(presence.beat(id, HEARTBEAT_MIN_MS-1), false)
assert.equal(presence.beat(id, HEARTBEAT_MIN_MS), true)
assert.equal(presence.count(HEARTBEAT_MIN_MS + PRESENCE_MS), 0)
assert.equal(presence.beat('invalid', 0), false)
assert.equal(DEDUPE_MS, 24 * 60 * 60 * 1000)
const hashes = new Set(); let total = 0, purgeCutoff

const storage = { transactionSync: fn => fn() }
const sql = { exec: (query, ...args) => {
  if (query.startsWith('DELETE')) purgeCutoff = args[0]
  if (query.startsWith('INSERT OR IGNORE')) { const exists = hashes.has(args[0]); hashes.add(args[0]); return {rowsWritten:exists ? 0 : 1} }
  if (query.startsWith('UPDATE')) total++
  return {rowsWritten:0}
} }
assert.equal(recordStart(storage, sql, 'hash', 100), true)
assert.equal(recordStart(storage, sql, 'hash', 101), false)
assert.equal(total, 1)
assert.equal(purgeCutoff, 101 - DEDUPE_MS)
console.log('Live counter thresholds and formatting passed')
