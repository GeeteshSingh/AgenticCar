import { useEffect, useState } from 'react'
import { LIVE_STATS, formatLiveStats } from '@/config/liveStats'

export function LiveStats() {
  const [text, setText] = useState(null)
  useEffect(() => {
    let active = true, controller
    async function poll() {
      if (document.hidden) return
      controller?.abort(); controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), LIVE_STATS.timeoutMs)
      try {
        const response = await fetch('/api/stats', { signal:controller.signal, cache:'no-store' })
        if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error('unavailable')
        const message = formatLiveStats(await response.json())
        if (active) setText(message)
      } catch { if (active) setText(null) } finally { clearTimeout(timeout) }
    }
    const visible = () => { if (!document.hidden) poll(); else { controller?.abort(); setText(null) } }
    poll(); const timer = setInterval(poll, LIVE_STATS.pollMs)
    document.addEventListener('visibilitychange', visible)
    return () => { active = false; clearInterval(timer); controller?.abort(); document.removeEventListener('visibilitychange', visible) }
  }, [])
  return <div className="live-stats-slot" aria-live="polite">{text && <span className="live-stats-pill">{text}</span>}</div>
}
