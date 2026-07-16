import { Suspense, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { VEHICLE } from '@/game/config/vehicleConfig'
import { VehicleModel } from '@/game/assets/VehicleModel'
import { PLAYER_MODEL_FILE } from '@/game/assets/vehicleModels'

// Player vehicle: a loaded GLB model (auto-fitted to VEHICLE dims) whose
// transform is driven each frame from the controller's ref state. Headlight
// and tail-light emissive quads live inside VehicleModel and ramp at night.
export function PlayerCar({ stateRef, roadTop = 0, headlightRef }) {
  const groupRef = useRef()
  const headMatRefs = useRef([])
  const tailMatRefs = useRef([])

  useFrame(() => {
    const s = stateRef?.current
    if (!groupRef.current || !s) return
    groupRef.current.position.x = s.lateralX
    groupRef.current.position.y = roadTop
    groupRef.current.rotation.y = s.yaw
    groupRef.current.rotation.z = s.bodyRoll
    groupRef.current.rotation.x = s.bodyPitch
    // Night headlight/taillight boost (Phase 7) — ramps emissive with the
    // scene's headlight factor (0 = day, 1 = full night).
    const hl = headlightRef?.current ?? 0
    for (const m of headMatRefs.current) if (m) m.emissiveIntensity = 1.6 + hl * 2.4
    for (const m of tailMatRefs.current) if (m) m.emissiveIntensity = 1.1 + hl * 1.6
  })

  const L = VEHICLE.length
  const W = VEHICLE.width
  const H = VEHICLE.height

  return (
    <group ref={groupRef}>
      <Suspense fallback={null}>
        <VehicleModel
          file={PLAYER_MODEL_FILE}
          width={W}
          length={L}
          height={H}
          headMatRefs={headMatRefs}
          tailMatRefs={tailMatRefs}
        />
      </Suspense>
    </group>
  )
}

export default PlayerCar
