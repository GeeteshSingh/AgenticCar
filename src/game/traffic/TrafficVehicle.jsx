import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { VEHICLE } from '@/game/config/vehicleConfig'

// Visual primitive for one traffic vehicle. Transform (z, x, facing) is driven
// each frame by TrafficManager's pooled state; this component only reads the
// ref. Low-poly sedan/van/truck body with working lights. Oncoming vehicles
// show bright headlights toward the player; same-direction show tail-lights.
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
  const flashed = (vehicleRef?.flash ?? 0) > 0
  const oncoming = (vehicleRef?.direction ?? 1) < 0

  return (
    <group ref={groupRef}>
      {/* Lower body */}
      <mesh castShadow position={[0, h * 0.3, 0]}>
        <boxGeometry args={[w, h * 0.42, l]} />
        <meshStandardMaterial color={flashed ? '#ffffff' : color} emissive={flashed ? '#ffffff' : '#000000'} emissiveIntensity={flashed ? 0.8 : 0} metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Cabin */}
      <mesh castShadow position={[0, h * 0.78, -l * 0.04]}>
        <boxGeometry args={[w * 0.84, h * 0.48, l * 0.5]} />
        <meshStandardMaterial color="#0b1220" metalness={0.2} roughness={0.1} />
      </mesh>

      {/* Lights depend on whether the car faces the player.
          Front of the mesh is +z. If oncoming (mesh rotated PI), the mesh's
          +z points toward the player, so headlights must sit at +z. If
          same-direction, tail-lights (rear, -z) face the player. */}
      {/* Headlights (mesh +z) */}
      <mesh position={[w * 0.3, h * 0.42, l / 2 + 0.02]}>
        <boxGeometry args={[0.38, 0.16, 0.05]} />
        <meshStandardMaterial color="#fffbe6" emissive="#fde047" emissiveIntensity={1.8} ref={(m) => (headMatRefs.current[0] = m)} />
      </mesh>
      <mesh position={[-w * 0.3, h * 0.42, l / 2 + 0.02]}>
        <boxGeometry args={[0.38, 0.16, 0.05]} />
        <meshStandardMaterial color="#fffbe6" emissive="#fde047" emissiveIntensity={1.8} ref={(m) => (headMatRefs.current[1] = m)} />
      </mesh>
      {/* Tail lights (mesh -z) */}
      <mesh position={[w * 0.3, h * 0.42, -l / 2 - 0.02]}>
        <boxGeometry args={[0.4, 0.14, 0.05]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.2} ref={(m) => (tailMatRefs.current[0] = m)} />
      </mesh>
      <mesh position={[-w * 0.3, h * 0.42, -l / 2 - 0.02]}>
        <boxGeometry args={[0.4, 0.14, 0.05]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.2} ref={(m) => (tailMatRefs.current[1] = m)} />
      </mesh>
    </group>
  )
}

export default TrafficVehicle
