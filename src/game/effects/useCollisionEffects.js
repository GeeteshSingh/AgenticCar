// Reactive collision-effects coordinator (ref-based, not per-frame React).
// Holds the camera-shake controller and an impact-flash timer. GameWorld's
// loop reads shake offset and applies it after camera placement.

import { createCameraShake } from '@/game/effects/CameraShake'

export function createCollisionEffects() {
  const shake = createCameraShake()
  let flash = 0 // 0..1 red impact vignette intensity, decays
  let flashCooldown = 0

  return {
    shake,
    triggerSeverity(severity, reduced = false) {
      if (reduced) return
      // Map severity -> shake trauma + flash
      switch (severity) {
        case 'light':
          shake.trigger(0.25)
          if (flashCooldown <= 0) flash = 0.08
          break
        case 'moderate':
          shake.trigger(0.55)
          if (flashCooldown <= 0) flash = 0.14
          break
        case 'severe':
          shake.trigger(1.0)
          if (flashCooldown <= 0) flash = 0.2
          break
        default:
          break
      }
      if (flash > 0 && flashCooldown <= 0) flashCooldown = .5
    },
    // decay flash each frame; returns current flash value
    tickFlash(dt) {
      flashCooldown = Math.max(0, flashCooldown - dt)
      flash = Math.max(0, flash - dt * 1.6)
      return flash
    },
    get flash() {
      return flash
    },
  }
}
