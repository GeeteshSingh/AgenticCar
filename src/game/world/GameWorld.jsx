import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { EndlessHighway } from '@/game/world/EndlessHighway'
import { PlayerCar } from '@/game/player/PlayerCar'
import { CameraManager } from '@/game/camera/CameraManager'
import { TrafficManager } from '@/game/traffic/TrafficManager'
import { useArcadeVehicleController } from '@/game/player/useArcadeVehicleController'
import { useKeyboardInput } from '@/game/input/useKeyboardInput'
import { useGameStore } from '@/stores/useGameStore'
import { playerVehicle } from '@/game/config/playerVehicles'
import { KMH_TO_MS } from '@/game/config/vehicleConfig'
import { createCollisionEffects } from '@/game/effects/useCollisionEffects'
import { emitImpact } from '@/game/audio/impact'
import { setCollisionFlash } from '@/game/effects/collisionSignal'
import { createScoringManager } from '@/game/scoring/ScoringManager'
import { createOvertakeDetector } from '@/game/scoring/overtakeDetector'
import { createNearMissDetector } from '@/game/scoring/nearMissDetector'
import { createEventBus, GAME_EVENTS } from '@/game/events/gameEvents'
import { createObjectiveManager } from '@/game/objectives/ObjectiveManager'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { Atmosphere } from '@/game/environment/Environment'
import { sampleRoad, roadFrame } from '@/game/world/roadProfile'

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
  const respawnCooldown = useRef(0), stuckTime = useRef(0)
  useEffect(() => {
    const respawn = () => {
      if (useGameStore.getState().phase !== 'playing' || respawnCooldown.current > 0) return
      const traffic = trafficVehiclesRef.current
      const candidates = [2, -2, 6, -6].sort((a, b) => Math.abs(a-stateRef.current.lateralX)-Math.abs(b-stateRef.current.lateralX))
      const safe = candidates.find(x => !traffic.some(v => v.active && Math.abs(v.z) < (v.length / 2 + 6) && Math.abs(v.x-x) < (v.width / 2 + 2)))
      if (safe === undefined) return
      Object.assign(stateRef.current, { lateralX:safe, speed:0, velX:0, yaw:0, steer:0, bodyRoll:0, bodyPitch:0 })
      respawnCooldown.current = 3; stuckTime.current = 0
      useGameStore.setState({ stuckHint:false, respawnFade:Date.now() })
    }
    window.addEventListener('wayfound-respawn', respawn)
    return () => window.removeEventListener('wayfound-respawn', respawn)
  }, [stateRef])

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
  if (runTokenRef.current === 0) {
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

  useEffect(() => {
    const snapshot = objectiveRef.current?.snapshot()
    updateStats({activeObjective: snapshot?.active ?? null, objectiveCompleted: 0, objectiveTotal: snapshot?.totalCount ?? 0})
  }, [updateStats])

  const settings = useSettingsStore()

  // Applies a collision assessment: reduces integrity, slows the car, shakes
  // the camera, and triggers the finish sequence at zero integrity.
  const handleCollision = (assessment) => {
    if (useGameStore.getState().mode === 'relaxed') return
    integrityRef.current = Math.max(0, integrityRef.current - assessment.damage)
    effectsRef.current.triggerSeverity(assessment.severity)
    emitImpact(assessment.severity)
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
        speedKmh: stateRef.current.speed,
      })
    }
  }

  // Lazily-bound finishRun (store action) to avoid re-creating handler
  const finishRunRef = useRef(null)
  finishRunRef.current = useGameStore.getState().finishRun

  const finishRun = (results) => {
    const scoring = scoringRef.current.snapshot()
    const objective = objectiveRef.current?.snapshot()
    finishRunRef.current?.({
      ...scoring,
      speedKmh: stateRef.current.speed,
      survivalTime: survivalRef.current,
      integrity: integrityRef.current,
      objectiveCompleted: objective?.completedCount ?? 0,
      objectiveTotal: objective?.totalCount ?? 0,
      ...results,
      topSpeed: scoring.topSpeed,
    })
  }

  useFrame((_, dt) => {
    if (destroyRef.current) return
    // Edge actions (camera / pause toggles)
    const edges = consumeEdgeActions()
    for (const e of edges) {
      if (e === 'toggleCamera') {
        toggleCameraMode()
        useSettingsStore.getState().setSetting('camera', useGameStore.getState().cameraMode)
      }
      else if (e === 'togglePause') togglePause()
    }

    dt = Math.min(dt, 1 / 30)
    if (running) respawnCooldown.current = Math.max(0, respawnCooldown.current - dt)
    if (running && cooldownRef.current > 0) cooldownRef.current = Math.max(0, cooldownRef.current - dt)

    if (running && useGameStore.getState().phase === 'playing') {
      const s = update(dt, actionsRef.current)
      stuckTime.current = actionsRef.current.accelerate && Math.abs(s.speed) < 2 ? stuckTime.current + dt : 0
      const stuck = stuckTime.current >= 4
      if (useGameStore.getState().stuckHint !== stuck) useGameStore.setState({ stuckHint:stuck })

      // Advance virtual distance (meters) from speed
      const dMeters = Math.max(0, s.speed) * KMH_TO_MS * dt
      distanceRef.current += dMeters
      survivalRef.current += dt
      topSpeedRef.current = Math.max(topSpeedRef.current, s.speed)
      const road = sampleRoad(distanceRef.current, 1, settings.environment)
      const ahead = roadFrame(15, distanceRef.current, 1, settings.environment)
      s.roadHeading = road.heading
      s.roadPitch = road.pitch
      s.lookX = ahead.x
      s.lookY = ahead.y

      // --- Scoring: distance, overtakes, near misses (events + detectors) ---
      scoringRef.current.addDistance(dMeters, s.speed)
      const vehicles = trafficVehiclesRef.current
      const overtaken = overtakeDetRef.current.detect(0, vehicles)
      for (const id of overtaken) {
        scoringRef.current.addOvertake()
        eventBusRef.current.emit({ type: GAME_EVENTS.VEHICLE_OVERTAKEN, vehicleId: id })
      }
      const misses = nearMissDetRef.current.detect({ playerX: s.lateralX, vehicles, playerSpeed: s.speed, playerWidth: playerVehicle(useSettingsStore.getState().vehicle).width })
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
        const activeGoal = goal.snapshot().active
        if (goalModeRef.current === 'mission' && activeGoal?.type === 'MINIMUM_INTEGRITY' && integrityRef.current < activeGoal.target) {
          destroyRef.current = true
          finishRun({resultReason: 'Mission ended: final integrity is below 50%.'})
          return
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
            speedKmh: stateRef.current.speed,
            missionComplete: true,
          })
        }
      }

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
      <Atmosphere settings={settings} />
      <EndlessHighway scrollRef={scrollRef} distanceRef={distanceRef} settings={settings} />

      {/* Traffic: pooled, recycled, lane-bound, safe-spawned */}
      <TrafficManager
        playerStateRef={stateRef}
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
      <CameraManager targetRef={stateRef} cameraMode={cameraMode} effectsRef={effectsRef} />

      {/* HUD overlay is DOM, rendered by AppShell/GameRouter separately */}
    </group>
  )
}

export default GameWorld
