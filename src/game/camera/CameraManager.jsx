import { Cockpit } from '@/game/camera/Cockpit'
import { useGameStore } from '@/stores/useGameStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { createChaseCamera } from '@/game/camera/useChaseCamera'
import { createHoodCamera } from '@/game/camera/useHoodCamera'

// Orchestrates camera mode switching (chase <-> hood) using the store flag.
// Camera math runs in the render loop via refs; no per-frame React state.
export function CameraManager({ targetRef, cameraMode, effectsRef }) {
  const { camera } = useThree()
  const previousShake = useRef(camera.position.clone().set(0, 0, 0))
  const reducedMotion = useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const chaseRef = useRef(createChaseCamera())
  const hoodRef = useRef(createHoodCamera())

  // Reset smoothing when switching modes to avoid a jump
  useEffect(() => {
    chaseRef.current.reset()
    hoodRef.current.reset()
  }, [cameraMode])

  useFrame((_, dt) => {
    const target = targetRef?.current
    if (!target) return
    camera.position.sub(previousShake.current)
    previousShake.current.set(0, 0, 0)
    if (cameraMode !== 'chase') {
      hoodRef.current.update(camera, target, dt)
    } else {
      chaseRef.current.update(camera, target, dt)
    }
    if (useGameStore.getState().phase === 'playing' && !reducedMotion.current && !useSettingsStore.getState().reduceEffects) {
      const offset = effectsRef?.current.shake.update(Math.min(dt, .05))
      if (offset) { previousShake.current.copy(offset); camera.position.add(offset) }
    }
  })

  return cameraMode === 'interior' ? <Cockpit targetRef={targetRef} /> : null
}

export default CameraManager
