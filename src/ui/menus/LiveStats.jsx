import { useEffect, useRef, useState } from 'react'
import { LIVE_STATS, formatLiveStats, loadLiveStats } from '@/config/liveStats'

export function LiveStats() {
  const [stats, setStats] = useState(null), [display, setDisplay] = useState(null)
  const previous = useRef(null)
  useEffect(() => {
    let active = true, controller, serial = 0
    async function poll() {
      if (document.hidden) return
      controller?.abort(); controller = new AbortController()
      const current = ++serial
      const timeout = setTimeout(() => controller.abort(), LIVE_STATS.timeoutMs)
      const result = await loadLiveStats(fetch, controller.signal)
      if (active && current === serial) setStats(result)
      clearTimeout(timeout)
    }
    const visible = () => { if (!document.hidden) poll(); else { serial++; controller?.abort(); setStats(null) } }
    poll(); const timer = setInterval(poll, LIVE_STATS.pollMs)
    document.addEventListener('visibilitychange', visible)
    return () => { active = false; clearInterval(timer); controller?.abort(); document.removeEventListener('visibilitychange', visible) }
  }, [])
  useEffect(() => {
    if (!stats) { setDisplay(null); previous.current = null; return }
    const start = previous.current || stats
    previous.current = stats
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setDisplay(stats); return }
    let frame, first
    const tick = time => {
      first ??= time
      const t = Math.min(1, (time-first)/500)
      setDisplay({online:Math.round(start.online+(stats.online-start.online)*t), total:Math.round(start.total+(stats.total-start.total)*t)})
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [stats])
  const text = display && formatLiveStats(display)
  return <div className="live-stats-slot" aria-live="polite">{text && <span className="live-stats-pill">{text}</span>}</div>
}
