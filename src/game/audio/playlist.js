import { normalizeStation, safeRadioUrl } from './catalog.js'
export const MAX_PLAYLIST_BYTES = 512 * 1024
export function parsePlaylist(content, { baseUrl = '', name = 'Imported playlist' } = {}) {
  if (typeof content !== 'string' || new TextEncoder().encode(content).length > MAX_PLAYLIST_BYTES) throw new Error('Playlist must be text smaller than 512 KB.')
  if (/#EXT-X-/i.test(content)) throw new Error('This is an HLS media playlist. Import a station list containing the HTTPS .m3u8 address instead of media segments.')
  const stations = [], warnings = [], seen = new Set()
  let label = '', logo = '', group = '', audioOnly = false
  for (const raw of content.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) continue
    if (line.startsWith('#EXTINF:')) {
      label = line.slice(line.indexOf(',') + 1).trim()
      logo = /tvg-logo="([^"]*)"/i.exec(line)?.[1] || ''
      group = /group-title="([^"]*)"/i.exec(line)?.[1] || ''
      audioOnly = /(?:radio|audio)="true"/i.test(line) || /radio|audio|music/i.test(group)
      continue
    }
    if (line.startsWith('#')) continue
    let url
    try { url = new URL(line, baseUrl || undefined).href } catch { warnings.push('Skipped an invalid or relative URL without a base address.'); continue }
    const safe = safeRadioUrl(url)
    const path = new URL(url).pathname
    if (!safe) warnings.push('Skipped a URL that is not a public HTTPS stream or contains credentials.')
    else if (/\.(?:mp4|mkv|avi|webm|ts|m4v)(?:$)/i.test(path)) warnings.push('Skipped a video/media segment URL.')
    else if (/\.m3u8$/i.test(path) && !audioOnly) warnings.push('Skipped an HLS entry without radio="true" or an audio/radio group label; video playlists are not supported.')
    else if (/\.(?:m3u|pls|xspf)$/i.test(path)) warnings.push('Skipped a nested playlist; import resolved stream URLs.')
    else if (!seen.has(safe)) {
      seen.add(safe)
      stations.push(normalizeStation({ id: `playlist:${safe}`, name: label || `${name} ${stations.length + 1}`, streamUrl: safe, logo, tags: group, source: 'playlist' }))
      if (stations.length >= 100) { warnings.push('Imported the first 100 stations.'); break }
    }
    label = ''; logo = ''; group = ''; audioOnly = false
  }
  if (!stations.length) throw new Error(warnings[0] || 'No playable HTTPS audio streams found in this playlist.')
  return { stations, warnings: [...new Set(warnings)] }
}
