// Minimal gameplay event bus. Detectors (overtake, near-miss, collision)
// emit events; the scoring manager and any other system subscribe and react
// independently. Keeps the spec's "detect emits an event; systems respond"
// rule without coupling detectors to scoring/UI/audio.

export const GAME_EVENTS = {
  DISTANCE_UPDATED: 'DISTANCE_UPDATED',
  VEHICLE_OVERTAKEN: 'VEHICLE_OVERTAKEN',
  NEAR_MISS: 'NEAR_MISS',
  COLLISION: 'COLLISION',
  OBJECTIVE_COMPLETED: 'OBJECTIVE_COMPLETED',
}

export function createEventBus() {
  const listeners = new Set()
  return {
    subscribe(fn) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    emit(event) {
      for (const fn of listeners) fn(event)
    },
  }
}
