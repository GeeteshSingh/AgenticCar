import { playImpact, subscribeImpact } from '@/game/audio/impact'
import { engineMix, soundProfile, trafficMix, currentTrafficAudio, subscribeHorn, subscribeAudioStart } from '@/game/audio/drivingMix'
import { playerVehicle } from '@/game/config/playerVehicles'
import { useEffect } from 'react'
import { useGameStore } from '@/stores/useGameStore'
import { useSettingsStore } from '@/stores/useSettingsStore'

// Synthesized engine and filtered wind avoid external assets and downloads.
// The context is created only after a user gesture, with one bounded noise buffer.
export function DrivingAudio() {
  useEffect(() => {
    let context, engine, wind, engineGain, windGain, timer, noiseBuffer, hornGain, exhaust, exhaustGain, engineFilter
    let lastHorn = -Infinity
    const voices = [], horns = []
    const audioFailure = () => useSettingsStore.setState({audioError: 'Engine audio is unavailable. Radio and driving still work; try another browser or mute engine sound.'})
    const start = () => {
      if (context) { if (context.state === 'suspended') context.resume().then(() => useSettingsStore.setState({audioError: ''})).catch(audioFailure); return }
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) { audioFailure(); return }
      context = new AudioContext()
      engine = context.createOscillator(); engine.type = 'triangle'
      engineFilter = context.createBiquadFilter(); engineFilter.type = 'lowpass'; engineFilter.frequency.value = 650
      engineGain = context.createGain(); engineGain.gain.value = 0
      engine.connect(engineFilter).connect(engineGain).connect(context.destination); engine.start()
      exhaust = context.createOscillator(); exhaust.type = 'sawtooth'
      const exhaustFilter = context.createBiquadFilter(); exhaustFilter.type = 'lowpass'; exhaustFilter.frequency.value = 340
      exhaustGain = context.createGain(); exhaustGain.gain.value = 0
      exhaust.connect(exhaustFilter).connect(exhaustGain).connect(context.destination); exhaust.start()
      const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate)
      noiseBuffer = buffer
      const samples = buffer.getChannelData(0)
      for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1
      wind = context.createBufferSource(); wind.buffer = buffer; wind.loop = true
      const filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 480
      windGain = context.createGain(); windGain.gain.value = 0
      wind.connect(filter).connect(windGain).connect(context.destination); wind.start()
      for (let i = 0; i < 3; i++) {
        const oscillator = context.createOscillator(), gain = context.createGain(), pan = context.createStereoPanner()
        oscillator.type = 'triangle'; gain.gain.value = 0
        oscillator.connect(gain).connect(pan).connect(context.destination); oscillator.start()
        voices.push({oscillator, gain, pan})
      }
      hornGain = context.createGain(); hornGain.gain.value = 0; hornGain.connect(context.destination)
      for (const frequency of [350, 440]) {
        const oscillator = context.createOscillator(); oscillator.type = 'sawtooth'; oscillator.frequency.value = frequency
        oscillator.connect(hornGain); oscillator.start(); horns.push(oscillator)
      }
      timer = setInterval(() => {
        const {phase, speedKmh} = useGameStore.getState()
        const settings = useSettingsStore.getState()
        const volume = phase === 'playing' ? useSettingsStore.getState().engineVolume : 0
        const speed = Math.abs(speedKmh)
        const mix = engineMix(speed, settings.engineVolume, phase, playerVehicle(settings.vehicle).type)
        const profile = soundProfile(playerVehicle(settings.vehicle).type)
        engine.frequency.setTargetAtTime(mix.frequency || 80, context.currentTime, .12)
        exhaust.frequency.setTargetAtTime((mix.frequency || 80) / 2, context.currentTime, .12)
        exhaustGain.gain.setTargetAtTime(mix.gain * profile.exhaust * .65, context.currentTime, .08)
        engineGain.gain.setTargetAtTime(mix.gain, context.currentTime, .08)
        const traffic = currentTrafficAudio()
        const nearby = trafficMix(traffic.vehicles, traffic.playerX, speed, volume, phase)
        voices.forEach((voice, i) => {
          voice.gain.gain.setTargetAtTime(nearby[i]?.gain || 0, context.currentTime, .08)
          if (nearby[i]) { voice.oscillator.frequency.setTargetAtTime(nearby[i].frequency, context.currentTime, .08); voice.pan.pan.setTargetAtTime(nearby[i].pan, context.currentTime, .08) }
        })
        if (phase !== 'playing' || volume === 0) { hornGain.gain.cancelScheduledValues(context.currentTime); hornGain.gain.setTargetAtTime(0, context.currentTime, .015) }
        windGain.gain.setTargetAtTime(volume * speed / 450, context.currentTime, .15)
      }, 100)
      context.resume().then(() => useSettingsStore.setState({audioError: ''})).catch(audioFailure)
    }
    const unsubscribeStart = subscribeAudioStart(start)
    const unsubscribeHorn = subscribeHorn(() => {
      if (useGameStore.getState().phase !== 'playing') return
      start()
      if (!context) return
      const sound = () => {
        if (useGameStore.getState().phase !== 'playing' || context.currentTime - lastHorn < .5) return
        lastHorn = context.currentTime
        const now = context.currentTime, settings = useSettingsStore.getState(), volume = settings.engineVolume
        const profile = soundProfile(playerVehicle(settings.vehicle).type)
        horns.forEach((horn, i) => horn.frequency.setValueAtTime(profile.horn[i], now))
        hornGain.gain.cancelScheduledValues(now); hornGain.gain.setValueAtTime(0, now)
        hornGain.gain.linearRampToValueAtTime(volume * .35, now + .025)
        hornGain.gain.setValueAtTime(volume * .35, now + .3)
        hornGain.gain.linearRampToValueAtTime(0, now + .4)
      }
      if (context.state === 'running') sound()
      else context.resume().then(sound).catch(audioFailure)
    })
    const unsubscribe = subscribeImpact(severity => playImpact(context, noiseBuffer, severity, useSettingsStore.getState().engineVolume))
    window.addEventListener('pointerdown', start)
    window.addEventListener('keydown', start)
    return () => { unsubscribe(); unsubscribeHorn(); unsubscribeStart(); for (const voice of voices) voice.oscillator.stop(); for (const horn of horns) horn.stop(); window.removeEventListener('pointerdown', start); window.removeEventListener('keydown', start); clearInterval(timer); engine?.stop(); exhaust?.stop(); wind?.stop(); context?.close() }
  }, [])
  return null
}
