import { Html } from '@react-three/drei'
import { ChunkBoundary } from '@/ui/common/ChunkBoundary'
import { Canvas } from '@react-three/fiber'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { lazy, Suspense } from 'react'
const FreeRoamWorld = lazy(() => import('@/game/world/FreeRoamWorld').then(module => ({ default: module.FreeRoamWorld })))
import { GraphicsStats } from '@/game/GraphicsStats'
import { GameWorld } from '@/game/world/GameWorld'
import { QualitySuggestion } from '@/game/QualitySuggestion'
import { AdaptiveDpr } from '@/game/AdaptiveDpr'

// React Three Fiber host for the game scene.
// Phase 1: mounts an empty (placeholder) world with clamped pixel ratio.
// Phase 2+ will add the player vehicle, cameras, traffic, physics, and effects.
export function GameCanvas() {
  const showStats = import.meta.env.DEV && new URLSearchParams(window.location.search).has('stats')
  const quality = useSettingsStore(s => s.quality)
  const environment = useSettingsStore(s => s.environment)
  return (
    <ChunkBoundary>
    <Canvas
      onCreated={({ gl }) => { gl.domElement.tabIndex = 0; gl.domElement.setAttribute('aria-label', 'Driving view') }}
      shadows={quality === 'high'}
      dpr={quality === 'low' ? 1 : quality === 'high' ? [1, 1.75] : [1, 1.25]}
      camera={{ position: [0, 5, 12], fov: 60 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#7db8f0']} />
      <fog attach="fog" args={['#bcd4ec', 220, 640]} />
      {environment === 'thar_test' ? <Suspense fallback={<Html center><div role="status" style={{color:'white', background:'#0f172a', padding:12, whiteSpace:'nowrap'}}>Loading free roam…</div></Html>}><FreeRoamWorld /></Suspense> : <GameWorld />}
      {showStats && <GraphicsStats />}
      <QualitySuggestion />
      <AdaptiveDpr key={quality} />
    </Canvas>
    </ChunkBoundary>
  )
}

export default GameCanvas
