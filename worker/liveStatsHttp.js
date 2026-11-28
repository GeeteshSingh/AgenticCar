import { validSession } from './liveStatsLogic.js'

export function jsonResponse(body, status = 200, cache = 'no-store', extra = {}) {
  return Response.json(body, { status, headers: { 'Cache-Control': cache, 'X-Content-Type-Options': 'nosniff', ...extra } })
}

export async function handleApi(request, env) {
  const url = new URL(request.url), path = url.pathname
  if (!['/api/hb', '/api/start', '/api/stats'].includes(path)) return jsonResponse({ error: 'Not found' }, 404)
  const origin = request.headers.get('origin')
  if (origin && origin !== url.origin) return jsonResponse({ error: 'Forbidden' }, 403)
  const method = path === '/api/stats' ? 'GET' : 'POST'
  if (request.method !== method) return jsonResponse({ error: 'Method not allowed' }, 405, 'no-store', { Allow: method })
  if (method === 'POST') {
    if (!/^application\/json(?:\s*;|\s*$)/i.test(request.headers.get('content-type') || '')) return jsonResponse({ error: 'Expected JSON' }, 415)
    if (Number(request.headers.get('content-length')) > 200) return jsonResponse({ error: 'Body too large' }, 413)
    if (!request.body) return jsonResponse({ error: 'Invalid body' }, 400)
    const reader = request.body.getReader(), chunks = []; let length = 0
    while (true) {
      const { done, value } = await reader.read(); if (done) break
      length += value.byteLength
      if (length > 200) { await reader.cancel(); return jsonResponse({ error: 'Body too large' }, 413) }
      chunks.push(value)
    }
    const bytes = new Uint8Array(length); let offset = 0
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length }
    let body
    try { body = JSON.parse(new TextDecoder().decode(bytes)) } catch { return jsonResponse({ error: 'Invalid JSON' }, 400) }
    if (!validSession(body?.id)) return jsonResponse({ error: 'Invalid session' }, 400)
    request = new Request(request.url, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: body.id }) })
  }
  return env.LIVE_STATS.get(env.LIVE_STATS.idFromName('global')).fetch(request)
}
