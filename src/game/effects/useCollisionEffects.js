// Reactive collision-effects coordinator (ref-based, not per-frame React).
// Holds the camera-shake controller and an impact-flash timer. GameWorld's
// loop reads shake offset and applies it after camera placement.

import { createCameraShake } from '@/game/effects/CameraShake'

export function createCollisionEffects() {
  const shake = createCameraShake()
  let flash = 0 // 0..1 red impact vignette intensity, decays

  return {
    shake,
    triggerSeverity(severity) {
      // Map severity -> shake trauma + flash
      switch (severity) {
        case 'light':
          shake.trigger(0.25)
          flash = Math.max(flash, 0.25)
          break
        case 'moderate':
          shake.trigger(0.55)
          flash = Math.max(flash, 0.5)
          break
        case 'severe':
          shake.trigger(1.0)
          flash = Math.max(flash, 0.9)
          break
        default:
          break
      }
    },
    // decay flash each frame; returns current flash value
    tickFlash(dt) {
      flash = Math.max(0, flash - dt * 1.6)
      return flash
    },
    get flash() {
      return flash
    },
  }
}
