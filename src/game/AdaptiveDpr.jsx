import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGameStore } from '@/stores/useGameStore'

// Downscale only after three consecutive slow four-second active-play windows.
export function AdaptiveDpr() {
  const gl = useThree(s => s.gl), setDpr = useThree(s => s.setDpr)
  const sample = useRef({ elapsed:0, frames:0, slowWindows:0 })
  useFrame((_, dt) => {
    if (useGameStore.getState().phase !== 'playing') return
    const s = sample.current
    s.elapsed += Math.min(dt, .25); s.frames++
    if (s.elapsed < 4) return
    s.slowWindows = s.elapsed / s.frames > 1/30 ? s.slowWindows + 1 : 0
    if (s.slowWindows >= 3) { setDpr(Math.max(.75, gl.getPixelRatio() * .85)); s.slowWindows = 0 }
    s.elapsed = 0; s.frames = 0
  })
  return null
}
