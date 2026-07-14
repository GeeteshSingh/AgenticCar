import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { VEHICLE } from '@/game/config/vehicleConfig'

// Primitive player vehicle. Visual only — position/rotation are driven by the
// parent (GameWorld) from the controller's ref state each frame via props.
export function PlayerCar({ stateRef }) {
  const groupRef = useRef()

  useFrame(() => {
    const s = stateRef?.current
    if (!groupRef.current || !s) return
    // Lateral position and heading
    groupRef.current.position.x = s.lateralX
    groupRef.current.rotation.y = s.yaw
    // Visual body roll/pitch
    groupRef.current.rotation.z = s.bodyRoll
    groupRef.current.rotation.x = s.bodyPitch
  })

  const L = VEHICLE.length
  const W = VEHICLE.width
  const H = VEHICLE.height
  const R = VEHICLE.wheelRadius

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh castShadow position={[0, H / 2, 0]}>
        <boxGeometry args={[W, H * 0.55, L]} />
        <meshStandardMaterial color="#22d3ee" metalness={0.6} roughness={0.25} />
      </mesh>
      {/* Cabin */}
      <mesh castShadow position={[0, H * 0.85, -L * 0.05]}>
        <boxGeometry args={[W * 0.85, H * 0.5, L * 0.5]} />
        <meshStandardMaterial color="#0b1220" metalness={0.3} roughness={0.1} />
      </mesh>
      {/* Windshield highlight */}
      <mesh position={[0, H * 0.85, L * 0.22]}>
        <boxGeometry args={[W * 0.8, H * 0.4, L * 0.04]} />
        <meshStandardMaterial color="#7dd3fc" transparent opacity={0.4} />
      </mesh>

      {/* Headlights (front = +z) */}
      <mesh position={[W * 0.3, H * 0.4, L / 2 + 0.01]}>
        <boxGeometry args={[0.35, 0.2, 0.05]} />
        <meshStandardMaterial color="#fef9c3" emissive="#fde047" emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[-W * 0.3, H * 0.4, L / 2 + 0.01]}>
        <boxGeometry args={[0.35, 0.2, 0.05]} />
        <meshStandardMaterial color="#fef9c3" emissive="#fde047" emissiveIntensity={1.5} />
      </mesh>

      {/* Brake/tail lights (rear = -z) */}
      <mesh position={[W * 0.3, H * 0.4, -L / 2 - 0.01]}>
        <boxGeometry args={[0.4, 0.18, 0.05]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[-W * 0.3, H * 0.4, -L / 2 - 0.01]}>
        <boxGeometry args={[0.4, 0.18, 0.05]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.2} />
      </mesh>

      {/* Wheels */}
      {[
        [W / 2, R, L * 0.32],
        [-W / 2, R, L * 0.32],
        [W / 2, R, -L * 0.32],
        [-W / 2, R, -L * 0.32],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[R, R, 0.3, 16]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.8} />
        </mesh>
      ))}

      <pointLight position={[0, H, L / 2]} intensity={0} distance={0} color="#fde047" />
    </group>
  )
}

export default PlayerCar
