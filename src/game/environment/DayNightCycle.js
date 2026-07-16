import { ENVIRONMENT, getEnvAtCycle, getEnvForPhase } from '@/game/config/gameConfig'

// Phase 7 day/night controller. Pure logic (no React) so it can run inside the
// R3F render loop via refs. Tracks elapsed run time and exposes the current
// interpolated environment description plus a headlight flag.
//
// Behavior:
//   - Endless mode cycles through dawn -> day -> sunset -> night on a fixed
//     total duration (ENVIRONMENT.cycleDurationSec), smoothly interpolated.
//   - Mission mode can lock to a single phase (e.g. 'day') and hold it for the
//     whole run.
export function createDayNightCycle() {
  let elapsed = 0

  return {
    reset() {
      elapsed = 0
    },

    // Advance by dt seconds and return the current environment snapshot.
    update(dt, { lockedPhase = null } = {}) {
      if (lockedPhase) {
        return getEnvForPhase(lockedPhase)
      }
      elapsed += dt
      const p = (elapsed % ENVIRONMENT.cycleDurationSec) / ENVIRONMENT.cycleDurationSec
      return getEnvAtCycle(p)
    },
  }
}
