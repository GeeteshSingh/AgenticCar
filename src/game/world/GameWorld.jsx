import { useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { EndlessHighway } from '@/game/world/EndlessHighway'
import { PlayerCar } from '@/game/player/PlayerCar'
import { CameraManager } from '@/game/camera/CameraManager'
import { TrafficManager } from '@/game/traffic/TrafficManager'
import { useArcadeVehicleController } from '@/game/player/useArcadeVehicleController'
import { useKeyboardInput } from '@/game/input/useKeyboardInput'
import { useGameStore, GAME_STATES } from '@/stores/useGameStore'
import { ENVIRONMENT } from '@/game/config/gameConfig'
import { KMH_TO_MS, VEHICLE } from '@/game/config/vehicleConfig'
import { createCollisionEffects } from '@/game/effects/useCollisionEffects'
import { setCollisionFlash } from '@/game/effects/collisionSignal'
import { createScoringManager } from '@/game/scoring/ScoringManager'
import { createOvertakeDetector } from '@/game/scoring/overtakeDetector'
import { createNearMissDetector } from '@/game/scoring/nearMissDetector'
import { createEventBus, GAME_EVENTS } from '@/game/events/gameEvents'
import { createObjectiveManager } from '@/game/objectives/ObjectiveManager'
import { Environment } from '@/game/environment/Environment'

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
  const { camera } = useThree()

  const running = phase === 'playing'
  const { stateRef, update } = useArcadeVehicleController(actionsRef, { active: running })

  // Scroll value the highway reads (visual world speed in m/s)
  const scrollRef = useRef(0)

  // Collision / integrity / effects
  const effectsRef = useRef(createCollisionEffects())
  const integrityRef = useRef(100)
  const cooldownRef = useRef(0) // seconds of post-collision invulnerability
  const destroyRef = useRef(false) // latch so finishRun fires once

  // Scoring (Phase 5): manager + detectors + event bus, all ref-based.
  const scoringRef = useRef(createScoringManager())
  const overtakeDetRef = useRef(createOvertakeDetector())
  const nearMissDetRef = useRef(createNearMissDetector())
  const eventBusRef = useRef(createEventBus())
  const trafficVehiclesRef = useRef([])

  // Objectives (Phase 6): mission sequential stages + endless challenges.
  const goalModeRef = useRef(null)
  const objectiveRef = useRef(null)

  // Throttle HUD stat writes (~10/sec)
  const statAccumRef = useRef(0)
  const objectiveAccumRef = useRef(0)
  const distanceRef = useRef(0)
  const survivalRef = useRef(0)
  const topSpeedRef = useRef(0)
  // Bumped on each fresh run so TrafficManager resets its pool deterministically
  const runTokenRef = useRef(0)
  const prevPhaseRef = useRef(phase)
  if (prevPhaseRef.current !== 'playing' && phase === 'playing') {
    runTokenRef.current += 1
    distanceRef.current = 0
    survivalRef.current = 0
    integrityRef.current = 100
    topSpeedRef.current = 0
    cooldownRef.current = 0
    destroyRef.current = false
    scoringRef.current = createScoringManager()
    overtakeDetRef.current = createOvertakeDetector()
    nearMissDetRef.current = createNearMissDetector()
    goalModeRef.current = useGameStore.getState().mode || 'endless'
    objectiveRef.current = createObjectiveManager({ mode: goalModeRef.current })
  }
  prevPhaseRef.current = phase

  const day = ENVIRONMENT.day

  // Applies a collision assessment: reduces integrity, slows the car, shakes
  // the camera, and triggers the finish sequence at zero integrity.
  const handleCollision = (assessment) => {
    integrityRef.current = Math.max(0, integrityRef.current - assessment.damage)
    effectsRef.current.triggerSeverity(assessment.severity)
    cooldownRef.current = 0.6 // brief invulnerability so we don't multi-hit
    // Severe/moderate hits also bleed speed (km/h) and temporary accel loss
    const s = stateRef.current
    if (assessment.severity === 'severe') {
      s.speed *= 0.35
    } else if (assessment.severity === 'moderate') {
      s.speed *= 0.6
    } else {
      s.speed *= 0.85
    }
    // Scoring: reset multiplier and count collision
    scoringRef.current.onCollision()
    overtakeDetRef.current.markCollided(assessment.vehicleId)
    eventBusRef.current.emit({ type: GAME_EVENTS.COLLISION, vehicleId: assessment.vehicleId, severity: assessment.severity })
    if (integrityRef.current <= 0 && !destroyRef.current) {
      destroyRef.current = true
      // brief slow-mo already achieved by speed bleed; transition to results
      const snap = scoringRef.current.snapshot()
      finishRun({
        score: snap.score,
        distanceMeters: snap.distanceMeters,
        survivalTime: survivalRef.current,
        speedKmh: snap.topSpeed,
      })
    }
  }

  // Lazily-bound finishRun (store action) to avoid re-creating handler
  const finishRunRef = useRef(null)
  finishRunRef.current = useGameStore.getState().finishRun

  const finishRun = (results) => {
    finishRunRef.current?.(results)
  }

  useFrame((_, dt) => {
    // Edge actions (camera / pause toggles)
    const edges = consumeEdgeActions()
    for (const e of edges) {
      if (e === 'toggleCamera') toggleCameraMode()
      else if (e === 'togglePause') togglePause()
    }

    if (cooldownRef.current > 0) cooldownRef.current = Math.max(0, cooldownRef.current - dt)

    if (running) {
      const s = update(dt, actionsRef.current)

      // Advance virtual distance (meters) from speed
      const dMeters = Math.max(0, s.speed) * KMH_TO_MS * dt
      distanceRef.current += dMeters
      survivalRef.current += dt
      topSpeedRef.current = Math.max(topSpeedRef.current, s.speed)

      // --- Scoring: distance, overtakes, near misses (events + detectors) ---
      scoringRef.current.addDistance(dMeters, s.speed)
      const vehicles = trafficVehiclesRef.current
      const overtaken = overtakeDetRef.current.detect(0, vehicles)
      for (const id of overtaken) {
        scoringRef.current.addOvertake()
        eventBusRef.current.emit({ type: GAME_EVENTS.VEHICLE_OVERTAKEN, vehicleId: id })
      }
      const misses = nearMissDetRef.current.detect({ playerX: s.lateralX, vehicles, playerSpeed: s.speed })
      for (const m of misses) {
        scoringRef.current.addNearMiss(m)
        eventBusRef.current.emit({ type: GAME_EVENTS.NEAR_MISS, vehicleId: m.vehicleId, relativeSpeed: m.relativeSpeed, distance: m.distance })
      }

      // Highway scrolls visually with speed (m/s), car is at z=0
      scrollRef.current = Math.max(0, s.speed) * KMH_TO_MS

      // --- Objectives (Phase 6): evaluate progress from the live stats
      // snapshot. Mission mode ends the run once all stages complete. Endless
      // mode rotates the active challenge on completion (run never ends).
      const goal = objectiveRef.current
      if (goal) {
        const goalStats = {
          distanceMeters: distanceRef.current,
          survivalTime: survivalRef.current,
          score: scoringRef.current.score,
          speedKmh: s.speed,
          integrity: integrityRef.current,
          overtakes: scoringRef.current.state.overtakes,
          nearMisses: scoringRef.current.state.nearMisses,
          collisions: scoringRef.current.state.collisions,
          topSpeed: topSpeedRef.current,
        }
        const { completed, missionComplete } = goal.update(goalStats, dt)
        for (const obj of completed) {
          scoringRef.current.addObjectiveReward(obj.reward)
          eventBusRef.current.emit({
            type: GAME_EVENTS.OBJECTIVE_COMPLETED,
            objectiveId: obj.id,
            reward: obj.reward,
          })
          if (goalModeRef.current === 'endless') goal.rotateChallenge()
        }
        if (missionComplete && !destroyRef.current) {
          destroyRef.current = true
          const snap = scoringRef.current.snapshot()
          finishRun({
            score: snap.score,
            distanceMeters: snap.distanceMeters,
            survivalTime: survivalRef.current,
            speedKmh: snap.topSpeed,
            missionComplete: true,
          })
        }
      }

      // Camera shake offset (applied after CameraManager placed the camera)
      const shakeOffset = effectsRef.current.shake.update(dt)
      camera.position.x += shakeOffset.x
      camera.position.y += shakeOffset.y
      camera.position.z += shakeOffset.z

      // Expose transient red flash to the DOM overlay (no store churn)
      setCollisionFlash(effectsRef.current.tickFlash(dt))

      // Throttled store update for HUD
      statAccumRef.current += dt
      objectiveAccumRef.current += dt
      if (statAccumRef.current >= 0.1) {
        statAccumRef.current = 0
        const snap = scoringRef.current.snapshot()
        updateStats({
          score: snap.score,
          speedKmh: s.speed,
          distanceMeters: snap.distanceMeters,
          survivalTime: survivalRef.current,
          integrity: integrityRef.current,
          multiplier: snap.multiplier,
          overtakes: snap.overtakes,
          nearMisses: snap.nearMisses,
          collisions: snap.collisions,
          topSpeed: snap.topSpeed,
        })
      }
      if (objectiveAccumRef.current >= 0.1) {
        objectiveAccumRef.current = 0
        const snap = goal ? goal.snapshot() : null
        if (snap) {
          updateStats({
            activeObjective: snap.active,
            objectiveCompleted: snap.completedCount,
            objectiveTotal: snap.totalCount,
          })
        }
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

      {/* Sky, sun/moon disc, distant mountains */}
      <Environment env={day} />

      <EndlessHighway scrollRef={scrollRef} />

      {/* Traffic: pooled, recycled, lane-bound, safe-spawned */}
      <TrafficManager
        playerStateRef={stateRef}
        playerSpeedRef={stateRef}
        distanceRef={distanceRef}
        survivalRef={survivalRef}
        active={running}
        runToken={runTokenRef.current}
        cooldownRef={cooldownRef}
        onCollision={handleCollision}
        vehiclesRef={trafficVehiclesRef}
      />

      {/* Player car + camera both read the same controller state ref */}
      <PlayerCar stateRef={stateRef} />
      <CameraManager targetRef={stateRef} cameraMode={cameraMode} />

      {/* HUD overlay is DOM, rendered by AppShell/GameRouter separately */}
    </group>
  )
}

export default GameWorld
