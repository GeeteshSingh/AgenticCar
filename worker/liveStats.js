export const PRESENCE_MS = 90000
export const HEARTBEAT_MIN_MS = 20000
export const DEDUPE_MS = 30 * 24 * 60 * 60 * 1000
export const validSession = id => typeof id === 'string' && /^[a-f0-9-]{36}$/i.test(id)
export function createPresence() {
  const sessions = new Map()
  return {
    beat(id, now) {
      for (const [key, time] of sessions) if (now-time >= PRESENCE_MS) sessions.delete(key)
      if (!validSession(id)) return false
      const previous = sessions.get(id)
      if (previous !== undefined && now-previous < HEARTBEAT_MIN_MS) return false
      sessions.set(id, now); return true
    },
    count(now) { for (const [key,time] of sessions) if (now-time >= PRESENCE_MS) sessions.delete(key); return sessions.size },
  }
}

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

export class LiveStats {
  constructor(ctx) {
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
      this.storage.transactionSync(() => {
        this.sql.exec('DELETE FROM starts WHERE created < ?', now - DEDUPE_MS)
        const inserted = this.sql.exec('INSERT OR IGNORE INTO starts (hash,created) VALUES (?,?)', hash, now)
        if (inserted.rowsWritten) this.sql.exec('UPDATE counter SET total=total+1 WHERE id=1')
      })
    }
    return new Response(null, {status:204})
  }
}

export default {
  fetch(request, env) {
    const path = new URL(request.url).pathname
    if (['/api/hb','/api/start','/api/stats'].includes(path)) return env.LIVE_STATS.get(env.LIVE_STATS.idFromName('global')).fetch(request)
    return env.ASSETS.fetch(request)
  },
}
