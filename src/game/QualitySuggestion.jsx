import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '@/stores/useGameStore'
import { useSettingsStore } from '@/stores/useSettingsStore'

// A single 20-second sample of active play; never changes the chosen setting.
export function QualitySuggestion() {
  const sample = useRef({ elapsed:0, frames:0, slow:0, done:false })
  useFrame((_, dt) => {
    const s = sample.current
    if (s.done || useGameStore.getState().phase !== 'playing') return
    s.elapsed += Math.min(dt, .25); s.frames++; if (dt > 1/30) s.slow++
    if (s.elapsed >= 20) {
      s.done = true
      if (s.frames > 0 && s.slow / s.frames > .5 && useSettingsStore.getState().quality !== 'low') useGameStore.setState({ qualitySuggestion:true })
    }
  })
  return null
}
