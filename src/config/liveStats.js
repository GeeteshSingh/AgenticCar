export const LIVE_STATS = { heartbeatMs: 30000, pollMs: 60000, timeoutMs: 4000, onlineThreshold: 3, totalThreshold: 100 }
export function formatLiveStats(stats) {
  if (!stats || !Number.isSafeInteger(stats.online) || !Number.isSafeInteger(stats.total) || stats.online < 0 || stats.total < 0) return null
  const lines = []
  if (stats.online >= LIVE_STATS.onlineThreshold) lines.push(`${stats.online.toLocaleString('en-IN')} online`)
  if (stats.total >= LIVE_STATS.totalThreshold) lines.push(`${stats.total.toLocaleString('en-IN')} driving sessions started`)
  return lines.length ? lines.join(' · ') : 'Be one of the first drivers'
}
export async function loadLiveStats(fetcher, signal) {
  try {
    const response = await fetcher('/api/stats', { signal, cache:'no-store', credentials:'omit' })
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return null
    const stats = await response.json()
    return formatLiveStats(stats) ? stats : null
  } catch { return null }
}

export function createStatsPoller({ load, visible, now, setTimer, clearTimer, subscribe }) {
  const listeners = new Set()
  let last = -Infinity, value = null, inFlight = null, timer, unlisten
  function schedule() {
    clearTimer(timer)
    if (listeners.size) timer = setTimer(poll, Math.max(1, last + LIVE_STATS.pollMs - now()))
  }
  function poll() {
    if (!listeners.size) return
    if (!visible()) { clearTimer(timer); timer = setTimer(poll, LIVE_STATS.pollMs); return }
    if (inFlight) return inFlight
    if (now() - last < LIVE_STATS.pollMs) { schedule(); return }
    last = now()
    inFlight = Promise.resolve().then(load).catch(() => null).then(result => {
      value = result
      for (const listener of listeners) listener(value)
      return value
    }).finally(() => { inFlight = null; schedule() })
    return inFlight
  }
  return listener => {
    listeners.add(listener)
    listener(value)
    if (listeners.size === 1) { unlisten = subscribe(poll); poll() }
    return () => { listeners.delete(listener); if (!listeners.size) { clearTimer(timer); unlisten() } }
  }
}

export const subscribeLiveStats = createStatsPoller({
  load: async () => {
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), LIVE_STATS.timeoutMs)
    try { return await loadLiveStats(fetch, controller.signal) } finally { clearTimeout(timer) }
  },
  visible: () => !document.hidden,
  now: () => Date.now(),
  setTimer: (fn, delay) => setTimeout(fn, delay),
  clearTimer: timer => clearTimeout(timer),
  subscribe: fn => { document.addEventListener('visibilitychange', fn); return () => document.removeEventListener('visibilitychange', fn) },
})
