import { create } from 'zustand'

export const GAME_STATES = {
  MENU: 'menu',
  LOADING: 'loading',
  COUNTDOWN: 'countdown',
  PLAYING: 'playing',
  PAUSED: 'paused',
  RESULTS: 'results',
}

// Core application + gameplay state machine.
// High-frequency simulation values (vehicle transforms, traffic positions,
// camera interpolation) are intentionally NOT stored here — they live in refs
// inside the R3F render loop. This store holds only meaningful, low-frequency
// game state and UI-relevant values.
export const useGameStore = create((set, get) => ({
  // ---- Session lifecycle ----
  phase: GAME_STATES.MENU,
  mode: null, // 'mission' | 'endless'

  // ---- Run stats (updated throttled, not per frame) ----
  score: 0,
  speedKmh: 0,
  distanceMeters: 0,
  survivalTime: 0,
  integrity: 100,
  multiplier: 1,
  overtakes: 0,
  nearMisses: 0,
  collisions: 0,
  topSpeed: 0,
  // Objective HUD snapshot (throttled)
  activeObjective: null,
  objectiveCompleted: 0,
  objectiveTotal: 0,
  missionComplete: false,
  cameraMode: 'chase', // 'chase' | 'hood'

  // ---- Actions ----
  setPhase: (phase) => set({ phase }),

  setMode: (mode) => set({ mode }),

  startRun: (mode) =>
    set({
      mode,
      phase: GAME_STATES.LOADING,
      score: 0,
      speedKmh: 0,
      distanceMeters: 0,
      survivalTime: 0,
      integrity: 100,
      multiplier: 1,
      overtakes: 0,
      nearMisses: 0,
      collisions: 0,
      topSpeed: 0,
      activeObjective: null,
      objectiveCompleted: 0,
      objectiveTotal: 0,
      missionComplete: false,
      cameraMode: 'chase',
    }),

  beginCountdown: () => set({ phase: GAME_STATES.COUNTDOWN }),

  beginPlaying: () => set({ phase: GAME_STATES.PLAYING }),

  pause: () => {
    if (get().phase === GAME_STATES.PLAYING) set({ phase: GAME_STATES.PAUSED })
  },

  resume: () => {
    if (get().phase === GAME_STATES.PAUSED) set({ phase: GAME_STATES.PLAYING })
  },

  togglePause: () => {
    const { phase, pause, resume } = get()
    if (phase === GAME_STATES.PLAYING) pause()
    else if (phase === GAME_STATES.PAUSED) resume()
  },

  finishRun: (results) =>
    set({
      phase: GAME_STATES.RESULTS,
      score: results?.score ?? get().score,
      distanceMeters: results?.distanceMeters ?? get().distanceMeters,
      missionComplete: results?.missionComplete ?? false,
    }),

  returnToMenu: () =>
    set({
      phase: GAME_STATES.MENU,
      mode: null,
      score: 0,
      speedKmh: 0,
      distanceMeters: 0,
      survivalTime: 0,
      integrity: 100,
      multiplier: 1,
      overtakes: 0,
      nearMisses: 0,
      collisions: 0,
      topSpeed: 0,
      activeObjective: null,
      objectiveCompleted: 0,
      objectiveTotal: 0,
      missionComplete: false,
      cameraMode: 'chase',
    }),

  toggleCameraMode: () =>
    set((s) => ({ cameraMode: s.cameraMode === 'chase' ? 'hood' : 'chase' })),

  // Throttled stat updates from the game loop
  updateStats: (stats) => set(stats),
}))
