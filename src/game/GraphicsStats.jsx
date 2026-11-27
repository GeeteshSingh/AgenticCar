import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

// Previous frame's renderer counts; sampled twice per second to avoid UI churn.
export function GraphicsStats() {
  const gl = useThree(state => state.gl)
  const label = useRef(null)
  const sample = useRef({ elapsed: 0, frames: 0 })
  useEffect(() => {
    const node = document.createElement('output')
    node.setAttribute('aria-label', 'Graphics statistics')
    Object.assign(node.style, { position: 'fixed', left: '8px', bottom: '8px', zIndex: '100', padding: '6px 9px', background: '#07120eea', color: '#e5ffe9', font: '12px monospace', pointerEvents: 'none', whiteSpace: 'pre' })
    document.body.appendChild(node)
    label.current = node
    return () => { node.remove(); label.current = null }
  }, [])
  useFrame((_, delta) => {
    const state = sample.current
    state.elapsed += delta; state.frames++
    if (state.elapsed < .5) return
    if (label.current) label.current.textContent = `Frame ${(state.elapsed * 1000 / state.frames).toFixed(1)} ms\nDraw calls ${gl.info.render.calls}\nTriangles ${gl.info.render.triangles}`
    state.elapsed = 0; state.frames = 0
  })
  return null
}
