import { Canvas } from '@react-three/fiber'
import { GameWorld } from '@/game/world/GameWorld'

// React Three Fiber host for the game scene.
// Phase 1: mounts an empty (placeholder) world with clamped pixel ratio.
// Phase 2+ will add the player vehicle, cameras, traffic, physics, and effects.
export function GameCanvas() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
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
