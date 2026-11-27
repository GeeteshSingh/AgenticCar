// Radio Browser adapter. Browser requests use the browser's User-Agent.
export const RADIO_MIRRORS = ['https://de1.api.radio-browser.info', 'https://nl1.api.radio-browser.info', 'https://at1.api.radio-browser.info']
export function safeRadioUrl(value) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password) return ''
    if ([...url.searchParams.keys()].some(key => /^(?:token|auth|authorization|password|pass|username|user|api[_-]?key|secret)$/i.test(key))) return ''
    const hostname = url.hostname.replace(/\.$/, '').toLowerCase()
    if (!hostname.includes('.') || /(?:^|\.)(?:localhost|local|internal|lan|home|invalid|test)$/.test(hostname) || hostname.includes(':')) return ''
    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      const [a, b, c] = hostname.split('.').map(Number)
      if (a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 168 || (b === 0 && (c === 0 || c === 2)))) ||
        (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) || (a === 203 && b === 0 && c === 113)) return ''
    }
    return url.href
  } catch { return '' }
}
const text = (v, max = 180) => typeof v === 'string' ? v.trim().slice(0, max) : ''
export function normalizeStation(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const streamUrl = safeRadioUrl(raw.url_resolved || raw.url || raw.streamUrl)
  if (!streamUrl) return null
  return {
    id: text(raw.stationuuid || raw.id || streamUrl, 600), name: text(raw.name) || 'Untitled station', streamUrl,
    codec: text(raw.codec, 20), bitrate: Math.max(0, Number(raw.bitrate) || 0), hls: raw.hls === true || raw.hls === 1 || /\.m3u8(?:\?|$)/i.test(streamUrl),
    homepage: safeRadioUrl(raw.homepage), logo: safeRadioUrl(raw.favicon || raw.logo), country: text(raw.country), countryCode: text(raw.countrycode || raw.countryCode, 2),
    state: text(raw.state), tags: text(raw.tags, 300), language: text(raw.language), online: raw.lastcheckok === undefined ? null : Number(raw.lastcheckok) === 1,
    latitude: Number.isFinite(raw.geo_lat) ? raw.geo_lat : null, longitude: Number.isFinite(raw.geo_long) ? raw.geo_long : null,
    source: raw.source === 'playlist' ? 'playlist' : 'radio-browser',
  }
}
export async function radioRequest(path, { signal, fetchImpl = fetch, mirrors = RADIO_MIRRORS } = {}) {
  let lastError
  for (const mirror of mirrors) {
    if (signal?.aborted) throw new DOMException('Search cancelled', 'AbortError')
    const controller = new AbortController()
    const abort = () => controller.abort()
    signal?.addEventListener('abort', abort, { once: true })
    const timer = setTimeout(abort, 7000)
    try {
      const response = await fetchImpl(`${mirror}${path}`, { signal: controller.signal, headers: { Accept: 'application/json' } })
      if (!response.ok) throw new Error(`Radio directory returned HTTP ${response.status}`)
      const value = await response.json()
      if (!Array.isArray(value)) throw new Error('Unexpected radio directory response')
      return value
    } catch (error) {
      if (signal?.aborted) throw new DOMException('Search cancelled', 'AbortError')
      lastError = error
    } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort) }
  }
  throw new Error(`Radio directory unavailable. Try again or import a playlist. ${lastError?.message || ''}`)
}
export async function searchStations({ query = '', countryCode = '', state = '', city = '', tag = '', language = '', limit = 50, signal, fetchImpl, mirrors } = {}) {
  const params = new URLSearchParams({ limit: String(Math.min(100, Math.max(1, limit))), hidebroken: 'true', order: 'clickcount', reverse: 'true' })
  if (query.trim()) params.set('name', query.trim().slice(0, 120))
  if (/^[a-z]{2}$/i.test(countryCode)) params.set('countrycode', countryCode.toUpperCase())
  if (state.trim()) params.set('state', state.trim().slice(0, 100))
  if (tag.trim()) params.set('tag', tag.trim().slice(0, 100))
  if (language.trim()) params.set('language', language.trim().slice(0, 100))
  const result = await radioRequest(`/json/stations/search?${params}`, { signal, fetchImpl, mirrors })
  const stations = result.slice(0, 100).map(normalizeStation).filter(Boolean)
  // Radio Browser has no city field. Match available descriptive metadata only.
  const match = city.trim().toLocaleLowerCase()
  return match ? stations.filter(s => `${s.name} ${s.state} ${s.tags}`.toLocaleLowerCase().includes(match)) : stations
}
export async function getCountries(options) {
  const rows = await radioRequest('/json/countrycodes?order=name', options)
  return rows.filter(r => /^[A-Z]{2}$/i.test(r.name)).map(r => ({ code: r.name.toUpperCase(), count: Number(r.stationcount) || 0 })).sort((a, b) => a.code.localeCompare(b.code))
}
export function recordStationClick(station, fetchImpl = fetch) {
  if (station.source !== 'radio-browser' || !/^[\da-f-]{36}$/i.test(station.id)) return Promise.resolve()
  return fetchImpl(`${RADIO_MIRRORS[0]}/json/url/${encodeURIComponent(station.id)}`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(5000) }).then(response => {
    if (!response.ok) throw new Error(`Radio click reporting HTTP ${response.status}`)
  })
}
