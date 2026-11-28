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
