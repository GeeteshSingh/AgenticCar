import { useMemo } from 'react'
import { Skybox } from '@/game/skycube/Skybox'
import { SunDisc } from '@/game/lights/Lighting'

// Composes the sky, sun/moon disc, and distant mountain silhouettes for
// context. Lighting/fog live in GameWorld (data-driven from ENVIRONMENT);
// this component is purely the visible backdrop. Placeholder primitive
// geometry only — no detailed scenery assets yet.
export function Environment({ env = {} }) {
  const skyColor = env.skyColor ?? '#8fb8e8'
  const sunPosition = env.sunPosition ?? [40, 60, 20]
  const sunColor = env.sunColor ?? '#fde68a'
  const sunSize = env.sunSize ?? 14

  // Distant mountain ring (static, centered on the road).
  const mountains = useMemo(() => {
    const items = []
    const count = 14
    const radius = 520
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const x = Math.sin(angle) * radius
      const z = -Math.abs(Math.cos(angle)) * radius - 80
      const h = 60 + ((i * 37) % 60)
      items.push({ x, z, h, key: i })
    }
    return items
  }, [])

  return (
    <group>
      <Skybox color={skyColor} />

      {/* Visible sun/moon disc placed along the light direction */}
      <SunDisc
        position={[sunPosition[0] * 3, Math.max(40, sunPosition[1] * 2), sunPosition[2] - 200]}
        color={sunColor}
        size={sunSize}
      />

      {/* Distant mountain / hill silhouettes (lighter, blends with terrain) */}
      {mountains.map((m) => (
        <mesh key={m.key} position={[m.x, m.h / 2 - 1, m.z]} frustumCulled={false}>
          <coneGeometry args={[50, m.h, 5]} />
          <meshStandardMaterial color="#9aae5a" roughness={1} fog={false} />
        </mesh>
      ))}
    </group>
  )
}

export default Environment
