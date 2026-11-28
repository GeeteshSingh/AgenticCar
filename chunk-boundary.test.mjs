import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ChunkBoundary, ChunkErrorFallback } from './src/ui/common/ChunkBoundary.js'
assert.deepEqual(ChunkBoundary.getDerivedStateFromError(new Error('offline')), {failed:true})
const output = renderToStaticMarkup(createElement(ChunkErrorFallback, {onClose: () => {}}))
assert.match(output, /Could not load/)
assert.match(output, /Retry \(reload page\)/)
assert.match(output, /Close and resume/)
console.log('Chunk error fallback and retry controls passed')
