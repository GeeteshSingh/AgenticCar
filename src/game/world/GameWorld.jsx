import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { EndlessHighway } from '@/game/world/EndlessHighway'
import { PlayerCar } from '@/game/player/PlayerCar'
import { CameraManager } from '@/game/camera/CameraManager'
import { TrafficManager } from '@/game/traffic/TrafficManager'
import { useArcadeVehicleController } from '@/game/player/useArcadeVehicleController'
import { useKeyboardInput } from '@/game/input/useKeyboardInput'
import { useGameStore } from '@/stores/useGameStore'
import { ENVIRONMENT } from '@/game/config/gameConfig'
import { KMH_TO_MS } from '@/game/config/vehicleConfig'

// Live 3D scene for Phase 2. The player car stays near z=0; the highway
// scrolls toward it. All high-frequency simulation runs here via refs in the
// render loop. React state is only touched for throttled HUD stats and the
// camera-mode toggle.
export function GameWorld() {
  const phase = useGameStore((s) => s.phase)
  const cameraMode = useGameStore((s) => s.cameraMode)
  const toggleCameraMode = useGameStore((s) => s.toggleCameraMode)
  const togglePause = useGameStore((s) => s.togglePause)
  const updateStats = useGameStore((s) => s.updateStats)

  const { actionsRef, consumeEdgeActions } = useKeyboardInput({ enabled: phase === 'playing' || phase === 'paused' })

  const running = phase === 'playing'
  const { stateRef, update } = useArcadeVehicleController(actionsRef, { active: running })

  // Scroll value the highway reads (visual world speed in m/s)
  const scrollRef = useRef(0)

  // Throttle HUD stat writes (~10/sec)
  const statAccumRef = useRef(0)
  const distanceRef = useRef(0)
  const survivalRef = useRef(0)
  // Bumped on each fresh run so TrafficManager resets its pool deterministically
  const runTokenRef = useRef(0)
  const prevPhaseRef = useRef(phase)
  if (prevPhaseRef.current !== 'playing' && phase === 'playing') {
    runTokenRef.current += 1
    distanceRef.current = 0
    survivalRef.current = 0
  }
  prevPhaseRef.current = phase

  const day = ENVIRONMENT.day

  useFrame((_, dt) => {
    // Edge actions (camera / pause toggles)
    const edges = consumeEdgeActions()
    for (const e of edges) {
      if (e === 'toggleCamera') toggleCameraMode()
      else if (e === 'togglePause') togglePause()
    }

    if (running) {
      const s = update(dt, actionsRef.current)

      // Advance virtual distance (meters) from speed
      distanceRef.current += Math.max(0, s.speed) * KMH_TO_MS * dt
      survivalRef.current += dt
      // Highway scrolls visually with speed (m/s), car is at z=0
      scrollRef.current = Math.max(0, s.speed) * KMH_TO_MS

      // Throttled store update for HUD
      statAccumRef.current += dt
      if (statAccumRef.current >= 0.1) {
        statAccumRef.current = 0
        updateStats({
          score: Math.floor(distanceRef.current * 2),
          speedKmh: s.speed,
          distanceMeters: distanceRef.current,
          survivalTime: survivalRef.current,
          integrity: 100,
        })
      }
    } else {
      scrollRef.current = 0
    }
  })

  return (
    <group>
      <ambientLight intensity={day.ambientIntensity} />
      <directionalLight
        position={day.sunPosition}
        intensity={day.sunIntensity}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-camera-far={200}
      />

      {/* Distant ground for context */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[400, 1200]} />
        <meshStandardMaterial color="#070b12" />
      </mesh>

      <EndlessHighway scrollRef={scrollRef} />

      {/* Traffic: pooled, recycled, lane-bound, safe-spawned */}
      <TrafficManager
        playerSpeedRef={stateRef}
        distanceRef={distanceRef}
        survivalRef={survivalRef}
        active={running}
        runToken={runTokenRef.current}
      />

      {/* Player car + camera both read the same controller state ref */}
      <PlayerCar stateRef={stateRef} />
      <CameraManager targetRef={stateRef} cameraMode={cameraMode} />

      {/* HUD overlay is DOM, rendered by AppShell/GameRouter separately */}
    </group>
  )
}

export default GameWorld
