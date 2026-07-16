// Global gameplay + world constants. Pure data only.

export const WORLD = {
  // Highway geometry (meters-ish units)
  laneCount: 4,
  laneWidth: 4,
  roadLength: 600, // length of a recycled segment pool window (z span)
  shoulderWidth: 2,
  // Total drivable width derived from lanes
  get roadWidth() {
    return this.laneCount * this.laneWidth
  },
  // How far ahead/behind the visible world extends
  viewDistance: 220,
  // Ground beyond the road for visual context
  groundWidth: 400,
  groundLength: 1200,
  // Top surface (world-y) of the asphalt slab. Shared by the highway, the
  // player car, and the scene so the vehicle rests exactly on the road.
  roadTop: 0.12,
}

export const PHYSICS = {
  fixedTimestep: 1 / 60,
  maxSubSteps: 5,
}

// Lighting / environment presets. Phase 7 introduces a day/night cycle with
// smooth interpolation between four keyframes (dawn, day, sunset, night).
// Each keyframe is a full environment description. Endless mode cycles through
// them on a timer; mission mode can lock to a single phase.
export const ENVIRONMENT = {
  // Cycle ordering for endless mode (dawn -> day -> sunset -> night -> ...).
  cycle: ['dawn', 'day', 'sunset', 'night'],
  // Total endless-mode cycle duration in seconds (6–8 min per instructions).
  cycleDurationSec: 420,
  keyframes: {
    dawn: {
      sunPosition: [ -120, 22, 60 ],
      sunColor: '#ffd9a0',
      sunIntensity: 1.0,
      ambientIntensity: 0.55,
      skyColor: '#f3c89a',
      fogColor: '#e9cba6',
      fogNear: 200,
      fogFar: 600,
      sunSize: 18,
      headlightVal: 0,
      label: 'Dawn',
    },
    day: {
      sunPosition: [60, 90, 40],
      sunColor: '#fff4d6',
      sunIntensity: 2.0,
      ambientIntensity: 0.85,
      skyColor: '#7db8f0',
      fogColor: '#bcd4ec',
      fogNear: 220,
      fogFar: 640,
      sunSize: 14,
      headlightVal: 0,
      label: 'Day',
    },
    sunset: {
      sunPosition: [120, 18, -30],
      sunColor: '#ff9d5c',
      sunIntensity: 1.25,
      ambientIntensity: 0.5,
      skyColor: '#e98a5b',
      fogColor: '#d99a78',
      fogNear: 180,
      fogFar: 560,
      sunSize: 20,
      headlightVal: 1,
      label: 'Sunset',
    },
    night: {
      sunPosition: [40, 70, -120],
      sunColor: '#9fb6e8',
      sunIntensity: 0.25,
      ambientIntensity: 0.22,
      skyColor: '#0e1630',
      fogColor: '#1a2238',
      fogNear: 150,
      fogFar: 480,
      sunSize: 12,
      headlightVal: 1,
      label: 'Night',
    },
  },
}

// Linear interpolation between two numbers.
const lerp = (a, b, t) => a + (b - a) * t

// Parse a hex color to RGB (0–255) and back; used for smooth sky/fog blends.
function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function rgbToHex([r, g, b]) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}
function lerpHex(a, b, t) {
  const ca = hexToRgb(a)
  const cb = hexToRgb(b)
  return rgbToHex([lerp(ca[0], cb[0], t), lerp(ca[1], cb[1], t), lerp(ca[2], cb[2], t)])
}
// Interpolate a [x,y,z] vector.
const lerpVec = (a, b, t) => a.map((v, i) => lerp(v, b[i], t))

// Given a normalized cycle position p in [0,1), return an interpolated
// environment keyframe blending the two surrounding cycle phases.
export function getEnvAtCycle(p) {
  const order = ENVIRONMENT.cycle
  const n = order.length
  const scaled = ((p % 1) + 1) % 1 * n
  const i0 = Math.floor(scaled) % n
  const i1 = (i0 + 1) % n
  const t = scaled - Math.floor(scaled)
  const A = ENVIRONMENT.keyframes[order[i0]]
  const B = ENVIRONMENT.keyframes[order[i1]]
  return blendKeyframes(A, B, t)
}

// Blend two keyframes into a single interpolated description.
export function blendKeyframes(A, B, t) {
  return {
    sunPosition: lerpVec(A.sunPosition, B.sunPosition, t),
    sunColor: lerpHex(A.sunColor, B.sunColor, t),
    sunIntensity: lerp(A.sunIntensity, B.sunIntensity, t),
    ambientIntensity: lerp(A.ambientIntensity, B.ambientIntensity, t),
    skyColor: lerpHex(A.skyColor, B.skyColor, t),
    fogColor: lerpHex(A.fogColor, B.fogColor, t),
    fogNear: lerp(A.fogNear, B.fogNear, t),
    fogFar: lerp(A.fogFar, B.fogFar, t),
    sunSize: lerp(A.sunSize, B.sunSize, t),
    // Smoothly interpolate the headlight factor (0 = off, 1 = full on) so
    // lights fade in/out rather than toggling at phase boundaries.
    headlightVal: lerp(A.headlightVal, B.headlightVal, t),
    headlights: lerp(A.headlightVal, B.headlightVal, t) > 0.5,
    // Pick the nearer label for HUD display.
    label: t < 0.5 ? A.label : B.label,
  }
}

// Return a fixed keyframe env for mission environment locking.
export function getEnvForPhase(phase) {
  return ENVIRONMENT.keyframes[phase] || ENVIRONMENT.keyframes.day
}
