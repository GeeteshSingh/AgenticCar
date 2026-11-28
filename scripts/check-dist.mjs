import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import assert from 'node:assert/strict'
import { brand } from '../src/config/brand.js'

const html = readFileSync('dist/index.html', 'utf8')
assert.ok(statSync('dist/_headers').isFile())
for (const value of [`<title>${brand.name}</title>`, 'name="description"', 'property="og:title"', 'property="og:description"', 'property="og:image"', 'rel="icon"']) assert.ok(html.includes(value), `Missing ${value}`)
const assets = readdirSync('dist/assets')
for (const [label, pattern, max] of [['main', /^index-.*\.js$/, 375_000], ['free-roam', /^FreeRoamWorld-.*\.js$/, 20_000], ['marketplace', /^MarketPanel-.*\.js$/, 20_000]]) {
  const matches = assets.filter(f => pattern.test(f))
  assert.equal(matches.length, 1, `Expected one ${label} chunk`)
  const bytes = gzipSync(readFileSync(join('dist/assets', matches[0]))).length
  console.log(`${label}: ${bytes} bytes gzip (budget ${max})`)
  assert.ok(bytes <= max, `${label} exceeds budget`)
}
const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)])
const unexpectedBrand = walk('dist/brand').filter(file => !['dist/brand/logo.svg', 'dist/brand/og.png'].includes(file))
assert.deepEqual(unexpectedBrand, [], `Unexpected brand assets: ${unexpectedBrand.join(', ')}`)
for (const file of walk('dist').filter(f => /\.(?:js|html|css|map)$/.test(f))) {
  const data = readFileSync(file, 'utf8')
  for (const forbidden of [/https?:\/\/(?:localhost|127\.0\.0\.1)(?=[:/\s?#'"`]|$)/i, /\?stats\b/, /\/Users\//]) {
    assert.doesNotMatch(data, forbidden, `${file} contains a forbidden development reference`)
  }
}
