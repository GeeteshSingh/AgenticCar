import { DurableObject } from 'cloudflare:workers'
import { validSession, createPresence, recordStart, DEDUPE_MS } from './liveStatsLogic.js'

async function readSession(request) {
  if (Number(request.headers.get('content-length')) > 200 || !request.body) return null
  const reader = request.body.getReader(); let length = 0; const chunks = []
  while (true) {
    const {done,value} = await reader.read(); if (done) break
    length += value.byteLength
    if (length > 200) { await reader.cancel(); return null }
    chunks.push(value)
  }
  const bytes = new Uint8Array(length); let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length }
  try { const body = JSON.parse(new TextDecoder().decode(bytes)); return validSession(body?.id) ? body.id : null } catch { return null }
}

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
      return Response.json({online:this.presence.count(now), total}, {headers:{'Cache-Control':'public, s-maxage=15'}})
    }
    if (request.method !== 'POST' || !['/api/hb','/api/start'].includes(path)) return new Response(null, {status:404})
    const id = await readSession(request)
    if (id && path === '/api/hb') this.presence.beat(id, now)
    if (id && path === '/api/start') {
      const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(id))
      const hash = Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('')
      recordStart(this.storage, this.sql, hash, now)
      if (await this.storage.getAlarm() === null) await this.storage.setAlarm(now + DEDUPE_MS + 1000)
    }
    return new Response(null, {status:204})
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
    if (['/api/hb','/api/start','/api/stats'].includes(path)) return env.LIVE_STATS.get(env.LIVE_STATS.idFromName('global')).fetch(request)
    return env.ASSETS.fetch(request)
  },
}
