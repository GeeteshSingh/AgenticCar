import assert from 'node:assert/strict'
import { formatLiveStats } from './src/config/liveStats.js'
assert.equal(formatLiveStats(null), null)
assert.equal(formatLiveStats({online:-1,total:0}), null)
assert.equal(formatLiveStats({online:2,total:99}), 'Be one of the first drivers')
assert.equal(formatLiveStats({online:3,total:100}), '3 driving now · 100 drives started')
assert.equal(formatLiveStats({online:123456,total:100000}), '1,23,456 driving now · 1,00,000 drives started')
assert.equal(formatLiveStats({online:NaN,total:10}), null)
console.log('Live counter thresholds and formatting passed')
