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

// Shared across effect mounts, including React Strict Mode remounts.
export function createHeartbeatScheduler({ send, visible, now, setTimer, clearTimer, subscribe }) {
  let users = 0, last = -Infinity, timer, unlisten
  const schedule = () => {
    clearTimer(timer)
    if (!users) return
    timer = setTimer(() => { tick(false) }, Math.max(1, last + LIVE_STATS.heartbeatMs - now()))
  }
  const tick = (event) => {
    if (visible() && now() - last >= (event ? 25000 : LIVE_STATS.heartbeatMs)) {
      last = now()
      void send()
    }
    if (users) {
      clearTimer(timer)
      timer = setTimer(() => tick(false), visible() ? Math.max(1, last + LIVE_STATS.heartbeatMs - now()) : LIVE_STATS.heartbeatMs)
    }
  }
  return () => {
    users++
    if (users === 1) { unlisten = subscribe(() => tick(true)); tick(false) }
    else schedule()
    return () => { if (--users === 0) { clearTimer(timer); unlisten() } }
  }
}

export const mountHeartbeat = createHeartbeatScheduler({
  send: () => sendCounter('/api/hb', sessionId()),
  visible: () => !document.hidden,
  now: () => Date.now(),
  setTimer: (fn, delay) => setTimeout(fn, delay),
  clearTimer: timer => clearTimeout(timer),
  subscribe: fn => {
    document.addEventListener('visibilitychange', fn)
    window.addEventListener('focus', fn)
    return () => { document.removeEventListener('visibilitychange', fn); window.removeEventListener('focus', fn) }
  },
})
