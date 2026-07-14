import { useEffect, useRef } from 'react'
import { currentCollisionFlash } from '@/game/effects/collisionSignal'

// Full-screen red impact vignette. Reads the shared collision-flash signal in
// its own rAF loop so it never re-renders React or touches the game store.
export function CollisionFlash() {
  const ref = useRef(null)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const v = currentCollisionFlash()
      if (ref.current) {
        ref.current.style.opacity = String(v)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0 z-10"
      style={{
        opacity: 0,
        background: 'radial-gradient(circle at center, rgba(239,68,68,0) 35%, rgba(239,68,68,0.55) 100%)',
        transition: 'opacity 60ms linear',
      }}
    />
  )
}

export default CollisionFlash
