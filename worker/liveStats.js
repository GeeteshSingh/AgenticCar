import { DurableObject } from 'cloudflare:workers'
import { createPresence, recordStart, DEDUPE_MS } from './liveStatsLogic.js'
import { handleApi, jsonResponse } from './liveStatsHttp.js'

export class LiveStats extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env)
    this.storage = ctx.storage; this.sql = ctx.storage.sql; this.presence = createPresence()
    this.sql.exec('CREATE TABLE IF NOT EXISTS counter (id INTEGER PRIMARY KEY, total INTEGER NOT NULL)')
    this.sql.exec('INSERT OR IGNORE INTO counter (id,total) VALUES (1,0)')
    this.sql.exec('CREATE TABLE IF NOT EXISTS starts (hash TEXT PRIMARY KEY, created INTEGER NOT NULL)')
  }
  async fetch(request) {
    const path = new URL(request.url).pathname, now = Date.now()
    if (request.method === 'GET' && path === '/api/stats') {
      const total = this.sql.exec('SELECT total FROM counter WHERE id=1').one().total
      return jsonResponse({online:this.presence.count(now), total}, 200, 'public, s-maxage=15')
    }
    if (request.method !== 'POST' || !['/api/hb','/api/start'].includes(path)) return jsonResponse({ error: 'Not found' }, 404)
    const { id } = await request.json()
    if (id && path === '/api/hb' && !this.presence.beat(id, now)) return jsonResponse({ error: 'Rate limited' }, 429)
    if (id && path === '/api/start') {
      const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(id))
      const hash = Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('')
      recordStart(this.storage, this.sql, hash, now)
      if (await this.storage.getAlarm() === null) await this.storage.setAlarm(now + DEDUPE_MS + 1000)
    }
    return jsonResponse({ ok: true })
  }
  async alarm() {
    const now = Date.now()
    this.sql.exec('DELETE FROM starts WHERE created <= ?', now - DEDUPE_MS)
    const next = this.sql.exec('SELECT MIN(created) AS oldest FROM starts').one().oldest
    if (next !== null) await this.storage.setAlarm(next + DEDUPE_MS + 1000)
  }
}

export default {
  fetch(request, env) {
    const path = new URL(request.url).pathname
    if (path.startsWith('/api/')) return handleApi(request, env)
    return env.ASSETS.fetch(request)
  },
}
