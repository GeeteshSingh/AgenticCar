import { useRef, useEffect } from 'react'
import { VEHICLE, KMH_TO_MS, MS_TO_KMH, steerAngleFor } from '@/game/config/vehicleConfig'
import { WORLD } from '@/game/config/gameConfig'

// Arcade vehicle controller. State is held in a ref and integrated in the
// R3F render loop via update(dt, inputActions). NO React state per frame.
//
// State:
//   speed      km/h (signed; negative = reverse)
//   lateralX   world x position (meters from road center)
//   steer      current smoothed steer input (-1..1)
//   yaw        heading offset from road direction (radians)
//   bodyRoll   visual roll (radians)
//   bodyPitch visual pitch (radians)
//   onRoad     bool (whether within road bounds)

export function createVehicleState() {
  return {
    speed: 0,
    lateralX: 0,
    steer: 0,
    yaw: 0,
    velX: 0, // lateral velocity (m/s)
    bodyRoll: 0,
    bodyPitch: 0,
    lastAccel: 0,
  }
}

export function useArcadeVehicleController(actionsRef, { active = true } = {}) {
  const stateRef = useRef(createVehicleState())

  // Integrate one step. Returns the new state ref (mutated in place).
  const update = (dt, input) => {
    const s = stateRef.current
    if (!active || !input) return s

    const accelInput = input.accelerate || 0
    const brakeInput = input.brake || 0
    const handbrake = input.handbrake || false

    // --- Steering smoothing ---
    const targetSteer = input.steer || 0
    const rate = targetSteer === 0 ? VEHICLE.steerReturn : VEHICLE.steerSpeed
    s.steer += (targetSteer - s.steer) * Math.min(1, rate * dt)

    // --- Longitudinal ---
    let accel = 0 // km/h per second
    const canReverse = s.speed < VEHICLE.reverseSpeedThreshold
    if (accelInput > 0) {
      accel += VEHICLE.enginePower * accelInput
    }
    if (brakeInput > 0) {
      if (s.speed > 1) {
        accel -= VEHICLE.brakingPower * brakeInput
      } else if (canReverse) {
        accel -= VEHICLE.reversePower * brakeInput
      }
    }
    // Drag + rolling resistance
    const dragKmhPerS = VEHICLE.dragCoef * Math.abs(s.speed) // scales w/ speed
    accel -= dragKmhPerS * Math.sign(s.speed)
    accel -= VEHICLE.rollingResistance * Math.sign(s.speed) * (s.speed !== 0 ? 1 : 0)

    const prevSpeed = s.speed
    s.speed += accel * dt
    if (s.speed > VEHICLE.maxSpeed) s.speed = VEHICLE.maxSpeed
    if (s.speed < -VEHICLE.maxReverseSpeed) s.speed = -VEHICLE.maxReverseSpeed
    // Clamp tiny speeds to rest
    if (Math.abs(s.speed) < 0.05) s.speed = 0

    // --- Lateral (arcade grip + steering-driven yaw) ---
    const speedMs = s.speed * KMH_TO_MS
    const steerAngle = steerAngleFor(s.steer, s.speed)
    // Curvature: turning radius from steer angle at speed -> desired lateral vel
    const grip = handbrake ? VEHICLE.gripLateral * VEHICLE.handbrakeGripMultiplier : VEHICLE.gripLateral
    // Desired lateral velocity from steering (proportional to forward speed)
    const desiredVelX = speedMs * Math.sin(steerAngle)
    // Arcade grip: ease current lateral velocity toward desired
    s.velX += (desiredVelX - s.velX) * Math.min(1, grip * dt)
    s.lateralX += s.velX * dt

    // Yaw follows steer for visual heading and camera
    const yawTarget = steerAngle * Math.min(1, Math.abs(s.speed) / 30)
    s.yaw += (yawTarget - s.yaw) * Math.min(1, 5 * dt)

    // --- Road boundary (soft) ---
    const halfWidth = WORLD.roadWidth / 2 - VEHICLE.width / 2
    if (s.lateralX > halfWidth) {
      s.lateralX = halfWidth
      s.velX = Math.min(0, s.velX)
    } else if (s.lateralX < -halfWidth) {
      s.lateralX = -halfWidth
      s.velX = Math.max(0, s.velX)
    }

    // --- Visual body dynamics ---
    const accelDelta = (s.speed - prevSpeed) / Math.max(dt, 1e-4) // km/h per second
    const targetPitch = -accelDelta * VEHICLE.maxPitchAccel * 0.4
    s.bodyPitch += (targetPitch - s.bodyPitch) * Math.min(1, VEHICLE.bodyDamping * dt)
    const targetRoll = -s.steer * VEHICLE.maxBodyRoll
    s.bodyRoll += (targetRoll - s.bodyRoll) * Math.min(1, VEHICLE.bodyDamping * dt)

    s.lastAccel = accelDelta
    return s
  }

  // Reset when a new run starts
  useEffect(() => {
    if (active) {
      stateRef.current = createVehicleState()
    }
  }, [active])

  return { stateRef, update }
}
