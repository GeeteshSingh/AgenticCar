import { Canvas } from '@react-three/fiber'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { GameWorld } from '@/game/world/GameWorld'

// React Three Fiber host for the game scene.
// Phase 1: mounts an empty (placeholder) world with clamped pixel ratio.
// Phase 2+ will add the player vehicle, cameras, traffic, physics, and effects.
export function GameCanvas() {
  const quality = useSettingsStore(s => s.quality)
  return (
    <Canvas
      onCreated={({ gl }) => { gl.domElement.tabIndex = 0; gl.domElement.setAttribute('aria-label', 'Driving view') }}
      tabIndex={0}
      aria-label="Driving view"
      shadows={quality === 'high'}
      dpr={quality === 'low' ? 1 : quality === 'high' ? [1, 1.75] : [1, 1.25]}
      camera={{ position: [0, 5, 12], fov: 60 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#7db8f0']} />
      <fog attach="fog" args={['#bcd4ec', 220, 640]} />
      <GameWorld />
    </Canvas>
  )
}

export default GameCanvas
