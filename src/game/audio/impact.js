const listeners = new Set()
export function emitImpact(severity, closingKmh) { for (const listener of listeners) listener(severity, closingKmh) }
export function subscribeImpact(listener) { listeners.add(listener); return () => listeners.delete(listener) }

// Reuse the engine's noise buffer; each impact has a bounded, self-cleaning voice.
export function playImpact(context, buffer, severity, volume, closingKmh) {
  if (!context || context.state !== 'running' || volume <= 0) return
  const base = {light: .3, moderate: .6, severe: 1}[severity]
  const intensity = base && Number.isFinite(closingKmh) ? Math.max(.1, Math.min(1, closingKmh / 160)) : base
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
