import { useEffect, useRef } from 'react'

// Placeholder game loop hook.
// Phase 1 does not run a simulation yet. This scaffolding will host the
// fixed/variable timestep update in later phases, driving physics, traffic,
// scoring, and camera interpolation via refs (never React state per frame).
export function useGameLoop(callback) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    let raf = 0
    let last = performance.now()

    const frame = (now) => {
      const deltaSeconds = (now - last) / 1000
      last = now
      callbackRef.current?.(deltaSeconds, now)
      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])
}
