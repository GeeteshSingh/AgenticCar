import { Howl, Howler } from 'howler'
import { useSettingsStore } from '@/stores/useSettingsStore'

// Module-level audio singleton. Lives outside the R3F reconciler so both the
// DOM UI and the in-canvas game loop can call it directly (mirrors the
// collision-signal pattern). All access is guarded: missing files, a blocked
// AudioContext, or an unsupported browser must never break gameplay.

const ASSET_BASE = '/audio'

// One-shot cues. Each is loaded lazily; if the file 404s, onloaderror marks it
// unavailable and we simply skip playback.
const CUES = {
  ui: { src: `${ASSET_BASE}/ui.mp3`, volume: 0.5 },
  nearMiss: { src: `${ASSET_BASE}/near-miss.mp3`, volume: 0.8 },
  collisionLight: { src: `${ASSET_BASE}/collision-light.mp3`, volume: 0.8 },
  collisionHeavy: { src: `${ASSET_BASE}/collision-heavy.mp3`, volume: 1.0 },
}

function makeHowl({ src, volume }) {
  let available = true
  const howl = new Howl({
    src: [src],
    volume,
    preload: true,
    onloaderror: () => {
      available = false
    },
  })
  return { howl, isAvailable: () => available }
}

const cues = Object.fromEntries(
  Object.entries(CUES).map(([k, v]) => [k, makeHowl(v)]),
)

// ---- WebAudio fallback engine/wind synth (no asset files required) ----
// Produces a soft speed-reactive drone so the game has audible feedback before
// any .mp3 assets exist. Fully guarded; disabled the moment an error occurs.
let audioCtx = null
let engineOsc = null
let engineGain = null
let windOsc = null
let windGain = null
let synthReady = false

function ensureSynth() {
  if (synthReady || typeof window === 'undefined') return
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    audioCtx = new Ctx()
    engineOsc = audioCtx.createOscillator()
    engineGain = audioCtx.createGain()
    engineOsc.type = 'sawtooth'
    engineOsc.frequency.value = 60
    engineGain.gain.value = 0
    engineOsc.connect(engineGain).connect(audioCtx.destination)
    engineOsc.start()

    windOsc = audioCtx.createOscillator()
    windGain = audioCtx.createGain()
    windOsc.type = 'triangle'
    windOsc.frequency.value = 220
    windGain.gain.value = 0
    windOsc.connect(windGain).connect(audioCtx.destination)
    windOsc.start()

    synthReady = true
  } catch {
    synthReady = false
  }
}

// Resume the context on first user gesture (browser autoplay policy).
function resumeContext() {
  try {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume()
  } catch {
    /* ignore */
  }
}

// Effective gain = master * channel * (1 - muted).
function effective(channelBase, channelKey) {
  const s = useSettingsStore.getState()
  if (s.muted) return 0
  return s.masterVolume * channelBase * s[channelKey]
}

export const audioManager = {
  // Called on any user gesture (button click, key press) to unlock audio.
  unlock() {
    ensureSynth()
    resumeContext()
    this.applyMaster()
  },

  // Speed-reactive continuous sounds. speedNorm in 0..1.
  updateEngine(speedNorm = 0) {
    if (!synthReady) return
    try {
      const g = effective(0.18, 'engineVolume')
      engineGain.gain.setTargetAtTime(g, audioCtx.currentTime, 0.08)
      const freq = 55 + speedNorm * 150
      engineOsc.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.1)
    } catch {
      /* ignore */
    }
  },

  updateWind(speedNorm = 0) {
    if (!synthReady) return
    try {
      const g = effective(0.12, 'environmentVolume') * Math.min(1, speedNorm)
      windGain.gain.setTargetAtTime(g, audioCtx.currentTime, 0.12)
      const freq = 180 + speedNorm * 500
      windOsc.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.15)
    } catch {
      /* ignore */
    }
  },

  stopContinuous() {
    if (!synthReady) return
    try {
      engineGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1)
      windGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1)
    } catch {
      /* ignore */
    }
  },

  playUi() {
    this.unlock()
    const c = cues.ui
    if (c.isAvailable()) c.howl.volume(effective(c.howl.volume(), 'effectsVolume')).play()
  },

  playNearMiss() {
    const c = cues.nearMiss
    if (c.isAvailable()) c.howl.volume(effective(c.howl.volume(), 'effectsVolume')).play()
  },

  playCollision(severity = 'moderate') {
    const key = severity === 'severe' ? 'collisionHeavy' : 'collisionLight'
    const c = cues[key]
    if (c.isAvailable()) c.howl.volume(effective(c.howl.volume(), 'effectsVolume')).play()
  },

  // Global master volume pass-through to Howler (affects one-shot Howls).
  applyMaster() {
    const s = useSettingsStore.getState()
    Howler.volume(s.muted ? 0 : s.masterVolume)
  },
}

export default audioManager
