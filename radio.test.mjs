import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeStation, safeRadioUrl, searchStations } from './src/game/audio/catalog.js'
import { parsePlaylist } from './src/game/audio/playlist.js'
import { createRadioPlayer } from './src/game/audio/player.js'

class FakeAudio {
  events = new Map(); src = ''; volume = 0; muted = false; paused = true; calls = 0
  addEventListener(k, fn) { this.events.set(k, fn) }
  removeEventListener(k) { this.events.delete(k) }
  emit(k) { this.events.get(k)?.() }
  pause() { this.paused = true; this.emit('pause') }
  load() {}
  removeAttribute() { this.src = '' }
  getAttribute() { return this.src }
  canPlayType() { return '' }
  play() { this.calls++; this.paused = false; return this.nextPlay ? this.nextPlay() : Promise.resolve() }
}
const station = { id: 'one', name: 'One', streamUrl: 'https://stream.example.org/live', hls: false }

test('radio URLs reject credentials, unsafe protocols and local/private hosts', () => {
  for (const url of ['http://radio.org/x', 'javascript:alert(1)', 'https://me:pass@radio.org/x', 'https://127.0.0.1/x', 'https://192.168.1.1/live', 'https://radio.org/x?token=private', 'https://[::1]/']) assert.equal(safeRadioUrl(url), '')
  assert.equal(safeRadioUrl(station.streamUrl), station.streamUrl)
  assert.equal(normalizeStation({ url: 'http://radio.org' }), null)
})
test('catalog fails over, passes filters, normalizes and filters unsafe station URLs', async () => {
  const requests = []
  const fetchImpl = async url => {
    requests.push(url)
    if (url.startsWith('https://one')) throw new Error('down')
    return { ok: true, json: async () => [{ stationuuid: 'abc', name: 'London Jazz', url_resolved: station.streamUrl, countrycode: 'GB', codec: 'MP3', lastcheckok: 1 }, { name: 'bad', url: 'http://insecure.example/' }] }
  }
  const rows = await searchStations({ query: 'Jazz', countryCode: 'gb', city: 'London', tag: 'jazz', limit: 999, fetchImpl, mirrors: ['https://one', 'https://two'] })
  assert.equal(requests.length, 2); assert.equal(rows.length, 1); assert.equal(rows[0].online, true)
  const params = new URL(requests[1]).searchParams
  assert.equal(params.get('countrycode'), 'GB'); assert.equal(params.get('limit'), '100'); assert.equal(params.get('tag'), 'jazz')
})
test('cancelled catalog request does not fall through to more mirrors', async () => {
  const controller = new AbortController(); controller.abort()
  let calls = 0
  await assert.rejects(searchStations({ signal: controller.signal, fetchImpl: () => { calls++ }, mirrors: ['https://one'] }), { name: 'AbortError' })
  assert.equal(calls, 0)
})
test('M3U handles names, duplicate URLs and reports video/insecure entries', () => {
  const value = parsePlaylist('#EXTM3U\n#EXTINF:-1,My Station\nhttps://stream.example.org/live\nhttps://stream.example.org/live\nhttp://unsafe.org/live\nhttps://video.org/movie.mp4')
  assert.equal(value.stations.length, 1); assert.equal(value.stations[0].name, 'My Station'); assert.equal(value.warnings.length, 2)
  assert.throws(() => parsePlaylist('#EXTM3U\n#EXT-X-TARGETDURATION:10\nsegment.ts'), /HLS media playlist/)
  assert.throws(() => parsePlaylist('https://video.org/channel.m3u8'), /HLS entry/)
  assert.equal(parsePlaylist('#EXTINF:-1 radio="true",HLS Audio\nhttps://radio.org/audio.m3u8').stations[0].hls, true)
})
test('playlist bounds and relative URLs have explicit behavior', () => {
  assert.throws(() => parsePlaylist('a'.repeat(512 * 1024 + 1)), /512 KB/)
  assert.throws(() => parsePlaylist('/live.mp3'), /relative URL/)
  assert.equal(parsePlaylist('/live.mp3', { baseUrl: 'https://radio.org/stations/list.m3u' }).stations[0].streamUrl, 'https://radio.org/live.mp3')
})
test('native player plays, pauses, changes volume and releases resources', async () => {
  const audio = new FakeAudio(), player = createRadioPlayer({ audioElement: audio })
  assert.equal(await player.play(station), true); assert.equal(player.getSnapshot().status, 'playing')
  player.setVolume(5); assert.equal(audio.volume, 1); player.setMuted(true); assert.equal(audio.muted, true)
  player.pause(); assert.equal(player.getSnapshot().status, 'paused')
  player.stop(); assert.equal(audio.src, ''); assert.equal(player.getSnapshot().status, 'idle')
  player.dispose(); assert.equal(audio.events.size, 0); assert.equal(await player.play(station), false)
})
test('station switch ignores old rejected play promise and unsupported HLS stops old playback', async () => {
  const audio = new FakeAudio(), player = createRadioPlayer({ audioElement: audio })
  let rejectOld
  audio.nextPlay = () => new Promise((resolve, reject) => { rejectOld = reject })
  const first = player.play(station)
  audio.nextPlay = () => Promise.resolve()
  assert.equal(await player.play({ ...station, id: 'two', streamUrl: 'https://radio.org/two' }), true)
  rejectOld(new Error('aborted')); assert.equal(await first, false); assert.equal(player.getSnapshot().stationId, 'two'); assert.equal(player.getSnapshot().status, 'playing')
  assert.equal(await player.play({ ...station, hls: true }), false); assert.equal(audio.src, ''); assert.match(player.getSnapshot().errorCode, /HLS/)
  player.dispose()
})
test('autoplay rejection and stream errors are surfaced', async () => {
  const audio = new FakeAudio(), player = createRadioPlayer({ audioElement: audio })
  audio.nextPlay = () => Promise.reject(Object.assign(new Error('blocked'), { name: 'NotAllowedError' }))
  assert.equal(await player.play(station), false); assert.match(player.getSnapshot().errorCode, /blocked/)
  audio.nextPlay = () => Promise.resolve(); await player.play(station); audio.error = {code: 4}; audio.emit('error'); assert.equal(player.getSnapshot().status, 'error')
  player.dispose()
})


test('queued pause from previous station cannot overwrite active playback', async () => {
  const audio = new FakeAudio()
  audio.pause = () => { audio.paused = true }
  const player = createRadioPlayer({ audioElement: audio })
  await player.play(station)
  await player.play({ ...station, id: 'two', streamUrl: 'https://radio.org/two' })
  assert.equal(audio.paused, false)
  audio.emit('pause')
  assert.equal(player.getSnapshot().status, 'playing')
  assert.equal(player.getSnapshot().stationId, 'two')
  player.dispose()
})

test('established playback re-arms a bounded watchdog for buffering and clears on recovery', async () => {
  const callbacks = new Map(); let nextId = 0
  const audio = new FakeAudio()
  const player = createRadioPlayer({ audioElement: audio, schedule: fn => { callbacks.set(++nextId, fn); return nextId }, cancel: id => callbacks.delete(id) })
  await player.play(station)
  assert.equal(callbacks.size, 0)
  audio.emit('waiting')
  assert.equal(callbacks.size, 1)
  assert.equal(player.getSnapshot().status, 'loading')
  audio.emit('stalled')
  assert.equal(callbacks.size, 1, 'repeated buffering events must not extend the timeout')
  audio.emit('playing')
  assert.equal(callbacks.size, 0)
  assert.equal(player.getSnapshot().status, 'playing')
  audio.emit('stalled')
  assert.equal(callbacks.size, 1)
  ;[...callbacks.values()][0]()
  assert.equal(player.getSnapshot().status, 'error')
  assert.equal(audio.paused, true)
  assert.match(player.getSnapshot().errorCode, /timed out/)
  audio.emit('playing')
  assert.equal(player.getSnapshot().status, 'error', 'late events must not clear timeout errors')
  player.dispose()
})


test('URL validation rejects local aliases, single-label names and nonpublic address ranges', () => {
  for (const url of [
    'https://app.localhost/live', 'https://app.localhost./live', 'https://radio.local/live',
    'https://intranet/live', 'https://station.lan/live', 'https://radio.internal/live',
    'https://0.0.0.0/live', 'https://100.64.0.1/live', 'https://198.18.0.1/live',
    'https://192.0.2.1/live', 'https://203.0.113.1/live', 'https://224.0.0.1/live',
  ]) assert.equal(safeRadioUrl(url), '', url)
  assert.equal(safeRadioUrl('https://radio.example.org/live'), 'https://radio.example.org/live')
})

test('malformed directory entries are ignored safely', async () => {
  const { normalizeStation } = await import('./src/game/audio/catalog.js')
  for (const value of [null, undefined, 3, [], 'station']) assert.equal(normalizeStation(value), null)
})
