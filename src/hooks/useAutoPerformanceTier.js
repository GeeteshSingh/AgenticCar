import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '@/stores/useGameStore'
import { AUTO_TIER, nextAutoTier } from '@/game/config/graphicsConfig'

// Samples frame rate while a run is active and, in 'auto' graphics mode,
// nudges the resolved tier up/down with hysteresis. Pure measurement: it never
// blocks, and only writes to the store when a tier change is warranted.
export function useAutoPerformanceTier(active = true) {
  const lowCount = useRef(0)
  const highCount = useRef(0)
  const accum = useRef(0)
  const frames = useRef(0)
  const cooldown = useRef(0)

  useFrame((_, dt) => {
    const { graphicsQuality, autoTier, setAutoTier } = useGameStore.getState()
    if (!active || graphicsQuality !== 'auto') {
      // Reset counters so a fresh run samples cleanly.
      lowCount.current = 0
      highCount.current = 0
      accum.current = 0
      frames.current = 0
      return
    }

    // dt is seconds for this frame; guard against huge first-frame deltas.
    const fps = dt > 0 ? 1 / Math.min(dt, 0.1) : 60
    accum.current += fps
    frames.current += 1

    // Recompute a rolling average roughly every second of frames.
    if (frames.current >= 60) {
      const avg = accum.current / frames.current
      if (avg <= AUTO_TIER.downFps) lowCount.current += 1
      else lowCount.current = 0
      if (avg >= AUTO_TIER.upFps) highCount.current += 1
      else highCount.current = 0
      accum.current = 0
      frames.current = 0

      // Small cooldown so we don't thrash tiers back and forth.
      if (cooldown.current > 0) {
        cooldown.current -= 1
      } else {
        const next = nextAutoTier(autoTier, avg, lowCount.current, highCount.current)
        if (next && next !== autoTier) {
          setAutoTier(next)
          cooldown.current = 3 // ~3s of frames before another change
        }
      }
    }
  })
}
