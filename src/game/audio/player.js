import { safeRadioUrl } from './catalog.js'
export function createRadioPlayer({ audioElement, timeoutMs = 20000, schedule = setTimeout, cancel = clearTimeout }) {
  const audio = audioElement
  audio.preload = 'none'
  let state = { stationId: null, status: 'idle', volume: .5, muted: false, errorCode: '' }
  let revision = 0, disposed = false, timer
  const listeners = new Set()
  const publish = patch => { state = { ...state, ...patch }; for (const fn of listeners) fn(state) }
  const clearTimer = () => { cancel(timer); timer = undefined }
  const matches = () => !disposed && !!state.stationId
  const armWatchdog = () => {
    if (timer !== undefined) return
    const attempt = revision
    timer = schedule(() => {
      timer = undefined
      if (attempt === revision && state.status === 'loading') {
        revision++
        publish({ status: 'error', errorCode: 'Stream connection timed out. Retry or select another station.' })
        audio.pause()
      }
    }, timeoutMs)
  }
  const buffering = () => {
    if (matches() && !audio.paused && state.status !== 'error') {
      publish({ status: 'loading' }); armWatchdog()
    }
  }
  const events = {
    playing: () => { if (matches() && !audio.paused && state.status !== 'error') { clearTimer(); publish({ status: 'playing', errorCode: '' }) } },
    waiting: buffering,
    stalled: buffering,
    pause: () => { if (matches() && audio.paused && state.status !== 'error') { clearTimer(); publish({ status: 'paused' }) } },
    ended: () => { if (matches() && audio.ended) { clearTimer(); publish({ status: 'paused' }) } },
    error: () => { if (matches() && audio.error) { revision++; clearTimer(); publish({ status: 'error', errorCode: 'Stream unavailable or format unsupported. Try another station.' }); audio.pause() } },
  }
  for (const [event, listener] of Object.entries(events)) audio.addEventListener(event, listener)
  function stop() {
    revision++; clearTimer(); publish({ stationId: null, status: 'idle', errorCode: '' }); audio.pause(); audio.removeAttribute('src'); audio.load()
  }
  async function play(station) {
    if (disposed) return false
    const streamUrl = safeRadioUrl(station.streamUrl)
    if (!streamUrl) { stop(); publish({ status: 'error', errorCode: 'Only public HTTPS audio streams without credentials are supported.' }); return false }
    if (station.hls && !audio.canPlayType('application/vnd.apple.mpegurl')) {
      stop(); publish({ status: 'error', errorCode: 'This station uses HLS, which this browser cannot play natively. Choose an MP3/AAC station or use Safari.' }); return false
    }
    const attempt = ++revision
    clearTimer()
    const changed = audio.getAttribute('src') !== streamUrl
    if (changed) { audio.pause(); audio.src = streamUrl; audio.load() }
    publish({ stationId: station.id, status: 'loading', errorCode: '' })
    armWatchdog()
    try {
      await audio.play()
      if (disposed || attempt !== revision) return false
      clearTimer(); publish({ status: 'playing', errorCode: '' }); return true
    } catch (error) {
      if (disposed || attempt !== revision) return false
      clearTimer(); publish({ status: 'error', errorCode: error.name === 'NotAllowedError' ? 'Playback was blocked. Press Play to start audio.' : 'Cannot play this stream. It may be offline or unsupported by your browser.' }); return false
    }
  }
  audio.volume = state.volume
  return {
    play, stop,
    pause() { revision++; clearTimer(); audio.pause(); if (state.stationId) publish({ status: 'paused' }) },
    setVolume(value) { const volume = Math.max(0, Math.min(1, Number(value) || 0)); audio.volume = volume; publish({ volume }) },
    setMuted(muted) { audio.muted = !!muted; publish({ muted: !!muted }) },
    subscribe(listener) { listeners.add(listener); listener(state); return () => listeners.delete(listener) },
    dispose() { if (disposed) return; stop(); disposed = true; for (const [event, listener] of Object.entries(events)) audio.removeEventListener(event, listener); listeners.clear() },
    getSnapshot() { return state },
  }
}
