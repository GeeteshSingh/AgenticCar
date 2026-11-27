const listeners = new Set()
export function emitImpact(severity) { for (const listener of listeners) listener(severity) }
export function subscribeImpact(listener) { listeners.add(listener); return () => listeners.delete(listener) }

// Reuse the engine's noise buffer; each impact has a bounded, self-cleaning voice.
export function playImpact(context, buffer, severity, volume) {
  if (!context || context.state !== 'running' || volume <= 0) return
  const intensity = {light: .3, moderate: .6, severe: 1}[severity]
  if (!intensity) return
  const source = context.createBufferSource()
  const filter = context.createBiquadFilter()
  const gain = context.createGain()
  source.buffer = buffer
  filter.type = 'lowpass'
  filter.frequency.value = 350 + intensity * 900
  const now = context.currentTime
  gain.gain.setValueAtTime(Math.min(1, volume) * intensity * .8, now)
  gain.gain.exponentialRampToValueAtTime(.001, now + .3)
  source.connect(filter).connect(gain).connect(context.destination)
  source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect() }
  source.start(now)
  source.stop(now + .32)
}
