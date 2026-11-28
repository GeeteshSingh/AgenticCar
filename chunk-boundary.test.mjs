import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ChunkBoundary, ChunkErrorFallback } from './src/ui/common/ChunkBoundary.js'
assert.deepEqual(ChunkBoundary.getDerivedStateFromError(new Error('offline')), {failed:true})
const output = renderToStaticMarkup(createElement(ChunkErrorFallback, {onClose: () => {}}))
assert.match(output, /Could not load/)
assert.match(output, /Retry \(reload page\)/)
assert.match(output, /Close and resume/)
let retries = 0, closes = 0
globalThis.window = { location: { reload: () => { retries++ } } }
const element = ChunkErrorFallback({ onClose: () => { closes++ } })
const children = element.props.children
children[1].props.onClick()
children[2].props.onClick()
assert.equal(retries, 1)
assert.equal(closes, 1)
assert.equal(ChunkErrorFallback({}).props.children[2], undefined)
console.log('Chunk error fallback and retry controls passed')
