import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

test('static hosting headers retain the expected security policies', () => {
  const headers = readFileSync('public/_headers', 'utf8')
  for (const line of ['X-Content-Type-Options: nosniff', 'Referrer-Policy:', 'X-Frame-Options: DENY', 'Cross-Origin-Opener-Policy: same-origin', 'geolocation=(self)', 'camera=()', 'microphone=()', 'payment=()']) assert.ok(headers.includes(line), line)
  const policy = headers.match(/^\s*Content-Security-Policy:\s*(.+)$/mi)?.[1]
  assert.ok(policy)
  assert.doesNotMatch(headers, /Content-Security-Policy-Report-Only:/i)
  for (const directive of ["object-src 'none'", "base-uri 'self'", "frame-ancestors 'none'", "'wasm-unsafe-eval'"]) assert.ok(policy.includes(directive), directive)
  const script = policy.split(';').find(d => d.trim().startsWith('script-src '))
  assert.ok(script)
  assert.doesNotMatch(script, /'unsafe-eval'|'unsafe-inline'/)
})

test('source avoids dangerous HTML injection primitives and external scripts', () => {
  const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)])
  for (const file of walk('src').filter(f => /\.[cm]?[jt]sx?$/.test(f))) {
    assert.doesNotMatch(readFileSync(file, 'utf8'), /dangerouslySetInnerHTML|\binnerHTML\s*=|\bdocument\.write\s*\(|\beval\s*\(/, file)
  }
  assert.doesNotMatch(readFileSync('index.html', 'utf8'), /<script\b[^>]*\bsrc\s*=\s*["'](?:https?:)?\/\//i)
})
