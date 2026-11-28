import { LIVE_STATS } from '../config/liveStats.js'

export function sessionId() {
  try {
    let id = sessionStorage.getItem('wayfound-live-session')
    if (!id) { id = crypto.randomUUID(); sessionStorage.setItem('wayfound-live-session', id) }
    return id
  } catch { return null }
}
export async function sendCounter(path, id) {
  if (!id) return false
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), LIVE_STATS.timeoutMs)
  try {
    const response = await fetch(path, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id}), credentials:'omit', signal:controller.signal })
    return response.ok
  } catch { return false } finally { clearTimeout(timer) }
}
