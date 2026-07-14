import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

// Visual primitive for one traffic vehicle. Transform (z, x, facing) is driven
// each frame by TrafficManager's pooled state; this component only reads the
// ref. Primitives only.
export function TrafficVehicle({ vehicleRef }) {
  const groupRef = useRef()

  useFrame(() => {
    const g = groupRef.current
    const s = vehicleRef
    if (!g || !s) return
    g.position.z = s.z ?? 0
    g.position.x = s.x ?? 0
    g.rotation.y = s.direction < 0 ? Math.PI : 0
  })

  const w = vehicleRef?.width ?? 2
  const l = vehicleRef?.length ?? 4
  const h = vehicleRef?.height ?? 1.4
  const color = vehicleRef?.color ?? '#ef4444'
  const flashed = (vehicleRef?.flash ?? 0) > 0

  return (
    <group ref={groupRef}>
      <mesh castShadow position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h * 0.55, l]} />
        <meshStandardMaterial color={flashed ? '#ffffff' : color} emissive={flashed ? '#ffffff' : '#000000'} emissiveIntensity={flashed ? 0.8 : 0} metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh castShadow position={[0, h * 0.85, -l * 0.04]}>
        <boxGeometry args={[w * 0.82, h * 0.5, l * 0.5]} />
        <meshStandardMaterial color="#0b1220" metalness={0.2} roughness={0.1} />
      </mesh>
      {/* Headlights (front = +z) */}
      <mesh position={[w * 0.3, h * 0.4, l / 2 + 0.01]}>
        <boxGeometry args={[0.35, 0.16, 0.05]} />
        <meshStandardMaterial color="#fde047" emissive="#fde047" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[-w * 0.3, h * 0.4, l / 2 + 0.01]}>
        <boxGeometry args={[0.35, 0.16, 0.05]} />
        <meshStandardMaterial color="#fde047" emissive="#fde047" emissiveIntensity={1.2} />
      </mesh>
      {/* Tail lights (rear = -z) */}
      <mesh position={[w * 0.3, h * 0.4, -l / 2 - 0.01]}>
        <boxGeometry args={[0.4, 0.14, 0.05]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.0} />
      </mesh>
      <mesh position={[-w * 0.3, h * 0.4, -l / 2 - 0.01]}>
        <boxGeometry args={[0.4, 0.14, 0.05]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.0} />
      </mesh>
    </group>
  )
}

export default TrafficVehicle
