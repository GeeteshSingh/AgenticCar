import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Skybox } from '@/game/skycube/Skybox'
import { SunDisc } from '@/game/lights/Lighting'

// Composes the sky, sun/moon disc, and distant mountain silhouettes for
// context. Lighting/fog live in GameWorld (data-driven from ENVIRONMENT);
// this component is purely the visible backdrop. Placeholder primitive
// geometry only — no detailed scenery assets yet.
export function Environment({ env = {}, skyMatRef }) {
  const skyColor = env.skyColor ?? '#8fb8e8'
  const sunPosition = env.sunPosition ?? [40, 60, 20]
  const sunColor = env.sunColor ?? '#fde68a'
  const sunSize = env.sunSize ?? 14

  // Distant mountain ring (static, centered on the road).
  const mountains = useMemo(() => {
    const items = []
    const count = 16
    const radius = 540
    for (let i = 0; i < count; i++) {
      // irregular spacing so peaks don't look symmetrically placed
      const angle = (i / count) * Math.PI * 2 + (i % 3) * 0.07
      const x = Math.sin(angle) * radius
      const z = -Math.abs(Math.cos(angle)) * radius - 90
      const h = 55 + ((i * 37) % 70)
      const r = 42 + ((i * 53) % 40)
      items.push({ x, z, h, r, key: i })
    }
    return items
  }, [])

  // The `env` handed in is the live (mutated) reference from GameWorld's
  // cycle, so reading it each frame reflects the current interpolated state.
  const sunRef = useRef()
  useFrame(() => {
    const e = env
    if (!sunRef.current || !e) return
    sunRef.current.position.set(
      e.sunPosition[0] * 3,
      Math.max(40, e.sunPosition[1] * 2),
      e.sunPosition[2] - 200,
    )
    if (sunRef.current.material) sunRef.current.material.color.set(e.sunColor)
    // Scale disc with the configured size.
    const target = e.sunSize || 14
    const cur = sunRef.current.scale.x
    sunRef.current.scale.setScalar(cur + (target / 14 - cur) * 0.2)
  })

  return (
    <group>
      <Skybox color={skyColor} materialRef={skyMatRef} />

      {/* Visible sun/moon disc placed along the light direction */}
      <SunDisc
        ref={sunRef}
        position={[sunPosition[0] * 3, Math.max(40, sunPosition[1] * 2), sunPosition[2] - 200]}
        color={sunColor}
        size={sunSize}
      />

      {/* Distant mountain silhouettes (atmospheric, sit on the ground line) */}
      {mountains.map((m) => (
        <mesh key={m.key} position={[m.x, m.h / 2 - 1, m.z]} frustumCulled={false}>
          <coneGeometry args={[m.r, m.h, 5]} />
          <meshStandardMaterial color="#8aa35a" roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

export default Environment
