import { Canvas } from '@react-three/fiber'
import { GameWorld } from '@/game/world/GameWorld'
import { useGameStore } from '@/stores/useGameStore'
import { resolvePreset } from '@/game/config/graphicsConfig'

// React Three Fiber host for the game scene. Graphics quality (dpr, shadows,
// antialias, shadow resolution) is driven by the user's graphics preset and
// the runtime auto-tier. Canvas is keyed on the resolved preset so changing
// quality cleanly re-initializes the renderer with the new settings.
export function GameCanvas() {
  const graphicsQuality = useGameStore((s) => s.graphicsQuality)
  const autoTier = useGameStore((s) => s.autoTier)
  const preset = resolvePreset(graphicsQuality, autoTier)

  return (
    <Canvas
      key={graphicsQuality === 'auto' ? `auto-${autoTier}` : graphicsQuality}
      shadows={preset.shadows}
      dpr={preset.dpr}
      camera={{ position: [0, 3, 8], fov: 58 }}
      gl={{ antialias: preset.antialias }}
    >
      <color attach="background" args={['#9fc6ee']} />
      <fog attach="fog" args={['#aacbe8', 180, preset.fogFar]} />
      <GameWorld shadowMapSize={preset.shadowMapSize} />
    </Canvas>
  )
}

export default GameCanvas
