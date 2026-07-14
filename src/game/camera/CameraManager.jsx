import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { createChaseCamera } from '@/game/camera/useChaseCamera'
import { createHoodCamera } from '@/game/camera/useHoodCamera'

// Orchestrates camera mode switching (chase <-> hood) using the store flag.
// Camera math runs in the render loop via refs; no per-frame React state.
export function CameraManager({ targetRef, cameraMode }) {
  const { camera } = useThree()
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
    if (cameraMode === 'hood') {
      hoodRef.current.update(camera, target, dt)
    } else {
      chaseRef.current.update(camera, target, dt)
    }
  })

  return null
}

export default CameraManager
