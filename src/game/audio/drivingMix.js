export const SOUND_PROFILES = {
  suv: {idle: 88, rev: 1.05, exhaust: .75, horn: [392, 494]},
  truck: {idle: 82, rev: .7, exhaust: 1, horn: [175, 220]},
  cycle: {idle: 0, rev: 0, exhaust: 0, horn: [1175, 1568]},
  hatch: {idle: 105, rev: 1.35, exhaust: .55, horn: [440, 554]},
  sedan: {idle: 96, rev: 1.2, exhaust: .6, horn: [370, 466]},
  auto: {idle: 115, rev: 1.7, exhaust: .9, horn: [510, 640]},
  bike: {idle: 135, rev: 1.6, exhaust: 1, horn: [480, 600]},
  bus: {idle: 85, rev: .8, exhaust: .9, horn: [196, 247]},
  pickup: {idle: 91, rev: .95, exhaust: .85, horn: [330, 415]},
}
export function soundProfile(type) { return SOUND_PROFILES[type] || SOUND_PROFILES.suv }
export function engineMix(speed, volume, phase, type) {
  const running = phase === 'playing' && type !== 'cycle'
  const profile = soundProfile(type)
  return { frequency: profile.idle + Math.min(220, Math.abs(speed)) * profile.rev,
    gain: running ? volume * (.16 + Math.min(220, Math.abs(speed)) / 900) : 0 }
}
export function trafficMix(vehicles, playerX, playerSpeed, volume, phase) {
  if (phase !== 'playing' || volume <= 0) return []
  return vehicles.filter(v => v.active && Number.isFinite(v.x) && Number.isFinite(v.z) && Number.isFinite(v.speed))
    .map(v => ({...v, distance: Math.hypot(v.x - playerX, v.z)}))
    .filter(v => v.distance < 65).sort((a,b) => a.distance - b.distance).slice(0,3)
    .map(v => ({ frequency: (v.type === 'truck' || v.type === 'bus' ? 85 : 110) + Math.abs(v.speed) * .7 + (v.z > 0 ? 1 : -1) * Math.min(30, (Math.abs(playerSpeed) + Math.abs(v.speed)) * .1),
      gain: volume * .3 * (1 - v.distance / 65) ** 2,
      // World +x projects screen-left while the camera faces +z.
      pan: Math.max(-1, Math.min(1, -(v.x - playerX) / 10)) }))
}
let traffic = [], playerX = 0
export function updateTrafficAudio(vehicles, x) { traffic = vehicles; playerX = x }
export function currentTrafficAudio() { return { vehicles: traffic, playerX } }
const hornListeners = new Set()
export function requestHorn() { for (const listener of hornListeners) listener() }
export function subscribeHorn(listener) { hornListeners.add(listener); return () => hornListeners.delete(listener) }

const enableListeners = new Set()
export function requestAudioStart() { for (const listener of enableListeners) listener() }
export function subscribeAudioStart(listener) { enableListeners.add(listener); return () => enableListeners.delete(listener) }
