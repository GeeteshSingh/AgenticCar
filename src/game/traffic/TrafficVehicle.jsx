import { Suspense, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { VEHICLE } from '@/game/config/vehicleConfig'
import { VehicleModel } from '@/game/assets/VehicleModel'
import { modelFileForTrafficType } from '@/game/assets/vehicleModels'

// Visual for one traffic vehicle, built from a loaded GLB model (auto-fitted
// to the vehicle's dims). Transform (z, x, facing) is driven each frame by
// TrafficManager's pooled state; this component only reads the ref.
export function TrafficVehicle({ vehicleRef, headlightRef }) {
  const groupRef = useRef()
  const headMatRefs = useRef([])
  const tailMatRefs = useRef([])

  useFrame(() => {
    const g = groupRef.current
    const s = vehicleRef
    if (!g || !s) return
    g.position.z = s.z ?? 0
    g.position.x = s.x ?? 0
    g.rotation.y = s.direction < 0 ? Math.PI : 0
    // Night emissive boost so oncoming/same-direction traffic stays readable.
    const hl = headlightRef?.current ?? 0
    for (const m of headMatRefs.current) if (m) m.emissiveIntensity = 1.8 + hl * 2.6
    for (const m of tailMatRefs.current) if (m) m.emissiveIntensity = 1.2 + hl * 1.8
  })

  const w = vehicleRef?.width ?? 2
  const l = vehicleRef?.length ?? 4
  const h = vehicleRef?.height ?? 1.4
  const color = vehicleRef?.color ?? '#ef4444'
  const file = modelFileForTrafficType(vehicleRef?.type)

  return (
    <group ref={groupRef}>
      <Suspense fallback={null}>
        <VehicleModel
          file={file}
          width={w}
          length={l}
          height={h}
          color={color}
          headMatRefs={headMatRefs}
          tailMatRefs={tailMatRefs}
        />
      </Suspense>
    </group>
  )
}

export default TrafficVehicle
