export const PRESENCE_MS = 90000
export const HEARTBEAT_MIN_MS = 20000
export const DEDUPE_MS = 24 * 60 * 60 * 1000
export const validSession = id => typeof id === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id)
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
export function recordStart(storage, sql, hash, now) {
  let added = false
  storage.transactionSync(() => {
    sql.exec('DELETE FROM starts WHERE created <= ?', now - DEDUPE_MS)
    const inserted = sql.exec('INSERT OR IGNORE INTO starts (hash,created) VALUES (?,?)', hash, now)
    if (inserted.rowsWritten) { sql.exec('UPDATE counter SET total=total+1 WHERE id=1'); added = true }
  })
  return added
}

