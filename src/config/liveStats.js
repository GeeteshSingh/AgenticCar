export const LIVE_STATS = { heartbeatMs: 30000, pollMs: 60000, timeoutMs: 4000, onlineThreshold: 3, totalThreshold: 100 }
export function formatLiveStats(stats) {
  if (!stats || !Number.isSafeInteger(stats.online) || !Number.isSafeInteger(stats.total) || stats.online < 0 || stats.total < 0) return null
  const lines = []
  if (stats.online >= LIVE_STATS.onlineThreshold) lines.push(`${stats.online.toLocaleString('en-IN')} driving now`)
  if (stats.total >= LIVE_STATS.totalThreshold) lines.push(`${stats.total.toLocaleString('en-IN')} drives started`)
  return lines.length ? lines.join(' · ') : 'Be one of the first drivers'
}
