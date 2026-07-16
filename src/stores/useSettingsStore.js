import { create } from 'zustand'

// Audio / presentation settings. Volumes are 0..1. The audio manager reads
// these each frame, so changing them takes effect immediately without
// re-mounting any sound. Defaulting to a modest master keeps the game audible
// once asset files are dropped into /public/audio; absent files simply no-op.
export const useSettingsStore = create((set) => ({
  masterVolume: 0.7,
  engineVolume: 0.6,
  effectsVolume: 0.8,
  environmentVolume: 0.5,
  musicVolume: 0.4,
  muted: false,

  // Graphics / performance. graphicsQuality is the user's choice
  // ('auto' lets the runtime pick a tier and adapt). autoTier is the resolved
  // tier when in auto mode; it can be lowered at runtime if FPS drops.
  graphicsQuality: 'auto', // 'auto' | 'low' | 'medium' | 'high'
  autoTier: 'high',

  setVolume: (key, value) => set({ [key]: Math.max(0, Math.min(1, value)) }),
  toggleMuted: () => set((s) => ({ muted: !s.muted })),
  setGraphicsQuality: (q) => set({ graphicsQuality: q }),
  setAutoTier: (t) => set({ autoTier: t }),
  reset: () =>
    set({
      masterVolume: 0.7,
      engineVolume: 0.6,
      effectsVolume: 0.8,
      environmentVolume: 0.5,
      musicVolume: 0.4,
      muted: false,
      graphicsQuality: 'auto',
      autoTier: 'high',
    }),
}))
