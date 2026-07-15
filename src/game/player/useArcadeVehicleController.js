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
    throttle: 0, // 0..1 visual indicator (auto + manual)
    braking: 0, // 0..1
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
    // The car accelerates on its own (cruise) and the up-arrow "boosts" it to
    // maximum speed. Brake / S still decelerates; reverse only at very low
    // speed as before.
    const canReverse = s.speed < VEHICLE.reverseSpeedThreshold
    s.throttle = accelInput > 0 ? 1 : 0
    s.braking = brakeInput > 0 ? 1 : 0

    let accel = 0 // km/h per second
    if (brakeInput > 0 && s.speed > 1) {
      // Active braking always wins over auto-drive.
      accel -= VEHICLE.brakingPower * brakeInput
    } else if (brakeInput > 0 && canReverse) {
      accel -= VEHICLE.reversePower * brakeInput
    } else {
      // Auto-cruise toward a comfortable speed; boost (up arrow) pushes to max.
      const targetSpeed = accelInput > 0 ? VEHICLE.maxSpeed : VEHICLE.cruiseSpeed
      if (s.speed < targetSpeed) {
        accel += VEHICLE.enginePower * (accelInput > 0 ? 1 : 0.6)
      } else if (s.speed > targetSpeed) {
        // Gentle coast-down when above the target speed without braking.
        accel -= VEHICLE.rollingResistance
      }
    }
    // Drag + rolling resistance
    const dragKmhPerS = VEHICLE.dragCoef * Math.abs(s.speed) // scales w/ speed
    accel -= dragKmhPerS * Math.sign(s.speed)
    if (s.speed > 0) accel -= VEHICLE.rollingResistance

    s.speed += accel * dt
    if (s.speed > VEHICLE.maxSpeed) s.speed = VEHICLE.maxSpeed
    if (s.speed < -VEHICLE.maxReverseSpeed) s.speed = -VEHICLE.maxReverseSpeed
    // Clamp tiny speeds to rest
    if (Math.abs(s.speed) < 0.05) s.speed = 0

    // --- Lateral (arcade grip + steering-driven yaw) ---
    const speedMs = s.speed * KMH_TO_MS
    // Negate steer for world motion: the chase camera looks toward +z, which
    // mirrors the axes so world +x maps to screen-left. Pressing left (steer
    // -1) must move the car screen-left (+x), so we invert here for both the
    // lateral velocity and the visual yaw.
    const steerAngle = steerAngleFor(-s.steer, s.speed)
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
    // Pitch is a subtle visual squat on acceleration and dive on braking.
    // s.throttle (0..1) and s.braking (0..1) are set below from the inputs.
    const targetPitch = (s.braking ? 1 : 0) * 0.05 - (s.throttle ? 1 : 0) * 0.03
    s.bodyPitch += (targetPitch - s.bodyPitch) * Math.min(1, VEHICLE.bodyDamping * dt)
    const targetRoll = -s.steer * VEHICLE.maxBodyRoll
    s.bodyRoll += (targetRoll - s.bodyRoll) * Math.min(1, VEHICLE.bodyDamping * dt)

    s.lastAccel = accel
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
