import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Skybox } from '@/game/skycube/Skybox'
import { SunDisc } from '@/game/lights/Lighting'
import { EndlessHighway } from '@/game/world/EndlessHighway'
import { PlayerCar } from '@/game/player/PlayerCar'

// Ambient, self-driving scene shown behind the main menu. It does not use the
// real game store — it just cruises forward at a calm speed so the landing
// page feels alive. Reuses the in-game world pieces for visual consistency.
export function MenuBackdrop() {
  const scrollRef = useRef(28) // constant cruise speed in m/s

  useFrame(() => {
    // Keep a steady scroll; the car bob is handled by PlayerCar visuals.
  })

  const carState = useRef({ speed: 100, lateralX: 1.5, steer: 0, yaw: 0, velX: 0, bodyRoll: 0, bodyPitch: -0.02 })

  return (
    <group>
      <ambientLight intensity={0.9} />
      <directionalLight position={[60, 90, 40]} intensity={2.0} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-60} shadow-camera-right={60} shadow-camera-top={60} shadow-camera-bottom={-60} shadow-camera-far={200} />

      <Skybox color="#7db8f0" />
      <SunDisc position={[180, 180, -260]} color="#fde68a" size={22} />
      {/* Distant hills */}
      {Array.from({ length: 10 }, (_, i) => {
        const angle = (i / 10) * Math.PI * 2
        const x = Math.sin(angle) * 520
        const z = -Math.abs(Math.cos(angle)) * 520 - 120
        const h = 60 + ((i * 37) % 60)
        return (
          <mesh key={i} position={[x, h / 2 - 1, z]} frustumCulled={false}>
            <coneGeometry args={[50, h, 5]} />
            <meshStandardMaterial color="#9aae5a" roughness={1} fog={false} />
          </mesh>
        )
      })}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow>
        <planeGeometry args={[600, 1400]} />
        <meshStandardMaterial color="#9aa83f" roughness={1} />
      </mesh>

      <EndlessHighway scrollRef={scrollRef} />

      <PlayerCar stateRef={carState} />
    </group>
  )
}

export default MenuBackdrop
