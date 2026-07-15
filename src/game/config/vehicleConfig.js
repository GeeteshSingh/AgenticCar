// All arcade vehicle tuning lives here. No magic numbers in components.
// Units: speed in "km/h" for HUD, internally converted to m/s for motion.

export const VEHICLE = {
  // Dimensions (world units, ~meters)
  length: 4.4,
  width: 2.0,
  height: 1.4,
  wheelRadius: 0.4,
  mass: 1200, // kg (referential only; arcade model)

  // Speed limits (km/h)
  maxSpeed: 220,
  cruiseSpeed: 120, // speed the car auto-drives toward when no boost input
  maxReverseSpeed: 18,

  // Longitudinal acceleration (km/h per second)
  enginePower: 65, // throttle accel at low speed
  brakingPower: 120, // brake decel
  reversePower: 30, // reverse accel

  // Passive deceleration
  dragCoef: 0.6, // air drag factor (per second, scaled by speed)
  rollingResistance: 6, // constant slow-down (km/h per second)

  // Steering
  maxSteerAngle: 0.55, // radians at the wheels (visual + grip)
  steerSpeed: 4.0, // how fast steer input ramps
  steerReturn: 6.0, // how fast steer returns to center
  // Speed sensitivity: reduce steering authority at high speed
  steerSpeedSensitivity: 0.0035, // per (km/h), lower = more stable at speed

  // Lateral grip (arcade): how quickly lateral velocity is killed
  gripLateral: 9.0,
  // Drift threshold above which we reduce grip slightly (handbrake feel)
  handbrakeGripMultiplier: 0.35,

  // Reverse gating: only allow reverse at low forward speed
  reverseSpeedThreshold: 5, // km/h

  // Visual body dynamics
  maxBodyRoll: 0.12, // radians
  maxPitchAccel: 0.06, // radians
  bodyDamping: 6.0,

  // Road boundary reaction (soft push-back)
  boundaryStiffness: 40, // accel applied when leaving road
}

// Convert km/h <-> m/s for position integration
export const KMH_TO_MS = 1 / 3.6
export const MS_TO_KMH = 3.6

// Convert a steering input (-1..1) to a speed-sensitive steer angle.
export function steerAngleFor(steerInput, speedKmh) {
  const sensitivity = 1 / (1 + Math.max(0, speedKmh) * VEHICLE.steerSpeedSensitivity)
  return steerInput * VEHICLE.maxSteerAngle * sensitivity
}
