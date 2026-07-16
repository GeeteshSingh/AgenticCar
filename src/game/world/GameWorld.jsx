import { useRef } from 'react'
import { useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { EndlessHighway } from '@/game/world/EndlessHighway'
import { PlayerCar } from '@/game/player/PlayerCar'
import { CameraManager } from '@/game/camera/CameraManager'
import { TrafficManager } from '@/game/traffic/TrafficManager'
import { useArcadeVehicleController } from '@/game/player/useArcadeVehicleController'
import { useKeyboardInput } from '@/game/input/useKeyboardInput'
import { useGameStore, GAME_STATES } from '@/stores/useGameStore'
import { WORLD, getEnvForPhase } from '@/game/config/gameConfig'
import { createDayNightCycle } from '@/game/environment/DayNightCycle'
import { KMH_TO_MS, VEHICLE } from '@/game/config/vehicleConfig'
import { createCollisionEffects } from '@/game/effects/useCollisionEffects'
import { setCollisionFlash } from '@/game/effects/collisionSignal'
import { createScoringManager } from '@/game/scoring/ScoringManager'
import { createOvertakeDetector } from '@/game/scoring/overtakeDetector'
import { createNearMissDetector } from '@/game/scoring/nearMissDetector'
import { createEventBus, GAME_EVENTS } from '@/game/events/gameEvents'
import { createObjectiveManager } from '@/game/objectives/ObjectiveManager'
import { getMission } from '@/game/objectives/missionDefinitions'
import { audioManager } from '@/game/audio/AudioManager'
import { useAutoPerformanceTier } from '@/hooks/useAutoPerformanceTier'
import { Environment } from '@/game/environment/Environment'

// Live 3D scene for Phase 2. The player car stays near z=0; the highway
// scrolls toward it. All high-frequency simulation runs here via refs in the
// render loop. React state is only touched for throttled HUD stats and the
// camera-mode toggle.
export function GameWorld({ shadowMapSize = 1024 }) {
  const phase = useGameStore((s) => s.phase)
  const cameraMode = useGameStore((s) => s.cameraMode)
  const toggleCameraMode = useGameStore((s) => s.toggleCameraMode)
  const togglePause = useGameStore((s) => s.togglePause)
  const updateStats = useGameStore((s) => s.updateStats)

  const { actionsRef, consumeEdgeActions } = useKeyboardInput({ enabled: phase === 'playing' || phase === 'paused' })
  const { camera, scene } = useThree()

  const running = phase === 'playing'
  const { stateRef, update } = useArcadeVehicleController(actionsRef, { active: running })

  // Phase 9: sample FPS and adapt the auto graphics tier while playing.
  useAutoPerformanceTier(running)

  // Scroll value the highway reads (visual world speed in m/s)
  const scrollRef = useRef(0)

  // Phase 7: day/night refs. Declared early so the run-start block (which
  // seeds them) and applyEnvironment (called in the frame loop) share scope.
  const dayNightRef = useRef(createDayNightCycle())
  const ambientRef = useRef()
  const sunRef = useRef()
  const skyMatRef = useRef()
  const envRef = useRef(getEnvForPhase('day')) // shared interpolated env snapshot
  const headlightRef = useRef(0) // 0..1 emissive boost for headlights/taillights
  const lockedPhaseRef = useRef(null)

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
  const day = getEnvForPhase('day')

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
    dayNightRef.current.reset()
    // Re-seed locked phase for the new run.
    lockedPhaseRef.current = goalModeRef.current === 'mission' ? getMission().environment ?? null : null
  }
  prevPhaseRef.current = phase

  // Seed the objective HUD once per run (effect, not render) so the panel is
  // populated on the first frame without a null flicker. Runs after the ref-
  // based run-start block above, via the phase change to 'playing'.
  useEffect(() => {
    if (phase === 'playing' && objectiveRef.current) {
      const objSnap = objectiveRef.current.snapshot()
      updateStats({
        activeObjective: objSnap.active,
        objectiveCompleted: objSnap.completedCount,
        objectiveTotal: objSnap.totalCount,
      })
    }
  }, [phase, updateStats])

  // Read the mission-locked environment phase from the active mission def.
  if (goalModeRef.current === 'mission') {
    lockedPhaseRef.current = getMission().environment ?? null
  } else {
    lockedPhaseRef.current = null
  }

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
    audioManager.playCollision(assessment.severity)
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

  // Apply the current interpolated environment to the live scene objects.
  // Called every frame; mutates refs/textures so React never re-renders.
  const applyEnvironment = () => {
    const e = envRef.current
    if (!e) return
    if (ambientRef.current) ambientRef.current.intensity = e.ambientIntensity
    if (sunRef.current) {
      sunRef.current.position.set(e.sunPosition[0], e.sunPosition[1], e.sunPosition[2])
      sunRef.current.intensity = e.sunIntensity
      if (sunRef.current.color) sunRef.current.color.set(e.sunColor)
    }
    if (skyMatRef.current) skyMatRef.current.color.set(e.skyColor)
    if (scene?.fog) {
      scene.fog.color.set(e.fogColor)
      scene.fog.near = e.fogNear
      scene.fog.far = e.fogFar
    }
    // Smoothly ramp headlight emissive boost toward target (0 day, 1 night).
    const target = e.headlights ? 1 : 0
    headlightRef.current += (target - headlightRef.current) * Math.min(1, 4 * (1 / 60))
  }

  useFrame((_, dt) => {
    // Edge actions (camera / pause toggles)
    const edges = consumeEdgeActions()
    for (const e of edges) {
      if (e === 'toggleCamera') toggleCameraMode()
      else if (e === 'togglePause') togglePause()
    }
    // Any control input counts as a user gesture; unlock audio context.
    if (edges.length) audioManager.unlock()

    if (cooldownRef.current > 0) cooldownRef.current = Math.max(0, cooldownRef.current - dt)

    // Phase 7: advance day/night cycle and apply the current environment to
    // lights, sky, and fog imperatively (no per-frame React re-render).
    if (running) {
      envRef.current = dayNightRef.current.update(dt, { lockedPhase: lockedPhaseRef.current })
    }
    applyEnvironment()

    if (running) {
      const s = update(dt, actionsRef.current)

      // Phase 8: speed-reactive engine + wind audio (graceful if unavailable)
      const speedNorm = Math.min(1, Math.abs(s.speed) / VEHICLE.maxSpeed)
      audioManager.updateEngine(speedNorm)
      audioManager.updateWind(speedNorm)

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
        audioManager.playNearMiss()
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
          dayNightPhase: envRef.current?.label ?? 'Day',
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
      // Silence engine/wind while paused, in menus, or on results.
      audioManager.stopContinuous()
    }
  })

  return (
    <group>
      <ambientLight ref={ambientRef} intensity={day.ambientIntensity} />
      <directionalLight
        ref={sunRef}
        position={day.sunPosition}
        intensity={day.sunIntensity}
        color={day.sunColor}
        castShadow={shadowMapSize > 0}
        shadow-mapSize={[shadowMapSize || 1024, shadowMapSize || 1024]}
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
      <Environment env={envRef.current} skyMatRef={skyMatRef} />

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
        headlightRef={headlightRef}
      />

      {/* Player car + camera both read the same controller state ref */}
      <PlayerCar stateRef={stateRef} roadTop={WORLD.roadTop} headlightRef={headlightRef} />
      <CameraManager targetRef={stateRef} cameraMode={cameraMode} />

      {/* HUD overlay is DOM, rendered by AppShell/GameRouter separately */}
    </group>
  )
}

export default GameWorld
