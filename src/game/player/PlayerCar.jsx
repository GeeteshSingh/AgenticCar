import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { VEHICLE } from '@/game/config/vehicleConfig'

// Clean, minimalist low-poly white sedan. Visual only — position/rotation are
// driven each frame from the controller's ref state. Fresh paint + glass +
// working headlights (front, +z) and tail-lights (rear, -z).
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
  const R = VEHICLE.wheelRadius

  return (
    <group ref={groupRef}>
      {/* Body — sleek white */}
      <mesh castShadow position={[0, H * 0.42, 0]}>
        <boxGeometry args={[W, H * 0.5, L]} />
        <meshStandardMaterial color="#f5f7fa" metalness={0.5} roughness={0.28} />
      </mesh>
      {/* Lower skirt for a cleaner wedge */}
      <mesh castShadow position={[0, H * 0.2, 0]}>
        <boxGeometry args={[W * 0.98, H * 0.28, L * 0.96]} />
        <meshStandardMaterial color="#e5e8ee" metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Cabin / greenhouse */}
      <mesh castShadow position={[0, H * 0.82, -L * 0.04]}>
        <boxGeometry args={[W * 0.82, H * 0.5, L * 0.46]} />
        <meshStandardMaterial color="#0b1220" metalness={0.2} roughness={0.08} />
      </mesh>
      {/* Windshield glass hint */}
      <mesh position={[0, H * 0.82, L * 0.2]}>
        <boxGeometry args={[W * 0.78, H * 0.42, L * 0.04]} />
        <meshStandardMaterial color="#bae6fd" transparent opacity={0.35} metalness={0.1} roughness={0.05} />
      </mesh>

      {/* Headlights (front = +z) */}
      <mesh position={[W * 0.3, H * 0.4, L / 2 + 0.02]}>
        <boxGeometry args={[0.4, 0.18, 0.05]} />
        <meshStandardMaterial color="#fffbe6" emissive="#fde047" emissiveIntensity={1.6} ref={(m) => (headMatRefs.current[0] = m)} />
      </mesh>
      <mesh position={[-W * 0.3, H * 0.4, L / 2 + 0.02]}>
        <boxGeometry args={[0.4, 0.18, 0.05]} />
        <meshStandardMaterial color="#fffbe6" emissive="#fde047" emissiveIntensity={1.6} ref={(m) => (headMatRefs.current[1] = m)} />
      </mesh>

      {/* Tail lights (rear = -z) */}
      <mesh position={[W * 0.3, H * 0.42, -L / 2 - 0.02]}>
        <boxGeometry args={[0.42, 0.16, 0.05]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.1} ref={(m) => (tailMatRefs.current[0] = m)} />
      </mesh>
      <mesh position={[-W * 0.3, H * 0.42, -L / 2 - 0.02]}>
        <boxGeometry args={[0.42, 0.16, 0.05]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.1} ref={(m) => (tailMatRefs.current[1] = m)} />
      </mesh>

      {/* Wheels */}
      {[
        [W / 2, R, L * 0.32],
        [-W / 2, R, L * 0.32],
        [W / 2, R, -L * 0.32],
        [-W / 2, R, -L * 0.32],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[R, R, 0.32, 16]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.85} />
        </mesh>
      ))}
    </group>
  )
}

export default PlayerCar
