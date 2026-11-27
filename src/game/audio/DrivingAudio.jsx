import { useEffect } from 'react'
import { useGameStore } from '@/stores/useGameStore'
import { useSettingsStore } from '@/stores/useSettingsStore'

// Synthesized engine and filtered wind avoid external assets and downloads.
// The context is created only after a user gesture, with one bounded noise buffer.
export function DrivingAudio() {
  useEffect(() => {
    let context, engine, wind, engineGain, windGain, timer
    const audioFailure = () => useSettingsStore.setState({audioError: 'Engine audio is unavailable. Radio and driving still work; try another browser or mute engine sound.'})
    const start = () => {
      if (context) { if (context.state === 'suspended') context.resume().then(() => useSettingsStore.setState({audioError: ''})).catch(audioFailure); return }
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) { audioFailure(); return }
      context = new AudioContext()
      engine = context.createOscillator(); engine.type = 'triangle'
      engineGain = context.createGain(); engineGain.gain.value = 0
      engine.connect(engineGain).connect(context.destination); engine.start()
      const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate)
      const samples = buffer.getChannelData(0)
      for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1
      wind = context.createBufferSource(); wind.buffer = buffer; wind.loop = true
      const filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 480
      windGain = context.createGain(); windGain.gain.value = 0
      wind.connect(filter).connect(windGain).connect(context.destination); wind.start()
      timer = setInterval(() => {
        const {phase, speedKmh} = useGameStore.getState()
        const volume = phase === 'playing' ? useSettingsStore.getState().engineVolume : 0
        const speed = Math.abs(speedKmh)
        engine.frequency.setTargetAtTime(35 + speed * .65, context.currentTime, .15)
        engineGain.gain.setTargetAtTime(volume * (.025 + speed / 1000), context.currentTime, .15)
        windGain.gain.setTargetAtTime(volume * speed / 450, context.currentTime, .15)
      }, 100)
      context.resume().then(() => useSettingsStore.setState({audioError: ''})).catch(audioFailure)
    }
    window.addEventListener('pointerdown', start)
    window.addEventListener('keydown', start)
    return () => { window.removeEventListener('pointerdown', start); window.removeEventListener('keydown', start); clearInterval(timer); engine?.stop(); wind?.stop(); context?.close() }
  }, [])
  return null
}
